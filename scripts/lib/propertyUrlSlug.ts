/**
 * Per-locale URL slugs for property pages.
 *
 * A listing used to have one slug for every language: in-house listings a
 * Russian transliteration ("prodazha-studii-42m2"), partner listings the
 * partner's Albanian title ("shitet-apartament-2-1-plazh-iliria-durres-12801").
 * So an English page was /en/property/prodazha-… and a Russian one
 * /ru/property/shitet-…, and neither URL said anything to its reader.
 *
 * Each locale now gets a slug built from the listing's own facts, in that
 * language: `{type}-{layout}-{district}-{city}-{area}m2`, e.g.
 *   en  apartment-2-1-plazh-durres-85m2
 *   ru  kvartira-2-1-plazh-durres-85m2
 *   it  appartamento-2-1-plazh-durazzo-85m2
 *
 * Facts, not the title: titles are long, get rewritten, and would drag the URL
 * along with every edit. The slugs are written to Sanity once and then kept;
 * the site redirects the legacy slug and the other locales' slugs to the one
 * for the requested locale.
 */

export const URL_SLUG_LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl', 'de'] as const
export type UrlSlugLocale = (typeof URL_SLUG_LOCALES)[number]

type Localized = Partial<Record<string, string | undefined>> | null | undefined

export type UrlSlugInput = {
  typeSlug?: string | null
  typeTitle?: Localized
  cityTitle?: Localized
  districtTitle?: Localized
  bedrooms?: number | null
  rooms?: number | null
  area?: number | null
  plotArea?: number | null
}

const RU: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

// Ukrainian national transliteration (2010): и is y, г is h, і is i.
const UK: Record<string, string> = {
  ...RU,
  г: 'h', ґ: 'g', и: 'y', і: 'i', ї: 'i', є: 'ie', й: 'i', х: 'kh', щ: 'shch', ь: '',
}

// Albanian place names written in Ukrainian keep their own g: Голем is Golem,
// not "Holem", which is what the national table would make of it.
const UK_PLACE: Record<string, string> = {...UK, г: 'g'}

/** Lowercase ASCII words joined by hyphens, in this locale's transliteration. */
export function slugifyWords(text: string, locale: string, {place = false} = {}): string {
  const table = locale === 'uk' ? (place ? UK_PLACE : UK) : RU
  let out = ''
  for (const char of text.toLowerCase()) {
    if (char in table) out += table[char]
    else if (char === 'ł') out += 'l'
    else if (char === 'ß') out += 'ss'
    else out += char
  }
  return out
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function pick(value: Localized, locale: string): string {
  return (value?.[locale] || value?.en || '').trim()
}

/**
 * Albanian place names in the CMS carry the definite article ("Plazhi",
 * "Durrësi"), which reads wrong in a URL; the English title is the
 * indefinite form Albanians write in addresses ("Plazh", "Durres").
 */
function placeTitle(value: Localized, locale: string): string {
  return pick(value, locale === 'sq' ? 'en' : locale)
}

const LAYOUT_TYPES = new Set(['apartment', 'penthouse'])

function layout(input: UrlSlugInput): string | null {
  if (!input.typeSlug || !LAYOUT_TYPES.has(input.typeSlug)) return null
  const beds =
    typeof input.bedrooms === 'number' && input.bedrooms > 0
      ? input.bedrooms
      : typeof input.rooms === 'number' && input.rooms > 1
        ? input.rooms - 1
        : null
  // "2+1" is how the whole Albanian market writes a two-bedroom flat.
  return beds ? `${beds}-1` : null
}

function areaToken(input: UrlSlugInput): string | null {
  const area = input.typeSlug === 'land' ? input.plotArea || input.area : input.area || input.plotArea
  return typeof area === 'number' && area > 0 ? `${Math.round(area)}m2` : null
}

/** The slug before any collision suffix. */
export function baseUrlSlug(input: UrlSlugInput, locale: string): string {
  const city = placeTitle(input.cityTitle, locale)
  const district = placeTitle(input.districtTitle, locale)
  const placeSlug = (text: string) => slugifyWords(text, locale, {place: true})
  const parts = [
    slugifyWords(pick(input.typeTitle, locale) || input.typeSlug || 'property', locale),
    layout(input),
    district && placeSlug(district) !== placeSlug(city) ? placeSlug(district) : null,
    city ? placeSlug(city) : null,
    areaToken(input),
  ]
  return parts.filter((p): p is string => Boolean(p)).join('-')
}

/**
 * Assign slugs to many listings at once.
 *
 * A slug belongs to one listing across every locale: the site looks a request
 * up by whatever slug it carries and redirects to the right locale's form, so
 * "studio-plazh-durres-42m2" may be one listing's English and German slug but
 * never another listing's Polish one. `reserved` maps slugs already in use
 * (legacy `slug.current` values) to their owner.
 *
 * Listings that already have a slug keep it and reserve it first, so a re-run
 * never renames a live URL. A clash gets `-2`, `-3`… in input order, which
 * callers make stable (oldest listing first).
 */
export function assignUrlSlugs<T extends { id: string; input: UrlSlugInput; existing?: Localized }>(
  items: T[],
  reserved: Iterable<[slug: string, ownerId: string]> = [],
): Map<string, Record<UrlSlugLocale, string>> {
  const owner = new Map<string, string>(reserved)
  for (const item of items) {
    for (const locale of URL_SLUG_LOCALES) {
      const kept = item.existing?.[locale]
      if (kept) owner.set(kept, item.id)
    }
  }
  const free = (slug: string, id: string) => {
    const by = owner.get(slug)
    return by === undefined || by === id
  }

  const result = new Map<string, Record<UrlSlugLocale, string>>()
  for (const item of items) {
    const slugs = {} as Record<UrlSlugLocale, string>
    for (const locale of URL_SLUG_LOCALES) {
      const kept = item.existing?.[locale]
      if (kept) {
        slugs[locale] = kept
        continue
      }
      const base = baseUrlSlug(item.input, locale)
      let candidate = base
      for (let n = 2; !free(candidate, item.id); n++) candidate = `${base}-${n}`
      owner.set(candidate, item.id)
      slugs[locale] = candidate
    }
    result.set(item.id, slugs)
  }
  return result
}
