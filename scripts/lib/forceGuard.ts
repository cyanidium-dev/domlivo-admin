/**
 * `--force` guard for the landing generators (sweep 2026-09-05, F4).
 *
 * Every generator writes a landing once and then leaves it alone; `--force`
 * replaces it wholesale. Since ТЗ-16 (related-pages blocks), the district FAQs
 * (2026-09-03) and the hero trust lines, live landings carry sections the
 * generators never emit — so `--verify` reports every page as edited and a
 * `--force` run would silently drop that work. This module names what would
 * be lost, so the generators can refuse unless the caller accepts it.
 */
export type SectionLike = {_type?: string; _key?: string}

export type DroppedSection = {id: string; type: string; key: string}

/** Sections present on the live document that the built document does not contain (by `_key`, falling back to type). */
export function droppedSections(id: string, live: SectionLike[] | undefined, built: SectionLike[] | undefined): DroppedSection[] {
  const liveArr = Array.isArray(live) ? live : []
  const builtArr = Array.isArray(built) ? built : []
  const builtKeys = new Set(builtArr.map((s) => String(s?._key ?? '')).filter(Boolean))
  const builtTypes = new Set(builtArr.map((s) => String(s?._type ?? '')).filter(Boolean))
  const out: DroppedSection[] = []
  for (const s of liveArr) {
    const key = String(s?._key ?? '')
    const type = String(s?._type ?? '')
    if (!type) continue
    const kept = key ? builtKeys.has(key) : builtTypes.has(type)
    if (!kept) out.push({id, type, key})
  }
  return out
}

/** One line per document for the console; empty string when nothing would be dropped. */
export function formatDrops(drops: DroppedSection[]): string {
  if (!drops.length) return ''
  const byId = new Map<string, string[]>()
  for (const d of drops) byId.set(d.id, [...(byId.get(d.id) ?? []), `${d.type}${d.key ? `[${d.key}]` : ''}`])
  return Array.from(byId.entries())
    .map(([id, secs]) => `  ${id}: would drop ${secs.join(', ')}`)
    .join('\n')
}

export const ACCEPT_DROPS_FLAG = '--accept-drops'

/**
 * Returns true when the run may proceed. Prints the drops and the instruction
 * when it may not. `--force` without drops is unchanged; `--force` with drops
 * needs `--accept-drops` too.
 */
export function forceMayProceed(drops: DroppedSection[], args: readonly string[]): boolean {
  if (!drops.length) return true
  if (args.includes(ACCEPT_DROPS_FLAG)) {
    console.log(`\n⚠ ${ACCEPT_DROPS_FLAG}: replacing and dropping the sections below.\n${formatDrops(drops)}`)
    return true
  }
  console.log(
    `\n✖ --force refused: the live landings carry sections this generator does not emit ` +
      `(related-pages blocks, FAQs, hero lines added after generation).\n${formatDrops(drops)}\n` +
      `  Re-run with ${ACCEPT_DROPS_FLAG} to replace them anyway, or edit the documents in Studio.`,
  )
  return false
}
