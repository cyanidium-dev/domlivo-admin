/**
 * Pure decisions behind translateBlogLead.ts. The English lead was replaced by
 * patch:blog-lead under the ORIGINAL block _key, so a locale is safe to patch
 * only when its block 0 still carries that same key and the block count still
 * matches — anything else means the locale body drifted and needs a human.
 */
export type PtSpan = {_key: string; _type: 'span'; marks: string[]; text: string}
export type PtBlock = {
  _key: string
  _type: string
  style?: string
  markDefs?: unknown[]
  children?: Array<{_key: string; _type: string; marks?: string[]; text?: string}>
}

export function leadBlock(source: PtBlock, text: string): PtBlock {
  return {
    _key: source._key,
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{_key: `${source._key}-lead`, _type: 'span', marks: [], text}],
  }
}

/** Returns a reason to refuse, or null when the locale can be patched. */
export function checkLeadStructure(en: PtBlock[], locale: PtBlock[], localeName: string): string | null {
  if (!locale.length) return `${localeName}: body is empty — translate the whole post first`
  if (locale.length !== en.length) return `${localeName}: en has ${en.length} blocks, ${localeName} has ${locale.length}`
  if (locale[0]._key !== en[0]._key) {
    return `${localeName}: block 0 _key "${locale[0]._key}" differs from en "${en[0]._key}"`
  }
  return null
}
