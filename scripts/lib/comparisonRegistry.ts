/**
 * ТЗ-12 — the comparison registry: which "X vs Y" pages exist and what each one
 * is actually arguing.
 *
 * Comparisons are bridges between clusters (`10-seo/seo-map.md` §6). A page that
 * only restates two price bands is not a comparison — the reader already has
 * both zone pages. What makes it worth writing is the *verdict*: who each place
 * suits, and where the obvious assumption is wrong. The knowledge base's own
 * example is Sarandë vs Ksamil, whose point is that Ksamil costs more and
 * yields less.
 *
 * So the config carries the argument, and the generator carries the figures:
 * numbers come from `zoneMetrics` at build time and are never copied here,
 * because a hand-typed price in a config file is a number that goes stale
 * silently. That is the same rule the district landings follow.
 */

export const LOCALES = ['en', 'uk', 'ru', 'sq', 'it'] as const
export type Locale = (typeof LOCALES)[number]
export type Localized = Record<Locale, string>

/** `zones` compares two documents we hold metrics for; `external` compares
 *  Albania with somewhere we do not model, so it has no auto price table. */
export type ComparisonKind = 'zones' | 'external'

export type Side = {
  /** Zone slug for `zones`; a free label for `external`. */
  slug: string
  type: 'city' | 'district' | 'external'
  /** Display name per locale. For a zone this should match its document title. */
  title: Localized
}

/** One row of the non-numeric table: season, buyer, risk, and so on. */
export type Criterion = {
  label: Localized
  left: Localized
  right: Localized
}

export type Comparison = {
  slug: string
  kind: ComparisonKind
  left: Side
  right: Side
  /** One sentence: what this page settles that the two zone pages do not. */
  angle: Localized
  /** The verdict per reader. Keys are free-form so a pair can add its own. */
  scenarios: {audience: Localized; verdict: Localized}[]
  criteria: Criterion[]
  /** Slugs of sibling comparisons, for the interlinking block. */
  related: string[]
  kbSource?: string
}

export type ComparisonFile = {comparisons: Comparison[]}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function assertLocalized(value: unknown, where: string, field: string): void {
  if (!value || typeof value !== 'object') {
    throw new Error(`${where}: ${field} must be an object with all five locales`)
  }
  const record = value as Record<string, unknown>
  const missing = LOCALES.filter((l) => typeof record[l] !== 'string' || !record[l])
  if (missing.length) throw new Error(`${where}: ${field} is missing locale(s) ${missing.join(', ')}`)
}

/**
 * Throws on the first structural problem, naming the path. Also enforces the
 * two rules that make the set coherent rather than merely valid: slugs are
 * unique, and `related` points at comparisons that exist — a dead cross-link is
 * worse than no cross-link.
 */
export function parseComparisons(raw: unknown): ComparisonFile {
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as any).comparisons)) {
    throw new Error('comparisons.json: expected a top-level "comparisons" array')
  }
  const list = (raw as ComparisonFile).comparisons
  const seen = new Set<string>()

  for (const c of list) {
    const where = `comparisons/${c?.slug ?? '?'}`
    if (typeof c.slug !== 'string' || !SLUG_RE.test(c.slug)) {
      throw new Error(`${where}: invalid slug`)
    }
    if (seen.has(c.slug)) throw new Error(`duplicate comparison slug "${c.slug}"`)
    seen.add(c.slug)

    if (c.kind !== 'zones' && c.kind !== 'external') {
      throw new Error(`${where}: kind must be "zones" or "external"`)
    }
    for (const [name, side] of [['left', c.left], ['right', c.right]] as const) {
      if (!side || typeof side.slug !== 'string') throw new Error(`${where}: ${name} side is missing`)
      assertLocalized(side.title, `${where}/${name}`, 'title')
      if (c.kind === 'zones' && side.type === 'external') {
        throw new Error(`${where}: a "zones" comparison cannot have an external side`)
      }
      if (c.kind === 'external' && side.type !== 'external' && side.type !== 'city') {
        throw new Error(`${where}: an "external" comparison compares a city with an external place`)
      }
    }
    if (c.left.slug === c.right.slug) throw new Error(`${where}: a place cannot be compared with itself`)

    assertLocalized(c.angle, where, 'angle')
    if (!Array.isArray(c.scenarios) || c.scenarios.length === 0) {
      throw new Error(`${where}: at least one scenario verdict is required — the verdict is the page`)
    }
    for (const [i, s] of c.scenarios.entries()) {
      assertLocalized(s.audience, `${where}/scenario[${i}]`, 'audience')
      assertLocalized(s.verdict, `${where}/scenario[${i}]`, 'verdict')
    }
    if (!Array.isArray(c.criteria)) throw new Error(`${where}: criteria must be an array`)
    for (const [i, k] of c.criteria.entries()) {
      assertLocalized(k.label, `${where}/criteria[${i}]`, 'label')
      assertLocalized(k.left, `${where}/criteria[${i}]`, 'left')
      assertLocalized(k.right, `${where}/criteria[${i}]`, 'right')
    }
    if (!Array.isArray(c.related)) throw new Error(`${where}: related must be an array`)
  }

  for (const c of list) {
    for (const r of c.related) {
      if (!seen.has(r)) throw new Error(`comparisons/${c.slug}: related "${r}" is not a comparison`)
      if (r === c.slug) throw new Error(`comparisons/${c.slug}: cannot relate to itself`)
    }
  }

  return raw as ComparisonFile
}

/** Every zone slug the set needs metrics or documents for. */
export function referencedZoneSlugs(file: ComparisonFile): string[] {
  const out = new Set<string>()
  for (const c of file.comparisons) {
    if (c.kind !== 'zones') continue
    out.add(c.left.slug)
    out.add(c.right.slug)
  }
  return [...out].sort()
}

/** Headline per locale: "{X} or {Y}: which to choose in {year}". */
const TITLE: Record<Locale, string> = {
  en: '{a} or {b}: which to choose in {y}',
  uk: '{a} чи {b}: що обрати у {y}',
  ru: '{a} или {b}: что выбрать в {y}',
  sq: '{a} apo {b}: cilën të zgjidhni në {y}',
  it: '{a} o {b}: quale scegliere nel {y}',
}

export function comparisonTitle(c: Comparison, year: string): Localized {
  const out = {} as Localized
  for (const l of LOCALES) {
    out[l] = TITLE[l]
      .replace('{a}', c.left.title[l])
      .replace('{b}', c.right.title[l])
      .replace('{y}', year)
  }
  return out
}
