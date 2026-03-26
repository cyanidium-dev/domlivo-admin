/**
 * Historical: populate property.amenitiesRefs from legacy inline `amenities[]` (removed from schema).
 *
 * Use only if documents still contain the old `amenities` field in raw JSON. Current Studio schema
 * uses `amenitiesRefs` → global `amenity` only.
 *
 * - Rebuilds amenitiesRefs from inline rows (replaces previous refs).
 * - Properties with no inline amenities get amenitiesRefs cleared ([]).
 * - Reports matched vs unmatched per inline item.
 *
 * Run:
 *   npx tsx scripts/migrate-amenities-refs-from-inline.ts --dry-run
 *   npx tsx scripts/migrate-amenities-refs-from-inline.ts --execute
 *   npx tsx scripts/migrate-amenities-refs-from-inline.ts --execute --limit=50
 *
 * Requires: SANITY_API_TOKEN in .env
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {addKeysToArrayItems} from './lib/addKeysToArrayItems'
import {
  buildLookupMapsFromAmenityDocs,
  resolveAmenityIdForInline,
  type AmenityDocMinimal,
  type InlineAmenityRow,
  type Localized,
} from './lib/amenityInlineResolve'

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

async function main() {
  const amenities = await client.fetch<AmenityDocMinimal[]>(
    `*[_type == "amenity"]{ _id, title, slug }`,
  )

  const {slugByCurrent, idByNormalizedTitle} = buildLookupMapsFromAmenityDocs(amenities)

  let props = await client.fetch<{_id: string; amenities?: InlineAmenityRow[] | null}[]>(
    `*[_type == "property"]{ _id, amenities }`,
  )
  if (limit > 0) props = props.slice(0, limit)

  console.log(`Mode: ${isDry ? 'DRY-RUN' : 'EXECUTE'}`)
  console.log(`Global amenity documents: ${amenities.length}`)
  console.log(`Property documents to sync: ${props.length}`)
  console.log('')

  let totalInline = 0
  let inlineResolved = 0
  let inlineUnmatched = 0
  let duplicateRefSkips = 0
  const unmatchedSamples: string[] = []

  const tx = client.transaction()

  for (const p of props) {
    const list = Array.isArray(p.amenities) && p.amenities.length > 0 ? p.amenities : []
    const seenIds = new Set<string>()
    const refs: {_type: 'reference'; _ref: string}[] = []

    if (list.length === 0) {
      if (!isDry) {
        tx.patch(p._id, (patch) => patch.set({amenitiesRefs: []}))
      }
      continue
    }

    for (const row of list) {
      totalInline++
      const {id, reason} = resolveAmenityIdForInline(row, slugByCurrent, idByNormalizedTitle)
      if (id) {
        inlineResolved++
        if (!seenIds.has(id)) {
          seenIds.add(id)
          refs.push({_type: 'reference', _ref: id})
        } else {
          duplicateRefSkips++
        }
        if (isDry && process.env.DEBUG_AMENITIES_REF) {
          const t = row.title as Localized | undefined
          const line = String(t?.en ?? t?.sq ?? '').trim()
          console.log(`  ${p._id} item ${line} -> ${id} (${reason})`)
        }
      } else {
        inlineUnmatched++
        const t = row.title as Localized | undefined
        const line = String(t?.en ?? t?.sq ?? '').trim()
        const msg = `property=${p._id} title="${line}" iconKey=${row.iconKey ?? '-'} (${reason})`
        if (unmatchedSamples.length < 40) unmatchedSamples.push(msg)
      }
    }

    const refsWithKeys = addKeysToArrayItems(refs) as typeof refs & {_key?: string}[]

    if (!isDry) {
      tx.patch(p._id, (patch) => patch.set({amenitiesRefs: refsWithKeys}))
    }
  }

  console.log('--- Summary ---')
  console.log(`Inline amenity rows scanned: ${totalInline}`)
  console.log(`Inline rows resolved to an amenity id: ${inlineResolved}`)
  console.log(`Duplicate refs skipped (same amenity twice on one property): ${duplicateRefSkips}`)
  console.log(`Inline rows unmatched: ${inlineUnmatched}`)
  if (unmatchedSamples.length) {
    console.log('\nSample unmatched (up to 40):')
    for (const u of unmatchedSamples) console.log(`  ${u}`)
  }

  if (!isDry && props.length > 0) {
    await tx.commit()
    console.log(`\nUpdated ${props.length} property documents.`)
  } else if (isDry) {
    console.log('\nDry-run: no writes. Use --execute to apply.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
