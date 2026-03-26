/**
 * Migration: Legacy property **offers** only (features → propertyOffers).
 *
 * Property **amenities** are no longer inline: use global `amenity` docs and `amenitiesRefs`
 * (see backfill / refs scripts). This script does **not** read or write `property.amenities`.
 *
 * - propertyOffers: from features (legacy field)
 *
 * Run:
 *   npx tsx scripts/migrate-property-amenities-and-offers.ts --dry-run
 *   npx tsx scripts/migrate-property-amenities-and-offers.ts --execute
 *   npx tsx scripts/migrate-property-amenities-and-offers.ts --execute --fill-missing-from-catalog
 *
 * Requires: SANITY_API_TOKEN in .env
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {addKeysToArrayItems} from './lib/addKeysToArrayItems'
import {PROPERTY_OFFERS_CATALOG, FALLBACK_ICON_POOL} from './lib/propertyMigrationCatalog'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

if (!token) {
  console.error('Error: SANITY_API_TOKEN required. Add to .env')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
})

const isDry = process.argv.includes('--dry-run')
const isExecute = process.argv.includes('--execute')
const forceArg = process.argv.find((a) => a.startsWith('--force'))
const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const idsArg = process.argv.find((a) => a.startsWith('--ids='))
const fillMissingArg = process.argv.find((a) => a === '--fill-missing-from-catalog')

const limit = limitArg ? parseInt(limitArg.split('=')[1] || '0', 10) : 0
const idsFilter = idsArg ? idsArg.split('=')[1]?.split(',').map((s) => s.trim()).filter(Boolean) : null
const isForce = !!forceArg
const isFillMissing = !!fillMissingArg

if (!isDry && !isExecute) {
  console.error('Use --dry-run to preview or --execute to write.')
  process.exit(1)
}

const FILL_OFFERS_COUNT = 4

type LocalizedObj = {en?: string; uk?: string; ru?: string; sq?: string; it?: string}
type LocalizedTitle = LocalizedObj | null

function isLocalized(value: unknown): value is LocalizedObj {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && 'en' in value
}

function getTitleString(title: LocalizedTitle): string {
  if (!title || typeof title !== 'object') return ''
  const t = title as Record<string, string>
  return t.en ?? t.sq ?? t.uk ?? t.ru ?? t.it ?? ''
}

function stringToLocalized(s: string): LocalizedObj {
  const v = s.trim() || 'Untitled'
  return {en: v, uk: v, ru: v, sq: v, it: v}
}

function ensureLocalizedTitle(value: string | LocalizedObj | undefined): LocalizedObj {
  if (!value) return stringToLocalized('Untitled')
  if (isLocalized(value)) return value
  return stringToLocalized(String(value))
}

function normalizeTitle(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, '-')
    .replace(/^-|-$/g, '')
}

function simpleHash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h = h & h
  }
  return Math.abs(h)
}

function deterministicIcon(normalizedTitle: string): string {
  const idx = simpleHash(normalizedTitle) % FALLBACK_ICON_POOL.length
  return FALLBACK_ICON_POOL[idx]
}

function genKey(prefix: string, idx: number, title: string): string {
  const hash = simpleHash(normalizeTitle(title || '')).toString(36).slice(0, 8)
  return `${prefix}-${idx}-${hash}`
}

function findOfferCatalogKey(normalized: string): string | null {
  for (const entry of PROPERTY_OFFERS_CATALOG) {
    const norms = [
      normalizeTitle(entry.title.en ?? ''),
      normalizeTitle(entry.title.sq ?? ''),
      normalizeTitle(entry.title.uk ?? ''),
      normalizeTitle(entry.title.ru ?? ''),
      normalizeTitle(entry.title.it ?? ''),
    ].filter(Boolean)
    if (norms.includes(normalized)) return entry.key
    if (norms.some((n) => n.includes(normalized) || normalized.includes(n))) return entry.key
  }
  return null
}

function getOfferCatalogEntry(key: string) {
  return PROPERTY_OFFERS_CATALOG.find((e) => e.key === key) ?? null
}

type PropertyOfferItem = {
  _type: string
  _key: string
  title: LocalizedObj
  iconKey: string | null
  customIcon: unknown
}

type EnrichmentSource = 'legacy' | 'catalog' | 'deterministic'

function enrichOfferItem(
  base: {title: string | LocalizedObj; iconKey: string | null; customIcon: unknown},
  idx: number,
): PropertyOfferItem {
  const titleStr = typeof base.title === 'string' ? base.title : getTitleString(base.title)
  const normalized = normalizeTitle(titleStr)
  const catalogKey = findOfferCatalogKey(normalized)
  const catalogEntry = catalogKey ? getOfferCatalogEntry(catalogKey) : null

  let title: LocalizedObj
  let iconKey = base.iconKey ?? null

  if (catalogEntry) {
    if (!iconKey) iconKey = catalogEntry.iconKey
    if (!titleStr || titleStr === 'Untitled') {
      title = {...catalogEntry.title}
    } else {
      title = ensureLocalizedTitle(base.title)
    }
  } else {
    title = ensureLocalizedTitle(base.title)
  }

  if (!iconKey) {
    iconKey = deterministicIcon(normalized || 'default')
  }

  return {
    _type: 'propertyOffer',
    _key: genKey('o', idx, titleStr || (title.en ?? '')),
    title,
    iconKey,
    customIcon: base.customIcon ?? null,
  }
}

function looksLikeNewPropertyOffers(arr: unknown[]): boolean {
  if (arr.length === 0) return false
  const first = arr[0]
  if (!first || typeof first !== 'object' || Array.isArray(first)) return false
  const obj = first as Record<string, unknown>
  if (obj._type !== 'propertyOffer') return false
  return isLocalized(obj.title)
}

function fixOffersIfNeeded(arr: unknown[]): PropertyOfferItem[] | null {
  if (arr.length === 0) return null
  const items: PropertyOfferItem[] = []
  let needsFix = false
  for (let i = 0; i < arr.length; i++) {
    const x = arr[i]
    if (!x || typeof x !== 'object' || Array.isArray(x)) continue
    const obj = x as Record<string, unknown>
    if (obj._type !== 'propertyOffer') continue
    const title = isLocalized(obj.title)
      ? (obj.title as LocalizedObj)
      : stringToLocalized(String(obj.title ?? '').trim() || 'Untitled')
    if (!isLocalized((x as Record<string, unknown>).title)) needsFix = true
    items.push({
      _type: 'propertyOffer',
      _key: (obj._key as string) ?? genKey('o-fix', i, getTitleString(title)),
      title,
      iconKey: (obj.iconKey as string) ?? null,
      customIcon: obj.customIcon ?? null,
    })
  }
  return needsFix && items.length > 0 ? (addKeysToArrayItems(items) as PropertyOfferItem[]) : null
}

type LegacyFeatureItem = {
  _key?: string
  title?: string | LocalizedTitle
  iconKey?: string
  icon?: string
  customIcon?: unknown
}

type PropertyDoc = {
  _id: string
  slug?: {current?: string}
  features?: LegacyFeatureItem[]
}

type MigrationSource = 'features' | 'catalog' | null

function migratePropertyOffers(doc: PropertyDoc): {
  items: PropertyOfferItem[]
  source: MigrationSource
  enrichment: EnrichmentSource
} {
  const features = Array.isArray(doc.features) ? doc.features : []
  if (features.length === 0) {
    return {items: [], source: null, enrichment: 'legacy'}
  }

  const items = features
    .filter((x) => x && typeof x === 'object')
    .map((old, idx) => {
      const title =
        typeof old.title === 'object' && old.title !== null && !Array.isArray(old.title)
          ? (old.title as LocalizedObj)
          : String(old.title ?? '').trim()
      return enrichOfferItem(
        {
          title,
          iconKey: (old.iconKey ?? old.icon) ?? null,
          customIcon: old.customIcon ?? null,
        },
        idx,
      )
    })
    .filter((x) => getTitleString(x.title))

  return {
    items: addKeysToArrayItems(items) as PropertyOfferItem[],
    source: 'features',
    enrichment: 'catalog',
  }
}

function fillOffersFromCatalog(): PropertyOfferItem[] {
  const offers = PROPERTY_OFFERS_CATALOG.slice(0, FILL_OFFERS_COUNT).map((e, idx) => ({
    _type: 'propertyOffer' as const,
    _key: genKey('o-cat', idx, e.title.en ?? ''),
    title: {...e.title},
    iconKey: e.iconKey,
    customIcon: null,
  }))
  return addKeysToArrayItems(offers) as PropertyOfferItem[]
}

async function run() {
  console.log('--- migrate property offers (legacy features → propertyOffers) ---')
  console.log(`Project: ${projectId}`)
  console.log(`Dataset: ${dataset}`)
  console.log(`Mode: ${isDry ? 'DRY-RUN' : 'EXECUTE'}`)
  if (limit) console.log(`Limit: ${limit}`)
  if (idsFilter?.length) console.log(`IDs filter: ${idsFilter.join(', ')}`)
  if (isForce) console.log('Force: overwrite existing new-format data')
  if (isFillMissing) console.log('Fill missing: populate empty docs from catalog (offers only)')
  console.log('')

  const idFilterGroq =
    idsFilter?.length && idsFilter.length > 0
      ? `&& _id in [${idsFilter.map((id) => JSON.stringify(id)).join(', ')}]`
      : ''

  const groq = `*[_type == "property" ${idFilterGroq}] | order(_id asc) {
    _id,
    "slug": slug.current,
    features,
    propertyOffers
  }`

  const docs = await client.fetch<
    (PropertyDoc & {
      slug?: string
      propertyOffers?: unknown[]
    })[]
  >(groq)

  const limited = limit > 0 ? docs.slice(0, limit) : docs
  let scanned = 0
  let updated = 0
  let skipped = 0
  let catalogFilled = 0
  const report: Array<{
    id: string
    slug?: string
    propertyOffersSource: string
    propertyOffersCount: number
    propertyOffersEnrichment?: string
    action: 'updated' | 'skipped' | 'catalog-filled'
    reason?: string
  }> = []

  for (const doc of limited) {
    scanned++

    const docWithOffers = doc as PropertyDoc & {propertyOffers?: unknown[]}
    const currentOffers = Array.isArray(docWithOffers.propertyOffers)
      ? docWithOffers.propertyOffers
      : []

    const offersMigrated = migratePropertyOffers(doc)
    const offersFixed = fixOffersIfNeeded(currentOffers)

    const hasNewOffers = looksLikeNewPropertyOffers(currentOffers)

    const shouldSkipOffers = hasNewOffers && offersMigrated.items.length > 0 && !isForce

    const offersToApply =
      offersMigrated.items.length > 0 && !shouldSkipOffers ? offersMigrated.items : offersFixed

    const hasOffersToApply = offersToApply !== null && offersToApply.length > 0

    if (!hasOffersToApply) {
      if (isFillMissing && isExecute) {
        const filled = fillOffersFromCatalog()
        await client.patch(doc._id).set({propertyOffers: filled}).commit()
        catalogFilled++
        report.push({
          id: doc._id,
          slug: doc.slug,
          propertyOffersSource: 'catalog',
          propertyOffersCount: filled.length,
          propertyOffersEnrichment: 'catalog',
          action: 'catalog-filled',
          reason: 'filled from catalog (--fill-missing-from-catalog)',
        })
      } else if (isFillMissing && isDry) {
        const filled = fillOffersFromCatalog()
        catalogFilled++
        report.push({
          id: doc._id,
          slug: doc.slug,
          propertyOffersSource: 'catalog',
          propertyOffersCount: filled.length,
          action: 'catalog-filled',
          reason: 'would fill from catalog (--fill-missing-from-catalog)',
        })
      } else {
        skipped++
        report.push({
          id: doc._id,
          slug: doc.slug,
          propertyOffersSource: offersMigrated.source ?? 'none',
          propertyOffersCount: offersMigrated.items.length,
          action: 'skipped',
          reason: shouldSkipOffers ? 'propertyOffers already in new format' : 'no legacy source data',
        })
      }
      continue
    }

    updated++
    report.push({
      id: doc._id,
      slug: doc.slug,
      propertyOffersSource:
        offersToApply && offersMigrated.items.length > 0 && !shouldSkipOffers
          ? offersMigrated.source ?? 'none'
          : offersFixed
            ? 'fix'
            : 'none',
      propertyOffersCount: offersToApply?.length ?? 0,
      propertyOffersEnrichment:
        hasOffersToApply && offersToApply && offersMigrated.items.length > 0 && !shouldSkipOffers
          ? offersMigrated.enrichment
          : offersFixed
            ? 'fix'
            : undefined,
      action: 'updated',
    })

    if (!isDry) {
      await client.patch(doc._id).set({propertyOffers: offersToApply}).commit()
    }
  }

  for (const r of report) {
    const slugPart = r.slug ? ` (${r.slug})` : ''
    const actionLabel =
      r.action === 'updated'
        ? isDry
          ? 'would update'
          : 'updated'
        : r.action === 'catalog-filled'
          ? isDry
            ? 'would fill'
            : 'catalog-filled'
          : 'skipped'
    const enrichPart = r.propertyOffersEnrichment ? ` [enriched: ${r.propertyOffersEnrichment}]` : ''
    const reasonPart = r.reason ? ` — ${r.reason}` : ''
    console.log(
      `  ${r.id}${slugPart}: ${actionLabel} | propertyOffers from ${r.propertyOffersSource} (${r.propertyOffersCount})${enrichPart}${reasonPart}`,
    )
  }

  console.log('')
  console.log('--- Summary ---')
  console.log(`Properties scanned: ${scanned}`)
  console.log(`Would update / updated: ${updated}`)
  if (catalogFilled > 0) console.log(`Catalog-filled: ${catalogFilled}`)
  console.log(`Skipped: ${skipped}`)
  if (isDry) {
    console.log('DRY-RUN: no changes written.')
  } else {
    console.log(`Changes written: ${updated + catalogFilled} properties`)
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
