/**
 * Give every listing without real coordinates the best pin the data allows,
 * and say so with `locationPrecision: 'approximate'`.
 *
 * Why: 333 of the 371 live listings (all of findall and get.al, 2026-10-08)
 * had no coordinates at all, so the catalogue map showed a handful of pins
 * for a city with 350 flats. Neither partner publishes coordinates — findall's
 * API has an address string, get.al prints a neighbourhood label under the
 * title ("Plazh Iliria", "Stadiumi", "Ish Rajoni i Policisë") — but those
 * labels are far more precise than a district centroid, so each listing is
 * pinned to the landmark or neighbourhood it names, scattered a little so
 * pins do not stack, and checked against OpenStreetMap so none lands in the
 * sea.
 *
 * Sources of a listing's place, in order:
 *   1. get.al's `districtLabel` / findall's `address`, from the scraped
 *      files in ../domlivo-workspace (matched against scripts/data/geo-anchors.json);
 *   2. the listing's `address` field in Sanity;
 *   3. a place name in the title or description (same anchor table);
 *   4. the district centroid, then the city centroid.
 *
 * Land check: every candidate point is reverse-geocoded with Nominatim
 * (one request a second, cached in ../domlivo-workspace/geo/reverse-cache.json);
 * water, beach-free sea and "unable to geocode" answers make the point move
 * to another deterministic spot inside the same radius (up to 6 tries).
 *
 * Never touches a listing whose `locationPrecision` is 'exact'. Re-runnable:
 * the same listing lands on the same spot every run unless its anchor changes.
 *
 * Run:
 *   npx tsx scripts/placePartnerListingCoordinates.ts --dry
 *   npx tsx scripts/placePartnerListingCoordinates.ts --execute
 *   npx tsx scripts/placePartnerListingCoordinates.ts --execute --only property-getal-123
 *   npx tsx scripts/placePartnerListingCoordinates.ts --dry --no-land-check   (fast preview)
 *   npx tsx scripts/placePartnerListingCoordinates.ts --execute --include-published-only
 */
import fs from 'node:fs'
import path from 'node:path'
import {getSanityClientForScripts} from './lib/sanityEnvClient'

const args = process.argv.slice(2)
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')
const noLandCheck = args.includes('--no-land-check')
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : ''
const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : 0
const publishedOnly = args.includes('--include-published-only')
if (!isDry && !isExecute) {
  console.error('Use --dry or --execute.')
  process.exit(1)
}

const WORKSPACE = path.resolve(process.cwd(), '../domlivo-workspace')
const ANCHORS_FILE = path.resolve(process.cwd(), 'scripts/data/geo-anchors.json')
const REVERSE_CACHE = path.join(WORKSPACE, 'geo', 'reverse-cache.json')
const USER_AGENT = 'domlivo-admin geo placement (cyanidium1@gmail.com)'

type Anchor = {
  key: string
  district?: string
  lat: number
  lng: number
  radius: number
  source: string
  match: string[]
}
type Centroid = {lat: number; lng: number; radius: number}
type AnchorFile = {
  anchors: Anchor[]
  districtCentroids: Record<string, Centroid>
  cityCentroids: Record<string, Centroid>
}

const anchorFile = JSON.parse(fs.readFileSync(ANCHORS_FILE, 'utf8')) as AnchorFile

/** Lower-case, accents stripped, punctuation to spaces: "Shkëmbi i Kavajës," → "shkembi i kavajes". */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/ë/g, 'e')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}.+]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const anchors = anchorFile.anchors.map((a) => ({...a, matchNorm: a.match.map(norm)}))

/**
 * The first anchor whose match string appears in the text. `wholeLabel` is
 * for the partner's own label: compared whole first (so "Qerret" does not
 * become "Qerreti i Durrësit"'s neighbour by accident), then by containment.
 */
function findAnchor(text: string, wholeLabel = false): Anchor | null {
  const t = norm(text)
  if (!t) return null
  if (wholeLabel) {
    for (const a of anchors) if (a.matchNorm.some((m) => m === t)) return a
  }
  for (const a of anchors) {
    if (a.matchNorm.some((m) => m.length >= 4 && new RegExp(`(^|\\s)${escapeRe(m)}(\\s|$|\\.)`).test(t))) return a
  }
  return null
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/* ---------- partner labels ---------- */

type Labels = Map<string, string>

function loadPartnerLabels(): Labels {
  const out: Labels = new Map()
  const getal = path.join(WORKSPACE, 'getal', 'getal-listings.json')
  if (fs.existsSync(getal)) {
    const rows = JSON.parse(fs.readFileSync(getal, 'utf8')) as Array<{id: string; districtLabel?: string}>
    for (const r of rows) if (r.districtLabel) out.set(`property-getal-${r.id}`, r.districtLabel)
  }
  for (const file of ['findall-sale.json', 'findall-rent.json']) {
    const p = path.join(WORKSPACE, 'findall', file)
    if (!fs.existsSync(p)) continue
    const rows = JSON.parse(fs.readFileSync(p, 'utf8')) as Array<{id: number; address?: string}>
    for (const r of rows) if (r.address) out.set(`property-findall-${r.id}`, r.address)
  }
  return out
}

/* ---------- deterministic scatter ---------- */

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function scatter(center: {lat: number; lng: number}, radius: number, seed: string): {lat: number; lng: number} {
  const h = hash(seed)
  const angle = ((h % 3600) / 3600) * 2 * Math.PI
  // sqrt spreads the points evenly over the disc.
  const r = Math.sqrt(((h >>> 12) % 1000) / 1000) * radius
  const dLat = (r * Math.cos(angle)) / 111_320
  const dLng = (r * Math.sin(angle)) / (111_320 * Math.cos((center.lat * Math.PI) / 180))
  return {lat: Number((center.lat + dLat).toFixed(6)), lng: Number((center.lng + dLng).toFixed(6))}
}

/* ---------- land check ---------- */

type ReverseAnswer = {category?: string; type?: string; error?: string; name?: string}
let reverseCache: Record<string, ReverseAnswer> = {}
if (fs.existsSync(REVERSE_CACHE)) reverseCache = JSON.parse(fs.readFileSync(REVERSE_CACHE, 'utf8'))
let lastRequest = 0

async function reverse(lat: number, lng: number): Promise<ReverseAnswer> {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`
  if (reverseCache[key]) return reverseCache[key]
  const wait = 1100 - (Date.now() - lastRequest)
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastRequest = Date.now()
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&zoom=18`
  const res = await fetch(url, {headers: {'User-Agent': USER_AGENT}})
  const json = (await res.json()) as ReverseAnswer & {display_name?: string}
  const answer: ReverseAnswer = {category: json.category, type: json.type, error: json.error, name: json.display_name?.slice(0, 80)}
  reverseCache[key] = answer
  return answer
}

function saveReverseCache() {
  fs.mkdirSync(path.dirname(REVERSE_CACHE), {recursive: true})
  fs.writeFileSync(REVERSE_CACHE, JSON.stringify(reverseCache, null, 1))
}

/** Sea, lakes, rivers; a beach is land. "Unable to geocode" means open water here. */
function isWater(a: ReverseAnswer): boolean {
  if (a.error) return true
  if (a.category === 'natural' && ['water', 'bay', 'coastline', 'strait', 'wetland'].includes(a.type ?? '')) return true
  if (a.category === 'waterway') return true
  if (a.category === 'place' && ['sea', 'ocean'].includes(a.type ?? '')) return true
  return false
}

async function placeOnLand(center: {lat: number; lng: number}, radius: number, seed: string) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const point = scatter(center, radius, attempt ? `${seed}#${attempt}` : seed)
    if (noLandCheck) return {point, checked: false, attempts: attempt + 1}
    const a = await reverse(point.lat, point.lng)
    if (!isWater(a)) return {point, checked: true, attempts: attempt + 1}
  }
  // Six water hits in a row: the anchor itself is probably on the shore. Use
  // the anchor point, which an editor chose on land.
  return {point: {lat: center.lat, lng: center.lng}, checked: true, attempts: 6, fellBack: true}
}

/* ---------- main ---------- */

type Row = {
  _id: string
  slug?: string
  isPublished?: boolean
  lifecycleStatus?: string
  lat?: number
  lng?: number
  precision?: string
  city?: string
  district?: string
  addrSq?: string
  addrEn?: string
  titleEn?: string
  titleSq?: string
  titleRu?: string
  descEn?: string
  descSq?: string
  descRu?: string
}

async function main() {
  const client = getSanityClientForScripts()
  const labels = loadPartnerLabels()
  console.log(`partner labels loaded: ${labels.size}`)

  let rows = await client.fetch<Row[]>(`*[_type == "property" && !(_id in path("drafts.**"))]{
    _id, "slug": slug.current, isPublished, lifecycleStatus,
    "lat": coordinatesLat, "lng": coordinatesLng, "precision": locationPrecision,
    "city": city->slug.current, "district": district->slug.current,
    "addrSq": address.sq, "addrEn": address.en,
    "titleEn": title.en, "titleSq": title.sq, "titleRu": title.ru,
    "descEn": description.en, "descSq": description.sq, "descRu": description.ru
  } | order(_id asc)`)

  if (only) rows = rows.filter((r) => r._id === only || r.slug === only)
  if (publishedOnly) rows = rows.filter((r) => r.isPublished)
  rows = rows.filter((r) => r.precision !== 'exact')
  if (limit) rows = rows.slice(0, limit)

  type Plan = {row: Row; anchorKey: string; via: string; center: {lat: number; lng: number}; radius: number}
  const plans: Plan[] = []
  const unplaceable: string[] = []

  for (const row of rows) {
    const label = labels.get(row._id) ?? ''
    const address = row.addrSq || row.addrEn || ''
    const text = [row.titleEn, row.titleSq, row.titleRu, row.descEn, row.descSq, row.descRu].filter(Boolean).join(' \n ')

    let anchor: Anchor | null = null
    let via = ''
    if (label) {
      anchor = findAnchor(label, true)
      if (anchor) via = `label "${label}"`
    }
    if (!anchor && address) {
      anchor = findAnchor(address, true)
      if (anchor) via = `address "${address}"`
    }
    if (!anchor && text) {
      anchor = findAnchor(text)
      if (anchor) via = 'text'
    }
    // An anchor that belongs to another district than the listing's own is a
    // false positive ("Golem" in a Plazh listing's "20 min to Golem"), unless
    // it came from the partner's label, which is authoritative.
    if (anchor && anchor.district && row.district && anchor.district !== row.district && !via.startsWith('label')) {
      anchor = null
      via = ''
    }

    if (anchor) {
      plans.push({row, anchorKey: anchor.key, via, center: {lat: anchor.lat, lng: anchor.lng}, radius: anchor.radius})
      continue
    }
    const district = row.district ? anchorFile.districtCentroids[row.district] : undefined
    if (district) {
      plans.push({row, anchorKey: `district:${row.district}`, via: 'district centroid', center: district, radius: district.radius})
      continue
    }
    const city = row.city ? anchorFile.cityCentroids[row.city] : undefined
    if (city) {
      plans.push({row, anchorKey: `city:${row.city}`, via: 'city centroid', center: city, radius: city.radius})
      continue
    }
    unplaceable.push(`${row._id}: district=${row.district ?? '—'} city=${row.city ?? '—'}`)
  }

  const tally = new Map<string, number>()
  for (const p of plans) tally.set(p.anchorKey, (tally.get(p.anchorKey) ?? 0) + 1)
  console.log(`\n${plans.length} listings to place, ${unplaceable.length} unplaceable, ${rows.length} candidates (non-exact).`)
  console.log('\nBy anchor:')
  for (const [k, n] of [...tally.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${k}`)
  const viaTally = new Map<string, number>()
  for (const p of plans) {
    const v = p.via.startsWith('label') ? 'partner label' : p.via.startsWith('address') ? 'address field' : p.via
    viaTally.set(v, (viaTally.get(v) ?? 0) + 1)
  }
  console.log('\nBy source:', Object.fromEntries(viaTally))
  for (const u of unplaceable) console.log(`UNPLACEABLE ${u}`)

  console.log(`\n${noLandCheck ? 'No land check.' : 'Land check via Nominatim (one request a second, cached)…'}`)
  let moved = 0
  let fellBack = 0
  const results: Array<Plan & {point: {lat: number; lng: number}}> = []
  for (const [i, p] of plans.entries()) {
    const placed = await placeOnLand(p.center, p.radius, p.row._id)
    if (placed.attempts > 1) moved++
    if (placed.fellBack) fellBack++
    results.push({...p, point: placed.point})
    if (!noLandCheck && (i + 1) % 25 === 0) {
      saveReverseCache()
      console.log(`  …${i + 1}/${plans.length}`)
    }
  }
  if (!noLandCheck) saveReverseCache()
  console.log(`land check: ${moved} moved off water, ${fellBack} fell back to the anchor point.`)

  console.log('\nSample:')
  for (const r of results.slice(0, 12)) {
    console.log(`  ${r.row._id.padEnd(40)} ${r.anchorKey.padEnd(26)} ${r.point.lat.toFixed(5)}, ${r.point.lng.toFixed(5)}  (${r.via})`)
  }

  if (isDry) {
    console.log('\nDry run — nothing written.')
    return
  }

  let written = 0
  for (const r of results) {
    const unchanged = r.row.lat === r.point.lat && r.row.lng === r.point.lng && r.row.precision === 'approximate'
    if (unchanged) continue
    await client
      .patch(r.row._id)
      .set({coordinatesLat: r.point.lat, coordinatesLng: r.point.lng, locationPrecision: 'approximate'})
      .commit()
    written++
  }
  console.log(`\nWrote ${written} listing(s); ${results.length - written} already in place.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.stack ?? e.message : e)
  process.exit(1)
})
