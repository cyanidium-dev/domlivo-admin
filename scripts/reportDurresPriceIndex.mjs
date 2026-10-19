/**
 * Durrës asking-price index: the figures behind the monthly index article.
 *
 * Same public filter and the same arithmetic as the site's Domlivo Price
 * Index (your-house-albania: src/lib/priceIndex, docs/price-index.md):
 * published, active sale listings; flats = apartment + studio (penthouses were
 * in until 2026-10-19, the site never counted them); median total price over
 * listings priced as a total; €/m² = total / area (area >= 15 m²) or the stated
 * rate for per-m² listings; a district is reported from 3 flats.
 *
 * Read-only. Prints JSON; pass a path to also write it.
 *   node scripts/reportDurresPriceIndex.mjs [out.json]
 *
 * No edition without new figures: when the result equals the newest earlier
 * `durres-*.json` in scripts/data/price-index/ apart from `asOf`, nothing is
 * written and the script exits with code 3. The October 2026 edition repeated
 * September's figures word for word; an index that publishes the same numbers
 * twice under two dates tells a reader the market stood still when it did not.
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import {createClient} from '@sanity/client'

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

const FLAT_TYPES = ['apartment', 'studio']
const MIN_FLATS = 3

const rows = await client.fetch(`*[_type=="property" && !(_id in path("drafts.**")) && city->slug.current=="durres"]{
  isPublished, lifecycleStatus, status, price, priceUnit, area, bedrooms,
  constructionStage, seaDistanceMeters, beachfront,
  "type": type->slug.current,
  "district": district->slug.current, "districtTitle": district->title.en, "districtPub": district->isPublished != false
}`)

const pub = rows.filter((r) => r.isPublished === true && (r.lifecycleStatus === 'active' || !r.lifecycleStatus) && r.status === 'sale')

const median = (xs) => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return Math.round(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2)
}

function summarize(items) {
  const flats = items.filter((r) => FLAT_TYPES.includes(r.type))
  const totals = flats.filter((r) => r.price > 0 && r.priceUnit !== 'per-sqm').map((r) => r.price)
  const perSqm = flats.flatMap((r) => {
    if (!(r.price > 0)) return []
    if (r.priceUnit === 'per-sqm') return [r.price]
    return r.area >= 15 ? [Math.round(r.price / r.area)] : []
  })
  return {
    listings: items.length,
    flats: flats.length,
    flatPriceFrom: totals.length ? Math.min(...totals) : null,
    medianFlatPrice: median(totals),
    medianPerSqm: median(perSqm),
    perSqmSample: perSqm.length,
  }
}

const flatsAll = pub.filter((r) => FLAT_TYPES.includes(r.type))
const byBedrooms = {}
for (const b of [0, 1, 2, 3]) {
  const items = flatsAll.filter((r) => (b === 0 ? r.type === 'studio' : r.type !== 'studio' && r.bedrooms === b))
  byBedrooms[b === 0 ? 'studio' : `${b}+1`] = summarize(items)
}

const byDistrict = {}
for (const r of pub) {
  if (!r.district || !r.districtPub) continue
  ;(byDistrict[r.district] ??= {title: r.districtTitle, items: []}).items.push(r)
}
const districts = Object.entries(byDistrict)
  .map(([slug, d]) => ({slug, title: d.title, ...summarize(d.items)}))
  .filter((d) => d.flats >= MIN_FLATS)
  .sort((a, b) => b.listings - a.listings)

const nearSea = flatsAll.filter((r) => r.beachfront === true || (typeof r.seaDistanceMeters === 'number' && r.seaDistanceMeters <= 300))
const seaKnown = flatsAll.filter((r) => r.beachfront === true || typeof r.seaDistanceMeters === 'number')
const newBuild = flatsAll.filter((r) => ['off-plan', 'under-construction'].includes(r.constructionStage))
const totalsAll = flatsAll.filter((r) => r.price > 0 && r.priceUnit !== 'per-sqm').map((r) => r.price)

const out = {
  asOf: new Date().toISOString().slice(0, 10),
  city: summarize(pub),
  byBedrooms,
  districts,
  nearSea300m: {...summarize(nearSea), seaDataKnownFlats: seaKnown.length},
  newBuild: summarize(newBuild),
  priceBands: {
    under60k: totalsAll.filter((p) => p < 60000).length,
    from60to100k: totalsAll.filter((p) => p >= 60000 && p < 100000).length,
    from100to150k: totalsAll.filter((p) => p >= 100000 && p < 150000).length,
    from150k: totalsAll.filter((p) => p >= 150000).length,
    pricedAsTotal: totalsAll.length,
  },
}

console.log(JSON.stringify(out, null, 1))

/** Everything but the date: two editions with equal figures are one edition. */
const figuresOf = (json) => JSON.stringify({...json, asOf: undefined})

const target = process.argv[2]
if (target) {
  const dir = path.dirname(path.resolve(target))
  const previous = fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((f) => /^durres-\d{4}-\d{2}\.json$/.test(f) && path.resolve(dir, f) !== path.resolve(target))
        .sort()
        .at(-1)
    : undefined
  if (previous && figuresOf(JSON.parse(fs.readFileSync(path.join(dir, previous), 'utf8'))) === figuresOf(out)) {
    console.error(
      `\nFigures unchanged since ${previous}: no new edition this month (docs rule: your-house-albania docs/price-index.md). Nothing written.`,
    )
    process.exit(3)
  }
  fs.writeFileSync(target, JSON.stringify(out, null, 1))
}
