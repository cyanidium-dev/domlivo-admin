/**
 * The publish gate for cities and districts — see
 * docs/engineering/SPEC-zone-generation-2026-08-16.md §8.
 *
 * Publication used to be a judgment call made per batch. The twelve Tirana
 * districts written on 2026-08-15 were gated on `length(description.en) > 200`
 * so no shell could slip out empty; that precaution deserves to be a script
 * rather than something someone remembers.
 *
 * Reports every zone against five checks and, with `--promote`, publishes the
 * ones that pass all of them. Without `--promote` it writes nothing.
 *
 * Run:
 * - npm run audit:zone-readiness
 * - npm run audit:zone-readiness -- --city durres
 * - npm run audit:zone-readiness -- --city durres --promote
 */

import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {parseRegistry, flattenDistricts, roleOf, LOCALES} from './lib/zoneRegistry'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const apiVersion = (process.env.SANITY_API_VERSION || '2024-01-01').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const args = process.argv.slice(2)
const cityArg =
  args.find((a) => a.startsWith('--city='))?.split('=')[1] ??
  (args.includes('--city') ? args[args.indexOf('--city') + 1] : '')
const isPromote = args.includes('--promote')

if (!token || !projectId) {
  console.error('Error: SANITY_PROJECT_ID and SANITY_API_TOKEN required. Add them to .env')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion, useCdn: false, token})
const REGISTRY_PATH = path.resolve(process.cwd(), 'scripts/data/zones.json')

/** Below this an "About" section reads as a stub; it is the gate the twelve used. */
const MIN_DESCRIPTION = 200

type ZoneRow = {
  _id: string
  _type: 'city' | 'district'
  slug: string
  citySlug?: string
  title?: Record<string, string>
  isPublished?: boolean
  descLen: number
  hasHero: boolean
  galleryCount: number
  metricsCount: number
  landingId?: string | null
}

type Check = {name: string; ok: boolean; detail: string}

function checksFor(z: ZoneRow): Check[] {
  const missingLocales = LOCALES.filter((l) => !z.title?.[l]?.trim())
  return [
    {
      name: 'locales',
      ok: missingLocales.length === 0,
      detail: missingLocales.length ? `title missing ${missingLocales.join(',')}` : 'title ×5',
    },
    {
      name: 'description',
      ok: z.descLen >= MIN_DESCRIPTION,
      detail: `description.en ${z.descLen}/${MIN_DESCRIPTION}`,
    },
    {name: 'hero', ok: z.hasHero, detail: z.hasHero ? 'hero image' : 'no hero image'},
    // Studio reports this as a warning now, so the gate is the only thing
    // enforcing it — see SPEC §10.3.
    {
      name: 'gallery',
      ok: z.galleryCount > 0,
      detail: z.galleryCount > 0 ? `gallery ${z.galleryCount}` : 'no gallery image',
    },
    {
      name: 'metrics',
      ok: z.metricsCount > 0,
      detail: z.metricsCount > 0 ? `${z.metricsCount} metrics` : 'no zoneMetrics record',
    },
    {
      name: 'landing',
      ok: Boolean(z.landingId),
      detail: z.landingId ? 'landing' : 'no landing (flat fallback)',
    },
  ]
}

const PROJECTION = `{
  _id, _type,
  "slug": slug.current,
  "citySlug": select(_type == "district" => city->slug.current, slug.current),
  title, isPublished,
  "descLen": length(coalesce(description.en, "")),
  "hasHero": defined(heroImage.asset),
  "galleryCount": count(coalesce(gallery, [])),
  "metricsCount": count(*[_type == "zoneMetrics" && zone._ref == ^._id]),
  "landingId": select(
    _type == "district" => *[_type == "landingPage" && linkedDistrict._ref == ^._id][0]._id,
    *[_type == "landingPage" && linkedCity._ref == ^._id][0]._id
  )
}`

async function main() {
  const registry = parseRegistry(JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8')))
  const metricOnly = new Set(
    flattenDistricts(registry)
      .filter((d) => roleOf(d) === 'metric-only')
      .map((d) => d.slug),
  )

  const filter = cityArg
    ? `&& (_type == "city" && slug.current == $city || _type == "district" && city->slug.current == $city)`
    : ''
  const zones: ZoneRow[] = await client.fetch(
    `*[_type in ["city", "district"] && defined(slug.current) ${filter}] ${PROJECTION} | order(citySlug asc, _type desc, slug asc)`,
    {city: cityArg},
  )

  if (zones.length === 0) {
    console.error(cityArg ? `No zones found for city "${cityArg}".` : 'No zones found.')
    process.exit(1)
  }

  const ready: ZoneRow[] = []
  const blocked: {zone: ZoneRow; failed: Check[]}[] = []
  const published: ZoneRow[] = []
  const skipped: ZoneRow[] = []

  for (const z of zones) {
    if (metricOnly.has(z.slug)) {
      skipped.push(z)
      continue
    }
    const failed = checksFor(z).filter((c) => !c.ok)
    if (z.isPublished !== false) {
      published.push(z)
      if (failed.length) {
        console.log(`⚠ live    ${z.slug.padEnd(22)} published but ${failed.map((f) => f.detail).join('; ')}`)
      }
      continue
    }
    if (failed.length === 0) ready.push(z)
    else blocked.push({zone: z, failed})
  }

  for (const z of skipped) {
    console.log(`metric   ${z.slug.padEnd(22)} metric-only — never published by design`)
  }
  for (const {zone, failed} of blocked) {
    console.log(`blocked  ${zone.slug.padEnd(22)} ${failed.map((f) => f.detail).join('; ')}`)
  }
  for (const z of ready) {
    console.log(`ready    ${z.slug.padEnd(22)} passes all six checks`)
  }

  console.log(
    `\n${published.length} published, ${ready.length} ready to publish, ` +
      `${blocked.length} blocked, ${skipped.length} metric-only.`,
  )

  if (!isPromote) {
    if (ready.length) console.log('Pass --promote to publish the ready ones.')
    return
  }
  if (ready.length === 0) {
    console.log('Nothing to promote.')
    // A --promote run that finds nothing ready *and* nothing already published
    // means the pipeline was run out of order.
    if (published.length === 0) process.exitCode = 1
    return
  }

  const tx = ready.reduce(
    (t, z) => t.patch(z._id, (p) => p.set({isPublished: true})),
    client.transaction(),
  )
  await tx.commit()
  console.log(`\nPublished ${ready.length}: ${ready.map((z) => z.slug).join(', ')}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
