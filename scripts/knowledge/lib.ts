/**
 * Shared helpers for importing the research knowledge base
 * (`DomLivo Research Department/knowledge-base/12-ai-database`) into Sanity.
 *
 * The research repo is the authoring surface: markdown documents with tables,
 * plus `data/sources.json` and `data/facts.json` produced by its own build
 * script. These importers turn that into `knowledgeSource` / `knowledgeFact` /
 * `knowledgeArticle` documents with deterministic ids, so re-running an import
 * updates in place instead of duplicating.
 */
import fs from 'node:fs'
import path from 'node:path'

/** Where the research repo lives. Override with KNOWLEDGE_DIR when it moves. */
export function knowledgeDir(): string {
  const fromEnv = process.env.KNOWLEDGE_DIR?.trim()
  if (fromEnv) return fromEnv
  return path.resolve(
    process.cwd(),
    '../../Claude/Projects/DomLivo Research Department/knowledge-base/12-ai-database',
  )
}

export function readJson<T>(relative: string): T {
  const full = path.join(knowledgeDir(), relative)
  if (!fs.existsSync(full)) {
    throw new Error(`Not found: ${full}\nSet KNOWLEDGE_DIR to the 12-ai-database folder.`)
  }
  return JSON.parse(fs.readFileSync(full, 'utf8')) as T
}

/* ------------------------------------------------------------------ ids --- */

/** Sanity ids allow [A-Za-z0-9._-]; our keys already do, but be defensive. */
const safe = (value: string) => value.trim().replace(/[^A-Za-z0-9._-]/g, '-')

export const sourceDocId = (sourceId: string) => `knowledge.source.${safe(sourceId)}`
export const factDocId = (dataId: string) => `knowledge.fact.${safe(dataId)}`
export const articleDocId = (documentId: string) => `knowledge.article.${safe(documentId)}`

export const DATA_ID_RE = /\bDATA-[A-Z0-9]+(?:-[A-Z0-9]+)*\b/g
/**
 * Source ids end in exactly three digits (ELEC-ALB-2026-001, APPLIANCE-001).
 * Insisting on the three-digit tail is what stops INSTAT release codes quoted
 * in the same sentence — T4-2025, TR4-2025 — from being read as citations and
 * turned into references to documents that do not exist.
 */
export const SOURCE_ID_RE = /\b[A-Z][A-Z0-9]*(?:-[A-Z0-9]+){0,3}-\d{3}\b(?!\d)/g

/* -------------------------------------------------------------- parsing --- */

/**
 * First number in a string, tolerating thousands separators, ranges and units
 * ("1,280,000–2,180,000 ALL" → 1280000; "≈2.5%" → 2.5). Returns null when the
 * string carries no figure at all, which is normal for rule-shaped facts.
 */
export function firstNumber(text: string | undefined | null): number | null {
  if (!text) return null
  const match = stripNonQuantities(text).match(
    /-?\d{1,3}(?:[,\s]\d{3})+(?:\.\d+)?|-?\d+(?:\.\d+)?/,
  )
  if (!match) return null
  const value = Number(match[0].replace(/[,\s]/g, ''))
  return Number.isFinite(value) ? value : null
}

/**
 * Strips the digits that are labels rather than quantities, before any number
 * is read out of a sentence.
 *
 * Albanian apartment typology is written "1+1", "2+1", "3+1" — bedrooms plus
 * living room — and rent facts routinely open with it ("1+1 avg 590 EUR/month;
 * 2+1 avg 954"). Scanning for the first number then records a monthly rent of
 * 1. Dates are removed for the same reason.
 */
function stripNonQuantities(text: string): string {
  return String(text)
    .replace(/[\u00a0\u202f]/g, ' ')
    .replace(/\b\d\s*\+\s*\d\b/g, ' ')
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' ')
}


/**
 * The number a fact *states*, as opposed to the first number that happens to
 * appear in its prose.
 *
 * Research values are written value-first ("70 lek/m³ water supply, household,
 * Durrës"), so a figure that is not at the front is almost always something
 * else: a quarter ("Q3-2022"), a half-year ("H2-2025"), a sample size ("n=18"),
 * a floor ("6th floor"). Reading those as the value produced rents of 3 and 18
 * euro a month. When the text does not open with a quantity we store no number
 * at all and let `valueText` carry the meaning — an empty field is recoverable,
 * a plausible wrong one is not.
 */
export function leadingNumber(text: string | undefined | null): number | null {
  if (!text) return null
  const cleaned = stripNonQuantities(text).trimStart()
  const opening = cleaned.match(
    /^(?:[≈~<>+]|from|about|approx\.?|avg\.?|average|circa|ca\.?|up to|under|over|[€$£]|EUR|ALL|USD)?\s*[€$£]?\s*(-?\d{1,3}(?:[,\s]\d{3})+(?:\.\d+)?|-?\d+(?:\.\d+)?)/i,
  )
  if (!opening) return null
  const value = Number(opening[1].replace(/[,\s]/g, ''))
  return Number.isFinite(value) ? value : null
}

/**
 * The first number in the text that is actually a quantity — one standing next
 * to its unit.
 *
 * `leadingNumber` is strict about position and misses the many research values
 * written place-first ("Tirana (UK Tiranë sh.a): household water 65 lek/m³").
 * Adjacency to a unit is the better signal, and the one that keeps the
 * impostors out: a quarter (Q3-2022), a half-year (H2-2025), a sample size
 * (n=18) and a floor (6th floor) are never followed by a currency or a unit.
 */
const UNIT_AFTER =
  /^\s*(?:%|EUR|€|ALL|lek[ëe]?|USD|\$|GBP|£|kWh|kW|kVArh|m²|m2|m³|m3|ha|km|L\b|litre|litres|liter|nights?|persons?|BTU|bd|ba|months?|years?|days?|h\/day|hours?|\/\s*(?:m²|m2|m³|m3|month|night|year|day|kWh|person))/i

/** Something that makes the digits a label rather than a measurement. */
const LABEL_BEFORE = /(?:\bn\s*=\s*|\bnr?\.?\s*|\bno\.?\s*|\bQ|\bH|\bT|\b#)$/i

export function firstQuantity(text: string | undefined | null): number | null {
  if (!text) return null
  const cleaned = stripNonQuantities(text)
  const pattern = /-?\d{1,3}(?:[,\s]\d{3})+(?:\.\d+)?|-?\d+(?:\.\d+)?/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(cleaned)) !== null) {
    const before = cleaned.slice(Math.max(0, match.index - 4), match.index)
    if (LABEL_BEFORE.test(before)) continue
    const after = cleaned.slice(match.index + match[0].length)
    // A currency can sit on either side: "€340" as well as "340 EUR".
    const currencyBefore = /[€$£]\s*$/.test(before)
    if (!currencyBefore && !UNIT_AFTER.test(after)) continue
    const value = Number(match[0].replace(/[,\s]/g, ''))
    if (Number.isFinite(value)) return value
  }
  return null
}

/** Both ends of a range when the text has one ("200–300 EUR/m²" → [200, 300]). */
export function rangeBounds(text: string | undefined | null): [number, number] | null {
  if (!text) return null
  const match = stripNonQuantities(text).match(
    /(-?\d{1,3}(?:[,\s]\d{3})+(?:\.\d+)?|-?\d+(?:\.\d+)?)\s*(?:–|—|-|to|…)\s*(-?\d{1,3}(?:[,\s]\d{3})+(?:\.\d+)?|-?\d+(?:\.\d+)?)/,
  )
  if (!match) return null
  const low = Number(match[1].replace(/[,\s]/g, ''))
  const high = Number(match[2].replace(/[,\s]/g, ''))
  if (!Number.isFinite(low) || !Number.isFinite(high) || high < low) return null
  return [low, high]
}

const CURRENCIES = ['ALL', 'EUR', 'USD', 'GBP', 'LEK'] as const

/** "8.5 ALL/kWh" → {value: 8.5, currency: 'ALL'}; LEK is normalised to ALL. */
export function parseOriginal(text: string | undefined | null): {
  value: number | null
  currency: string | null
} {
  if (!text) return {value: null, currency: null}
  const upper = String(text).toUpperCase()
  const currency = CURRENCIES.find((c) => upper.includes(c)) ?? null
  return {
    value: firstNumber(text),
    currency: currency === 'LEK' ? 'ALL' : currency,
  }
}

/**
 * Confidence as researched can be hedged ("MEDIUM-HIGH", "HIGH (tariff) /
 * MEDIUM (coverage)", "LOW-MEDIUM"). We keep the *weaker* end: a fact that is
 * only partly solid should not be quoted as solid.
 */
export function normalizeConfidence(raw: string | undefined | null): string {
  const text = String(raw || '').toUpperCase()
  if (!text) return 'LOW'
  if (text.includes('FORECAST')) return 'FORECAST'
  if (text.includes('ESTIMATE')) return 'ESTIMATE'
  if (text.includes('LOW')) return 'LOW'
  if (text.includes('MEDIUM')) return 'MEDIUM'
  if (text.includes('HIGH')) return 'HIGH'
  return 'LOW'
}

const DATA_KIND_RULES: Array<[RegExp, string]> = [
  [/tariff|regulated|tax rate|rate card/i, 'tariff'],
  [/tax[_ ]?rate/i, 'tax_rate'],
  [/reference/i, 'reference_price'],
  [/transaction/i, 'transaction_price'],
  [/achieved[_ ]?rent/i, 'achieved_rent'],
  [/advertised[_ ]?rent|advertised/i, 'advertised_rent'],
  [/asking/i, 'asking_price'],
  [/model[_ ]?estimate/i, 'model_estimate'],
  [/forecast/i, 'forecast'],
  [/spec|datasheet/i, 'spec'],
  [/fee/i, 'fee'],
  [/survey/i, 'survey'],
  [/estimate|derived|calculated/i, 'model_estimate'],
  [/statistic|statistics/i, 'statistic'],
]

export function normalizeDataKind(raw: string | undefined | null, dataId = ''): string {
  const text = String(raw || '')
  for (const [re, value] of DATA_KIND_RULES) {
    if (re.test(text)) return value
  }
  if (/^DATA-(TAX)/.test(dataId)) return 'tax_rate'
  if (/^DATA-(ELEC|WATER|GAS|INTERNET)/.test(dataId)) return 'tariff'
  if (/^DATA-(AC|BOILER|APPLIANCE)/.test(dataId)) return 'spec'
  return 'statistic'
}

/** data_id family → taxonomy category. */
const CATEGORY_BY_FAMILY: Array<[RegExp, string]> = [
  [/^DATA-ELEC/, 'electricity'],
  [/^DATA-GAS/, 'gas'],
  [/^DATA-HEAT/, 'heating'],
  [/^DATA-AC/, 'air_conditioning'],
  [/^DATA-BOILER/, 'heating'],
  [/^DATA-CLIMATE/, 'climate'],
  [/^DATA-APPLIANCE/, 'appliances'],
  [/^DATA-WATERUSE/, 'water'],
  [/^DATA-WATER/, 'water'],
  [/^DATA-WASTE/, 'building_fees'],
  [/^DATA-INTERNET/, 'internet'],
  [/^DATA-BUILDING/, 'building_fees'],
  [/^DATA-SERVICE/, 'cleaning'],
  [/^DATA-PROPERTY/, 'property_prices'],
  [/^DATA-RENT/, 'long_term_rental'],
  [/^DATA-STR/, 'short_term_rental'],
  [/^DATA-PLATFORM/, 'short_term_rental'],
  [/^DATA-MGMT/, 'property_management'],
  [/^DATA-REG/, 'legal'],
  [/^DATA-INSTAT/, 'tourism'],
  [/^DATA-TAX/, 'taxes'],
  [/^DATA-PURCHASE/, 'purchase_costs'],
  [/^DATA-RENOV/, 'renovation'],
  [/^DATA-FURN/, 'furniture'],
  [/^DATA-MACRO/, 'macro'],
  [/^DATA-TOURISM/, 'tourism'],
  [/^DATA-FORECAST/, 'forecast'],
]

export function categoryFor(dataId: string): string {
  for (const [re, category] of CATEGORY_BY_FAMILY) {
    if (re.test(dataId)) return category
  }
  return 'market_analysis'
}

/** DATA-RENT-DURRES-0017 → DATA-RENT-DURRES (drops the running number). */
export function factFamily(dataId: string): string {
  return dataId.replace(/-\d{3,4}$/, '')
}

/**
 * City slugs as they exist in the catalog. Sub-markets that are not separate
 * catalog cities (Golem, Ksamil) resolve to their parent so a district page can
 * still pick the facts up; the free-text `geography` keeps the precise place.
 */
const CITY_KEYS: Array<[string, RegExp]> = [
  ['durres', /durr[\u00ebe]s|golem|kavaj[\u00ebe]|shk[\u00ebe]mb|plazh|lal[\u00ebe]z|lura|mali i robit|currila|spitall|shkozet|vollga/i],
  ['vlore', /vlor[\u00ebe]|lungomare|orikum|radhim[\u00ebe]|uji i ftoht|skel[\u00ebe]/i],
  // Himar\u00eb is its own catalog city, and the Riviera villages sit in it.
  ['himare', /himar[\u00ebe]|dh[\u00ebe]rmi|palas[\u00ebe]|green coast|jal[\u00ebe]|borsh/i],
  ['sarande', /sarand[\u00ebe]|ksamil|butrint/i],
  ['tirana', /tiran[\u00eba]|blloku|kashar|fark[\u00ebe]|yzberisht|kombinat|astir|paskuqan|kam[\u00ebe]z/i],
  ['shengjin', /sh[\u00ebe]ngjin|lezh[\u00ebe]|velipoj[\u00ebe]|kune|rana e hedhun/i],
]

export function citySlugFor(...texts: Array<string | undefined | null>): string | null {
  const joined = texts.filter(Boolean).join(' ')
  if (!joined) return null
  if (/^albania$/i.test(joined.trim())) return null
  for (const [slug, re] of CITY_KEYS) {
    if (re.test(joined)) return slug
  }
  return null
}

const SEASONS = new Set([
  'annual', 'winter', 'summer', 'shoulder', 'peak', 'low',
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
])

export function normalizeSeason(raw: string | undefined | null): string {
  const text = String(raw || '').toLowerCase().trim()
  if (!text) return 'annual'
  const first = text.split(/[\s,;/(]/)[0]
  if (SEASONS.has(first)) return first
  if (/winter|dimër|dec|jan|feb/.test(text)) return 'winter'
  if (/summer|peak|jul|aug/.test(text)) return 'summer'
  if (/shoulder/.test(text)) return 'shoulder'
  return 'annual'
}

export function normalizePropertyType(raw: string | undefined | null): string {
  const text = String(raw || '').toLowerCase()
  if (/3\s*\+\s*1/.test(text)) return '3+1'
  if (/2\s*\+\s*1/.test(text)) return '2+1'
  if (/1\s*\+\s*1/.test(text)) return '1+1'
  if (/studio|garsonier/.test(text)) return 'studio'
  if (/penthouse/.test(text)) return 'penthouse'
  if (/villa/.test(text)) return 'villa'
  if (/commercial/.test(text)) return 'commercial'
  if (/land|truall/.test(text)) return 'land'
  return 'any'
}

/** ISO date out of anything date-shaped; undated live pages return null. */
export function isoDate(raw: string | undefined | null): string | null {
  if (!raw) return null
  const text = String(raw)
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
  if (iso) return iso[0]
  const month = text.match(/\b(\d{4})-(\d{2})\b/)
  if (month) return `${month[1]}-${month[2]}-01`
  const year = text.match(/\b(20\d{2})\b/)
  if (year) return `${year[1]}-01-01`
  return null
}

/** Short machine name for a fact, derived from its human title. */
export function metricFrom(title: string, dataId: string): string {
  const base = (title || '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .split('_')
    .filter(Boolean)
    .slice(0, 8)
    .join('_')
  return base || factFamily(dataId).toLowerCase().replace(/-/g, '_')
}

/* ------------------------------------------------------- portable text --- */

let keyCounter = 0
export const nextKey = (prefix = 'k') => `${prefix}${(keyCounter += 1).toString(36)}`

type Span = {_type: 'span'; _key: string; text: string; marks: string[]}

/** Inline markdown → spans. Handles **bold**, `code` and [text](url) links. */
function inlineSpans(text: string): {children: Span[]; markDefs: unknown[]} {
  const markDefs: unknown[] = []
  const children: Span[] = []
  const pattern = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  const push = (value: string, marks: string[]) => {
    if (!value) return
    children.push({_type: 'span', _key: nextKey('s'), text: value, marks})
  }
  while ((match = pattern.exec(text)) !== null) {
    push(text.slice(lastIndex, match.index), [])
    if (match[1]) push(match[1], ['strong'])
    else if (match[2]) push(match[2], ['code'])
    else if (match[3]) {
      const key = nextKey('link')
      markDefs.push({_type: 'link', _key: key, href: match[4]})
      push(match[3], [key])
    }
    lastIndex = pattern.lastIndex
  }
  push(text.slice(lastIndex), [])
  if (children.length === 0) push(text, [])
  return {children, markDefs}
}

export type PortableBlock = Record<string, unknown>

/** Markdown paragraphs, h3/h4 headings and bullet lists → Portable Text. */
export function markdownToBlocks(markdown: string): PortableBlock[] {
  const blocks: PortableBlock[] = []
  const lines = markdown.split('\n')
  let paragraph: string[] = []

  const flush = () => {
    const text = paragraph.join(' ').trim()
    paragraph = []
    if (!text) return
    const {children, markDefs} = inlineSpans(text)
    blocks.push({_type: 'block', _key: nextKey('b'), style: 'normal', markDefs, children})
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    if (!line.trim()) {
      flush()
      continue
    }
    const heading = line.match(/^(#{3,4})\s+(.*)$/)
    if (heading) {
      flush()
      const {children, markDefs} = inlineSpans(heading[2].trim())
      blocks.push({
        _type: 'block',
        _key: nextKey('b'),
        style: heading[1].length === 3 ? 'h3' : 'h4',
        markDefs,
        children,
      })
      continue
    }
    const bullet = line.match(/^\s*[-*]\s+(.*)$/)
    if (bullet) {
      flush()
      const {children, markDefs} = inlineSpans(bullet[1].trim())
      blocks.push({
        _type: 'block',
        _key: nextKey('b'),
        style: 'normal',
        listItem: 'bullet',
        level: 1,
        markDefs,
        children,
      })
      continue
    }
    paragraph.push(line.trim())
  }
  flush()
  return blocks
}

export function localizedString(en: string | undefined): {_type: 'localizedString'; en: string} | undefined {
  const value = (en || '').trim()
  return value ? {_type: 'localizedString', en: value} : undefined
}

export function localizedText(en: string | undefined): {_type: 'localizedText'; en: string} | undefined {
  const value = (en || '').trim()
  return value ? {_type: 'localizedText', en: value} : undefined
}

/* -------------------------------------------------------------- runtime --- */

export function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

export function logTable(rows: Array<[string, string | number]>): void {
  const width = Math.max(...rows.map(([label]) => label.length))
  for (const [label, value] of rows) {
    console.log(`  ${label.padEnd(width)}  ${value}`)
  }
}
