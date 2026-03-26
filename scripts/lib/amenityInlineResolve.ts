/**
 * Map a legacy inline amenity row shape (same fields as the old propertyAmenity object) to a
 * global amenity document _id. Used by historical migrate/backfill scripts only.
 */

import {AMENITY_CATALOG, TITLE_TO_CATALOG_KEY} from './propertyMigrationCatalog'

export type Localized = {en?: string; uk?: string; ru?: string; sq?: string; it?: string}

export type InlineAmenityRow = {
  _key?: string
  title?: Localized
  iconKey?: string
  description?: Localized
  customIcon?: unknown
}

export type AmenityDocMinimal = {_id: string; title?: Localized; slug?: {current?: string}}

export function normalizeForSynonym(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/['’]/g, '')
}

export function normalizeTitleMatch(s: string): string {
  return normalizeForSynonym(s)
}

export function firstTitleLine(t?: Localized): string {
  if (!t || typeof t !== 'object') return ''
  return String(t.en ?? t.sq ?? t.uk ?? t.ru ?? t.it ?? '').trim()
}

const CATALOG_KEY_TO_SEED_SLUG: Record<string, string> = {
  'private-parking': 'parking',
  'high-speed-wifi': 'wifi',
  'air-conditioning': 'ac',
}

function buildCatalogTitleToKey(): Map<string, string> {
  const m = new Map<string, string>()
  for (const row of AMENITY_CATALOG) {
    const en = row.title?.en
    if (typeof en === 'string' && en.trim()) {
      m.set(normalizeTitleMatch(en), row.key)
    }
  }
  return m
}

const CATALOG_TITLE_NORM_TO_KEY = buildCatalogTitleToKey()

function iconKeyToUniqueCatalogKey(iconKey: string | undefined): string | null {
  if (!iconKey) return null
  const rows = AMENITY_CATALOG.filter((r) => r.iconKey === iconKey)
  if (rows.length !== 1) return null
  return rows[0].key
}

function resolveSlugForCatalogKey(catalogKey: string, slugByCurrent: Map<string, string>): string | null {
  const seedSlug = CATALOG_KEY_TO_SEED_SLUG[catalogKey] ?? catalogKey
  if (slugByCurrent.has(seedSlug)) return seedSlug
  if (slugByCurrent.has(catalogKey)) return catalogKey
  return null
}

export function buildLookupMapsFromAmenityDocs(amenities: AmenityDocMinimal[]): {
  slugByCurrent: Map<string, string>
  idByNormalizedTitle: Map<string, string>
} {
  const slugByCurrent = new Map<string, string>()
  const idByNormalizedTitle = new Map<string, string>()
  for (const a of amenities) {
    const slug = a.slug?.current?.trim()
    if (slug) slugByCurrent.set(slug, a._id)
    const t = firstTitleLine(a.title as Localized)
    if (t) {
      const nt = normalizeTitleMatch(t)
      if (!idByNormalizedTitle.has(nt)) idByNormalizedTitle.set(nt, a._id)
    }
  }
  return {slugByCurrent, idByNormalizedTitle}
}

export function resolveAmenityIdForInline(
  row: InlineAmenityRow,
  slugByCurrent: Map<string, string>,
  idByNormalizedTitle: Map<string, string>,
): {id: string | null; reason: string} {
  const titleLine = firstTitleLine(row.title)
  const normSynonym = normalizeForSynonym(titleLine)
  const normTitle = normalizeTitleMatch(titleLine)

  const fromSyn = TITLE_TO_CATALOG_KEY[normSynonym]
  if (fromSyn) {
    const slug = resolveSlugForCatalogKey(fromSyn, slugByCurrent)
    if (slug && slugByCurrent.has(slug)) {
      return {id: slugByCurrent.get(slug)!, reason: `TITLE_TO_CATALOG_KEY["${normSynonym}"] -> ${fromSyn} -> slug ${slug}`}
    }
  }

  if (normSynonym && slugByCurrent.has(normSynonym)) {
    return {id: slugByCurrent.get(normSynonym)!, reason: `title as slug: ${normSynonym}`}
  }

  if (normTitle && idByNormalizedTitle.has(normTitle)) {
    return {id: idByNormalizedTitle.get(normTitle)!, reason: `amenity title match: ${normTitle}`}
  }

  const ckFromCatalogTitle = CATALOG_TITLE_NORM_TO_KEY.get(normTitle)
  if (ckFromCatalogTitle) {
    const slug = resolveSlugForCatalogKey(ckFromCatalogTitle, slugByCurrent)
    if (slug && slugByCurrent.has(slug)) {
      return {id: slugByCurrent.get(slug)!, reason: `AMENITY_CATALOG title.en -> ${ckFromCatalogTitle} -> ${slug}`}
    }
  }

  const uniqueCk = iconKeyToUniqueCatalogKey(row.iconKey)
  if (uniqueCk) {
    const slug = resolveSlugForCatalogKey(uniqueCk, slugByCurrent)
    if (slug && slugByCurrent.has(slug)) {
      return {id: slugByCurrent.get(slug)!, reason: `unique iconKey "${row.iconKey}" -> ${uniqueCk} -> ${slug}`}
    }
  }

  return {id: null, reason: `no match (title="${titleLine}", iconKey=${row.iconKey ?? '—'})`}
}
