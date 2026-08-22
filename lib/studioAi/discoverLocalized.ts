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
