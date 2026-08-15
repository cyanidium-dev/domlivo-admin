/**
 * Seed `zoneMetrics` from scripts/data/zone-metrics-seed.json — see
 * docs/engineering/PLAN-zone-metrics-2026-08-15.md Task 4.
 *
 * Idempotent: the document id is derived from zone slug + period, so a re-run
 * updates the record instead of creating a second one. The transform lives in
 * scripts/lib/zoneMetricsSeed.ts and is unit-tested.
 *
 * Run:
 * - npm run seed:zone-metrics -- --dry
 * - npm run seed:zone-metrics -- --execute
 */

import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {buildZoneMetricsDoc, assertRangesOrdered, type SeedFile} from './lib/zoneMetricsSeed'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const apiVersion = (process.env.SANITY_API_VERSION || '2024-01-01').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const isDry = process.argv.includes('--dry')
const isExecute = process.argv.includes('--execute')

if (!token || !projectId) {
  console.error('Error: SANITY_PROJECT_ID and SANITY_API_TOKEN required. Add them to .env')
  process.exit(1)
}
if (!isDry && !isExecute) {
  console.error('Use --dry to preview or --execute to write.')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion, useCdn: false, token})

const SEED_PATH = path.resolve(process.cwd(), 'scripts/data/zone-metrics-seed.json')

async function main() {
  const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8')) as SeedFile

  // Resolve every zone slug up front so an unknown slug is reported loudly
  // before anything is written, not skipped quietly halfway through.
  const districts = await client.fetch<{_id: string; slug: string}[]>(
    `*[_type == "district" && defined(slug.current)]{_id, "slug": slug.current}`,
  )
  const cities = await client.fetch<{_id: string; slug: string}[]>(
    `*[_type == "city" && defined(slug.current)]{_id, "slug": slug.current}`,
  )
  const districtBySlug = new Map(districts.map((d) => [d.slug, d._id]))
  const cityBySlug = new Map(cities.map((c) => [c.slug, c._id]))

  const docs: Record<string, unknown>[] = []
  const unresolved: string[] = []

  for (const record of seed.records) {
    assertRangesOrdered(record)
    const wantsCity = record.zoneType === 'city'
    const zoneId = wantsCity
      ? cityBySlug.get(record.zone)
      : districtBySlug.get(record.zone) ?? cityBySlug.get(record.zone)

    if (!zoneId) {
      unresolved.push(`${record.zone}${wantsCity ? ' (city)' : ''}`)
      continue
    }
    docs.push(buildZoneMetricsDoc(record, zoneId, seed))
  }

  if (unresolved.length) {
    console.error(`\nUnresolved zone slugs (${unresolved.length}): ${unresolved.join(', ')}`)
    console.error('Fix the seed file or create the zone documents. Nothing written.')
    process.exit(1)
  }

  const existing = new Set(
    await client.fetch<string[]>(`*[_type == "zoneMetrics"]._id`),
  )
  const created = docs.filter((d) => !existing.has(d._id as string))
  const updated = docs.filter((d) => existing.has(d._id as string))

  for (const d of docs) {
    const verb = existing.has(d._id as string) ? 'update' : 'create'
    console.log(`${verb.padEnd(7)} ${d._id}`)
  }

  if (isDry) {
    console.log(`\nDry run. ${created.length} to create, ${updated.length} to update.`)
    return
  }

  const tx = docs.reduce((t, d) => t.createOrReplace(d as never), client.transaction())
  await tx.commit()
  console.log(`\nCreated ${created.length}, updated ${updated.length}. Total ${docs.length}.`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
