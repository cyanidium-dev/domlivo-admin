/**
 * Create the city and district documents declared in scripts/data/zones.json —
 * see docs/engineering/SPEC-zone-generation-2026-08-16.md §5.
 *
 * Replaces `createTiranaDistrictShells.ts`, which carried its city id and its
 * twelve-zone list as TypeScript literals, so a second city meant editing
 * source. Everything downstream of the zone document (landings, SEO, metrics,
 * catalog SEO, the localisation audit) was already city-agnostic; this was the
 * one step that was not.
 *
 * Identity fields only — title × 5 locales, slug, parent reference, order — and
 * **unpublished**. Hero images, descriptions and SEO copy come later, and
 * publication is gated by `npm run audit:zone-readiness`. A shell exists so
 * `zoneMetrics` has a zone to attach to.
 *
 * Run:
 * - npm run create:zone-shells -- --dry
 * - npm run create:zone-shells -- --city durres --dry
 * - npm run create:zone-shells -- --city durres --execute
 */

import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {
  parseRegistry,
  flattenCities,
  flattenDistricts,
  roleOf,
  type FlatCity,
  type FlatDistrict,
} from './lib/zoneRegistry'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const apiVersion = (process.env.SANITY_API_VERSION || '2024-01-01').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const args = process.argv.slice(2)
const cityArg =
  args.find((a) => a.startsWith('--city='))?.split('=')[1] ??
  (args.includes('--city') ? args[args.indexOf('--city') + 1] : '')
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')

if (!token || !projectId) {
  console.error('Error: SANITY_PROJECT_ID and SANITY_API_TOKEN required. Add them to .env')
  process.exit(1)
}
if (!isDry && !isExecute) {
  console.error('Use --dry to preview or --execute to write.')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion, useCdn: false, token})
const REGISTRY_PATH = path.resolve(process.cwd(), 'scripts/data/zones.json')

async function main() {
  const registry = parseRegistry(JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8')))

  let cities: FlatCity[] = flattenCities(registry)
  let districts: FlatDistrict[] = flattenDistricts(registry)
  if (cityArg) {
    if (!cities.some((c) => c.slug === cityArg)) {
      console.error(`Error: city "${cityArg}" is not declared in zones.json.`)
      process.exit(1)
    }
    cities = cities.filter((c) => c.slug === cityArg)
    districts = districts.filter((d) => d.citySlug === cityArg)
  }

  // Resolve every parent up front, so an unknown country is reported before
  // anything is written rather than halfway through. Countries are looked up by
  // slug, never by a constructed id — the one country document in this dataset
  // has a UUID id, not `country-albania`.
  const countrySlugs = [...new Set(cities.map((c) => c.countrySlug))]
  const countryRows: {_id: string; slug: string}[] = await client.fetch(
    `*[_type == "country" && slug.current in $slugs]{_id, "slug": slug.current}`,
    {slugs: countrySlugs},
  )
  const countryBySlug = new Map(countryRows.map((c) => [c.slug, c._id]))
  const missingCountries = countrySlugs.filter((s) => !countryBySlug.has(s))
  if (missingCountries.length) {
    console.error(`Error: no country document for ${missingCountries.join(', ')}.`)
    console.error('Create the country first — a city without one cannot produce a URL.')
    process.exit(1)
  }

  const existingCities: {_id: string; slug: string}[] = await client.fetch(
    `*[_type == "city" && defined(slug.current)]{_id, "slug": slug.current}`,
  )
  const cityIdBySlug = new Map(existingCities.map((c) => [c.slug, c._id]))
  const existingDistrictSlugs = new Set<string>(
    await client.fetch(`*[_type == "district" && defined(slug.current)].slug.current`),
  )

  const cityDocs: Record<string, unknown>[] = []
  const districtDocs: Record<string, unknown>[] = []
  const skippedCities: string[] = []
  const skippedDistricts: string[] = []

  for (const city of cities) {
    if (cityIdBySlug.has(city.slug)) {
      skippedCities.push(city.slug)
      continue
    }
    const id = `city-${city.slug}`
    cityDocs.push({
      _id: id,
      _type: 'city',
      title: city.title,
      slug: {_type: 'slug', current: city.slug},
      country: {_type: 'reference', _ref: countryBySlug.get(city.countrySlug)},
      ...(city.vibe ? {vibe: city.vibe} : {}),
      isPublished: false,
    })
    // A district created in the same run must be able to reference it.
    cityIdBySlug.set(city.slug, id)
  }

  // `order` continues each city's existing sequence rather than restarting.
  const maxOrderByCity = new Map<string, number>()
  for (const city of cities) {
    const max: number | null = await client.fetch(
      `math::max(*[_type == "district" && city->slug.current == $city].order)`,
      {city: city.slug},
    )
    maxOrderByCity.set(city.slug, max ?? 0)
  }

  for (const district of districts) {
    if (existingDistrictSlugs.has(district.slug)) {
      skippedDistricts.push(district.slug)
      continue
    }
    const cityId = cityIdBySlug.get(district.citySlug)
    if (!cityId) {
      console.error(`Error: district "${district.slug}" has no city "${district.citySlug}".`)
      process.exit(1)
    }
    const next = (maxOrderByCity.get(district.citySlug) ?? 0) + 1
    maxOrderByCity.set(district.citySlug, next)
    districtDocs.push({
      _id: `district-${district.slug}`,
      _type: 'district',
      title: district.title,
      slug: {_type: 'slug', current: district.slug},
      city: {_type: 'reference', _ref: cityId},
      order: next,
      isPublished: false,
    })
  }

  for (const s of skippedCities) console.log(`skip     city ${s} (already exists)`)
  for (const s of skippedDistricts) console.log(`skip     ${s} (already exists)`)
  for (const d of cityDocs) console.log(`create   city ${(d.slug as {current: string}).current}  (unpublished)`)
  for (const d of districtDocs) {
    const slug = (d.slug as {current: string}).current
    const entry = districts.find((x) => x.slug === slug)!
    const role = roleOf(entry)
    console.log(
      `create   ${slug}  order=${d.order}  (unpublished${role === 'metric-only' ? ', metric-only — never publish' : ''})`,
    )
  }

  const total = cityDocs.length + districtDocs.length
  if (total === 0) {
    console.log('\nNothing to create.')
    return
  }
  if (isDry) {
    console.log(
      `\nDry run. ${cityDocs.length} cities and ${districtDocs.length} districts would be created; ` +
        `${skippedCities.length + skippedDistricts.length} skipped.`,
    )
    return
  }

  // `create`, never `createOrReplace`: a document that already carries editorial
  // copy must never be flattened back to a shell by a re-run. Cities first, so a
  // district's reference resolves within the same transaction.
  const tx = [...cityDocs, ...districtDocs].reduce(
    (t, doc) => t.create(doc as never),
    client.transaction(),
  )
  await tx.commit()
  console.log(
    `\nCreated ${cityDocs.length} cities and ${districtDocs.length} districts, ` +
      `skipped ${skippedCities.length + skippedDistricts.length}.`,
  )
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
