/**
 * Corrects the claim that Durrës has had a new reference-price schedule "in
 * force from 01.01.2026" that tripled the port zone to 200,000 lek/m².
 *
 * It does not. The Ministry of Finance published a draft in July 2025 — 13
 * zones in Durrës, 45,000–200,000 lek/m², the port/marina zone at 200,000 — for
 * application from 1 January 2026. The draft was never approved; the government
 * reopened the review (working group deadline 20 April 2026), and as of July
 * 2026 districts outside Tirana still use the 2016 values, a single urban rate
 * for Durrës (Monitor.al, 2026-02-20, 2026-06-05, 2026-07-09; Vox News). The
 * knowledge base already called it a draft in 12-ai-database; the zone copy and
 * everything built from it did not.
 *
 * Wrong in: city-durres and district-durres-center descriptions, the centre
 * district landing (about text and one FAQ answer), the Durrës comparison
 * "centre vs Plazh", and the Durrës zoneMetrics note — six locales each.
 *
 * Mechanics: in each target string the sentence carrying the claim is replaced
 * (or the whole value, for the FAQ answer and the comparison cell). A value that
 * no longer contains the claim is left alone, so the script is safe to re-run.
 * Backups, ifRevisionID, one transaction.
 *
 * Run:
 *   npx tsx scripts/fixDurresReferencePriceClaim.ts
 *   npx tsx scripts/fixDurresReferencePriceClaim.ts --execute
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const execute = process.argv.includes('--execute')
const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

type L6 = {en: string; uk: string; ru: string; sq: string; it: string; pl: string}
const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl'] as const

/** Detects the claim in any of the six locales. */
export const CLAIM = /01\.01\.2026|1 January 2026|1 січня 2026|1 января 2026|1 janari 2026|1° gennaio 2026|1 stycznia 2026/

/** "Check before you sign" sentence in the centre copy. */
const CENTRE_SENTENCE: L6 = {
  en: 'One thing to check before you sign: notary and tax costs are calculated from the state reference price, not from what you actually pay. Durrës still applies a single city rate; a 2025 draft that would have raised the port zone to 200,000 lek/m² has not been approved and is being revised.',
  uk: 'Що перевірити перед підписанням: нотаріальні витрати й податки рахуються від державної довідкової ціни, а не від суми, яку ви фактично платите. У Дурресі досі діє єдина міська ставка; проєкт 2025 року, який підняв би портову зону до 200 000 лек/м², не затверджено, його переглядають.',
  ru: 'Что проверить до сделки: нотариальные расходы и налоги считаются от государственной справочной цены, а не от суммы, которую вы фактически платите. В Дурресе до сих пор действует единая городская ставка; проект 2025 года, поднимавший портовую зону до 200 000 лек/м², не утверждён и пересматривается.',
  sq: 'Një gjë për t’u kontrolluar para se të firmosni: kostot e noterit dhe taksat llogariten nga çmimi shtetëror i referencës, jo nga shuma që paguani në fakt. Durrësi ende zbaton një tarifë të vetme për qytetin; drafti i vitit 2025 që do ta çonte zonën e portit në 200.000 lekë/m² nuk është miratuar dhe po rishikohet.',
  it: 'Una cosa da verificare prima di firmare: notaio e imposte si calcolano sul prezzo di riferimento statale, non su quanto pagate davvero. Durazzo applica ancora un’unica tariffa cittadina; la bozza del 2025 che avrebbe portato la zona portuale a 200.000 lek/m² non è stata approvata ed è in revisione.',
  pl: 'Jedno warto sprawdzić przed podpisaniem umowy: koszty notarialne i podatki liczy się od państwowej ceny referencyjnej, a nie od kwoty, którą faktycznie płacisz. W Durrës wciąż obowiązuje jedna stawka dla całego miasta; projekt z 2025 roku, który podniósłby strefę portową do 200 000 lek/m², nie został zatwierdzony i jest zmieniany.',
}

/** Closing sentence of the city description. */
const CITY_SENTENCE: L6 = {
  en: 'The state reference price, from which notary and tax costs are calculated, is still a single rate for the whole city: a 2025 draft that would have raised the port zone to 200,000 lek/m² has not been approved.',
  uk: 'Державна довідкова ціна, від якої рахуються нотаріальні витрати й податки, досі єдина для всього міста: проєкт 2025 року, що підняв би портову зону до 200 000 лек/м², не затверджено.',
  ru: 'Государственная справочная цена, от которой считаются нотариальные расходы и налоги, по-прежнему одна на весь город: проект 2025 года, поднимавший портовую зону до 200 000 лек/м², не утверждён.',
  sq: 'Çmimi shtetëror i referencës, nga i cili llogariten kostot e noterit dhe taksat, është ende një tarifë e vetme për gjithë qytetin: drafti i vitit 2025 që do ta çonte zonën e portit në 200.000 lekë/m² nuk është miratuar.',
  it: 'Il prezzo di riferimento statale, su cui si calcolano notaio e imposte, è ancora un’unica tariffa per tutta la città: la bozza del 2025 che avrebbe portato la zona portuale a 200.000 lek/m² non è stata approvata.',
  pl: 'Państwowa cena referencyjna, od której liczy się koszty notarialne i podatki, wciąż jest jedna dla całego miasta: projekt z 2025 roku, który podniósłby strefę portową do 200 000 lek/m², nie został zatwierdzony.',
}

/** Whole FAQ answer: "What should I check before buying in central Durrës?" */
const CENTRE_FAQ_ANSWER: L6 = {
  en: 'The state reference price. Notary and tax costs are calculated from it rather than from the price you pay whenever it is the higher of the two. Durrës still applies a single city rate; a 2025 draft that would have split the city into 13 zones and raised the port zone to 200,000 lek per square metre has not been approved. Ask your notary which value applies to the exact address before you agree the final price.',
  uk: 'Державну довідкову ціну. Нотаріальні витрати й податки рахуються від неї, а не від ціни, яку ви платите, якщо вона вища. У Дурресі досі діє єдина міська ставка; проєкт 2025 року, який поділив би місто на 13 зон і підняв портову зону до 200 000 леків за квадратний метр, не затверджено. Спитайте нотаріуса, яке значення діє для конкретної адреси, до того як погодите остаточну ціну.',
  ru: 'Государственную справочную цену. Нотариальные расходы и налоги считаются от неё, а не от цены, которую вы платите, если она выше. В Дурресе до сих пор действует единая городская ставка; проект 2025 года, который разделил бы город на 13 зон и поднял портовую зону до 200 000 леков за квадратный метр, не утверждён. Спросите нотариуса, какое значение действует для конкретного адреса, до того как согласуете окончательную цену.',
  sq: 'Çmimin shtetëror të referencës. Kostot e noterit dhe taksat llogariten prej tij, jo nga çmimi që paguani, sa herë që ai është më i lartë. Durrësi ende zbaton një tarifë të vetme për qytetin; drafti i vitit 2025 që do ta ndante qytetin në 13 zona dhe do ta çonte zonën e portit në 200.000 lekë për metër katror nuk është miratuar. Pyesni noterin cila vlerë zbatohet për adresën e saktë para se të bini dakord për çmimin përfundimtar.',
  it: 'Il prezzo di riferimento statale. Notaio e imposte si calcolano su quello, invece che sul prezzo pagato, quando è il più alto dei due. Durazzo applica ancora un’unica tariffa cittadina; la bozza del 2025 che avrebbe diviso la città in 13 zone portando la zona portuale a 200.000 lek al metro quadro non è stata approvata. Chiedete al notaio quale valore vale per l’indirizzo esatto prima di concordare il prezzo finale.',
  pl: 'Państwową cenę referencyjną. Koszty notarialne i podatki liczy się od niej, a nie od ceny, którą płacisz, jeśli jest wyższa. W Durrës wciąż obowiązuje jedna stawka dla całego miasta; projekt z 2025 roku, który podzieliłby miasto na 13 stref i podniósłby strefę portową do 200 000 leków za metr kwadratowy, nie został zatwierdzony. Zapytaj notariusza, jaka wartość obowiązuje dla konkretnego adresu, zanim uzgodnisz ostateczną cenę.',
}

/** Whole comparison cell, "What to check" for the centre. */
export const COMPARISON_CELL: L6 = {
  en: 'Notary and tax costs follow the state reference price when it is above the contract price; Durrës still has one city rate, and the 2025 draft that would have tripled the port zone has not been approved — ask the notary which value applies',
  uk: 'Нотаріальні витрати й податки йдуть від державної довідкової ціни, якщо вона вища за ціну договору; у Дурресі досі одна міська ставка, а проєкт 2025 року, що потроїв би портову зону, не затверджено — спитайте нотаріуса, яке значення діє',
  ru: 'Нотариальные расходы и налоги считаются от государственной справочной цены, если она выше цены договора; в Дурресе до сих пор одна городская ставка, а проект 2025 года, утраивавший портовую зону, не утверждён — спросите нотариуса, какое значение действует',
  sq: 'Kostot e noterit dhe taksat ndjekin çmimin shtetëror të referencës kur ai është mbi çmimin e kontratës; Durrësi ka ende një tarifë të vetme, dhe drafti i 2025-s që do ta trefishonte zonën e portit nuk është miratuar — pyesni noterin cila vlerë zbatohet',
  it: 'Notaio e imposte seguono il prezzo di riferimento statale quando supera il prezzo del contratto; Durazzo ha ancora un’unica tariffa cittadina e la bozza del 2025 che avrebbe triplicato la zona portuale non è stata approvata: chiedete al notaio quale valore si applica',
  pl: 'Koszty notarialne i podatki liczy się od państwowej ceny referencyjnej, gdy jest wyższa od ceny z umowy; w Durrës wciąż obowiązuje jedna stawka miejska, a projekt z 2025 roku, który potroiłby strefę portową, nie został zatwierdzony — zapytaj notariusza, jaka wartość obowiązuje',
}

const ZONE_METRICS_NOTE = {
  en: 'City average, up about 18% year on year. The state reference price is still a single city rate: a 2025 draft splitting Durrës into 13 zones, with the port zone at 200,000 lek/m², had not been approved as of July 2026.',
  ru: 'Средняя по городу, рост около 18% г/г. Государственная справочная цена по-прежнему одна на весь город: проект 2025 года с 13 зонами и портовой зоной по 200 000 лек/м² на июль 2026 года не утверждён.',
}

/** Replaces the sentence that carries the claim; returns null when there is nothing to fix. */
export function replaceClaimSentence(text: string, replacement: string): string | null {
  if (!CLAIM.test(text)) return null
  const sentences = text.split(/(?<=[.!?])\s+(?=\S)/)
  const i = sentences.findIndex((s) => CLAIM.test(s))
  sentences[i] = replacement
  return sentences.join(' ')
}

type Plan = {id: string; rev: string; set: Record<string, string>}

async function main(): Promise<void> {
  const docs = await client.fetch<Array<Record<string, any>>>(`*[_id in $ids]`, {
    ids: [
      'city-durres',
      'district-durres-center',
      'landing-district-city-center-durres',
      'landing-comparison-durres-centre-vs-plazh',
      'zoneMetrics-durres-2026-H1',
    ],
  })
  const drafts = await client.fetch<string[]>(`*[_id in $ids]._id`, {ids: docs.map((d) => `drafts.${d._id}`)})
  if (drafts.length) throw new Error(`drafts exist: ${drafts.join(', ')}`)
  const byId = new Map(docs.map((d) => [d._id as string, d]))
  const plans: Plan[] = []
  const plan = (id: string) => {
    const doc = byId.get(id)
    if (!doc) throw new Error(`${id} not found`)
    let p = plans.find((x) => x.id === id)
    if (!p) plans.push((p = {id, rev: doc._rev, set: {}}))
    return {doc, set: p.set}
  }

  for (const id of ['city-durres', 'district-durres-center']) {
    const {doc, set} = plan(id)
    const sentence = id === 'city-durres' ? CITY_SENTENCE : CENTRE_SENTENCE
    for (const l of LOCALES) {
      const next = replaceClaimSentence(doc.description?.[l] ?? '', sentence[l])
      if (next) set[`description.${l}`] = next
    }
  }

  {
    const {doc, set} = plan('landing-district-city-center-durres')
    doc.pageSections.forEach((s: any) => {
      for (const l of LOCALES) {
        ;(s.content?.[l] ?? []).forEach((block: any) =>
          (block.children ?? []).forEach((span: any) => {
            const next = replaceClaimSentence(span.text ?? '', CENTRE_SENTENCE[l])
            if (next) set[`pageSections[_key=="${s._key}"].content.${l}[_key=="${block._key}"].children[_key=="${span._key}"].text`] = next
          }),
        )
      }
      ;(s.items ?? []).forEach((item: any) => {
        if (LOCALES.some((l) => CLAIM.test(item.answer?.[l] ?? ''))) {
          for (const l of LOCALES) set[`pageSections[_key=="${s._key}"].items[_key=="${item._key}"].answer.${l}`] = CENTRE_FAQ_ANSWER[l]
        }
      })
    })
  }

  {
    const {doc, set} = plan('landing-comparison-durres-centre-vs-plazh')
    doc.pageSections.forEach((s: any) =>
      (s.rows ?? []).forEach((row: any) =>
        (row.cells ?? []).forEach((cell: any, ci: number) => {
          if (LOCALES.some((l) => CLAIM.test(cell?.[l] ?? ''))) {
            for (const l of LOCALES) set[`pageSections[_key=="${s._key}"].rows[_key=="${row._key}"].cells[${ci}].${l}`] = COMPARISON_CELL[l]
          }
        }),
      ),
    )
  }

  {
    const {doc, set} = plan('zoneMetrics-durres-2026-H1')
    for (const l of ['en', 'ru'] as const) if (CLAIM.test(doc.notes?.[l] ?? '')) set[`notes.${l}`] = ZONE_METRICS_NOTE[l]
  }

  const todo = plans.filter((p) => Object.keys(p.set).length)
  for (const p of todo) {
    console.log(`${p.id}: ${Object.keys(p.set).length} field(s)`)
    for (const [k, v] of Object.entries(p.set)) console.log(`  ${k}\n    ${v.slice(0, 140)}…`)
  }
  if (!execute) {
    console.log(`\nDry run: ${todo.length} documents. Re-run with --execute.`)
    return
  }
  if (!todo.length) return
  const dir = path.resolve(process.cwd(), 'scripts/data/backups', `referencePriceClaim-${new Date().toISOString().replace(/[:.]/g, '-')}`)
  fs.mkdirSync(dir, {recursive: true})
  for (const p of todo) fs.writeFileSync(path.join(dir, `${p.id}.json`), JSON.stringify(byId.get(p.id), null, 2))
  const tx = client.transaction()
  for (const p of todo) tx.patch(p.id, (patch) => patch.ifRevisionId(p.rev).set(p.set))
  console.log(`Written in transaction ${(await tx.commit()).transactionId}. Backups: ${dir}`)
}

if (process.argv[1]?.includes('fixDurresReferencePriceClaim')) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e)
    process.exit(1)
  })
}
