/**
 * One-shot, 2026-09-30. Search Console: the Polish queries about Saranda
 * prices ("wzrost cen nieruchomości w sarandzie", "nieruchomości saranda")
 * land on the guide `czy-warto-kupic-mieszkanie-w-albanii` at position 11,
 * while the Saranda price page (/albania/sarande/info) exists and is never
 * linked from it. One closing paragraph sends the reader to that page and to
 * the Bank of Albania H1 2026 survey article.
 *
 * Appends only when the paragraph is not there yet.
 *
 * Run:
 * - npx tsx scripts/patchPlGuideSarandaLink20260930.ts            (dry)
 * - npx tsx scripts/patchPlGuideSarandaLink20260930.ts --execute
 */
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const execute = process.argv.slice(2).includes('--execute')
const DOC_ID = 'landing-pl-czy-warto-kupic-mieszkanie-w-albanii'
const KEY = 'czy-warto-saranda-2026-09-30'

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID || 'g4aqp6ex',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  apiVersion: '2025-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
})

const block = {
  _key: `${KEY}-b`,
  _type: 'block',
  style: 'normal',
  markDefs: [
    {_key: `${KEY}-l0`, _type: 'link', href: '/albania/sarande/info'},
    {_key: `${KEY}-l1`, _type: 'link', href: '/blog/albania-property-market-h1-2026'},
  ],
  children: [
    {_key: `${KEY}-s0`, _type: 'span', marks: [], text: 'Jeśli interesuje Cię Saranda, sprawdź '},
    {_key: `${KEY}-s1`, _type: 'span', marks: [`${KEY}-l0`], text: 'aktualne ceny mieszkań w Sarandzie według dzielnic'},
    {_key: `${KEY}-s2`, _type: 'span', marks: [], text: ', przeliczane co godzinę z ofert, oraz '},
    {_key: `${KEY}-s3`, _type: 'span', marks: [`${KEY}-l1`], text: 'wyniki ankiety Banku Albanii za I półrocze 2026'},
    {_key: `${KEY}-s4`, _type: 'span', marks: [], text: ': ceny w skali kraju przestały rosnąć, a mieszkania na wybrzeżu sprzedają się najszybciej, w 8,2 miesiąca.'},
  ],
}

async function main() {
  const doc = await client.fetch<{_rev: string; keys: string[]}>(
    `*[_id==$id][0]{_rev, "keys": pageSections[_key=="body"][0].content.pl[]._key}`,
    {id: DOC_ID},
  )
  if (!doc) throw new Error(`${DOC_ID} not found`)
  const present = doc.keys.includes(block._key)
  console.log(execute ? 'EXECUTE' : 'DRY', {rev: doc._rev, blocks: doc.keys.length, present})
  if (!execute || present) return
  const res = await client
    .patch(DOC_ID)
    .insert('after', 'pageSections[_key=="body"].content.pl[-1]', [block])
    .commit()
  console.log('patched, rev', res._rev)
}
main().catch((e) => { console.error(e.message); process.exit(1) })
