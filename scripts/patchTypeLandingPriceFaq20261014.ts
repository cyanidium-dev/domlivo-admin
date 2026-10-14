/**
 * One-shot, 2026-10-14. The type × city guides answered "How much does an
 * apartment cost in Durrës?" with "the figures are right above". The answer
 * now gives live figures from the page's own feed filter (city + type, sale):
 * {count}, {fromPrice}, {medianPricePerSqm} — filled at render by the
 * frontend (b4a5254, "live figures in FAQ answers").
 *
 * Only guides with at least MIN_LISTINGS listings: with none the tokens drop
 * out and the sentence would read empty; those keep their old answer.
 * The first FAQ item is replaced only while it still holds the old text.
 *
 *   npx tsx scripts/patchTypeLandingPriceFaq20261014.ts [--execute]
 */
import path from 'node:path'
import {config} from 'dotenv'
import {createClient} from '@sanity/client'

config({path: path.resolve(process.cwd(), '.env')})
const execute = process.argv.includes('--execute')
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2025-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})
const MIN_LISTINGS = 3

const ANSWER: Record<string, string> = {
  en: 'Asking prices on Domlivo today: {count} listings of this type in the city, from {fromPrice}, with a median of {medianPricePerSqm} per m². These are asking prices, not sale prices; the figures above show the market by district.',
  uk: "Ціни пропозиції на Domlivo сьогодні: об'єктів цього типу в місті — {count}, від {fromPrice}, медіана — {medianPricePerSqm} за м². Це ціни з оголошень, а не угод; ринок за районами — у цифрах вище.",
  ru: 'Цены предложения на Domlivo сегодня: объектов этого типа в городе — {count}, от {fromPrice}, медиана — {medianPricePerSqm} за м². Это цены из объявлений, а не сделок; рынок по районам — в цифрах выше.',
  pl: 'Ceny ofertowe w Domlivo dziś: ofert tego typu w mieście — {count}, od {fromPrice}, mediana — {medianPricePerSqm} za m². To ceny z ogłoszeń, nie z transakcji; rynek według dzielnic pokazują liczby powyżej.',
  it: 'Prezzi richiesti su Domlivo oggi: annunci di questo tipo in città — {count}, da {fromPrice}, mediana {medianPricePerSqm} al m². Sono prezzi degli annunci, non di compravendita; il mercato per zona è nelle cifre qui sopra.',
  de: 'Angebotspreise auf Domlivo heute: Inserate dieses Typs in der Stadt — {count}, ab {fromPrice}, Median {medianPricePerSqm} pro m². Das sind Angebots-, keine Verkaufspreise; den Markt nach Stadtteilen zeigen die Zahlen oben.',
  sq: 'Çmimet e kërkuara në Domlivo sot: njoftime të këtij lloji në qytet — {count}, nga {fromPrice}, mediana {medianPricePerSqm} për m². Janë çmime njoftimesh, jo shitjesh; tregun sipas lagjeve e tregojnë shifrat më lart.',
}
/** The old answer pointed at the figures "above"; replace only that one. */
const OLD = /stats band|блок статистики|Kennzahlenleiste|blocco statistiche|blok statystyk|blloku i statistikave/

async function main() {
  const docs = await client.fetch<
    Array<{_id: string; _rev: string; n: number; faqKey?: string; item?: {_key: string; answer?: Record<string, string>}}>
  >(`*[_id match "landing-type-*" && !(_id in path("drafts.**"))]{
      _id, _rev,
      "f": pageSections[_type=="propertyCarouselSection"][0].filters,
      "faqKey": pageSections[_type=="faqSection"][0]._key,
      "item": pageSections[_type=="faqSection"][0].items[0]{_key, answer}
    }{..., "n": count(*[_type=="property" && !(_id in path("drafts.**")) && status=="sale" && city._ref == ^.f.city._ref && type._ref == ^.f.propertyType._ref])}`)
  const tx = client.transaction()
  let count = 0
  for (const d of docs) {
    if (d.n < MIN_LISTINGS) { console.log('skip (listings)', d._id, d.n); continue }
    if (!d.faqKey || !d.item?._key) { console.log('skip (no faq)', d._id); continue }
    if (!OLD.test(d.item.answer?.en ?? '')) { console.log('skip (answer already changed)', d._id); continue }
    const set: Record<string, string> = {}
    for (const [l, text] of Object.entries(ANSWER)) {
      set[`pageSections[_key=="${d.faqKey}"].items[_key=="${d.item._key}"].answer.${l}`] = text
    }
    tx.patch(d._id, (p) => p.ifRevisionId(d._rev).set(set))
    count++
    console.log('patch', d._id, d.n)
  }
  console.log(`${execute ? 'EXECUTE' : 'DRY'}: ${count} docs`)
  if (execute && count) console.log('transaction', (await tx.commit()).transactionId)
}
main().catch((e) => { console.error(e.message); process.exit(1) })
