/**
 * ТЗ-17: generates the type×city guide landings (/guides/{type}-{city}) from
 * scripts/data/typeCityPairs.json. Deterministic ids (landing-type-{t}-{c}),
 * createIfNotExists — a re-run never touches Studio edits (--force replaces).
 *
 * Indexing gate: pairs with >= INDEX_THRESHOLD published sale listings are
 * indexed; the rest ship seo.noIndex until inventory grows. Flag flips on
 * existing docs are an editor action (or --force) — every run prints the
 * per-pair count and verdict as the operator's signal.
 *
 * All copy is authored inline in 6 locales (bot AI endpoint off-limits) with
 * case-aware type-name tables — Slavic templates never govern the city name's
 * case («в городе {c}»), and the {ta} placeholder carries the object case.
 *
 * Run: npm run generate:type-city-landings -- --dry | --execute | --verify [--force] [--print=<slug>]
 * Spec: docs/engineering/SPEC-tz17-type-city-landings-2026-08-26.md
 */

import path from 'node:path'
import fs from 'node:fs'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {parseTypeCityPairs} from './lib/typeCityRegistry'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const args = process.argv.slice(2)
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')
const isVerify = args.includes('--verify')
import {droppedSections, forceMayProceed, type SectionLike} from './lib/forceGuard'
const isForce = args.includes('--force')
if (!isDry && !isExecute && !isVerify) {
  console.error('Use --dry, --execute or --verify.')
  process.exit(1)
}

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const token = process.env.SANITY_API_TOKEN?.trim()
if (!projectId || !token) {
  console.error('SANITY_PROJECT_ID and SANITY_API_TOKEN are required (cms/.env).')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token,
  useCdn: false,
})

const INDEX_THRESHOLD = 3
const YEAR = String(new Date().getFullYear())
const TODAY = new Date().toISOString().slice(0, 10)

const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl'] as const
type Locale = (typeof LOCALES)[number]
type L = Record<Locale, string>

const KB_FILE: Record<string, string> = {
  tirana: '02-cities/tirana.md',
  durres: '02-cities/durres.md',
  vlore: '02-cities/vlora-riviera.md',
  sarande: '02-cities/saranda-ksamil.md',
}

// ---- Type-name tables (case-aware) ----------------------------------------
// {t}  nominative, capitalised     {tp}  plural nominative, capitalised
// {tl} nominative, lowercase       {tpl} plural, lowercase
// {ta} object case with article where the language has one (buy/cost objects)

type TypeSlug = 'apartment' | 'villa' | 'house'

const TYPE_NAMES: Record<TypeSlug, L> = {
  apartment: {en: 'Apartment', uk: 'Квартира', ru: 'Квартира', sq: 'Apartament', it: 'Appartamento', pl: 'Mieszkanie'},
  villa: {en: 'Villa', uk: 'Вілла', ru: 'Вилла', sq: 'Vilë', it: 'Villa', pl: 'Willa'},
  house: {en: 'House', uk: 'Будинок', ru: 'Дом', sq: 'Shtëpi', it: 'Casa', pl: 'Dom'},
}

const TYPE_NAMES_PLURAL: Record<TypeSlug, L> = {
  apartment: {en: 'Apartments', uk: 'Квартири', ru: 'Квартиры', sq: 'Apartamente', it: 'Appartamenti', pl: 'Mieszkania'},
  villa: {en: 'Villas', uk: 'Вілли', ru: 'Виллы', sq: 'Vila', it: 'Ville', pl: 'Wille'},
  house: {en: 'Houses', uk: 'Будинки', ru: 'Дома', sq: 'Shtëpi', it: 'Case', pl: 'Domy'},
}

const TYPE_ARTICLE: Record<TypeSlug, L> = {
  apartment: {en: 'an apartment', uk: 'квартиру', ru: 'квартиру', sq: 'një apartament', it: 'un appartamento', pl: 'mieszkanie'},
  villa: {en: 'a villa', uk: 'віллу', ru: 'виллу', sq: 'një vilë', it: 'una villa', pl: 'willę'},
  house: {en: 'a house', uk: 'будинок', ru: 'дом', sq: 'një shtëpi', it: 'una casa', pl: 'dom'},
}

function lowerL(src: L): L {
  const out = {} as L
  for (const l of LOCALES) out[l] = src[l].charAt(0).toLowerCase() + src[l].slice(1)
  return out
}

type Vars = {t: L; tp: L; tl: L; tpl: L; ta: L; c: Record<string, string>}

function fill(tpl: L, v: Vars): L {
  const out = {} as L
  for (const l of LOCALES) {
    out[l] = tpl[l]
      .replaceAll('{tpl}', v.tpl[l])
      .replaceAll('{tp}', v.tp[l])
      .replaceAll('{tl}', v.tl[l])
      .replaceAll('{ta}', v.ta[l])
      .replaceAll('{t}', v.t[l])
      .replaceAll('{c}', v.c[l] ?? v.c.en ?? '')
      .replaceAll('{y}', YEAR)
  }
  return out
}

// ---- Copy tables ----------------------------------------------------------

const T = {
  heroTitle: {
    en: '{t} in {c}: prices and listings {y}',
    uk: '{t} у місті {c}: ціни та пропозиції {y}',
    ru: '{t} в городе {c}: цены и предложения {y}',
    sq: '{t} në {c}: çmime dhe shpallje {y}',
    it: '{t} a {c}: prezzi e annunci {y}',
    pl: '{t} w mieście {c}: ceny i oferty {y}',
  },
  heroSubtitle: {
    en: 'Real listings, market figures and buying guidance for {c} — updated continuously.',
    uk: 'Реальні оголошення, ринкові показники та поради з купівлі для міста {c} — оновлюється постійно.',
    ru: 'Реальные объявления, рыночные показатели и советы по покупке для города {c} — обновляется постоянно.',
    sq: 'Shpallje reale, shifra tregu dhe udhëzime blerjeje për {c} — përditësohet vazhdimisht.',
    it: "Annunci reali, dati di mercato e consigli per l'acquisto a {c} — aggiornato costantemente.",
    pl: 'Prawdziwe oferty, dane rynkowe i wskazówki zakupu dla miasta {c} — aktualizowane na bieżąco.',
  },
  statsTitle: {
    en: '{c} market in figures',
    uk: 'Ринок міста {c} у цифрах',
    ru: 'Рынок города {c} в цифрах',
    sq: 'Tregu në {c} në shifra',
    it: 'Il mercato di {c} in cifre',
    pl: 'Rynek miasta {c} w liczbach',
  },
  listingsTitle: {
    en: '{tp} for sale in {c}',
    uk: '{tp} на продаж у місті {c}',
    ru: '{tp} на продажу в городе {c}',
    sq: '{tp} në shitje në {c}',
    it: '{tp} in vendita a {c}',
    pl: '{tp} na sprzedaż w mieście {c}',
  },
  seoTitle: {
    en: 'Buying {ta} in {c}',
    uk: 'Купівля житла: {t} у місті {c}',
    ru: 'Покупка жилья: {t} в городе {c}',
    sq: 'Blerja e një prone: {t} në {c}',
    it: 'Comprare casa: {t} a {c}',
    pl: 'Zakup nieruchomości: {t} w mieście {c}',
  },
  h3a: {
    en: 'Why {ta} in {c}',
    uk: 'Чому саме {t} у місті {c}',
    ru: 'Почему именно {t} в городе {c}',
    sq: 'Pse {ta} në {c}',
    it: 'Perché comprare un immobile a {c}',
    pl: 'Dlaczego {tl} w mieście {c}',
  },
  h3b: {
    en: 'Who it suits',
    uk: 'Кому це підходить',
    ru: 'Кому это подходит',
    sq: 'Kujt i përshtatet',
    it: 'A chi conviene',
    pl: 'Dla kogo to wybór',
  },
  h3c: {
    en: 'What to check before buying',
    uk: 'Що перевірити перед купівлею',
    ru: 'Что проверить перед покупкой',
    sq: 'Çfarë të verifikoni para blerjes',
    it: "Cosa verificare prima dell'acquisto",
    pl: 'Co sprawdzić przed zakupem',
  },
  todoPara: {
    en: 'TODO-CONTENT: editorial prose for this section — see the {c} file in the research KB.',
    uk: 'TODO-CONTENT: редакційний текст для цього розділу — див. файл міста {c} у дослідницькій базі.',
    ru: 'TODO-CONTENT: редакционный текст для этого раздела — см. файл города {c} в исследовательской базе.',
    sq: 'TODO-CONTENT: tekst editorial për këtë seksion — shih skedarin e {c} në bazën kërkimore.',
    it: 'TODO-CONTENT: testo editoriale per questa sezione — vedi il file di {c} nella base di ricerca.',
    pl: 'TODO-CONTENT: tekst redakcyjny dla tej sekcji — zob. plik miasta {c} w bazie badawczej.',
  },
  faqTitle: {
    en: 'Frequently asked questions',
    uk: 'Поширені запитання',
    ru: 'Частые вопросы',
    sq: 'Pyetje të shpeshta',
    it: 'Domande frequenti',
    pl: 'Częste pytania',
  },
  q1: {
    en: 'How much does {ta} cost in {c}?',
    uk: 'Скільки коштує {tl} у місті {c}?',
    ru: 'Сколько стоит {tl} в городе {c}?',
    sq: 'Sa kushton {ta} në {c}?',
    it: 'Quanto costa {ta} a {c}?',
    pl: 'Ile kosztuje {tl} w mieście {c}?',
  },
  a1: {
    en: 'Live market figures for {c} are shown right above — the stats band pulls the newest zone record with its sources. For more detailed bands, open the {c} city guide.',
    uk: 'Актуальні ринкові показники для міста {c} — просто вище: блок статистики бере найновіший запис по зоні з джерелами. Детальніші діапазони — у гайді міста {c}.',
    ru: 'Актуальные рыночные показатели для города {c} — прямо выше: блок статистики берёт новейшую запись по зоне с источниками. Подробные диапазоны — в гайде города {c}.',
    sq: 'Shifrat aktuale të tregut për {c} janë pikërisht më lart — blloku i statistikave merr rekordin më të ri të zonës me burimet e veta. Për breza më të detajuar, hapni udhëzuesin e qytetit.',
    it: 'I dati di mercato aggiornati per {c} sono qui sopra — il blocco statistiche usa il record di zona più recente con le fonti. Per fasce più dettagliate, apri la guida della città.',
    pl: 'Aktualne dane rynkowe dla miasta {c} są tuż powyżej — blok statystyk pobiera najnowszy rekord strefy wraz ze źródłami. Szczegółowe przedziały znajdziesz w przewodniku miasta.',
  },
  q2: {
    en: 'Can foreigners buy {ta} in {c}?',
    uk: 'Чи можуть іноземці купити {ta} у місті {c}?',
    ru: 'Могут ли иностранцы купить {ta} в городе {c}?',
    sq: 'A mund të blejnë të huajt {ta} në {c}?',
    it: 'Gli stranieri possono comprare {ta} a {c}?',
    pl: 'Czy cudzoziemcy mogą kupić {ta} w mieście {c}?',
  },
  a2: {
    en: 'Yes — foreign citizens can buy apartments, houses and commercial property with almost the same rights as locals; only agricultural land requires a local company. The legal guides cover the paperwork step by step.',
    uk: 'Так — іноземні громадяни можуть купувати квартири, будинки та комерційну нерухомість майже з тими самими правами, що й місцеві; лише для сільськогосподарської землі потрібна місцева компанія. Юридичні гайди описують оформлення крок за кроком.',
    ru: 'Да — иностранные граждане могут покупать квартиры, дома и коммерческую недвижимость почти с теми же правами, что и местные; только для сельскохозяйственной земли нужна местная компания. Юридические гайды описывают оформление шаг за шагом.',
    sq: 'Po — shtetasit e huaj mund të blejnë apartamente, shtëpi dhe prona komerciale me pothuajse të njëjtat të drejta si vendasit; vetëm toka bujqësore kërkon një kompani vendase. Udhëzuesit ligjorë e shpjegojnë procesin hap pas hapi.',
    it: 'Sì — i cittadini stranieri possono acquistare appartamenti, case e immobili commerciali quasi con gli stessi diritti dei locali; solo i terreni agricoli richiedono una società locale. Le guide legali spiegano la procedura passo dopo passo.',
    pl: 'Tak — cudzoziemcy mogą kupować mieszkania, domy i nieruchomości komercyjne z niemal takimi samymi prawami jak miejscowi; tylko grunty rolne wymagają lokalnej spółki. Przewodniki prawne opisują formalności krok po kroku.',
  },
  q3: {
    en: 'Is {c} a good place to buy {ta}?',
    uk: 'Чи варто купувати {ta} у місті {c}?',
    ru: 'Стоит ли покупать {ta} в городе {c}?',
    sq: 'A ia vlen të blini {ta} në {c}?',
    it: 'Conviene comprare {ta} a {c}?',
    pl: 'Czy warto kupić {ta} w mieście {c}?',
  },
  a3: {
    en: 'It depends on your goal — see the side-by-side comparisons of {c} and its neighbouring markets in the related guides below; each cites its data sources and update date.',
    uk: "Залежить від вашої мети — перегляньте порівняння міста {c} із сусідніми ринками в пов'язаних гайдах нижче; кожне наводить джерела даних і дату оновлення.",
    ru: 'Зависит от вашей цели — посмотрите сравнения города {c} с соседними рынками в связанных гайдах ниже; каждое приводит источники данных и дату обновления.',
    sq: 'Varet nga qëllimi juaj — shihni krahasimet e {c} me tregjet fqinje në udhëzuesit e lidhur më poshtë; secili citon burimet e të dhënave dhe datën e përditësimit.',
    it: 'Dipende dal tuo obiettivo — vedi i confronti tra {c} e i mercati vicini nelle guide correlate qui sotto; ognuno cita fonti e data di aggiornamento.',
    pl: 'To zależy od celu — zobacz porównania miasta {c} z sąsiednimi rynkami w powiązanych przewodnikach poniżej; każde podaje źródła danych i datę aktualizacji.',
  },
  sourcesTitle: {
    en: 'Sources & methodology',
    uk: 'Джерела та методологія',
    ru: 'Источники и методология',
    sq: 'Burimet dhe metodologjia',
    it: 'Fonti e metodologia',
    pl: 'Źródła i metodologia',
  },
  ctaTitle: {
    en: 'Ready to look at real listings?',
    uk: 'Готові подивитися реальні пропозиції?',
    ru: 'Готовы посмотреть реальные предложения?',
    sq: 'Gati të shihni shpallje reale?',
    it: 'Pronto a vedere annunci reali?',
    pl: 'Gotowi zobaczyć prawdziwe oferty?',
  },
  ctaText: {
    en: 'Browse all {tpl} for sale in {c}, or tell us what you need.',
    uk: 'Перегляньте всі {tpl} на продаж у місті {c} або розкажіть нам, що ви шукаєте.',
    ru: 'Просмотрите все {tpl} на продажу в городе {c} или расскажите нам, что вы ищете.',
    sq: 'Shfletoni të gjitha {tpl} në shitje në {c} ose na tregoni çfarë kërkoni.',
    it: 'Sfoglia tutti gli annunci: {tpl} in vendita a {c}, o dicci cosa cerchi.',
    pl: 'Przejrzyj wszystkie {tpl} na sprzedaż w mieście {c} albo powiedz nam, czego szukasz.',
  },
  ctaBtn: {
    en: 'Open the catalog',
    uk: 'Відкрити каталог',
    ru: 'Открыть каталог',
    sq: 'Hap katalogun',
    it: 'Apri il catalogo',
    pl: 'Otwórz katalog',
  },
  contact: {
    en: 'Contact us',
    uk: "Зв'язатися з нами",
    ru: 'Связаться с нами',
    sq: 'Na kontaktoni',
    it: 'Contattaci',
    pl: 'Skontaktuj się z nami',
  },
  metaTitle: {
    en: '{t} in {c}: buy, prices and listings | DomLivo',
    uk: '{t} у місті {c}: купівля, ціни та пропозиції | DomLivo',
    ru: '{t} в городе {c}: покупка, цены и предложения | DomLivo',
    sq: '{t} në {c}: blerje, çmime dhe shpallje | DomLivo',
    it: '{t} a {c}: acquisto, prezzi e annunci | DomLivo',
    pl: '{t} w mieście {c}: zakup, ceny i oferty | DomLivo',
  },
  metaDescription: {
    en: '{t} in {c}: current listings, market figures with sources, and practical guidance from the DomLivo research base.',
    uk: '{t} у місті {c}: актуальні пропозиції, ринкові показники з джерелами та практичні поради з дослідницької бази DomLivo.',
    ru: '{t} в городе {c}: актуальные предложения, рыночные показатели с источниками и практические советы из исследовательской базы DomLivo.',
    sq: '{t} në {c}: shpallje aktuale, shifra tregu me burime dhe udhëzime praktike nga baza kërkimore e DomLivo.',
    it: '{t} a {c}: annunci attuali, dati di mercato con fonti e consigli pratici dalla base di ricerca DomLivo.',
    pl: '{t} w mieście {c}: aktualne oferty, dane rynkowe ze źródłami i praktyczne wskazówki z bazy badawczej DomLivo.',
  },
} satisfies Record<string, L>

// ---- Portable text --------------------------------------------------------

type Block = {
  _key: string
  _type: 'block'
  style: string
  markDefs: never[]
  children: Array<{_key: string; _type: 'span'; marks: never[]; text: string}>
}

function block(key: string, style: string, text: string): Block {
  return {
    _key: key,
    _type: 'block',
    style,
    markDefs: [],
    children: [{_key: `${key}s`, _type: 'span', marks: [], text}],
  }
}

/** Three h3 headings, each followed by a TODO-CONTENT paragraph, per locale. */
function buildTodoContent(v: Vars): Record<Locale, Block[]> {
  const h3a = fill(T.h3a, v)
  const h3b = fill(T.h3b, v)
  const h3c = fill(T.h3c, v)
  const todo = fill(T.todoPara, v)
  const out = {} as Record<Locale, Block[]>
  for (const l of LOCALES) {
    out[l] = [
      block(`tc-${l}-h1`, 'h3', h3a[l]),
      block(`tc-${l}-p1`, 'normal', todo[l]),
      block(`tc-${l}-h2`, 'h3', h3b[l]),
      block(`tc-${l}-p2`, 'normal', todo[l]),
      block(`tc-${l}-h3`, 'h3', h3c[l]),
      block(`tc-${l}-p3`, 'normal', todo[l]),
    ]
  }
  return out
}

// ---- diff (verify) --------------------------------------------------------

const IGNORED_KEYS = new Set(['_rev', '_createdAt', '_updatedAt', '_system', 'contentUpdatedAt'])

// Recursive and key-order-insensitive (the comparison generator's version,
// verbatim): Sanity returns object keys alphabetically sorted, so a shallow
// JSON.stringify compare reports every perfectly-reproduced doc as "edited".
function diffDoc(built: unknown, live: unknown, p = ''): string[] {
  if (built === live) return []
  const both =
    built && live && typeof built === 'object' && typeof live === 'object' &&
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

// ---- build ----------------------------------------------------------------

type TypeRow = {_id: string; slug: TypeSlug; active?: boolean}
type CityRow = {
  _id: string
  slug: string
  title?: Record<string, string>
  isPublished?: boolean
  countrySlug?: string
  hasMetrics?: boolean
}

function buildLanding(
  type: TypeRow,
  city: CityRow,
  count: number,
): Record<string, unknown> {
  const v: Vars = {
    t: TYPE_NAMES[type.slug],
    tp: TYPE_NAMES_PLURAL[type.slug],
    tl: lowerL(TYPE_NAMES[type.slug]),
    tpl: lowerL(TYPE_NAMES_PLURAL[type.slug]),
    ta: TYPE_ARTICLE[type.slug],
    c: city.title ?? {},
  }
  const catalogHref = `/${city.countrySlug}/${city.slug}/sale/${type.slug}`
  const metaTitle = fill(T.metaTitle, v)
  const metaDescription = fill(T.metaDescription, v)

  return {
    _id: `landing-type-${type.slug}-${city.slug}`,
    _type: 'landingPage',
    enabled: true,
    pageType: 'custom',
    slug: {_type: 'slug', current: `${type.slug}-${city.slug}`},
    title: fill(T.heroTitle, v),
    cardDescription: fill(T.heroSubtitle, v),
    topicTags: [`city:${city.slug}`, `zone:${city.slug}`, 'theme:buying'],
    contentUpdatedAt: TODAY,
    seo: {
      metaTitle,
      metaDescription,
      ogTitle: metaTitle,
      ogDescription: metaDescription,
      noIndex: count < INDEX_THRESHOLD,
    },
    pageSections: [
      {
        _key: 'hero', _type: 'heroSection', enabled: true,
        title: fill(T.heroTitle, v),
        subtitle: fill(T.heroSubtitle, v),
        cta: {href: catalogHref, label: T.ctaBtn},
      },
      {
        _key: 'stats', _type: 'zoneStatsAutoSection', enabled: true,
        zoneMode: 'manual',
        zone: {_type: 'reference', _ref: city._id},
        showSources: true,
        title: fill(T.statsTitle, v),
      },
      {
        _key: 'listings', _type: 'propertyCarouselSection', enabled: true,
        mode: 'auto',
        title: fill(T.listingsTitle, v),
        filters: {
          city: {_type: 'reference', _ref: city._id},
          propertyType: {_type: 'reference', _ref: type._id},
          deal: 'sale',
        },
        autoMode: {limit: 12, sort: 'newest'},
      },
      {
        _key: 'seo-text', _type: 'seoTextSection', enabled: true,
        title: fill(T.seoTitle, v),
        content: buildTodoContent(v),
      },
      {
        _key: 'faq', _type: 'faqSection', enabled: true,
        title: T.faqTitle,
        imageMode: 'withoutImage',
        items: [
          {_key: 'q1', _type: 'localizedFaqItem', question: fill(T.q1, v), answer: fill(T.a1, v)},
          {_key: 'q2', _type: 'localizedFaqItem', question: fill(T.q2, v), answer: fill(T.a2, v)},
          {_key: 'q3', _type: 'localizedFaqItem', question: fill(T.q3, v), answer: fill(T.a3, v)},
        ],
      },
      {
        _key: 'related', _type: 'relatedPagesAutoSection', enabled: true,
        mode: 'topicGuides', limit: 6,
      },
      {
        _key: 'sources', _type: 'sourcesSection', enabled: true,
        title: T.sourcesTitle,
        // No url — the schema's own guidance: an internal KB reference gets no
        // link rather than a guessed one.
        sources: [{
          _key: 'kb', _type: 'sourceItem',
          label: `DomLivo research: ${KB_FILE[city.slug] ?? city.slug}`,
          publisher: 'DomLivo Research Department',
        }],
      },
      {
        _key: 'cta', _type: 'ctaSection', enabled: true,
        title: fill(T.ctaTitle, v),
        description: fill(T.ctaText, v),
        cta: {href: catalogHref, label: T.ctaBtn},
        secondaryCta: {href: '/contacts', label: T.contact},
      },
    ],
  }
}

// ---- main -----------------------------------------------------------------

async function main(): Promise<void> {
  const pairs = parseTypeCityPairs(
    JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'scripts/data/typeCityPairs.json'), 'utf8')),
  )
  const typeSlugs = [...new Set(pairs.map((p) => p.type))]
  const citySlugs = [...new Set(pairs.map((p) => p.city))]

  const types: TypeRow[] = await client.fetch(
    `*[_type == "propertyType" && !(_id in path("drafts.**")) && slug.current in $types]{
      _id, "slug": slug.current, active
    }`,
    {types: typeSlugs},
  )
  const cities: CityRow[] = await client.fetch(
    `*[_type == "city" && !(_id in path("drafts.**")) && slug.current in $cities]{
      _id, "slug": slug.current, title, isPublished,
      "countrySlug": country->slug.current,
      "hasMetrics": count(*[_type == "zoneMetrics" && zone._ref == ^._id]) > 0
    }`,
    {cities: citySlugs},
  )

  const typeBySlug = new Map(types.map((t) => [t.slug, t]))
  const cityBySlug = new Map(cities.map((c) => [c.slug, c]))
  const problems: string[] = []
  for (const s of typeSlugs) {
    const t = typeBySlug.get(s as TypeSlug)
    if (!t) problems.push(`propertyType "${s}" not found`)
    else if (t.active === false) problems.push(`propertyType "${s}" is inactive`)
    if (t && !(s in TYPE_NAMES)) problems.push(`propertyType "${s}" has no copy tables in this generator`)
  }
  for (const s of citySlugs) {
    const c = cityBySlug.get(s)
    if (!c) problems.push(`city "${s}" not found`)
    else {
      if (c.isPublished === false) problems.push(`city "${s}" is unpublished`)
      if (!c.countrySlug) problems.push(`city "${s}" has no country slug`)
      if (!c.hasMetrics) problems.push(`city "${s}" has no zoneMetrics record`)
    }
  }
  if (problems.length) {
    for (const p of problems) console.error(`✗ ${p}`)
    process.exit(1)
  }

  // Inventory gate — same predicates the carousel applies, plus the drafts
  // exclusion the token client needs (the public CDN client gets it for free).
  const counts = new Map<string, number>()
  for (const p of pairs) {
    const n: number = await client.fetch(
      `count(*[_type == "property" && !(_id in path("drafts.**")) && isPublished == true &&
        (lifecycleStatus == "active" || !defined(lifecycleStatus)) &&
        status == "sale" && type->slug.current == $t && city->slug.current == $c])`,
      {t: p.type, c: p.city},
    )
    counts.set(`${p.type}|${p.city}`, n)
  }

  const docs = pairs.map((p) =>
    buildLanding(typeBySlug.get(p.type as TypeSlug)!, cityBySlug.get(p.city)!, counts.get(`${p.type}|${p.city}`) ?? 0),
  )

  console.log('pair                       listings  verdict')
  for (const p of pairs) {
    const n = counts.get(`${p.type}|${p.city}`) ?? 0
    console.log(
      `${`${p.type}-${p.city}`.padEnd(26)} ${String(n).padStart(3)}      ${n >= INDEX_THRESHOLD ? 'indexed' : 'noIndex'}`,
    )
  }
  console.log('')

  const existing = new Set<string>(
    await client.fetch(`*[_type == "landingPage" && _id in $ids]._id`, {ids: docs.map((d) => d._id)}),
  )

  if (isVerify) {
    const live: Array<Record<string, unknown>> = await client.fetch(`*[_id in $ids]`, {
      ids: docs.map((d) => d._id as string),
    })
    const byId = new Map(live.map((d) => [d._id as string, d]))
    let same = 0
    const edited: string[] = []
    const absent: string[] = []
    for (const built of docs) {
      const cur = byId.get(built._id as string)
      if (!cur) {
        absent.push(built._id as string)
        continue
      }
      const diffs = diffDoc(built, cur)
      if (diffs.length === 0) {
        same += 1
        continue
      }
      edited.push(built._id as string)
      console.log(`edited   ${built._id} (${diffs.length} field(s) — a re-run leaves these alone)`)
      for (const d of diffs.slice(0, 4)) console.log(`           ${d}`)
    }
    console.log(
      `\nVerify: ${same}/${docs.length} reproduce exactly` +
        (edited.length ? `, ${edited.length} edited` : '') +
        (absent.length ? `, ${absent.length} missing` : ''),
    )
    for (const id of absent) console.log(`  missing: ${id}`)
    if (absent.length) process.exitCode = 1
    return
  }

  const printArg =
    args.find((a) => a.startsWith('--print='))?.split('=')[1] ??
    (args.includes('--print') ? args[args.indexOf('--print') + 1] : '')
  if (printArg) {
    const doc = docs.find((d) => d._id === `landing-type-${printArg}`)
    if (!doc) {
      console.error(`No pair "${printArg}" (expected e.g. apartment-durres).`)
      process.exit(1)
    }
    console.log(JSON.stringify(doc, null, 2))
    return
  }

  for (const d of docs) {
    const skip = existing.has(d._id as string) && !isForce
    console.log(
      `${skip ? 'skip    ' : isForce && existing.has(d._id as string) ? 'replace ' : 'create  '} ${d._id}`,
    )
  }

  const toWrite = docs.filter((d) => isForce || !existing.has(d._id as string))
  if (isDry) {
    console.log(`\nDry run. ${toWrite.length} to write, ${docs.length - toWrite.length} skipped.`)
    return
  }
  if (toWrite.length === 0) {
    console.log('\nNothing to write.')
    return
  }
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

  await toWrite
    .reduce(
      (t, d) => (isForce ? t.createOrReplace(d as never) : t.createIfNotExists(d as never)),
      client.transaction(),
    )
    .commit()
  console.log(`\nWrote ${toWrite.length} type-city landing(s).`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
