/**
 * Audit of every listing's map pin, 2026-10-10. The owner: "some pins are
 * crooked — in the sea or somewhere else; some houses light up and others
 * don't". Checks, per listing with coordinates:
 *
 *  (a) water — the pin sits in an OpenStreetMap water polygon (sea, lake,
 *      lagoon, river area; swimming pools ignored), exact and approximate;
 *  (b) far — outside Albania's bounding box; more than DISTRICT_MAX_M from the
 *      nearest anchor of its own district (geo-anchors.json); more than the
 *      city radius (15 km Durrës, 10 km elsewhere) from the city centroid
 *      unless the district anchor vouches for it;
 *  (c) exact pins: inside a building footprint of the z14 `building` layer
 *      (the map highlights a building only then); else the distance to the
 *      nearest footprint;
 *  (d) stacks — several listings on the identical coordinate;
 *  (e) published listings with no coordinates;
 *  plus live vs database: what https://www.domlivo.com/api/catalog/map-points
 *  serves now against what Sanity holds.
 *
 *   npx tsx scripts/auditListingCoordinates20261010.ts
 *   npx tsx scripts/auditListingCoordinates20261010.ts --out audit-2026-10-10-after.json --no-live
 *
 * Writes ../domlivo-workspace/geo/audit-2026-10-10.json (or --out name).
 */
import fs from 'node:fs'
import path from 'node:path'
import {getSanityClientForScripts} from './lib/sanityEnvClient'
import {buildingAt, buildingsNear, distanceM, tilesRead, waterAt} from './lib/geoTiles'

const args = process.argv.slice(2)
const outName = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'audit-2026-10-10.json'
const skipLive = args.includes('--no-live')

const WORKSPACE = path.resolve(process.cwd(), '../domlivo-workspace')
const OUT = path.join(WORKSPACE, 'geo', outName)
const anchorFile = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'scripts/data/geo-anchors.json'), 'utf8')) as {
  anchors: Array<{key: string; district?: string; lat: number; lng: number; radius: number}>
  districtCentroids: Record<string, {lat: number; lng: number; radius: number}>
  cityCentroids: Record<string, {lat: number; lng: number; radius: number}>
}

export const DISTRICT_MAX_M = 2500
export const CITY_MAX_M: Record<string, number> = {durres: 15_000}
export const CITY_MAX_DEFAULT_M = 10_000
export const BUILDING_SNAP_M = 30
const ALBANIA = {minLat: 39.6, maxLat: 42.7, minLng: 19.25, maxLng: 21.1}

export type AuditRow = {
  _id: string
  slug?: string
  isPublished?: boolean
  lifecycleStatus?: string
  status?: string
  lat: number
  lng: number
  precision?: string
  city?: string
  district?: string
  titleEn?: string
  addrSq?: string
  addrEn?: string
}

export const ROW_QUERY = `*[_type == "property" && !(_id in path("drafts.**")) && defined(coordinatesLat) && defined(coordinatesLng)]{
  _id, "slug": slug.current, isPublished, lifecycleStatus, status,
  "lat": coordinatesLat, "lng": coordinatesLng, "precision": locationPrecision,
  "city": city->slug.current, "district": district->slug.current,
  "titleEn": title.en, "addrSq": address.sq, "addrEn": address.en
} | order(_id asc)`

/** What the public map shows (yha publishedPropertyFilter + sale only). */
export function isVisible(r: Pick<AuditRow, 'isPublished' | 'lifecycleStatus' | 'status'>): boolean {
  return r.isPublished === true && (!r.lifecycleStatus || r.lifecycleStatus === 'active') && r.status === 'sale'
}

/** Every anchor of a district: the anchors table entries plus the district centroid. */
export function districtAnchors(district?: string) {
  if (!district) return []
  const out = anchorFile.anchors.filter((a) => a.district === district).map((a) => ({key: a.key, lat: a.lat, lng: a.lng, radius: a.radius}))
  const c = anchorFile.districtCentroids[district]
  if (c) out.push({key: `district:${district}`, lat: c.lat, lng: c.lng, radius: c.radius})
  return out
}

export function nearestOf<T extends {lat: number; lng: number}>(list: T[], p: {lat: number; lng: number}) {
  let best: (T & {distance: number}) | null = null
  for (const a of list) {
    const d = distanceM(a, p)
    if (!best || d < best.distance) best = {...a, distance: d}
  }
  return best
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export type Finding = {
  _id: string
  slug?: string
  visible: boolean
  precision: string
  city?: string
  district?: string
  lat: number
  lng: number
  water: string | null
  outsideAlbania: boolean
  cityDistanceM: number | null
  cityMaxM: number
  farFromCity: boolean
  districtAnchor: string | null
  districtDistanceM: number | null
  farFromDistrict: boolean
  nearestAnchor: {key: string; district?: string; distance: number} | null
  onBuilding: boolean | null
  nearestBuildingM: number | null
  stackSize: number
}

export async function auditRows(rows: AuditRow[]) {
  // City centroids: the editor's point from geo-anchors.json, else the median of the city's pins.
  const cityCentre = new Map<string, {lat: number; lng: number}>()
  const byCity = new Map<string, AuditRow[]>()
  for (const r of rows) if (r.city) byCity.set(r.city, [...(byCity.get(r.city) ?? []), r])
  for (const [city, list] of byCity) {
    const c = anchorFile.cityCentroids[city]
    cityCentre.set(city, c ? {lat: c.lat, lng: c.lng} : {lat: median(list.map((r) => r.lat)), lng: median(list.map((r) => r.lng))})
  }

  const stacks = new Map<string, string[]>()
  for (const r of rows) {
    const k = `${r.lat.toFixed(6)},${r.lng.toFixed(6)}`
    stacks.set(k, [...(stacks.get(k) ?? []), r._id])
  }

  const allAnchors = anchorFile.anchors.map((a) => ({key: a.key, district: a.district, lat: a.lat, lng: a.lng}))
  const findings: Finding[] = []
  for (const [i, r] of rows.entries()) {
    const p = {lat: r.lat, lng: r.lng}
    const water = await waterAt(r.lat, r.lng)
    const outsideAlbania = r.lat < ALBANIA.minLat || r.lat > ALBANIA.maxLat || r.lng < ALBANIA.minLng || r.lng > ALBANIA.maxLng
    const da = nearestOf(districtAnchors(r.district), p)
    const farFromDistrict = !!da && da.distance > DISTRICT_MAX_M
    const cc = r.city ? cityCentre.get(r.city) : undefined
    const cityDistanceM = cc ? distanceM(cc, p) : null
    const cityMaxM = (r.city && CITY_MAX_M[r.city]) || CITY_MAX_DEFAULT_M
    // A district anchor within reach vouches for a pin far from the city centre (Spille, Kavajë, Lalzit).
    const farFromCity = cityDistanceM !== null && cityDistanceM > cityMaxM && !(da && !farFromDistrict)
    const na = nearestOf(allAnchors, p)

    let onBuilding: boolean | null = null
    let nearestBuildingM: number | null = null
    if (r.precision === 'exact') {
      onBuilding = !!(await buildingAt(r.lat, r.lng))
      if (onBuilding) nearestBuildingM = 0
      else {
        const near = await buildingsNear(r.lat, r.lng, 150)
        nearestBuildingM = near.length ? Number(near[0].distance.toFixed(1)) : null
      }
    }

    findings.push({
      _id: r._id,
      slug: r.slug,
      visible: isVisible(r),
      precision: r.precision ?? 'none',
      city: r.city,
      district: r.district,
      lat: r.lat,
      lng: r.lng,
      water,
      outsideAlbania,
      cityDistanceM: cityDistanceM === null ? null : Math.round(cityDistanceM),
      cityMaxM,
      farFromCity,
      districtAnchor: da?.key ?? null,
      districtDistanceM: da ? Math.round(da.distance) : null,
      farFromDistrict,
      nearestAnchor: na ? {key: na.key, district: na.district, distance: Math.round(na.distance)} : null,
      onBuilding,
      nearestBuildingM,
      stackSize: stacks.get(`${r.lat.toFixed(6)},${r.lng.toFixed(6)}`)!.length,
    })
    if ((i + 1) % 100 === 0) console.log(`  …${i + 1}/${rows.length} (tiles ${tilesRead()})`)
  }
  return {findings, stacks, cityCentre}
}

export function summarise(findings: Finding[], stacks: Map<string, string[]>) {
  const precisionOf = new Map(findings.map((f) => [f._id, f.precision]))
  const count = (pred: (f: Finding) => boolean) => {
    const all = findings.filter(pred)
    return {
      all: all.length,
      visible: all.filter((f) => f.visible).length,
      exact: all.filter((f) => f.precision === 'exact').length,
      approximate: all.filter((f) => f.precision === 'approximate').length,
    }
  }
  const stackGroups = [...stacks.values()].filter((ids) => ids.length > 1)
  const exact = findings.filter((f) => f.precision === 'exact')
  return {
    listings: count(() => true),
    a_inWater: count((f) => !!f.water),
    b_outsideAlbania: count((f) => f.outsideAlbania),
    b_farFromDistrict: count((f) => f.farFromDistrict),
    b_farFromCity: count((f) => f.farFromCity),
    c_exact: exact.length,
    c_exactOnBuilding: exact.filter((f) => f.onBuilding).length,
    c_exactOffBuildingWithin30m: exact.filter((f) => !f.onBuilding && f.nearestBuildingM !== null && f.nearestBuildingM <= BUILDING_SNAP_M).length,
    c_exactOffBuildingBeyond30m: exact.filter((f) => !f.onBuilding && (f.nearestBuildingM === null || f.nearestBuildingM > BUILDING_SNAP_M)).length,
    c_exactVisibleOffBuilding: exact.filter((f) => f.visible && !f.onBuilding).length,
    d_stackGroups: stackGroups.length,
    d_listingsInStacks: stackGroups.reduce((n, g) => n + g.length, 0),
    d_approximateStackGroups: stackGroups.filter((g) => g.some((id) => precisionOf.get(id) === 'approximate')).length,
    d_approximateListingsInStacks: stackGroups.flat().filter((id) => precisionOf.get(id) === 'approximate').length,
    d_exactOnlyStackGroups: stackGroups.filter((g) => g.every((id) => precisionOf.get(id) === 'exact')).length,
    d_biggestStacks: stackGroups
      .sort((a, b) => b.length - a.length)
      .slice(0, 8)
      .map((g) => ({size: g.length, sample: g[0], precision: precisionOf.get(g[0])})),
  }
}

type LivePoint = {slug: string; lat: number; lng: number; approximate?: boolean}

async function compareLive(rows: AuditRow[]) {
  const res = await fetch('https://www.domlivo.com/api/catalog/map-points?locale=en', {
    headers: {'User-Agent': 'domlivo-admin geo audit (cyanidium1@gmail.com)'},
  })
  const headers = {age: res.headers.get('age'), cache: res.headers.get('x-vercel-cache'), date: res.headers.get('date')}
  const live = ((await res.json()) as {points: LivePoint[]}).points
  const bySlug = new Map(rows.map((r) => [r.slug, r]))
  const liveSlugs = new Set(live.map((p) => p.slug))
  const differ: Array<{slug: string; live: [number, number]; db: [number, number]; movedM: number; liveInWater: string | null}> = []
  let liveInWater = 0
  const liveInWaterSlugs: string[] = []
  for (const p of live) {
    const w = await waterAt(p.lat, p.lng)
    if (w) {
      liveInWater++
      liveInWaterSlugs.push(p.slug)
    }
    const r = bySlug.get(p.slug)
    if (r && (r.lat !== p.lat || r.lng !== p.lng)) {
      differ.push({slug: p.slug, live: [p.lat, p.lng], db: [r.lat, r.lng], movedM: Math.round(distanceM(p, r)), liveInWater: w})
    }
  }
  const visible = rows.filter(isVisible)
  return {
    fetchedAt: new Date().toISOString(),
    headers,
    livePoints: live.length,
    dbVisible: visible.length,
    inLiveNotVisibleInDb: live.filter((p) => !bySlug.has(p.slug) || !isVisible(bySlug.get(p.slug)!)).map((p) => p.slug),
    visibleInDbNotLive: visible.filter((r) => !liveSlugs.has(r.slug!)).map((r) => r.slug),
    coordinatesDiffer: differ.length,
    liveInWater,
    liveInWaterSlugs,
    differ,
  }
}

async function main() {
  const client = getSanityClientForScripts()
  const rows = await client.fetch<AuditRow[]>(ROW_QUERY)
  const missing = await client.fetch<Array<{_id: string; slug?: string; city?: string}>>(
    `*[_type == "property" && !(_id in path("drafts.**")) && isPublished == true
      && (!defined(coordinatesLat) || !defined(coordinatesLng))]{_id, "slug": slug.current, "city": city->slug.current}`,
  )
  console.log(`listings with coordinates: ${rows.length} (visible on the map: ${rows.filter(isVisible).length})`)

  const {findings, stacks, cityCentre} = await auditRows(rows)
  const summary = {...summarise(findings, stacks), e_publishedWithoutCoordinates: missing.length}
  console.log(`tiles read: ${tilesRead()}`)

  const live = skipLive ? null : await compareLive(rows)

  console.log('\n=== Summary ===')
  console.log(JSON.stringify(summary, null, 1))
  const show = (title: string, list: Finding[], fmt: (f: Finding) => string) => {
    if (!list.length) return
    console.log(`\n${title} (${list.length})`)
    for (const f of list.slice(0, 40)) console.log(`  ${f._id.padEnd(46)} ${f.precision.padEnd(11)} ${fmt(f)}`)
    if (list.length > 40) console.log(`  … ${list.length - 40} more in the JSON`)
  }
  show('(a) in water', findings.filter((f) => f.water), (f) => `${f.water} ${f.lat}, ${f.lng} ${f.district ?? ''}`)
  show('(b) outside Albania', findings.filter((f) => f.outsideAlbania), (f) => `${f.lat}, ${f.lng}`)
  show(
    '(b) far from district anchor',
    findings.filter((f) => f.farFromDistrict),
    (f) => `${f.district} ${(f.districtDistanceM! / 1000).toFixed(1)} km from ${f.districtAnchor}; nearest anchor ${f.nearestAnchor?.key} (${f.nearestAnchor?.district}) ${f.nearestAnchor?.distance} m`,
  )
  show('(b) far from city', findings.filter((f) => f.farFromCity), (f) => `${f.city}/${f.district ?? '—'} ${(f.cityDistanceM! / 1000).toFixed(1)} km`)
  show(
    '(c) exact pins off any building',
    findings.filter((f) => f.precision === 'exact' && !f.onBuilding).sort((a, b) => (a.nearestBuildingM ?? 999) - (b.nearestBuildingM ?? 999)),
    (f) => `${f.nearestBuildingM === null ? 'no building within 150 m' : `${f.nearestBuildingM} m to a building`}${f.visible ? '' : ' (not on the map)'}`,
  )
  if (live) {
    console.log('\n=== Live map vs database ===')
    const {differ, ...rest} = live
    console.log(JSON.stringify({...rest, differSample: differ.slice(0, 10)}, null, 1))
  }

  fs.mkdirSync(path.dirname(OUT), {recursive: true})
  fs.writeFileSync(
    OUT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        thresholds: {DISTRICT_MAX_M, CITY_MAX_M, CITY_MAX_DEFAULT_M, BUILDING_SNAP_M},
        cityCentres: Object.fromEntries(cityCentre),
        summary,
        publishedWithoutCoordinates: missing,
        stacks: [...stacks.entries()].filter(([, ids]) => ids.length > 1).map(([coord, ids]) => ({coord, ids})),
        live,
        findings,
      },
      null,
      1,
    ),
  )
  console.log(`\nWrote ${OUT}`)
}

// Run only when executed directly (the fix script imports the helpers above).
if (process.argv[1] && path.basename(process.argv[1]).startsWith('auditListingCoordinates')) {
  main().catch((e) => {
    console.error(e instanceof Error ? (e.stack ?? e.message) : e)
    process.exit(1)
  })
}
