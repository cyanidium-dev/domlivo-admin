/**
 * ТЗ-12 — generate the "X vs Y" comparison landings.
 *
 * Each pair becomes a `custom` landing at `/guides/{slug}`, composed from
 * sections that already exist. What the generator contributes is the join:
 * the argument comes from `scripts/data/comparisons.json`, the figures come
 * from `zoneMetrics` at build time, and the cross-links come from the registry's
 * `related` graph.
 *
 * Composition per page:
 *   heroSection                what the page settles, plus a catalog CTA
 *   statsBandSection           the headline figures, read from zoneMetrics
 *   zonePriceTableAutoSection  the two zones side by side (omitted for external)
 *   districtsComparisonSection the non-numeric table: season, buyer, risk
 *   seoTextSection             the verdict per audience — the actual point
 *   faqSection                 the two questions every comparison gets asked
 *   sourcesSection             where the numbers came from
 *   landingCollectionSection   sibling comparisons, from `related`
 *   ctaSection                 two CTAs, one catalog per side
 *
 * Prices are never written into the config. A hand-typed number in a JSON file
 * goes stale silently, which is the failure this project already had with the
 * hand-typed comparison tables on the city landings.
 *
 * Idempotent: an existing landing is skipped so Studio edits survive; `--force`
 * replaces deliberately; `--verify` diffs without writing.
 *
 * Run:
 * - npm run generate:comparisons -- --dry
 * - npm run generate:comparisons -- --execute
 * - npm run generate:comparisons -- --verify
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {
  parseComparisons,
  comparisonTitle,
  referencedZoneSlugs,
  LOCALES,
  type Comparison,
  type Localized,
  type Locale,
} from './lib/comparisonRegistry'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const args = process.argv.slice(2)
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')
const isForce = args.includes('--force')
const isVerify = args.includes('--verify')

if (!token || !projectId) {
  console.error('Error: SANITY_PROJECT_ID and SANITY_API_TOKEN required.')
  process.exit(1)
}
if (!isDry && !isExecute && !isVerify) {
  console.error('Use --dry, --execute or --verify.')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token})

const T = {
  compareTable: {
    en: '{a} against {b}, by the numbers', uk: '{a} проти {b} у цифрах', ru: '{a} против {b} в цифрах',
    sq: '{a} kundrejt {b}, në shifra', it: '{a} contro {b}, in cifre',
  },
  criteria: {
    en: 'Beyond the price', uk: 'Поза ціною', ru: 'За пределами цены',
    sq: 'Përtej çmimit', it: 'Oltre il prezzo',
  },
  criteriaSub: {
    en: 'The things a price table cannot tell you: how long the season runs, who else is buying, and what can go wrong.',
    uk: 'Те, чого не скаже цінова таблиця: як довго триває сезон, хто ще купує і що може піти не так.',
    ru: 'То, чего не скажет ценовая таблица: как долго длится сезон, кто ещё покупает и что может пойти не так.',
    sq: 'Ato që një tabelë çmimesh nuk i thotë: sa zgjat sezoni, kush tjetër blen dhe çfarë mund të shkojë keq.',
    it: 'Ciò che una tabella di prezzi non dice: quanto dura la stagione, chi altro compra e cosa può andare storto.',
  },
  verdict: {
    en: 'The verdict, by who you are', uk: 'Вердикт залежно від того, хто ви', ru: 'Вердикт в зависимости от того, кто вы',
    sq: 'Vendimi, sipas kush jeni', it: 'Il verdetto, secondo chi siete',
  },
  faqTitle: {en: 'Common questions', uk: 'Часті запитання', ru: 'Частые вопросы', sq: 'Pyetje të shpeshta', it: 'Domande frequenti'},
  sourcesTitle: {en: 'Sources', uk: 'Джерела', ru: 'Источники', sq: 'Burimet', it: 'Fonti'},
  relatedTitle: {
    en: 'Other comparisons', uk: 'Інші порівняння', ru: 'Другие сравнения',
    sq: 'Krahasime të tjera', it: 'Altri confronti',
  },
  ctaTitle: {
    en: 'Decided, or still weighing it up?', uk: 'Вирішили — чи ще зважуєте?', ru: 'Решили — или ещё взвешиваете?',
    sq: 'Vendosët, apo ende po peshoni?', it: 'Deciso, o state ancora valutando?',
  },
  ctaText: {
    en: 'Tell us the budget and the format and we will come back with what is actually on the market in either place.',
    uk: 'Назвіть бюджет і формат — ми повернемося з тим, що справді є на ринку в кожному з місць.',
    ru: 'Назовите бюджет и формат — мы вернёмся с тем, что действительно есть на рынке в каждом из мест.',
    sq: 'Na tregoni buxhetin dhe formatin dhe do t’ju kthehemi me atë që ka vërtet në treg në secilin vend.',
    it: 'Diteci budget e formato e vi rispondiamo con ciò che c’è davvero sul mercato in entrambi i posti.',
  },
  seeIn: {en: 'Listings in {n}', uk: 'Обʼєкти в {n}', ru: 'Объекты в {n}', sq: 'Pronat në {n}', it: 'Annunci a {n}'},
  q1: {
    en: 'Which is cheaper, {a} or {b}?', uk: 'Що дешевше — {a} чи {b}?', ru: 'Что дешевле — {a} или {b}?',
    sq: 'Cila është më e lirë, {a} apo {b}?', it: 'Quale costa meno, {a} o {b}?',
  },
  q2: {
    en: 'Which is the better investment, {a} or {b}?', uk: 'Що вигідніше як інвестиція — {a} чи {b}?',
    ru: 'Что выгоднее как инвестиция — {a} или {b}?', sq: 'Cila është investim më i mirë, {a} apo {b}?',
    it: 'Quale è l’investimento migliore, {a} o {b}?',
  },
  aPrices: {
    en: 'The table above carries the current asking bands for both, with their sources and the period they cover. Prices move, so the figures are dated rather than presented as permanent.',
    uk: 'У таблиці вище — поточні діапазони цін пропозиції для обох, із джерелами й періодом. Ціни рухаються, тож цифри датовані, а не подані як постійні.',
    ru: 'В таблице выше — текущие диапазоны цен предложения для обоих, с источниками и периодом. Цены двигаются, поэтому цифры датированы, а не поданы как постоянные.',
    sq: 'Tabela më sipër mban intervalet aktuale të kërkuara për të dyja, me burimet dhe periudhën. Çmimet lëvizin, ndaj shifrat janë të datuara.',
    it: 'La tabella sopra riporta le fasce attuali per entrambe, con fonti e periodo. I prezzi si muovono, quindi le cifre sono datate.',
  },
  aInvest: {
    en: 'It depends on what you are buying it for, which is why the verdict section above splits by audience rather than naming one winner. A place that suits a short-let investor often suits a year-round resident badly.',
    uk: 'Залежить від того, для чого ви купуєте — тому розділ вердикту вище розділений за аудиторіями, а не називає одного переможця. Місце, що пасує інвестору в подобову оренду, часто погано пасує тому, хто житиме цілий рік.',
    ru: 'Зависит от того, для чего вы покупаете — поэтому раздел вердикта выше разделён по аудиториям, а не называет одного победителя. Место, подходящее инвестору в посуточную аренду, часто плохо подходит тому, кто будет жить круглый год.',
    sq: 'Varet përse po e blini, prandaj seksioni i vendimit më sipër ndahet sipas audiencës e nuk shpall një fitues. Një vend që i shkon investitorit të qirasë afatshkurtër shpesh nuk i shkon banorit gjithëvjetor.',
    it: 'Dipende da perché lo comprate: per questo la sezione del verdetto si divide per pubblico invece di nominare un vincitore. Un posto adatto agli affitti brevi spesso è pessimo per chi ci vive tutto l’anno.',
  },
} as const

type ZoneRow = {
  _id: string
  slug: string
  type: 'city' | 'district'
  citySlug?: string
  countrySlug?: string
  title?: Partial<Localized>
  price?: number
  periodLabel?: string
}

function fill(template: Record<Locale, string>, vars: Record<string, Partial<Localized>>): Localized {
  const out = {} as Localized
  for (const l of LOCALES) {
    let s: string = template[l]
    for (const [key, value] of Object.entries(vars)) s = s.replace(`{${key}}`, value[l] ?? value.en ?? '')
    out[l] = s
  }
  return out
}

function toBlocks(paragraphs: Localized[], keyPrefix: string) {
  const out: Record<string, unknown[]> = {}
  for (const l of LOCALES) {
    out[l] = paragraphs.map((p, i) => ({
      _key: `${keyPrefix}-${l}-${i}`,
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [{_key: `${keyPrefix}-${l}-${i}-s`, _type: 'span', marks: [], text: p[l]}],
    }))
  }
  return out
}

const IGNORED_KEYS = new Set(['_rev', '_createdAt', '_updatedAt', '_system', 'contentUpdatedAt'])

function diffDoc(built: unknown, live: unknown, p = ''): string[] {
  if (built === live) return []
  const both = built && live && typeof built === 'object' && typeof live === 'object' &&
    !Array.isArray(built) && !Array.isArray(live)
  if (both) {
    const b = built as Record<string, unknown>
    const l = live as Record<string, unknown>
    const out: string[] = []
    for (const k of new Set([...Object.keys(b), ...Object.keys(l)])) {
      if (IGNORED_KEYS.has(k)) continue
      if (b[k] === undefined && l[k] === undefined) continue
      out.push(...diffDoc(b[k], l[k], p ? `${p}.${k}` : k))
    }
    return out
  }
  if (Array.isArray(built) && Array.isArray(live)) {
    if (built.length !== live.length) return [`${p}: ${built.length} built vs ${live.length} live`]
    return built.flatMap((x, i) => diffDoc(x, live[i], `${p}[${i}]`))
  }
  const show = (v: unknown) => String(typeof v === 'string' ? v : JSON.stringify(v)).slice(0, 60)
  return [`${p}: built ${show(built)} / live ${show(live)}`]
}

function catalogHref(z: ZoneRow | undefined): string {
  if (!z) return '/catalog'
  const country = z.countrySlug ?? 'albania'
  return z.type === 'city'
    ? `/${country}/${z.slug}/sale`
    : `/${country}/${z.citySlug}/sale?district=${z.slug}`
}

function buildLanding(c: Comparison, zones: Map<string, ZoneRow>, year: string): Record<string, unknown> {
  const left = zones.get(c.left.slug)
  const right = zones.get(c.right.slug)
  const names = {a: c.left.title, b: c.right.title}
  const title = comparisonTitle(c, year)

  // Headline figures come from the zones themselves, never from the config.
  const statItems = [left, right]
    .map((z, i) => {
      if (!z || typeof z.price !== 'number') return null
      const side = i === 0 ? c.left : c.right
      return {
        _key: `stat-${i}`,
        value: `€${Math.round(z.price).toLocaleString('en-US')}/m²`,
        label: side.title,
        sublabel: Object.fromEntries(LOCALES.map((l) => [l, z.periodLabel ?? year])) as Localized,
        confidence: 'medium',
      }
    })
    .filter(Boolean) as Record<string, unknown>[]

  const sections: Record<string, unknown>[] = [
    {
      _key: 'hero', _type: 'heroSection', enabled: true,
      title,
      subtitle: c.angle,
      shortLine: fill({en: '{a} vs {b}', uk: '{a} проти {b}', ru: '{a} против {b}', sq: '{a} kundrejt {b}', it: '{a} contro {b}'}, names),
      cta: {href: catalogHref(left), label: fill(T.seeIn, {n: c.left.title})},
    },
    ...(statItems.length === 2
      ? [{
          _key: 'stats', _type: 'statsBandSection', enabled: true,
          title: fill(T.compareTable, names),
          items: statItems,
          lastUpdated: year,
        }]
      : []),
    // An external comparison has no zoneMetrics on one side, so the auto table
    // would render a single row — the same "comparison of one" defect the
    // district generator already guards against.
    ...(c.kind === 'zones' && left && right
      ? [{
          _key: 'prices', _type: 'zonePriceTableAutoSection', enabled: true,
          mode: 'compare',
          title: fill(T.compareTable, names),
          zones: [left, right].map((z, i) => ({_key: `z${i}`, _type: 'reference', _ref: z._id})),
          columns: ['priceNew', 'priceResale', 'referencePrice'],
          sortBy: 'price', linkRows: true, showSources: true,
        }]
      : []),
    {
      _key: 'criteria', _type: 'districtsComparisonSection', enabled: true,
      title: T.criteria as unknown as Localized,
      description: T.criteriaSub as unknown as Localized,
      headings: [
        Object.fromEntries(LOCALES.map((l) => [l, ''])) as Localized,
        c.left.title,
        c.right.title,
      ],
      rows: c.criteria.map((k, i) => ({
        _key: `row-${i}`,
        cells: [k.label, k.left, k.right],
      })),
    },
    {
      _key: 'verdict', _type: 'seoTextSection', enabled: true,
      title: T.verdict as unknown as Localized,
      content: toBlocks(
        c.scenarios.map((s) =>
          Object.fromEntries(LOCALES.map((l) => [l, `${s.audience[l]}: ${s.verdict[l]}`])) as Localized,
        ),
        `verdict-${c.slug}`,
      ),
    },
    {
      _key: 'faq', _type: 'faqSection', enabled: true,
      title: T.faqTitle as unknown as Localized,
      items: [
        {_key: 'q1', _type: 'localizedFaqItem', question: fill(T.q1, names), answer: T.aPrices as unknown as Localized},
        {_key: 'q2', _type: 'localizedFaqItem', question: fill(T.q2, names), answer: T.aInvest as unknown as Localized},
      ],
    },
    ...(c.kbSource
      ? [{
          _key: 'sources', _type: 'sourcesSection', enabled: true,
          title: T.sourcesTitle as unknown as Localized,
          sources: [{
            _key: 'kb', _type: 'sourceItem',
            label: `DomLivo research: ${c.kbSource}`,
            url: 'https://www.domlivo.com/en/guides',
            publisher: 'DomLivo Research Department',
          }],
        }]
      : []),
    ...(c.related.length
      ? [{
          _key: 'related', _type: 'landingCollectionSection', enabled: true,
          presentation: 'grid',
          mode: 'manual',
          title: T.relatedTitle as unknown as Localized,
          manualItems: c.related.map((slug, i) => ({
            _key: `rel-${i}`, _type: 'reference', _ref: `landing-comparison-${slug}`,
          })),
        }]
      : []),
    {
      _key: 'cta', _type: 'ctaSection', enabled: true,
      eyebrow: fill({en: '{a} vs {b}', uk: '{a} проти {b}', ru: '{a} против {b}', sq: '{a} kundrejt {b}', it: '{a} contro {b}'}, names),
      title: T.ctaTitle as unknown as Localized,
      description: T.ctaText as unknown as Localized,
      cta: {href: catalogHref(left), label: fill(T.seeIn, {n: c.left.title})},
      ...(c.kind === 'zones'
        ? {secondaryCta: {href: catalogHref(right), label: fill(T.seeIn, {n: c.right.title})}}
        : {}),
    },
  ]

  return {
    _id: `landing-comparison-${c.slug}`,
    _type: 'landingPage',
    enabled: true,
    pageType: 'custom',
    slug: {_type: 'slug', current: c.slug},
    title,
    cardDescription: c.angle,
    contentUpdatedAt: new Date().toISOString().slice(0, 10),
    seo: {metaTitle: title, metaDescription: c.angle, ogTitle: title, ogDescription: c.angle},
    pageSections: sections,
  }
}

async function main() {
  const file = parseComparisons(
    JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'scripts/data/comparisons.json'), 'utf8')),
  )

  const slugs = referencedZoneSlugs(file)
  const rows: ZoneRow[] = await client.fetch(
    `*[_type in ["city", "district"] && slug.current in $slugs]{
      _id, _type, "slug": slug.current, title, isPublished,
      "type": _type,
      "citySlug": select(_type == "district" => city->slug.current, slug.current),
      "countrySlug": select(_type == "district" => city->country->slug.current, country->slug.current),
      "price": *[_type == "zoneMetrics" && zone._ref == ^._id] | order(periodDate desc)[0]{
        "p": coalesce(priceNewMedian, priceAllMedian, (priceNewMin + priceNewMax) / 2, (priceAllMin + priceAllMax) / 2)
      }.p,
      "periodLabel": *[_type == "zoneMetrics" && zone._ref == ^._id] | order(periodDate desc)[0].periodLabel
    }`,
    {slugs},
  )
  const zones = new Map(rows.map((z) => [z.slug, z]))

  const missing = slugs.filter((s) => !zones.has(s))
  if (missing.length) {
    console.error(`Zones referenced by comparisons but absent: ${missing.join(', ')}`)
    process.exit(1)
  }
  // A comparison linking a zone the site does not publish is a link to a 404.
  const unpublished = rows.filter((z) => (z as any).isPublished === false).map((z) => z.slug)
  if (unpublished.length) {
    console.error(`Comparisons reference unpublished zones: ${unpublished.join(', ')}`)
    process.exit(1)
  }

  const year = String(new Date().getFullYear())
  const docs = file.comparisons.map((c) => buildLanding(c, zones, year))

  const existing = new Set<string>(
    await client.fetch(`*[_type == "landingPage" && _id in $ids]._id`, {ids: docs.map((d) => d._id)}),
  )

  if (isVerify) {
    const live: any[] = await client.fetch(`*[_id in $ids]`, {ids: docs.map((d) => d._id)})
    const byId = new Map(live.map((d) => [d._id, d]))
    let same = 0
    const edited: string[] = []
    const absent: string[] = []
    for (const built of docs) {
      const cur = byId.get(built._id as string)
      if (!cur) { absent.push(built._id as string); continue }
      const diffs = diffDoc(built, cur)
      if (diffs.length === 0) { same++; continue }
      edited.push(built._id as string)
      console.log(`edited   ${built._id} (${diffs.length} field(s) — a re-run leaves these alone)`)
      for (const d of diffs.slice(0, 4)) console.log(`           ${d}`)
    }
    console.log(`\nVerify: ${same}/${docs.length} reproduce exactly` +
      (edited.length ? `, ${edited.length} edited` : '') +
      (absent.length ? `, ${absent.length} missing` : ''))
    for (const id of absent) console.log(`  missing: ${id}`)
    if (absent.length) process.exitCode = 1
    return
  }

  for (const d of docs) {
    const skip = existing.has(d._id as string) && !isForce
    const types = (d.pageSections as any[]).map((s) => s._type).join(' > ')
    console.log(`${skip ? 'skip    ' : isForce && existing.has(d._id as string) ? 'replace ' : 'create  '} ${d._id}`)
    if (!skip) console.log(`           ${types}`)
  }

  const toWrite = docs.filter((d) => isForce || !existing.has(d._id as string))
  if (isDry) { console.log(`\nDry run. ${toWrite.length} to write, ${docs.length - toWrite.length} skipped.`); return }
  if (toWrite.length === 0) { console.log('\nNothing to write.'); return }
  if (isForce) console.log('\n⚠ --force replaces existing landings, including Studio edits.')

  // Two passes: every landing must exist before the `related` references can
  // resolve, otherwise the first page written points at documents that do not
  // exist yet and Sanity rejects the transaction.
  const withoutRelated = toWrite.map((d) => ({
    ...d,
    pageSections: (d.pageSections as any[]).filter((s) => s._type !== 'landingCollectionSection'),
  }))
  await withoutRelated
    .reduce((t, d) => (isForce ? t.createOrReplace(d as never) : t.createIfNotExists(d as never)), client.transaction())
    .commit()
  await toWrite
    .reduce((t, d) => t.patch(d._id as string, (p) => p.set({pageSections: d.pageSections})), client.transaction())
    .commit()

  console.log(`\nWrote ${toWrite.length} comparison landings.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
