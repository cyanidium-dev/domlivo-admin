/**
 * Remove legacy inline `amenities` from property documents (raw JSON cleanup).
 *
 * Does NOT modify `amenitiesRefs`, `propertyOffers`, or any other fields.
 *
 * Safety rule (all must be satisfied before unsetting `amenities`):
 * - Either `amenitiesRefs` has at least one valid reference, OR legacy `amenities` is an empty array.
 * - If legacy `amenities` has one or more items but `amenitiesRefs` is empty/missing → SKIP (would lose
 *   data; fix refs first via migrate-amenities-refs-from-inline or manual editing).
 * - If legacy `amenities` is not an array → SKIP (unexpected shape; manual review).
 *
 * Run:
 *   npx tsx scripts/remove-legacy-inline-amenities.ts --dry-run
 *   npx tsx scripts/remove-legacy-inline-amenities.ts --execute
 *   npx tsx scripts/remove-legacy-inline-amenities.ts --dry-run --limit=20
 *
 * Requires: SANITY_API_TOKEN in .env
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const isDry = process.argv.includes('--dry-run')
const isExecute = process.argv.includes('--execute')
const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1] || '0', 10) : 0

if (!token) {
  console.error('Error: SANITY_API_TOKEN required. Add to .env')
  process.exit(1)
}
if (!isDry && !isExecute) {
  console.error('Use --dry-run or --execute')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
})

function countValidRefs(amenitiesRefs: unknown): number {
  if (!Array.isArray(amenitiesRefs)) return 0
  let n = 0
  for (const r of amenitiesRefs) {
    if (r && typeof r === 'object' && !Array.isArray(r)) {
      const ref = (r as {_ref?: string})._ref
      if (typeof ref === 'string' && ref.trim()) n++
    }
  }
  return n
}

function legacyAmenitiesInfo(amenities: unknown): {count: number; isArray: boolean} {
  if (amenities == null) return {count: 0, isArray: false}
  if (Array.isArray(amenities)) return {count: amenities.length, isArray: true}
  return {count: 1, isArray: false}
}

type Row = {
  _id: string
  slug?: string | null
  amenities?: unknown
  amenitiesRefs?: unknown
}

function decide(row: Row): {safe: boolean; reason: string} {
  const refs = countValidRefs(row.amenitiesRefs)
  const {count: legacyCount, isArray} = legacyAmenitiesInfo(row.amenities)

  if (!isArray) {
    return {
      safe: false,
      reason: 'legacy amenities is not an array (unexpected shape)',
    }
  }

  if (legacyCount === 0) {
    return {safe: true, reason: 'empty legacy array (safe to unset field)'}
  }

  if (refs >= 1) {
    return {safe: true, reason: `amenitiesRefs has ${refs} ref(s); legacy inline can be removed`}
  }

  return {
    safe: false,
    reason: `legacy has ${legacyCount} item(s) but amenitiesRefs is empty — would lose data`,
  }
}

async function main() {
  const totalProperties = await client.fetch<number>(`count(*[_type == "property"])`)

  let rows = await client.fetch<Row[]>(
    `*[_type == "property" && defined(amenities)] | order(_id asc) {
      _id,
      "slug": slug.current,
      amenities,
      amenitiesRefs
    }`,
  )

  if (limit > 0) rows = rows.slice(0, limit)

  console.log(`Mode: ${isDry ? 'DRY-RUN' : 'EXECUTE'}${limit > 0 ? ` (limit=${limit})` : ''}`)
  console.log(`Project: ${projectId}  Dataset: ${dataset}`)
  console.log('')
  console.log(`Total property documents (dataset): ${totalProperties}`)
  console.log(`Properties with defined(amenities) field: ${rows.length}`)
  console.log('')

  const safeIds: string[] = []
  const skipped: {id: string; slug?: string | null; reason: string}[] = []

  for (const row of rows) {
    const {safe, reason} = decide(row)
    if (safe) {
      safeIds.push(row._id)
    } else {
      skipped.push({id: row._id, slug: row.slug, reason})
    }
  }

  console.log('--- Summary ---')
  console.log(`Docs with legacy amenities field (in scan set): ${rows.length}`)
  console.log(`Safe to clean (would unset amenities): ${safeIds.length}`)
  console.log(`Skipped (unsafe): ${skipped.length}`)

  if (skipped.length) {
    console.log('')
    console.log('--- Skipped examples (up to 25) ---')
    for (const s of skipped.slice(0, 25)) {
      const slug = s.slug ? ` slug=${s.slug}` : ''
      console.log(`  ${s.id}${slug}`)
      console.log(`    ${s.reason}`)
    }
    if (skipped.length > 25) console.log(`  ... and ${skipped.length - 25} more`)
  }

  if (isDry) {
    if (safeIds.length) {
      console.log('')
      console.log('Would unset `amenities` on (up to 15 ids):')
      for (const id of safeIds.slice(0, 15)) console.log(`  ${id}`)
      if (safeIds.length > 15) console.log(`  ... +${safeIds.length - 15} more`)
    }
    console.log('')
    console.log('Dry-run: no writes. Use --execute to apply.')
    return
  }

  if (safeIds.length === 0) {
    console.log('')
    console.log('Nothing to update.')
    return
  }

  const tx = client.transaction()
  for (const id of safeIds) {
    tx.patch(id, (p) => p.unset(['amenities']))
  }
  await tx.commit()

  console.log('')
  console.log(`Updated ${safeIds.length} document(s): unset field "amenities" only.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
