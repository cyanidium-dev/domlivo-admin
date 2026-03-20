/**
 * DEBUG / DEMO ONLY:
 * Default mode fills ONLY missing coordinates for `property` documents using approximate city centers
 * and random points around each center.
 *
 * FORCE_RESEED mode (CLI flag `--force-reseed`) overwrites existing coordinates ONLY when they look
 * like a bad seeded cluster (many properties share very similar coordinates near Tirana).
 *
 * - No real geocoding
 * - No address parsing
 * - Does NOT overwrite properties that already have both coordinates set
 *
 * Usage:
 *   npm run start -- (studio etc not required)
 *   npx tsx scripts/seedMissingPropertyCoordinatesByCityDebug.ts --dry
 *   npx tsx scripts/seedMissingPropertyCoordinatesByCityDebug.ts --execute
 *   npx tsx scripts/seedMissingPropertyCoordinatesByCityDebug.ts --force-reseed --dry
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const args = new Set(process.argv.slice(2))
const isDry = args.has('--dry') || !args.has('--execute')
const isExecute = args.has('--execute')
const forceReseed = args.has('--force-reseed') || process.env.FORCE_RESEED === 'true'

const apiVersion = '2024-01-01'

if (!isDry && !isExecute) {
  console.error('Use --dry to preview or --execute to perform coordinate filling.')
  process.exit(1)
}

if (isExecute && !token) {
  console.error('Error: SANITY_API_TOKEN required when using --execute')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
})

type CitySlug = string

type CityCenter = {
  centerLat: number
  centerLng: number
  minRadiusM: number
  maxRadiusM: number
}

// Approximate city centers for demo/debug randomization.
// These are NOT authoritative geocoding results.
const CITY_CENTERS: Record<CitySlug, CityCenter> = {
  tirana: {centerLat: 41.3275, centerLng: 19.8187, minRadiusM: 500, maxRadiusM: 7000},
  durres: {centerLat: 41.3233, centerLng: 19.4522, minRadiusM: 500, maxRadiusM: 6500},
  vlore: {centerLat: 40.4685, centerLng: 19.4903, minRadiusM: 500, maxRadiusM: 6500},
  sarande: {centerLat: 39.8723, centerLng: 20.0087, minRadiusM: 600, maxRadiusM: 7000},
  shkoder: {centerLat: 42.0687, centerLng: 19.5123, minRadiusM: 600, maxRadiusM: 7200},
  himare: {centerLat: 40.1064, centerLng: 19.8093, minRadiusM: 600, maxRadiusM: 6500},
}

function hashToUint32(input: string): number {
  // Simple deterministic string hash (non-crypto) for reproducible demo coordinates.
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function metersToLatDeg(meters: number): number {
  // Approx: 1 deg latitude ~= 111_320 meters
  return meters / 111320
}

function metersToLngDeg(meters: number, atLatDeg: number): number {
  // Longitude degree size shrinks by cos(latitude)
  const latRad = (atLatDeg * Math.PI) / 180
  return meters / (111320 * Math.cos(latRad))
}

const EARTH_RADIUS_M = 6371000

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

function haversineDistanceM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)

  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

function coordsClusterKey(lat: number, lng: number): string {
  // Round to detect "very similar" coordinates clusters for bad-seed detection.
  // 3 decimals is about ~100m resolution, enough to catch seeded identical points.
  return `${lat.toFixed(3)}:${lng.toFixed(3)}`
}

function randomPointAroundCity(seedKey: string, city: CityCenter) {
  const rand = mulberry32(hashToUint32(seedKey))
  const theta = rand() * Math.PI * 2

  // Uniform area distribution: use sqrt(rand()) for radius
  const minR = city.minRadiusM
  const maxR = city.maxRadiusM
  const t = rand()
  const r = minR + (maxR - minR) * Math.sqrt(t)

  const dLat = Math.cos(theta) * r
  const dLng = Math.sin(theta) * r

  const lat = city.centerLat + metersToLatDeg(dLat)
  const lng = city.centerLng + metersToLngDeg(dLng, city.centerLat)

  return {lat, lng}
}

async function run() {
  console.log('--- DEBUG: seed missing property coordinates (city-based) ---')
  console.log(`Project: ${projectId}`)
  console.log(`Dataset: ${dataset}`)
  console.log(`Mode: ${isDry ? 'DRY (preview only)' : 'EXECUTE (write coords)'}`)
  console.log(`Reseed mode: ${forceReseed ? 'FORCE_RESEED' : 'MISSING_ONLY'}`)

  const checked = await client.fetch<
    Array<{
      _id: string
      citySlug?: string
      cityRef?: string
      coordinatesLat?: number | null
      coordinatesLng?: number | null
    }>
  >(
    `*[_type == "property" && defined(city) && !(_id match "drafts.*")]{
      _id,
      "cityRef": city._ref,
      "citySlug": city->slug.current,
      "cityTitle": city->title.en,
      coordinatesLat,
      coordinatesLng
    }`,
  )

  let skippedUnsupportedCity = 0
  let skippedSafeDataNotTouched = 0
  let skippedPartialPair = 0

  const unsupportedCityExamples: Array<{citySlug?: string; cityRef?: string; cityTitle?: string; count: number}> = []
  const unsupportedCityKeyToIndex = new Map<string, number>()

  function trackUnsupportedCity(p: {citySlug?: string; cityRef?: string; cityTitle?: string}) {
    const citySlug = (p.citySlug || '').trim()
    const cityRef = (p.cityRef || '').trim()
    const cityTitle = (p as any).cityTitle
    const key = `slug:${citySlug || '<empty>'}|ref:${cityRef || '<empty>'}`
    const existingIdx = unsupportedCityKeyToIndex.get(key)
    if (existingIdx == null) {
      unsupportedCityKeyToIndex.set(key, unsupportedCityExamples.length)
      unsupportedCityExamples.push({citySlug, cityRef, cityTitle, count: 1})
    } else {
      unsupportedCityExamples[existingIdx]!.count++
    }
  }

  function resolveRecognizedCitySlug(citySlugRaw?: string, cityRefRaw?: string): string | null {
    const citySlug = (citySlugRaw || '').trim()
    if (citySlug && CITY_CENTERS[citySlug]) return citySlug

    const cityRef = (cityRefRaw || '').trim()
    if (cityRef.startsWith('city-')) {
      const fromRef = cityRef.slice('city-'.length)
      if (CITY_CENTERS[fromRef]) return fromRef
    }

    return null
  }

  const toPatch: Array<{
    _id: string
    citySlug: string
    lat: number
    lng: number
  }> = []

  const updatedByCity: Record<string, number> = {}

  // FORCE_RESEED bad-data detection:
  // Detect clusters of very similar coordinates around Tirana.
  // Then only overwrite coordinates for non-Tirana properties that fall into those bad clusters.
  const BAD_TIRANA_CENTER = CITY_CENTERS['tirana']!
  const CLUSTER_MIN_COUNT = 5
  const BAD_TIRANA_CLUSTER_RADIUS_M = 2500

  const clusterKeyToCount: Record<string, number> = {}
  const clusterKeyToCoords: Record<string, {lat: number; lng: number}> = {}

  if (forceReseed) {
    for (const p of checked) {
      if (typeof p.coordinatesLat !== 'number' || typeof p.coordinatesLng !== 'number') continue
      const key = coordsClusterKey(p.coordinatesLat, p.coordinatesLng)
      clusterKeyToCount[key] = (clusterKeyToCount[key] ?? 0) + 1
      clusterKeyToCoords[key] = {lat: p.coordinatesLat, lng: p.coordinatesLng}
    }
  }

  const badClusterKeys = new Set<string>()
  if (forceReseed) {
    for (const [key, count] of Object.entries(clusterKeyToCount)) {
      if (count < CLUSTER_MIN_COUNT) continue
      const coords = clusterKeyToCoords[key]
      if (!coords) continue
      const d = haversineDistanceM(
        coords.lat,
        coords.lng,
        BAD_TIRANA_CENTER.centerLat,
        BAD_TIRANA_CENTER.centerLng,
      )
      if (d <= BAD_TIRANA_CLUSTER_RADIUS_M) {
        badClusterKeys.add(key)
      }
    }
    console.log(`Bad seed cluster detection: ${badClusterKeys.size} bad cluster(s) found`)
  }

  for (const p of checked) {
    const resolvedCitySlug = resolveRecognizedCitySlug(p.citySlug, p.cityRef)
    const lat = p.coordinatesLat ?? null
    const lng = p.coordinatesLng ?? null

    // Partial coordinate safety rule: never touch partially-filled pairs.
    if ((lat == null) !== (lng == null)) {
      skippedPartialPair++
      continue
    }

    // Both missing: safe to fill in BOTH default and force mode.
    if (lat == null && lng == null) {
      if (!resolvedCitySlug) {
        skippedUnsupportedCity++
        trackUnsupportedCity(p)
        continue
      }
      const city = CITY_CENTERS[resolvedCitySlug]
      const point = randomPointAroundCity(p._id, city)
      toPatch.push({_id: p._id, citySlug: resolvedCitySlug, lat: point.lat, lng: point.lng})
      continue
    }

    // Both present:
    if (!resolvedCitySlug) {
      skippedUnsupportedCity++
      trackUnsupportedCity(p)
      continue
    }

    if (!forceReseed) {
      skippedSafeDataNotTouched++
      continue
    }

    // Never override Tirana properties based on Tirana-centered bad clusters.
    if (resolvedCitySlug === 'tirana') {
      skippedSafeDataNotTouched++
      continue
    }

    const key = coordsClusterKey(lat!, lng!)
    if (badClusterKeys.has(key)) {
      const city = CITY_CENTERS[resolvedCitySlug]
      const point = randomPointAroundCity(p._id, city)
      toPatch.push({_id: p._id, citySlug: resolvedCitySlug, lat: point.lat, lng: point.lng})
    } else {
      skippedSafeDataNotTouched++
    }
  }

  // Distribution per city for updated items
  for (const p of toPatch) {
    updatedByCity[p.citySlug] = (updatedByCity[p.citySlug] ?? 0) + 1
  }

  const totalChecked = checked.length
  const totalReseeded = toPatch.length

  console.log(`Total checked: ${totalChecked}`)
  console.log(`Total reseeded/updated: ${totalReseeded}`)
  console.log(`Skipped (unsupported city): ${skippedUnsupportedCity}`)
  console.log(`Skipped (safe data not touched): ${skippedSafeDataNotTouched}`)
  console.log(`Skipped (partial coordinate pair): ${skippedPartialPair}`)

  const distributionCities = Object.keys(updatedByCity)
  if (distributionCities.length > 0) {
    console.log('\nDistribution per city (updated):')
    for (const citySlug of distributionCities.sort((a, b) => (updatedByCity[b]! ?? 0) - (updatedByCity[a]! ?? 0))) {
      console.log(`  - ${citySlug}: ${updatedByCity[citySlug]}`)
    }
  }

  if (unsupportedCityExamples.length > 0) {
    console.log('\nUnsupported city values (first 10):')
    for (const ex of unsupportedCityExamples.slice(0, 10)) {
      console.log(
        `  - citySlug='${ex.citySlug || '<empty>'}', cityRef='${ex.cityRef || '<empty>'}', cityTitle='${ex.cityTitle || '<empty>'}': ${ex.count} doc(s)`,
      )
    }
  }

  if (toPatch.length === 0) {
    console.log('Nothing to patch.')
    return
  }

  if (isDry) {
    console.log('\nDry preview (first 8 patches):')
    for (const p of toPatch.slice(0, 8)) {
      console.log(
        `  ${p._id} -> city=${p.citySlug} lat=${p.lat.toFixed(6)} lng=${p.lng.toFixed(6)}`,
      )
    }
    return
  }

  const tx = client.transaction()
  for (const p of toPatch) {
    tx.patch(p._id, (patch) => {
      // Writes BOTH coordinate fields together to keep lat/lng consistent.
      return patch.set({coordinatesLat: p.lat, coordinatesLng: p.lng})
    })
  }

  const result = await tx.commit()
  console.log('\nCommit done.')
  console.log('Transaction result:', result)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})

