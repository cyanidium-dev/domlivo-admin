/**
 * Open dataset of Domlivo asking prices — a monthly snapshot for Kaggle,
 * Zenodo and GitHub (docs/seo/FREE-LINKS-PLAN-2026-10-14.md §2d, frontend repo).
 * A citable dataset with "Source: Domlivo, domlivo.com" is a link-earning
 * asset that does not depend on anyone selling a link.
 *
 * Writes ../domlivo-workspace/datasets/albania-property-asking-prices/<date>/:
 *   listings.csv   one row per published sale listing with a total price
 *   districts.csv  per city/district/type: n, median, q1, q3 of €/m² (n ≥ 3)
 *   README.md      methodology, columns, licence (CC BY 4.0)
 *
 * Left out on purpose: agent and agency names, contacts, exact address and
 * coordinates, listing text and photos (partners' data), and the listing URL.
 * `listing_key` is a stable hash so a row can be followed across snapshots
 * without identifying the listing.
 *
 *   npx tsx scripts/exportOpenDataset.ts [--date 2026-10-14]
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import {config} from 'dotenv'
import {createClient} from '@sanity/client'

config({path: path.resolve(process.cwd(), '.env')})
const args = process.argv.slice(2)
const date = args.includes('--date') ? args[args.indexOf('--date') + 1] : new Date().toISOString().slice(0, 10)
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2025-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

type Row = {
  slug: string
  city?: string
  district?: string
  type?: string
  bedrooms?: number
  area?: number
  price?: number
  priceUnit?: string
  stage?: string
  sea?: number
  beachfront?: boolean
}

const csvCell = (v: unknown) => {
  if (v === null || v === undefined) return ''
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const quantile = (sorted: number[], q: number) => {
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo))
}
const seaBucket = (r: Row) =>
  r.beachfront ? '0-300' : typeof r.sea !== 'number' ? '' : r.sea <= 300 ? '0-300' : r.sea <= 1000 ? '300-1000' : '1000+'

async function main() {
  const rows = await client.fetch<Row[]>(`*[_type=="property" && !(_id in path("drafts.**")) && status=="sale" && isPublished != false]{
    "slug": slug.current, "city": city->slug.current, "district": district->slug.current, "type": type->slug.current,
    bedrooms, area, price, priceUnit, "stage": constructionStage, "sea": seaDistanceMeters, beachfront
  }`)
  const out = rows
    .filter((r) => r.slug && typeof r.price === 'number' && r.price > 0 && r.priceUnit !== 'per-sqm')
    .map((r) => {
      const area = typeof r.area === 'number' && r.area >= 15 ? Math.round(r.area * 10) / 10 : null
      return {
        snapshot_date: date,
        listing_key: crypto.createHash('sha1').update(r.slug).digest('hex').slice(0, 12),
        city: r.city ?? '',
        district: r.district ?? '',
        property_type: r.type ?? '',
        bedrooms: typeof r.bedrooms === 'number' ? r.bedrooms : '',
        area_m2: area ?? '',
        asking_price_eur: Math.round(r.price!),
        price_per_m2_eur: area ? Math.round(r.price! / area) : '',
        new_build: r.stage === 'off-plan' || r.stage === 'under-construction' ? 1 : 0,
        sea_distance_m_bucket: seaBucket(r),
      }
    })
    .sort((a, b) => a.city.localeCompare(b.city) || a.district.localeCompare(b.district) || a.asking_price_eur - b.asking_price_eur)

  const dir = path.resolve(process.cwd(), '../domlivo-workspace/datasets/albania-property-asking-prices', date)
  fs.mkdirSync(dir, {recursive: true})
  const cols = Object.keys(out[0])
  fs.writeFileSync(path.join(dir, 'listings.csv'), [cols.join(','), ...out.map((r) => cols.map((c) => csvCell((r as Record<string, unknown>)[c])).join(','))].join('\n') + '\n')

  const groups = new Map<string, number[]>()
  for (const r of out) {
    if (typeof r.price_per_m2_eur !== 'number' || r.property_type === 'land') continue
    const key = [r.city, r.district || '(city-wide)', r.property_type].join('|')
    groups.set(key, [...(groups.get(key) ?? []), r.price_per_m2_eur])
  }
  const agg = [...groups.entries()]
    .filter(([, v]) => v.length >= 3)
    .map(([k, v]) => {
      const s = [...v].sort((a, b) => a - b)
      const [city, district, type] = k.split('|')
      return [date, city, district, type, s.length, quantile(s, 0.5), quantile(s, 0.25), quantile(s, 0.75)]
    })
  fs.writeFileSync(
    path.join(dir, 'districts.csv'),
    ['snapshot_date,city,district,property_type,n,median_eur_per_m2,q1_eur_per_m2,q3_eur_per_m2', ...agg.map((r) => r.map(csvCell).join(','))].join('\n') + '\n',
  )

  const cities = [...new Set(out.map((r) => r.city))].filter(Boolean)
  fs.writeFileSync(
    path.join(dir, 'README.md'),
    `# Albania property asking prices — Domlivo snapshot ${date}

Asking prices of residential and commercial property for sale in Albania, as listed on
[Domlivo](https://www.domlivo.com) on ${date}: ${out.length} listings in ${cities.length} cities
(${cities.join(', ')}). Most listings are in Durrës and its coastal districts.

**Source:** Domlivo, https://www.domlivo.com — please cite as
"Domlivo, Albania property asking prices, snapshot ${date}, https://www.domlivo.com".
**Licence:** CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).
Monthly commentary: https://www.domlivo.com/en/blog (Durrës asking-price index).

## What this is — and is not
- **Asking prices**, not transaction prices: what sellers and agencies ask on active listings.
- Listings quoted per m² (off-plan units) are excluded, as are listings without a price.
- Areas under 15 m² are treated as missing (data-entry errors).
- No agent names, contacts, addresses, coordinates, texts or photos are included.
  \`listing_key\` is a hash that lets you follow a listing across monthly snapshots.

## listings.csv
| column | meaning |
|---|---|
| snapshot_date | date of the snapshot (UTC) |
| listing_key | stable anonymous id (hash) |
| city, district | slugs as used on domlivo.com (e.g. durres, golem-durres) |
| property_type | apartment, studio, penthouse, house, villa, land, commercial-space, … |
| bedrooms | bedrooms as listed (1 = "1+1"); empty when not given |
| area_m2 | floor area in m² as listed; empty when missing or < 15 |
| asking_price_eur | total asking price, EUR |
| price_per_m2_eur | asking_price_eur ÷ area_m2, rounded |
| new_build | 1 if off-plan or under construction |
| sea_distance_m_bucket | 0-300, 300-1000, 1000+ (metres to the sea, from the listing or the OSM shoreline); empty if unknown |

## districts.csv
Median and quartiles of price per m² by city, district and type, where a group has at least 3 listings (land excluded).
`,
  )
  console.log(`wrote ${dir}: ${out.length} listings, ${agg.length} district groups`)
}
main().catch((e) => { console.error(e.message); process.exit(1) })
