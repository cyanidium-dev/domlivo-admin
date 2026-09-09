/**
 * Remove the seeded "Gallery of {city} areas" block from city landings.
 *
 * Durrës and Tirana each carry a `linkedGallerySection` of ten untitled stock
 * photographs — a woman at sunset, alpine peaks, a northern European harbour —
 * linking to `/catalog?city=…&district=…` query strings, two of which name
 * districts that do not exist (`area-1`, `area-2`) and two of which are
 * unpublished. It sits directly above the `relatedPagesAutoSection` that lists
 * the same districts with their real photographs, names and descriptions, so
 * the page shows the districts twice and gets them wrong the first time.
 *
 * The purge is keyed on the seed's signature — a linked gallery in which NOT
 * ONE item carries a title — which is what separates it from the twelve
 * comparison-page galleries, where every item is captioned and points at a real
 * zone page. Those are left untouched, and a gallery that later gets captions
 * stops matching.
 *
 * Run:
 * - npm run purge:seed-galleries -- --dry
 * - npm run purge:seed-galleries -- --execute
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const args = process.argv.slice(2)
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')

if (!token || !projectId) {
  console.error('Error: SANITY_PROJECT_ID and SANITY_API_TOKEN required. Add them to .env')
  process.exit(1)
}
if (!isDry && !isExecute) {
  console.error('Use --dry to preview or --execute to write.')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token})

type Row = {
  _id: string
  citySlug?: string
  galleries: Array<{_key: string; items: number; titled: number}>
  relatedBlocks: number
}

async function run() {
  console.log(`\n=== purge:seed-galleries (${isDry ? 'DRY RUN' : 'EXECUTE'}) ===\n`)

  const rows = await client.fetch<Row[]>(
    `*[_type == "landingPage" && count(pageSections[_type == "linkedGallerySection"]) > 0]{
      _id,
      "citySlug": linkedCity->slug.current,
      "galleries": pageSections[_type == "linkedGallerySection"]{
        _key,
        "items": count(items),
        "titled": count(items[defined(title)])
      },
      "relatedBlocks": count(pageSections[_type == "relatedPagesAutoSection"])
    }`,
  )

  let removed = 0
  for (const row of rows) {
    for (const gallery of row.galleries) {
      if (gallery.titled > 0) continue

      // Never leave a city page with no way into its districts. Every city
      // landing has a `relatedPagesAutoSection` today; this guards the case
      // where one does not, so the purge degrades into a warning rather than
      // stripping the only district links on the page.
      if (row.relatedBlocks === 0) {
        console.warn(
          `  ! ${row.citySlug ?? row._id}: seed gallery ${gallery._key} is the only district ` +
            `block on the page — left in place, give the page a related-pages block first`,
        )
        continue
      }

      console.log(
        `  ${row.citySlug ?? row._id}: remove ${gallery._key} ` +
          `(${gallery.items} untitled items; ${row.relatedBlocks} related-pages block(s) remain)`,
      )
      if (isExecute) {
        await client.patch(row._id).unset([`pageSections[_key=="${gallery._key}"]`]).commit()
      }
      removed += 1
    }
  }

  console.log(`\nDone: ${removed} seed galler${removed === 1 ? 'y' : 'ies'} removed.`)
  if (isDry) console.log('Nothing was written — rerun with --execute.\n')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
