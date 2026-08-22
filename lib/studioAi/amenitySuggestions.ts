/**
 * The amenity review queue's decision layer — pure, so every guard is testable
 * without a dataset. See
 * docs/engineering/SPEC-amenity-queue-and-slug-collisions-2026-08-22.md.
 *
 * Nothing here creates taxonomy. It turns "the parser used a word we do not
 * know" into a row a person can act on, and refuses everything that does not
 * look like an amenity name in the first place.
 */

/** One listing cannot flood the queue, however creative the parse. */
export const MAX_SUGGESTIONS_PER_PARSE = 8

const MIN_LENGTH = 2
const MAX_LENGTH = 60
/** Letters (any script), digits, spaces and the punctuation real names use. */
const ALLOWED = /^[\p{L}\p{N} .,&/'’-]+$/u
/** Four or more digits in a row is a phone number or a price, not an amenity. */
const DIGIT_RUN = /\d[\d\s()-]{3,}/

export type NormalizedSuggestion =
  | {ok: true; name: string; normalized: string}
  | {ok: false; reason: 'shape'}

/** Case-, diacritic- and separator-blind key — the same folding the bot's matcher uses. */
function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

export function normalizeSuggestion(raw: string): NormalizedSuggestion {
  const name = (raw ?? '').replace(/\s+/g, ' ').trim()
  if (name.length < MIN_LENGTH || name.length > MAX_LENGTH) return {ok: false, reason: 'shape'}
  if (!ALLOWED.test(name)) return {ok: false, reason: 'shape'}
  if (!/\p{L}/u.test(name)) return {ok: false, reason: 'shape'}
  if (DIGIT_RUN.test(name)) return {ok: false, reason: 'shape'}
  const normalized = fold(name)
  if (!normalized) return {ok: false, reason: 'shape'}
  return {ok: true, name, normalized}
}

/**
 * Deterministic id: recording a hit becomes createIfNotExists + inc(count),
 * with no read and no race, and the same wording from two editors lands on one
 * row.
 */
export function suggestionId(normalized: string): string {
  return `amenity-suggestion-${normalized}`
}

/** The endpoint reports misses as `amenity "Sauna"`, mixed in with cities and districts. */
export function unmatchedAmenityNames(unmatched: readonly string[]): string[] {
  const out: string[] = []
  for (const entry of unmatched) {
    const m = /^amenity\s+"(.+)"$/.exec(entry ?? '')
    if (m && m[1]!.trim()) out.push(m[1]!)
  }
  return out
}

/** How many listing titles a suggestion keeps as context for the reviewer. */
export const MAX_EXAMPLES = 5

export type SuggestionDraft = {
  _id: string
  _type: 'amenitySuggestion'
  name: string
  normalized: string
  /**
   * Zero on creation: the write is createIfNotExists followed by an
   * unconditional inc, so the first hit lands on 1 and the same code path
   * serves every later hit.
   */
  count: number
  status: 'new'
  firstSeen: string
  lastSeen: string
  examples: string[]
}

/**
 * `known` is every name the matcher already answers to — amenity titles, slugs
 * and aliases. A wording that folds to one of them is not queued: the matcher
 * would have taken it, and queueing it would ask a reviewer to decide something
 * already decided.
 *
 * Returns the documents to upsert, plus the names refused on shape so the
 * dialog can say they were dropped rather than losing them quietly.
 */
export function buildSuggestionDrafts(
  names: readonly string[],
  known: readonly string[],
  ctx: {now: string; example?: string},
): {drafts: SuggestionDraft[]; dropped: string[]} {
  const knownKeys = new Set(known.map(fold).filter(Boolean))
  const seen = new Set<string>()
  const drafts: SuggestionDraft[] = []
  const dropped: string[] = []

  for (const raw of names) {
    if (drafts.length >= MAX_SUGGESTIONS_PER_PARSE) break
    const n = normalizeSuggestion(raw)
    if (!n.ok) {
      dropped.push(raw)
      continue
    }
    if (knownKeys.has(n.normalized) || seen.has(n.normalized)) continue
    seen.add(n.normalized)
    drafts.push({
      _id: suggestionId(n.normalized),
      _type: 'amenitySuggestion',
      name: n.name,
      normalized: n.normalized,
      count: 0,
      status: 'new',
      firstSeen: ctx.now,
      lastSeen: ctx.now,
      examples: [],
    })
  }

  return {drafts, dropped}
}

export type SuggestionWrite = {
  /** Applied with createIfNotExists — an existing row is left exactly as it is. */
  create: SuggestionDraft
  /** Always applied: the count and the freshness are what the queue is ranked by. */
  incCount: 1
  lastSeen: string
  /** Absent when the row already holds this title, or already holds five. */
  appendExample?: string
}

/**
 * Turns the drafts into the writes an upsert needs, given what the dataset
 * already holds for those ids. Kept pure so the "don't append a sixth example,
 * don't append the same title twice" rules are tested rather than trusted.
 */
export function planSuggestionWrites(
  drafts: readonly SuggestionDraft[],
  existing: ReadonlyMap<string, {examples?: string[] | null}>,
  ctx: {now: string; example?: string},
): SuggestionWrite[] {
  return drafts.map((create) => {
    const current = existing.get(create._id)
    const examples = current?.examples ?? []
    const appendExample =
      ctx.example && examples.length < MAX_EXAMPLES && !examples.includes(ctx.example) ? ctx.example : undefined
    return {create, incCount: 1, lastSeen: ctx.now, ...(appendExample ? {appendExample} : {})}
  })
}
