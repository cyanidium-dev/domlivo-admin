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

export type PortableTextEntry = {path: string; text: string; key: string; runs: string[][]}

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
): {entries: PortableTextEntry[]; markedBlocks: number} {
  const entries: PortableTextEntry[] = []
  let markedBlocks = 0
  const blocks = (value as Record<string, unknown> | null | undefined)?.[baseLocale]
  if (!Array.isArray(blocks)) return {entries, markedBlocks}

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
    // Marked runs are delimited inline rather than skipped — see
    // serializeBlockText. The model translates the whole sentence and carries
    // the markers with the words they wrap.
    const {text, runs} = serializeBlockText(b)
    if (!text.trim()) continue
    if (runs.length > 0) markedBlocks += 1
    entries.push({path: `${fieldPath}.${baseLocale}[_key=="${key}"]`, text, key, runs})
  }
  return {entries, markedBlocks}
}

// ─── Marks across a translation ──────────────────────────────────────────────
//
// ТЗ-13 skipped any block carrying a mark: splitting a sentence at a bold word
// hands the translator fragments, and reassembling marks by character offset
// does not survive the word-order changes that are the point of translating.
// Both of those are true. The mistake was concluding the block must be skipped
// — 41% of the first two real articles' paragraphs carry an italicised Albanian
// term, so nearly half the body came back in English.
//
// The third option is what translation-memory tools do: send the whole sentence
// with the marked runs delimited inline and let the model carry the delimiters
// through. The model still translates a complete sentence, and the markers move
// with the words they wrap.

/** ASCII on purpose: a model will not translate `[[1]]`, and it survives a JSON
 *  round-trip and the tool-use schema without escaping surprises. */
const MARK_OPEN = (n: number) => `[[${n}]]`
const MARK_CLOSE = (n: number) => `[[/${n}]]`
const MARK_PATTERN = /\[\[(\/?)(\d+)\]\]/g

export type SerializedBlock = {
  text: string
  /** runs[i] is the `marks` array owned by marker number i+1. */
  runs: string[][]
}

export function serializeBlockText(block: Record<string, unknown>): SerializedBlock {
  const children = Array.isArray(block?.children) ? (block.children as Array<Record<string, unknown>>) : []
  const runs: string[][] = []
  let text = ''
  for (const child of children) {
    if (child?._type !== 'span') continue
    const value = typeof child.text === 'string' ? child.text : ''
    const marks = Array.isArray(child.marks) ? (child.marks as string[]) : []
    if (marks.length === 0) {
      text += value
      continue
    }
    runs.push(marks)
    const n = runs.length
    text += `${MARK_OPEN(n)}${value}${MARK_CLOSE(n)}`
  }
  return {text, runs}
}

export type DeserializedBlock = {
  block: Record<string, unknown>
  children: Array<{_type: 'span'; _key: string; marks: string[]; text: string}>
  /** Runs whose formatting did not come back. The text is always intact. */
  lostMarks: number
}

/**
 * Rebuilds a block from a translated string.
 *
 * Every failure degrades to plain text rather than corrupting it: a dropped
 * marker loses one italic, an unbalanced or unknown one collapses the block to
 * a single unmarked span. Nothing here can produce a block whose words are
 * wrong — the worst case reads correctly with formatting lost, which is what
 * skipping it produced anyway, minus the translation.
 */
export function deserializeBlockText(
  source: Record<string, unknown>,
  translated: string,
  runs: string[][],
): DeserializedBlock {
  const key = typeof source?._key === 'string' ? source._key : 'b'
  const span = (i: number, marks: string[], text: string) => ({
    _type: 'span' as const,
    _key: `${key}-${i}`,
    marks,
    text,
  })
  const plain = (): DeserializedBlock => ({
    block: source,
    children: [span(0, [], translated.replace(MARK_PATTERN, ''))],
    lostMarks: runs.length,
  })

  // A number the source never had is not structure the model was given, so it
  // is stripped before parsing rather than left in the reader's text.
  const cleaned = translated.replace(MARK_PATTERN, (whole, _slash: string, digits: string) =>
    runs[Number(digits) - 1] ? whole : '',
  )

  const children: Array<{_type: 'span'; _key: string; marks: string[]; text: string}> = []
  let cursor = 0
  let open: number | null = null
  let openAt = 0
  let seen = 0
  let match: RegExpExecArray | null
  MARK_PATTERN.lastIndex = 0

  while ((match = MARK_PATTERN.exec(cleaned)) !== null) {
    const closing = match[1] === '/'
    const n = Number(match[2])
    const marks = runs[n - 1]
    if (!closing) {
      if (open !== null) return plain() // nested or unbalanced
      const before = cleaned.slice(cursor, match.index)
      if (before) children.push(span(children.length, [], before))
      open = n
      openAt = match.index + match[0].length
      continue
    }
    if (open !== n) return plain() // closing something that was never opened
    const inner = cleaned.slice(openAt, match.index)
    if (inner) children.push(span(children.length, marks, inner))
    seen += 1
    open = null
    cursor = match.index + match[0].length
  }

  if (open !== null) return plain() // opened and never closed
  const tail = cleaned.slice(cursor)
  if (tail) children.push(span(children.length, [], tail))
  if (children.length === 0) children.push(span(0, [], ''))

  return {block: source, children, lostMarks: runs.length - seen}
}
