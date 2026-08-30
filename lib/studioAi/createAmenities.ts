/**
 * Amenities the catalogue does not have yet are created on sight, flagged for
 * review, and attached to the listing immediately — the listing is right from
 * the first parse and the taxonomy catches up afterwards. Nothing flagged
 * reaches the site: the frontend queries exclude `needsReview`.
 * See SPEC-amenity-autocreate-2026-08-22.md.
 *
 * Deliberate copy of `domlivo-bot/src/createAmenities.ts`: the two repos share
 * no package, both intake routes must mint the same id for the same wording,
 * and a test pins them to identical output. The Studio half is pure — the
 * write itself happens in the action, under the editor's own session.
 */

/** One listing cannot reshape the catalogue, however creative the parse. */
export const MAX_NEW_AMENITIES_PER_LISTING = 8

const MIN_LENGTH = 2
const MAX_LENGTH = 60
const ALLOWED = /^[\p{L}\p{N} .,&/'’-]+$/u
/** Four or more digits in a row is a phone number or a price, not an amenity. */
const DIGIT_RUN = /\d[\d\s()-]{3,}/

export type NormalizedAmenity = {ok: true; name: string; key: string; slug: string} | {ok: false}

export function normalizeAmenityName(raw: string): NormalizedAmenity {
  const name = (raw ?? '').replace(/\s+/g, ' ').trim()
  if (name.length < MIN_LENGTH || name.length > MAX_LENGTH) return {ok: false}
  if (!ALLOWED.test(name)) return {ok: false}
  if (!/\p{L}/u.test(name)) return {ok: false}
  if (DIGIT_RUN.test(name)) return {ok: false}
  const key = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
  if (!key) return {ok: false}
  // The key is the identity — separator-blind, so "Wi-Fi" and "wifi" are one
  // document. The slug is a URL and a catalog filter value, so it keeps its
  // word breaks: wood-flooring, like the storage-room and swimming-pool
  // already in the catalogue.
  const slug = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return {ok: true, name, key, slug}
}

export type NewAmenityDoc = {
  _id: string
  _type: 'amenity'
  title: {_type: 'localizedString'; en: string}
  slug: {_type: 'slug'; current: string}
  active: true
  needsReview: true
}

export function amenityDocFor(n: {name: string; key: string; slug: string}): NewAmenityDoc {
  return {
    // Published id, never `drafts.` — a reference to a draft is broken in
    // published content, and resolveRefs' token query does see drafts.
    _id: `amenity-${n.key}`,
    _type: 'amenity',
    title: {_type: 'localizedString', en: n.name},
    slug: {_type: 'slug', current: n.slug},
    active: true,
    needsReview: true,
  }
}

/** Both intake routes report misses as `amenity "Sauna"`, mixed with other kinds. */
function amenityNamesIn(unmatched: readonly string[]): string[] {
  const out: string[] = []
  for (const entry of unmatched) {
    const m = /^amenity\s+"(.+)"$/.exec(entry ?? '')
    if (m && m[1]!.trim()) out.push(m[1]!)
  }
  return out
}

/**
 * Decides what to create for one parse. The caller commits the documents and
 * attaches `docs.map(d => d._id)` to the listing.
 */
export function planNewAmenities(unmatched: readonly string[]): {
  docs: NewAmenityDoc[]
  /** Entries left unresolved — other kinds, and names refused on shape. */
  stillUnmatched: string[]
} {
  const docs: NewAmenityDoc[] = []
  const stillUnmatched = unmatched.filter((u) => !/^amenity\s+".+"$/.test(u ?? ''))
  const seen = new Set<string>()

  for (const raw of amenityNamesIn(unmatched)) {
    const n = normalizeAmenityName(raw)
    if (!n.ok) {
      stillUnmatched.push(`amenity "${raw}"`)
      continue
    }
    if (seen.has(n.key)) continue
    if (docs.length >= MAX_NEW_AMENITIES_PER_LISTING) {
      stillUnmatched.push(`amenity "${raw}"`)
      continue
    }
    seen.add(n.key)
    docs.push(amenityDocFor(n))
  }

  return {docs, stillUnmatched}
}
