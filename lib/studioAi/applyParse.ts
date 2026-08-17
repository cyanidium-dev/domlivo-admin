/**
 * Patch decisions for the Parse-from-text action — pure, testable.
 * Overwrite OFF fills only empty fields; ON replaces parsed fields. Never
 * touched either way: agent, gallery, isPublished, lifecycleStatus, slug when
 * already set, promotion/analytics fields.
 */
import {PROJECT_LOCALE_IDS, type ProjectLocaleId} from '../sanity/localizedPaste/projectLocales'

type LocaleMap = Record<ProjectLocaleId, string>

export type ParseResponse = {
  parsed: {
    facts: {
      dealType: 'sale' | 'rent' | null
      areaM2: number | null
      bedrooms: number | null
      bathrooms: number | null
      yearBuilt: number | null
      address: string | null
    }
    editorial: {title: LocaleMap; shortDescription: LocaleMap; description: LocaleMap}
    parserNotes: string
  }
  refs: {propertyTypeId: string | null; cityId: string | null; districtId: string | null; amenityIds: string[]; unmatched: string[]}
  validation: {priceEur: number | null; warnings: string[]}
  coords: {lat: number; lng: number} | null
}

const isEmpty = (v: unknown): boolean =>
  v === undefined || v === null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && v.length === 0)

const ref = (id: string) => ({_type: 'reference', _ref: id})

export function decideParseSets(
  current: Record<string, unknown>,
  r: ParseResponse,
  overwrite: boolean,
): {setOps: Record<string, unknown>; skipped: string[]} {
  const setOps: Record<string, unknown> = {}
  const skipped: string[] = []

  const want = (field: string, value: unknown): void => {
    if (isEmpty(value)) return
    if (!overwrite && !isEmpty(current[field])) {
      skipped.push(field)
      return
    }
    setOps[field] = value
  }

  // Localized editorial fields: per-locale granularity so overwrite-off can
  // fill the gaps inside a partially filled object.
  const localized = (field: string, kind: 'localizedString' | 'localizedText', parsed: LocaleMap): void => {
    const existing = (current[field] ?? {}) as Record<string, unknown>
    let wroteAny = false
    for (const locale of PROJECT_LOCALE_IDS) {
      const next = (parsed[locale] ?? '').trim()
      if (!next) continue
      const has = typeof existing[locale] === 'string' && (existing[locale] as string).trim()
      if (!overwrite && has) continue
      setOps[`${field}.${locale}`] = next
      wroteAny = true
    }
    if (wroteAny && isEmpty(current[field])) setOps[`${field}._type`] = kind
    if (!wroteAny) skipped.push(field)
  }

  localized('title', 'localizedString', r.parsed.editorial.title)
  localized('shortDescription', 'localizedText', r.parsed.editorial.shortDescription)
  localized('description', 'localizedText', r.parsed.editorial.description)

  want('status', r.parsed.facts.dealType)
  want('price', r.validation.priceEur)
  want('area', r.parsed.facts.areaM2)
  want('bedrooms', r.parsed.facts.bedrooms)
  want('bathrooms', r.parsed.facts.bathrooms)
  want('yearBuilt', r.parsed.facts.yearBuilt)
  if (r.parsed.facts.address) {
    want('address', {_type: 'localizedString', en: r.parsed.facts.address})
  }
  if (r.refs.propertyTypeId) want('type', ref(r.refs.propertyTypeId))
  if (r.refs.cityId) want('city', ref(r.refs.cityId))
  if (r.refs.districtId) want('district', ref(r.refs.districtId))
  if (r.refs.amenityIds.length > 0) {
    want('amenitiesRefs', r.refs.amenityIds.map((id) => ({...ref(id), _key: id})))
  }
  if (r.coords) {
    want('coordinatesLat', r.coords.lat)
    want('coordinatesLng', r.coords.lng)
  }

  return {setOps, skipped}
}
