/**
 * Measures `seaDistanceMeters` on the map for every listing that has
 * coordinates and no distance yet, so the "near the sea" filter
 * (seaDistanceMeters <= 300 or beachfront) covers the whole catalogue instead
 * of the ~100 listings whose copy states a distance (enrichSeaData.ts).
 *
 * Distance: straight-line metres from the pin to the nearest sea edge — the
 * OpenStreetMap coastline as the OpenFreeMap vector tiles carry it, layer
 * `water`, class `ocean` only. The Adriatic, the Ionian, the bays of Durrës,
 * Lalzi, Shëngjin and Vlorë and the port basin are `ocean`; the lagoons
 * (Karavasta, Patok, Narta, Ceka/Kune-Vain, Butrint) and lakes come as `lake`
 * and do not count. Probed 2026-10-11 at z14, z12 and z10.
 *
 *  - Searched at z14 (the map's deepest zoom) out to 5 km; beyond that at z12
 *    (generalised coastline, fine at that range) out to 20 km, the schema's
 *    maximum. Farther than 20 km (Tirana, Shkodër) stays unset: "not near the
 *    sea" needs no number, and the schema does not take one.
 *  - Rounded to 10 m for an exact pin and to 50 m for an approximate one (the
 *    pin is the district scatter, so the distance is only as good as that).
 *  - A distance already in the field came from the listing text or the
 *    partner feed and is never overwritten; where the map disagrees by a lot
 *    it is listed as a conflict.
 *  - A listing whose copy states a distance or says "first line" (any of the
 *    six locales, the same reading as enrichSeaData.ts) is left alone: what
 *    the partner says comes first, enrichSeaData.ts copies it into the field,
 *    and it only fills an empty field — a map value written here would block
 *    it for good. On those listings the map and the copy disagree often
 *    (approximate pins: the district scatter, not the building).
 *  - Text check: title/shortDescription/description in en, sq and ru are read
 *    for first-line wording, a stated distance and a sea view, and compared
 *    with the measured distance. Contradictions are reported, not changed.
 *  - Drafts are skipped (the four that exist carry no coordinates).
 *
 * The schema has no field that records where the distance came from, so the
 * backup file is the record of which values this script wrote:
 * ../domlivo-workspace/geo/sea-distance-backup-<stamp>.json.
 *
 *   npx tsx scripts/computeSeaDistance20261011.ts --dry [--no-spot]
 *   npx tsx scripts/computeSeaDistance20261011.ts --execute
 */
import fs from 'node:fs'
import path from 'node:path'
import {getSanityClientForScripts} from './lib/sanityEnvClient'
import {nearestWater, tilesRead} from './lib/geoTiles'
import {firstLinePhrase, readDistance, seaViewPhrase} from './lib/seaText'

const args = process.argv.slice(2)
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')
const runSpot = isDry && !args.includes('--no-spot')
if (isDry === isExecute) {
  console.error('Use --dry or --execute.')
  process.exit(1)
}

const OCEAN = new Set(['ocean'])
const NEAR_Z14_M = 5000
const FAR_Z12_M = 20000
const NEAR_SEA_M = 300
const WORKSPACE_GEO = path.resolve(process.cwd(), '../domlivo-workspace/geo')
const USER_AGENT = 'domlivo-admin sea distance check (+https://www.domlivo.com)'

type Row = {
  _id: string
  _rev: string
  slug?: string
  isPublished?: boolean
  city?: string
  district?: string
  lat: number
  lng: number
  precision?: string
  seaDistanceMeters?: number | null
  beachfront?: boolean | null
  titleEn?: string
  texts: Array<string | null>
  textsAll: Array<string | null>
}

type Measured = {
  row: Row
  raw: number | null
  rounded: number | null
  zoom: 14 | 12 | null
  seaPoint: {lat: number; lng: number} | null
  text: {firstLine: string | null; seaView: string | null; stated: {meters: number; phrase: string} | null}
  /** Stated distance or first-line wording in any locale: the copy speaks, the map does not write. */
  textClaim: boolean
}

const BUCKETS: Array<[string, (d: number) => boolean]> = [
  ['<=100', (d) => d <= 100],
  ['<=300', (d) => d > 100 && d <= 300],
  ['<=500', (d) => d > 300 && d <= 500],
  ['<=1000', (d) => d > 500 && d <= 1000],
  ['<=3000', (d) => d > 1000 && d <= 3000],
  ['>3000', (d) => d > 3000],
]

function bucketOf(d: number | null | undefined): string {
  if (typeof d !== 'number') return 'unset'
  return BUCKETS.find(([, test]) => test(d))![0]
}

function roundFor(d: number, precision?: string): number {
  const step = precision === 'exact' ? 10 : 50
  return Math.round(d / step) * step
}

async function measure(lat: number, lng: number) {
  const near = (await nearestWater(lat, lng, 1500, OCEAN, 14)) ?? (await nearestWater(lat, lng, NEAR_Z14_M, OCEAN, 14))
  if (near) return {...near, zoom: 14 as const}
  const far = await nearestWater(lat, lng, FAR_Z12_M, OCEAN, 12)
  if (far) return {...far, zoom: 12 as const}
  return null
}

/* ---------- Nominatim (1 request a second, cached) ---------- */

const REVERSE_CACHE = path.join(WORKSPACE_GEO, 'reverse-spotcheck-cache.json')
type Answer = {display?: string; category?: string; type?: string; name?: string; road?: string; suburb?: string}
const reverseCache: Record<string, Answer> = fs.existsSync(REVERSE_CACHE)
  ? JSON.parse(fs.readFileSync(REVERSE_CACHE, 'utf8'))
  : {}
let lastRequest = 0

async function reverse(lat: number, lng: number): Promise<Answer> {
  const key = `${lat.toFixed(6)},${lng.toFixed(6)}`
  if (reverseCache[key]) return reverseCache[key]
  const wait = 1100 - (Date.now() - lastRequest)
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastRequest = Date.now()
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat.toFixed(6)}&lon=${lng.toFixed(6)}&format=jsonv2&zoom=18&addressdetails=1`,
    {headers: {'User-Agent': USER_AGENT, 'Accept-Language': 'en'}},
  )
  const j = (await res.json()) as {display_name?: string; category?: string; type?: string; name?: string; address?: Record<string, string>}
  const a = j.address ?? {}
  reverseCache[key] = {
    display: j.display_name?.split(',').slice(0, 4).join(',').trim(),
    category: j.category,
    type: j.type,
    name: j.name || undefined,
    road: a.road ?? a.pedestrian ?? a.footway,
    suburb: a.suburb ?? a.neighbourhood ?? a.quarter ?? a.village ?? a.town,
  }
  fs.writeFileSync(REVERSE_CACHE, JSON.stringify(reverseCache, null, 1))
  return reverseCache[key]
}

const describe = (a: Answer) =>
  `${a.category}/${a.type}${a.name ? ` "${a.name}"` : ''} — ${a.road ?? '(no road)'}, ${a.suburb ?? ''}`.trim()

/* ---------- report helpers ---------- */

function table(title: string, rows: Measured[], valueOf: (m: Measured) => number | null | undefined) {
  const byCity = new Map<string, Record<string, number>>()
  for (const m of rows) {
    const city = m.row.city ?? '-'
    const counts = byCity.get(city) ?? {}
    const b = bucketOf(valueOf(m))
    counts[b] = (counts[b] ?? 0) + 1
    counts.total = (counts.total ?? 0) + 1
    byCity.set(city, counts)
  }
  const cols = [...BUCKETS.map(([k]) => k), 'unset', 'total']
  console.log(`\n${title}`)
  console.log(`  ${'city'.padEnd(10)}${cols.map((c) => c.padStart(8)).join('')}`)
  const sum: Record<string, number> = {}
  for (const [city, counts] of [...byCity].sort((a, b) => (b[1].total ?? 0) - (a[1].total ?? 0))) {
    console.log(`  ${city.padEnd(10)}${cols.map((c) => String(counts[c] ?? 0).padStart(8)).join('')}`)
    for (const c of cols) sum[c] = (sum[c] ?? 0) + (counts[c] ?? 0)
  }
  console.log(`  ${'all'.padEnd(10)}${cols.map((c) => String(sum[c] ?? 0).padStart(8)).join('')}`)
}

function nearSeaTable(rows: Measured[], after: (m: Measured) => number | null | undefined) {
  const byCity = new Map<string, {before: number; after: number; beforePub: number; afterPub: number; total: number}>()
  const isNear = (d: number | null | undefined, beach?: boolean | null) => beach === true || (typeof d === 'number' && d <= NEAR_SEA_M)
  for (const m of rows) {
    const city = m.row.city ?? '-'
    const c = byCity.get(city) ?? {before: 0, after: 0, beforePub: 0, afterPub: 0, total: 0}
    const b = isNear(m.row.seaDistanceMeters, m.row.beachfront)
    const a = isNear(after(m), m.row.beachfront)
    c.total++
    if (b) c.before++
    if (a) c.after++
    if (b && m.row.isPublished) c.beforePub++
    if (a && m.row.isPublished) c.afterPub++
    byCity.set(city, c)
  }
  console.log(`\nnearSea (<= ${NEAR_SEA_M} m or beachfront), before -> after (published only in brackets)`)
  for (const [city, c] of [...byCity].sort((a, b) => b[1].total - a[1].total)) {
    console.log(`  ${city.padEnd(10)} ${String(c.before).padStart(4)} -> ${String(c.after).padStart(4)}   (${c.beforePub} -> ${c.afterPub})  of ${c.total}`)
  }
}

/* ---------- main ---------- */

async function main() {
  const client = getSanityClientForScripts()
  const rows = await client.fetch<Row[]>(`*[_type == "property" && !(_id in path("drafts.**"))
    && defined(coordinatesLat) && defined(coordinatesLng)]{
    _id, _rev, "slug": slug.current, isPublished, "city": city->slug.current, "district": district->slug.current,
    "lat": coordinatesLat, "lng": coordinatesLng, "precision": locationPrecision, seaDistanceMeters, beachfront,
    "titleEn": title.en,
    "texts": [title.en, title.sq, title.ru, shortDescription.en, shortDescription.sq, shortDescription.ru,
      description.en, description.sq, description.ru],
    "textsAll": [title.en, title.sq, title.ru, title.uk, title.it, title.pl,
      shortDescription.en, shortDescription.sq, shortDescription.ru, shortDescription.uk, shortDescription.it, shortDescription.pl,
      description.en, description.sq, description.ru, description.uk, description.it, description.pl]
  } | order(_id asc)`)
  console.log(`listings with coordinates: ${rows.length} (published ${rows.filter((r) => r.isPublished).length})`)

  const measured: Measured[] = []
  for (const row of rows) {
    const hit = await measure(row.lat, row.lng)
    const texts = row.texts.filter((t): t is string => typeof t === 'string' && t.length > 0)
    const textsAll = row.textsAll.filter((t): t is string => typeof t === 'string' && t.length > 0)
    measured.push({
      row,
      raw: hit ? hit.distance : null,
      rounded: hit ? roundFor(hit.distance, row.precision) : null,
      zoom: hit ? hit.zoom : null,
      seaPoint: hit ? {lat: hit.lat, lng: hit.lng} : null,
      text: {firstLine: firstLinePhrase(texts), seaView: seaViewPhrase(texts), stated: readDistance(texts)},
      textClaim: Boolean(readDistance(textsAll) || firstLinePhrase(textsAll)),
    })
  }
  console.log(`tiles read: ${tilesRead()}`)

  const hasValue = (m: Measured) => typeof m.row.seaDistanceMeters === 'number'
  const willWrite = (m: Measured) => !hasValue(m) && !m.textClaim && m.rounded !== null
  const toWrite = measured.filter(willWrite)
  const textLeft = measured.filter((m) => !hasValue(m) && m.textClaim)
  const farUnset = measured.filter((m) => !hasValue(m) && !m.textClaim && m.rounded === null)
  const kept = measured.filter(hasValue)
  const after = (m: Measured) => (hasValue(m) ? m.row.seaDistanceMeters : willWrite(m) ? m.rounded : null)

  console.log(`\nto write: ${toWrite.length} (z14 ${toWrite.filter((m) => m.zoom === 14).length}, z12 ${toWrite.filter((m) => m.zoom === 12).length})`)
  console.log(`kept (already set from text/partner): ${kept.length}`)
  console.log(`left for enrichSeaData.ts (copy states a distance or first line, field empty): ${textLeft.length} (published ${textLeft.filter((m) => m.row.isPublished).length})`)
  console.log(`no sea within ${FAR_Z12_M / 1000} km, left unset: ${farUnset.length} — ${[...new Set(farUnset.map((m) => m.row.city))].join(', ')}`)

  table('BEFORE — seaDistanceMeters by city', measured, (m) => m.row.seaDistanceMeters)
  table('AFTER — kept values + written', measured, after)
  table('MEASURED for every listing (incl. the kept ones, for comparison)', measured, (m) => m.rounded)
  nearSeaTable(measured, after)

  /* conflicts: kept value vs map */
  const conflicts = kept
    .filter((m) => m.rounded !== null)
    .map((m) => ({m, stated: m.row.seaDistanceMeters as number, map: m.rounded as number}))
    .filter(({stated, map}) => map > Math.max(3 * stated, stated + 300) || stated > map + 500)
    .sort((a, b) => b.map - b.stated - (a.map - a.stated))
  console.log(`\nkept values the map disagrees with (map > max(3x, +300 m) or text > map + 500 m): ${conflicts.length} of ${kept.length}`)
  for (const {m, stated, map} of conflicts) {
    console.log(`  ${m.row._id.padEnd(46)} ${(m.row.district ?? m.row.city ?? '').padEnd(20)} ${m.row.precision?.padEnd(11)} field ${stated} m, map ${map} m`)
  }

  /* text vs map */
  const fl = measured.filter((m) => m.text.firstLine)
  const sv = measured.filter((m) => m.text.seaView)
  const st = measured.filter((m) => m.text.stated)
  const effective = (m: Measured) => m.rounded
  console.log(`\nTEXT (en/sq/ru) vs MAP`)
  console.log(`  first line in text: ${fl.length}; by map distance: ${JSON.stringify(countBy(fl, (m) => bucketOf(effective(m))))}`)
  console.log(`  stated distance in text: ${st.length}; by map distance: ${JSON.stringify(countBy(st, (m) => bucketOf(effective(m))))}`)
  console.log(`  sea view in text: ${sv.length}; by map distance: ${JSON.stringify(countBy(sv, (m) => bucketOf(effective(m))))}`)

  const flBad = fl.filter((m) => m.rounded === null || m.rounded > NEAR_SEA_M).sort((a, b) => (b.rounded ?? 1e9) - (a.rounded ?? 1e9))
  console.log(`\n  first line in text, map > ${NEAR_SEA_M} m: ${flBad.length} (exact ${flBad.filter((m) => m.row.precision === 'exact').length})`)
  for (const m of flBad) {
    console.log(`    ${m.row._id.padEnd(46)} ${(m.row.district ?? m.row.city ?? '').padEnd(20)} ${m.row.precision?.padEnd(11)} map ${m.rounded ?? '>20000'} m  beachfront=${m.row.beachfront ?? '-'}  "${m.text.firstLine}"`)
  }
  const stBad = st
    .filter((m) => m.rounded !== null)
    .filter((m) => {
      const n = m.text.stated!.meters
      const d = m.rounded as number
      return d > Math.max(3 * n, n + 300) || n > d + 500
    })
    .sort((a, b) => (b.rounded as number) - b.text.stated!.meters - ((a.rounded as number) - a.text.stated!.meters))
  console.log(`\n  stated distance vs map, off by more than max(3x, +300 m) or text > map + 500 m: ${stBad.length} (exact ${stBad.filter((m) => m.row.precision === 'exact').length})`)
  for (const m of stBad) {
    console.log(`    ${m.row._id.padEnd(46)} ${(m.row.district ?? m.row.city ?? '').padEnd(20)} ${m.row.precision?.padEnd(11)} text ${m.text.stated!.meters} m, map ${m.rounded} m  "${m.text.stated!.phrase.trim()}"`)
  }
  const svFar = sv.filter((m) => m.rounded === null || m.rounded > 3000)
  console.log(`\n  sea view in text, map > 3 km: ${svFar.length} (a view from a hill is possible; listed only)`)
  for (const m of svFar) {
    console.log(`    ${m.row._id.padEnd(46)} ${(m.row.district ?? m.row.city ?? '').padEnd(20)} ${m.row.precision?.padEnd(11)} map ${m.rounded ?? '>20000'} m  "${m.text.seaView}"`)
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  fs.mkdirSync(WORKSPACE_GEO, {recursive: true})
  const plan = measured.map((m) => ({
    _id: m.row._id,
    slug: m.row.slug,
    city: m.row.city,
    district: m.row.district,
    precision: m.row.precision,
    lat: m.row.lat,
    lng: m.row.lng,
    current: m.row.seaDistanceMeters ?? null,
    measuredRaw: m.raw === null ? null : Math.round(m.raw),
    measured: m.rounded,
    zoom: m.zoom,
    seaPoint: m.seaPoint && {lat: Number(m.seaPoint.lat.toFixed(6)), lng: Number(m.seaPoint.lng.toFixed(6))},
    write: willWrite(m),
    textClaim: m.textClaim,
    text: m.text,
  }))

  if (runSpot) await spotChecks(measured)

  if (isDry) {
    const file = path.join(WORKSPACE_GEO, `sea-distance-plan-${stamp}.json`)
    fs.writeFileSync(file, JSON.stringify(plan, null, 1))
    console.log(`\nDry run — nothing written. Plan: ${file}`)
    return
  }

  const backupFile = path.join(WORKSPACE_GEO, `sea-distance-backup-${stamp}.json`)
  const backup = {
    script: 'scripts/computeSeaDistance20261011.ts',
    note: 'seaDistanceMeters measured on the map by this script; the field was empty on every written document. Undo: unset seaDistanceMeters on these ids.',
    written: toWrite.map((m) => ({_id: m.row._id, _rev: m.row._rev, old: m.row.seaDistanceMeters ?? null, new: m.rounded, zoom: m.zoom, precision: m.row.precision})),
    transactions: [] as string[],
  }
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 1))
  for (let i = 0; i < toWrite.length; i += 50) {
    const tx = client.transaction()
    for (const m of toWrite.slice(i, i + 50)) {
      tx.patch(m.row._id, (p) => p.ifRevisionId(m.row._rev).set({seaDistanceMeters: m.rounded}))
    }
    const res = await tx.commit()
    backup.transactions.push(res.transactionId)
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 1))
    console.log(`batch ${i / 50 + 1}: ${res.transactionId}`)
  }
  console.log(`\nWrote seaDistanceMeters on ${toWrite.length} listing(s). Backup: ${backupFile}`)
}

function countBy<T>(items: T[], key: (t: T) => string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const t of items) out[key(t)] = (out[key(t)] ?? 0) + 1
  return out
}

/** Ten listings described in words: the pin and the sea point it was measured to. */
async function spotChecks(measured: Measured[]) {
  const pick = (label: string, test: (m: Measured) => boolean) => {
    const m = measured.find((x) => test(x) && !chosen.has(x.row._id))
    if (m) chosen.set(m.row._id, {label, m})
  }
  const chosen = new Map<string, {label: string; m: Measured}>()
  const exact = (m: Measured) => m.row.precision === 'exact'
  const written = (m: Measured) => typeof m.row.seaDistanceMeters !== 'number' && !m.textClaim && m.rounded !== null
  pick('Plazh, first line in text', (m) => m.row.district === 'plazh' && !!m.text.firstLine && exact(m))
  pick('Plazh, first line in text', (m) => m.row.district === 'plazh' && !!m.text.firstLine)
  pick('Plazh, written, exact', (m) => m.row.district === 'plazh' && written(m) && exact(m))
  pick('Golem, written, exact', (m) => m.row.district === 'golem-durres' && written(m) && exact(m))
  pick('Golem, written, approximate', (m) => m.row.district === 'golem-durres' && written(m) && !exact(m))
  pick('Durrës centre, written', (m) => m.row.district === 'city-center-durres' && written(m) && exact(m))
  pick('Tirana', (m) => m.row.city === 'tirana')
  pick('Shëngjin, written', (m) => m.row.city === 'shengjin' && written(m))
  pick('Sarandë, written', (m) => m.row.city === 'sarande' && written(m))
  pick('Vlorë, written', (m) => m.row.city === 'vlore' && written(m))
  pick('Durrës inland, written', (m) => m.row.city === 'durres' && written(m) && (m.rounded ?? 0) > 2000)
  const list = [...chosen.values()]
  // Keep one per label, then fill to ten.
  const seen = new Set<string>()
  const ten = list.filter((c) => !seen.has(c.label) && seen.add(c.label)).slice(0, 10)
  console.log(`\nSPOT CHECKS (Nominatim reverse, zoom 18)`)
  for (const {label, m} of ten) {
    const pin = await reverse(m.row.lat, m.row.lng)
    const sea = m.seaPoint ? await reverse(m.seaPoint.lat, m.seaPoint.lng) : null
    console.log(`\n[${label}] ${m.row._id} (${m.row.precision}) — ${m.row.titleEn ?? ''}`)
    console.log(`   field now ${m.row.seaDistanceMeters ?? 'unset'}, map ${m.rounded ?? '>20000'} m (raw ${m.raw === null ? '-' : Math.round(m.raw)}, z${m.zoom ?? '-'})`)
    console.log(`   pin ${m.row.lat},${m.row.lng}: ${describe(pin)}`)
    if (sea && m.seaPoint) console.log(`   sea ${m.seaPoint.lat.toFixed(6)},${m.seaPoint.lng.toFixed(6)}: ${describe(sea)}`)
    if (m.text.firstLine || m.text.stated) console.log(`   text: ${m.text.firstLine ? `first line "${m.text.firstLine}" ` : ''}${m.text.stated ? `stated ${m.text.stated.meters} m` : ''}`)
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? (e.stack ?? e.message) : e)
  process.exit(1)
})
