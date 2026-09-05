/**
 * City landings for `/{country}/{city}/info`.
 *
 * The info route renders a `landingPage` with `pageType: city` and 404s without
 * one, so four of seven cities had no info page at all — and since the
 * breadcrumb rebuild the Places spine points every district's city crumb at
 * `/info`, which made those 404s reachable from eight links on each district
 * page. This generates the missing landings.
 *
 * Composition mirrors the district generator:
 *   heroSection              H1, subtitle, the city's photo, catalog CTA
 *   zoneStatsAutoSection     the city's own zoneMetrics
 *   seoTextSection           editorial description, when there is one
 *   zonePriceTableAutoSection  every district of the city that has metrics
 *   propertyCarouselSection  filtered to the city
 *   ctaSection
 *
 * Idempotent: an existing landing is skipped, so the hand-built Tirana, Durrës
 * and Shkodër pages are never flattened. `--force` replaces them deliberately.
 *
 * Run:
 * - npm run generate:city-landings -- --dry
 * - npm run generate:city-landings -- --execute [--city vlore] [--force]
 * - npm run generate:city-landings -- --verify
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {resolveZoneSeo, type ZoneMetricsForSeo} from './lib/zoneSeoCopy'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const apiVersion = (process.env.SANITY_API_VERSION || '2024-01-01').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const args = process.argv.slice(2)
const cityArg = (args.find((a) => a.startsWith('--city='))?.split('=')[1] ??
  (args.includes('--city') ? args[args.indexOf('--city') + 1] : '')) as string
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')
import {droppedSections, forceMayProceed, type SectionLike} from './lib/forceGuard'
const isForce = args.includes('--force')
const isVerify = args.includes('--verify')

if (!token || !projectId) {
  console.error('Error: SANITY_PROJECT_ID and SANITY_API_TOKEN required. Add them to .env')
  process.exit(1)
}
if (!isDry && !isExecute && !isVerify) {
  console.error('Use --dry to preview, --execute to write, or --verify to diff against the dataset.')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion, useCdn: false, token})

const LOCALES = ['en', 'uk', 'ru', 'sq', 'it'] as const
type Locale = (typeof LOCALES)[number]
type Localized = Partial<Record<Locale, string>>

/** Below this, an "About" section reads as a stub rather than an article. */
const MIN_DESCRIPTION = 150

const T = {
  stats: {en: '{n} in figures', uk: '{n} у цифрах', ru: '{n} в цифрах', sq: '{n} në shifra', it: '{n} in cifre'},
  about: {en: 'About {n}', uk: 'Про {n}', ru: 'О городе {n}', sq: 'Rreth {n}', it: 'Informazioni su {n}'},
  districts: {
    en: '{n} prices by district',
    uk: 'Ціни в {n} по районах',
    ru: 'Цены в {n} по районам',
    sq: 'Çmimet në {n} sipas lagjeve',
    it: 'Prezzi a {n} per quartiere',
  },
  districtsSub: {
    en: 'Asking prices per zone, with the source behind each figure.',
    uk: 'Ціни пропозиції по зонах із джерелом під кожною цифрою.',
    ru: 'Цены предложения по зонам с источником под каждой цифрой.',
    sq: 'Çmimet e kërkuara sipas zonave, me burimin pas çdo shifre.',
    it: 'Prezzi richiesti per zona, con la fonte dietro ogni cifra.',
  },
  listings: {
    en: 'Properties in {n}', uk: 'Об’єкти в {n}', ru: 'Объекты в {n}',
    sq: 'Prona në {n}', it: 'Immobili a {n}',
  },
  ctaTitle: {
    en: 'Looking for something in {n}?', uk: 'Шукаєте щось у {n}?', ru: 'Ищете что-то в {n}?',
    sq: 'Po kërkoni diçka në {n}?', it: 'Cerchi qualcosa a {n}?',
  },
  ctaText: {
    en: 'Tell us the budget and the format, and we will come back with what is actually on the market.',
    uk: 'Назвіть бюджет і формат — ми повернемося з тим, що справді є на ринку.',
    ru: 'Назовите бюджет и формат — мы вернёмся с тем, что действительно есть на рынке.',
    sq: 'Na tregoni buxhetin dhe formatin, dhe do t’ju kthehemi me atë që ka vërtet në treg.',
    it: 'Diteci budget e formato e vi rispondiamo con ciò che c’è davvero sul mercato.',
  },
  ctaBtn: {en: 'See listings', uk: 'Дивитися об’єкти', ru: 'Смотреть объекты', sq: 'Shiko pronat', it: 'Vedi gli annunci'},
  contact: {en: 'Contact us', uk: 'Звʼязатися', ru: 'Связаться', sq: 'Na kontaktoni', it: 'Contattaci'},
} as const

type CityRow = {
  _id: string
  slug: string
  countrySlug: string
  title?: Localized
  heroSubtitle?: Localized
  shortDescription?: Localized
  description?: Localized
  seo?: {metaTitle?: Localized; metaDescription?: Localized}
  heroImageRef?: string
  metrics?: ZoneMetricsForSeo | null
  districtsWithMetrics?: number
  landingId?: string | null
}

function fill(template: Record<Locale, string>, names: Localized): Localized {
  const out: Localized = {}
  for (const l of LOCALES) out[l] = template[l].replace('{n}', names[l] ?? names.en ?? '')
  return out
}

function toBlocks(text: Localized, keyPrefix: string) {
  const out: Record<string, unknown[]> = {}
  for (const l of LOCALES) {
    const value = text[l]
    if (!value) continue
    out[l] = [
      {
        _key: `${keyPrefix}-${l}`,
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [{_key: `${keyPrefix}-${l}-s`, _type: 'span', marks: [], text: value}],
      },
    ]
  }
  return out
}

const IGNORED_KEYS = new Set(['_rev', '_createdAt', '_updatedAt', '_system', 'contentUpdatedAt'])

function diffDoc(built: unknown, live: unknown, path = ''): string[] {
  if (built === live) return []
  const bothObjects =
    built && live && typeof built === 'object' && typeof live === 'object' &&
    !Array.isArray(built) && !Array.isArray(live)
  if (bothObjects) {
    const b = built as Record<string, unknown>
    const l = live as Record<string, unknown>
    const out: string[] = []
    for (const key of new Set([...Object.keys(b), ...Object.keys(l)])) {
      if (IGNORED_KEYS.has(key)) continue
      if (b[key] === undefined && l[key] === undefined) continue
      out.push(...diffDoc(b[key], l[key], path ? `${path}.${key}` : key))
    }
    return out
  }
  if (Array.isArray(built) && Array.isArray(live)) {
    if (built.length !== live.length) return [`${path}: ${built.length} built vs ${live.length} live`]
    return built.flatMap((item, i) => diffDoc(item, live[i], `${path}[${i}]`))
  }
  const show = (v: unknown) => String(typeof v === 'string' ? v : JSON.stringify(v)).slice(0, 60)
  return [`${path}: built ${show(built)} / live ${show(live)}`]
}

function buildLanding(city: CityRow, year: string): Record<string, unknown> {
  const names: Localized = city.title ?? {}
  // `country` is required on the city schema, so a missing slug means the
  // reference dangles or the country document has none — a data fault, not a
  // case to paper over. Defaulting it would silently emit Albanian catalog
  // links for a city in some other country.
  if (!city.countrySlug) {
    throw new Error(
      `City "${city.slug}" has no country slug. Set an explicit country on the city document before generating landings.`,
    )
  }
  const catalogHref = `/${city.countrySlug}/${city.slug}/sale`

  const seo = resolveZoneSeo(
    {
      kind: 'city',
      slug: city.slug,
      title: city.title,
      description: city.description,
      metrics: city.metrics,
    },
    year,
    city.seo,
  )

  const subtitle = city.heroSubtitle ?? city.shortDescription

  const sections: Record<string, unknown>[] = [
    {
      _key: 'hero', _type: 'heroSection', enabled: true,
      title: seo?.metaTitle ?? names,
      subtitle,
      shortLine: names,
      cta: {href: catalogHref, label: T.ctaBtn},
      search: {
        enabled: true,
        tabs: [
          {_key: 'tab-sale', _type: 'heroSearchTab', key: 'sale', enabled: true},
          {_key: 'tab-rent', _type: 'heroSearchTab', key: 'rent', enabled: false},
          {_key: 'tab-str', _type: 'heroSearchTab', key: 'shortTerm', enabled: false},
        ],
      },
      ...(city.heroImageRef
        ? {backgroundImage: {_type: 'image', asset: {_type: 'reference', _ref: city.heroImageRef}}}
        : {}),
    },
    {
      _key: 'stats', _type: 'zoneStatsAutoSection', enabled: true,
      zoneMode: 'auto', showSources: true,
      title: fill(T.stats, names),
    },
    ...((city.description?.en?.length ?? 0) >= MIN_DESCRIPTION
      ? [{
          _key: 'about', _type: 'seoTextSection', enabled: true,
          title: fill(T.about, names),
          content: toBlocks(city.description ?? {}, `about-${city.slug}`),
        }]
      : []),
    // Only worth a table when the city actually has priced districts.
    ...((city.districtsWithMetrics ?? 0) >= 2
      ? [{
          _key: 'districts', _type: 'zonePriceTableAutoSection', enabled: true,
          mode: 'cityDistricts',
          city: {_type: 'reference', _ref: city._id},
          title: fill(T.districts, names),
          subtitle: T.districtsSub,
          columns: ['priceNew', 'priceResale', 'priceAll'],
          sortBy: 'price', linkRows: true, showSources: true,
        }]
      : []),
    {
      _key: 'listings', _type: 'propertyCarouselSection', enabled: true,
      mode: 'auto',
      title: fill(T.listings, names),
      filters: {city: {_type: 'reference', _ref: city._id}},
      autoMode: {limit: 12, sort: 'newest'},
    },
    // ТЗ-16: district cards resolve automatically from this page's own city.
    {
      _key: 'related-districts', _type: 'relatedPagesAutoSection', enabled: true,
      mode: 'cityDistricts', limit: 6,
    },
    {
      _key: 'cta', _type: 'ctaSection', enabled: true,
      eyebrow: names,
      title: fill(T.ctaTitle, names),
      description: T.ctaText,
      cta: {href: catalogHref, label: T.ctaBtn},
      secondaryCta: {href: '/contact', label: T.contact},
    },
  ]

  return {
    _id: `landing-${city.slug}`,
    _type: 'landingPage',
    enabled: true,
    pageType: 'city',
    slug: {_type: 'slug', current: city.slug},
    linkedCity: {_type: 'reference', _ref: city._id},
    title: seo?.metaTitle ?? names,
    cardDescription: subtitle,
    topicTags: [`city:${city.slug}`, `zone:${city.slug}`],
    contentUpdatedAt: new Date().toISOString().slice(0, 10),
    ...(seo
      ? {
          seo: {
            ...(city.seo ?? {}),
            metaTitle: seo.metaTitle,
            ogTitle: seo.metaTitle,
            metaDescription: seo.metaDescription,
            ogDescription: seo.metaDescription,
            noIndex: false,
          },
        }
      : {}),
    pageSections: sections,
  }
}

async function main() {
  const year = String(new Date().getFullYear())
  const filter = cityArg ? ' && slug.current == $city' : ''

  const cities: CityRow[] = await client.fetch(
    `*[_type == "city" && isPublished != false${filter}]{
      _id,
      "slug": slug.current,
      "countrySlug": country->slug.current,
      title, heroSubtitle, shortDescription, description, seo,
      "heroImageRef": heroImage.asset._ref,
      "metrics": *[_type == "zoneMetrics" && zone._ref == ^._id] | order(periodDate desc)[0]{
        priceNewMin, priceNewMax, priceNewMedian,
        priceResaleMin, priceResaleMax, priceResaleMedian,
        priceAllMin, priceAllMax, priceAllMedian,
        rentLtr1brMin, rentLtr1brMax, referencePrice, periodLabel
      },
      "districtsWithMetrics": count(*[
        _type == "district" && city._ref == ^._id && isPublished == true &&
        count(*[_type == "zoneMetrics" && zone._ref == ^._id]) > 0
      ]),
      "landingId": *[_type == "landingPage" && pageType == "city" && linkedCity._ref == ^._id][0]._id
    } | order(slug asc)`,
    cityArg ? {city: cityArg} : {},
  )

  if (cities.length === 0) {
    console.error(cityArg ? `No published city "${cityArg}".` : 'No published cities.')
    process.exit(1)
  }

  const docs: Record<string, unknown>[] = []
  const skipped: string[] = []

  for (const city of cities) {
    if (city.landingId && !isForce && !isVerify) { skipped.push(city.slug); continue }
    docs.push(buildLanding(city, year))
  }

  if (isVerify) {
    const live: Record<string, unknown>[] = await client.fetch(`*[_id in $ids]`, {
      ids: docs.map((d) => d._id),
    })
    const byId = new Map(live.map((d) => [d._id as string, d]))
    let same = 0
    const edited: string[] = []
    const absent: string[] = []
    for (const built of docs) {
      const current = byId.get(built._id as string)
      if (!current) { absent.push(built._id as string); continue }
      const diffs = diffDoc(built, current)
      if (diffs.length === 0) { same++; continue }
      edited.push(built._id as string)
      console.log(`edited   ${built._id} (${diffs.length} field(s) — a re-run leaves these alone)`)
      for (const line of diffs.slice(0, 5)) console.log(`           ${line}`)
    }
    console.log(
      `\nVerify: ${same}/${docs.length} reproduce exactly` +
        (edited.length ? `, ${edited.length} edited since generation (preserved on re-run)` : '') +
        (absent.length ? `, ${absent.length} missing from the dataset` : ''),
    )
    for (const id of absent) console.log(`  missing: ${id}`)
    if (absent.length) process.exitCode = 1
    return
  }

  for (const s of skipped) console.log(`skip     ${s} (landing exists)`)
  for (const doc of docs) {
    const types = (doc.pageSections as Record<string, unknown>[]).map((s) => s._type).join(' > ')
    console.log(`${isForce ? 'replace ' : 'create  '} ${doc._id}\n           ${types}`)
  }

  if (isDry) {
    console.log(`\nDry run. ${docs.length} to write, ${skipped.length} existing.`)
    return
  }
  if (docs.length === 0) { console.log('\nNothing to write.'); return }
  if (isForce) {
    console.log('\n⚠ --force replaces existing landings, including any edits made in Studio.')
    // Sweep 2026-09-05 F4: refuse to drop sections the generator does not emit.
    const liveDocs: Array<{_id: string; pageSections?: SectionLike[]}> = await client.fetch(
      `*[_id in $ids]{_id, pageSections[]{_type, _key}}`,
      {ids: docs.map((d) => d._id)},
    )
    const drops = docs.flatMap((d) =>
      droppedSections(d._id as string, liveDocs.find((l) => l._id === d._id)?.pageSections, d.pageSections as SectionLike[]),
    )
    if (!forceMayProceed(drops, args)) process.exit(1)
  }

  const tx = docs.reduce(
    (t, doc) => (isForce ? t.createOrReplace(doc as never) : t.createIfNotExists(doc as never)),
    client.transaction(),
  )
  await tx.commit()
  console.log(`\nWrote ${docs.length} city landings, ${skipped.length} existing.`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
