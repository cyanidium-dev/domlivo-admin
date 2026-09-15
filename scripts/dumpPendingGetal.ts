/**
 * The get.al listings that still carry Albanian in every locale, with the
 * facts needed to write their copy. Feeds applyPropertyTranslations.ts.
 *
 * Run: npx tsx scripts/dumpPendingGetal.ts [--skip N] [--limit N]
 */
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
loadDotenv({path: path.resolve(process.cwd(), '.env')})
const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_API_TOKEN?.trim(),
})
const a = process.argv.slice(2)
const skip = a.includes('--skip') ? Number(a[a.indexOf('--skip') + 1]) : 0
const limit = a.includes('--limit') ? Number(a[a.indexOf('--limit') + 1]) : 8
async function main() {
  const rows = await client.fetch(
    `*[_type=="property" && _id match "property-getal-*" && title.en == title.sq] | order(_id) [$from...$to]{
      _id, "sq": title.sq, "desc": description.sq, price, priceUnit, area, plotArea,
      bedrooms, rooms, bathrooms, constructionStage, handoverYear, documentation,
      "type": type->slug.current, "city": city->title.en, "district": district->title.en
    }`,
    {from: skip, to: skip + limit},
  )
  const total = await client.fetch<number>(`count(*[_type=="property" && _id match "property-getal-*" && title.en == title.sq])`)
  console.log(JSON.stringify({pendingTotal: total, batch: rows}, null, 1))
}
// Print only the message: a thrown Sanity client error carries the whole
// request object, Authorization header included, and dumping it puts the
// write token into the terminal and into any log that captures it.
main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1) })
