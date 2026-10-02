/**
 * One-shot, 2026-10-02. An English guide for buyers from Israel.
 *
 * Why: the first Israeli lead came in on 2 October (he-IL browser, ChatGPT →
 * /en/albania/durres, 45 minutes, WhatsApp on a Durrës studio). Israel is
 * ~2% of sessions and arrives in English through ChatGPT, not through Google
 * (1 click in 16 months in Search Console), so the answer is one English page
 * that says what an Israeli buyer asks first, not a Hebrew locale.
 *
 * Creates `landing-il-buying-property-in-albania-from-israel`, scoped to the
 * `en` locale like the Polish guides are to `pl`, with the same section set:
 * hero, body, related guides, FAQ, sources, CTA. Also adds ILS to the site's
 * currency switcher (`siteSettings.displayCurrencies`): the rate is already in
 * `currencyRates`, only the list was missing it.
 *
 * Every figure in the text is either on the site already (Durrës price page
 * of 2 October 2026, the Bank of Albania H1 2026 article, the legal guide) or
 * in a source listed in the Sources section.
 *
 * Run:
 * - npx tsx scripts/createIlGuide20261002.ts            (dry: prints the document)
 * - npx tsx scripts/createIlGuide20261002.ts --execute
 */
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const execute = process.argv.slice(2).includes('--execute')

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID || 'g4aqp6ex',
  dataset: process.env.SANITY_STUDIO_DATASET || process.env.SANITY_DATASET || 'production',
  apiVersion: '2025-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
})

const SLUG = 'buying-property-in-albania-from-israel'
const DOC_ID = `landing-il-${SLUG}`
const KEY = 'il-guide'
const TODAY = '2026-10-02'
const COVER = 'image-1cf6d066c64bf3dd3872028133d517db16323bed-3840x2560-jpg'

const TITLE = 'Buying property in Albania from Israel: a 2026 guide'
const SHORT_LINE = 'Domlivo guide for buyers from Israel'
const SUBTITLE =
  'Three hours from Ben Gurion, no visa for 90 days, apartments in Durrës from about €52,000 and a tax treaty with Israel since 2021. What an Israeli buyer can own, what it costs to buy and hold, and where the catch is.'
const META_TITLE = 'Buying Property in Albania from Israel: 2026 Guide'
const META_DESCRIPTION =
  'Can an Israeli buy a flat in Albania? Yes, on the same terms as locals. Flights, visa-free stay, Durrës prices per m², purchase steps, taxes, the tax treaty.'

/** `[text](href)` inside a paragraph becomes a link span; everything else is plain text. */
type Para = {style: 'normal' | 'h2' | 'h3'; text: string}

const BODY: Para[] = [
  {
    style: 'normal',
    text: 'Albania is the closest piece of European coast to Israel that is still cheap: a direct flight of about three hours, no visa for up to 90 days, and a median asking price of €1,416 per m² for a flat in Durrës on 2 October 2026, against several times that in Tel Aviv. This guide answers what Israeli buyers ask us first, in the order they ask it. We work in English and Russian, not Hebrew, and we say so up front.',
  },
  {style: 'h2', text: 'Getting there and staying'},
  {
    style: 'normal',
    text: 'Tel Aviv–Tirana is a non-stop route with three Israeli carriers: Israir flies it about eight times a week, El Al six, Arkia five, and the flight takes just under three hours. One-way fares start around €86 in the off-season. Israeli citizens enter Albania without a visa for 90 days in any 180-day period: a passport and a stamp, no online form, no fee. Tirana airport is 35–40 minutes by car from Durrës, which is why Durrës is where most first visits start.',
  },
  {style: 'h2', text: 'What an Israeli citizen can own'},
  {
    style: 'normal',
    text: 'Apartments and houses: yes, on the same terms as an Albanian citizen. There is no reciprocity test, no permit and no minimum price. The one restriction is agricultural land, which a foreign individual cannot buy directly; it is held through an Albanian company or leased for up to 99 years, and it almost never matters for someone buying a flat or a house with its plot. The details are in our [legal guide for buyers](/blog/legal-guide-buyers) and in [who can buy real estate in Albania](/blog/can-foreigners-buy-real-estate-albania).',
  },
  {style: 'h2', text: 'What it costs in 2026'},
  {
    style: 'normal',
    text: 'The numbers below are medians of live listings on this site, recomputed every hour, not brochure prices. Durrës, the coastal city nearest the airport: €1,416 per m² overall, with completed homes at €1,500 and new builds under construction at €1,250. By district: Plazh €1,588, City Center €1,500, Shkëmbi i Kavajës €1,471, Golem €1,311. A studio lists at €52,000–85,000, a one-bedroom at €82,000–115,000, a two-bedroom at €98,000–210,000. Tirana is dearer and has no sea; the central districts are on the [Tirana price page](/albania/tirana/info), Durrës by district on the [Durrës price page](/albania/durres/info).',
  },
  {
    style: 'normal',
    text: 'The market context from the central bank: in the first half of 2026 the Bank of Albania’s price index was flat against the previous half-year and 10% up on the year; about 20% of homes went to non-residents, mostly EU citizens; a coastal home took 8.2 months to sell on average, against 9.9 nationally. Our summary of that survey is [here](/blog/albania-property-market-h1-2026). Rental yields are 4–9% gross in Durrës depending on the line from the beach, not the 10–16% that advertisements quote.',
  },
  {style: 'h2', text: 'How a purchase works'},
  {
    style: 'normal',
    text: 'Reservation and a preliminary contract with a deposit; an independent extract from the property register (ASHK) before any money leaves your account, because only a registered owner can sell; then the notarial deed, which is the only document that transfers ownership in Albania, and registration of the new owner at ASHK. A straightforward resale closes in four to eight weeks. On new builds, 0% developer instalments from reservation to key handover are the usual arrangement. You pay in euros by bank transfer; Israeli banks usually ask for the signed contract and the notary’s details before they release a transfer abroad, so have both ready. Use a lawyer who is not the seller’s lawyer; it costs a few hundred euros and is the single cheapest insurance in this process.',
  },
  {style: 'h2', text: 'Taxes, and the treaty with Israel'},
  {
    style: 'normal',
    text: 'Holding is cheap: the annual property tax on housing is 0.05% of the fiscal value, which for a 90 m² flat in Tirana comes to roughly 3,600–10,200 lek a year (about €35–100). Rental income is taxed at a flat 15%; for short lets through platforms, since 1 January 2026 the 15% applies to the amount after the platform’s commission and expenses are not deductible. On sale, capital gains are 15% of the difference between the sale and purchase price, with the sale price taken as the higher of the actual price and the zone reference. Israel and Albania have a convention for the avoidance of double taxation on income, signed in Tel Aviv on 4 May 2021 and in force since 31 December 2021, so tax paid in Albania on rent or on a sale is creditable in Israel under its terms. Reporting foreign property income in Israel is your accountant’s job, not ours; what we can promise is that the Albanian side of the bill is small and predictable.',
  },
  {style: 'h2', text: 'Staying longer than 90 days'},
  {
    style: 'normal',
    text: 'Owning a home gives a route to a residence permit: Article 84 of Law 79/2021 “On Aliens” provides a permit for the use of owned immovable property, issued for up to one year at first and renewable while you still own the property. You do not need it for holidays within the 90-day rule; you need it if you plan to winter in Albania or move.',
  },
  {style: 'h2', text: 'Where Israelis actually look'},
  {
    style: 'normal',
    text: 'Durrës, because of the airport and because it is a real city with a 10 km beach, not a resort that empties in October. Vlora, where Israeli capital already builds hotels and where prices are higher than Durrës. Saranda, opposite Corfu, where our listing data is thin and we say so. Tirana for those who want a city rather than a sea view. The honest ranking for a first purchase under €120,000 is Durrës first, and the live catalogue of [apartments for sale in Durrës](/albania/durres) is the place to test that against today’s prices. Prices on every page can be switched to shekels with the currency selector in the header.',
  },
  {style: 'h2', text: 'What this means for a buyer from Israel'},
  {
    style: 'normal',
    text: 'You can buy a flat in Albania as easily as a local, hold it for a few hundred shekels of tax a year, rent it at a realistic 4–9% gross, and fly to it in three hours without a visa. The risks are the ordinary ones of a young market: title history, unfinished buildings, prices quoted above the register. All three are handled by the ASHK extract, by paying in instalments tied to construction stages, and by comparing any asking price with the medians on this site. Write to us on WhatsApp or through the [contact page](/contacts); we answer in English or Russian within the day.',
  },
]

const FAQ: Array<{q: string; a: string}> = [
  {
    q: 'Can an Israeli citizen buy an apartment in Albania?',
    a: 'Yes. Apartments and houses are sold to foreign individuals on the same terms as to Albanian citizens: no permit, no reciprocity condition, no minimum price. Only agricultural land cannot be bought directly by a foreigner; it is held through an Albanian company or leased for up to 99 years.',
  },
  {
    q: 'Do Israelis need a visa for Albania?',
    a: 'No. Israeli passport holders stay up to 90 days in any 180-day period without a visa. Tel Aviv–Tirana is a direct route of about three hours flown by Israir, El Al and Arkia.',
  },
  {
    q: 'How much is an apartment in Durrës in 2026?',
    a: 'On 2 October 2026 the median asking price in Durrës was €1,416 per m² across 262 listed flats: a studio €52,000–85,000, a one-bedroom €82,000–115,000, a two-bedroom €98,000–210,000. Plazh and the City Center are the dearest districts, Golem the cheapest of the large ones.',
  },
  {
    q: 'Is there a double taxation treaty between Israel and Albania?',
    a: 'Yes. The convention on the avoidance of double taxation on income was signed in Tel Aviv on 4 May 2021 and entered into force on 31 December 2021. Albanian tax on rental income (15%) and on capital gains (15%) is creditable in Israel under the treaty’s terms; the reporting is done in Israel.',
  },
  {
    q: 'Can I get residence in Albania by buying property?',
    a: 'Owning registered immovable property is a ground for a residence permit under Article 84 of Law 79/2021: up to one year at first, renewable while the property stays yours. It is only needed for stays beyond the visa-free 90 days.',
  },
]

const SOURCES = [
  {label: 'Convention between Israel and Albania for the avoidance of double taxation, signed 4 May 2021, in force 31 December 2021 (confidence: high)', publisher: 'Government of Israel', url: 'https://www.gov.il/BlobFolder/dynamiccollectorresultitem/albania_dtpa-eng/en/international_agreements_albania_dtpa-eng.pdf'},
  {label: 'Law No. 79/2021 “On Aliens”, Article 84, residence permit for owners of immovable property (confidence: high)', publisher: 'Ministry of Interior of Albania', url: 'https://mb.gov.al/wp-content/uploads/2024/10/Ligj-per-te-Huajt-%E2%80%93-nr.-79.2021_English.pdf'},
  {label: 'Tel Aviv–Tirana non-stop flights: carriers, weekly frequencies and flight time (confidence: medium, schedules change by season)', publisher: 'FlightConnections', url: 'https://www.flightconnections.com/flights-from-tlv-to-tia'},
  {label: 'Visa-free entry of Israeli citizens to Albania, 90 days in 180 (confidence: high)', publisher: 'Wikipedia, visa requirements for Israeli citizens', url: 'https://en.wikipedia.org/wiki/Visa_requirements_for_Israeli_citizens'},
  {label: 'Bank of Albania, real-estate market survey H1 2026: price index, time to sell, non-resident share (confidence: high)', publisher: 'Bank of Albania via Domlivo', url: 'https://www.domlivo.com/en/blog/albania-property-market-h1-2026'},
  {label: 'Property tax 0.05%, rental income 15%, capital gains 15%: Law 85/2025 and Instruction 5/2026 (confidence: high)', publisher: 'General Directorate of Taxes via Domlivo legal guide', url: 'https://www.domlivo.com/en/blog/legal-guide-buyers'},
  {label: 'Durrës asking prices by district and type, 262 listings, 2 October 2026 (confidence: high, own data)', publisher: 'Domlivo', url: 'https://www.domlivo.com/en/albania/durres/info'},
  {label: 'Israeli investors in Albania: hotel in Vlora, Adal Holdings (confidence: medium)', publisher: 'Tirana Times', url: 'https://www.tiranatimes.com/albania-attracts-israeli-investors_105343/'},
]

function ls(en: string) {
  return {_type: 'localizedString', en}
}
function lt(en: string) {
  return {_type: 'localizedText', en}
}

function blocks(paras: Para[]) {
  return paras.map((p, i) => {
    const markDefs: Array<{_key: string; _type: 'link'; href: string}> = []
    const children: Array<{_key: string; _type: 'span'; marks: string[]; text: string}> = []
    const re = /\[([^\]]+)\]\(([^)]+)\)/g
    let last = 0
    let m: RegExpExecArray | null
    let n = 0
    while ((m = re.exec(p.text))) {
      if (m.index > last) children.push({_key: `${KEY}-${i}-s${n++}`, _type: 'span', marks: [], text: p.text.slice(last, m.index)})
      const linkKey = `${KEY}-${i}-l${markDefs.length}`
      markDefs.push({_key: linkKey, _type: 'link', href: m[2]})
      children.push({_key: `${KEY}-${i}-s${n++}`, _type: 'span', marks: [linkKey], text: m[1]})
      last = m.index + m[0].length
    }
    if (last < p.text.length) children.push({_key: `${KEY}-${i}-s${n++}`, _type: 'span', marks: [], text: p.text.slice(last)})
    return {_key: `${KEY}-b${i}`, _type: 'block', style: p.style, markDefs, children}
  })
}

const doc = {
  _id: DOC_ID,
  _type: 'landingPage',
  pageType: 'custom',
  enabled: true,
  locales: ['en'],
  slug: {_type: 'slug', current: SLUG},
  title: ls(TITLE),
  cardDescription: lt(SUBTITLE),
  cardImage: {_type: 'image', asset: {_type: 'reference', _ref: COVER}, alt: 'The beach and seafront at Durrës, Albania'},
  contentUpdatedAt: TODAY,
  topicTags: ['theme:il-buyers', 'theme:buying', 'theme:legal'],
  seo: {
    metaTitle: ls(META_TITLE),
    metaDescription: lt(META_DESCRIPTION),
    ogTitle: ls(META_TITLE),
    ogDescription: lt(META_DESCRIPTION),
  },
  pageSections: [
    {_key: 'hero', _type: 'heroSection', enabled: true, title: ls(TITLE), shortLine: ls(SHORT_LINE), subtitle: lt(SUBTITLE)},
    {_key: 'body', _type: 'seoTextSection', enabled: true, content: {_type: 'localizedBlockContent', en: blocks(BODY)}},
    {_key: 'related', _type: 'relatedPagesAutoSection', enabled: true, mode: 'topicGuides', limit: 8, topicTags: ['theme:buying'], title: ls('More guides for buyers')},
    {
      _key: 'faq',
      _type: 'faqSection',
      enabled: true,
      imageMode: 'withoutImage',
      title: ls('Frequently asked questions'),
      items: FAQ.map((f, i) => ({_key: `faq-${i}`, _type: 'localizedFaqItem', question: ls(f.q), answer: lt(f.a)})),
    },
    {
      _key: 'sources',
      _type: 'sourcesSection',
      enabled: true,
      title: ls('Sources and methodology'),
      intro: lt('The figures on this page come from the Domlivo research base and from the documents below; each source carries our confidence rating. Listing medians are recomputed hourly from the catalogue.'),
      sources: SOURCES.map((s, i) => ({_key: `src-${i}`, _type: 'sourceItem', ...s})),
    },
    {
      _key: 'cta',
      _type: 'ctaSection',
      enabled: true,
      title: ls('Looking at Albania from Israel?'),
      description: lt('Browse current listings in Durrës, or write to us on WhatsApp; we answer in English or Russian within the day.'),
      cta: {href: '/albania/durres', label: ls('Apartments in Durrës')},
      secondaryCta: {href: '/contacts', label: ls('Contact us')},
    },
  ],
}

function check() {
  const problems: string[] = []
  if (META_TITLE.length > 60) problems.push(`metaTitle ${META_TITLE.length} > 60`)
  if (META_DESCRIPTION.length < 140 || META_DESCRIPTION.length > 160) problems.push(`metaDescription ${META_DESCRIPTION.length} not in 140–160`)
  const words = BODY.map((p) => p.text).join(' ').split(/\s+/).length
  if (words < 450) problems.push(`body ${words} words < 450`)
  const links = BODY.flatMap((p) => [...p.text.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]))
  return {problems, words, links}
}

async function main() {
  const {problems, words, links} = check()
  console.log(execute ? 'EXECUTE' : 'DRY', {id: DOC_ID, words, links, problems})
  for (const href of links) {
    const res = await fetch(`https://www.domlivo.com/en${href}`, {method: 'HEAD', redirect: 'manual'})
    if (res.status !== 200) problems.push(`${href} → ${res.status}`)
  }
  if (problems.length) {
    console.error('problems:', problems)
    process.exit(1)
  }
  const existing = await client.fetch<{_rev: string} | null>(`*[_id==$id][0]{_rev}`, {id: DOC_ID})
  const settings = await client.fetch<{displayCurrencies: string[]}>(`*[_id=="siteSettings"][0]{displayCurrencies}`)
  const hasIls = settings.displayCurrencies.includes('ILS')
  console.log({exists: !!existing, displayCurrencies: settings.displayCurrencies, hasIls})
  if (!execute) {
    console.log(JSON.stringify(doc, null, 1).slice(0, 1500) + '\n…')
    return
  }
  if (existing) console.log('document exists, leaving it as is')
  else {
    const created = await client.create(doc)
    console.log('created', created._id, created._rev)
  }
  if (!hasIls) {
    const res = await client.patch('siteSettings').append('displayCurrencies', ['ILS']).commit()
    console.log('ILS added to displayCurrencies, rev', res._rev)
  }
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
