/**
 * One figure for Durrës: the hand-typed "about €1,450/m²" in the Durrës city
 * page (`landing-durres`) becomes the live Domlivo Price Index median.
 *
 * The page showed three Durrës prices at once (audit 2026-10-18): the live
 * median at the top (€1,500 on 18.10), "the city average is about €1,450/m²"
 * in the copy and the FAQ, and "asking €1,450/m²" in the meta description. The
 * frontend now fills `{{median:durres}}` and `{{date:durres}}` in CMS copy from
 * the same snapshot as the table (your-house-albania src/lib/priceIndex/
 * tokens.ts), so this replaces the typed figure with the tokens, in seven
 * languages, in four places: the "about Durrës" paragraph, the first FAQ
 * answer, the meta and the OG description.
 *
 * The 18% a year comes from published research, not from the index, and keeps
 * that attribution: the sentence now names the index median and the research
 * growth separately instead of hanging the growth on our figure.
 *
 * Each replacement is an exact substring of the current text; one that is not
 * found is reported and skipped, so an edit made since 2026-10-19 is never
 * overwritten. The patch carries `ifRevisionId`; the whole document is backed
 * up to scripts/data/backups/ first.
 *
 * Run:
 *   npx tsx scripts/tokenizeDurresPriceFigure20261019.ts            # dry run
 *   npx tsx scripts/tokenizeDurresPriceFigure20261019.ts --execute
 */
import fs from 'node:fs'
import path from 'node:path'
import {getSanityClientForScripts} from './lib/sanityEnvClient'

const execute = process.argv.includes('--execute')
const ID = 'landing-durres'
const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl', 'de'] as const
type Locale = (typeof LOCALES)[number]

const M = '{{median:durres}}'
const D = '{{date:durres}}'

/** The "about Durrës" paragraph: the whole sentence that carries the figure. */
const BODY: Record<Locale, [string, string]> = {
  en: [
    'The city average is about €1,450/m², up roughly 18% year on year, and it describes almost none of these places.',
    `Across the city, the median asking price of a flat on Domlivo is €${M}/m² (${D}), and published research puts the rise at roughly 18% a year; neither figure describes these places.`,
  ],
  uk: [
    'Середня по місту — близько €1,450/m², приблизно +18% за рік, і вона не описує майже жодного з цих місць.',
    `Медіана ціни пропозиції квартири на Domlivo по місту — €${M}/м² (${D}), опубліковані дослідження оцінюють зростання приблизно в 18% за рік; жодна з цих цифр не описує ці місця.`,
  ],
  ru: [
    'Средняя по городу — около €1 450/м², рост примерно 18% год к году, и эта средняя не описывает почти ни одно из перечисленных мест.',
    `Медиана цены предложения квартиры на Domlivo по городу — €${M}/м² (${D}), опубликованные исследования оценивают рост примерно в 18% за год; ни одна из этих цифр не описывает перечисленные места.`,
  ],
  sq: [
    'Mesatarja e qytetit është rreth €1,450/m², rreth 18% më e lartë se një vit më parë, dhe nuk e përshkruan pothuajse asnjë prej këtyre vendeve.',
    `Në të gjithë qytetin, mediana e çmimit të kërkuar të një apartamenti në Domlivo është €${M}/m² (${D}), dhe kërkimet e publikuara e vlerësojnë rritjen rreth 18% në vit; asnjëra shifër nuk i përshkruan këto vende.`,
  ],
  it: [
    'La media cittadina è di circa €1,450/m², in crescita di circa il 18% su base annua, e non descrive quasi nessuno di questi luoghi.',
    `In tutta la città la mediana del prezzo richiesto di un appartamento su Domlivo è €${M}/m² (${D}), e le ricerche pubblicate stimano la crescita intorno al 18% annuo; nessuno dei due dati descrive questi luoghi.`,
  ],
  pl: [
    'Średnia dla miasta to około €1,450/m², czyli mniej więcej 18% więcej rok do roku, i nie opisuje prawie żadnego z tych miejsc.',
    `Mediana ceny ofertowej mieszkania na Domlivo dla całego miasta to €${M}/m² (${D}), a opublikowane badania szacują wzrost na około 18% rocznie; żadna z tych liczb nie opisuje tych miejsc.`,
  ],
  de: [
    'Der städtische Durchschnitt liegt bei rund 1.450 €/m², etwa 18 % mehr als im Vorjahr – und trifft auf kaum eine dieser Lagen wirklich zu.',
    `Stadtweit liegt der Median des Angebotspreises einer Wohnung auf Domlivo bei ${M} €/m² (${D}); veröffentlichte Marktforschung beziffert den Anstieg auf etwa 18 % im Jahr – keine der beiden Zahlen trifft auf diese Lagen wirklich zu.`,
  ],
}

/** The first FAQ answer ("How much does an apartment cost in Durrës?"): its opening clause. */
const FAQ: Record<Locale, [string, string]> = {
  en: [
    'The city average is about €1,450/m², up roughly 18% in a year, but the zones are far apart:',
    `The median asking price of a flat on Domlivo is €${M}/m² (${D}), and published research puts the rise at roughly 18% in a year, but the zones are far apart:`,
  ],
  uk: [
    'Середня ціна по місту — близько 1450 €/м², приблизно на 18% більше, ніж рік тому, але райони дуже різняться:',
    `Медіана ціни пропозиції квартири на Domlivo — ${M} €/м² (${D}), опубліковані дослідження оцінюють зростання приблизно в 18% за рік, але райони дуже різняться:`,
  ],
  ru: [
    'Средняя цена по городу — около 1450 €/м², примерно на 18% больше, чем год назад, но районы сильно различаются:',
    `Медиана цены предложения квартиры на Domlivo — ${M} €/м² (${D}), опубликованные исследования оценивают рост примерно в 18% за год, но районы сильно различаются:`,
  ],
  sq: [
    'Mesatarja e qytetit është rreth 1.450 €/m², rreth 18% më shumë se një vit më parë, por zonat ndryshojnë shumë nga njëra-tjetra:',
    `Mediana e çmimit të kërkuar të një apartamenti në Domlivo është ${M} €/m² (${D}), dhe kërkimet e publikuara e vlerësojnë rritjen rreth 18% në vit, por zonat ndryshojnë shumë nga njëra-tjetra:`,
  ],
  it: [
    'La media cittadina è di circa 1.450 €/m², in crescita di circa il 18% in un anno, ma le zone sono molto diverse tra loro:',
    `La mediana del prezzo richiesto di un appartamento su Domlivo è ${M} €/m² (${D}), e le ricerche pubblicate stimano la crescita intorno al 18% in un anno, ma le zone sono molto diverse tra loro:`,
  ],
  pl: [
    'Średnia dla miasta to około 1450 €/m², mniej więcej o 18% więcej niż rok wcześniej, ale dzielnice mocno się od siebie różnią:',
    `Mediana ceny ofertowej mieszkania na Domlivo to ${M} €/m² (${D}), a opublikowane badania szacują wzrost na około 18% rocznie, ale dzielnice mocno się od siebie różnią:`,
  ],
  de: [
    'Im Stadtdurchschnitt liegt der Preis bei rund 1.450 €/m², etwa 18 % mehr als vor einem Jahr – doch die Zonen liegen weit auseinander:',
    `Der Median des Angebotspreises einer Wohnung auf Domlivo liegt bei ${M} €/m² (${D}), veröffentlichte Marktforschung beziffert den Anstieg auf etwa 18 % in einem Jahr – doch die Zonen liegen weit auseinander:`,
  ],
}

/** Meta and OG description: only the figure itself. */
const META: Record<Locale, [string, string]> = {
  en: ['asking €1,450/m²', `asking €${M}/m²`],
  // A no-break space between the thousands in uk and ru.
  uk: ['ціна пропозиції €1 450/м²', `ціна пропозиції €${M}/м²`],
  ru: ['цена предложения €1 450/м²', `цена предложения €${M}/м²`],
  sq: ['çmimi i kërkuar €1450/m²', `çmimi i kërkuar €${M}/m²`],
  it: ['prezzo richiesto €1450/m²', `prezzo richiesto €${M}/m²`],
  pl: ['cena ofertowa €1450/m²', `cena ofertowa €${M}/m²`],
  de: ['Angebotspreis 1.450 €/m²', `Angebotspreis ${M} €/m²`],
}

type Block = {_key?: string; children?: Array<{_key?: string; text?: string}>}
type Doc = {
  _id: string
  _rev: string
  pageSections?: Array<{
    _key?: string
    _type?: string
    content?: Record<string, Block[]>
    items?: Array<{_key?: string; answer?: Record<string, Block[]>}>
  }>
  seo?: {metaDescription?: Record<string, string>; ogDescription?: Record<string, string>}
}

async function main(): Promise<void> {
  const client = getSanityClientForScripts()
  const doc = await client.getDocument<Doc>(ID)
  if (!doc) throw new Error(`${ID} not found`)

  const set: Record<string, string> = {}
  const skipped: string[] = []

  /** Replace `from` with `to` in the first span of a block that holds it. */
  const inBlocks = (label: string, base: string, blocks: Block[] | undefined, [from, to]: [string, string]) => {
    for (const block of blocks ?? []) {
      for (const span of block.children ?? []) {
        if (span.text?.includes(from) && block._key && span._key) {
          set[`${base}[_key=="${block._key}"].children[_key=="${span._key}"].text`] = span.text.replace(from, to)
          return
        }
      }
    }
    skipped.push(`${label}: text not found`)
  }

  const about = doc.pageSections?.find((s) => s._type === 'seoTextSection' && s._key === 'seoTextSection-2')
  const faq = doc.pageSections?.find((s) => s._type === 'faqSection' && s._key === 'faqSection-7')
  const firstQuestion = faq?.items?.[0]

  for (const l of LOCALES) {
    if (about?._key) inBlocks(`body.${l}`, `pageSections[_key=="${about._key}"].content.${l}`, about.content?.[l], BODY[l])
    else skipped.push(`body.${l}: section missing`)
    if (faq?._key && firstQuestion?._key) {
      inBlocks(
        `faq.${l}`,
        `pageSections[_key=="${faq._key}"].items[_key=="${firstQuestion._key}"].answer.${l}`,
        firstQuestion.answer?.[l],
        FAQ[l],
      )
    } else skipped.push(`faq.${l}: section missing`)
    for (const field of ['metaDescription', 'ogDescription'] as const) {
      const text = doc.seo?.[field]?.[l]
      if (text?.includes(META[l][0])) set[`seo.${field}.${l}`] = text.replace(META[l][0], META[l][1])
      else skipped.push(`seo.${field}.${l}: text not found`)
    }
  }

  for (const [p, v] of Object.entries(set)) console.log(`set ${p}\n    ${v.slice(0, 220)}`)
  if (skipped.length) console.log(`\nskipped:\n  ${skipped.join('\n  ')}`)
  console.log(`\n${Object.keys(set).length} fields to set, ${skipped.length} skipped, revision ${doc._rev}`)
  if (!execute) {
    console.log('Dry run. Re-run with --execute.')
    return
  }
  if (Object.keys(set).length === 0) return

  const dir = path.resolve(process.cwd(), 'scripts/data/backups')
  fs.mkdirSync(dir, {recursive: true})
  const backup = path.join(dir, `${ID}-before-price-tokens-2026-10-19.json`)
  fs.writeFileSync(backup, JSON.stringify(doc, null, 2))
  console.log(`Backup: ${backup}`)

  const res = await client.patch(ID).ifRevisionId(doc._rev).set(set).commit()
  console.log(`Patched ${ID}, new revision ${res._rev}`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
