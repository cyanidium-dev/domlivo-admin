/**
 * ТЗ-11: turn district pages from the flat fallback template into constructor
 * landings — see docs/engineering/PAGE-STRUCTURE-REVIEW-2026-08-15.md §2, which
 * concluded that every element the research prescribes is section-level, so the
 * `district` document can never express it on its own.
 *
 * Composition per page:
 *   heroSection            H1 + subtitle + the district's own photo + catalog CTA
 *   zoneStatsAutoSection   figures from the newest zoneMetrics record
 *   seoTextSection         the district's editorial description
 *   propertyCarouselSection  filtered to this district (needs the filters field)
 *   zonePriceTableAutoSection  this district against its three nearest by price
 *   ctaSection
 *
 * Idempotent: a landing that already exists is skipped, so editorial changes
 * made in Studio are never flattened. `--force` replaces them deliberately.
 *
 * Run:
 * - npm run generate:district-landings -- --city tirana --dry
 * - npm run generate:district-landings -- --city tirana --execute
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import fs from 'node:fs'
import {resolveZoneSeo, type ZoneMetricsForSeo} from './lib/zoneSeoCopy'
import {parseRegistry, flattenDistricts, roleOf} from './lib/zoneRegistry'

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
const isForce = args.includes('--force')
/**
 * Rebuild every landing in memory and diff it against the dataset. Writes
 * nothing. A landing that differs is an edited one, which ТЗ-11 requires a
 * re-run to leave alone — so that is reported, not treated as a failure.
 */
const isVerify = args.includes('--verify')

if (!token || !projectId) {
  console.error('Error: SANITY_PROJECT_ID and SANITY_API_TOKEN required. Add them to .env')
  process.exit(1)
}
if (!cityArg) {
  console.error('Error: pass --city <slug>, e.g. --city tirana')
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

/** Section headings are templated per locale; the prose comes from the documents. */
const T = {
  stats: {en: '{n} in figures', uk: '{n} у цифрах', ru: '{n} в цифрах', sq: '{n} në shifra', it: '{n} in cifre'},
  about: {en: 'About {n}', uk: 'Про {n}', ru: 'О районе {n}', sq: 'Rreth {n}', it: 'Informazioni su {n}'},
  listings: {
    en: 'Properties in {n}', uk: 'Об’єкти в {n}', ru: 'Объекты в {n}',
    sq: 'Prona në {n}', it: 'Immobili a {n}',
  },
  compare: {
    en: '{n} against nearby districts',
    uk: '{n} у порівнянні із сусідніми районами',
    ru: '{n} в сравнении с соседними районами',
    sq: '{n} krahasuar me lagjet fqinje',
    it: '{n} a confronto con i quartieri vicini',
  },
  compareSub: {
    en: 'The districts closest to it in price, so the number above has something to sit against.',
    uk: 'Найближчі за ціною райони — щоб цифру вище було з чим порівняти.',
    ru: 'Ближайшие по цене районы — чтобы цифру выше было с чем сравнить.',
    sq: 'Lagjet më të afërta për nga çmimi, që shifra më sipër të ketë me çfarë të krahasohet.',
    it: 'I quartieri più vicini per prezzo, così la cifra qui sopra ha un termine di paragone.',
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

type DistrictRow = {
  _id: string
  slug: string
  isPublished?: boolean
  cityId: string
  citySlug: string
  countrySlug: string
  title?: Localized
  heroTitle?: Localized
  heroSubtitle?: Localized
  description?: Localized
  seo?: {metaTitle?: Localized; metaDescription?: Localized}
  heroImageRef?: string
  price?: number
  hasMetrics?: boolean
  cityTitle?: Localized
  metrics?: ZoneMetricsForSeo | null
}

/** Below this, an "About" section reads as a stub rather than an article. */
const MIN_DESCRIPTION = 150

function fill(template: Record<Locale, string>, names: Localized): Localized {
  const out: Localized = {}
  for (const l of LOCALES) {
    const name = names[l] ?? names.en ?? ''
    out[l] = template[l].replace('{n}', name)
  }
  return out
}

/** One block of portable text per locale from a plain paragraph. */
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

/**
 * Nearest by price, so the comparison table answers "what else costs this much".
 * Only published neighbours are eligible: the frontend filters unpublished zones
 * out of comparison tables, so an unpublished row would silently disappear at
 * render and leave a shorter table than the one generated here.
 */
function nearestByPrice(self: DistrictRow, all: DistrictRow[], count = 3): DistrictRow[] {
  const eligible = all.filter(
    (d) => d._id !== self._id && typeof d.price === 'number' && d.isPublished !== false,
  )
  if (typeof self.price !== 'number') return eligible.slice(0, count)
  return eligible
    .sort((a, b) => Math.abs((a.price as number) - (self.price as number)) - Math.abs((b.price as number) - (self.price as number)))
    .slice(0, count)
}

/** Sanity's own bookkeeping, plus the one field that legitimately moves with the clock. */
const IGNORED_KEYS = new Set(['_rev', '_createdAt', '_updatedAt', '_system', 'contentUpdatedAt'])

/** Field-by-field comparison, reporting paths rather than a wall of JSON. */
function diffDoc(built: unknown, live: unknown, path = ''): string[] {
  if (built === live) return []
  const bothObjects =
    built && live && typeof built === 'object' && typeof live === 'object' &&
    !Array.isArray(built) && !Array.isArray(live)

  if (bothObjects) {
    const b = built as Record<string, unknown>
    const l = live as Record<string, unknown>
    const keys = new Set([...Object.keys(b), ...Object.keys(l)])
    const out: string[] = []
    for (const key of keys) {
      if (IGNORED_KEYS.has(key)) continue
      if (b[key] === undefined && l[key] === undefined) continue
      out.push(...diffDoc(b[key], l[key], path ? `${path}.${key}` : key))
    }
    return out
  }

  if (Array.isArray(built) && Array.isArray(live)) {
    if (built.length !== live.length) {
      return [`${path}: ${built.length} item(s) built vs ${live.length} live`]
    }
    return built.flatMap((item, i) => diffDoc(item, live[i], `${path}[${i}]`))
  }

  const show = (v: unknown) => {
    const text = typeof v === 'string' ? v : JSON.stringify(v)
    return text === undefined ? 'undefined' : String(text).slice(0, 60)
  }
  return [`${path}: built ${show(built)} / live ${show(live)}`]
}

async function main() {
  // Unpublished districts are included on purpose. The readiness gate
  // (`npm run audit:zone-readiness`) requires a landing before a zone may be
  // published, so restricting this to published zones made the two mutually
  // blocking — nothing could ever satisfy both. A landing attached to an
  // unpublished district renders nowhere (the frontend district query filters
  // `isPublished != false`), so building it early is safe and means the page is
  // reviewable before it goes live rather than after.
  const districts: DistrictRow[] = await client.fetch(
    `*[_type == "district" && city->slug.current == $city]{
      _id,
      "slug": slug.current,
      isPublished,
      "cityId": city->_id,
      "citySlug": city->slug.current,
      "countrySlug": city->country->slug.current,
      title, heroTitle, heroSubtitle, description, seo,
      "heroImageRef": heroImage.asset._ref,
      "hasMetrics": count(*[_type == "zoneMetrics" && zone._ref == ^._id]) > 0,
      "cityTitle": city->title,
      "metrics": *[_type == "zoneMetrics" && zone._ref == ^._id] | order(periodDate desc)[0]{
        priceNewMin, priceNewMax, priceNewMedian,
        priceResaleMin, priceResaleMax, priceResaleMedian,
        priceAllMin, priceAllMax, priceAllMedian,
        rentLtr1brMin, rentLtr1brMax, referencePrice, periodLabel
      },
      "price": *[_type == "zoneMetrics" && zone._ref == ^._id] | order(periodDate desc)[0]{
        "p": coalesce(priceNewMedian, priceAllMedian, (priceNewMin + priceNewMax) / 2, (priceAllMin + priceAllMax) / 2)
      }.p
    } | order(slug asc)`,
    {city: cityArg},
  )

  if (districts.length === 0) {
    console.error(`No districts found for city "${cityArg}".`)
    process.exit(1)
  }

  // `metric-only` zones carry figures but must never become pages — they are
  // price lines within a district, not places. See scripts/lib/zoneRegistry.ts.
  const registry = parseRegistry(
    JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'scripts/data/zones.json'), 'utf8')),
  )
  const metricOnly = new Set(
    flattenDistricts(registry).filter((d) => roleOf(d) === 'metric-only').map((d) => d.slug),
  )
  const excluded = districts.filter((d) => metricOnly.has(d.slug)).map((d) => d.slug)
  for (const s of excluded) console.log(`metric   ${s} (metric-only — no page by design)`)
  const pageZones = districts.filter((d) => !metricOnly.has(d.slug))

  const existing: string[] = await client.fetch(
    `*[_type == "landingPage" && pageType == "district" && linkedDistrict->city->slug.current == $city].linkedDistrict._ref`,
    {city: cityArg},
  )
  const has = new Set(existing)

  const docs: Record<string, unknown>[] = []
  const skipped: string[] = []
  const noData: string[] = []

  for (const d of pageZones) {
    if (has.has(d._id) && !isForce && !isVerify) { skipped.push(d.slug); continue }
    // Without metrics the data blocks render nothing, and a landing would be
    // thinner than the fallback template it replaces. Leave those alone.
    if (typeof d.price !== 'number' && !d.hasMetrics) {
      noData.push(d.slug)
      continue
    }

    const names: Localized = d.title ?? {}
    // Compose SEO from the zone's own figures. Inheriting `d.seo` used to carry
    // seed text like "Most vibrant district" straight onto the share card.
    const composedSeo = resolveZoneSeo(
      {
        kind: 'district',
        slug: d.slug,
        title: d.title,
        cityTitle: d.cityTitle,
        description: d.description,
        metrics: d.metrics,
      },
      String(new Date().getFullYear()),
      d.seo,
    )
    const seo = composedSeo
      ? {
          ...(d.seo ?? {}),
          metaTitle: composedSeo.metaTitle,
          ogTitle: composedSeo.metaTitle,
          metaDescription: composedSeo.metaDescription,
          ogDescription: composedSeo.metaDescription,
        }
      : d.seo
    // `country` is required on the city schema, so a missing slug means the
    // reference dangles or the country document has none — a data fault, not a
    // case to paper over. Defaulting it would silently emit Albanian catalog
    // links for a district in some other country.
    if (!d.countrySlug) {
      throw new Error(
        `District "${d.slug}" resolves to no country slug via city "${d.citySlug}". Set an explicit country on the city document before generating landings.`,
      )
    }
    const catalogHref = `/${d.countrySlug}/${d.citySlug}/sale?district=${d.slug}`
    const neighbours = nearestByPrice(d, pageZones)

    const sections: Record<string, unknown>[] = [
      {
        _key: 'hero', _type: 'heroSection', enabled: true,
        title: composedSeo?.metaTitle ?? d.seo?.metaTitle ?? d.heroTitle ?? names,
        subtitle: d.heroSubtitle,
        shortLine: names,
        cta: {href: catalogHref, label: T.ctaBtn},
        ...(d.heroImageRef
          ? {backgroundImage: {_type: 'image', asset: {_type: 'reference', _ref: d.heroImageRef}}}
          : {}),
      },
      {
        _key: 'stats', _type: 'zoneStatsAutoSection', enabled: true,
        zoneMode: 'auto', showSources: true,
        title: fill(T.stats, names),
      },
      ...((d.description?.en?.length ?? 0) >= MIN_DESCRIPTION
        ? [{
            _key: 'about', _type: 'seoTextSection', enabled: true,
            title: fill(T.about, names),
            content: toBlocks(d.description ?? {}, `about-${d.slug}`),
          }]
        : []),
      {
        _key: 'listings', _type: 'propertyCarouselSection', enabled: true,
        mode: 'auto',
        title: fill(T.listings, names),
        filters: {
          // The city's real `_id`, never `city-${slug}`: nine district documents
          // already have an id that no longer follows their slug (renamed in the
          // August taxonomy pass), and a constructed id would point at nothing.
          city: {_type: 'reference', _ref: d.cityId},
          district: {_type: 'reference', _ref: d._id},
        },
        autoMode: {limit: 12, sort: 'newest'},
      },
      // A comparison of one is not a comparison: Shëngjin has a single district,
      // so the table would have rendered with only the page's own row.
      //
      // A zone with no price of its own cannot have "nearest by price" either.
      // Farkë/Lundër and Laprakë are reference-only — the market quotes them in
      // whole lots, not €/m² — and without a price to sort against, the table
      // silently listed whichever three districts came first alphabetically
      // under a heading promising the closest in price.
      ...(neighbours.length === 0 || typeof d.price !== 'number' ? [] : [{
        _key: 'compare', _type: 'zonePriceTableAutoSection', enabled: true,
        mode: 'compare',
        title: fill(T.compare, names),
        subtitle: T.compareSub,
        zones: [d, ...neighbours].map((z, i) => ({
          _key: `z${i}`, _type: 'reference', _ref: z._id,
        })),
        columns: ['priceNew', 'priceResale', 'referencePrice'],
        sortBy: 'price', linkRows: true, showSources: true,
      }]),
      // ТЗ-16: sibling districts and the comparisons featuring this zone both
      // resolve automatically from the page's own context at render time.
      {
        _key: 'related-districts', _type: 'relatedPagesAutoSection', enabled: true,
        mode: 'cityDistricts', limit: 6,
      },
      {
        _key: 'related-comparisons', _type: 'relatedPagesAutoSection', enabled: true,
        mode: 'zoneComparisons', limit: 6,
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

    docs.push({
      _id: `landing-district-${d.slug}`,
      _type: 'landingPage',
      enabled: true,
      pageType: 'district',
      slug: {_type: 'slug', current: `${d.citySlug}-${d.slug}`},
      linkedDistrict: {_type: 'reference', _ref: d._id},
      title: composedSeo?.metaTitle ?? d.seo?.metaTitle ?? names,
      cardDescription: d.heroSubtitle,
      topicTags: [`city:${d.citySlug}`, `zone:${d.slug}`],
      contentUpdatedAt: new Date().toISOString().slice(0, 10),
      seo: seo ?? undefined,
      pageSections: sections,
    })
  }

  if (isVerify) {
    const live: Record<string, unknown>[] = await client.fetch(
      `*[_id in $ids]`,
      {ids: docs.map((d) => d._id)},
    )
    const liveById = new Map(live.map((d) => [d._id as string, d]))
    let same = 0
    const edited: string[] = []
    const absent: string[] = []

    for (const built of docs) {
      const id = built._id as string
      const current = liveById.get(id)
      if (!current) { absent.push(id); continue }
      const diffs = diffDoc(built, current)
      if (diffs.length === 0) { same++; continue }
      edited.push(id)
      console.log(`edited   ${id} (${diffs.length} field(s) — a re-run leaves these alone)`)
      for (const line of diffs.slice(0, 6)) console.log(`           ${line}`)
      if (diffs.length > 6) console.log(`           …and ${diffs.length - 6} more`)
    }

    for (const s of noData) console.log(`no-data  ${s} (no zoneMetrics — fallback template kept)`)
    console.log(
      `
Verify: ${same}/${docs.length} reproduce exactly` +
      (edited.length ? `, ${edited.length} edited since generation (preserved on re-run)` : '') +
      (absent.length ? `, ${absent.length} missing from the dataset` : ''),
    )
    for (const id of absent) console.log(`  missing: ${id}`)
    // Only a landing the script cannot account for is a failure. An edited one
    // is the idempotency rule working.
    if (absent.length) process.exitCode = 1
    return
  }

  for (const s of skipped) console.log(`skip     ${s} (landing exists)`)
  for (const s of noData) console.log(`no-data  ${s} (no zoneMetrics — fallback template kept)`)
  for (const doc of docs) {
    const id = doc._id as string
    const sectionTypes = (doc.pageSections as Record<string, unknown>[]).map((s) => s._type).join(' > ')
    console.log(`${isForce && has.size ? 'replace ' : 'create  '} ${id}\n           ${sectionTypes}`)
  }

  if (isDry) {
    console.log(`\nDry run. ${docs.length} to write, ${skipped.length} skipped.`)
    return
  }
  if (docs.length === 0) { console.log('\nNothing to write.'); return }

  if (isForce) {
    console.log('\n⚠ --force replaces existing landings, including any edits made in Studio.')
  }

  const tx = docs.reduce(
    (t, doc) => (isForce ? t.createOrReplace(doc as never) : t.createIfNotExists(doc as never)),
    client.transaction(),
  )
  await tx.commit()
  console.log(`\nWrote ${docs.length} district landings, skipped ${skipped.length}.`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
