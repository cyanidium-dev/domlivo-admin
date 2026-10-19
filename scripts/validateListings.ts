/**
 * Validate the public sale listings for data defects a buyer would notice:
 * the text puts the flat in another town, the layout in the text disagrees with
 * the rooms fields, the area or price per m² cannot be right, the description
 * stops mid-sentence, or the gallery is empty or thin.
 *
 * Why: ~730 listings arrive from three partner imports (Cactus, get.al,
 * findall). Each import maps the partner's fields on its own, and the errors
 * that slip through (a Vlorë flat filed under Durrës, a 2+1 with bedrooms = 3,
 * 5800 m² instead of 58) only show up when the structured fields are read
 * against the text. This script does that reading and hands the owner a list.
 *
 * READ-ONLY. Nothing here patches a document: most findings have two possible
 * fixes (the text is wrong, or the field is) and choosing one is a judgement
 * about a real property.
 *
 * Scope = what the site shows. Mirrors `publishedPropertyFilter()` in
 * your-house-albania/src/lib/sanity/groq/propertyFilters.ts:
 *   isPublished == true && (lifecycleStatus == "active" || !defined(lifecycleStatus))
 *   && status in ["sale"]   (PUBLIC_DEAL_TYPES), published documents only.
 *
 * Source = id prefix: property-cactus-*, property-getal-*, property-findall-*,
 * anything else = other. The partner's own language ("main locale") is ru for
 * Cactus and sq for get.al / findall / other; en is our translation.
 *
 * Rules and heuristics
 *
 * 1. Location mismatch. Vocabulary = every localized title and slug of the
 *    `city` and `district` documents, plus hand-added spellings (Durrës /
 *    Durres / Durazzo / Дуррес, Vlorë / Vlora / Valona, Sarandë / Saranda,
 *    Shëngjin / Lezhë, Himarë / Himara, Shkodër / Shkodra / Scutari ...).
 *    Matching is on lower-cased text with diacritics stripped, whole words;
 *    Latin names of 5+ letters accept Albanian case endings (Durrësit,
 *    Vlorës), Cyrillic names accept up to 3 letters of ending (Дурресе).
 *    Left out of the vocabulary because they are ordinary words or shared
 *    by several towns: City Center / Qendra / Center, Old Town, Lungomare,
 *    Promenade, Port Zone, Dry/Artificial Lake, New Boulevard, Rinas (it is
 *    the Tirana airport), Kavajë (also "Rruga e Kavajës" in Tirana). Plazh,
 *    Blloku, Skelë and Livadh are matched in en/it text only (in Albanian they
 *    mean beach, block, pier, meadow). Other Albanian towns outside the
 *    catalogue (Elbasan, Fier, Berat, Korçë, Pogradec, Gjirokastër, Lushnjë)
 *    count as "another city".
 *    A mention is IGNORED when it reads as a distance or a landmark rather
 *    than the address: within the same sentence, the 40 characters before it
 *    contain km / minutes / drive / from / to / towards / near / close to /
 *    between / airport / highway / road, or a comparison (above / below /
 *    than / compared / unlike) (and the sq / ru / it equivalents:
 *    nga, afër, drejt, rruga, autostrada; от, до, км, минут, трасса, рядом;
 *    da, vicino, minuti), or it is followed by airport / port / highway /
 *    road, or it is half of a "Tirana-Durrës" pair.
 *    Text = en description; when en names no place at all, the main locale.
 *    A listing is flagged when the text names another city (or a district of
 *    another city) and names neither the listing's own city nor any of its
 *    districts; an en hit is dropped when the main locale names the own city.
 *    1b (lower confidence): same city, the text names other districts of that
 *    city but not the listing's own district (Golem 1st Line counts as Golem).
 *
 * 2. Rooms vs layout. Albanian convention, as in the schema's `rooms` field:
 *    N+1 = N bedrooms + 1 living room, so bedrooms = N and rooms = N+1
 *    ("2+1+1"/"2+1+2" = the same 2+1 plus a study or bathrooms). Studio /
 *    garsonierë / студия / monolocale = 0+1: rooms 1, bedrooms 0. "N
 *    bedrooms", "N-bedroom", "N dhoma gjumi", "N camere da letto", "N
 *    спальни" give bedrooms = N. Russian "N-комнатная" gives rooms = N.
 *    Claims are read from the en and main-locale title + description; the N+1
 *    notation wins over bedroom phrases. When the text claims more than one
 *    value (a building with 1+1 and 2+1 units) the listing is skipped.
 *    Flagged when a stated field disagrees; empty fields are not flagged.
 *
 * 3. Implausible area / price. Missing area (all types). Floor area:
 *    apartment < 20 or > 400 m², penthouse < 30 or > 600, studio < 15 or > 80,
 *    house/villa < 40 or > 2000, land < 50, commercial/office < 10.
 *    m² per room (rooms, else bedrooms+1) < 10, or > 150 for apartments.
 *    Price per m² (price itself when priceUnit = per-sqm, else price/area):
 *    apartment/studio/penthouse < 300 or > 10,000 €/m², house/villa < 150 or
 *    > 10,000, commercial/office < 150 or > 15,000, land < 5 or > 5,000.
 *    Price unit suspicious: per-sqm with price > 20,000, or a total price
 *    < 15,000 € on a non-land listing.
 *
 * 4. Truncated description (en and main locale): ends with "..." or "…";
 *    ends with a scraper button label (See less / See more / Shiko më
 *    shumë ...); ends on , ; : - ( or a dangling function word (and, with,
 *    the, dhe, me, në, и, с, в, e, con ...); or the last paragraph is prose
 *    (80+ characters) without terminal punctuation . ! ? … (closing quotes and
 *    brackets after it are fine). A short last line without a full stop
 *    ("Price: 85,000 €", a bullet) is a list, not a cut, and is not flagged.
 *
 * 5. Photos: no gallery images; fewer than 3; gallery items without an asset
 *    reference or pointing at an asset document that no longer exists.
 *
 * Output: reports/listing-validation-<YYYY-MM-DD>.md (summary table issue x
 * source, then per issue the rule, the count and the first 50 ids with an
 * evidence snippet) and the summary table on stdout.
 *
 * Run:
 *   npx tsx scripts/validateListings.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const token = process.env.SANITY_API_TOKEN?.trim()
if (!token) {
  console.error('SANITY_API_TOKEN required in .env')
  process.exit(1)
}
const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  useCdn: false,
  token,
})

// ---------------------------------------------------------------------------
// Types and data
// ---------------------------------------------------------------------------

type Localized = Record<string, string | undefined> | null | undefined
type Property = {
  _id: string
  title?: Localized
  description?: Localized
  type?: string
  city?: string
  district?: string
  area?: number | null
  plotArea?: number | null
  rooms?: number | null
  bedrooms?: number | null
  price?: number | null
  priceUnit?: string | null
  galleryCount: number
  galleryNoRef: number
  galleryBroken: number
}
type Place = {_id: string; city?: string; title?: Localized; slug?: string}

const PUBLIC_FILTER = `_type == "property" && !(_id in path("drafts.**")) && isPublished == true && (lifecycleStatus == "active" || !defined(lifecycleStatus)) && status in ["sale"]`

const SOURCES = ['cactus', 'getal', 'findall', 'other'] as const
type Source = (typeof SOURCES)[number]
const sourceOf = (id: string): Source => {
  const m = /^property-(cactus|getal|findall)-/.exec(id)
  return (m?.[1] as Source) || 'other'
}
const mainLocale = (src: Source) => (src === 'cactus' ? 'ru' : 'sq')

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

/** Lower-case, strip diacritics (ë -> e, ç -> c), ё -> е. Keeps length 1:1 for Latin/Cyrillic. */
function norm(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е').normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC')
}
const isCyr = (s: string) => /[Ѐ-ӿ]/.test(s)
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const clip = (s: string, n = 90) => {
  const t = s.replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, n - 1) + '…' : t
}
const mdCell = (s: string) => s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')

// ---------------------------------------------------------------------------
// 1. Location vocabulary
// ---------------------------------------------------------------------------

type Alias = {re: RegExp; label: string; enOnly: boolean}
type PlaceEntry = {
  key: string
  kind: 'city' | 'district' | 'town'
  city: string
  label: string
  aliases: Alias[]
}

const CITY_EXTRA: Record<string, string[]> = {
  'city-durres': ['durres', 'durresi', 'durazzo', 'dures', 'дуррес', 'дурес', 'драч'],
  'city-vlore': ['vlore', 'vlora', 'valona', 'влера', 'влора', 'влёра'],
  'city-sarande': ['sarande', 'saranda', 'santi quaranta', 'саранда'],
  'city-tirana': ['tirana', 'tirane', 'тирана'],
  'city-shengjin': ['shengjin', 'shengjini', 'san giovanni di medua', 'шенджин', 'lezhe', 'lezha'],
  'city-himare': ['himare', 'himara', 'chimara', 'химара'],
  'city-shkoder': ['shkoder', 'shkodra', 'scutari', 'шкодер', 'шкодра'],
}
/** Towns outside the catalogue: naming one of them as the address is still "another city". */
const OTHER_TOWNS: Record<string, string[]> = {
  elbasan: ['elbasan', 'эльбасан'],
  fier: ['fier', 'фиер'],
  berat: ['berat', 'берат'],
  korce: ['korce', 'korca', 'корча'],
  pogradec: ['pogradec', 'поградец'],
  gjirokaster: ['gjirokaster', 'gjirokastra', 'argirocastro', 'гирокастра'],
  lushnje: ['lushnje', 'lushnja', 'лушня'],
}
/** Districts left out entirely: generic words, shared names, landmarks. */
const DISTRICT_SKIP = new Set([
  'district-durres-center',
  'district-himare-center',
  'district-qender-tirana',
  'district-sarande-center',
  'district-shengjin-center',
  'district-shkoder-center',
  'district-vlore-center',
  'district-old-town-himare',
  'district-lungomare',
  'district-lungomare-2nd-line',
  'district-seafront-sarande',
  'district-zona-e-portit',
  'district-liqeni-artificial',
  'district-liqeni-i-thate',
  'district-bulevardi-i-ri',
  'district-rinas',
  'district-kavaje',
])
/** Districts whose name is an ordinary word in sq/ru: only matched in en/it text, Latin aliases only. */
const DISTRICT_EN_ONLY = new Set([
  'district-plazh',
  'district-blloku',
  'district-skele-vlore',
  'district-livadh',
])
/** Districts that are the same place for the purposes of 1b. */
const DISTRICT_GROUP: Record<string, string> = {
  'district-golem-1st-line': 'district-golem-durres',
}
const DISTRICT_EXTRA: Record<string, string[]> = {
  'district-golem-1st-line': ['golem', 'golemi'],
  'district-shkembi-durres': ['shkembi i kavajes', 'shkemb i kavajes', 'shkembi kavajes'],
  'district-gjiri-i-lalzit': ['lalzi bay', 'lalez', 'lalzit', 'baia di lalzi'],
  'district-dajti': ['dajti', 'fresku'],
}
/** Words that are names of nothing: titles that degrade into common words after normalisation. */
const ALIAS_STOP = new Set([
  'center',
  'qendra',
  'centro',
  'centro citta',
  'city center',
  'центр',
  'плаж',
  'пляж',
])

function aliasRegex(raw: string): RegExp | null {
  const a = norm(raw).trim()
  if (a.length < 3 || ALIAS_STOP.has(a)) return null
  const L = '\\p{L}\\p{N}'
  let body: string
  if (isCyr(a)) {
    // Cyrillic: drop a final vowel and accept up to 3 letters of case ending.
    const stem = a.length > 4 ? a.replace(/[аеиоуыэюяй]$/u, '') : a
    body = esc(stem) + '\\p{L}{0,3}'
  } else if (a.length >= 5) {
    // Latin: Albanian definite / case endings (Durresi, Durresit, Vlores, Golemit).
    body = esc(a).replace(/\\? /g, '[\\s-]+') + '(?:i|it|s|es|n|in|ne|a|e|ut|u|t)?'
  } else {
    body = esc(a)
  }
  return new RegExp(`(?<![${L}])${body}(?![${L}])`, 'gu')
}

function buildVocabulary(
  cities: Place[],
  districts: Place[],
  skip: Set<string> = DISTRICT_SKIP,
): PlaceEntry[] {
  const out: PlaceEntry[] = []
  const mk = (raws: string[], enOnly: boolean): Alias[] => {
    const seen = new Set<string>()
    const res: Alias[] = []
    for (const raw of raws) {
      if (!raw) continue
      for (const part of raw.split(/\s*\/\s*|\s*,\s*/)) {
        const n = norm(part).trim()
        if (!n || seen.has(n)) continue
        if (enOnly && isCyr(n)) continue
        seen.add(n)
        const re = aliasRegex(part)
        if (re) res.push({re, label: part.trim(), enOnly})
      }
    }
    return res
  }
  for (const c of cities) {
    const raws = [
      ...Object.values(c.title || {}).filter((v): v is string => typeof v === 'string'),
      c.slug || '',
      ...(CITY_EXTRA[c._id] || []),
    ]
    out.push({
      key: c._id,
      kind: 'city',
      city: c._id,
      label: c.title?.en || c._id,
      aliases: mk(raws, false),
    })
  }
  for (const [k, raws] of Object.entries(OTHER_TOWNS)) {
    out.push({
      key: `town-${k}`,
      kind: 'town',
      city: `town-${k}`,
      label: raws[0],
      aliases: mk(raws, false),
    })
  }
  for (const d of districts) {
    if (!d.city || skip.has(d._id)) continue
    const enOnly = DISTRICT_EN_ONLY.has(d._id)
    const titles = Object.entries(d.title || {})
      .filter(([k, v]) => typeof v === 'string' && !k.startsWith('_'))
      .map(([, v]) => v as string)
    const slug = (d.slug || '')
      .replace(/-(durres|vlore|tirana|sarande|himare|shkoder|shengjin)$/, '')
      .replace(/-/g, ' ')
    const raws = [...titles, slug, ...(DISTRICT_EXTRA[d._id] || [])].filter(
      (r) =>
        !/1st line|2nd line|vija e|prima linea|seconda linea|первая линия|перша лінія/i.test(r),
    )
    out.push({
      key: d._id,
      kind: 'district',
      city: d.city,
      label: d.title?.en || d._id,
      aliases: mk(raws, enOnly),
    })
  }
  return out
}

const CUE_BEFORE = new RegExp(
  [
    '\\bkm\\b',
    '\\bkilomet',
    '\\bminut',
    '\\bmin\\b',
    '\\bdrive\\b',
    '\\bdriving\\b',
    '\\bfrom\\b',
    '\\bto\\b',
    '\\btowards\\b',
    '\\bnear\\b',
    '\\bnearby\\b',
    '\\bclose to\\b',
    '\\bnext to\\b',
    '\\bbetween\\b',
    '\\bairport\\b',
    '\\bhighway\\b',
    '\\bmotorway\\b',
    '\\broad\\b',
    '\\bnga\\b',
    '\\bafer\\b',
    '\\bdrejt',
    '\\brruga\\b',
    '\\brr\\.',
    '\\bautostrad',
    '\\baeroport',
    '\\bda\\b',
    '\\bvicino',
    '\\bdistanza',
    '\\bstrada\\b',
    // comparisons: "well above Golem or Plazh", "cheaper than Tirana"
    '\\babove\\b',
    '\\bbelow\\b',
    '\\bthan\\b',
    '\\bcompared\\b',
    '\\bunlike\\b',
    '\\bversus\\b',
    '\\bvs\\b',
    '\\bse ne\\b',
    'чем',
    '(?<![\\p{L}])от(?![\\p{L}])',
    '(?<![\\p{L}])до(?![\\p{L}])',
    '(?<![\\p{L}])км(?![\\p{L}])',
    'минут',
    'аэропорт',
    'трасс',
    'дорог',
    'рядом',
    'близ',
    'между',
    'шоссе',
  ].join('|'),
  'u',
)
const CUE_AFTER =
  /^[\s,'’"«»()-]{0,3}(?:international\s+)?(?:airport|port\b|harbou?r|highway|motorway|road|bypass|aeroport|porti\b|portit\b|autostrad|rruga|аэропорт|порт|трасс|шоссе)/u
const PAIR = /^\s*[-–—\/]\s*\p{L}/u

type Mention = {key: string; city: string; kind: PlaceEntry['kind']; label: string; text: string}

function findMentions(text: string, vocab: PlaceEntry[], locale: string): Mention[] {
  const t = norm(text)
  const res: Mention[] = []
  for (const p of vocab) {
    for (const a of p.aliases) {
      if (a.enOnly && !(locale === 'en' || locale === 'it')) continue
      a.re.lastIndex = 0
      let m: RegExpExecArray | null
      while ((m = a.re.exec(t))) {
        const start = m.index
        const end = start + m[0].length
        // Same-sentence window before the match.
        let before = t.slice(Math.max(0, start - 40), start)
        const cut = Math.max(
          before.lastIndexOf('.'),
          before.lastIndexOf('\n'),
          before.lastIndexOf('!'),
          before.lastIndexOf('?'),
        )
        if (cut >= 0) before = before.slice(cut + 1)
        const after = t.slice(end, end + 30)
        const prevChars = t.slice(Math.max(0, start - 3), start)
        if (
          CUE_BEFORE.test(before) ||
          CUE_AFTER.test(after) ||
          PAIR.test(after) ||
          /[-–—\/]\s*$/.test(prevChars)
        )
          continue
        res.push({
          key: p.key,
          city: p.city,
          kind: p.kind,
          label: p.label,
          text: text.slice(start, end),
        })
      }
    }
  }
  return res
}

/** All mentions including distance/landmark ones — used to decide "the text names the own place". */
function namesPlace(
  text: string,
  vocab: PlaceEntry[],
  locale: string,
  pred: (p: PlaceEntry) => boolean,
): boolean {
  const t = norm(text)
  return vocab.some(
    (p) =>
      pred(p) &&
      p.aliases.some(
        (a) =>
          !(a.enOnly && !(locale === 'en' || locale === 'it')) &&
          ((a.re.lastIndex = 0), a.re.test(t)),
      ),
  )
}

// ---------------------------------------------------------------------------
// 2. Layout claims
// ---------------------------------------------------------------------------

const NUM: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  single: 1,
  double: 2,
  nje: 1,
  dy: 2,
  tre: 3,
  tri: 3,
  kater: 4,
  pese: 5,
  gjashte: 6,
  una: 1,
  un: 1,
  due: 2,
  quattro: 4,
  cinque: 5,
  sei: 6,
  одна: 1,
  одной: 1,
  одну: 1,
  две: 2,
  двумя: 2,
  двух: 2,
  три: 3,
  тремя: 3,
  трех: 3,
  четыре: 4,
  четырьмя: 4,
  четырех: 4,
  пять: 5,
}
const NUMWORD = Object.keys(NUM).join('|')
type Claim = {beds?: number; rooms?: number; phrase: string; strong: boolean}

function layoutClaims(raw: string): Claim[] {
  const t = norm(raw)
  const out: Claim[] = []
  // N+1 / N+2 (bedrooms + living rooms), optionally +M for bathrooms. Not part of a longer chain or a number.
  for (const m of t.matchAll(/(?<![\d+.,])([0-5])\s*\+\s*([12])(?:\s*\+\s*\d)?(?![\d.,]|\s*\+)/g)) {
    out.push({beds: Number(m[1]), rooms: Number(m[1]) + Number(m[2]), phrase: m[0], strong: true})
  }
  // Studio.
  for (const m of t.matchAll(
    // Russian: singular студия/студию only ("номеров-студий", "кухня-студия" are not the flat).
    /\b(studio(?:\s+|-)(?:apartment|flat|unit)|(?:a|the|this|cozy|cosy|compact|bright|modern|furnished)\s+studio\b|garsonier[ea]?|monolocale)|(?<![\p{L}-])студи[яю](?![\p{L}])|квартир\p{L}*-студи[яю]/gu,
  )) {
    out.push({beds: 0, rooms: 1, phrase: m[0], strong: true})
  }
  // N bedrooms (en / sq / it / ru). Weak: a floor-by-floor or per-unit description repeats these.
  const bedRes = [
    new RegExp(`\\b(\\d|${NUMWORD})[\\s-]+bed(?:room)?s?\\b`, 'gu'),
    new RegExp(`\\b(\\d|${NUMWORD})\\s+dhom(?:a|e)\\s+gjumi\\b`, 'gu'),
    new RegExp(`\\b(\\d|${NUMWORD})\\s+camer(?:a|e)\\s+da\\s+letto\\b`, 'gu'),
    new RegExp(`(?<![\\p{L}])(\\d|${NUMWORD})\\s+спал(?:ьн|ен)\\p{L}*`, 'gu'),
  ]
  for (const re of bedRes) {
    for (const m of t.matchAll(re)) {
      const n = /^\d$/.test(m[1]) ? Number(m[1]) : NUM[m[1]]
      if (n === undefined) continue
      // "two bedrooms have balconies" style partial counts are usually preceded by "of the" / "из"; skip "N of the".
      out.push({beds: n, phrase: m[0], strong: false})
    }
  }
  // Russian N-комнатная = N rooms.
  const RU_ROOMS: Record<string, number> = {одно: 1, двух: 2, трех: 3, четырех: 4, пяти: 5}
  for (const m of t.matchAll(
    /(?<![\p{L}])(одно|двух|трех|четырех|пяти|[1-5])[\s-]*комнатн\p{L}*/gu,
  )) {
    const n = /^\d$/.test(m[1]) ? Number(m[1]) : RU_ROOMS[m[1]]
    out.push({rooms: n, phrase: m[0], strong: true})
  }
  return out
}

/** "Two 1+1 apartments", "2 studios", "три квартиры": the listing is several units, layout fields are not per-text. */
const MULTI_UNIT =
  /(?<![\p{L}\d])(two|three|four|five|several|multiple|[2-9]|dy|tre|kater|due|quattro|две|два|три|четыре|несколько)\s+(?:[0-5]\s*\+\s*[12]\s+)?(studio|apartment|flat|unit|apartament|garsonier|appartament|monolocal|квартир|студи|апартамент)/u
/** Floor-by-floor layouts (houses, villas, mixed-use): bedroom counts there are per floor. */
const PER_FLOOR =
  /\b(ground|first|second|third|upper|lower|top|each)\s+floor\b|\bfloor\s+\d|\bkati\s+(i|perdhe)|\bpiano\s+terra|\bprimo\s+piano|(?<![\p{L}])(\d-?й\s+)?этаж\p{L}*:/u

// ---------------------------------------------------------------------------
// 4. Truncation
// ---------------------------------------------------------------------------

const DANGLING = new Set([
  // en
  'and',
  'or',
  'with',
  'the',
  'a',
  'an',
  'of',
  'in',
  'on',
  'at',
  'to',
  'for',
  'from',
  'by',
  'as',
  'but',
  'which',
  'that',
  'its',
  'their',
  'is',
  'are',
  // sq
  'dhe',
  'ose',
  'me',
  'ne',
  'per',
  'nga',
  'te',
  'se',
  'qe',
  'i',
  'e',
  'si',
  'por',
  'ka',
  'eshte',
  // it
  'con',
  'di',
  'da',
  'il',
  'la',
  'le',
  'per',
  'del',
  'della',
  'che',
  'ed',
  // ru / uk
  'и',
  'с',
  'в',
  'на',
  'по',
  'для',
  'от',
  'до',
  'из',
  'к',
  'а',
  'но',
  'или',
  'со',
  'что',
  'й',
  'та',
  'з',
  'у',
])
const SCRAPER_TAIL =
  /(see (less|more)|read more|show (less|more)|shiko m[eë] (shum[eë]|pak)|lexo m[eë] shum[eë]|m[eë] shum[eë]|показать (больше|меньше)|читать далее)\s*$/iu

function truncation(raw: string | undefined): string | null {
  if (!raw) return null
  const text = raw.replace(/\s+$/u, '')
  if (!text) return null
  if (SCRAPER_TAIL.test(text)) return `scraper button text at end: "${clip(text.slice(-40), 50)}"`
  // Strip trailing emoji / symbols / closing quotes and brackets for the punctuation test.
  const core = text.replace(/[\s\p{Extended_Pictographic}‍️*_"'”’»)\]]+$/u, '')
  if (!core) return null
  if (/(\.\.\.|…)$/u.test(core)) return `ends with ellipsis: "…${clip(core.slice(-60), 60)}"`
  const last = core.slice(-1)
  if (/[.!?]/.test(last)) return null
  if (/[,;:(\-–—]/.test(last)) return `ends on "${last}": "…${clip(core.slice(-60), 60)}"`
  const lastWord = norm(core).match(/(\p{L}+)$/u)?.[1]
  if (lastWord && DANGLING.has(lastWord))
    return `ends on "${lastWord}": "…${clip(core.slice(-60), 60)}"`
  const lastPara = core.split(/\n/).pop() || ''
  if (lastPara.trim().length >= 80)
    return `prose ends without . ! ?: "…${clip(core.slice(-60), 60)}"`
  return null
}

// ---------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------

type IssueKey =
  | 'loc-city'
  | 'loc-district'
  | 'rooms'
  | 'area-missing'
  | 'area-range'
  | 'area-per-room'
  | 'ppm'
  | 'price-unit'
  | 'trunc'
  | 'photos-none'
  | 'photos-few'
  | 'photos-broken'

const ISSUES: {key: IssueKey; group: string; title: string; rule: string}[] = [
  {
    key: 'loc-city',
    group: '1. Location mismatch',
    title: 'Text names another city',
    rule: 'Description (en; main locale when en names no place) names a city, a district of another city, or a town outside the catalogue, outside distance/landmark phrases, and names neither the listing city nor any of its districts. An en hit is dropped when the main locale names the own city.',
  },
  {
    key: 'loc-district',
    group: '1. Location mismatch',
    title: 'Text names another district of the same city (lower confidence)',
    rule: 'Same city; the description names one or more other districts of that city (outside distance phrases) and never the listing district. Generic districts (City Center, Lungomare, Old Town ...) are not in the vocabulary, so a listing filed under "City Center" whose text says "Plazh" lands here.',
  },
  {
    key: 'rooms',
    group: '2. Rooms vs layout',
    title: 'Rooms / bedrooms contradict the layout in the text',
    rule: 'N+1 = N bedrooms + living room: bedrooms must be N, rooms N+1. Studio/garsonierë = bedrooms 0, rooms 1. "N bedrooms" = bedrooms N. Russian N-комнатная = rooms N. Read from en + main-locale title and description; skipped when the text claims several values.',
  },
  {
    key: 'area-missing',
    group: '3. Implausible area / price',
    title: 'Area missing',
    rule: 'No `area` value.',
  },
  {
    key: 'area-range',
    group: '3. Implausible area / price',
    title: 'Area outside the plausible range for the type',
    rule: 'apartment 20-400 m², penthouse 30-600, studio 15-80, house/villa 40-2000, land >= 50, commercial/office >= 10.',
  },
  {
    key: 'area-per-room',
    group: '3. Implausible area / price',
    title: 'Area per room absurd',
    rule: 'area / rooms (or bedrooms+1) < 10 m² for any residential type, or > 150 m² for apartments/studios.',
  },
  {
    key: 'ppm',
    group: '3. Implausible area / price',
    title: 'Price per m² outside band',
    rule: 'apartment/studio/penthouse 300-10,000 €/m², house/villa 150-10,000, commercial/office 150-15,000, land 5-5,000. Price per m² = price when priceUnit = per-sqm, else price / area.',
  },
  {
    key: 'price-unit',
    group: '3. Implausible area / price',
    title: 'Price unit looks wrong',
    rule: 'priceUnit per-sqm with price > 20,000 (looks like a total), or a total price < 15,000 € on a non-land listing (looks like a per-m² figure or a typo).',
  },
  {
    key: 'trunc',
    group: '4. Truncated description',
    title: 'Description ends mid-sentence',
    rule: 'en or main locale ends with "..."/"…", with scraper button text (See less / Shiko më shumë), on , ; : - ( or a dangling function word, or its last paragraph is 80+ characters of prose without . ! ?',
  },
  {key: 'photos-none', group: '5. Photos', title: 'No photos', rule: 'Gallery empty.'},
  {
    key: 'photos-few',
    group: '5. Photos',
    title: 'Fewer than 3 photos',
    rule: 'Gallery has 1 or 2 images.',
  },
  {
    key: 'photos-broken',
    group: '5. Photos',
    title: 'Gallery items without a usable asset',
    rule: 'Gallery item has no asset reference, or the referenced asset document does not exist.',
  },
]

type Finding = {id: string; source: Source; evidence: string}

async function main() {
  const runAt = new Date()
  const [props, cities, districts] = await Promise.all([
    client.fetch<Property[]>(
      `*[${PUBLIC_FILTER}] | order(_id asc){
        _id, title, description, "type": type->slug.current, "city": city._ref, "district": district._ref,
        area, plotArea, rooms, bedrooms, price, priceUnit,
        "galleryCount": count(gallery),
        "galleryNoRef": count(gallery[!defined(asset._ref)]),
        "galleryBroken": count(gallery[defined(asset._ref) && !defined(asset->_id)])
      }`,
    ),
    client.fetch<Place[]>(
      `*[_type == "city" && !(_id in path("drafts.**"))]{_id, title, "slug": slug.current}`,
    ),
    client.fetch<Place[]>(
      `*[_type == "district" && !(_id in path("drafts.**"))]{_id, "city": city._ref, title, "slug": slug.current}`,
    ),
  ])

  const vocab = buildVocabulary(cities, districts)
  // Own-place checks use every district, generic ones included (more names = fewer flags).
  const vocabAll = buildVocabulary(cities, districts, new Set())
  const placeLabel = new Map(vocabAll.map((p) => [p.key, p.label]))
  const cityLabel = (id?: string) => (id ? placeLabel.get(id) || id : '—')
  const findings = new Map<IssueKey, Finding[]>(ISSUES.map((i) => [i.key, []]))
  const add = (k: IssueKey, p: Property, evidence: string) =>
    findings.get(k)!.push({id: p._id, source: sourceOf(p._id), evidence})

  const bySource: Record<Source, number> = {cactus: 0, getal: 0, findall: 0, other: 0}
  const locStats = {ownNamed: 0, noPlace: 0, ownPlusForeign: 0}

  for (const p of props) {
    const src = sourceOf(p._id)
    bySource[src]++
    const ml = mainLocale(src)
    const desc = (l: string) =>
      typeof p.description?.[l] === 'string' ? (p.description[l] as string) : ''
    const title = (l: string) => (typeof p.title?.[l] === 'string' ? (p.title[l] as string) : '')

    // ---- 1. Location -------------------------------------------------------
    if (p.city) {
      const ownDistrictGroup = p.district ? DISTRICT_GROUP[p.district] || p.district : undefined
      const isOwnCity = (e: PlaceEntry) => e.city === p.city
      const isOwnMention = (m: Mention) => m.city === p.city
      let locale = 'en'
      let text = desc('en')
      let mentions = text ? findMentions(text, vocab, 'en') : []
      if (!mentions.length && !namesPlace(text, vocab, 'en', () => true)) {
        locale = ml
        text = desc(ml)
        mentions = text ? findMentions(text, vocab, ml) : []
      }
      const foreign = mentions.filter((m) => m.city !== p.city)
      // Own place counts only as an address mention (not "20 minutes from Durrës").
      const ownNamed = findMentions(text, vocabAll, locale).some(isOwnMention)
      if (ownNamed) locStats.ownNamed++
      if (!ownNamed && !mentions.length) locStats.noPlace++
      if (ownNamed && foreign.length) locStats.ownPlusForeign++
      if (foreign.length && !ownNamed) {
        const mlNamesOwn =
          locale === 'en' && desc(ml) ? namesPlace(desc(ml), vocabAll, ml, isOwnCity) : false
        if (!mlNamesOwn) {
          const names = [
            ...new Set(
              foreign.map(
                (m) =>
                  `${m.text} (${m.kind === 'district' ? `district of ${cityLabel(m.city)}` : m.kind === 'town' ? 'town outside catalogue' : 'city'})`,
              ),
            ),
          ]
          add(
            'loc-city',
            p,
            `fields: ${cityLabel(p.city)} / ${cityLabel(p.district)}; ${locale} text names ${names.slice(0, 3).join(', ')}`,
          )
        }
      } else if (p.district) {
        // 1b. Same city, other district named, own district never named.
        const sameCityOther = mentions.filter(
          (m) =>
            m.kind === 'district' &&
            m.city === p.city &&
            (DISTRICT_GROUP[m.key] || m.key) !== ownDistrictGroup,
        )
        const ownDistrictNamed = namesPlace(
          text,
          vocabAll,
          locale,
          (e) => e.kind === 'district' && (DISTRICT_GROUP[e.key] || e.key) === ownDistrictGroup,
        )
        if (sameCityOther.length && !ownDistrictNamed && !foreign.length) {
          const names = [...new Set(sameCityOther.map((m) => m.text))]
          add(
            'loc-district',
            p,
            `fields: ${cityLabel(p.city)} / ${cityLabel(p.district)}; ${locale} text names ${names.slice(0, 3).join(', ')}`,
          )
        }
      }
    }

    // ---- 2. Rooms vs layout ------------------------------------------------
    {
      const texts = [title('en'), title(ml), desc('en'), desc(ml)].filter(Boolean)
      const residential = ['apartment', 'penthouse', 'studio', 'house', 'villa'].includes(
        p.type || '',
      )
      const multiUnit = texts.some((t) => MULTI_UNIT.test(norm(t)))
      const perFloor = texts.some((t) => PER_FLOOR.test(norm(t)))
      const allowWeak = !perFloor
      const claims =
        residential && !multiUnit
          ? texts.flatMap(layoutClaims).filter((c) => c.strong || allowWeak)
          : []
      const strong = claims.filter((c) => c.strong && c.beds !== undefined)
      const pool = strong.length ? strong : claims.filter((c) => c.beds !== undefined)
      const bedVals = new Set(pool.map((c) => c.beds))
      const roomVals = new Set(pool.map((c) => c.rooms))
      const problems: string[] = []
      if (bedVals.size === 1) {
        const c = pool[0]
        const beds = c.beds!
        if (typeof p.bedrooms === 'number' && p.bedrooms !== beds)
          problems.push(`bedrooms=${p.bedrooms}`)
        if (
          c.rooms !== undefined &&
          roomVals.size === 1 &&
          typeof p.rooms === 'number' &&
          p.rooms !== c.rooms
        )
          problems.push(`rooms=${p.rooms}`)
        if (c.rooms === undefined && typeof p.rooms === 'number' && p.rooms < beds)
          problems.push(`rooms=${p.rooms}`)
        if (problems.length) {
          const expect =
            c.rooms !== undefined ? `bedrooms ${beds}, rooms ${c.rooms}` : `bedrooms ${beds}`
          add('rooms', p, `text "${clip(c.phrase, 30)}" → ${expect}; fields ${problems.join(', ')}`)
        }
      }
      // Russian N-комнатная (rooms only), checked on its own.
      const ruRooms = claims.filter((c) => c.beds === undefined && c.rooms !== undefined)
      const ruVals = new Set(ruRooms.map((c) => c.rooms))
      if (
        !problems.length &&
        ruVals.size === 1 &&
        typeof p.rooms === 'number' &&
        p.rooms !== ruRooms[0].rooms
      ) {
        // Only when no N+1 claim says otherwise (N+1 already gives rooms).
        if (!(bedVals.size === 1 && pool[0].rooms === p.rooms)) {
          add(
            'rooms',
            p,
            `text "${clip(ruRooms[0].phrase, 30)}" → rooms ${ruRooms[0].rooms}; fields rooms=${p.rooms}, bedrooms=${p.bedrooms ?? '—'}`,
          )
        }
      }
    }

    // ---- 3. Area / price ---------------------------------------------------
    const type = p.type || '?'
    const area = typeof p.area === 'number' && p.area > 0 ? p.area : null
    if (!area)
      add(
        'area-missing',
        p,
        `type ${type}; area ${p.area ?? 'empty'}; plotArea ${p.plotArea ?? '—'}`,
      )
    else {
      const RANGES: Record<string, [number, number]> = {
        apartment: [20, 400],
        penthouse: [30, 600],
        studio: [15, 80],
        house: [40, 2000],
        villa: [40, 2000],
        land: [50, Infinity],
        'commercial-space': [10, Infinity],
        office: [10, Infinity],
      }
      const r = RANGES[type]
      if (r && (area < r[0] || area > r[1]))
        add(
          'area-range',
          p,
          `type ${type}; area ${area} m² (range ${r[0]}-${r[1] === Infinity ? '∞' : r[1]})`,
        )
      const residential = ['apartment', 'penthouse', 'studio', 'house', 'villa'].includes(type)
      const roomCount =
        typeof p.rooms === 'number' && p.rooms > 0
          ? p.rooms
          : typeof p.bedrooms === 'number'
            ? p.bedrooms + 1
            : null
      if (residential && roomCount) {
        const per = area / roomCount
        if (per < 10 || (per > 150 && (type === 'apartment' || type === 'studio')))
          add(
            'area-per-room',
            p,
            `type ${type}; ${area} m² / ${roomCount} rooms = ${Math.round(per)} m² per room`,
          )
      }
    }
    if (typeof p.price === 'number' && p.price > 0) {
      const perSqm = p.priceUnit === 'per-sqm'
      if (perSqm && p.price > 20000)
        add('price-unit', p, `priceUnit per-sqm but price ${p.price} €`)
      if (!perSqm && type !== 'land' && p.price < 15000)
        add('price-unit', p, `type ${type}; total price ${p.price} € (area ${area ?? '—'} m²)`)
      const ppm = perSqm ? p.price : area ? p.price / area : null
      if (ppm !== null) {
        const BANDS: Record<string, [number, number]> = {
          apartment: [300, 10000],
          studio: [300, 10000],
          penthouse: [300, 10000],
          house: [150, 10000],
          villa: [150, 10000],
          'commercial-space': [150, 15000],
          office: [150, 15000],
          land: [5, 5000],
        }
        const b = BANDS[type]
        if (b && (ppm < b[0] || ppm > b[1]))
          add(
            'ppm',
            p,
            `type ${type}; ${Math.round(ppm)} €/m² (price ${p.price} ${perSqm ? '€/m²' : '€'}, area ${area ?? '—'} m²; band ${b[0]}-${b[1]})`,
          )
      }
    }

    // ---- 4. Truncation -----------------------------------------------------
    {
      const hits: string[] = []
      for (const l of [...new Set(['en', ml])]) {
        const r = truncation(desc(l))
        if (r) hits.push(`${l}: ${r}`)
      }
      if (hits.length) add('trunc', p, hits.join(' / '))
    }

    // ---- 5. Photos ---------------------------------------------------------
    if (!p.galleryCount) add('photos-none', p, 'gallery empty')
    else if (p.galleryCount < 3) add('photos-few', p, `${p.galleryCount} image(s)`)
    if (p.galleryNoRef || p.galleryBroken)
      add(
        'photos-broken',
        p,
        `${p.galleryNoRef} item(s) without asset ref, ${p.galleryBroken} pointing at a missing asset (of ${p.galleryCount})`,
      )
  }

  // ---- Output ----------------------------------------------------------------
  const count = (k: IssueKey, s?: Source) =>
    findings.get(k)!.filter((f) => !s || f.source === s).length
  const summaryRows = ISSUES.map((i) => [
    i.group,
    i.title,
    String(count(i.key)),
    ...SOURCES.map((s) => String(count(i.key, s))),
  ])
  const distinct = new Set([...findings.values()].flat().map((f) => f.id))

  // stdout
  const header = ['Issue', 'Total', ...SOURCES]
  const widths = [64, 6, 7, 6, 8, 6]
  const line = (cells: string[]) =>
    cells.map((c, i) => (i === 0 ? c.padEnd(widths[i]) : c.padStart(widths[i]))).join(' ')
  console.log(
    `Checked ${props.length} public sale listings (${SOURCES.map((s) => `${s} ${bySource[s]}`).join(', ')})`,
  )
  console.log(line(header))
  for (const r of summaryRows)
    console.log(line([clip(`${r[0].split('.')[0]}. ${r[1]}`, 64), ...r.slice(2)]))
  console.log(`Listings with at least one finding: ${distinct.size}`)
  const locLine = `Location context: ${locStats.ownNamed} descriptions name their own city/district, ${locStats.noPlace} name no place at all, ${locStats.ownPlusForeign} name another place next to their own (not flagged).`
  console.log(locLine)

  // markdown
  const pad = (n: number) => String(n).padStart(2, '0')
  const ymd = `${runAt.getFullYear()}-${pad(runAt.getMonth() + 1)}-${pad(runAt.getDate())}` // local date
  const md: string[] = []
  md.push(`# Listing validation — ${ymd}`)
  md.push('')
  md.push(
    `Run: ${runAt.toISOString()} · \`npx tsx scripts/validateListings.ts\` · read-only, nothing was changed.`,
  )
  md.push('')
  md.push(
    `Scope: public sale listings (\`isPublished == true\`, lifecycle active or unset, \`status == "sale"\`, published documents) — **${props.length}** checked.`,
  )
  md.push('')
  md.push('| Source | Listings | Main locale |')
  md.push('|---|---:|---|')
  for (const s of SOURCES) md.push(`| ${s} | ${bySource[s]} | ${mainLocale(s)} |`)
  md.push('')
  md.push(`Listings with at least one finding: **${distinct.size}**.`)
  md.push('')
  md.push(locLine)
  md.push('')
  md.push('## Summary')
  md.push('')
  md.push(`| Group | Issue | Total | ${SOURCES.join(' | ')} |`)
  md.push(`|---|---|---:|${SOURCES.map(() => '---:').join('|')}|`)
  for (const r of summaryRows) md.push(`| ${r.map(mdCell).join(' | ')} |`)
  md.push('')
  let lastGroup = ''
  for (const i of ISSUES) {
    if (i.group !== lastGroup) {
      md.push(`## ${i.group}`)
      md.push('')
      lastGroup = i.group
    }
    const list = findings.get(i.key)!
    md.push(`### ${i.title} — ${list.length}`)
    md.push('')
    md.push(`Rule: ${i.rule}`)
    md.push('')
    md.push(`By source: ${SOURCES.map((s) => `${s} ${count(i.key, s)}`).join(', ')}.`)
    md.push('')
    if (!list.length) {
      md.push('_None._')
      md.push('')
      continue
    }
    md.push(list.length > 50 ? `First 50 of ${list.length}:` : `All ${list.length}:`)
    md.push('')
    md.push('| Listing | Source | Evidence |')
    md.push('|---|---|---|')
    for (const f of list.slice(0, 50))
      md.push(`| \`${f.id}\` | ${f.source} | ${mdCell(f.evidence)} |`)
    md.push('')
  }
  const outPath = path.resolve(process.cwd(), 'reports', `listing-validation-${ymd}.md`)
  fs.mkdirSync(path.dirname(outPath), {recursive: true})
  fs.writeFileSync(outPath, md.join('\n'), 'utf8')
  console.log(`Report: ${path.relative(process.cwd(), outPath)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
