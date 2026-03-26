/**
 * Historical: backfill global `amenity` docs from legacy inline `property.amenities[]` (field removed
 * from schema). Requires documents that still carry the old array in dataset JSON.
 *
 * - Does NOT modify property documents (only patches `amenity` docs).
 * - Default: fills only missing fields on each amenity doc.
 * - --force: overwrites existing fields with aggregated values (use with care).
 *
 * Run:
 *   npx tsx scripts/backfill-amenity-display-from-inline.ts --dry-run
 *   npx tsx scripts/backfill-amenity-display-from-inline.ts --execute
 *   npx tsx scripts/backfill-amenity-display-from-inline.ts --execute --force
 *
 * Requires: SANITY_API_TOKEN in .env
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {
  buildLookupMapsFromAmenityDocs,
  resolveAmenityIdForInline,
  type AmenityDocMinimal,
  type InlineAmenityRow,
  type Localized,
  firstTitleLine,
} from './lib/amenityInlineResolve'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const isDry = process.argv.includes('--dry-run')
const isExecute = process.argv.includes('--execute')
const isForce = process.argv.includes('--force')

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

const LOCALES = ['en', 'uk', 'ru', 'sq', 'it'] as const

function normalizeDescForCompare(d: Localized | undefined): Record<string, string> {
  const o: Record<string, string> = {}
  for (const l of LOCALES) {
    const v = d?.[l]
    o[l] = typeof v === 'string' ? v.trim() : ''
  }
  return o
}

function hasAnyDescription(d: Localized | undefined): boolean {
  if (!d || typeof d !== 'object') return false
  return LOCALES.some((l) => String(d[l] ?? '').trim().length > 0)
}

function isDescriptionEmpty(d: Localized | undefined): boolean {
  return !hasAnyDescription(d)
}

function assetRef(img: unknown): string | null {
  if (!img || typeof img !== 'object') return null
  const a = (img as {asset?: {_ref?: string}}).asset
  return typeof a?._ref === 'string' ? a._ref : null
}

type Contribution = {propertyId: string; row: InlineAmenityRow}

function pickIconKeyDeterministic(rows: InlineAmenityRow[]): {
  value: string | null
  multiDistinct: boolean
  maxCountTie: boolean
} {
  const keys = rows
    .map((r) => (r.iconKey && String(r.iconKey).trim() ? String(r.iconKey).trim() : ''))
    .filter(Boolean)
  if (keys.length === 0) return {value: null, multiDistinct: false, maxCountTie: false}
  const counts = new Map<string, number>()
  for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1)
  const max = Math.max(...counts.values())
  const leaders = [...counts.keys()].filter((k) => counts.get(k) === max).sort()
  const value = leaders[0] ?? null
  const multiDistinct = new Set(keys).size > 1
  const maxCountTie = leaders.length > 1
  return {value, multiDistinct, maxCountTie}
}

function aggregateDescription(contribs: Contribution[]): {value: Localized | null; conflict: boolean} {
  const withDesc = contribs.filter((c) => hasAnyDescription(c.row.description))
  if (withDesc.length === 0) return {value: null, conflict: false}
  const sorted = [...withDesc].sort((a, b) => a.propertyId.localeCompare(b.propertyId))
  const first = sorted[0]!
  const firstNorm = JSON.stringify(normalizeDescForCompare(first.row.description))
  const allSame = sorted.every(
    (c) => JSON.stringify(normalizeDescForCompare(c.row.description)) === firstNorm,
  )
  return {value: first.row.description as Localized, conflict: !allSame}
}

function pickCustomIcon(contribs: Contribution[]): {value: unknown | null; conflict: boolean} {
  const refs = new Set<string>()
  let oneSample: unknown = null
  for (const c of contribs) {
    const ref = assetRef(c.row.customIcon)
    if (ref) {
      refs.add(ref)
      if (oneSample == null) oneSample = c.row.customIcon
    }
  }
  if (refs.size === 0) return {value: null, conflict: false}
  if (refs.size === 1) return {value: oneSample, conflict: false}
  return {value: null, conflict: true}
}

function iconKeyMissing(doc: {iconKey?: string}): boolean {
  return doc.iconKey == null || String(doc.iconKey).trim() === ''
}

async function main() {
  const amenityDocs = await client.fetch<
    {
      _id: string
      title?: Localized
      slug?: {current?: string}
      description?: Localized
      iconKey?: string
      customIcon?: unknown
    }[]
  >(`*[_type == "amenity"]{ _id, title, slug, description, iconKey, customIcon }`)

  const minimal: AmenityDocMinimal[] = amenityDocs.map((d) => ({
    _id: d._id,
    title: d.title,
    slug: d.slug,
  }))
  const {slugByCurrent, idByNormalizedTitle} = buildLookupMapsFromAmenityDocs(minimal)

  const props = await client.fetch<{_id: string; amenities?: InlineAmenityRow[] | null}[]>(
    `*[_type == "property" && defined(amenities) && length(amenities) > 0]{ _id, amenities }`,
  )

  const byAmenity = new Map<string, Contribution[]>()
  for (const p of props) {
    const list = p.amenities ?? []
    for (const row of list) {
      const {id} = resolveAmenityIdForInline(row, slugByCurrent, idByNormalizedTitle)
      if (!id) continue
      if (!byAmenity.has(id)) byAmenity.set(id, [])
      byAmenity.get(id)!.push({propertyId: p._id, row})
    }
  }

  const noInlineContributions = amenityDocs.filter((d) => (byAmenity.get(d._id) ?? []).length === 0)
    .length

  console.log(`Mode: ${isDry ? 'DRY-RUN' : 'EXECUTE'}${isForce ? ' (FORCE overwrite)' : ' (fill missing only)'}`)
  console.log(`Amenity documents scanned: ${amenityDocs.length}`)
  console.log(`Properties with inline amenities: ${props.length}`)
  console.log(`Amenity ids with ≥1 contributing inline row: ${byAmenity.size}`)
  console.log(`Amenity docs with no matching inline rows (by resolver): ${noInlineContributions}`)
  console.log('')

  let setDesc = 0
  let setIcon = 0
  let setCustom = 0
  let patchesApplied = 0
  const descSkippedConflict: string[] = []
  const iconNotes: string[] = []
  const customConflicts: string[] = []

  const tx = client.transaction()

  for (const doc of amenityDocs) {
    const contribs = byAmenity.get(doc._id) ?? []
    if (contribs.length === 0) continue

    const patch: Record<string, unknown> = {}

    // --- description ---
    const needDesc = isDescriptionEmpty(doc.description) || isForce
    if (needDesc) {
      const {value, conflict} = aggregateDescription(contribs)
      if (value) {
        if (conflict && !isForce) {
          descSkippedConflict.push(
            `${doc._id} "${firstTitleLine(doc.title)}": differing descriptions — skipped (use --force to apply first by property _id order)`,
          )
        } else if (!conflict || isForce) {
          if (isDescriptionEmpty(doc.description) || isForce) {
            patch.description = value
          }
        }
      }
    }

    // --- iconKey ---
    const needIcon = iconKeyMissing(doc) || isForce
    if (needIcon) {
      const {value, multiDistinct, maxCountTie} = pickIconKeyDeterministic(contribs.map((c) => c.row))
      if (value && (iconKeyMissing(doc) || isForce)) {
        patch.iconKey = value
        if (multiDistinct || maxCountTie) {
          iconNotes.push(
            `${doc._id} "${firstTitleLine(doc.title)}": iconKey — ${multiDistinct ? 'multiple distinct keys in data' : 'tie for max count'}; picked "${value}" (majority + lexicographic tie-break)`,
          )
        }
      }
    }

    // --- customIcon ---
    const needCustom = !assetRef(doc.customIcon) || isForce
    if (needCustom) {
      const {value, conflict} = pickCustomIcon(contribs)
      if (value && !conflict) {
        if (!assetRef(doc.customIcon) || isForce) {
          patch.customIcon = value
        }
      } else if (conflict) {
        customConflicts.push(
          `${doc._id} "${firstTitleLine(doc.title)}": multiple different customIcon assets — skipped`,
        )
      }
    }

    if (Object.keys(patch).length === 0) continue

    if (patch.description !== undefined) setDesc++
    if (patch.iconKey !== undefined) setIcon++
    if (patch.customIcon !== undefined) setCustom++
    patchesApplied++

    if (isDry) {
      console.log(`Would patch ${doc._id}: ${Object.keys(patch).join(', ')}`)
    } else {
      tx.patch(doc._id, (p) => p.set(patch))
    }
  }

  console.log('--- Summary ---')
  console.log(`Amenity documents with ≥1 patch field: ${patchesApplied}`)
  console.log(`  description set: ${setDesc}`)
  console.log(`  iconKey set: ${setIcon}`)
  console.log(`  customIcon set: ${setCustom}`)
  console.log(`Description skipped (conflict, no --force): ${descSkippedConflict.length}`)
  console.log(`Custom icon skipped (multiple assets): ${customConflicts.length}`)
  console.log(`Icon tie-break / multi-value notes: ${iconNotes.length}`)

  if (descSkippedConflict.length) {
    console.log('\nDescription conflicts (sample up to 25):')
    for (const line of descSkippedConflict.slice(0, 25)) console.log(`  ${line}`)
    if (descSkippedConflict.length > 25) console.log(`  ... +${descSkippedConflict.length - 25} more`)
  }
  if (customConflicts.length) {
    console.log('\nCustom icon conflicts (sample up to 25):')
    for (const line of customConflicts.slice(0, 25)) console.log(`  ${line}`)
    if (customConflicts.length > 25) console.log(`  ... +${customConflicts.length - 25} more`)
  }
  if (iconNotes.length) {
    console.log('\nIcon aggregation notes (sample up to 15):')
    for (const line of iconNotes.slice(0, 15)) console.log(`  ${line}`)
    if (iconNotes.length > 15) console.log(`  ... +${iconNotes.length - 15} more`)
  }

  if (!isDry && patchesApplied > 0) {
    await tx.commit()
    console.log(`\nCommitted patches to ${patchesApplied} amenity document(s).`)
  } else if (isDry) {
    console.log('\nDry-run: no writes. Use --execute to apply.')
  } else {
    console.log('\nNothing to patch.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
