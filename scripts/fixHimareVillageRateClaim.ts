/**
 * Qeparo and Vuno said the state "values every village in the municipality at a
 * flat 58,000 lek/m²", and Qeparo added that this is "less than half the rate
 * applied to Himarë town".
 *
 * 58,000 lek/m² is Himarë's current reference rate. Putting every village on
 * that single rate is what the government's draft map proposes — the same
 * unapproved draft as Durrës (see fixDurresReferencePriceClaim.ts): Saranda Web
 * calls it a "projektvendim" expected to be approved, and as of July 2026 it was
 * not (Monitor.al, 2026-07-09). The "half the town rate" comparison came from
 * the 140,000 figure on the same draft map and has no basis in force.
 *
 * Corrected in the district description and seoText and in the landing's about
 * text (the same copy), six locales, by replacing the sentence that carries the
 * figure. Idempotent: a sentence that already says "draft" is left alone.
 *
 * Run:
 *   npx tsx scripts/fixHimareVillageRateClaim.ts
 *   npx tsx scripts/fixHimareVillageRateClaim.ts --execute
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

const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl'] as const
type Locale = (typeof LOCALES)[number]
type L6 = Record<Locale, string>
const FIGURE = /58[,.  ]?000/
const ALREADY_FIXED = /draft|проєкт|проект|drafti|bozza|projekt/i

const QEPARO: L6 = {
  en: 'Himarë’s state reference rate is 58,000 lek/m² — about €590 — and the 2026 draft map would apply that same rate to every village in the municipality, sea view or not; the draft has not been approved.',
  uk: 'Державна довідкова ставка Хімари — 58 000 лек/м², близько €590; проєкт карти 2026 року застосував би цю ж ставку до всіх сіл муніципалітету, з видом на море чи без, але його не затверджено.',
  ru: 'Государственная справочная ставка Химары — 58 000 лек/м², около €590; проект карты 2026 года применил бы ту же ставку ко всем сёлам муниципалитета, с видом на море или без, но он не утверждён.',
  sq: 'Tarifa shtetërore e referencës për Himarën është 58,000 lekë/m² — rreth €590 — dhe drafti i hartës së 2026-s do ta zbatonte të njëjtën tarifë për çdo fshat të bashkisë, me pamje nga deti apo jo; drafti nuk është miratuar.',
  it: 'Il prezzo di riferimento statale di Himarë è di 58.000 lek/m², circa €590, e la bozza della mappa 2026 applicherebbe la stessa tariffa a ogni villaggio del comune, con o senza vista mare; la bozza non è stata approvata.',
  pl: 'Państwowa stawka referencyjna Himarë wynosi 58 000 lek/m², czyli około €590, a projekt mapy z 2026 roku objąłby nią każdą wioskę w gminie, z widokiem na morze czy bez; projekt nie został zatwierdzony.',
}
const VUNO: L6 = {
  en: 'The 2026 draft reference map would put the village on the same flat 58,000 lek/m² rate as every other village in the municipality — Himarë’s current rate — with no distinction for a sea view; the draft has not been approved.',
  uk: 'Проєкт довідкової карти 2026 року поставив би село на ту саму єдину ставку 58 000 лек/м², що й усі інші села муніципалітету (чинну ставку Хімари), не розрізняючи вид на море; проєкт не затверджено.',
  ru: 'Проект справочной карты 2026 года поставил бы село на ту же единую ставку 58 000 лек/м², что и все остальные сёла муниципалитета (действующую ставку Химары), без учёта вида на море; проект не утверждён.',
  sq: 'Drafti i hartës së referencës së 2026-s do ta vendoste fshatin në të njëjtën tarifë të sheshtë 58,000 lekë/m² si çdo fshat tjetër të bashkisë — tarifa aktuale e Himarës — pa dallim për pamjen nga deti; drafti nuk është miratuar.',
  it: 'La bozza della mappa di riferimento 2026 metterebbe il villaggio sulla stessa tariffa unica di 58.000 lek/m² di tutti gli altri villaggi del comune, quella attuale di Himarë, senza distinguere la vista mare; la bozza non è stata approvata.',
  pl: 'Projekt mapy referencyjnej z 2026 roku objąłby wieś tą samą zryczałtowaną stawką 58 000 lek/m² co każdą inną wieś w gminie — obecną stawką Himarë — bez rozróżnienia widoku na morze; projekt nie został zatwierdzony.',
}
const QEPARO_SEO: L6 = {
  en: 'Qeparo asks €1,100–1,800/m²; Himarë’s state reference rate is 58,000 lek/m².',
  uk: 'Qeparo — €1 100–1 800/м²; державна довідкова ставка Хімари — 58 000 лек/м².',
  ru: 'Qeparo — €1 100–1 800/м²; государственная справочная ставка Химары — 58 000 лек/м².',
  sq: 'Qeparoi kërkon €1,100–1,800/m²; tarifa shtetërore e referencës për Himarën është 58,000 lekë/m².',
  it: 'Qeparo chiede €1.100–1.800/m²; il prezzo di riferimento statale di Himarë è di 58.000 lek/m².',
  pl: 'Qeparo oczekuje €1100–1800/m²; państwowa stawka referencyjna Himarë to 58 000 lek/m².',
}
const VUNO_SEO: L6 = {
  en: 'Vuno asks €1,100–1,800/m², the same band as Qeparo.',
  uk: 'Vuno — €1 100–1 800/м², той самий діапазон, що й Qeparo.',
  ru: 'Vuno — €1 100–1 800/м², тот же диапазон, что и Qeparo.',
  sq: 'Vunoi kërkon €1,100–1,800/m², i njëjti interval me Qeparon.',
  it: 'Vuno chiede €1.100–1.800/m², la stessa fascia di Qeparo.',
  pl: 'Vuno oczekuje €1100–1800/m², tak samo jak Qeparo.',
}

const TARGETS: Record<string, {text: L6; seo?: L6}> = {
  'district-qeparo': {text: QEPARO, seo: QEPARO_SEO},
  'landing-district-qeparo': {text: QEPARO},
  'district-vuno': {text: VUNO, seo: VUNO_SEO},
  'landing-district-vuno': {text: VUNO},
}

/** Splits on sentence ends followed by whitespace, so "€1.100–1.800" stays whole. */
function replaceSentence(text: string, replacement: string): string | null {
  const sentences = text.split(/(?<=[.!?])\s+(?=\S)/)
  const i = sentences.findIndex((s) => FIGURE.test(s) && !ALREADY_FIXED.test(s))
  if (i < 0) return null
  sentences[i] = replacement
  return sentences.join(' ')
}

async function main(): Promise<void> {
  const ids = Object.keys(TARGETS)
  const drafts = await client.fetch<string[]>(`*[_id in $ids]._id`, {ids: ids.map((i) => `drafts.${i}`)})
  if (drafts.length) throw new Error(`drafts exist: ${drafts.join(', ')}`)
  const docs = await client.fetch<Array<Record<string, any>>>(`*[_id in $ids]`, {ids})
  const plans: Array<{id: string; rev: string; set: Record<string, string>}> = []

  for (const doc of docs) {
    const t = TARGETS[doc._id]
    const set: Record<string, string> = {}
    for (const l of LOCALES) {
      if (doc.description?.[l]) {
        const next = replaceSentence(doc.description[l], t.text[l])
        if (next) set[`description.${l}`] = next
      }
      if (t.seo && typeof doc.seoText?.[l] === 'string' && FIGURE.test(doc.seoText[l]) && !ALREADY_FIXED.test(doc.seoText[l])) {
        set[`seoText.${l}`] = t.seo[l]
      }
    }
    for (const s of doc.pageSections ?? []) {
      for (const l of LOCALES) {
        for (const block of s.content?.[l] ?? []) {
          for (const span of block.children ?? []) {
            const next = typeof span.text === 'string' ? replaceSentence(span.text, t.text[l]) : null
            if (next) set[`pageSections[_key=="${s._key}"].content.${l}[_key=="${block._key}"].children[_key=="${span._key}"].text`] = next
          }
        }
      }
    }
    if (Object.keys(set).length) plans.push({id: doc._id, rev: doc._rev, set})
  }

  for (const p of plans) {
    console.log(`${p.id}: ${Object.keys(p.set).length} field(s)`)
    const en = Object.entries(p.set).find(([k]) => k.includes('.en'))
    if (en) console.log(`  ${en[1].slice(0, 400)}`)
  }
  if (!execute) {
    console.log(`\nDry run: ${plans.length} documents.`)
    return
  }
  if (!plans.length) return
  const dir = path.resolve(process.cwd(), 'scripts/data/backups', `himareVillageRate-${Date.now()}`)
  fs.mkdirSync(dir, {recursive: true})
  for (const d of docs) fs.writeFileSync(path.join(dir, `${d._id}.json`), JSON.stringify(d, null, 2))
  const tx = client.transaction()
  for (const p of plans) tx.patch(p.id, (patch) => patch.ifRevisionId(p.rev).set(p.set))
  console.log(`Written in transaction ${(await tx.commit()).transactionId}. Backups: ${dir}`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
