/**
 * Creates the single-language lead landings of docs/seo/LEAD-LANDINGS-AHREFS-2026-10-11.md
 * (frontend repo) from the hand-written copy in ../domlivo-workspace/landings/<locale>-<slug>.json.
 *
 * One `landingPage` per file: pageType `unique`, `locales: [<locale>]` (404 in the other
 * locales, hreflang and sitemap limited to it), sections in the conversion order of the
 * spec §3: hero → live inventory band → feed → intro → feed → prices → feed → purchase
 * costs → yield → lead form → FAQ → CTA. Numbers on the page come from the live filters;
 * the copy's own numbers are from domlivo-workspace/landings/facts-2026-10-11.md.
 *
 *   npx tsx scripts/createLeadLandings20261011.ts --dry
 *   npx tsx scripts/createLeadLandings20261011.ts --execute [--only pl] [--file de-immobilien-albanien-bis-50000-euro]
 *
 * 2026-10-14: wave 3 (de/en under-€50k budget pages, sq Durrës houses). A copy file may
 * name the feed the live band counts (`band`) and its metrics (`bandMetrics`), and may
 * leave out `roi` (a house is not a rental yield story).
 */
import fs from 'node:fs'
import path from 'node:path'
import {getSanityClientForScripts} from './lib/sanityEnvClient'

const args = process.argv.slice(2)
const isExecute = args.includes('--execute')
if (!isExecute && !args.includes('--dry')) {
  console.error('Use --dry or --execute.')
  process.exit(1)
}
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : ''
const onlyFile = args.includes('--file') ? args[args.indexOf('--file') + 1] : ''

const COPY_DIR = path.resolve(process.cwd(), '../domlivo-workspace/landings')
const WHATSAPP = 'https://wa.me/message/KPXIGD5DJISGO1'
const ref = (id: string, key?: string) => ({...(key ? {_key: key} : {}), _type: 'reference', _ref: id})

const RESIDENTIAL = ['apartment', 'studio', 'penthouse', 'house', 'villa']
const COAST_CITIES = ['durres', 'shengjin', 'vlore', 'sarande', 'tirana']

type FeedFilter = {
  cities?: string[]
  types?: string[]
  nearSea?: boolean
  minPrice?: number
  maxPrice?: number
  stage?: string
  sort: string
}

/** Which listings each feed key shows. */
const FEEDS: Record<string, FeedFilter> = {
  sea: {types: RESIDENTIAL, nearSea: true, sort: 'newest'},
  budget: {types: RESIDENTIAL, maxPrice: 70000, sort: 'priceAsc'},
  newbuilds: {types: RESIDENTIAL, stage: 'unfinished', sort: 'newest'},
  houses: {types: ['house', 'villa'], sort: 'newest'},
  cheapest: {cities: ['durres'], types: RESIDENTIAL, sort: 'priceAsc'},
  belowMedian: {cities: ['durres'], types: RESIDENTIAL, sort: 'pricePerSqmAsc'},
  studios: {cities: ['durres'], types: ['studio'], sort: 'priceAsc'},
  under50: {types: RESIDENTIAL, maxPrice: 50000, sort: 'priceAsc'},
  under100: {types: RESIDENTIAL, maxPrice: 100000, sort: 'priceAsc'},
  // Price bands that do not overlap, so two feeds on one page never repeat the same cards.
  from50to70: {types: RESIDENTIAL, minPrice: 50001, maxPrice: 70000, sort: 'priceAsc'},
  from70to100Sea: {types: RESIDENTIAL, minPrice: 70001, maxPrice: 100000, nearSea: true, sort: 'priceAsc'},
  durresHouses: {cities: ['durres'], types: ['house', 'villa'], sort: 'priceAsc'},
  durresHousesSea: {cities: ['durres'], types: ['house', 'villa'], nearSea: true, sort: 'newest'},
  durresVillas: {cities: ['durres'], types: ['villa'], sort: 'newest'},
}

/** The Durrës-only Albanian page compares Durrës districts; the rest compare cities. */
const DURRES_ONLY = new Set(['sq'])

const ROI_LABELS: Record<string, [string, string, string]> = {
  en: ['Short-term let, self-managed', 'Short-term let with a manager (25%)', 'Long-term let'],
  pl: ['Najem krótkoterminowy, samodzielnie', 'Najem krótkoterminowy z zarządcą (25%)', 'Najem długoterminowy'],
  de: ['Kurzzeitvermietung, selbst verwaltet', 'Kurzzeitvermietung mit Verwalter (25 %)', 'Langzeitvermietung'],
  ru: ['Посуточная аренда, самостоятельно', 'Посуточная аренда с управляющим (25%)', 'Долгосрочная аренда'],
  uk: ['Подобова оренда, самостійно', 'Подобова оренда з керуючим (25%)', 'Довгострокова оренда'],
  it: ['Affitto breve, gestione diretta', 'Affitto breve con gestore (25%)', 'Affitto a lungo termine'],
  sq: ['Qira ditore, e menaxhuar vetë', 'Qira ditore me administrator (25%)', 'Qira afatgjatë'],
}

/** Buyer costs as the calculator sums them (facts file); the 2% transfer tax is left out:
 *  by law the seller pays it, and the copy explains when a contract shifts it. */
const COST_VALUES = [
  {kind: 'percent', value: 0.35, en: 'Notary (≈0.35%)'},
  {kind: 'fixed', value: 38, en: 'ASHK registration'},
  {kind: 'fixed', value: 800, en: 'Lawyer (optional)'},
  {kind: 'fixed', value: 100, en: 'Sworn translator'},
  {kind: 'percent', value: 1, en: 'Agency fee (1%)'},
]

type Copy = {
  slug: string
  locale: string
  updatedAt?: string
  band?: string
  bandMetrics?: string[]
  seo: {metaTitle: string; metaDescription: string; ogTitle: string; ogDescription: string}
  hero: {title: string; subtitle: string; primaryCta: string; secondaryCta: string}
  summaryTitle: string
  feeds: Array<{key: string; title: string; subtitle: string; seeAllLabel: string}>
  priceTable: {title: string; subtitle: string}
  purchaseCost: {title: string; subtitle: string; disclaimer: string; items: Array<{label: string; note: string}>}
  roi?: {title: string; subtitle: string; disclaimer: string}
  leadForm: {title: string; subtitle: string; submitLabel: string; budgetOptions: string[]}
  faq: {title: string; items: Array<{q: string; a: string}>}
  intro: {title: string; body: string[]}
  cta: {title: string; description: string; button: string}
}

async function main() {
  const client = getSanityClientForScripts()
  const cities: Array<{_id: string; slug: string}> = await client.fetch(
    `*[_type=="city" && slug.current in $s && !(_id in path("drafts.**"))]{_id, "slug": slug.current}`,
    {s: COAST_CITIES},
  )
  const types: Array<{_id: string; slug: string}> = await client.fetch(
    `*[_type=="propertyType" && !(_id in path("drafts.**"))]{_id, "slug": slug.current}`,
  )
  const cityId = (s: string) => {
    const c = cities.find((x) => x.slug === s)
    if (!c) throw new Error(`no city ${s}`)
    return c._id
  }
  const typeId = (s: string) => {
    const t = types.find((x) => x.slug === s)
    if (!t) throw new Error(`no propertyType ${s}`)
    return t._id
  }

  const files = fs.readdirSync(COPY_DIR).filter((f) => /^[a-z]{2}-.+\.json$/.test(f))
  for (const file of files) {
    const copy = JSON.parse(fs.readFileSync(path.join(COPY_DIR, file), 'utf8')) as Copy
    const L = copy.locale
    if (only && only !== L) continue
    if (onlyFile && file !== `${onlyFile}.json`) continue
    if (copy.band && !FEEDS[copy.band]) throw new Error(`${file}: unknown band feed ${copy.band}`)
    const loc = (s: string) => ({[L]: s})
    const filters = (f: FeedFilter) => ({
      deal: 'sale',
      ...(f.cities ? {cities: f.cities.map((c, i) => ref(cityId(c), `c${i}`))} : {}),
      ...(f.types ? {propertyTypes: f.types.map((t, i) => ref(typeId(t), `t${i}`))} : {}),
      ...(f.nearSea ? {nearSea: true} : {}),
      ...(f.minPrice ? {minPrice: f.minPrice} : {}),
      ...(f.maxPrice ? {maxPrice: f.maxPrice} : {}),
      ...(f.stage ? {stage: f.stage} : {}),
    })
    const feed = (i: number) => {
      const fc = copy.feeds[i]
      const f = FEEDS[fc.key]
      if (!f) throw new Error(`${file}: unknown feed ${fc.key}`)
      return {
        _key: `feed-${fc.key}`,
        _type: 'propertyCarouselSection',
        enabled: true,
        mode: 'auto',
        title: loc(fc.title),
        subtitle: loc(fc.subtitle),
        limit: 12,
        sort: f.sort,
        filters: filters(f),
        seeAllLabel: loc(fc.seeAllLabel),
      }
    }
    const durresOnly = DURRES_ONLY.has(L)
    const block = (text: string, i: number) => ({
      _type: 'block',
      _key: `p${i}`,
      style: 'normal',
      markDefs: [],
      children: [{_type: 'span', _key: `s${i}`, text, marks: []}],
    })
    const [rStr, rMgd, rLtr] = ROI_LABELS[L] ?? ROI_LABELS.en

    const sections = [
      {
        _key: 'hero',
        _type: 'heroSection',
        enabled: true,
        title: loc(copy.hero.title),
        subtitle: loc(copy.hero.subtitle),
        cta: {href: WHATSAPP, label: loc(copy.hero.primaryCta)},
        secondaryCta: {href: '#lead-form', label: loc(copy.hero.secondaryCta)},
      },
      {
        _key: 'band',
        _type: 'inventorySummarySection',
        enabled: true,
        title: loc(copy.summaryTitle),
        metrics: copy.bandMetrics ?? ['count', 'fromPrice', 'medianPricePerSqm', 'nearSeaShare', 'newBuildShare'],
        // Every listing for sale (land and commercial included), so the live
        // numbers match the copy's "700+ from €15,000" (facts file) — unless the
        // page is about one slice (houses, a budget) and counts that instead.
        filters: filters(
          copy.band ? FEEDS[copy.band] : durresOnly ? {cities: ['durres'], sort: 'newest'} : {sort: 'newest'},
        ),
      },
      feed(0),
      {
        _key: 'intro',
        _type: 'seoTextSection',
        enabled: true,
        title: loc(copy.intro.title),
        content: {[L]: copy.intro.body.map(block)},
      },
      feed(1),
      durresOnly
        ? {
            _key: 'prices',
            _type: 'zonePriceTableAutoSection',
            enabled: true,
            title: loc(copy.priceTable.title),
            subtitle: loc(copy.priceTable.subtitle),
            mode: 'cityDistricts',
            city: ref(cityId('durres')),
            columns: ['priceAll', 'priceNew', 'priceResale', 'referencePrice'],
            sortBy: 'price',
            linkRows: true,
            showSources: true,
          }
        : {
            _key: 'prices',
            _type: 'zonePriceTableAutoSection',
            enabled: true,
            title: loc(copy.priceTable.title),
            subtitle: loc(copy.priceTable.subtitle),
            mode: 'compare',
            zones: COAST_CITIES.map((c, i) => ref(cityId(c), `z${i}`)),
            columns: ['priceAll', 'priceNew', 'priceResale', 'referencePrice'],
            sortBy: 'price',
            linkRows: true,
            showSources: true,
          },
      feed(2),
      {
        _key: 'costs',
        _type: 'purchaseCostCalcSection',
        enabled: true,
        title: loc(copy.purchaseCost.title),
        subtitle: loc(copy.purchaseCost.subtitle),
        items: COST_VALUES.map((v, i) => ({
          _key: `cost${i}`,
          _type: 'object',
          label: {[L]: copy.purchaseCost.items[i]?.label ?? v.en, en: v.en},
          kind: v.kind,
          value: v.value,
          note: loc(copy.purchaseCost.items[i]?.note ?? ''),
        })),
        disclaimer: {[L]: copy.purchaseCost.disclaimer, en: 'Indicative amounts, not legal advice; the notary confirms the exact costs.'},
      },
      copy.roi && {
        _key: 'roi',
        _type: 'roiCalcSection',
        enabled: true,
        title: loc(copy.roi.title),
        subtitle: loc(copy.roi.subtitle),
        presets: [
          {_key: 'str', _type: 'object', label: {[L]: rStr, en: ROI_LABELS.en[0]}, rentalType: 'str', adrEur: 68, occupancyPct: 47, seasonNightsCap: 180, mgmtFeePct: 0, confidence: 'medium'},
          {_key: 'strm', _type: 'object', label: {[L]: rMgd, en: ROI_LABELS.en[1]}, rentalType: 'str', adrEur: 68, occupancyPct: 47, seasonNightsCap: 180, mgmtFeePct: 25, confidence: 'medium'},
          {_key: 'ltr', _type: 'object', label: {[L]: rLtr, en: ROI_LABELS.en[2]}, rentalType: 'ltr', monthlyRentEur: 400, mgmtFeePct: 0, confidence: 'medium'},
        ],
        taxRatePct: 15,
        disclaimer: {[L]: copy.roi.disclaimer, en: 'Domlivo estimate of 8 October 2026; not a guarantee of income.'},
      },
      {
        _key: 'lead',
        _type: 'leadFormSection',
        enabled: true,
        title: loc(copy.leadForm.title),
        subtitle: loc(copy.leadForm.subtitle),
        submitLabel: loc(copy.leadForm.submitLabel),
        showBudget: true,
        budgetOptions: copy.leadForm.budgetOptions.map((b, i) => ({_key: `b${i}`, [L]: b})),
        showMessage: true,
        messengerCta: true,
        anchorId: 'lead-form',
      },
      {
        _key: 'faq',
        _type: 'faqSection',
        enabled: true,
        title: loc(copy.faq.title),
        items: copy.faq.items.map((it, i) => ({
          _key: `q${i}`,
          _type: 'localizedFaqItem',
          question: loc(it.q),
          answer: loc(it.a),
        })),
      },
      {
        _key: 'cta',
        _type: 'ctaSection',
        enabled: true,
        title: loc(copy.cta.title),
        description: loc(copy.cta.description),
        cta: {href: '#lead-form', label: loc(copy.cta.button)},
        secondaryCta: {href: WHATSAPP, label: loc('WhatsApp')},
      },
    ].filter(Boolean) as Array<Record<string, unknown>>

    const doc = {
      _id: `landing-unique-${L}-${copy.slug}`,
      _type: 'landingPage',
      enabled: true,
      pageType: 'unique',
      slug: {_type: 'slug', current: copy.slug},
      title: loc(copy.hero.title),
      locales: [L],
      contentUpdatedAt: copy.updatedAt ?? '2026-10-11',
      topicTags: ['theme:lead-landing'],
      seo: {
        metaTitle: loc(copy.seo.metaTitle),
        metaDescription: loc(copy.seo.metaDescription),
        // No og fields: the title chain puts ogTitle before metaTitle, and the
        // keyword-led metaTitle must be the <title>. Open Graph falls back to it.
        noIndex: false,
      },
      pageSections: sections,
    }

    // A slug must not be taken by another landing.
    const clash = await client.fetch(
      `*[_type=="landingPage" && slug.current==$slug && _id != $id && !(_id in path("drafts.**"))][0]._id`,
      {slug: copy.slug, id: doc._id},
    )
    if (clash) throw new Error(`${file}: slug ${copy.slug} already used by ${clash}`)

    console.log(`${doc._id}  /${L}/${copy.slug}  sections=${sections.length}  faq=${copy.faq.items.length}  title="${copy.seo.metaTitle}" (${copy.seo.metaTitle.length})`)
    if (isExecute) {
      await client.createOrReplace(doc)
      console.log('  written')
    }
  }
  if (!isExecute) console.log('\nDry run — nothing written.')
}

main().catch((e) => {
  console.error(e instanceof Error ? (e.stack ?? e.message) : e)
  process.exit(1)
})
