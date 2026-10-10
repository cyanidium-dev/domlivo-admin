/**
 * Fixes the map pins auditListingCoordinates20261010.ts flags as safely
 * fixable, 2026-10-10:
 *
 *  1. water — an approximate pin in a water polygon moves to the nearest
 *     solid land (as movePinsOutOfWater20261010.ts does). An exact pin in water
 *     is only listed, unless a building lies within 30 m (rule 3 snaps it).
 *  2. far — an approximate pin far from its district (or, without a district,
 *     far from its city) is re-placed with the placement script's scatter
 *     around the best anchor of its own district: an anchor of that district
 *     whose name appears in the partner label, address or title, else the
 *     district centroid; without a district, the city centroid. A pin that
 *     sits on an anchor its own text names (a partner label that disagrees
 *     with the Sanity district) is left and listed: the district field is the
 *     suspect there, not the pin.
 *  3. building — an exact pin within SNAP_SAFE_M (12 m) of a building
 *     footprint but on none moves just inside the nearest footprint: to its centroid when that is
 *     inside and within 30 m, else to the nearest point with 2 m of building
 *     around it. The point is re-tested in the tile the map renders it from,
 *     so the building highlights. Two different buildings at about the same
 *     distance (within 3 m of each other) make the pick a coin toss; those
 *     are left and listed unless the pin is within 5 m of the nearer one.
 *     Pins 12–30 m from the nearest footprint are listed, not moved: the
 *     spot check on 2026-10-10 found every one of them was a new complex that
 *     OpenStreetMap does not have as a building (Desla Tower is mapped as a
 *     construction site; Liburna, and two "new building, Golem" flats, sit
 *     25 m from small houses traced from Microsoft footprints), so snapping
 *     would light up the neighbour's house.
 *  4. stacks — approximate pins sharing one coordinate are scattered
 *     deterministically within their anchor's radius, on land.
 *
 * Exact pins farther than 12 m from any building are never moved.
 * Every write is backed up first to ../domlivo-workspace/geo/fix-backup-<ts>.json.
 * A draft of a patched listing gets the same coordinates.
 *
 *   npx tsx scripts/fixListingCoordinates20261010.ts --dry
 *   npx tsx scripts/fixListingCoordinates20261010.ts --execute
 */
import fs from 'node:fs'
import path from 'node:path'
import {getSanityClientForScripts} from './lib/sanityEnvClient'
import {
  buildingAt,
  buildingsNear,
  centroid,
  distanceM,
  nearestInteriorPoint,
  nearestLand,
  polygonContains,
  scatterOnLand,
  waterAt,
  type Polygon,
} from './lib/geoTiles'
import {
  BUILDING_SNAP_M,
  ROW_QUERY,
  auditRows,
  districtAnchors,
  nearestOf,
  type AuditRow,
  type Finding,
} from './auditListingCoordinates20261010'

const args = process.argv.slice(2)
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')
if (!isDry && !isExecute) {
  console.error('Use --dry or --execute.')
  process.exit(1)
}

const WORKSPACE = path.resolve(process.cwd(), '../domlivo-workspace')
const anchorFile = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'scripts/data/geo-anchors.json'), 'utf8')) as {
  anchors: Array<{key: string; district?: string; lat: number; lng: number; radius: number; match: string[]}>
  districtCentroids: Record<string, {lat: number; lng: number; radius: number}>
  cityCentroids: Record<string, {lat: number; lng: number; radius: number}>
}

const SNAP_SAFE_M = 12
const AMBIGUOUS_GAP_M = 3
const AMBIGUOUS_OK_WITHIN_M = 5
const STACK_RADIUS_CAP_M = 400

/* ---------- text matching (same normalisation as placePartnerListingCoordinates.ts) ---------- */

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
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
function mentions(text: string, match: string[], minLen: number): boolean {
  const t = norm(text)
  return match.map(norm).some((m) => m.length >= minLen && new RegExp(`(^|\\s)${escapeRe(m)}(\\s|$|\\.)`).test(t))
}

function loadPartnerLabels(): Map<string, string> {
  const out = new Map<string, string>()
  const getal = path.join(WORKSPACE, 'getal', 'getal-listings.json')
  if (fs.existsSync(getal)) {
    for (const r of JSON.parse(fs.readFileSync(getal, 'utf8')) as Array<{id: string; districtLabel?: string}>)
      if (r.districtLabel) out.set(`property-getal-${r.id}`, r.districtLabel)
  }
  for (const file of ['findall-sale.json', 'findall-rent.json']) {
    const p = path.join(WORKSPACE, 'findall', file)
    if (!fs.existsSync(p)) continue
    for (const r of JSON.parse(fs.readFileSync(p, 'utf8')) as Array<{id: number; address?: string}>)
      if (r.address) out.set(`property-findall-${r.id}`, r.address)
  }
  return out
}

/* ---------- plans ---------- */

type Move = {
  _id: string
  slug?: string
  rule: 'water' | 'far' | 'building' | 'stack'
  precision: string
  from: {lat: number; lng: number}
  to: {lat: number; lng: number}
  movedM: number
  note: string
}
type Left = {_id: string; slug?: string; rule: string; precision: string; visible: boolean; lat: number; lng: number; reason: string}

async function planBuildingSnap(f: Finding): Promise<{to?: {lat: number; lng: number}; note: string}> {
  const near = await buildingsNear(f.lat, f.lng, BUILDING_SNAP_M)
  if (!near.length) return {note: `no building within ${BUILDING_SNAP_M} m`}
  const first = near[0]
  const c1 = centroid(first.poly)
  // A second, different building about as close: the same building clipped
  // into a neighbouring tile overlaps the first, so it does not count.
  const rival = near.slice(1).find((n) => {
    const c2 = centroid(n.poly)
    return !polygonContains(first.poly, c2.lng, c2.lat) && !polygonContains(n.poly, c1.lng, c1.lat)
  })
  const ambiguous = !!rival && rival.distance - first.distance < AMBIGUOUS_GAP_M && first.distance > AMBIGUOUS_OK_WITHIN_M
  if (ambiguous) {
    return {note: `ambiguous: buildings at ${first.distance.toFixed(1)} m and ${rival!.distance.toFixed(1)} m`}
  }
  const candidates: Array<{lat: number; lng: number; how: string}> = []
  const c = {lat: Number(c1.lat.toFixed(6)), lng: Number(c1.lng.toFixed(6))}
  if (polygonContains(first.poly, c.lng, c.lat) && distanceM(c, f) <= BUILDING_SNAP_M) candidates.push({...c, how: 'centroid'})
  for (const inset of [2, 1]) {
    const p = nearestInteriorPoint(first.poly as Polygon, f.lat, f.lng, inset)
    if (p) candidates.push({lat: p.lat, lng: p.lng, how: `nearest interior point (${inset} m inset)`})
  }
  for (const cand of candidates) {
    if (await buildingAt(cand.lat, cand.lng)) {
      return {to: {lat: cand.lat, lng: cand.lng}, note: `${cand.how}; building was ${first.distance.toFixed(1)} m away`}
    }
  }
  return {note: `building ${first.distance.toFixed(1)} m away but no interior point re-tested inside`}
}

async function main() {
  const client = getSanityClientForScripts()
  const rows = await client.fetch<AuditRow[]>(ROW_QUERY)
  const byId = new Map(rows.map((r) => [r._id, r]))
  const labels = loadPartnerLabels()
  const cityOfDistrict = new Map(
    (await client.fetch<Array<{d: string; c?: string}>>(`*[_type == "district" && !(_id in path("drafts.**"))]{"d": slug.current, "c": city->slug.current}`))
      .filter((x) => x.d && x.c)
      .map((x) => [x.d, x.c!]),
  )
  console.log(`listings with coordinates: ${rows.length}; auditing…`)
  const {findings, stacks} = await auditRows(rows)

  const moves: Move[] = []
  const left: Left[] = []
  const planned = new Set<string>()
  const add = (m: Move) => {
    moves.push(m)
    planned.add(m._id)
  }
  const leave = (f: Finding, rule: string, reason: string) =>
    left.push({_id: f._id, slug: f.slug, rule, precision: f.precision, visible: f.visible, lat: f.lat, lng: f.lng, reason})

  // 2. far approximate pins (before water: a re-placed pin is land-checked anyway)
  for (const f of findings.filter((x) => x.precision !== 'exact' && (x.farFromDistrict || x.farFromCity || x.outsideAlbania))) {
    const r = byId.get(f._id)!
    const text = [labels.get(f._id), r.addrSq, r.addrEn, r.titleEn].filter(Boolean).join(' \n ')
    const own = anchorFile.anchors.filter((a) => f.district && a.district === f.district && mentions(text, a.match, 3))
    let target: {key: string; lat: number; lng: number; radius: number} | null = null
    if (own.length) target = own[0]
    else {
      // Does the listing's own text name the anchor the pin sits on? Then the district field is wrong, not the pin.
      const explaining = anchorFile.anchors.find((a) => mentions(text, a.match, 4) && distanceM(a, f) <= a.radius + 150)
      if (explaining && f.district) {
        leave(f, 'far', `pin sits on anchor "${explaining.key}" (${explaining.district}) that its own text names; Sanity district "${f.district}" is the suspect`)
        continue
      }
      // Without a district: a place of the listing's own city that its text names, as the placement script picks it.
      const cityAnchor = !f.district
        ? anchorFile.anchors.find((a) => a.district && cityOfDistrict.get(a.district) === f.city && mentions(text, a.match, 4))
        : undefined
      const dc = f.district ? anchorFile.districtCentroids[f.district] : undefined
      const cc = f.city ? anchorFile.cityCentroids[f.city] : undefined
      if (cityAnchor) target = cityAnchor
      else if (dc) target = {key: `district:${f.district}`, ...dc}
      else if (cc) target = {key: `city:${f.city}`, ...cc}
    }
    if (!target) {
      leave(f, 'far', 'no anchor for its district or city')
      continue
    }
    const p = await scatterOnLand(target, target.radius, f._id)
    if (!p) {
      leave(f, 'far', `no land point within ${target.radius} m of ${target.key}`)
      continue
    }
    add({
      _id: f._id,
      slug: f.slug,
      rule: 'far',
      precision: f.precision,
      from: {lat: f.lat, lng: f.lng},
      to: {lat: p.lat, lng: p.lng},
      movedM: Math.round(distanceM(f, p)),
      note: `re-placed around ${target.key} (r ${target.radius} m); was ${f.districtDistanceM ?? '—'} m from district anchor ${f.districtAnchor ?? '—'}, ${f.cityDistanceM} m from the ${f.city} centre`,
    })
  }
  for (const f of findings.filter((x) => x.precision === 'exact' && (x.farFromDistrict || x.farFromCity || x.outsideAlbania))) {
    leave(f, 'far', `exact pin ${((f.districtDistanceM ?? f.cityDistanceM ?? 0) / 1000).toFixed(1)} km from ${f.districtAnchor ?? f.city}; nearest anchor ${f.nearestAnchor?.key} (${f.nearestAnchor?.district}) ${f.nearestAnchor?.distance} m — check the district field`)
  }

  // 1. water
  for (const f of findings.filter((x) => x.water && !planned.has(x._id))) {
    if (f.precision === 'exact') continue // rule 3 may snap it onto a building
    const to = await nearestLand(f.lat, f.lng)
    if (!to) {
      leave(f, 'water', 'no solid land within 1.5 km')
      continue
    }
    add({_id: f._id, slug: f.slug, rule: 'water', precision: f.precision, from: f, to, movedM: to.distance, note: `${f.water} → nearest land`})
  }

  // 3. exact pins off a building
  for (const f of findings.filter((x) => x.precision === 'exact' && !x.onBuilding && !planned.has(x._id))) {
    if (f.nearestBuildingM === null || f.nearestBuildingM > BUILDING_SNAP_M) {
      leave(f, 'building', f.nearestBuildingM === null ? 'no building footprint within 150 m in OpenStreetMap' : `nearest building ${f.nearestBuildingM} m away`)
      if (f.water) leave(f, 'water', 'exact pin in water, no building within 30 m')
      continue
    }
    if (f.nearestBuildingM > SNAP_SAFE_M) {
      leave(f, 'building', `nearest building ${f.nearestBuildingM} m away (12–30 m: probably a neighbour, the complex itself is not in OSM)`)
      if (f.water) leave(f, 'water', `exact pin in water, nearest building ${f.nearestBuildingM} m`)
      continue
    }
    const plan = await planBuildingSnap(f)
    if (!plan.to) {
      leave(f, 'building', plan.note)
      continue
    }
    add({
      _id: f._id,
      slug: f.slug,
      rule: 'building',
      precision: f.precision,
      from: {lat: f.lat, lng: f.lng},
      to: plan.to,
      movedM: Math.round(distanceM(f, plan.to) * 10) / 10,
      note: plan.note,
    })
  }

  // 4. stacked approximate pins
  const precisionOf = new Map(findings.map((f) => [f._id, f]))
  for (const [coord, ids] of stacks) {
    if (ids.length < 2) continue
    const approx = ids.filter((id) => precisionOf.get(id)!.precision !== 'exact' && !planned.has(id))
    if (!approx.length) continue
    const [lat, lng] = coord.split(',').map(Number)
    for (const id of approx) {
      const f = precisionOf.get(id)!
      const own = districtAnchors(f.district)
      const anchor = nearestOf(own.length ? own : anchorFile.anchors, {lat, lng})
      const center = anchor && anchor.distance <= anchor.radius + 200 ? anchor : {lat, lng, radius: 250, key: 'stack point'}
      const radius = Math.min(center.radius, STACK_RADIUS_CAP_M)
      const p = await scatterOnLand(center, radius, id)
      if (!p) {
        leave(f, 'stack', `no land point within ${radius} m`)
        continue
      }
      add({_id: id, slug: f.slug, rule: 'stack', precision: f.precision, from: {lat, lng}, to: p, movedM: Math.round(distanceM({lat, lng}, p)), note: `scattered around ${center.key} (r ${radius} m), stack of ${ids.length}`})
    }
  }

  // Final checks on every target.
  for (const m of moves) {
    const w = await waterAt(m.to.lat, m.to.lng)
    if (w) throw new Error(`${m._id}: target ${m.to.lat},${m.to.lng} is in ${w}`)
    if (m.rule === 'building' && !(await buildingAt(m.to.lat, m.to.lng))) throw new Error(`${m._id}: target is not on a building`)
  }

  const tally = (list: Array<{rule: string}>) => list.reduce<Record<string, number>>((o, x) => ((o[x.rule] = (o[x.rule] ?? 0) + 1), o), {})
  console.log(`\nMoves: ${moves.length}`, tally(moves))
  for (const m of moves) console.log(`  [${m.rule}] ${m._id.padEnd(46)} ${m.from.lat},${m.from.lng} -> ${m.to.lat},${m.to.lng} (${m.movedM} m) ${m.note}`)
  console.log(`\nLeft: ${left.length}`, tally(left))
  for (const l of left) console.log(`  [${l.rule}] ${l._id.padEnd(46)} ${l.precision}${l.visible ? '' : ' (not on the map)'} ${l.lat},${l.lng} — ${l.reason}`)

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const planFile = path.join(WORKSPACE, 'geo', `fix-${isDry ? 'plan' : 'backup'}-${stamp}.json`)
  fs.mkdirSync(path.dirname(planFile), {recursive: true})
  fs.writeFileSync(
    planFile,
    JSON.stringify({mode: isDry ? 'dry' : 'execute', at: new Date().toISOString(), moves, left, restore: moves.map((m) => ({_id: m._id, coordinatesLat: m.from.lat, coordinatesLng: m.from.lng}))}, null, 1),
  )
  console.log(`\n${isDry ? 'Plan' : 'Backup'} written: ${planFile}`)
  if (isDry) {
    console.log('Dry run — nothing written.')
    return
  }

  const drafts = new Set(
    await client.fetch<string[]>(`*[_id in $ids]._id`, {ids: moves.map((m) => `drafts.${m._id}`)}),
  )
  let tx = client.transaction()
  let n = 0
  for (const m of moves) {
    const set = {coordinatesLat: m.to.lat, coordinatesLng: m.to.lng}
    tx = tx.patch(m._id, (p) => p.set(set))
    if (drafts.has(`drafts.${m._id}`)) tx = tx.patch(`drafts.${m._id}`, (p) => p.set(set))
    if (++n % 50 === 0) {
      await tx.commit()
      tx = client.transaction()
    }
  }
  await tx.commit()
  console.log(`Patched ${moves.length} listing(s)${drafts.size ? ` and ${drafts.size} draft(s)` : ''}.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? (e.stack ?? e.message) : e)
  process.exit(1)
})
