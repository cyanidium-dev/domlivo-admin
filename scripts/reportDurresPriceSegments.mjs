/**
 * Durrës asking prices by segment, for the answer block on /durres/info and
 * the lead of the monthly index article. Same public filter and the same
 * €/m² arithmetic as reportDurresPriceIndex.mjs; adds a 20th–80th percentile
 * band per segment, which is what "prices range from … to …" should mean.
 *
 * Segments (flats = apartment + studio + penthouse):
 * - resaleInland: not off-plan / under construction, more than 1 km from the sea
 * - newBuild: off-plan or under construction
 * - centreSeafront: district city centre, or beachfront / within 300 m of the sea
 * - byDistrict: every published district with at least 3 priced flats
 *
 * Read-only. Prints JSON; pass a path to also write it.
 *   node scripts/reportDurresPriceSegments.mjs [out.json]
 */
import 'dotenv/config'
import fs from 'node:fs'
import {createClient} from '@sanity/client'

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

const FLAT_TYPES = ['apartment', 'studio', 'penthouse']
const NEW_STAGES = ['off-plan', 'under-construction']

const rows = await client.fetch(`*[_type=="property" && !(_id in path("drafts.**")) && city->slug.current=="durres"]{
  isPublished, lifecycleStatus, status, price, priceUnit, area,
  constructionStage, seaDistanceMeters, beachfront,
  "type": type->slug.current,
  "district": district->slug.current, "districtTitle": district->title.en, "districtPub": district->isPublished != false
}`)

const pub = rows.filter((r) => r.isPublished === true && (r.lifecycleStatus === 'active' || !r.lifecycleStatus) && r.status === 'sale')
const flats = pub.filter((r) => FLAT_TYPES.includes(r.type))

const perSqm = (r) => {
  if (!(r.price > 0)) return null
  if (r.priceUnit === 'per-sqm') return r.price
  return r.area >= 15 ? Math.round(r.price / r.area) : null
}
const q = (xs, p) => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const i = (s.length - 1) * p
  const lo = Math.floor(i), hi = Math.ceil(i)
  return Math.round(s[lo] + (s[hi] - s[lo]) * (i - lo))
}
const band = (items) => {
  const xs = items.map(perSqm).filter((v) => v !== null)
  return {flats: items.length, priced: xs.length, p20: q(xs, 0.2), median: q(xs, 0.5), p80: q(xs, 0.8), min: xs.length ? Math.min(...xs) : null, max: xs.length ? Math.max(...xs) : null}
}

const isNew = (r) => NEW_STAGES.includes(r.constructionStage)
const nearSea = (r) => r.beachfront === true || (typeof r.seaDistanceMeters === 'number' && r.seaDistanceMeters <= 300)
const inland = (r) => typeof r.seaDistanceMeters === 'number' && r.seaDistanceMeters > 1000
const centre = (r) => r.district === 'city-center-durres' || r.district === 'center' || /center|centre|qender/i.test(r.district || '')

const districts = {}
for (const r of flats) {
  if (!r.district || !r.districtPub) continue
  ;(districts[r.district] ??= {title: r.districtTitle, items: []}).items.push(r)
}

const out = {
  asOf: new Date().toISOString().slice(0, 10),
  all: band(flats),
  resaleInland: band(flats.filter((r) => !isNew(r) && inland(r))),
  resaleNotNew: band(flats.filter((r) => !isNew(r))),
  newBuild: band(flats.filter(isNew)),
  centreSeafront: band(flats.filter((r) => centre(r) || nearSea(r))),
  seaKnown: flats.filter((r) => typeof r.seaDistanceMeters === 'number' || r.beachfront === true).length,
  stages: Object.fromEntries([...new Set(flats.map((r) => r.constructionStage || 'unknown'))].map((s) => [s, flats.filter((r) => (r.constructionStage || 'unknown') === s).length])),
  districtSlugs: Object.keys(districts),
  byDistrict: Object.entries(districts).map(([slug, d]) => ({slug, title: d.title, ...band(d.items)})).filter((d) => d.priced >= 3).sort((a, b) => b.flats - a.flats),
}
console.log(JSON.stringify(out, null, 1))
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1))
