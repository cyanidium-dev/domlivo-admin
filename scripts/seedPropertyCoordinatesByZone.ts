/**
 * Give every listing a map pin, at the precision the data actually supports.
 *
 * Why this exists: the catalogue map renders from `coordinatesLat/Lng`, and only
 * 4 of the 47 properties had them, so the map read as empty. There was nothing
 * to extract either — the DatoCMS `object` model has twelve fields and none of
 * them is a location, its descriptions carry no street addresses, and no listing
 * anywhere in either CMS has a Google Maps link. The most precise honest thing
 * available is the district a listing sits in.
 *
 * So each property gets the centroid of its district (its city when it has no
 * district), and is stamped `locationPrecision: 'approximate'` — the property
 * page says so next to the map rather than implying the pin is the building.
 * Replace the coordinates with real ones in Studio and set the precision to
 * `exact`; this script never touches a property that already has coordinates.
 *
 * The centroids are OpenStreetMap objects, listed below with the OSM id they
 * came from, resolved via Nominatim on 2026-09-01. They are data, not guesses.
 *
 * Run:
 * - npm run seed:property-coordinates -- --dry
 * - npm run seed:property-coordinates -- --execute
 */
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const token = process.env.SANITY_API_TOKEN?.trim()
if (!token || !projectId) {
  console.error('Error: SANITY_PROJECT_ID and SANITY_API_TOKEN required.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
})

const args = process.argv.slice(2)
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')
if (!isDry && !isExecute) {
  console.error('Use --dry or --execute.')
  process.exit(1)
}

type Zone = {lat: number; lng: number; osm: string}

/** District centroids, OpenStreetMap via Nominatim. Key: district slug. */
const DISTRICT_CENTROIDS: Record<string, Zone> = {
  plazh: {lat: 41.30891, lng: 19.49062, osm: 'way/148887797'},
  'plepa-durres': {lat: 41.29241, lng: 19.50793, osm: 'node/5666325029'},
  'shkembi-durres': {lat: 41.28058, lng: 19.51598, osm: 'node/6615317852'},
  'golem-durres': {lat: 41.24344, lng: 19.52239, osm: 'relation/1250108'},
  'mali-i-robit': {lat: 41.23627, lng: 19.51756, osm: 'node/9066689457'},
  'city-center-durres': {lat: 41.31325, lng: 19.44624, osm: 'relation/1249871'},
  'city-center-vlore': {lat: 40.47076, lng: 19.49127, osm: 'relation/1255534'},
  'city-center-sarande': {lat: 39.87522, lng: 20.00653, osm: 'relation/1255541'},
  'center-shengjin': {lat: 41.80978, lng: 19.59898, osm: 'relation/1248917'},
}

/** City centroids, same source. Used when a listing names no district. */
const CITY_CENTROIDS: Record<string, Zone> = {
  durres: {lat: 41.31325, lng: 19.44624, osm: 'relation/1249871'},
  vlore: {lat: 40.47076, lng: 19.49127, osm: 'relation/1255534'},
  sarande: {lat: 39.87522, lng: 20.00653, osm: 'relation/1255541'},
  shengjin: {lat: 41.80978, lng: 19.59898, osm: 'relation/1248917'},
  tirana: {lat: 41.32815, lng: 19.81844, osm: 'relation/1250106'},
  shkoder: {lat: 42.06814, lng: 19.51214, osm: 'relation/1248301'},
  himare: {lat: 40.10216, lng: 19.7473, osm: 'relation/1255539'},
}

/**
 * Pins land on the same centroid otherwise, so fifteen listings in Plazh would
 * be one marker. Spread them deterministically from the document id: the same
 * property lands in the same spot on every run, and inside a radius small
 * enough that the pin still reads as "this district".
 */
const SPREAD_METRES = 450

function hash(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function scatter(zone: Zone, id: string): {lat: number; lng: number} {
  const h = hash(id)
  const angle = ((h % 3600) / 3600) * 2 * Math.PI
  // sqrt keeps the points evenly spread over the disc instead of clumping in
  // the middle.
  const radius = Math.sqrt(((h >>> 12) % 1000) / 1000) * SPREAD_METRES
  const dLat = (radius * Math.cos(angle)) / 111_320
  const dLng = (radius * Math.sin(angle)) / (111_320 * Math.cos((zone.lat * Math.PI) / 180))
  return {
    lat: Number((zone.lat + dLat).toFixed(6)),
    lng: Number((zone.lng + dLng).toFixed(6)),
  }
}

type Row = {
  _id: string
  slug?: string
  city?: string
  district?: string
  lat?: number
  lng?: number
  precision?: string
  isPublished?: boolean
}

async function main() {
  // Authenticated reads return drafts too; a draft and its published twin are
  // the same listing, and patching both would fork them.
  const rows = await client.fetch<Row[]>(`*[_type == "property" && !(_id in path("drafts.**"))]{
    _id,
    "slug": slug.current,
    "city": city->slug.current,
    "district": district->slug.current,
    "lat": coordinatesLat,
    "lng": coordinatesLng,
    "precision": locationPrecision,
    isPublished
  } | order(city asc, district asc)`)

  const planned: Array<{row: Row; zoneKey: string; zone: Zone; point: {lat: number; lng: number}}> = []
  const skipped: string[] = []
  const unplaceable: string[] = []

  for (const row of rows) {
    if (typeof row.lat === 'number' && typeof row.lng === 'number') {
      skipped.push(`${row.slug ?? row._id}: already has coordinates`)
      continue
    }
    const district = row.district ? DISTRICT_CENTROIDS[row.district] : undefined
    const city = row.city ? CITY_CENTROIDS[row.city] : undefined
    const zone = district ?? city
    const zoneKey = district ? `district:${row.district}` : city ? `city:${row.city}` : ''
    if (!zone) {
      unplaceable.push(`${row.slug ?? row._id}: no centroid for district=${row.district ?? '—'} city=${row.city ?? '—'}`)
      continue
    }
    planned.push({row, zoneKey, zone, point: scatter(zone, row._id)})
  }

  for (const line of skipped) console.log(`skip     ${line}`)
  for (const line of unplaceable) console.log(`NO ZONE  ${line}`)
  console.log('')
  for (const p of planned) {
    console.log(
      `place    ${(p.row.slug ?? p.row._id).slice(0, 42).padEnd(44)} ${p.zoneKey.padEnd(30)} ` +
        `${p.point.lat.toFixed(5)}, ${p.point.lng.toFixed(5)}  (${p.zone.osm})`,
    )
  }

  console.log(
    `\n${planned.length} to place, ${skipped.length} already placed, ${unplaceable.length} with no centroid.`,
  )
  if (unplaceable.length) {
    console.log('Add a centroid for the zones above, or give those listings a district in Studio.')
  }
  if (isDry) {
    console.log('Dry run — nothing written.')
    return
  }

  for (const p of planned) {
    await client
      .patch(p.row._id)
      .set({
        coordinatesLat: p.point.lat,
        coordinatesLng: p.point.lng,
        locationPrecision: 'approximate',
      })
      .commit()
    console.log(`  ✓ ${p.row.slug ?? p.row._id}`)
  }
  console.log(`\nPlaced ${planned.length} listing(s) at district precision.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
