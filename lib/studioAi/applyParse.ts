/**
 * Patch decisions for the Parse-from-text action — pure, testable.
 * Overwrite OFF fills only empty fields; ON replaces parsed fields. Never
 * touched either way: agent, gallery, isPublished, lifecycleStatus, slug when
 * already set, promotion/analytics fields.
 */
import {PROJECT_LOCALE_IDS, type ProjectLocaleId} from '../sanity/localizedPaste/projectLocales'
import {slugify} from './slug'

type LocaleMap = Record<ProjectLocaleId, string>

export type ParseResponse = {
  parsed: {
    facts: {
      dealType: 'sale' | 'rent' | null
      areaM2: number | null
      bedrooms: number | null
      /** Total habitable rooms — bedrooms plus living rooms. */
      rooms: number | null
      bathrooms: number | null
      yearBuilt: number | null
      address: string | null
    }
    editorial: {title: LocaleMap; shortDescription: LocaleMap; description: LocaleMap}
    parserNotes: string
  }
  refs: {
    propertyTypeId: string | null
    cityId: string | null
    districtId: string | null
    amenityIds: string[]
    /** Guessed by the endpoint's last-resort pass — the dialog asks a human to confirm these. */
    looseAmenities?: Array<{name: string; id: string}>
    unmatched: string[]
  }
  validation: {priceEur: number | null; warnings: string[]}
  coords: {lat: number; lng: number} | null
}

const isEmpty = (v: unknown): boolean => {
  if (v === undefined || v === null) return true
  if (typeof v === 'string') return !v.trim()
  if (Array.isArray(v)) return v.length === 0
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    if (typeof o._ref === 'string' && o._ref) return false // a reference is a value
    // A locale map or a slug with nothing in it reads as empty to an editor.
    const own = Object.entries(o).filter(([k]) => !k.startsWith('_'))
    if (own.length === 0) return true
    if (own.every(([, val]) => typeof val === 'string')) return own.every(([, val]) => !(val as string).trim())
  }
  return false
}

const ref = (id: string) => ({_type: 'reference', _ref: id})

/**
 * Required on `property` (see schemaTypes/documents/property.ts), each with the
 * label an editor sees. Declared here rather than read from the schema so that
 * adding a required field without updating this list fails a test, instead of
 * quietly dropping out of the "still needed" line.
 */
const REQUIRED_FOR_PUBLISH: Array<{field: string; label: string}> = [
  {field: 'title', label: 'Title'},
  {field: 'slug', label: 'URL slug'},
  {field: 'agent', label: 'Agent'},
  {field: 'type', label: 'Property type'},
  {field: 'status', label: 'Status'},
  {field: 'price', label: 'Price'},
  {field: 'city', label: 'City'},
  {field: 'gallery', label: 'Photos'},
]

/**
 * What still blocks publishing, given the document as it will be AFTER the
 * patch. Parse never touches `agent` or `gallery`, so a freshly parsed draft
 * always has something outstanding — closing with "review and save" without
 * naming it is what F6 was about.
 */
/**
 * The document as the patch will leave it. Set operations address either a
 * whole field (`price`) or one locale of it (`title.en`); a single level of
 * merging covers both, which is all the publish check needs.
 */
export function applySetOps(
  doc: Record<string, unknown>,
  setOps: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {...doc}
  for (const [path, value] of Object.entries(setOps)) {
    const dot = path.indexOf('.')
    if (dot === -1) {
      out[path] = value
      continue
    }
    const root = path.slice(0, dot)
    const rest = path.slice(dot + 1)
    const existing = (out[root] ?? {}) as Record<string, unknown>
    out[root] = {...existing, [rest]: value}
  }
  return out
}

export function missingForPublish(docAfterPatch: Record<string, unknown>): string[] {
  return REQUIRED_FOR_PUBLISH.filter(({field}) => isEmpty(docAfterPatch[field])).map(({label}) => label)
}

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

  // The slug is minted only when there is none — a published URL is not
  // editorial content, so overwrite never applies to it. Uniqueness is settled
  // by the caller, which can query the dataset under the editor's session.
  const titleEn = (r.parsed.editorial.title.en ?? '').trim()
  if (titleEn && isEmpty(current.slug)) {
    setOps.slug = {_type: 'slug', current: slugify(titleEn)}
  }

  localized('shortDescription', 'localizedText', r.parsed.editorial.shortDescription)
  localized('description', 'localizedText', r.parsed.editorial.description)

  want('status', r.parsed.facts.dealType)
  want('price', r.validation.priceEur)
  want('area', r.parsed.facts.areaM2)
  want('bedrooms', r.parsed.facts.bedrooms)
  want('rooms', r.parsed.facts.rooms)
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
