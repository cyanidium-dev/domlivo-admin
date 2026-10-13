// Reads every listing live from the public Sanity API (published documents,
// no token needed), downloads a 512 px JPEG of every gallery photo into
// thumbs/<assetId>.jpg and writes manifest.json: one row per listing with its
// current pin, precision, source, text and photo list. Read-only towards Sanity.
// Pins placed by hand or from a realtor's Google Maps link since the last run
// become trusted pins for the photo match on the next one.
//
//   node download-thumbs.mjs            (skips photos already on disk)
import fs from 'node:fs'
import path from 'node:path'

const HERE = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1')
// data (thumbnails, manifest, groups) stays out of git, in the workspace next to the repo
const DATA = process.env.GEO_ENGINE_DATA || path.resolve(HERE, "../../../domlivo-workspace/geo/photo-engine")
const THUMBS = path.join(DATA, 'thumbs')
fs.mkdirSync(THUMBS, {recursive: true})

const QUERY = `*[_type == "property" && !(_id in path("drafts.**"))]{
  _id, "slug": slug.current, "agent": agent->slug.current, "city": city->slug.current, "district": district->slug.current,
  "lat": coordinatesLat, "lng": coordinatesLng, "precision": locationPrecision, locationSource, locationLevel, locationGroup,
  isPublished, lifecycleStatus, "duplicateOf": duplicateOf._ref, type, area, bedrooms, price, seaDistanceMeters,
  title, description, address,
  "gallery": gallery[]{"assetId": asset._ref, "url": asset->url, "w": asset->metadata.dimensions.width, "h": asset->metadata.dimensions.height, alt}
}`
const res = await fetch(`https://g4aqp6ex.api.sanity.io/v2024-01-01/data/query/production?query=${encodeURIComponent(QUERY)}`)
if (!res.ok) throw new Error(`Sanity query failed: HTTP ${res.status}`)
const rows = (await res.json()).result

const pick = (o) => (o && typeof o === 'object' ? o.en || o.sq || o.ru || Object.values(o).find((v) => typeof v === 'string') || '' : o || '')

const manifest = rows.map((r) => ({
  id: r._id,
  slug: r.slug,
  agent: r.agent,
  city: r.city,
  district: r.district,
  lat: r.lat,
  lng: r.lng,
  precision: r.precision || null,
  source: r.locationSource || null,
  level: r.locationLevel || null,
  group: r.locationGroup || null,
  published: r.isPublished !== false,
  lifecycle: r.lifecycleStatus,
  duplicateOf: r.duplicateOf || null,
  type: r.type,
  area: r.area,
  bedrooms: r.bedrooms,
  price: r.price,
  sea: r.seaDistanceMeters ?? null,
  title: pick(r.title),
  description: r.description || null,
  address: pick(r.address),
  photos: (r.gallery || [])
    .filter((g) => g && g.url && g.assetId)
    .map((g) => ({asset: g.assetId, url: g.url, w: g.w, h: g.h, alt: pick(g.alt) || null})),
}))
fs.writeFileSync(path.join(DATA, 'manifest.json'), JSON.stringify(manifest))

const jobs = []
const seen = new Set()
for (const m of manifest)
  for (const p of m.photos) {
    if (seen.has(p.asset)) continue
    seen.add(p.asset)
    const file = path.join(THUMBS, `${p.asset}.jpg`)
    if (!fs.existsSync(file)) jobs.push({url: `${p.url}?w=512&h=512&fit=max&fm=jpg&q=82`, file})
  }

const byPrecision = {}
for (const m of manifest) byPrecision[m.precision || 'unset'] = (byPrecision[m.precision || 'unset'] || 0) + 1
console.log(`listings ${manifest.length}, precision`, byPrecision, `unique photos ${seen.size}, to fetch ${jobs.length}`)

let done = 0
let failed = 0
async function fetchOne(j, attempt = 1) {
  try {
    const res = await fetch(j.url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    fs.writeFileSync(j.file, Buffer.from(await res.arrayBuffer()))
  } catch (e) {
    if (attempt < 4) {
      await new Promise((r) => setTimeout(r, 1500 * attempt))
      return fetchOne(j, attempt + 1)
    }
    failed++
    console.error('fail', j.url, String(e))
  }
}
let next = 0
await Promise.all(
  Array.from({length: 8}, async () => {
    while (next < jobs.length) {
      await fetchOne(jobs[next++])
      if (++done % 500 === 0) console.log(`…${done}/${jobs.length}`)
    }
  }),
)
console.log(`done ${done}, failed ${failed}`)
