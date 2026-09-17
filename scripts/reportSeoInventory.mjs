/**
 * SEO inventory report: public sale listings by city and district, with the
 * type, bedroom, budget, sea and new-build slices the frontend's SEO page
 * registry counts, and data completeness per field.
 *
 * Feeds docs/seo/inventory-analysis.md in your-house-albania. Re-run monthly
 * and before changing any threshold in src/lib/seo/pages/policy.ts there.
 *
 *   node scripts/reportSeoInventory.mjs [outDir]   → outDir/inventory.json (default: .)
 *
 * Read-only.
 */
import 'dotenv/config'
import fs from 'node:fs'
import {createClient} from '@sanity/client'
const c = createClient({projectId: process.env.SANITY_PROJECT_ID, dataset: process.env.SANITY_DATASET, apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_API_TOKEN})

const rows = await c.fetch(`*[_type=="property" && !(_id in path("drafts.**"))]{
  _id, isPublished, lifecycleStatus, status, price, priceUnit, area, plotArea, bedrooms, bathrooms, rooms,
  seaDistanceMeters, beachfront, constructionStage, yearBuilt, investment,
  "lat": coordinatesLat, "lng": coordinatesLng, locationPrecision,
  "type": type->slug.current,
  "city": city->slug.current, "cityPub": city->isPublished,
  "district": district->slug.current, "districtTitle": district->title.en, "districtPub": district->isPublished,
  "agent": agent->_id,
  "amen": amenitiesRefs[]->slug.current,
  "hasDesc": defined(description.en), "imgs": count(gallery),
  _createdAt, _updatedAt
}`)

const pub = rows.filter((r) => r.isPublished === true && (r.lifecycleStatus === 'active' || !r.lifecycleStatus))
const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2) }
const pct = (n, d) => (d ? Math.round((100 * n) / d) : 0)
const FLATS = ['apartment', 'studio', 'penthouse']

function summarize(items) {
  const sale = items.filter((r) => r.status === 'sale')
  const byType = {}
  for (const r of sale) byType[r.type ?? '∅'] = (byType[r.type ?? '∅'] ?? 0) + 1
  const flats = sale.filter((r) => FLATS.includes(r.type))
  const beds = {}
  for (const r of flats) { const k = r.bedrooms == null ? '∅' : r.bedrooms >= 4 ? '4+' : String(r.bedrooms); beds[k] = (beds[k] ?? 0) + 1 }
  const totals = sale.filter((r) => r.price > 0 && r.priceUnit !== 'per-sqm').map((r) => r.price)
  const flatTotals = flats.filter((r) => r.price > 0 && r.priceUnit !== 'per-sqm').map((r) => r.price)
  const sqm = flats.flatMap((r) => (r.price > 0 ? (r.priceUnit === 'per-sqm' ? [r.price] : r.area >= 15 ? [Math.round(r.price / r.area)] : []) : []))
  const nearSea = sale.filter((r) => r.beachfront === true || (typeof r.seaDistanceMeters === 'number' && r.seaDistanceMeters <= 300)).length
  const seaKnown = sale.filter((r) => typeof r.seaDistanceMeters === 'number' || r.beachfront === true).length
  const seaView = sale.filter((r) => (r.amen ?? []).some((a) => /sea-view/.test(a ?? ''))).length
  const newBuild = sale.filter((r) => ['off-plan', 'under-construction'].includes(r.constructionStage)).length
  const recent = sale.filter((r) => r.yearBuilt >= 2020).length
  const under80 = flats.filter((r) => r.price > 0 && r.priceUnit !== 'per-sqm' && r.price <= 80000).length
  const under100 = flats.filter((r) => r.price > 0 && r.priceUnit !== 'per-sqm' && r.price <= 100000).length
  const perSqmPriced = sale.filter((r) => r.priceUnit === 'per-sqm').length
  return {
    total: items.length, sale: sale.length, rent: items.filter((r) => r.status !== 'sale').length,
    byType, beds, flats: flats.length,
    priceMin: totals.length ? Math.min(...totals) : null, priceMax: totals.length ? Math.max(...totals) : null,
    medianPrice: median(totals), medianFlatPrice: median(flatTotals), medianFlatSqm: median(sqm), sqmSample: sqm.length,
    nearSea, seaKnown, seaView, newBuild, recent, under80, under100, perSqmPriced,
    completeness: {
      area: pct(sale.filter((r) => r.area > 0).length, sale.length),
      beds: pct(flats.filter((r) => r.bedrooms != null).length, flats.length),
      coords: pct(sale.filter((r) => r.lat && r.lng).length, sale.length),
      sea: pct(seaKnown, sale.length),
      year: pct(sale.filter((r) => r.yearBuilt).length, sale.length),
      stage: pct(sale.filter((r) => r.constructionStage).length, sale.length),
      district: pct(sale.filter((r) => r.district).length, sale.length),
      desc: pct(sale.filter((r) => r.hasDesc).length, sale.length),
      images5: pct(sale.filter((r) => r.imgs >= 5).length, sale.length),
    },
    agents: Object.entries(sale.reduce((o, r) => ((o[r.agent] = (o[r.agent] ?? 0) + 1), o), {})).sort((a, b) => b[1] - a[1]).slice(0, 4),
  }
}

const out = {
  generatedAt: new Date().toISOString(),
  allDocs: rows.length,
  published: pub.length,
  unpublishedOrInactive: rows.length - pub.length,
  lifecycle: rows.reduce((o, r) => ((o[`${r.isPublished}/${r.lifecycleStatus ?? '∅'}/${r.status}`] = (o[`${r.isPublished}/${r.lifecycleStatus ?? '∅'}/${r.status}`] ?? 0) + 1), o), {}),
  albania: summarize(pub),
  cities: {},
  districts: {},
  amenities: Object.entries(pub.flatMap((r) => r.amen ?? []).reduce((o, a) => ((o[a] = (o[a] ?? 0) + 1), o), {})).sort((a, b) => b[1] - a[1]),
}
for (const city of [...new Set(pub.map((r) => r.city))]) out.cities[city] = summarize(pub.filter((r) => r.city === city))
for (const key of [...new Set(pub.map((r) => `${r.city}/${r.district ?? '∅'}`))]) {
  const [city, district] = key.split('/')
  const items = pub.filter((r) => r.city === city && (r.district ?? '∅') === district)
  out.districts[key] = {title: items[0]?.districtTitle, published: items[0]?.districtPub, ...summarize(items)}
}
const dir = process.argv[2] ?? '.'
fs.writeFileSync(`${dir}/inventory.json`, JSON.stringify(out, null, 1))
console.log('published', pub.length, 'of', rows.length, 'cities', Object.keys(out.cities).length, 'districts', Object.keys(out.districts).length)
console.log(JSON.stringify(out.lifecycle))
