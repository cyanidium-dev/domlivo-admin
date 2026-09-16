/**
 * Portable Text ↔ flat translatable strings, for exportLocaleJobs.ts and
 * applyLocaleJobs.ts.
 *
 * A localized Portable Text field keeps one array per locale. To add a locale,
 * the English array is copied item by item:
 * - a text block becomes one string in which every marked span is wrapped in
 *   <sN>…</sN> (N = the span's index in the source block), so bold words and
 *   links survive the translation and are split back into spans with the
 *   original marks;
 * - any other item (tables, callouts, embeds) keeps its structure, and only its
 *   human-readable string leaves are translated — identifiers, slugs, URLs and
 *   style names stay as they are.
 */

export type Block = {_key: string; _type: string; children?: Span[]; [k: string]: unknown}
export type Span = {_key: string; _type: string; marks?: string[]; text: string}

const LOCALE_KEYS = new Set(['en', 'uk', 'ru', 'sq', 'it', 'pl', 'de'])
const NON_TEXT_KEYS = /^(_key|_type|_ref|_weak|_id|href|url|link|slug|style|listItem|level|marks|asset|zone|zoneSlug|metric|metrics|variant|tone|icon|size|align|layout|id)$/i

export function isBlockArray(v: unknown): v is Block[] {
  return Array.isArray(v) && v.length > 0 && v.every((b) => b && typeof b === 'object' && typeof (b as Block)._type === 'string')
}

/** Localized Portable Text objects anywhere in `node`, with Sanity patch paths (keyed where possible). */
export function collectRichFields(node: unknown, at: string, out: Array<{path: string; obj: Record<string, unknown>}>) {
  if (Array.isArray(node)) {
    node.forEach((item, i) => {
      const key = item && typeof item === 'object' ? (item as {_key?: string})._key : undefined
      collectRichFields(item, key ? `${at}[_key=="${key}"]` : `${at}[${i}]`, out)
    })
    return
  }
  if (!node || typeof node !== 'object') return
  const obj = node as Record<string, unknown>
  const keys = Object.keys(obj).filter((k) => !k.startsWith('_'))
  if (keys.length && keys.every((k) => LOCALE_KEYS.has(k)) && keys.some((k) => isBlockArray(obj[k]))) {
    out.push({path: at, obj})
    return
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('_')) continue
    collectRichFields(v, at ? `${at}.${k}` : k, out)
  }
}

export function encodeBlock(b: Block): string {
  return (b.children ?? []).map((s, i) => (s.marks && s.marks.length ? `<s${i}>${s.text}</s${i}>` : s.text)).join('')
}

export function decodeBlock(src: Block, text: string, locale: string): Block {
  const children: Span[] = []
  const re = /<s(\d+)>([\s\S]*?)<\/s\1>/g
  let last = 0
  let n = 0
  const push = (t: string, marks: string[]) => {
    if (t) children.push({_key: `${src._key}-${locale}-${n++}`, _type: 'span', marks, text: t})
  }
  for (let m = re.exec(text); m; m = re.exec(text)) {
    push(text.slice(last, m.index), [])
    push(m[2], src.children?.[Number(m[1])]?.marks ?? [])
    last = m.index + m[0].length
  }
  push(text.slice(last), [])
  if (!children.length) children.push({_key: `${src._key}-${locale}-0`, _type: 'span', marks: [], text: ''})
  return {...src, children}
}

export function tagsOf(text: string): string {
  return (text.match(/<\/?s\d+>/g) ?? []).sort().join()
}

/** Translatable strings of one array: item ref → source text. */
export function richItems(source: Block[]): Array<{ref: string; text: string}> {
  const out: Array<{ref: string; text: string}> = []
  source.forEach((item, i) => {
    if (item._type === 'block' && Array.isArray(item.children)) {
      const text = encodeBlock(item)
      if (text.trim()) out.push({ref: `b${i}`, text})
      return
    }
    const walk = (v: unknown, p: string) => {
      if (typeof v === 'string') {
        const t = v.trim()
        // Leaves that carry words: letters and a space, or a capitalised word;
        // slugs, ids and numbers stay untouched.
        if (t && /\p{L}/u.test(t) && !/^[a-z0-9_-]+$/.test(t)) out.push({ref: `o${i}:${p}`, text: v})
        return
      }
      if (Array.isArray(v)) return v.forEach((x, j) => walk(x, `${p}[${j}]`))
      if (v && typeof v === 'object') {
        for (const [k, x] of Object.entries(v)) if (!NON_TEXT_KEYS.test(k)) walk(x, p ? `${p}.${k}` : k)
      }
    }
    walk(item, '')
  })
  return out
}

function setIn(obj: unknown, p: string, value: string) {
  const parts = p.split(/\.|\[|\]/).filter(Boolean)
  let cur = obj as Record<string, unknown>
  for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]] as Record<string, unknown>
  cur[parts[parts.length - 1]] = value
}

/** Rebuild the array for `locale` from the source array and translated item texts. Throws on a missing item or changed tags. */
export function buildRichArray(source: Block[], translated: Record<string, string>, locale: string): Block[] {
  const copy = JSON.parse(JSON.stringify(source)) as Block[]
  for (const {ref, text} of richItems(source)) {
    const got = translated[ref]
    if (typeof got !== 'string' || !got.trim()) throw new Error(`item ${ref} untranslated`)
    if (ref.startsWith('b')) {
      const i = Number(ref.slice(1))
      if (tagsOf(text) !== tagsOf(got)) throw new Error(`item ${ref}: inline tags changed`)
      copy[i] = decodeBlock(source[i], got.trim(), locale)
    } else {
      const colon = ref.indexOf(':')
      setIn(copy[Number(ref.slice(1, colon))], ref.slice(colon + 1), got)
    }
  }
  return copy
}
