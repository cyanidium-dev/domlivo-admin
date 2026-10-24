/**
 * Puts every listing where the evidence says, and never in the sea or on the sand.
 * 2026-10-19, the owner: "many listings show on the beach, that cannot be".
 *
 * Two steps in one run:
 *
 *  1. Evidence. The geo engine's latest plan (applyGeoEngine20261013.ts dry run,
 *     ../domlivo-workspace/geo/geo-engine-plan-*.json) holds the best proposal per
 *     listing: realtor Google Maps link, named complex, photo match, street or
 *     landmark from the text, or "district only". It was never written to Sanity;
 *     this script writes it, with the same precedence and the same locks.
 *
 *  2. Land guard, on the result. OpenStreetMap from the map's own vector tiles
 *     (OpenFreeMap z14): `water` (sea, lakes, lagoons), `landcover` class sand
 *     (natural=beach / sand). A building-level pin must not be in water or on a
 *     beach. Any coarser pin (street, area, district) must also keep SEA_BUFFER_M
 *     from the sea or a lake: the visitor sees a circle "somewhere around here",
 *     and its centre on the promenade reads as "on the beach". A pin that fails
 *     moves to the nearest point that passes (rings of 15 m, 36 bearings, up to
 *     MAX_MOVE_M), preferring a point next to a mapped building or inside a
 *     residential area on the same ring. A building-level pin that had to move
 *     is no longer building-level: it becomes street-level, approximate.
 *
 * Never moved: pins whose locationSource is 'realtor' or 'manual' (published or
 * draft), and realtor pins proposed by the engine. They are only reported.
 *
 * Writes coordinatesLat/Lng, locationPrecision, locationSource, locationLevel,
 * locationConfidence, locationEvidence, locationGroup and googleMapsUrl (realtor)
 * to the published document and to its draft if one exists. Backup of every
 * patched document first. Do not run --execute while someone has listings open
 * in the Studio (an open coordinate input writes its old value back as a draft).
 *
 *   npx tsx scripts/placeListingsOnLand20261019.ts              (dry run: plan + review map)
 *   npx tsx scripts/placeListingsOnLand20261019.ts --execute
 *   npx tsx scripts/placeListingsOnLand20261019.ts --no-engine  (land guard only)
 *
 * Output in ../domlivo-workspace/geo/: land-plan-<ts>.json, land-review-<ts>.html
 * (every moved pin on a map, before → after), land-backup-<ts>.json on --execute.
 */
import fs from 'node:fs'
import path from 'node:path'
import {getSanityClientForScripts} from './lib/sanityEnvClient'
import {buildingAt, distanceM, hash, nearestWater, offset, residentialAt, sandAt, waterAt} from './lib/geoTiles'

const isExecute = process.argv.includes('--execute')
const useEngine = !process.argv.includes('--no-engine')
/** Plan from the state recorded in an earlier run's backup instead of the current one. */
const fromBackup = process.argv.includes('--from-backup') ? process.argv[process.argv.indexOf('--from-backup') + 1] : null
const GEO = path.resolve(process.cwd(), '../domlivo-workspace/geo')

/** Metres a non-building pin keeps from the sea or a lake. */
const SEA_BUFFER_M = 120
const RING_STEP_M = 15
const BEARINGS = 36
const MAX_MOVE_M = 1500
/** Width of the band past the first safe ring where a moved pin may land. */
const BAND_M = 230
/** How far a coarse pin may jump to sit on a house. */
const SNAP_M = 150
const SEA = new Set(['ocean', 'lake'])

type Level = 'exact' | 'street' | 'area' | 'district'
type Source = 'realtor' | 'manual' | 'complex' | 'photoMatch' | 'text' | 'vision' | 'district'
type Conf = 'high' | 'medium' | 'low'
type Listing = {
  _id: string
  slug?: string
  title?: string
  lat: number | null
  lng: number | null
  precision: 'exact' | 'approximate' | null
  source: Source | null
  level: Level | null
  confidence: Conf | null
  evidence: string | null
  googleMapsUrl: string | null
  group: string | null
}
type EnginePatch = {
  id: string
  set: Record<string, unknown>
  p: {lat: number; lng: number; level: Level; source: Source; confidence: Conf; evidence: string; keepCoordinates?: boolean}
}
type Problem = 'water' | 'beach' | 'nearSea'

const LOCKED = (s: Source | null | undefined) => s === 'realtor' || s === 'manual'

function latestEnginePlan(): {file: string; rows: EnginePatch[]} | null {
  const files = fs
    .readdirSync(GEO)
    .filter((f) => /^geo-engine-plan-.*\.json$/.test(f))
    .sort()
  const file = files.at(-1)
  if (!file) return null
  return {file, rows: JSON.parse(fs.readFileSync(path.join(GEO, file), 'utf8'))}
}

async function problemsAt(lat: number, lng: number, level: Level): Promise<Problem[]> {
  const out: Problem[] = []
  if (await waterAt(lat, lng)) out.push('water')
  // OSM beach polygons sometimes cover first-line houses: a pin inside a mapped building is not on the sand
  if ((await sandAt(lat, lng)) && !(await buildingAt(lat, lng))) out.push('beach')
  if (level !== 'exact' && !out.length) {
    const sea = await nearestWater(lat, lng, SEA_BUFFER_M, SEA)
    if (sea) out.push('nearSea')
  }
  return out
}

/**
 * A point that passes the land guard for a non-building pin. Taking simply the
 * nearest one lined every moved pin up on the SEA_BUFFER_M contour along the
 * beach (the owner noticed, 2026-10-19). So: find the first ring with a safe
 * point (r0), gather the safe points on the rings r0 .. r0 + BAND_M that sit on
 * a mapped building (else in a residential area, else anywhere safe), and pick
 * one by a hash of the listing id: neighbours land on different houses at
 * different distances from the sea, and a re-run picks the same one.
 */
async function nearestSafe(lat: number, lng: number, seed: string) {
  let r0 = 0
  for (let r = RING_STEP_M; r <= MAX_MOVE_M && !r0; r += RING_STEP_M) {
    for (let i = 0; i < BEARINGS && !r0; i++) {
      const p = offset(lat, lng, r, (i * 360) / BEARINGS)
      if (!(await problemsAt(p.lat, p.lng, 'street')).length) r0 = r
    }
  }
  if (!r0) return null
  const tiers: Array<Array<{lat: number; lng: number}>> = [[], [], []]
  for (let r = r0; r <= Math.min(MAX_MOVE_M, r0 + BAND_M); r += RING_STEP_M) {
    for (let i = 0; i < BEARINGS; i++) {
      const p = offset(lat, lng, r, (i * 360) / BEARINGS)
      if ((await problemsAt(p.lat, p.lng, 'street')).length) continue
      const tier = (await buildingAt(p.lat, p.lng)) ? 0 : (await residentialAt(p.lat, p.lng)) ? 1 : 2
      tiers[tier].push(p)
    }
  }
  const pool = tiers.find((t) => t.length)!
  const p = pool[hash(seed) % pool.length]
  return {lat: p.lat, lng: p.lng, distance: Math.round(distanceM({lat, lng}, p)), housing: pool !== tiers[2]}
}

/**
 * A coarse pin that lies on a road or an empty lot looks like a mistake (the
 * owner: "let them land on houses, not lie on the road"). Move it onto a mapped
 * building within SNAP_M, chosen by a hash of the listing id among the nearest
 * few, so two listings of one district do not share a roof. Null when no
 * building that close passes the land guard.
 */
async function snapToHouse(lat: number, lng: number, seed: string) {
  if (await buildingAt(lat, lng)) return null
  const found: Array<{lat: number; lng: number}> = []
  for (let r = 10; r <= SNAP_M && found.length < 12; r += 10) {
    for (let i = 0; i < BEARINGS; i++) {
      const p = offset(lat, lng, r, (i * 360) / BEARINGS)
      if (!(await buildingAt(p.lat, p.lng))) continue
      if ((await problemsAt(p.lat, p.lng, 'street')).length) continue
      found.push(p)
    }
  }
  if (!found.length) return null
  const p = found[hash(seed) % found.length]
  return {lat: p.lat, lng: p.lng, distance: Math.round(distanceM({lat, lng}, p))}
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]!)

async function main() {
  const client = getSanityClientForScripts()
  const PROJECTION = `{
    _id, "slug": slug.current, "title": coalesce(title.en, title.ru, title.sq),
    "lat": coordinatesLat, "lng": coordinatesLng,
    "precision": locationPrecision,
    "source": locationSource, "level": locationLevel,
    "confidence": locationConfidence, "evidence": locationEvidence,
    googleMapsUrl, "group": locationGroup
  }`
  const listings: Listing[] = await client.fetch(`*[_type == "property" && !(_id in path("drafts.**"))]${PROJECTION}`)
  const drafts: Listing[] = await client.fetch(`*[_type == "property" && _id in path("drafts.**")]${PROJECTION}`)
  const draftOf = new Map(drafts.map((d) => [d._id.replace(/^drafts\./, ''), d]))
  if (fromBackup) {
    const rows: Array<{id: string; before: Record<string, any>}> = JSON.parse(fs.readFileSync(path.resolve(GEO, fromBackup), 'utf8'))
    const beforeOf = new Map(rows.map((r) => [r.id, r.before]))
    for (const l of listings) {
      const b = beforeOf.get(l._id)
      if (!b) continue
      Object.assign(l, {
        lat: b.coordinatesLat, lng: b.coordinatesLng, precision: b.locationPrecision, source: b.locationSource,
        level: b.locationLevel, confidence: b.locationConfidence, evidence: b.locationEvidence,
        googleMapsUrl: b.googleMapsUrl, group: b.locationGroup,
      })
    }
    console.log(`state taken from ${fromBackup} for ${beforeOf.size} listings`)
  }
  console.log(`listings ${listings.length}, drafts ${drafts.length}`)

  const engine = useEngine ? latestEnginePlan() : null
  const engineOf = new Map((engine?.rows ?? []).map((r) => [r.id, r]))
  if (engine) console.log(`engine plan ${engine.file}: ${engine.rows.length} proposals`)

  type Plan = {
    id: string
    slug?: string
    title?: string
    set: Record<string, unknown>
    before: Record<string, unknown>
    draft: boolean
    from: {lat: number; lng: number}
    evidenceAt: {lat: number; lng: number}
    to: {lat: number; lng: number}
    moveM: number
    problems: Problem[]
    guardMoveM: number
    source: Source
    level: Level
  }
  const plans: Plan[] = []
  const reportOnly: Array<{id: string; slug?: string; source: string; problems: Problem[]; lat: number; lng: number}> = []
  const stuck: string[] = []
  const tally = {locked: 0, noCoordinates: 0, unchanged: 0, problemsBefore: {water: 0, beach: 0, nearSea: 0}, guardMoves: 0, snappedToHouse: 0}

  let n = 0
  for (const l of listings) {
    if (++n % 100 === 0) console.log(`…${n}/${listings.length}`)
    const d = draftOf.get(l._id)
    if (l.lat == null || l.lng == null) {
      tally.noCoordinates++
      continue
    }
    const curLevel: Level = l.level ?? (l.precision === 'exact' ? 'exact' : 'district')
    const before = await problemsAt(l.lat, l.lng, curLevel)
    for (const p of before) tally.problemsBefore[p]++

    if (LOCKED(l.source) || LOCKED(d?.source)) {
      tally.locked++
      if (before.length) reportOnly.push({id: l._id, slug: l.slug, source: String(l.source ?? d?.source), problems: before, lat: l.lat, lng: l.lng})
      continue
    }

    // 1. evidence
    const e = engineOf.get(l._id)
    let lat = l.lat
    let lng = l.lng
    let source: Source = l.source ?? (l.precision === 'exact' ? 'complex' : 'district')
    let level: Level = curLevel
    let confidence: Conf = l.confidence ?? (l.precision === 'exact' ? 'high' : 'low')
    let evidence = l.evidence ?? (l.precision === 'exact' ? 'Building pin placed before 2026-10-13' : 'Only the district is known')
    let group = l.group
    let googleMapsUrl = l.googleMapsUrl
    if (e) {
      if (!e.p.keepCoordinates) {
        lat = +e.p.lat.toFixed(6)
        lng = +e.p.lng.toFixed(6)
      }
      source = e.p.source
      level = e.p.level
      confidence = e.p.confidence
      evidence = e.p.evidence
      group = (e.set.locationGroup as string | undefined) ?? group
      googleMapsUrl = (e.set.googleMapsUrl as string | undefined) ?? googleMapsUrl
    }
    const evidenceAt = {lat, lng}

    // 2. land guard
    const problems = await problemsAt(lat, lng, level)
    let guardMoveM = 0
    if (problems.length) {
      if (source === 'realtor') {
        reportOnly.push({id: l._id, slug: l.slug, source, problems, lat, lng})
      } else {
        const safe = await nearestSafe(lat, lng, l._id)
        if (!safe) {
          stuck.push(l._id)
        } else {
          tally.guardMoves++
          guardMoveM = safe.distance
          lat = safe.lat
          lng = safe.lng
          const what = problems.includes('water') ? 'in the water' : problems.includes('beach') ? 'on the beach' : `within ${SEA_BUFFER_M} m of the sea`
          if (level === 'exact') {
            level = 'street'
            confidence = 'medium'
          }
          evidence = `${evidence}. Moved ${safe.distance} m inland: the point was ${what} (OSM, 2026-10-19)`
        }
      }
    }

    // 3. a coarse pin sits on a house, not on a road
    if (level !== 'exact' && source !== 'realtor') {
      const house = await snapToHouse(lat, lng, l._id)
      if (house) {
        lat = house.lat
        lng = house.lng
        tally.snappedToHouse++
      }
    }

    const set: Record<string, unknown> = {
      coordinatesLat: lat,
      coordinatesLng: lng,
      locationPrecision: level === 'exact' ? 'exact' : 'approximate',
      locationSource: source,
      locationLevel: level,
      locationConfidence: confidence,
      locationEvidence: evidence,
    }
    if (group) set.locationGroup = group
    if (googleMapsUrl) set.googleMapsUrl = googleMapsUrl
    const prev: Record<string, unknown> = {
      coordinatesLat: l.lat,
      coordinatesLng: l.lng,
      locationPrecision: l.precision,
      locationSource: l.source,
      locationLevel: l.level,
      locationConfidence: l.confidence,
      locationEvidence: l.evidence,
      googleMapsUrl: l.googleMapsUrl,
      locationGroup: l.group,
    }
    if (Object.entries(set).every(([k, v]) => prev[k] === v)) {
      tally.unchanged++
      continue
    }
    plans.push({
      id: l._id,
      slug: l.slug,
      title: l.title,
      set,
      before: prev,
      draft: !!d,
      from: {lat: l.lat, lng: l.lng},
      evidenceAt,
      to: {lat, lng},
      moveM: Math.round(distanceM({lat: l.lat, lng: l.lng}, {lat, lng})),
      problems,
      guardMoveM,
      source,
      level,
    })
  }

  // ---------- report ----------
  const levelsAfter: Record<string, number> = {}
  const planned = new Map(plans.map((p) => [p.id, p]))
  for (const l of listings) {
    const lev = planned.get(l._id)?.level ?? l.level ?? (l.precision === 'exact' ? 'exact' : 'district')
    levelsAfter[lev] = (levelsAfter[lev] ?? 0) + 1
  }
  const bySource: Record<string, number> = {}
  for (const p of plans) bySource[`${p.source}/${p.level}`] = (bySource[`${p.source}/${p.level}`] ?? 0) + 1
  const guard = plans.filter((p) => p.guardMoveM > 0).map((p) => p.guardMoveM).sort((a, b) => a - b)
  console.log('problems on the current pins:', tally.problemsBefore)
  console.log('patches by source/level:', bySource)
  console.log('levels after:', levelsAfter)
  console.log(
    `land guard moved ${tally.guardMoves} pins` +
      (guard.length ? ` (median ${guard[Math.floor(guard.length / 2)]} m, max ${guard.at(-1)} m)` : ''),
  )
  console.log(`snapped onto a house: ${tally.snappedToHouse}`)
  console.log(`locked ${tally.locked}, unchanged ${tally.unchanged}, no coordinates ${tally.noCoordinates}, no safe point found ${stuck.length}`)
  if (reportOnly.length) {
    console.log(`realtor/manual pins on water or sand (not moved, check by hand): ${reportOnly.length}`)
    for (const r of reportOnly) console.log(`  ${r.id}  ${r.source}  ${r.problems.join('+')}  ${r.lat},${r.lng}`)
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  fs.writeFileSync(path.join(GEO, `land-plan-${stamp}.json`), JSON.stringify({plans, reportOnly, stuck}, null, 1))

  // review map: before (grey) → evidence point (blue) → final (green); red = realtor/manual pin on water/sand
  const features = plans
    .filter((p) => p.moveM > 0)
    .map((p) => ({
      id: p.id,
      slug: p.slug ?? '',
      title: p.title ?? '',
      from: [p.from.lng, p.from.lat],
      ev: [p.evidenceAt.lng, p.evidenceAt.lat],
      to: [p.to.lng, p.to.lat],
      moveM: p.moveM,
      guardM: p.guardMoveM,
      problems: p.problems.join('+'),
      source: `${p.source}/${p.level}`,
    }))
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Land plan review</title>
<link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet">
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<style>body{margin:0;font:14px system-ui}#map{position:absolute;inset:0}#legend{position:absolute;top:10px;left:10px;background:#fff;padding:10px 12px;border-radius:8px;box-shadow:0 2px 8px #0003;max-width:340px}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px}</style></head><body><div id="map"></div>
<div id="legend"><b>${esc(String(features.length))} pins move</b> (${tally.guardMoves} of them pushed off water/sand)<br>
<span class="dot" style="background:#999"></span>now on the site<br>
<span class="dot" style="background:#2563eb"></span>where the evidence puts it<br>
<span class="dot" style="background:#16a34a"></span>final point (after the land guard)<br>
<span class="dot" style="background:#dc2626"></span>realtor/manual pin on water or sand, not moved</div>
<script>
const F=${JSON.stringify(features)};const R=${JSON.stringify(reportOnly)};
const map=new maplibregl.Map({container:'map',style:'https://tiles.openfreemap.org/styles/liberty',center:[19.47,41.31],zoom:12});
map.on('load',()=>{
 const pt=(c,props)=>({type:'Feature',geometry:{type:'Point',coordinates:c},properties:props});
 map.addSource('lines',{type:'geojson',data:{type:'FeatureCollection',features:F.map(f=>({type:'Feature',geometry:{type:'LineString',coordinates:[f.from,f.ev,f.to]},properties:{}}))}});
 map.addLayer({id:'lines',type:'line',source:'lines',paint:{'line-color':'#555','line-width':1,'line-dasharray':[2,2]}});
 const add=(id,data,color,r)=>{map.addSource(id,{type:'geojson',data:{type:'FeatureCollection',features:data}});map.addLayer({id,type:'circle',source:id,paint:{'circle-color':color,'circle-radius':r,'circle-stroke-color':'#fff','circle-stroke-width':1}})};
 add('from',F.map(f=>pt(f.from,f)),'#999',4);
 add('ev',F.filter(f=>f.guardM>0).map(f=>pt(f.ev,f)),'#2563eb',4);
 add('to',F.map(f=>pt(f.to,f)),'#16a34a',5);
 add('locked',R.map(r=>pt([r.lng,r.lat],{id:r.id,slug:r.slug||'',problems:r.problems.join('+'),source:r.source})),'#dc2626',6);
 for(const id of ['to','ev','from','locked']){map.on('click',id,e=>{const p=e.features[0].properties;new maplibregl.Popup().setLngLat(e.lngLat).setHTML('<b>'+(p.title||p.id)+'</b><br>'+p.source+(p.moveM?'<br>moves '+p.moveM+' m':'')+(p.problems?'<br>was: '+p.problems:'')+(p.slug?'<br><a target=_blank href="https://www.domlivo.com/en/property/'+p.slug+'">open listing</a>':'')).addTo(map)});map.on('mouseenter',id,()=>map.getCanvas().style.cursor='pointer');map.on('mouseleave',id,()=>map.getCanvas().style.cursor='')}
});
</script></body></html>`
  const reviewFile = path.join(GEO, `land-review-${stamp}.html`)
  fs.writeFileSync(reviewFile, html)
  console.log(`plan → land-plan-${stamp}.json, review map → ${reviewFile}`)

  if (!isExecute) {
    console.log(`\nDry run. ${plans.length} patches planned. Re-run with --execute to write.`)
    return
  }
  const backupFile = path.join(GEO, `land-backup-${stamp}.json`)
  fs.writeFileSync(
    backupFile,
    JSON.stringify(plans.map((x) => ({id: x.id, before: x.before, draftBefore: x.draft ? draftOf.get(x.id) : null})), null, 1),
  )
  console.log(`backup → ${backupFile}`)
  for (let i = 0; i < plans.length; i += 100) {
    const tx = client.transaction()
    for (const x of plans.slice(i, i + 100)) {
      tx.patch(x.id, (p) => p.set(x.set))
      if (x.draft) tx.patch(`drafts.${x.id}`, (p) => p.set(x.set))
    }
    await tx.commit({visibility: 'async'})
    console.log(`…${Math.min(i + 100, plans.length)}/${plans.length}`)
  }
  console.log('done')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
