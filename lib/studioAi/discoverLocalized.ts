/**
 * Schema-independent discovery of localized fields on a document value: walks
 * the object tree looking for `_type: localizedString | localizedText`.
 * Array items are addressed by `_key` — `propertyOffers[_key=="a1"].title` —
 * which is a patch path Sanity accepts directly; an item without a `_key`
 * cannot be addressed safely, so its localized fields are counted and reported
 * instead of written.
 */
import {PROJECT_LOCALE_IDS, type ProjectLocaleId} from '../sanity/localizedPaste/projectLocales'

export type LocalizedEntry = {
  /** Dot path usable directly in a Sanity patch `set`, e.g. "seo.metaTitle". */
  path: string
  kind: 'string' | 'text'
  value: Partial<Record<ProjectLocaleId, unknown>>
}

const KIND_BY_TYPE: Record<string, 'string' | 'text'> = {
  localizedString: 'string',
  localizedText: 'text',
}

const MAX_DEPTH = 6

/**
 * API-written documents (e.g. the Telegram intake bot before 2026-08-20) may
 * omit `_type` on localized objects — Sanity accepts that, and the Studio form
 * only heals it on manual edit. Recognize the SHAPE instead: every
 * non-underscore key is a project locale id and every one holds a string, at
 * least one non-empty. Kind is inferred: multiline or long values mean 'text'.
 */
function inferLocalizedKind(obj: Record<string, unknown>): 'string' | 'text' | undefined {
  const keys = Object.keys(obj).filter((k) => !k.startsWith('_'))
  if (keys.length === 0) return undefined
  const localeSet = new Set<string>(PROJECT_LOCALE_IDS)
  if (!keys.every((k) => localeSet.has(k))) return undefined
  const values = keys.map((k) => obj[k])
  if (!values.every((v): v is string => typeof v === 'string')) return undefined
  if (!values.some((v) => v.trim())) return undefined
  return values.some((v) => v.includes('\n') || v.length > 140) ? 'text' : 'string'
}

export function discoverLocalized(doc: Record<string, unknown>): {
  entries: LocalizedEntry[]
  /** Localized fields inside array items that carry no `_key` — see below. */
  skippedNoKey: number
} {
  const entries: LocalizedEntry[] = []
  let skippedNoKey = 0

  /**
   * `unpatchable` marks a subtree reached through an array item with no `_key`.
   * Studio always writes one; a missing key means an API writer got there
   * first, and that is exactly the case where addressing the item by index
   * would patch the wrong one. Such fields are counted, never written.
   */
  const walk = (node: unknown, path: string, depth: number, unpatchable: boolean): void => {
    if (depth > MAX_DEPTH || node === null || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const item of node) {
        const key = (item as Record<string, unknown> | null)?._key
        if (typeof key === 'string' && key) walk(item, `${path}[_key=="${key}"]`, depth + 1, unpatchable)
        else walk(item, path, depth + 1, true)
      }
      return
    }
    const obj = node as Record<string, unknown>
    const kind =
      (typeof obj._type === 'string' ? KIND_BY_TYPE[obj._type] : undefined) ??
      (obj._type === undefined ? inferLocalizedKind(obj) : undefined)
    if (kind) {
      if (unpatchable) {
        skippedNoKey += 1
        return
      }
      entries.push({path, kind, value: obj as LocalizedEntry['value']})
      return
    }
    for (const [key, v] of Object.entries(obj)) {
      if (key.startsWith('_')) continue
      walk(v, path ? `${path}.${key}` : key, depth + 1, unpatchable)
    }
  }

  walk(doc, '', 0, false)
  return {entries, skippedNoKey}
}

export function filledLocale(value: LocalizedEntry['value'], locale: ProjectLocaleId): string | null {
  const v = value[locale]
  return typeof v === 'string' && v.trim() ? v : null
}

export function emptyLocaleCount(entry: LocalizedEntry): number {
  return PROJECT_LOCALE_IDS.filter((l) => !filledLocale(entry.value, l)).length
}

export type PortableTextEntry = {path: string; text: string; key: string}

/**
 * Portable Text is not a localized object — it is `{en: [blocks], …}` with the
 * text down in `children[].text` spans — so `discoverLocalized` above cannot
 * see it, and a blogPost translated without this arm keeps its body in one
 * language.
 *
 * Deliberately conservative: a block is translatable only when every child is
 * a plain span with no marks. Splitting a sentence at a bold word hands the
 * translator fragments, and reassembling marks by character offset does not
 * survive the word-order changes that are the whole point of translating.
 * Marked blocks are counted and reported so an editor knows the body is partly
 * done rather than assuming it is finished.
 */
export function discoverPortableText(
  value: unknown,
  fieldPath: string,
  baseLocale = 'en',
): {entries: PortableTextEntry[]; skippedMarked: number} {
  const entries: PortableTextEntry[] = []
  let skippedMarked = 0
  const blocks = (value as Record<string, unknown> | null | undefined)?.[baseLocale]
  if (!Array.isArray(blocks)) return {entries, skippedMarked}

  for (const raw of blocks) {
    const b = raw as Record<string, unknown>
    if (b?._type !== 'block') continue
    // No `_key` means the item cannot be addressed in a patch — the same rule
    // `discoverLocalized` applies to array items.
    const key = typeof b._key === 'string' ? b._key : ''
    if (!key) continue
    const children = Array.isArray(b.children) ? (b.children as Array<Record<string, unknown>>) : []
    const spans = children.filter((c) => c?._type === 'span')
    if (spans.length === 0 || spans.length !== children.length) continue
    if (spans.some((s) => Array.isArray(s.marks) && (s.marks as unknown[]).length > 0)) {
      skippedMarked += 1
      continue
    }
    const text = spans.map((s) => (typeof s.text === 'string' ? s.text : '')).join('')
    if (!text.trim()) continue
    entries.push({path: `${fieldPath}.${baseLocale}[_key=="${key}"]`, text, key})
  }
  return {entries, skippedMarked}
}

/**
 * Rebuilds a block array for a target locale. Every block keeps its `_key`,
 * `style`, `listItem`, `level` and `markDefs`; a translated one has its
 * children replaced by a single unmarked span. A block with no translation is
 * returned untouched, which is what keeps images, CTAs and embeds intact.
 */
export function portableTextPatch(
  blocks: unknown[],
  translationsByKey: Record<string, string>,
): unknown[] {
  return (blocks ?? []).map((raw) => {
    const b = raw as Record<string, unknown>
    const key = typeof b?._key === 'string' ? b._key : ''
    const text = key ? translationsByKey[key] : undefined
    if (text === undefined) return raw
    return {...b, children: [{_type: 'span', _key: `${key}-t`, marks: [], text}]}
  })
}
