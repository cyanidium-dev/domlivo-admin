/**
 * One-shot, 2026-09-29. The September Durrës price index article ranks below
 * a 7-day-old competitor piece for "реальные цены на жильё в Дурресе 2026":
 * the query wants a straight answer with bands by type of home, the article
 * opened with one median. This patch, in all seven locales:
 * - retitles the post around "real prices … by district and type";
 * - puts a lead with 20–80% €/m² bands (completed stock, new builds, the four
 *   largest districts, the whole city) before the existing body;
 * - refreshes metaTitle / metaDescription / excerpt to match.
 * Figures: scripts/data/price-index/durres-segments-2026-09-29.json
 * (reportDurresPriceSegments.mjs, same filter as the index).
 *
 * Idempotent: skips a locale whose body already starts with the lead marker.
 *
 * Run:
 * - npx tsx scripts/patchPriceIndexArticle20260929.ts            (dry)
 * - npx tsx scripts/patchPriceIndexArticle20260929.ts --execute
 */
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {markdownToPortableText} from '../lib/articleLoader/markdownToPt'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const execute = process.argv.includes('--execute')
const ID = 'blogPost-durres-asking-price-index-2026-09'
const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl', 'de'] as const
type Locale = (typeof LOCALES)[number]

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

type Copy = {title: string; metaTitle: string; metaDescription: string; excerpt: string; lead: string}

const COPY: Record<Locale, Copy> = {
  ru: {
    title: 'Реальные цены на жильё в Дурресе, сентябрь 2026: индекс предложения по районам и типам',
    metaTitle: 'Реальные цены на жильё в Дурресе, сентябрь 2026',
    metaDescription:
      'Реальные цены на жильё в Дурресе, сентябрь 2026: готовое 1200–1824 €/м², новостройки 980–1384 €/м², медиана 1413 €/м² по 268 квартирам. Индекс по районам.',
    excerpt:
      'Реальные цены предложения в Дурресе на сентябрь 2026: готовое жильё 1200–1824 €/м², новостройки 980–1384 €/м², медиана по городу 1413 €/м² и 100 000 € за квартиру. Диапазоны по районам, планировкам, у моря и в новостройках, метод и ограничения.',
    lead: `Реальные цены на жильё в Дурресе на 29 сентября 2026 года, по 263 квартирам и студиям в действующих объявлениях Domlivo. Диапазон — от 20-го до 80-го процентиля цены предложения за квадратный метр, рядом медиана.

- Готовое жильё, вторичка и сданные новостройки: 1200–1824 €/м², медиана 1500 €, 218 квартир.
- Новостройки на этапе стройки или проекта: 980–1384 €/м², медиана 1250 €, 45 квартир.
- По районам: Плаж 1267–1809 €/м² (медиана 1588), Центр 1114–2073 (1500), Голем 1041–1526 (1311), Шкемби 1179–1614 (1471).
- Весь город: 1176–1764 €/м², медиана 1413 €.

Это цены из действующих объявлений, а не цены сделок. Ниже — сентябрьский индекс на 20 сентября: медианы по районам и планировкам, у моря и в новостройках, метод и его ограничения.`,
  },
  uk: {
    title: 'Реальні ціни на житло в Дурресі, вересень 2026: індекс пропозиції за районами та типами',
    metaTitle: 'Реальні ціни на житло в Дурресі, вересень 2026',
    metaDescription:
      'Реальні ціни на житло в Дурресі, вересень 2026: готове 1200–1824 €/м², новобудови 980–1384 €/м², медіана 1413 €/м² за 268 квартирами. Індекс за районами.',
    excerpt:
      'Реальні ціни пропозиції в Дурресі на вересень 2026: готове житло 1200–1824 €/м², новобудови 980–1384 €/м², медіана по місту 1413 €/м² і 100 000 € за квартиру. Діапазони за районами, плануваннями, біля моря та в новобудовах, метод і обмеження.',
    lead: `Реальні ціни на житло в Дурресі на 29 вересня 2026 року, за 263 квартирами та студіями в активних оголошеннях Domlivo. Діапазон — від 20-го до 80-го процентиля ціни пропозиції за квадратний метр, поруч медіана.

- Готове житло, вторинний ринок і здані новобудови: 1200–1824 €/м², медіана 1500 €, 218 квартир.
- Новобудови на етапі будівництва або проєкту: 980–1384 €/м², медіана 1250 €, 45 квартир.
- За районами: Пляж 1267–1809 €/м² (медіана 1588), Центр 1114–2073 (1500), Голем 1041–1526 (1311), Шкембі 1179–1614 (1471).
- Усе місто: 1176–1764 €/м², медіана 1413 €.

Це ціни з активних оголошень, а не ціни угод. Нижче — вересневий індекс станом на 20 вересня: медіани за районами і плануваннями, біля моря та в новобудовах, метод і його обмеження.`,
  },
  en: {
    title: 'Real property prices in Durrës, September 2026: the asking-price index by district and type',
    metaTitle: 'Real property prices in Durrës, September 2026',
    metaDescription:
      'Real asking prices in Durrës, September 2026: completed homes 1200–1824 €/m², new builds 980–1384 €/m², median 1413 €/m² across 268 flats. Index by district.',
    excerpt:
      'Real asking prices in Durrës for September 2026: completed homes 1200–1824 €/m², new builds 980–1384 €/m², a city median of 1413 €/m² and 100,000 € per flat. Bands by district, layout, by the sea and in new builds, with the method and its limits.',
    lead: `Real prices for a home in Durrës as of 29 September 2026, from 263 flats and studios in live listings on Domlivo. Each band is the 20th to 80th percentile of the asking price per square metre, with the median beside it.

- Completed homes, resale and handed-over new builds: 1200–1824 €/m², median 1500 €, 218 flats.
- New builds under construction or off-plan: 980–1384 €/m², median 1250 €, 45 flats.
- By district: Plazh 1267–1809 €/m² (median 1588), City Centre 1114–2073 (1500), Golem 1041–1526 (1311), Shkëmbi 1179–1614 (1471).
- Whole city: 1176–1764 €/m², median 1413 €.

These are asking prices from live listings, not transaction prices. Below is the September index as of 20 September: medians by district and layout, by the sea and in new builds, the method and its limits.`,
  },
  sq: {
    title: 'Çmimet reale të banesave në Durrës, shtator 2026: indeksi i çmimeve të kërkuara sipas lagjeve dhe llojit',
    metaTitle: 'Çmimet reale të banesave në Durrës, shtator 2026',
    metaDescription:
      'Çmimet reale në Durrës, shtator 2026: banesa të përfunduara 1200–1824 €/m², ndërtime të reja 980–1384 €/m², mediana 1413 €/m² në 268 apartamente. Sipas lagjeve.',
    excerpt:
      'Çmimet reale të kërkuara në Durrës për shtator 2026: banesa të përfunduara 1200–1824 €/m², ndërtime të reja 980–1384 €/m², mediana e qytetit 1413 €/m² dhe 100 000 € për apartament. Intervalet sipas lagjeve, planimetrisë, pranë detit dhe në ndërtime të reja, metoda dhe kufizimet.',
    lead: `Çmimet reale të banesave në Durrës më 29 shtator 2026, nga 263 apartamente dhe studio në njoftimet aktive të Domlivo. Çdo interval është nga përqindësi i 20-të deri te i 80-ti i çmimit të kërkuar për metër katror, me medianën përbri.

- Banesa të përfunduara, rishitje dhe ndërtime të dorëzuara: 1200–1824 €/m², mediana 1500 €, 218 apartamente.
- Ndërtime të reja në ndërtim ose në projekt: 980–1384 €/m², mediana 1250 €, 45 apartamente.
- Sipas lagjeve: Plazh 1267–1809 €/m² (mediana 1588), Qendra 1114–2073 (1500), Golem 1041–1526 (1311), Shkëmbi 1179–1614 (1471).
- I gjithë qyteti: 1176–1764 €/m², mediana 1413 €.

Këto janë çmime të kërkuara nga njoftimet aktive, jo çmime transaksionesh. Më poshtë vjen indeksi i shtatorit më 20 shtator: medianat sipas lagjeve dhe planimetrisë, pranë detit dhe në ndërtime të reja, metoda dhe kufizimet e saj.`,
  },
  it: {
    title: 'Prezzi reali delle case a Durazzo, settembre 2026: l’indice dei prezzi richiesti per quartiere e tipo',
    metaTitle: 'Prezzi reali delle case a Durazzo, settembre 2026',
    metaDescription:
      'Prezzi reali a Durazzo, settembre 2026: case pronte 1200–1824 €/m², nuove costruzioni 980–1384 €/m², mediana 1413 €/m² su 268 appartamenti. Per quartiere.',
    excerpt:
      'Prezzi reali richiesti a Durazzo a settembre 2026: case pronte 1200–1824 €/m², nuove costruzioni 980–1384 €/m², mediana cittadina 1413 €/m² e 100.000 € per appartamento. Fasce per quartiere, taglio, vicino al mare e nel nuovo, con il metodo e i suoi limiti.',
    lead: `Prezzi reali di una casa a Durazzo al 29 settembre 2026, da 263 appartamenti e monolocali negli annunci attivi su Domlivo. Ogni fascia va dal 20° all’80° percentile del prezzo richiesto al metro quadro, con la mediana accanto.

- Case pronte, usato e nuove costruzioni consegnate: 1200–1824 €/m², mediana 1500 €, 218 appartamenti.
- Nuove costruzioni in cantiere o su carta: 980–1384 €/m², mediana 1250 €, 45 appartamenti.
- Per quartiere: Plazh 1267–1809 €/m² (mediana 1588), Centro 1114–2073 (1500), Golem 1041–1526 (1311), Shkëmbi 1179–1614 (1471).
- Tutta la città: 1176–1764 €/m², mediana 1413 €.

Sono prezzi richiesti dagli annunci attivi, non prezzi di compravendita. Segue l’indice di settembre al 20 settembre: mediane per quartiere e taglio, vicino al mare e nel nuovo, il metodo e i suoi limiti.`,
  },
  pl: {
    title: 'Realne ceny mieszkań w Durrës, wrzesień 2026: indeks cen ofertowych według dzielnic i typu',
    metaTitle: 'Realne ceny mieszkań w Durrës, wrzesień 2026',
    metaDescription:
      'Realne ceny w Durrës, wrzesień 2026: mieszkania gotowe 1200–1824 €/m², nowe budownictwo 980–1384 €/m², mediana 1413 €/m² z 268 mieszkań. Indeks według dzielnic.',
    excerpt:
      'Realne ceny ofertowe w Durrës na wrzesień 2026: mieszkania gotowe 1200–1824 €/m², nowe budownictwo 980–1384 €/m², mediana dla miasta 1413 €/m² i 100 000 € za mieszkanie. Przedziały według dzielnic, układu, przy morzu i w nowym budownictwie, metoda i jej ograniczenia.',
    lead: `Realne ceny mieszkań w Durrës na dzień 29 września 2026, na podstawie 263 mieszkań i kawalerek w aktywnych ogłoszeniach na Domlivo. Każdy przedział to 20.–80. percentyl ceny ofertowej za metr kwadratowy, obok mediana.

- Mieszkania gotowe, rynek wtórny i oddane nowe budynki: 1200–1824 €/m², mediana 1500 €, 218 mieszkań.
- Nowe budownictwo w budowie lub w planie: 980–1384 €/m², mediana 1250 €, 45 mieszkań.
- Według dzielnic: Plazh 1267–1809 €/m² (mediana 1588), Centrum 1114–2073 (1500), Golem 1041–1526 (1311), Shkëmbi 1179–1614 (1471).
- Całe miasto: 1176–1764 €/m², mediana 1413 €.

To ceny ofertowe z aktywnych ogłoszeń, nie ceny transakcyjne. Poniżej wrześniowy indeks na dzień 20 września: mediany według dzielnic i układów, przy morzu i w nowym budownictwie, metoda i jej ograniczenia.`,
  },
  de: {
    title: 'Reale Wohnungspreise in Durrës, September 2026: der Angebotspreis-Index nach Stadtteil und Typ',
    metaTitle: 'Reale Wohnungspreise in Durrës, September 2026',
    metaDescription:
      'Reale Preise in Durrës, September 2026: fertige Wohnungen 1200–1824 €/m², Neubauten 980–1384 €/m², Median 1413 €/m² über 268 Wohnungen. Index nach Stadtteil.',
    excerpt:
      'Reale Angebotspreise in Durrës im September 2026: fertige Wohnungen 1200–1824 €/m², Neubauten 980–1384 €/m², Median der Stadt 1413 €/m² und 100.000 € je Wohnung. Spannen nach Stadtteil, Grundriss, am Meer und im Neubau, mit Methode und Grenzen.',
    lead: `Reale Preise für eine Wohnung in Durrës am 29. September 2026, aus 263 Wohnungen und Studios in aktiven Inseraten auf Domlivo. Jede Spanne ist das 20. bis 80. Perzentil des Angebotspreises pro Quadratmeter, daneben der Median.

- Fertige Wohnungen, Bestand und übergebene Neubauten: 1200–1824 €/m², Median 1500 €, 218 Wohnungen.
- Neubauten im Bau oder in Planung: 980–1384 €/m², Median 1250 €, 45 Wohnungen.
- Nach Stadtteil: Plazh 1267–1809 €/m² (Median 1588), Zentrum 1114–2073 (1500), Golem 1041–1526 (1311), Shkëmbi 1179–1614 (1471).
- Ganze Stadt: 1176–1764 €/m², Median 1413 €.

Das sind Angebotspreise aus aktiven Inseraten, keine Transaktionspreise. Es folgt der September-Index zum 20. September: Mediane nach Stadtteil und Grundriss, am Meer und im Neubau, die Methode und ihre Grenzen.`,
  },
}

const LEAD_MARKER: Record<Locale, string> = {
  ru: 'Реальные цены на жильё в Дурресе на 29 сентября',
  uk: 'Реальні ціни на житло в Дурресі на 29 вересня',
  en: 'Real prices for a home in Durrës as of 29 September',
  sq: 'Çmimet reale të banesave në Durrës më 29 shtator',
  it: 'Prezzi reali di una casa a Durazzo al 29 settembre',
  pl: 'Realne ceny mieszkań w Durrës na dzień 29 września',
  de: 'Reale Preise für eine Wohnung in Durrës am 29. September',
}

type Block = {_type: string; _key: string; children?: Array<{text?: string}>}

async function main(): Promise<void> {
  const problems: string[] = []
  for (const l of LOCALES) {
    const c = COPY[l]
    if (c.metaTitle.length > 60) problems.push(`${l}: metaTitle ${c.metaTitle.length} chars`)
    if (c.metaDescription.length < 140 || c.metaDescription.length > 160) problems.push(`${l}: metaDescription ${c.metaDescription.length} chars`)
    if (!c.lead.startsWith(LEAD_MARKER[l])) problems.push(`${l}: lead marker mismatch`)
  }
  if (problems.length) {
    console.error(problems.join('\n'))
    process.exit(1)
  }

  const doc = await client.fetch<{_id: string; content?: Record<string, Block[]>} | null>(`*[_id==$id][0]{_id, content}`, {id: ID})
  if (!doc) throw new Error(`${ID} not found`)

  const patch: Record<string, unknown> = {}
  for (const l of LOCALES) {
    const c = COPY[l]
    patch[`title.${l}`] = c.title
    patch[`seo.metaTitle.${l}`] = c.metaTitle
    patch[`seo.ogTitle.${l}`] = c.metaTitle
    patch[`seo.metaDescription.${l}`] = c.metaDescription
    patch[`seo.ogDescription.${l}`] = c.metaDescription
    patch[`excerpt.${l}`] = c.excerpt
    const existing = doc.content?.[l] ?? []
    const firstText = existing[0]?.children?.map((ch) => ch.text ?? '').join('') ?? ''
    if (firstText.startsWith(LEAD_MARKER[l])) {
      console.log(`${l}: lead already present, body untouched`)
      continue
    }
    const leadBlocks = markdownToPortableText(c.lead).map((b, i) => ({...b, _key: `lead-2026-09-29-${l}-${i}`}))
    patch[`content.${l}`] = [...leadBlocks, ...existing]
    console.log(`${l}: +${leadBlocks.length} lead blocks before ${existing.length} existing; metaTitle ${c.metaTitle.length}, metaDescription ${c.metaDescription.length}`)
  }

  if (!execute) {
    console.log('Dry run. Re-run with --execute to write.')
    return
  }
  const res = await client.patch(ID).set(patch).commit()
  console.log(`Patched ${res._id}, rev ${res._rev}.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
