/**
 * Localized Open Graph title/description generation for property and city
 * SEO helper (Studio only). Static templates per locale — no AI.
 */

export type LocaleId = 'en' | 'uk' | 'ru' | 'sq' | 'it'

export const LOCALE_IDS: LocaleId[] = ['en', 'uk', 'ru', 'sq', 'it']

type LocalizedTitle = {title?: Record<string, string | undefined>} | null | undefined

export function pickLocalized(doc: LocalizedTitle, locale: LocaleId): string {
  const t = doc?.title
  if (!t || typeof t !== 'object') return ''
  const direct = t[locale]
  if (typeof direct === 'string' && direct.trim()) return direct.trim()
  const en = t.en
  if (typeof en === 'string' && en.trim()) return en.trim()
  for (const v of Object.values(t)) {
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

function intlLocaleFor(locale: LocaleId): string {
  const map: Record<LocaleId, string> = {
    en: 'en-GB',
    uk: 'uk-UA',
    ru: 'ru-RU',
    sq: 'sq-AL',
    it: 'it-IT',
  }
  return map[locale]
}

export function formatEurPrice(price: number, locale: LocaleId): string {
  try {
    return new Intl.NumberFormat(intlLocaleFor(locale), {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: price % 1 === 0 ? 0 : 2,
    }).format(price)
  } catch {
    return `€${Math.round(price).toLocaleString()}`
  }
}

export function formatAreaSqm(area: number, locale: LocaleId): string {
  const n = new Intl.NumberFormat(intlLocaleFor(locale), {maximumFractionDigits: 0}).format(
    Math.round(area),
  )
  const unit: Record<LocaleId, string> = {
    en: 'm²',
    uk: 'м²',
    ru: 'м²',
    sq: 'm²',
    it: 'm²',
  }
  return `${n} ${unit[locale]}`
}

export type PropertyOgContext = {
  status: string
  bedrooms?: number
  bathrooms?: number
  area?: number
  price?: number
  cityTitle: string
  districtTitle: string
  typeTitle: string
  tagTitles: string[]
}

type DealKind = 'sale' | 'rent' | 'shortTerm'

function dealKind(status: string): DealKind {
  if (status === 'rent') return 'rent'
  if (status === 'short-term') return 'shortTerm'
  return 'sale'
}

/**
 * Grammatical forms for each deal type per locale (fit the local template connectors).
 */
const DEAL_LABELS: Record<LocaleId, Record<DealKind, string>> = {
  en: {
    sale: 'sale',
    rent: 'rent',
    shortTerm: 'short-term rent',
  },
  uk: {
    sale: 'продажу',
    rent: 'оренди',
    shortTerm: 'короткострокової оренди',
  },
  ru: {
    sale: 'продаже',
    rent: 'аренду',
    shortTerm: 'краткосрочную аренду',
  },
  sq: {
    sale: 'shitje',
    rent: 'qira',
    shortTerm: 'qira afatshkurtër',
  },
  it: {
    sale: 'vendita',
    rent: 'affitto',
    shortTerm: 'affitto breve',
  },
}

function dealForLocale(locale: LocaleId, status: string): string {
  return DEAL_LABELS[locale][dealKind(status)]
}

/** `2+1` only when both bedroom and bathroom counts are &gt; 0 */
function roomsLayout(ctx: PropertyOgContext): string {
  const bed = ctx.bedrooms
  const bath = ctx.bathrooms
  if (
    typeof bed === 'number' &&
    typeof bath === 'number' &&
    bed > 0 &&
    bath > 0
  ) {
    return `${bed}+${bath}`
  }
  return ''
}

type PropertyTitleBuild = {
  status: string
  typeTitle: string
  cityTitle: string
  rooms: string
}

/**
 * Per-locale sentence builders for property OG titles.
 * EN: [rooms] [type] for [deal] in [city]
 * UK: [type] [rooms] для [deal] у [city]
 * RU: [type] [rooms] в [deal] в [city]
 * SQ: [type] [rooms] me [deal] në [city]
 * IT: [type] [rooms] in [deal] a [city]
 */
const PROPERTY_TITLE_TEMPLATES: Record<LocaleId, (d: PropertyTitleBuild) => string> = {
  en: (d) => {
    const type = d.typeTitle.trim()
    const city = d.cityTitle.trim()
    const deal = dealForLocale('en', d.status)
    const rooms = d.rooms
    const lead = rooms ? `${rooms} ${type}`.trim() : type
    const parts: string[] = []
    if (lead) parts.push(`${lead} for ${deal}`)
    else parts.push(`for ${deal}`)
    if (city) parts.push(`in ${city}`)
    return parts.join(' ').replace(/\s+/g, ' ').trim()
  },

  uk: (d) => {
    const type = d.typeTitle.trim()
    const rooms = d.rooms
    const deal = dealForLocale('uk', d.status)
    const city = d.cityTitle.trim()
    const afterType = rooms ? (type ? `${type} ${rooms}` : rooms) : type
    const head = afterType.trim()
    const parts: string[] = []
    if (head) parts.push(head)
    parts.push(`для ${deal}`)
    if (city) parts.push(`у ${city}`)
    return parts.join(' ').replace(/\s+/g, ' ').trim()
  },

  ru: (d) => {
    const type = d.typeTitle.trim()
    const rooms = d.rooms
    const deal = dealForLocale('ru', d.status)
    const city = d.cityTitle.trim()
    const afterType = rooms ? (type ? `${type} ${rooms}` : rooms) : type
    const head = afterType.trim()
    const parts: string[] = []
    if (head) parts.push(head)
    parts.push(`в ${deal}`)
    if (city) parts.push(`в ${city}`)
    return parts.join(' ').replace(/\s+/g, ' ').trim()
  },

  sq: (d) => {
    const type = d.typeTitle.trim()
    const rooms = d.rooms
    const deal = dealForLocale('sq', d.status)
    const city = d.cityTitle.trim()
    const afterType = rooms ? (type ? `${type} ${rooms}` : rooms) : type
    const head = afterType.trim()
    const parts: string[] = []
    if (head) parts.push(head)
    parts.push(`me ${deal}`)
    if (city) parts.push(`në ${city}`)
    return parts.join(' ').replace(/\s+/g, ' ').trim()
  },

  it: (d) => {
    const type = d.typeTitle.trim()
    const rooms = d.rooms
    const deal = dealForLocale('it', d.status)
    const city = d.cityTitle.trim()
    const afterType = rooms ? (type ? `${type} ${rooms}` : rooms) : type
    const head = afterType.trim()
    const parts: string[] = []
    if (head) parts.push(head)
    parts.push(`in ${deal}`)
    if (city) parts.push(`a ${city}`)
    return parts.join(' ').replace(/\s+/g, ' ').trim()
  },
}

export function generatePropertyOgTitle(locale: LocaleId, ctx: PropertyOgContext): string {
  const build: PropertyTitleBuild = {
    status: ctx.status,
    typeTitle: ctx.typeTitle,
    cityTitle: ctx.cityTitle,
    rooms: roomsLayout(ctx),
  }
  return PROPERTY_TITLE_TEMPLATES[locale](build)
}

export function generatePropertyOgDescription(locale: LocaleId, ctx: PropertyOgContext): string {
  const parts: string[] = []
  if (ctx.price != null && Number.isFinite(ctx.price) && ctx.price >= 0) {
    parts.push(formatEurPrice(ctx.price, locale))
  }
  if (ctx.area != null && Number.isFinite(ctx.area) && ctx.area > 0) {
    parts.push(formatAreaSqm(ctx.area, locale))
  }
  if (ctx.cityTitle.trim()) parts.push(ctx.cityTitle.trim())
  if (ctx.districtTitle.trim()) parts.push(ctx.districtTitle.trim())
  if (ctx.tagTitles.length > 0) {
    const joined = ctx.tagTitles.map((t) => t.trim()).filter(Boolean).join(', ')
    if (joined) parts.push(joined)
  }
  return parts.join(' · ')
}

export type CityOgContext = {
  cityTitle: string
  heroShortLine?: string
  shortDescription?: string
  description?: string
  heroSubtitle?: string
  popular?: boolean
}

const CITY_POPULAR: Record<LocaleId, string> = {
  en: 'Popular',
  uk: 'Популярне',
  ru: 'Популярный',
  sq: 'Popullore',
  it: 'Popolare',
}

function truncate(s: string, max: number): string {
  const t = s.trim()
  if (t.length <= max) return t
  return t.slice(0, max - 1).trimEnd() + '…'
}

/**
 * City OG title: optional popular badge + city name + optional hero short line.
 */
export function generateCityOgTitle(locale: LocaleId, ctx: CityOgContext): string {
  const name = ctx.cityTitle.trim()
  if (!name) return ''
  const line = (ctx.heroShortLine || '').trim()
  let head = ctx.popular ? `${CITY_POPULAR[locale]} · ${name}` : name
  if (line) head += ` · ${line}`
  return head.trim()
}

/**
 * City OG description: shortDescription, else truncated description, else heroSubtitle.
 */
export function generateCityOgDescription(locale: LocaleId, ctx: CityOgContext): string {
  const short = (ctx.shortDescription || '').trim()
  if (short) return truncate(short, 300)
  const desc = (ctx.description || '').trim()
  if (desc) return truncate(desc, 300)
  const hero = (ctx.heroSubtitle || '').trim()
  if (hero) return truncate(hero, 300)
  return ''
}
