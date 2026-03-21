/**
 * Migration: Property amenities and property offers.
 *
 * Migrates legacy property fields into the new schema, enriching from fallback catalog.
 * - amenities: from propertyDetails | amenitiesRefs | amenities (string[])
 * - propertyOffers: from features
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
import {
  AMENITY_CATALOG,
  PROPERTY_OFFERS_CATALOG,
  FALLBACK_ICON_POOL,
  TITLE_TO_CATALOG_KEY,
} from './lib/propertyMigrationCatalog'

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

// --- CLI args ---
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

// --- Catalog fill defaults ---
const FILL_AMENITIES_COUNT = 3
const FILL_OFFERS_COUNT = 4

// --- Types ---
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

/** Replicate string across all locales. No empty locales. */
function stringToLocalized(s: string): LocalizedObj {
  const v = s.trim() || 'Untitled'
  return {en: v, uk: v, ru: v, sq: v, it: v}
}

/** Ensure value is localized object. Preserve existing localized; convert string. */
function ensureLocalizedTitle(value: string | LocalizedObj | undefined): LocalizedObj {
  if (!value) return stringToLocalized('Untitled')
  if (isLocalized(value)) return value
  return stringToLocalized(String(value))
}

function ensureLocalizedDescription(value: string | LocalizedObj | undefined): LocalizedObj {
  if (!value) return {en: '', uk: '', ru: '', sq: '', it: ''}
  if (isLocalized(value)) return value
  const v = String(value).trim()
  return v ? stringToLocalized(v) : {en: '', uk: '', ru: '', sq: '', it: ''}
}

type LegacyPropertyDetailsItem = {
  _key?: string
  title?: string | LocalizedTitle
  description?: string
  iconKey?: string
  icon?: string
  customIcon?: unknown
}

type LegacyFeatureItem = {
  _key?: string
  title?: string | LocalizedTitle
  iconKey?: string
  icon?: string
  customIcon?: unknown
}

type AmenityRefResolved = {
  _id: string
  title?: LocalizedTitle
}

type PropertyDoc = {
  _id: string
  slug?: {current?: string}
  amenities?: unknown[]
  amenitiesRefs?: {_ref?: string}[]
  propertyDetails?: LegacyPropertyDetailsItem[]
  features?: LegacyFeatureItem[]
}

type MigrationSource = 'propertyDetails' | 'amenitiesRefs' | 'amenities' | 'features' | 'catalog' | null
type EnrichmentSource = 'legacy' | 'catalog' | 'deterministic'

// --- Title normalization ---
function normalizeTitle(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, '-')
    .replace(/^-|-$/g, '')
}

// --- Deterministic hash ---
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

// --- Deterministic _key ---
function genKey(prefix: string, idx: number, title: string): string {
  const hash = simpleHash(normalizeTitle(title || '')).toString(36).slice(0, 8)
  return `${prefix}-${idx}-${hash}`
}

// --- Catalog matching ---
function findCatalogKey(normalized: string): string | null {
  const synonym = TITLE_TO_CATALOG_KEY[normalized]
  if (synonym) return synonym

  for (const entry of AMENITY_CATALOG) {
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

function getAmenityCatalogEntry(key: string) {
  return AMENITY_CATALOG.find((e) => e.key === key) ?? null
}

function getOfferCatalogEntry(key: string) {
  return PROPERTY_OFFERS_CATALOG.find((e) => e.key === key) ?? null
}

// --- Enrichment ---
type PropertyAmenityItem = {
  _type: string
  _key: string
  title: LocalizedObj
  description: LocalizedObj
  iconKey: string | null
  customIcon: unknown
}

function enrichAmenityItem(
  base: {
    title: string | LocalizedObj
    description: string | LocalizedObj
    iconKey: string | null
    customIcon: unknown
  },
  idx: number,
): PropertyAmenityItem {
  const titleStr = typeof base.title === 'string' ? base.title : getTitleString(base.title)
  const normalized = normalizeTitle(titleStr)
  const catalogKey = findCatalogKey(normalized)
  const catalogEntry = catalogKey ? getAmenityCatalogEntry(catalogKey) : null

  let title: LocalizedObj
  let description: LocalizedObj
  let iconKey = base.iconKey ?? null

  if (catalogEntry) {
    if (!iconKey) iconKey = catalogEntry.iconKey
    const needsTitleFromCatalog = !titleStr || titleStr === 'Untitled'
    const needsDescFromCatalog =
      typeof base.description === 'string'
        ? !base.description.trim()
        : !getTitleString(base.description)
    if (needsTitleFromCatalog) {
      title = {...catalogEntry.title}
    } else {
      title = ensureLocalizedTitle(base.title)
    }
    if (needsDescFromCatalog && catalogEntry.description) {
      description = {...catalogEntry.description}
    } else {
      description = ensureLocalizedDescription(base.description)
    }
  } else {
    title = ensureLocalizedTitle(base.title)
    description = ensureLocalizedDescription(base.description)
  }

  if (!iconKey) {
    iconKey = deterministicIcon(normalized || 'default')
  }

  return {
    _type: 'propertyAmenity',
    _key: genKey('a', idx, titleStr || (title.en ?? '')),
    title,
    description,
    iconKey,
    customIcon: base.customIcon ?? null,
  }
}

type PropertyOfferItem = {
  _type: string
  _key: string
  title: LocalizedObj
  iconKey: string | null
  customIcon: unknown
}

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

// --- Amenities migration ---
function looksLikeNewAmenities(arr: unknown[]): boolean {
  if (arr.length === 0) return false
  const first = arr[0]
  if (!first || typeof first !== 'object' || Array.isArray(first)) return false
  const obj = first as Record<string, unknown>
  if (obj._type === 'reference') return false
  return isLocalized(obj.title)
}

/** Convert existing items with string title/description to localized. Returns null if no conversion needed. */
function fixAmenitiesIfNeeded(arr: unknown[]): PropertyAmenityItem[] | null {
  if (arr.length === 0) return null
  const items: PropertyAmenityItem[] = []
  let needsFix = false
  for (let i = 0; i < arr.length; i++) {
    const x = arr[i]
    if (!x || typeof x !== 'object' || Array.isArray(x)) continue
    const obj = x as Record<string, unknown>
    if (obj._type !== 'propertyAmenity') continue
    const title = isLocalized(obj.title)
      ? (obj.title as LocalizedObj)
      : stringToLocalized(String(obj.title ?? '').trim() || 'Untitled')
    const description = isLocalized(obj.description)
      ? (obj.description as LocalizedObj)
      : ensureLocalizedDescription(obj.description as string | undefined)
    if (!isLocalized((x as Record<string, unknown>).title) || !isLocalized((x as Record<string, unknown>).description)) {
      needsFix = true
    }
    items.push({
      _type: 'propertyAmenity',
      _key: (obj._key as string) ?? genKey('a-fix', i, getTitleString(title)),
      title,
      description,
      iconKey: (obj.iconKey as string) ?? null,
      customIcon: obj.customIcon ?? null,
    })
  }
  return needsFix && items.length > 0 ? addKeysToArrayItems(items) as PropertyAmenityItem[] : null
}

function migrateAmenities(
  doc: PropertyDoc,
  amenityRefsResolved?: AmenityRefResolved[],
): {
  items: PropertyAmenityItem[]
  source: MigrationSource
  enrichment: EnrichmentSource
} {
  const propertyDetails = Array.isArray(doc.propertyDetails) ? doc.propertyDetails : []
  if (propertyDetails.length > 0) {
    const items = propertyDetails
      .filter((x) => x && typeof x === 'object')
      .map((old, idx) => {
        const title =
          typeof old.title === 'object' && old.title !== null && !Array.isArray(old.title)
            ? (old.title as LocalizedObj)
            : String(old.title ?? '').trim()
        const description =
          typeof old.description === 'object' && old.description !== null && !Array.isArray(old.description)
            ? (old.description as LocalizedObj)
            : String(old.description ?? '').trim()
        return enrichAmenityItem(
          {
            title,
            description,
            iconKey: (old.iconKey ?? old.icon) ?? null,
            customIcon: old.customIcon ?? null,
          },
          idx,
        )
      })
      .filter((x) => getTitleString(x.title))
    if (items.length > 0) {
      return {
        items: addKeysToArrayItems(items) as PropertyAmenityItem[],
        source: 'propertyDetails',
        enrichment: 'legacy',
      }
    }
  }

  if (Array.isArray(amenityRefsResolved) && amenityRefsResolved.length > 0) {
    const items = amenityRefsResolved
      .map((ref, idx) => {
        const title = ref.title && isLocalized(ref.title)
          ? (ref.title as LocalizedObj)
          : getTitleString(ref.title) || 'Untitled'
        return enrichAmenityItem(
          {
            title,
            description: '',
            iconKey: null,
            customIcon: null,
          },
          idx,
        )
      })
      .filter((x) => getTitleString(x.title))
    if (items.length > 0) {
      return {
        items: addKeysToArrayItems(items) as PropertyAmenityItem[],
        source: 'amenitiesRefs',
        enrichment: 'catalog',
      }
    }
  }

  const legacyAmenities = Array.isArray(doc.amenities) ? doc.amenities : []
  const strItems = legacyAmenities
    .filter((x) => typeof x === 'string' && (x as string).trim())
    .map((s, idx) =>
      enrichAmenityItem(
        {
          title: String(s).trim(),
          description: '',
          iconKey: null,
          customIcon: null,
        },
        idx,
      ),
    )
  if (strItems.length > 0) {
    return {
      items: addKeysToArrayItems(strItems) as PropertyAmenityItem[],
      source: 'amenities',
      enrichment: 'catalog',
    }
  }

  return {items: [], source: null, enrichment: 'legacy'}
}

// --- Property offers migration ---
function looksLikeNewPropertyOffers(arr: unknown[]): boolean {
  if (arr.length === 0) return false
  const first = arr[0]
  if (!first || typeof first !== 'object' || Array.isArray(first)) return false
  const obj = first as Record<string, unknown>
  if (obj._type !== 'propertyOffer') return false
  return isLocalized(obj.title)
}

/** Convert existing items with string title to localized. Returns null if no conversion needed. */
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
  return needsFix && items.length > 0 ? addKeysToArrayItems(items) as PropertyOfferItem[] : null
}

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

// --- Catalog fill for empty docs ---
function fillFromCatalog(): {
  amenities: PropertyAmenityItem[]
  propertyOffers: PropertyOfferItem[]
} {
  const amenities = AMENITY_CATALOG.slice(0, FILL_AMENITIES_COUNT).map((e, idx) => ({
    _type: 'propertyAmenity' as const,
    _key: genKey('a-cat', idx, e.title.en ?? ''),
    title: {...e.title},
    description: e.description ? {...e.description} : {en: '', uk: '', ru: '', sq: '', it: ''},
    iconKey: e.iconKey,
    customIcon: null,
  }))
  const offers = PROPERTY_OFFERS_CATALOG.slice(0, FILL_OFFERS_COUNT).map((e, idx) => ({
    _type: 'propertyOffer' as const,
    _key: genKey('o-cat', idx, e.title.en ?? ''),
    title: {...e.title},
    iconKey: e.iconKey,
    customIcon: null,
  }))
  return {
    amenities: addKeysToArrayItems(amenities) as PropertyAmenityItem[],
    propertyOffers: addKeysToArrayItems(offers) as PropertyOfferItem[],
  }
}

// --- Main ---
async function run() {
  console.log('--- migrate property amenities & property offers ---')
  console.log(`Project: ${projectId}`)
  console.log(`Dataset: ${dataset}`)
  console.log(`Mode: ${isDry ? 'DRY-RUN' : 'EXECUTE'}`)
  if (limit) console.log(`Limit: ${limit}`)
  if (idsFilter?.length) console.log(`IDs filter: ${idsFilter.join(', ')}`)
  if (isForce) console.log('Force: overwrite existing new-format data')
  if (isFillMissing) console.log('Fill missing: populate empty docs from catalog')
  console.log('')

  const idFilterGroq =
    idsFilter?.length && idsFilter.length > 0
      ? `&& _id in [${idsFilter.map((id) => JSON.stringify(id)).join(', ')}]`
      : ''

  const groq = `*[_type == "property" ${idFilterGroq}] | order(_id asc) {
    _id,
    "slug": slug.current,
    amenities,
    amenitiesRefs,
    propertyDetails,
    features,
    propertyOffers,
    "amenitiesRefsResolved": amenitiesRefs[]->{
      _id,
      title
    }
  }`

  const docs = await client.fetch<
    (PropertyDoc & {
      slug?: string
      amenitiesRefsResolved?: AmenityRefResolved[]
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
    amenitiesSource: string
    amenitiesCount: number
    amenitiesEnrichment?: string
    propertyOffersSource: string
    propertyOffersCount: number
    propertyOffersEnrichment?: string
    action: 'updated' | 'skipped' | 'catalog-filled'
    reason?: string
  }> = []

  for (const doc of limited) {
    scanned++

    const resolvedRefs = doc.amenitiesRefsResolved ?? []
    const currentAmenities = Array.isArray(doc.amenities) ? doc.amenities : []
    const docWithOffers = doc as PropertyDoc & {propertyOffers?: unknown[]}
    const currentOffers = Array.isArray(docWithOffers.propertyOffers)
      ? docWithOffers.propertyOffers
      : []

    const amenitiesMigrated = migrateAmenities(doc, resolvedRefs)
    const offersMigrated = migratePropertyOffers(doc)
    const amenitiesFixed = fixAmenitiesIfNeeded(currentAmenities)
    const offersFixed = fixOffersIfNeeded(currentOffers)

    const hasNewAmenities = looksLikeNewAmenities(currentAmenities)
    const hasNewOffers = looksLikeNewPropertyOffers(currentOffers)

    const shouldSkipAmenities =
      hasNewAmenities && amenitiesMigrated.items.length > 0 && !isForce
    const shouldSkipOffers =
      hasNewOffers && offersMigrated.items.length > 0 && !isForce

    const amenitiesToApply =
      amenitiesMigrated.items.length > 0 && !shouldSkipAmenities
        ? amenitiesMigrated.items
        : amenitiesFixed
    const offersToApply =
      offersMigrated.items.length > 0 && !shouldSkipOffers
        ? offersMigrated.items
        : offersFixed

    const hasAmenitiesToApply = amenitiesToApply !== null && amenitiesToApply.length > 0
    const hasOffersToApply = offersToApply !== null && offersToApply.length > 0

    if (!hasAmenitiesToApply && !hasOffersToApply) {
      if (isFillMissing && isExecute) {
        const filled = fillFromCatalog()
        await client
          .patch(doc._id)
          .set({
            amenities: filled.amenities,
            propertyOffers: filled.propertyOffers,
          })
          .commit()
        catalogFilled++
        report.push({
          id: doc._id,
          slug: doc.slug,
          amenitiesSource: 'catalog',
          amenitiesCount: filled.amenities.length,
          amenitiesEnrichment: 'catalog',
          propertyOffersSource: 'catalog',
          propertyOffersCount: filled.propertyOffers.length,
          propertyOffersEnrichment: 'catalog',
          action: 'catalog-filled',
          reason: 'filled from catalog (--fill-missing-from-catalog)',
        })
      } else if (isFillMissing && isDry) {
        const filled = fillFromCatalog()
        catalogFilled++
        report.push({
          id: doc._id,
          slug: doc.slug,
          amenitiesSource: 'catalog',
          amenitiesCount: filled.amenities.length,
          propertyOffersSource: 'catalog',
          propertyOffersCount: filled.propertyOffers.length,
          action: 'catalog-filled',
          reason: 'would fill from catalog (--fill-missing-from-catalog)',
        })
      } else {
        skipped++
        report.push({
          id: doc._id,
          slug: doc.slug,
          amenitiesSource: amenitiesMigrated.source ?? 'none',
          amenitiesCount: amenitiesMigrated.items.length,
          propertyOffersSource: offersMigrated.source ?? 'none',
          propertyOffersCount: offersMigrated.items.length,
          action: 'skipped',
          reason: shouldSkipAmenities
            ? 'amenities already in new format'
            : shouldSkipOffers
              ? 'propertyOffers already in new format'
              : 'no legacy source data',
        })
      }
      continue
    }

    updated++
    report.push({
      id: doc._id,
      slug: doc.slug,
      amenitiesSource:
        amenitiesToApply && amenitiesMigrated.items.length > 0 && !shouldSkipAmenities
          ? amenitiesMigrated.source ?? 'none'
          : amenitiesFixed
            ? 'fix'
            : 'none',
      amenitiesCount: amenitiesToApply?.length ?? 0,
      amenitiesEnrichment:
        hasAmenitiesToApply && amenitiesToApply && amenitiesMigrated.items.length > 0 && !shouldSkipAmenities
          ? amenitiesMigrated.enrichment
          : amenitiesFixed
            ? 'fix'
            : undefined,
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
      const updates: Record<string, unknown> = {}
      if (hasAmenitiesToApply && amenitiesToApply) updates.amenities = amenitiesToApply
      if (hasOffersToApply && offersToApply) updates.propertyOffers = offersToApply
      await client.patch(doc._id).set(updates).commit()
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
    const enrichPart =
      r.amenitiesEnrichment || r.propertyOffersEnrichment
        ? ` [enriched: ${r.amenitiesEnrichment ?? '-'}/${r.propertyOffersEnrichment ?? '-'}]`
        : ''
    const reasonPart = r.reason ? ` — ${r.reason}` : ''
    console.log(
      `  ${r.id}${slugPart}: ${actionLabel} | amenities from ${r.amenitiesSource} (${r.amenitiesCount}), propertyOffers from ${r.propertyOffersSource} (${r.propertyOffersCount})${enrichPart}${reasonPart}`,
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
