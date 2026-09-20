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
  localesOf,
  type AnyLocale,
  type Comparison,
  type Localized,
} from './lib/comparisonRegistry'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const args = process.argv.slice(2)
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')
import {droppedSections, forceMayProceed, type SectionLike} from './lib/forceGuard'
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
    pl: '{a} kontra {b} w liczbach',
  },
  // Its own heading: the stats band above already carries compareTable, and
  // two identical H2s on one page read as a template defect (audit 2026-09-20).
  priceTable: {
    en: 'Asking prices per m², zone by zone', uk: 'Ціни за м² по зонах', ru: 'Цены за м² по зонам',
    sq: 'Çmimet për m² sipas zonave', it: 'Prezzi al m², zona per zona',
    pl: 'Ceny za m² według stref', de: 'Preise pro m² nach Zonen',
  },
  criteria: {
    en: 'Beyond the price', uk: 'Поза ціною', ru: 'За пределами цены',
    sq: 'Përtej çmimit', it: 'Oltre il prezzo',
    pl: 'Poza ceną',
  },
  criteriaSub: {
    en: 'The things a price table cannot tell you: how long the season runs, who else is buying, and what can go wrong.',
    uk: 'Те, чого не скаже цінова таблиця: як довго триває сезон, хто ще купує і що може піти не так.',
    ru: 'То, чего не скажет ценовая таблица: как долго длится сезон, кто ещё покупает и что может пойти не так.',
    sq: 'Ato që një tabelë çmimesh nuk i thotë: sa zgjat sezoni, kush tjetër blen dhe çfarë mund të shkojë keq.',
    it: 'Ciò che una tabella di prezzi non dice: quanto dura la stagione, chi altro compra e cosa può andare storto.',
    pl: 'To, czego tabela cen nie powie: jak długo trwa sezon, kto jeszcze kupuje i co może pójść nie tak.',
  },
  verdict: {
    en: 'The verdict, by who you are', uk: 'Вердикт залежно від того, хто ви', ru: 'Вердикт в зависимости от того, кто вы',
    sq: 'Vendimi, sipas kush jeni', it: 'Il verdetto, secondo chi siete',
    pl: 'Werdykt zależnie od tego, kim jesteś',
  },
  galleryTitle: {
    en: '{a} and {b}, side by side', uk: '{a} і {b} поруч', ru: '{a} и {b} рядом',
    sq: '{a} dhe {b}, krah për krah', it: '{a} e {b}, a confronto',
    pl: '{a} i {b} obok siebie',
  },
  gallerySub: {
    en: 'Each photograph links through to that place’s own page, with its prices and sources.',
    uk: 'Кожне фото веде на сторінку відповідного місця — з цінами й джерелами.',
    ru: 'Каждое фото ведёт на страницу соответствующего места — с ценами и источниками.',
    sq: 'Çdo fotografi të çon te faqja e vendit përkatës, me çmimet dhe burimet.',
    it: 'Ogni fotografia porta alla pagina del luogo, con prezzi e fonti.',
    pl: 'Każde zdjęcie prowadzi do strony danego miejsca, z cenami i źródłami.',
  },
  faqTitle: {en: 'Common questions', uk: 'Часті запитання', ru: 'Частые вопросы', sq: 'Pyetje të shpeshta', it: 'Domande frequenti', pl: 'Częste pytania'},
  sourcesTitle: {en: 'Sources', uk: 'Джерела', ru: 'Источники', sq: 'Burimet', it: 'Fonti', pl: 'Źródła'},
  relatedTitle: {
    en: 'Other comparisons', uk: 'Інші порівняння', ru: 'Другие сравнения',
    sq: 'Krahasime të tjera', it: 'Altri confronti',
    pl: 'Inne porównania',
  },
  ctaTitle: {
    en: 'Decided, or still weighing it up?', uk: 'Вирішили — чи ще зважуєте?', ru: 'Решили — или ещё взвешиваете?',
    sq: 'Vendosët, apo ende po peshoni?', it: 'Deciso, o state ancora valutando?',
    pl: 'Zdecydowane czy wciąż się zastanawiasz?',
  },
  ctaText: {
    en: 'Tell us the budget and the format and we will come back with what is actually on the market in either place.',
    uk: 'Назвіть бюджет і формат — ми повернемося з тим, що справді є на ринку в кожному з місць.',
    ru: 'Назовите бюджет и формат — мы вернёмся с тем, что действительно есть на рынке в каждом из мест.',
    sq: 'Na tregoni buxhetin dhe formatin dhe do t’ju kthehemi me atë që ka vërtet në treg në secilin vend.',
    it: 'Diteci budget e formato e vi rispondiamo con ciò che c’è davvero sul mercato in entrambi i posti.',
    pl: 'Podaj budżet i format, a wrócimy z tym, co naprawdę jest na rynku w obu miejscach.',
  },
  seeIn: {en: 'Listings in {n}', uk: 'Обʼєкти в {n}', ru: 'Объекты в {n}', sq: 'Pronat në {n}', it: 'Annunci a {n}', pl: 'Oferty: {n}'},
  q1: {
    en: 'Which is cheaper, {a} or {b}?', uk: 'Що дешевше — {a} чи {b}?', ru: 'Что дешевле — {a} или {b}?',
    sq: 'Cila është më e lirë, {a} apo {b}?', it: 'Quale costa meno, {a} o {b}?',
    pl: 'Co jest tańsze: {a} czy {b}?',
  },
  q2: {
    en: 'Which is the better investment, {a} or {b}?', uk: 'Що вигідніше як інвестиція — {a} чи {b}?',
    ru: 'Что выгоднее как инвестиция — {a} или {b}?', sq: 'Cila është investim më i mirë, {a} apo {b}?',
    it: 'Quale è l’investimento migliore, {a} o {b}?',
    pl: 'Co jest lepszą inwestycją: {a} czy {b}?',
  },
  aPrices: {
    en: 'The table above carries the current asking bands for both, with their sources and the period they cover. Prices move, so the figures are dated rather than presented as permanent.',
    uk: 'У таблиці вище — поточні діапазони цін пропозиції для обох, із джерелами й періодом. Ціни рухаються, тож цифри датовані, а не подані як постійні.',
    ru: 'В таблице выше — текущие диапазоны цен предложения для обоих, с источниками и периодом. Цены двигаются, поэтому цифры датированы, а не поданы как постоянные.',
    sq: 'Tabela më sipër mban intervalet aktuale të kërkuara për të dyja, me burimet dhe periudhën. Çmimet lëvizin, ndaj shifrat janë të datuara.',
    it: 'La tabella sopra riporta le fasce attuali per entrambe, con fonti e periodo. I prezzi si muovono, quindi le cifre sono datate.',
    pl: 'Tabela powyżej podaje aktualne przedziały cen ofertowych dla obu miejsc, ze źródłami i okresem, którego dotyczą. Ceny się zmieniają, więc liczby są datowane, a nie przedstawiane jako stałe.',
  },
  aInvest: {
    en: 'It depends on what you are buying it for, which is why the verdict section above splits by audience rather than naming one winner. A place that suits a short-let investor often suits a year-round resident badly.',
    uk: 'Залежить від того, для чого ви купуєте — тому розділ вердикту вище розділений за аудиторіями, а не називає одного переможця. Місце, що пасує інвестору в подобову оренду, часто погано пасує тому, хто житиме цілий рік.',
    ru: 'Зависит от того, для чего вы покупаете — поэтому раздел вердикта выше разделён по аудиториям, а не называет одного победителя. Место, подходящее инвестору в посуточную аренду, часто плохо подходит тому, кто будет жить круглый год.',
    sq: 'Varet përse po e blini, prandaj seksioni i vendimit më sipër ndahet sipas audiencës e nuk shpall një fitues. Një vend që i shkon investitorit të qirasë afatshkurtër shpesh nuk i shkon banorit gjithëvjetor.',
    it: 'Dipende da perché lo comprate: per questo la sezione del verdetto si divide per pubblico invece di nominare un vincitore. Un posto adatto agli affitti brevi spesso è pessimo per chi ci vive tutto l’anno.',
    pl: 'To zależy od tego, po co kupujesz — dlatego werdykt powyżej jest podzielony według odbiorców, a nie wskazuje jednego zwycięzcy. Miejsce dobre dla inwestora w najem krótkoterminowy często źle pasuje komuś, kto mieszka tam cały rok.',
  },
} as const

type Template = Record<AnyLocale, string>

/** The template's text in exactly the page's locales — no `pl` on a page without Polish content. */
function pick(template: Partial<Template>, locales: AnyLocale[]): Localized {
  return Object.fromEntries(locales.map((l) => [l, template[l] ?? ''])) as Localized
}

/** One usable photograph, with the caption the zone already carries. */
type ZoneImage = {
  ref: string
  /** The zone's own alt text. Already honest: a stand-in describes the photo. */
  alt?: string
  /** True when the asset description is stamped STAND-IN. */
  isStandIn?: boolean
}

type ZoneRow = {
  _id: string
  slug: string
  type: 'city' | 'district'
  citySlug?: string
  countrySlug?: string
  title?: Partial<Localized>
  price?: number
  periodLabel?: string
  hero?: ZoneImage | null
  gallery?: ZoneImage[]
}

/**
 * The caption for a slide. A zone-level photo may be titled with the zone's
 * name; a stand-in must be described as what it is, which is the same rule the
 * zone pages follow. Reusing the zone's own alt text is what keeps the two in
 * step — it was corrected once already and must not be re-derived here.
 */
function slideTitle(zone: ZoneRow, image: ZoneImage, name: Partial<Localized>, locales: AnyLocale[]): Localized {
  const out = {} as Localized
  for (const l of locales) {
    out[l] = image.isStandIn ? (image.alt ?? name[l] ?? '') : (name[l] ?? name.en ?? image.alt ?? '')
  }
  return out
}

/**
 * Hero, then gallery, deduplicated by asset — the two usually share one photo.
 *
 * **An image without alt text is skipped.** That is not a nicety: the images
 * that lack alt are the seed placeholders, and they lack it because nobody ever
 * recorded what they show. There is no honest caption to write for a photograph
 * of unknown subject and unknown origin, and emitting `alt=""` on a hero
 * backdrop would be worse than showing no image. It also stops the comparison
 * pages spreading exactly the provenance problem the image audit is closing.
 */
function imagesOf(zone: ZoneRow | undefined): ZoneImage[] {
  if (!zone) return []
  const seen = new Set<string>()
  const out: ZoneImage[] = []
  for (const img of [zone.hero, ...(zone.gallery ?? [])]) {
    if (!img?.ref || seen.has(img.ref)) continue
    if (!img.alt?.trim()) continue
    seen.add(img.ref)
    out.push(img)
  }
  return out
}

function zonePath(z: ZoneRow): string {
  const country = z.countrySlug ?? 'albania'
  return z.type === 'city'
    ? `/${country}/${z.slug}/info`
    : `/${country}/${z.citySlug}/districts/${z.slug}`
}

function fill(template: Template, vars: Record<string, Partial<Localized>>, locales: AnyLocale[]): Localized {
  const out = {} as Localized
  for (const l of locales) {
    let s: string = template[l]
    for (const [key, value] of Object.entries(vars)) s = s.replace(`{${key}}`, value[l] ?? value.en ?? '')
    out[l] = s
  }
  return out
}

function toBlocks(paragraphs: Localized[], keyPrefix: string, locales: AnyLocale[]) {
  const out: Record<string, unknown[]> = {}
  for (const l of locales) {
    out[l] = paragraphs.map((p, i) => ({
      _key: `${keyPrefix}-${l}-${i}`,
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [{_key: `${keyPrefix}-${l}-${i}-s`, _type: 'span', marks: [], text: p[l] ?? ''}],
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
  // Canonical listing paths: sale is the only public deal type, so the site
  // omits it and 308s the /sale variants — linking those wastes a redirect hop.
  return z.type === 'city'
    ? `/${country}/${z.slug}`
    : `/${country}/${z.citySlug}/${z.slug}`
}

function buildLanding(c: Comparison, zones: Map<string, ZoneRow>, year: string): Record<string, unknown> {
  const left = zones.get(c.left.slug)
  const right = zones.get(c.right.slug)
  const names = {a: c.left.title, b: c.right.title}
  const L = localesOf(c)
  const title = comparisonTitle(c, year)
  const VS: Template = {en: '{a} vs {b}', uk: '{a} проти {b}', ru: '{a} против {b}', sq: '{a} kundrejt {b}', it: '{a} contro {b}', pl: '{a} czy {b}'}
  const leftImages = imagesOf(left)
  const rightImages = imagesOf(right)

  /**
   * Slides alternate between the two zones so the page shows both sides rather
   * than leading with four photos of one. Each links back to its zone page,
   * which makes the gallery internal linking as well as imagery.
   */
  const slides: Record<string, unknown>[] = []
  const usedRefs = new Set<string>()
  for (let i = 0; i < Math.max(leftImages.length, rightImages.length) && slides.length < 4; i += 1) {
    for (const [zone, images] of [[left, leftImages], [right, rightImages]] as const) {
      const image = images[i]
      if (!zone || !image || slides.length >= 4) continue
      const name = zone === left ? c.left.title : c.right.title
      slides.push({
        _key: `slide-${slides.length}`,
        title: slideTitle(zone, image, name, L),
        image: {_type: 'image', asset: {_type: 'reference', _ref: image.ref}, alt: image.alt ?? ''},
        href: zonePath(zone),
      })
      usedRefs.add(image.ref)
    }
  }
  /**
   * The hero prefers the left zone, but falls back to the right one. Without
   * the fallback a pair where only the right side has a usable photograph —
   * Blloku vs Myslym Shyri, where Blloku is still on a seed placeholder —
   * rendered with no imagery at all while holding an image it could have shown.
   */
  const heroImage = leftImages[0] ?? rightImages[0]
  if (heroImage) usedRefs.add(heroImage.ref)
  const faqImage = [...rightImages, ...leftImages].find((img) => !usedRefs.has(img.ref))

  // Headline figures come from the zones themselves, never from the config.
  const statItems = [left, right]
    .map((z, i) => {
      if (!z || typeof z.price !== 'number') return null
      const side = i === 0 ? c.left : c.right
      return {
        _key: `stat-${i}`,
        value: `€${Math.round(z.price).toLocaleString('en-US')}/m²`,
        label: side.title,
        sublabel: Object.fromEntries(L.map((l) => [l, z.periodLabel ?? year])) as Localized,
        confidence: 'medium',
      }
    })
    .filter(Boolean) as Record<string, unknown>[]

  const sections: Record<string, unknown>[] = [
    {
      _key: 'hero', _type: 'heroSection', enabled: true,
      title,
      subtitle: c.angle,
      shortLine: fill(VS, names, L),
      cta: {href: catalogHref(left), label: fill(T.seeIn, {n: c.left.title}, L)},
      // The zone's own photo, with the alt text it already carries so a
      // stand-in is not silently re-captioned as the place.
      ...(heroImage
        ? {
            backgroundImage: {
              _type: 'image',
              asset: {_type: 'reference', _ref: heroImage.ref},
              alt: heroImage.alt ?? '',
            },
          }
        : {}),
    },
    ...(statItems.length === 2
      ? [{
          _key: 'stats', _type: 'statsBandSection', enabled: true,
          title: fill(T.compareTable, names, L),
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
          title: fill(T.priceTable, names, L),
          zones: [left, right].map((z, i) => ({_key: `z${i}`, _type: 'reference', _ref: z._id})),
          columns: ['priceNew', 'priceResale', 'referencePrice'],
          sortBy: 'price', linkRows: true, showSources: true,
        }]
      : []),
    {
      _key: 'criteria', _type: 'districtsComparisonSection', enabled: true,
      title: pick(T.criteria, L),
      description: pick(T.criteriaSub, L),
      headings: [
        Object.fromEntries(L.map((l) => [l, ''])) as Localized,
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
      title: pick(T.verdict, L),
      content: toBlocks(
        c.scenarios.map((s) =>
          Object.fromEntries(L.map((l) => [l, `${s.audience[l]}: ${s.verdict[l]}`])) as Localized,
        ),
        `verdict-${c.slug}`,
        L,
      ),
    },
    // Both places, pictured, between the verdict and the questions. Each slide
    // links to its own zone page, so this carries the internal linking the SEO
    // map asks comparisons to provide (10-seo §6) as well as the imagery.
    ...(slides.length >= 2
      ? [{
          _key: 'gallery', _type: 'linkedGallerySection', enabled: true,
          title: fill(T.galleryTitle, names, L),
          description: pick(T.gallerySub, L),
          items: slides,
        }]
      : []),
    {
      _key: 'faq', _type: 'faqSection', enabled: true,
      title: pick(T.faqTitle, L),
      // Only a photograph the page has not already shown. Most zones currently
      // hold a single image — their gallery duplicates their hero — so without
      // this check the FAQ would repeat the slide directly above it, which
      // reads as padding rather than illustration.
      ...(faqImage
        ? {
            imageMode: 'withImage',
            image: {
              _type: 'image',
              asset: {_type: 'reference', _ref: faqImage.ref},
              alt: faqImage.alt ?? '',
            },
          }
        : {imageMode: 'withoutImage'}),
      items: [
        {_key: 'q1', _type: 'localizedFaqItem', question: fill(T.q1, names, L), answer: pick(T.aPrices, L)},
        {_key: 'q2', _type: 'localizedFaqItem', question: fill(T.q2, names, L), answer: pick(T.aInvest, L)},
      ],
    },
    ...(c.kbSource
      ? [{
          _key: 'sources', _type: 'sourcesSection', enabled: true,
          title: pick(T.sourcesTitle, L),
          sources: [{
            _key: 'kb', _type: 'sourceItem',
            label: `DomLivo research: ${c.kbSource}`,
            url: 'https://www.domlivo.com/en/guides',
            publisher: 'DomLivo Research Department',
          }],
        }]
      : []),
    // ТЗ-16: sibling comparisons resolve automatically at render time from
    // shared `zone:` topic tags — the config's `related` graph is no longer read.
    {
      _key: 'related', _type: 'relatedPagesAutoSection', enabled: true,
      mode: 'zoneComparisons', title: pick(T.relatedTitle, L), limit: 6,
    },
    {
      _key: 'cta', _type: 'ctaSection', enabled: true,
      eyebrow: fill(VS, names, L),
      title: pick(T.ctaTitle, L),
      description: pick(T.ctaText, L),
      cta: {href: catalogHref(left), label: fill(T.seeIn, {n: c.left.title}, L)},
      ...(c.kind === 'zones'
        ? {secondaryCta: {href: catalogHref(right), label: fill(T.seeIn, {n: c.right.title}, L)}}
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
    // Registry zone slugs (c.left/right.slug), never the landing's cosmetic URL
    // slug — `himara-vs-saranda` features the zone `himare`.
    topicTags: ['theme:market', 'theme:comparison', `zone:${c.left.slug}`, `zone:${c.right.slug}`],
    // Without this the /guides hub and the related-comparison cards render as
    // text tiles, because both read `cardImage` from the landing.
    ...(heroImage
      ? {cardImage: {_type: 'image', asset: {_type: 'reference', _ref: heroImage.ref}, alt: heroImage.alt ?? ''}}
      : {}),
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
      "periodLabel": *[_type == "zoneMetrics" && zone._ref == ^._id] | order(periodDate desc)[0].periodLabel,
      "hero": heroImage{
        "ref": asset._ref, alt,
        "isStandIn": asset->description match "*STAND-IN*"
      },
      "gallery": gallery[]{
        "ref": asset._ref, alt,
        "isStandIn": asset->description match "*STAND-IN*"
      }
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

  // `--print <slug>` dumps one built document. A section-type list says nothing
  // about whether the images actually landed, and that is the thing worth
  // checking before writing.
  const printArg = args.find((a) => a.startsWith('--print='))?.split('=')[1] ??
    (args.includes('--print') ? args[args.indexOf('--print') + 1] : '')
  if (printArg) {
    const doc = docs.find((d) => d._id === `landing-comparison-${printArg}`)
    if (!doc) { console.error(`No comparison "${printArg}".`); process.exit(1) }
    console.log(JSON.stringify(doc, null, 2))
    return
  }

  for (const d of docs) {
    const skip = existing.has(d._id as string) && !isForce
    const sections = d.pageSections as any[]
    const images =
      (d.cardImage ? 1 : 0) +
      sections.filter((s) => s.backgroundImage || (s.image && s.imageMode !== 'withoutImage')).length +
      (sections.find((s) => s._type === 'linkedGallerySection')?.items?.length ?? 0)
    console.log(`${skip ? 'skip    ' : isForce && existing.has(d._id as string) ? 'replace ' : 'create  '} ${d._id}  (${images} image slot(s))`)
    if (!skip) console.log(`           ${sections.map((s) => s._type).join(' > ')}`)
  }

  const toWrite = docs.filter((d) => isForce || !existing.has(d._id as string))
  if (isDry) { console.log(`\nDry run. ${toWrite.length} to write, ${docs.length - toWrite.length} skipped.`); return }
  if (toWrite.length === 0) { console.log('\nNothing to write.'); return }
  if (isForce) {
    console.log('\n⚠ --force replaces existing landings, including Studio edits.')
    // Sweep 2026-09-05 F4: refuse to drop sections the generator does not emit.
    const liveDocs: Array<{_id: string; pageSections?: SectionLike[]}> = await client.fetch(
      `*[_id in $ids]{_id, pageSections[]{_type, _key}}`,
      {ids: toWrite.map((d) => d._id)},
    )
    const drops = toWrite.flatMap((d) =>
      droppedSections(d._id as string, liveDocs.find((l) => l._id === d._id)?.pageSections, d.pageSections as SectionLike[]),
    )
    if (!forceMayProceed(drops, args)) process.exit(1)
  }

  // Single pass (ТЗ-16): the related block no longer references sibling
  // landings, so nothing requires documents to exist before it is written.
  await toWrite
    .reduce((t, d) => (isForce ? t.createOrReplace(d as never) : t.createIfNotExists(d as never)), client.transaction())
    .commit()

  console.log(`\nWrote ${toWrite.length} comparison landings.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
