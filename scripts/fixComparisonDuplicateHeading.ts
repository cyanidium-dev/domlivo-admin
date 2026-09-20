/**
 * One-shot. Every zone comparison landing rendered the same H2 twice: the
 * stats band and the price table under it were both titled
 * "{a} against {b}, by the numbers" (generateComparisonLandings.ts used
 * T.compareTable for both). Found by the 2026-09-20 audit on
 * /guides/durres-vs-vlore and /guides/tirana-vs-durres.
 *
 * The price table gets a heading of its own, without the place names, so no
 * locale needs a declension. Only documents where the two titles are still
 * identical are touched, which makes the script safe to re-run.
 *
 * Run:
 * - npx tsx scripts/fixComparisonDuplicateHeading.ts            (dry)
 * - npx tsx scripts/fixComparisonDuplicateHeading.ts --execute
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.slice(2).includes('--execute')

const PRICE_TABLE_TITLE: Record<string, string> = {
  en: 'Asking prices per m², zone by zone',
  uk: 'Ціни за м² по зонах',
  ru: 'Цены за м² по зонам',
  sq: 'Çmimet për m² sipas zonave',
  it: 'Prezzi al m², zona per zona',
  pl: 'Ceny za m² według stref',
  de: 'Preise pro m² nach Zonen',
}

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

type Section = {_key: string; _type: string; title?: Record<string, string>}

async function main(): Promise<void> {
  const docs: {_id: string; pageSections: Section[]}[] = await client.fetch(
    `*[_type=="landingPage" && !(_id in path("drafts.**"))
       && count(pageSections[_type=="statsBandSection"]) > 0
       && count(pageSections[_type=="zonePriceTableAutoSection"]) > 0]{_id, pageSections[]{_key,_type,title}}`,
  )

  const tx = client.transaction()
  let touched = 0

  for (const doc of docs) {
    const stats = doc.pageSections.find((s) => s._type === 'statsBandSection')
    const prices = doc.pageSections.find((s) => s._type === 'zonePriceTableAutoSection')
    if (!stats?.title || !prices?.title) continue
    if (stats.title.en !== prices.title.en) continue

    // Keep only the locales the document already has: a landing restricted to
    // some locales must not grow a title in a language it is not published in.
    const next: Record<string, string> = {}
    for (const locale of Object.keys(prices.title)) {
      if (locale.startsWith('_')) continue
      next[locale] = PRICE_TABLE_TITLE[locale] ?? prices.title[locale]
    }

    console.log(`${doc._id}: "${prices.title.en}" -> "${next.en}" (${Object.keys(next).join(', ')})`)
    tx.patch(doc._id, (p) => p.set({[`pageSections[_key=="${prices._key}"].title`]: next}))
    touched += 1
  }

  console.log(`${touched} of ${docs.length} landings have the duplicate heading.`)
  if (!execute) {
    console.log('Dry run. Re-run with --execute to write.')
    return
  }
  if (touched === 0) return
  const res = await tx.commit()
  console.log(`Committed transaction ${res.transactionId}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
