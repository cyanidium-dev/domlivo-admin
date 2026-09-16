/**
 * Golem and Ksamil stated the state reference price in euros per unit:
 * "€56,500 per unit" and "€60,000–100,000 per unit". Reference prices are lek
 * per square metre. Golem's figure is 56,500 lek/m² (zoneMetrics, Udhëzim
 * 34/2023 compilation) — about €610/m², not €56,500 a flat. Ksamil's 60,000–
 * 100,000 lek/m² comes from the 2026 draft map, which has not been approved
 * (see fixDurresReferencePriceClaim.ts).
 *
 * Golem: the figure is rewritten in place, in every locale and every field that
 * carries it (description, about text, FAQ answers, SEO descriptions).
 * Ksamil: the sentence is replaced, since the figure itself is a draft.
 * Also applied to the seed files the texts were generated from.
 *
 * Run:
 *   npx tsx scripts/fixReferencePriceUnits.ts
 *   npx tsx scripts/fixReferencePriceUnits.ts --execute
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

/** [wrong, right] — applied in order, longest phrases first. */
const REPLACEMENTS: Array<[string, string]> = [
  // Ksamil: whole sentences (the figure is a draft).
  ['The state reference price runs €60,000–100,000 per unit, and that is the basis for notary and tax costs', 'Reference rates of 60,000–100,000 lek/m² for Ksamil come from the 2026 draft map, which has not been approved; notary and tax costs follow the rate in force, so ask the notary which applies'],
  ['Der staatliche Referenzpreis liegt bei 60.000–100.000 € pro Einheit und bildet die Grundlage für Notar- und Steuerkosten', 'Die Referenzwerte von 60.000–100.000 Lek/m² für Ksamil stammen aus dem Kartenentwurf von 2026, der nicht verabschiedet ist; Notar- und Steuerkosten richten sich nach dem geltenden Wert, fragen Sie den Notar'],
  ['Der staatliche Referenzpreis liegt bei 60.000–100.000 € pro Einheit und ist die Grundlage für Notar- und Steuerkosten', 'Die Referenzwerte von 60.000–100.000 Lek/m² für Ksamil stammen aus dem Kartenentwurf von 2026, der nicht verabschiedet ist; Notar- und Steuerkosten richten sich nach dem geltenden Wert, fragen Sie den Notar'],
  ['Il prezzo di riferimento statale è di €60.000–100.000 per unità, ed è su questo che si calcolano le spese notarili e fiscali', 'I valori di riferimento di 60.000–100.000 lek/m² per Ksamil vengono dalla bozza della mappa 2026, non approvata; notaio e imposte seguono il valore in vigore, chiedete al notaio quale si applica'],
  ['Państwowa cena referencyjna wynosi €60 000–100 000 za lokal i na tej podstawie liczone są koszty notarialne i podatkowe', 'Stawki referencyjne 60 000–100 000 lek/m² dla Ksamilu pochodzą z projektu mapy z 2026 roku, który nie został zatwierdzony; koszty notarialne i podatki liczy się według obowiązującej stawki — zapytaj notariusza, jaka to wartość'],
  ['Государственная справочная цена — €60 000–100 000 за объект, и именно от неё считаются нотариальные и налоговые расходы', 'Справочные ставки 60 000–100 000 лек/м² для Ксамиля взяты из проекта карты 2026 года, который не утверждён; нотариальные расходы и налоги считаются по действующей ставке — уточните её у нотариуса'],
  ['Çmimi i referencës i shtetit shkon €60,000–100,000 për njësi, dhe mbi këtë bazë llogaritjen kostot notariale dhe tatimore', 'Tarifat e referencës 60.000–100.000 lekë/m² për Ksamilin vijnë nga drafti i hartës së 2026-s, i cili nuk është miratuar; kostot e noterit dhe taksat ndjekin tarifën në fuqi, ndaj pyesni noterin'],
  ["Державна референтна ціна становить €60 000–100 000 за об'єкт, і саме від неї розраховуються нотаріальні та податкові витрати", 'Довідкові ставки 60 000–100 000 лек/м² для Ксаміля взяті з проєкту карти 2026 року, який не затверджено; нотаріальні витрати й податки рахуються за чинною ставкою — уточніть її в нотаріуса'],
  // Golem: the figure only.
  ['€56,500 per unit', '56,500 lek/m²'],
  ['56.500 € pro Einheit', '56.500 Lek/m²'],
  ['56.500 € per unità', '56.500 lek/m²'],
  ['€56,500 per unità', '56.500 lek/m²'],
  ['56 500 € za lokal', '56 500 lek/m²'],
  ['€56,500 za lokal', '56 500 lek/m²'],
  ['€56 500 за объект', '56 500 лек/м²'],
  ['56.500 € për njësi', '56.500 lekë/m²'],
  ['€56,500 për njësi', '56.500 lekë/m²'],
  ['€56 500 за об’єкт', '56 500 лек/м²'],
  ['€56,500 за одиницю', '56 500 лек/м²'],
]

const fixText = (s: string) => REPLACEMENTS.reduce((t, [a, b]) => t.split(a).join(b), s)
const WRONG = /(56[ ., ]?500|60[ ., ]?000[–-]100[ ., ]?000)[^.;]{0,12}(€|per unit|pro Einheit|per unità|za lokal|за объект|për njësi|за об’єкт|за об'єкт|за одиницю)|€\s?(56[ .,]?500|60[ .,]?000[–-]100)/

const IDS = ['district-golem-durres', 'landing-district-golem-durres', 'district-ksamil', 'landing-district-ksamil']
const FILES = [
  'scripts/data/zoneEditorialCopy.ts',
  'scripts/data/durresDistrictFaq-2026-09-15.ts',
  'scripts/data/cityZoneDescriptions.ts',
  'scripts/data/cityZoneDescriptionsTranslations.ts',
  'scripts/data/zone-metrics-seed.json',
]

async function main(): Promise<void> {
  const docs = await client.fetch<Array<Record<string, any>>>(`*[_id in $ids]`, {ids: IDS})
  const drafts = await client.fetch<string[]>(`*[_id in $ids]._id`, {ids: IDS.map((i) => `drafts.${i}`)})
  if (drafts.length) throw new Error(`drafts exist: ${drafts.join(', ')}`)
  const tx = client.transaction()
  let fields = 0
  const leftovers: string[] = []
  for (const doc of docs) {
    const fixed = JSON.parse(JSON.stringify(doc), (_k, v) => (typeof v === 'string' ? fixText(v) : v))
    const set: Record<string, unknown> = {}
    for (const key of Object.keys(doc)) {
      if (key.startsWith('_')) continue
      if (JSON.stringify(doc[key]) !== JSON.stringify(fixed[key])) set[key] = fixed[key]
    }
    JSON.stringify(fixed, (_k, v) => {
      if (typeof v === 'string' && WRONG.test(v)) leftovers.push(`${doc._id}: ${v.match(WRONG)![0]}`)
      return v
    })
    if (Object.keys(set).length) {
      fields += Object.keys(set).length
      tx.patch(doc._id, (p) => p.ifRevisionId(doc._rev).set(set))
      console.log(`${doc._id}: ${Object.keys(set).join(', ')}`)
    }
  }
  if (leftovers.length) {
    console.error(`Unreplaced phrasing:\n${leftovers.join('\n')}`)
    process.exit(1)
  }
  for (const f of FILES) {
    const t = fs.readFileSync(f, 'utf8')
    const n = fixText(t)
    if (n !== t) {
      console.log(`file ${f}: updated`)
      if (execute) fs.writeFileSync(f, n)
    }
  }
  if (!execute) {
    console.log(`\nDry run: ${fields} top-level fields.`)
    return
  }
  const dir = path.resolve(process.cwd(), 'scripts/data/backups', `referencePriceUnits-${Date.now()}`)
  fs.mkdirSync(dir, {recursive: true})
  for (const d of docs) fs.writeFileSync(path.join(dir, `${d._id}.json`), JSON.stringify(d, null, 2))
  console.log(`Written in transaction ${(await tx.commit()).transactionId}.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
