/**
 * Search and social copy for a zone, composed from its own `zoneMetrics`.
 *
 * Shared by `generateZoneSeoCopy.ts` (fixes existing documents) and
 * `generateDistrictLandings.ts` (so a newly generated landing is born with
 * proper SEO instead of inheriting whatever seed text the district carries).
 * Keeping one implementation is what lets the landing generator's `--verify`
 * stay meaningful.
 *
 * A meta description is a summary, not prose: a consistent shape carrying real,
 * per-zone numbers is the right output. Where a zone has no metrics we fall
 * back to the first sentence of its editorial description.
 */

// `pl` was missing here while production carried Polish descriptions from a
// separate backfill, so every regeneration left them behind at whatever the
// backfill produced. It is a first-class locale on this site.
export const SEO_LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl'] as const
export type SeoLocale = (typeof SEO_LOCALES)[number]
export type SeoLocalized = Partial<Record<SeoLocale, string>>

/** A description longer than this was written by a person; do not overwrite it. */
export const HAND_WRITTEN_MIN = 80

/**
 * Below this a description is thin enough to be worth padding with the zone's
 * own first sentence; above the max it gets cut off in a result page anyway.
 * Both are the conventions crawlers report against, not hard rules.
 */
export const META_DESCRIPTION_MIN = 120
export const META_DESCRIPTION_MAX = 158

export type ZoneMetricsForSeo = {
  priceNewMin?: number
  priceNewMax?: number
  priceNewMedian?: number
  priceResaleMin?: number
  priceResaleMax?: number
  priceResaleMedian?: number
  priceAllMin?: number
  priceAllMax?: number
  priceAllMedian?: number
  rentLtr1brMin?: number
  rentLtr1brMax?: number
  referencePrice?: number
  referencePriceMin?: number
  referencePriceMax?: number
  periodLabel?: string
}

export type ZoneSeoInput = {
  kind: 'district' | 'city'
  slug: string
  /** Zone name per locale. */
  title?: SeoLocalized
  /** Parent city name per locale; omit for a city. */
  cityTitle?: SeoLocalized
  /** Editorial description, used when the zone has no metrics. */
  description?: SeoLocalized
  metrics?: ZoneMetricsForSeo | null
}

const T = {
  districtTitle: {
    en: '{n}, {c}: property prices {y}',
    uk: '{n}, {c}: ціни на нерухомість {y}',
    ru: '{n}, {c}: цены на недвижимость {y}',
    sq: '{n}, {c}: çmimet e pronave {y}',
    it: '{n}, {c}: prezzi immobili {y}',
    pl: '{n}, {c}: ceny nieruchomości {y}',
  },
  cityTitle: {
    en: 'Property in {n}: prices {y}',
    uk: 'Нерухомість у {n}: ціни {y}',
    ru: 'Недвижимость в {n}: цены {y}',
    sq: 'Prona në {n}: çmimet {y}',
    it: 'Immobili a {n}: prezzi {y}',
    pl: 'Nieruchomości w {n}: ceny {y}',
  },
  newBuild: {
    en: 'New builds {v}/m²', uk: 'Новобудови {v}/м²', ru: 'Новостройки {v}/м²',
    sq: 'Ndërtime të reja {v}/m²', it: 'Nuovo {v}/m²',
    pl: 'Nowe budownictwo {v}/m²',
  },
  resale: {
    en: 'resale {v}/m²', uk: 'вторинка {v}/м²', ru: 'вторичка {v}/м²',
    sq: 'të përdorura {v}/m²', it: 'usato {v}/m²',
    pl: 'rynek wtórny {v}/m²',
  },
  all: {
    en: 'asking {v}/m²', uk: 'ціна пропозиції {v}/м²', ru: 'цена предложения {v}/м²',
    sq: 'çmimi i kërkuar {v}/m²', it: 'prezzo richiesto {v}/m²',
    pl: 'cena ofertowa {v}/m²',
  },
  rent: {
    en: 'a 1+1 rents for {v}/month', uk: 'оренда 1+1 — {v}/міс', ru: 'аренда 1+1 — {v}/мес',
    sq: 'qiraja 1+1 {v}/muaj', it: 'affitto 1+1 {v}/mese',
    pl: 'wynajem 1+1 — {v}/mies.',
  },
  reference: {
    en: 'state reference {v} lek/m²', uk: 'державний референс {v} лек/м²',
    ru: 'государственный референс {v} лек/м²', sq: 'çmimi i referencës {v} lekë/m²',
    it: 'riferimento statale {v} lek/m²',
    pl: 'referencja państwowa {v} lek/m²',
  },
  tail: {
    en: 'Sourced asking prices, {p}.',
    uk: 'Ціни пропозиції з джерелами, {p}.',
    ru: 'Цены предложения с источниками, {p}.',
    sq: 'Çmime të kërkuara me burime, {p}.',
    it: 'Prezzi richiesti con fonti, {p}.',
    pl: 'Ceny ofertowe ze źródłami, {p}.',
  },
} as const

/**
 * The year the figures are from, not the year it happens to be.
 *
 * Using the wall clock would rewrite every title on 1 January — churning the
 * dataset and making the landing generator's `--verify` report all 34 pages as
 * edited — while claiming a freshness the data does not have.
 */
export function seoYearFor(metrics: ZoneMetricsForSeo | null | undefined, fallbackYear: string): string {
  const period = metrics?.periodLabel?.trim()
  const match = period?.match(/(19|20)\d{2}/)
  return match ? match[0] : fallbackYear
}

const nf = (locale: SeoLocale) => new Intl.NumberFormat(locale === 'sq' ? 'sq' : locale)

/** "3,000–5,500" or "1,457"; null when the metric is absent. */
export function formatBand(
  locale: SeoLocale,
  min?: number,
  max?: number,
  median?: number,
): string | null {
  const f = nf(locale)
  if (typeof median === 'number') return f.format(median)
  if (typeof min === 'number' && typeof max === 'number') {
    return min === max ? f.format(min) : `${f.format(min)}–${f.format(max)}`
  }
  if (typeof min === 'number') return f.format(min)
  if (typeof max === 'number') return f.format(max)
  return null
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w)\}/g, (_, k) => vars[k] ?? '')
}

export function buildZoneMetaDescription(
  zone: ZoneSeoInput,
  locale: SeoLocale,
  year: string,
): string | null {
  const m = zone.metrics
  const parts: string[] = []

  if (m) {
    const newB = formatBand(locale, m.priceNewMin, m.priceNewMax, m.priceNewMedian)
    const resale = formatBand(locale, m.priceResaleMin, m.priceResaleMax, m.priceResaleMedian)
    const all = formatBand(locale, m.priceAllMin, m.priceAllMax, m.priceAllMedian)
    const rent = formatBand(locale, m.rentLtr1brMin, m.rentLtr1brMax)

    if (newB) parts.push(fill(T.newBuild[locale], {v: `€${newB}`}))
    if (resale) parts.push(fill(T.resale[locale], {v: `€${resale}`}))
    if (!newB && !resale && all) parts.push(fill(T.all[locale], {v: `€${all}`}))
    if (rent) parts.push(fill(T.rent[locale], {v: `€${rent}`}))
    if (!newB && !resale && !all) {
      // Some zones carry the state reference as a band rather than a point —
      // Laprakë has only `referencePriceMin`/`Max`, and reading the singular
      // field alone left it with no figure at all, so its description fell back
      // to a bare sentence with no price in it.
      const reference = formatBand(locale, m.referencePriceMin, m.referencePriceMax, m.referencePrice)
      if (reference) parts.push(fill(T.reference[locale], {v: reference}))
    }
  }

  // Strict on locale for the padding sentence: falling back to English put
  // "Tirana: cena ofertowa €1863/m². Recorded sales split Tirana more usefully
  // than any average…" on the Polish page. A short description in the right
  // language beats a long one in two languages.
  const localeDesc = zone.description?.[locale]
  const sentences = localeDesc ? localeDesc.split(/(?<=[.!?])\s/).filter((x) => x.trim()) : []

  // The no-metrics branch below is the zone's only description, so there the
  // English original still beats having none at all.
  const anyDesc = localeDesc ?? zone.description?.en

  if (parts.length > 0) {
    // Name the place first. A zone with figures but no editorial note produced
    // "Asking €1,900–2,800/m². Sourced asking prices, 2026-H1." — 55 characters
    // that never say which zone, in which city, and are indistinguishable
    // between the fifty-four zones the crawl of 2026-09-10 found sharing that
    // shape. What someone searched for is the place name.
    const place = placeLabel(zone, locale)
    const body = parts.join(', ')
    const lead = place ? `${place}: ${body}` : body.charAt(0).toLocaleUpperCase(locale) + body.slice(1)
    const tail = fill(T.tail[locale], {p: m?.periodLabel ?? year})

    // Then, if it is still thin, the zone's own first sentence — the part that
    // distinguishes it from the zone next door.
    const base = `${lead}. ${tail}`
    // The editorial sentence often opens by restating the band the lead just
    // gave — "Plazh, Durres: asking €1,200–1,700/m². Plazh is the mass beach
    // segment of Durrës: €1,200–1,700/m²…" — which spends the description's
    // best characters saying the same thing twice. Take the first sentence
    // that adds something instead.
    const firstSentence = pickSentence(sentences, body)
    if (base.length >= META_DESCRIPTION_MIN || !firstSentence) return base

    // Best case, everything fits: figures, the sentence, and the provenance.
    const withBoth = `${lead}. ${firstSentence} ${tail}`
    if (withBoth.length <= META_DESCRIPTION_MAX) return withBoth

    // Otherwise the sentence displaces the tail rather than sharing the room
    // with it. Keeping both under pressure meant cutting the sentence mid-word
    // and then resuming with boilerplate — "…prices inside Shëngjin'… Sourced
    // asking prices, 2026-H1." — which reads worse than the short version it
    // was meant to improve. The tail is a provenance note; the sentence is the
    // only part that says what this zone is.
    const withSentence = `${lead}. ${firstSentence}`
    if (withSentence.length <= META_DESCRIPTION_MAX) return withSentence

    const room = META_DESCRIPTION_MAX - lead.length - 3
    if (room < 60) return base
    const cut = firstSentence.slice(0, room)
    const atWord = cut.slice(0, cut.lastIndexOf(' ')).trimEnd().replace(/[,;:—-]$/, '')
    return atWord.length >= 60 ? `${lead}. ${atWord}…` : base
  }

  const opener = (localeDesc ? sentences : anyDesc ? anyDesc.split(/(?<=[.!?])\s/).filter((x) => x.trim()) : [])[0]
  if (!opener) return null
  return opener.length > 200 ? `${opener.slice(0, 197)}…` : opener
}

/**
 * The first sentence that is not a restatement of the figures already shown.
 * Falls back to the opener when every sentence repeats them, because a
 * duplicated fact still beats no sentence at all.
 */
function pickSentence(sentences: string[], shown: string): string | null {
  if (sentences.length === 0) return null
  // Split bands into their endpoints: "€1,200–1,700" has to become "1,200" and
  // "1,700", or a sentence repeating the whole band matches nothing.
  const numbers = Array.from(
    new Set(
      (shown.match(/\d[\d\s,. ]*/g) ?? [])
        .flatMap((run) => run.split(/[–—-]/))
        // Strip every thousands separator before comparing. Albanian formats
        // 1450 as "1.450" while the generated lead writes "1450", so the two
        // never matched and the restatement slipped through.
        .map((n) => n.replace(/[\s .,]/g, ''))
        .filter((n) => n.length >= 3),
    ),
  )
  // Half the figures, at least one. A fixed threshold of two never fired for a
  // zone quoted as a single median — "Durres: asking €1,450/m². Durres averages
  // about €1,450/m²…" — because there was only one number to match.
  const needed = Math.max(1, Math.ceil(numbers.length / 2))
  const repeats = (sentence: string) => {
    const flat = sentence.replace(/[\s .,]/g, '')
    return numbers.filter((n) => flat.includes(n)).length >= needed
  }
  return sentences.find((x) => !repeats(x)) ?? sentences[0]
}

/** "Blloku, Tirana" for a district, "Tirana" for a city. */
function placeLabel(zone: ZoneSeoInput, locale: SeoLocale): string | null {
  const name = zone.title?.[locale] ?? zone.title?.en ?? zone.slug
  if (!name) return null
  if (zone.kind === 'city') return name
  const city = zone.cityTitle?.[locale] ?? zone.cityTitle?.en
  return city ? `${name}, ${city}` : name
}

export function buildZoneMetaTitle(zone: ZoneSeoInput, locale: SeoLocale, fallbackYear: string): string {
  const year = seoYearFor(zone.metrics, fallbackYear)
  const name = zone.title?.[locale] ?? zone.title?.en ?? zone.slug
  if (zone.kind === 'city') return fill(T.cityTitle[locale], {n: name, y: year})
  const cityName = zone.cityTitle?.[locale] ?? zone.cityTitle?.en ?? ''
  return fill(T.districtTitle[locale], {n: name, c: cityName, y: year})
}

export type ZoneSeo = {metaTitle: SeoLocalized; metaDescription: SeoLocalized}

/**
 * A title is seed copy when it is just the zone's name ("Blloku", "City
 * Center") or too short to say anything. A hand-written one like
 * "Myslym Shyri, Tirana: prices and rents 2026" is kept.
 */
export function isGenericMetaTitle(existing: string | undefined, name: string | undefined): boolean {
  const value = existing?.trim()
  if (!value) return true
  if (name && value.toLowerCase() === name.trim().toLowerCase()) return true
  return value.length < 20
}

/**
 * The final SEO for a zone, honouring anything a person wrote.
 *
 * Both the SEO backfill and the landing generator call this, so a generated
 * landing and the document it came from cannot disagree — which is what keeps
 * `generate:district-landings --verify` meaningful.
 */
/**
 * True when a description is this generator's own earlier output.
 *
 * `HAND_WRITTEN_MIN` alone was not enough to tell them apart: an earlier
 * generated stub — "New builds €2,300–3,500/m², resale €1,500–2,500/m².
 * Sourced asking prices, 2026-H1." — is 83 characters, clears the threshold and
 * was therefore protected as if a person had written it, so a template
 * improvement never reached the zones that needed it most.
 *
 * The provenance tail is the tell: nothing hand-written ends with it.
 */
export function looksGenerated(
  text: string | undefined,
  locale: SeoLocale,
  place?: string | null,
): boolean {
  const value = text?.trim()
  if (!value) return false
  // The tail carries a period label, so compare against its fixed prefix.
  const tail = T.tail[locale].split('{')[0].trim()
  if (tail.length > 0 && value.includes(tail)) return true
  // The tail is displaced when an editorial sentence needs the room, so the
  // lead is the other tell: nobody hand-writes a description that opens
  // "Plazh, Durres: ".
  return Boolean(place && value.startsWith(`${place}: `))
}

export function resolveZoneSeo(
  zone: ZoneSeoInput,
  year: string,
  existing?: {metaTitle?: SeoLocalized; metaDescription?: SeoLocalized} | null,
  opts?: {force?: boolean},
): ZoneSeo | null {
  const composed = buildZoneSeo(zone, year)
  if (!composed) return null

  const force = opts?.force ?? false
  const existingEn = existing?.metaDescription?.en
  const keepDescription =
    !force &&
    !looksGenerated(existingEn, 'en', placeLabel(zone, 'en')) &&
    (existingEn?.trim().length ?? 0) >= HAND_WRITTEN_MIN
  const keepTitle =
    !force && !isGenericMetaTitle(existing?.metaTitle?.en, zone.title?.en ?? zone.slug)

  return {
    metaTitle: keepTitle && existing?.metaTitle ? existing.metaTitle : composed.metaTitle,
    metaDescription:
      keepDescription && existing?.metaDescription
        ? existing.metaDescription
        : composed.metaDescription,
  }
}

/** Returns null when the zone has neither metrics nor a description to work from. */
export function buildZoneSeo(zone: ZoneSeoInput, year: string): ZoneSeo | null {
  const metaTitle: SeoLocalized = {}
  const metaDescription: SeoLocalized = {}
  let usable = false

  for (const locale of SEO_LOCALES) {
    metaTitle[locale] = buildZoneMetaTitle(zone, locale, year)
    const description = buildZoneMetaDescription(zone, locale, year)
    if (description) {
      metaDescription[locale] = description
      usable = true
    }
  }

  return usable ? {metaTitle, metaDescription} : null
}
