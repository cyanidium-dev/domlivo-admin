/**
 * Every read-only zone check in one pass — see
 * docs/engineering/SPEC-zone-generation-2026-08-16.md §11.
 *
 * Writes nothing. Exists so "is the zone pipeline healthy" is one command
 * rather than seven remembered ones, and so the checks stay in the order the
 * pipeline depends on: identity before figures, figures before SEO, SEO before
 * landings.
 *
 * An *edited* landing is reported, not failed. ТЗ-11 requires a re-run to leave
 * hand-edited documents alone, so a diff there is the idempotency rule working.
 * Only a landing the generator cannot account for is a failure.
 *
 * Run: npm run zones:verify
 */

import fs from 'node:fs'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {parseRegistry, flattenCities, crossCheckMetricsZones} from './lib/zoneRegistry'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const token = process.env.SANITY_API_TOKEN?.trim()
if (!token || !projectId) {
  console.error('Error: SANITY_PROJECT_ID and SANITY_API_TOKEN required. Add them to .env')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  useCdn: false,
  token,
})

const DATA_DIR = path.resolve(process.cwd(), 'scripts/data')
const failures: string[] = []

function heading(text: string) {
  console.log(`\n${'─'.repeat(72)}\n${text}\n${'─'.repeat(72)}`)
}

function run(label: string, script: string, args: string[]) {
  const result = spawnSync('npx', ['tsx', script, ...args], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) failures.push(label)
}

async function main() {
  heading('1. Identity registry — zones.json against the metrics seed')
  const registry = parseRegistry(JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'zones.json'), 'utf8')))
  const metrics = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'zone-metrics-seed.json'), 'utf8'))
  const datasetSlugs: string[] = await client.fetch(
    `*[_type in ["city", "district"] && defined(slug.current)].slug.current`,
  )
  const orphans = crossCheckMetricsZones(
    registry,
    metrics.records.map((r: {zone: string}) => r.zone),
    datasetSlugs,
  )
  if (orphans.length) {
    console.log(`✗ ${orphans.length} metrics zone(s) declared nowhere: ${orphans.join(', ')}`)
    failures.push('registry cross-check')
  } else {
    console.log(`✓ all ${metrics.records.length} metrics records resolve to a declared or existing zone`)
  }

  heading('2. District landings')
  const cities = flattenCities(registry).map((c) => c.slug)
  for (const city of cities) {
    // A city with no published districts is not a failure — Ksamil and Golem
    // are cities in the KB whose districts are not built yet.
    const count: number = await client.fetch(
      `count(*[_type == "district" && city->slug.current == $city && isPublished == true])`,
      {city},
    )
    if (count === 0) {
      console.log(`\n— ${city}: no published districts, skipped`)
      continue
    }
    console.log(`\n— ${city}`)
    run(`district landings (${city})`, 'scripts/generateDistrictLandings.ts', ['--city', city, '--verify'])
  }

  heading('3. City landings')
  run('city landings', 'scripts/generateCityLandings.ts', ['--verify'])

  heading('4. Locale coverage')
  run('locale coverage', 'scripts/auditZoneLocalization.ts', [])

  heading('5. Publish readiness')
  run('readiness', 'scripts/auditZoneReadiness.ts', [])

  heading('Summary')
  if (failures.length === 0) {
    console.log('✓ every zone check passed')
    return
  }
  console.log(`✗ ${failures.length} check(s) failed: ${failures.join(', ')}`)
  process.exitCode = 1
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
