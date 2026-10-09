/**
 * Moves approximate map pins that sit in the sea (or a lake) onto the nearest
 * land. 2026-10-10: the new vector map showed a dozen "≈" pins floating off
 * the Plazh beach in Durrës. placePartnerListingCoordinates.ts checked land
 * with Nominatim's reverse geocoder, which answers with the nearest beach road
 * for a point 100 m out at sea, so those pins passed.
 *
 * This check uses the same OpenStreetMap water polygons the map draws
 * (OpenFreeMap vector tiles, zoom 14, layer `water`). A pin in water moves to
 * the closest point, searched on rings of growing radius, that is on land with
 * 40 m of land around it. Exact pins are only reported, never moved: their
 * coordinates came from an address.
 *
 *   npx tsx scripts/movePinsOutOfWater20261010.ts --dry
 *   npx tsx scripts/movePinsOutOfWater20261010.ts --execute
 */
import {VectorTile} from '@mapbox/vector-tile'
import Pbf from 'pbf'
import {getSanityClientForScripts} from './lib/sanityEnvClient'

const args = process.argv.slice(2)
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')
if (!isDry && !isExecute) {
  console.error('Use --dry or --execute.')
  process.exit(1)
}

const Z = 14
const MARGIN_M = 40
const MAX_RADIUS_M = 1500
const STEP_M = 20
const BEARINGS = 24

type Row = {_id: string; slug?: string; lat: number; lng: number; precision?: string}
type Polygon = number[][][]

let tileUrlTemplate = ''
const tileCache = new Map<string, Polygon[]>()

async function tileTemplate(): Promise<string> {
  if (tileUrlTemplate) return tileUrlTemplate
  const res = await fetch('https://tiles.openfreemap.org/planet')
  const json = (await res.json()) as {tiles: string[]}
  tileUrlTemplate = json.tiles[0]
  return tileUrlTemplate
}

function tileOf(lat: number, lng: number) {
  const n = 2 ** Z
  const x = Math.floor(((lng + 180) / 360) * n)
  const rad = (lat * Math.PI) / 180
  const y = Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n)
  return {x, y}
}

async function waterPolygons(x: number, y: number): Promise<Polygon[]> {
  const key = `${x}/${y}`
  const cached = tileCache.get(key)
  if (cached) return cached
  const url = (await tileTemplate()).replace('{z}', String(Z)).replace('{x}', String(x)).replace('{y}', String(y))
  let polygons: Polygon[] = []
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url)
      if (res.status === 204 || res.status === 404) break
      if (!res.ok) throw new Error(`tile ${key}: HTTP ${res.status}`)
      const tile = new VectorTile(new Pbf(new Uint8Array(await res.arrayBuffer())))
      const layer = tile.layers.water
      polygons = []
      if (layer) {
        for (let i = 0; i < layer.length; i++) {
          const g = layer.feature(i).toGeoJSON(x, y, Z).geometry
          if (g.type === 'Polygon') polygons.push(g.coordinates)
          else if (g.type === 'MultiPolygon') polygons.push(...g.coordinates)
        }
      }
      break
    } catch (err) {
      if (attempt === 3) throw err
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
    }
  }
  tileCache.set(key, polygons)
  return polygons
}

function ringContains(ring: number[][], x: number, y: number): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

async function inWater(lat: number, lng: number): Promise<boolean> {
  const {x, y} = tileOf(lat, lng)
  for (const [outer, ...holes] of await waterPolygons(x, y)) {
    if (outer && ringContains(outer, lng, lat) && !holes.some((h) => ringContains(h, lng, lat))) return true
  }
  return false
}

function offset(lat: number, lng: number, metres: number, bearingDeg: number) {
  const b = (bearingDeg * Math.PI) / 180
  const dLat = (metres * Math.cos(b)) / 111_320
  const dLng = (metres * Math.sin(b)) / (111_320 * Math.cos((lat * Math.PI) / 180))
  return {lat: Number((lat + dLat).toFixed(6)), lng: Number((lng + dLng).toFixed(6))}
}

async function solidLand(lat: number, lng: number): Promise<boolean> {
  if (await inWater(lat, lng)) return false
  for (let i = 0; i < 8; i++) {
    const p = offset(lat, lng, MARGIN_M, i * 45)
    if (await inWater(p.lat, p.lng)) return false
  }
  return true
}

async function nearestLand(lat: number, lng: number) {
  for (let r = STEP_M; r <= MAX_RADIUS_M; r += STEP_M) {
    for (let i = 0; i < BEARINGS; i++) {
      const p = offset(lat, lng, r, (i * 360) / BEARINGS)
      if (await solidLand(p.lat, p.lng)) return {...p, distance: r}
    }
  }
  return null
}

async function main() {
  const client = getSanityClientForScripts()
  const rows = await client.fetch<Row[]>(`*[_type == "property" && !(_id in path("drafts.**"))
    && defined(coordinatesLat) && defined(coordinatesLng)]{
    _id, "slug": slug.current, "lat": coordinatesLat, "lng": coordinatesLng, "precision": locationPrecision
  } | order(_id asc)`)
  console.log(`listings with coordinates: ${rows.length}`)

  const moves: Array<{row: Row; to: {lat: number; lng: number; distance: number}}> = []
  const exactInWater: Row[] = []
  const stuck: Row[] = []
  for (const row of rows) {
    if (!(await inWater(row.lat, row.lng))) continue
    if (row.precision === 'exact') {
      exactInWater.push(row)
      continue
    }
    const to = await nearestLand(row.lat, row.lng)
    if (to) moves.push({row, to})
    else stuck.push(row)
  }
  console.log(`tiles read: ${tileCache.size}`)
  console.log(`approximate pins in water: ${moves.length + stuck.length} (no land within ${MAX_RADIUS_M} m: ${stuck.length})`)
  for (const m of moves) {
    console.log(`  ${m.row._id.padEnd(44)} ${m.row.lat}, ${m.row.lng} -> ${m.to.lat}, ${m.to.lng} (${m.to.distance} m)`)
  }
  for (const s of stuck) console.log(`  STUCK ${s._id} ${s.lat}, ${s.lng}`)
  if (exactInWater.length) {
    console.log(`exact pins in water (not moved, check the address): ${exactInWater.length}`)
    for (const e of exactInWater) console.log(`  ${e._id} ${e.lat}, ${e.lng}`)
  }

  if (isDry) {
    console.log('\nDry run — nothing written.')
    return
  }
  for (const m of moves) {
    await client.patch(m.row._id).set({coordinatesLat: m.to.lat, coordinatesLng: m.to.lng}).commit()
  }
  console.log(`\nMoved ${moves.length} pin(s) onto land.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? (e.stack ?? e.message) : e)
  process.exit(1)
})
