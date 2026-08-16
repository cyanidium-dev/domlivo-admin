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

export const SEO_LOCALES = ['en', 'uk', 'ru', 'sq', 'it'] as const
export type SeoLocale = (typeof SEO_LOCALES)[number]
export type SeoLocalized = Partial<Record<SeoLocale, string>>

/** A description longer than this was written by a person; do not overwrite it. */
export const HAND_WRITTEN_MIN = 80

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
  },
  cityTitle: {
    en: 'Property in {n}: prices {y}',
    uk: 'Нерухомість у {n}: ціни {y}',
    ru: 'Недвижимость в {n}: цены {y}',
    sq: 'Prona në {n}: çmimet {y}',
    it: 'Immobili a {n}: prezzi {y}',
  },
  newBuild: {
    en: 'New builds {v}/m²', uk: 'Новобудови {v}/м²', ru: 'Новостройки {v}/м²',
    sq: 'Ndërtime të reja {v}/m²', it: 'Nuovo {v}/m²',
  },
  resale: {
    en: 'resale {v}/m²', uk: 'вторинка {v}/м²', ru: 'вторичка {v}/м²',
    sq: 'të përdorura {v}/m²', it: 'usato {v}/m²',
  },
  all: {
    en: 'asking {v}/m²', uk: 'ціна пропозиції {v}/м²', ru: 'цена предложения {v}/м²',
    sq: 'çmimi i kërkuar {v}/m²', it: 'prezzo richiesto {v}/m²',
  },
  rent: {
    en: 'a 1+1 rents for {v}/month', uk: 'оренда 1+1 — {v}/міс', ru: 'аренда 1+1 — {v}/мес',
    sq: 'qiraja 1+1 {v}/muaj', it: 'affitto 1+1 {v}/mese',
  },
  reference: {
    en: 'state reference {v} lek/m²', uk: 'державний референс {v} лек/м²',
    ru: 'государственный референс {v} лек/м²', sq: 'çmimi i referencës {v} lekë/m²',
    it: 'riferimento statale {v} lek/m²',
  },
  tail: {
    en: 'Sourced asking prices, {p}.',
    uk: 'Ціни пропозиції з джерелами, {p}.',
    ru: 'Цены предложения с источниками, {p}.',
    sq: 'Çmime të kërkuara me burime, {p}.',
    it: 'Prezzi richiesti con fonti, {p}.',
  },
} as const

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
    if (!newB && !resale && !all && typeof m.referencePrice === 'number') {
      parts.push(fill(T.reference[locale], {v: nf(locale).format(m.referencePrice)}))
    }
  }

  if (parts.length > 0) {
    const body = parts.join(', ')
    // Whichever fragment leads, the sentence has to start like one.
    const lead = body.charAt(0).toLocaleUpperCase(locale) + body.slice(1)
    return `${lead}. ${fill(T.tail[locale], {p: m?.periodLabel ?? year})}`
  }

  const desc = zone.description?.[locale] ?? zone.description?.en
  if (!desc) return null
  const first = desc.split(/(?<=[.!?])\s/)[0]
  return first.length > 200 ? `${first.slice(0, 197)}…` : first
}

export function buildZoneMetaTitle(zone: ZoneSeoInput, locale: SeoLocale, year: string): string {
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
export function resolveZoneSeo(
  zone: ZoneSeoInput,
  year: string,
  existing?: {metaTitle?: SeoLocalized; metaDescription?: SeoLocalized} | null,
  opts?: {force?: boolean},
): ZoneSeo | null {
  const composed = buildZoneSeo(zone, year)
  if (!composed) return null

  const force = opts?.force ?? false
  const keepDescription =
    !force && (existing?.metaDescription?.en?.trim().length ?? 0) >= HAND_WRITTEN_MIN
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
