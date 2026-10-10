/**
 * OpenStreetMap geometry for map-pin checks, read from the same OpenFreeMap
 * vector tiles the site's map draws (zoom 14, the deepest zoom they carry).
 *
 *  - `water` layer: sea, lakes, lagoons, river areas, docks, ponds; swimming
 *    pools are in the layer too and are ignored here.
 *  - `building` layer: the footprints the catalogue map tests an exact pin
 *    against before it highlights the building (yha PropertiesMap.tsx,
 *    queryRenderedFeatures on the flat copy of `building`). A pin counts as
 *    "on a building" here exactly when it would light up there.
 *
 * Raw tiles are cached on disk under ../domlivo-workspace/geo/tiles-z14/<planet
 * version>/ so repeated audits do not re-download them.
 */
import fs from 'node:fs'
import path from 'node:path'
import {VectorTile} from '@mapbox/vector-tile'
import Pbf from 'pbf'

export const Z = 14
export type Ring = number[][]
export type Polygon = Ring[]
type TileData = {water: Array<{cls: string; poly: Polygon}>; buildings: Polygon[]}

const WORKSPACE = path.resolve(process.cwd(), '../domlivo-workspace')
const IGNORED_WATER = new Set(['swimming_pool'])

let tileUrlTemplate = ''
const tileCache = new Map<string, TileData>()

async function tileTemplate(): Promise<string> {
  if (tileUrlTemplate) return tileUrlTemplate
  const res = await fetch('https://tiles.openfreemap.org/planet')
  const json = (await res.json()) as {tiles: string[]}
  tileUrlTemplate = json.tiles[0]
  return tileUrlTemplate
}

function diskDir(template: string, z: number): string {
  // https://tiles.openfreemap.org/planet/20261001_001001_pt/{z}/{x}/{y}.pbf → 20261001_001001_pt
  const version = template.split('/planet/')[1]?.split('/')[0] ?? 'unknown'
  return path.join(WORKSPACE, 'geo', `tiles-z${z}`, version)
}

export function tileOf(lat: number, lng: number, z = Z) {
  const n = 2 ** z
  const x = Math.floor(((lng + 180) / 360) * n)
  const rad = (lat * Math.PI) / 180
  const y = Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n)
  return {x, y}
}

export function tilesRead(): number {
  return tileCache.size
}

async function tileBytes(x: number, y: number, z: number): Promise<Uint8Array | null> {
  const template = await tileTemplate()
  const dir = diskDir(template, z)
  const file = path.join(dir, `${x}-${y}.pbf`)
  if (fs.existsSync(file)) {
    const buf = fs.readFileSync(file)
    return buf.length ? new Uint8Array(buf) : null
  }
  const url = template.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y))
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url)
      let bytes: Uint8Array | null = null
      if (res.status !== 204 && res.status !== 404) {
        if (!res.ok) throw new Error(`tile ${x}/${y}: HTTP ${res.status}`)
        bytes = new Uint8Array(await res.arrayBuffer())
      }
      fs.mkdirSync(dir, {recursive: true})
      fs.writeFileSync(file, bytes ?? new Uint8Array())
      return bytes
    } catch (err) {
      if (attempt === 3) throw err
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
    }
  }
  return null
}

async function tile(x: number, y: number, z = Z): Promise<TileData> {
  const key = `${z}/${x}/${y}`
  const cached = tileCache.get(key)
  if (cached) return cached
  const data: TileData = {water: [], buildings: []}
  const bytes = await tileBytes(x, y, z)
  if (bytes) {
    const vt = new VectorTile(new Pbf(bytes))
    const water = vt.layers.water
    if (water) {
      for (let i = 0; i < water.length; i++) {
        const f = water.feature(i)
        const cls = String(f.properties.class ?? '')
        const g = f.toGeoJSON(x, y, z).geometry
        if (g.type === 'Polygon') data.water.push({cls, poly: g.coordinates})
        else if (g.type === 'MultiPolygon') for (const p of g.coordinates) data.water.push({cls, poly: p})
      }
    }
    const building = vt.layers.building
    if (building) {
      for (let i = 0; i < building.length; i++) {
        const g = building.feature(i).toGeoJSON(x, y, z).geometry
        if (g.type === 'Polygon') data.buildings.push(g.coordinates)
        else if (g.type === 'MultiPolygon') data.buildings.push(...g.coordinates)
      }
    }
  }
  tileCache.set(key, data)
  return data
}

export function ringContains(ring: Ring, x: number, y: number): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

export function polygonContains(poly: Polygon, lng: number, lat: number): boolean {
  const [outer, ...holes] = poly
  return !!outer && ringContains(outer, lng, lat) && !holes.some((h) => ringContains(h, lng, lat))
}

/**
 * The water class under a point ('ocean', 'lake', 'river', …), or null on land.
 * `z` below 14 tests the generalised coastline the map draws when zoomed out.
 */
export async function waterAt(lat: number, lng: number, z = Z): Promise<string | null> {
  const {x, y} = tileOf(lat, lng, z)
  for (const w of (await tile(x, y, z)).water) {
    if (IGNORED_WATER.has(w.cls)) continue
    if (polygonContains(w.poly, lng, lat)) return w.cls || 'water'
  }
  return null
}

/** The building footprint under a point, tested in the tile the map would render it from. */
export async function buildingAt(lat: number, lng: number): Promise<Polygon | null> {
  const {x, y} = tileOf(lat, lng)
  for (const b of (await tile(x, y)).buildings) if (polygonContains(b, lng, lat)) return b
  return null
}

/* ---------- metric helpers (local equirectangular, fine at building scale) ---------- */

const M_PER_DEG = 111_320

export function distanceM(a: {lat: number; lng: number}, b: {lat: number; lng: number}): number {
  const dy = (a.lat - b.lat) * M_PER_DEG
  const dx = (a.lng - b.lng) * M_PER_DEG * Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180)
  return Math.hypot(dx, dy)
}

export function offset(lat: number, lng: number, metres: number, bearingDeg: number) {
  const b = (bearingDeg * Math.PI) / 180
  const dLat = (metres * Math.cos(b)) / M_PER_DEG
  const dLng = (metres * Math.sin(b)) / (M_PER_DEG * Math.cos((lat * Math.PI) / 180))
  return {lat: Number((lat + dLat).toFixed(6)), lng: Number((lng + dLng).toFixed(6))}
}

function toXY(lat0: number, lng0: number, lat: number, lng: number): [number, number] {
  return [(lng - lng0) * M_PER_DEG * Math.cos((lat0 * Math.PI) / 180), (lat - lat0) * M_PER_DEG]
}

function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

/** Metres from a point to a polygon's boundary (0 when inside). */
export function distanceToPolygonM(poly: Polygon, lat: number, lng: number): number {
  if (polygonContains(poly, lng, lat)) return 0
  let best = Infinity
  for (const ring of poly) {
    for (let i = 1; i < ring.length; i++) {
      const [ax, ay] = toXY(lat, lng, ring[i - 1][1], ring[i - 1][0])
      const [bx, by] = toXY(lat, lng, ring[i][1], ring[i][0])
      best = Math.min(best, segDist(0, 0, ax, ay, bx, by))
    }
  }
  return best
}

function tilesAround(lat: number, lng: number, radiusM: number) {
  const dLat = radiusM / M_PER_DEG
  const dLng = radiusM / (M_PER_DEG * Math.cos((lat * Math.PI) / 180))
  const a = tileOf(lat + dLat, lng - dLng)
  const b = tileOf(lat - dLat, lng + dLng)
  const out: Array<{x: number; y: number}> = []
  for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++)
    for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) out.push({x, y})
  return out
}

/** Building footprints within `radiusM`, nearest first. */
export async function buildingsNear(lat: number, lng: number, radiusM: number) {
  const found: Array<{poly: Polygon; distance: number}> = []
  for (const t of tilesAround(lat, lng, radiusM)) {
    for (const poly of (await tile(t.x, t.y)).buildings) {
      const d = distanceToPolygonM(poly, lat, lng)
      if (d <= radiusM) found.push({poly, distance: d})
    }
  }
  return found.sort((a, b) => a.distance - b.distance)
}

/** Area-weighted centroid of a polygon's outer ring. */
export function centroid(poly: Polygon): {lat: number; lng: number} {
  const ring = poly[0]
  let a = 0
  let cx = 0
  let cy = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]
    a += f
    cx += (ring[j][0] + ring[i][0]) * f
    cy += (ring[j][1] + ring[i][1]) * f
  }
  if (!a) return {lat: ring[0][1], lng: ring[0][0]}
  return {lng: cx / (3 * a), lat: cy / (3 * a)}
}

/**
 * The point inside `poly` nearest to (lat, lng) that keeps `insetM` of
 * building around it in four directions, searched on a 1 m grid; null when
 * the footprint is too thin for the inset.
 */
export function nearestInteriorPoint(poly: Polygon, lat: number, lng: number, insetM = 2) {
  const d = distanceToPolygonM(poly, lat, lng)
  const half = Math.ceil(d + insetM + 12)
  let best: {lat: number; lng: number; distance: number} | null = null
  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      const dist = Math.hypot(dx, dy)
      if (best && dist >= best.distance) continue
      const p = {lat: lat + dy / M_PER_DEG, lng: lng + dx / (M_PER_DEG * Math.cos((lat * Math.PI) / 180))}
      if (!polygonContains(poly, p.lng, p.lat)) continue
      let ok = true
      for (const bearing of [0, 90, 180, 270]) {
        const q = offset(p.lat, p.lng, insetM, bearing)
        if (!polygonContains(poly, q.lng, q.lat)) {
          ok = false
          break
        }
      }
      if (ok) best = {lat: Number(p.lat.toFixed(6)), lng: Number(p.lng.toFixed(6)), distance: dist}
    }
  }
  return best
}

/* ---------- land ---------- */

export const LAND_MARGIN_M = 40

/** On land with LAND_MARGIN_M of land on eight sides. */
export async function solidLand(lat: number, lng: number, margin = LAND_MARGIN_M): Promise<boolean> {
  if (await waterAt(lat, lng)) return false
  for (let i = 0; i < 8; i++) {
    const p = offset(lat, lng, margin, i * 45)
    if (await waterAt(p.lat, p.lng)) return false
  }
  return true
}

/** The nearest solid-land point on rings of growing radius (20 m steps, 24 bearings). */
export async function nearestLand(lat: number, lng: number, maxRadius = 1500) {
  for (let r = 20; r <= maxRadius; r += 20) {
    for (let i = 0; i < 24; i++) {
      const p = offset(lat, lng, r, (i * 360) / 24)
      if (await solidLand(p.lat, p.lng)) return {...p, distance: r}
    }
  }
  return null
}

/* ---------- deterministic scatter (same hash as placePartnerListingCoordinates.ts) ---------- */

export function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function scatter(center: {lat: number; lng: number}, radius: number, seed: string) {
  const h = hash(seed)
  const angle = ((h % 3600) / 3600) * 2 * Math.PI
  const r = Math.sqrt(((h >>> 12) % 1000) / 1000) * radius
  const dLat = (r * Math.cos(angle)) / M_PER_DEG
  const dLng = (r * Math.sin(angle)) / (M_PER_DEG * Math.cos((center.lat * Math.PI) / 180))
  return {lat: Number((center.lat + dLat).toFixed(6)), lng: Number((center.lng + dLng).toFixed(6))}
}

/** A deterministic scattered point on solid land within `radius` of `center`, or null after 30 tries. */
export async function scatterOnLand(center: {lat: number; lng: number}, radius: number, seed: string) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const p = scatter(center, radius, attempt ? `${seed}#${attempt}` : seed)
    if (await solidLand(p.lat, p.lng)) return {...p, attempts: attempt + 1}
  }
  return null
}
