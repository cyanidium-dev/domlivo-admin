/**
 * Pure helpers for the ТЗ-16 backfill (`scripts/backfillRelatedPagesSections.ts`),
 * extracted so the comparison-fingerprint matcher — the one piece of logic that
 * could destroy editor content if it over-matched — is unit-tested (audit F-2).
 */

export type SectionLite = Record<string, unknown> & {_key?: string; _type?: string}

/** Order-insensitive tag comparison; `undefined` never equals a concrete list. */
export function sameTags(a: string[] | undefined, b: string[]): boolean {
  if (!Array.isArray(a) || a.length !== b.length) return false
  const set = new Set(a)
  return b.every((t) => set.has(t))
}

export function relatedSection(
  key: string,
  mode: string,
  extra?: Record<string, unknown>,
): SectionLite {
  return {_key: key, _type: 'relatedPagesAutoSection', enabled: true, mode, limit: 6, ...(extra ?? {})}
}

/** Insert before a trailing ctaSection (the generators' convention), else append. */
export function insertSections(sections: SectionLite[], toInsert: SectionLite[]): SectionLite[] {
  const last = sections[sections.length - 1]
  if (last?._type === 'ctaSection') return [...sections.slice(0, -1), ...toInsert, last]
  return [...sections, ...toInsert]
}

/**
 * The generator's manual sibling block, and nothing else: a
 * `landingCollectionSection` in `mode: 'manual'` whose every ref starts with
 * `landing-comparison-`. Anything that fails any predicate is editor content
 * and must never be replaced.
 */
export function isGeneratorSiblingBlock(s: SectionLite): boolean {
  if (s._type !== 'landingCollectionSection') return false
  if ((s as {mode?: string}).mode !== 'manual') return false
  const items = (s as {manualItems?: Array<{_ref?: string}>}).manualItems
  if (!Array.isArray(items) || items.length === 0) return false
  return items.every((m) => typeof m?._ref === 'string' && m._ref.startsWith('landing-comparison-'))
}
