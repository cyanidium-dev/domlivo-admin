/**
 * One-shot, 2026-09-25. The FAQ on the buying hub (`landing-hub-buying`) said
 * transaction costs are "roughly 3–5% on top of the price", while every
 * listing page computes the same costs from the notary scale, the ASHK fee
 * and a 1% buyer's agency fee — about 1.3% on a €100,000 flat — and the 2%
 * transfer tax is the seller's. Two figures for one fact, on the same site,
 * and the guide's was the one an AI engine would quote. The answer now
 * carries the listing pages' numbers (frontend
 * `src/lib/property/ownershipCosts.ts`, `PURCHASE_COST_RATES`).
 *
 * Only the answer whose current text still names the old range is replaced,
 * per locale, so a later manual edit is never overwritten.
 *
 * Run:
 * - npx tsx scripts/patchBuyingGuideFaq20260925.ts            (dry)
 * - npx tsx scripts/patchBuyingGuideFaq20260925.ts --execute
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.slice(2).includes('--execute')
const DOC_ID = 'landing-hub-buying'
const SECTION_KEY = 'faq'
const OLD_RANGE = /3\s*[–-]\s*5\s*%/

const ANSWER: Record<string, string> = {
  en: 'Less than most people expect. The notary charges 0.23–0.35% of the price, registering the title at ASHK costs about €38, and a buyer’s agency fee, if you use one, is typically 1%. On a €100,000 flat that is roughly €1,340, about 1.3%. The 2% transfer tax is paid by the seller. Every listing page on Domlivo shows the exact figures for its own price.',
  uk: 'Менше, ніж очікує більшість. Нотаріус бере 0,23–0,35% від ціни, реєстрація права власності в ASHK коштує близько €38, а комісія агентства з боку покупця, якщо ви ним користуєтесь, зазвичай 1%. Для квартири за €100 000 це приблизно €1 340, близько 1,3%. Податок на передачу 2% сплачує продавець. На кожній сторінці об’єкта на Domlivo показані точні суми для його ціни.',
  ru: 'Меньше, чем ожидает большинство. Нотариус берёт 0,23–0,35% от цены, регистрация права собственности в ASHK стоит около €38, а комиссия агентства со стороны покупателя, если вы им пользуетесь, обычно 1%. Для квартиры за €100 000 это примерно €1 340, около 1,3%. Налог на передачу 2% платит продавец. На каждой странице объекта на Domlivo показаны точные суммы для его цены.',
  sq: 'Më pak nga sa presin shumica. Noteri merr 0,23–0,35% të çmimit, regjistrimi i pronësisë në ASHK kushton rreth 38 €, dhe komisioni i agjencisë nga ana e blerësit, nëse përdorni një të tillë, është zakonisht 1%. Për një apartament 100 000 € kjo është afërsisht 1 340 €, rreth 1,3%. Taksën e kalimit të pronësisë prej 2% e paguan shitësi. Çdo faqe prone në Domlivo tregon shifrat e sakta për çmimin e vet.',
  it: 'Meno di quanto si pensi. Il notaio chiede lo 0,23–0,35% del prezzo, la registrazione della proprietà all’ASHK costa circa 38 €, e la provvigione dell’agenzia a carico dell’acquirente, se ne usi una, è di norma l’1%. Su un appartamento da 100.000 € sono circa 1.340 €, cioè l’1,3%. L’imposta di trasferimento del 2% la paga il venditore. Ogni pagina di annuncio su Domlivo mostra le cifre esatte per il proprio prezzo.',
  pl: 'Mniej, niż większość zakłada. Notariusz pobiera 0,23–0,35% ceny, rejestracja własności w ASHK kosztuje około 38 €, a prowizja agencji po stronie kupującego, jeśli z niej korzystasz, wynosi zwykle 1%. Przy mieszkaniu za 100 000 € to około 1 340 €, czyli około 1,3%. Podatek od przeniesienia własności 2% płaci sprzedający. Każda strona oferty na Domlivo pokazuje dokładne kwoty dla swojej ceny.',
  de: 'Weniger, als die meisten erwarten. Der Notar berechnet 0,23–0,35 % des Preises, die Eintragung des Eigentums beim ASHK kostet etwa 38 €, und eine Käuferprovision der Agentur, falls Sie eine nutzen, liegt üblicherweise bei 1 %. Bei einer Wohnung für 100.000 € sind das rund 1.340 €, etwa 1,3 %. Die Grunderwerbsteuer von 2 % zahlt der Verkäufer. Jede Angebotsseite auf Domlivo zeigt die genauen Beträge für ihren Preis.',
}

async function main() {
  const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID!,
    dataset: process.env.SANITY_DATASET!,
    apiVersion: '2024-01-01',
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
  })
  const doc = await client.fetch<{
    pageSections?: Array<{_key: string; _type: string; items?: Array<{_key: string; question?: Record<string, string>; answer?: Record<string, unknown>}>}>
  } | null>(`*[_id == $id][0]{ pageSections[]{ _key, _type, items[]{ _key, question, answer } } }`, {id: DOC_ID})
  const faq = doc?.pageSections?.find((s) => s._key === SECTION_KEY && s._type === 'faqSection')
  if (!faq?.items) throw new Error(`${DOC_ID}: no faq section with key "${SECTION_KEY}"`)

  const item = faq.items.find((i) => typeof i.answer?.en === 'string' && OLD_RANGE.test(i.answer.en as string))
  if (!item) {
    console.log('Nothing to do: no English answer names the 3–5% range any more.')
    return
  }
  const patch: Record<string, string> = {}
  for (const [locale, text] of Object.entries(ANSWER)) {
    const current = item.answer?.[locale]
    if (typeof current !== 'string') {
      console.log(`${locale}: answer is not a string (${typeof current}); skipped`)
      continue
    }
    if (!OLD_RANGE.test(current) && locale !== 'en') {
      console.log(`${locale}: current answer does not name the old range; skipped: ${current.slice(0, 80)}…`)
      continue
    }
    patch[`pageSections[_key=="${SECTION_KEY}"].items[_key=="${item._key}"].answer.${locale}`] = text
    console.log(`${locale}: ${current.slice(0, 60)}… -> ${text.slice(0, 60)}…`)
  }
  if (!execute) {
    console.log(`\nDry run: ${Object.keys(patch).length} field(s) would change. Re-run with --execute.`)
    return
  }
  const result = await client.patch(DOC_ID).set(patch).commit()
  console.log(`\nPatched ${DOC_ID}, rev ${result._rev}: ${Object.keys(patch).length} field(s).`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
