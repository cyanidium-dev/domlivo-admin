/**
 * A markdown-to-Portable-Text converter for exactly the constructs the
 * prepared articles use, and nothing else.
 *
 * The ТЗ-13 spec argued against a loader script: converting arbitrary prose to
 * Portable Text is where silent formatting damage comes from. That holds for
 * arbitrary markdown. It does not hold for a converter that accepts five
 * constructs and **throws on anything else** — it cannot damage what it refuses
 * to read.
 */

export type Span = {_type: 'span'; _key: string; marks: string[]; text: string}

const BOLD_OR_ITALIC = /(\*\*)([^*]+)\1|(\*)([^*]+)\3/g

/**
 * Bold is matched before italic in the same pass; otherwise `**x**` parses as
 * an empty italic wrapping a bold one.
 */
export function spansFromInline(text: string, keyBase: string): Span[] {
  const spans: Span[] = []
  const push = (marks: string[], value: string) => {
    if (!value) return
    spans.push({_type: 'span', _key: `${keyBase}-${spans.length}`, marks, text: value})
  }
  let cursor = 0
  let match: RegExpExecArray | null
  BOLD_OR_ITALIC.lastIndex = 0
  while ((match = BOLD_OR_ITALIC.exec(text)) !== null) {
    push([], text.slice(cursor, match.index))
    const strong = match[1] !== undefined
    push([strong ? 'strong' : 'em'], strong ? match[2] : match[4])
    cursor = match.index + match[0].length
  }
  push([], text.slice(cursor))
  if (spans.length === 0) push([], '')
  return spans
}

let counter = 0
const nextKey = (): string => `md${(counter += 1).toString(36)}${Date.now().toString(36).slice(-4)}`

/** Reset between documents so keys stay short and readable. */
export function resetKeys(): void {
  counter = 0
}

function tableBlock(lines: string[]): Record<string, unknown> {
  const cellsOf = (line: string) =>
    line
      .trim()
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((c) => c.trim())
  const rows = lines
    // The |---|---| separator is layout, not data.
    .filter((l) => !/^\s*\|[\s:|-]+\|\s*$/.test(l))
    .map((l) => ({_type: 'tableRow', _key: nextKey(), cells: cellsOf(l)}))
  return {_type: 'blogTable', _key: nextKey(), rows}
}

export function markdownToPortableText(markdown: string): Array<Record<string, unknown>> {
  resetKeys()
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const out: Array<Record<string, unknown>> = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i += 1
      continue
    }

    if (line.trimStart().startsWith('|')) {
      const start = i
      const table: string[] = []
      while (i < lines.length && lines[i].trimStart().startsWith('|')) {
        table.push(lines[i])
        i += 1
      }
      if (table.length < 2) throw new Error(`line ${start + 1}: a table needs a header and a separator row`)
      out.push(tableBlock(table))
      continue
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      // Only #### is used, and it becomes a PT h2: collectHeadings reads h2/h3
      // for the table of contents, and the renderer shifts levels down one
      // because the page <h1> is the article title.
      if (heading[1] !== '####') {
        throw new Error(`line ${i + 1}: only #### headings are supported, found ${heading[1]}`)
      }
      const key = nextKey()
      out.push({
        _type: 'block',
        _key: key,
        style: 'h2',
        markDefs: [],
        children: spansFromInline(heading[2].trim(), key),
      })
      i += 1
      continue
    }

    if (/^\s*([-*+]\s|\d+\.\s|>|!\[|```)/.test(line)) {
      throw new Error(
        `line ${i + 1}: unsupported construct — this loader takes paragraphs, #### headings, tables, *italic* and **bold** only`,
      )
    }

    // A paragraph runs until a blank line.
    const start = i
    const para: string[] = []
    while (i < lines.length && lines[i].trim() && !lines[i].trimStart().startsWith('|')) {
      if (/^#{1,6}\s/.test(lines[i]) && i > start) break
      para.push(lines[i].trim())
      i += 1
    }
    const key = nextKey()
    out.push({
      _type: 'block',
      _key: key,
      style: 'normal',
      markDefs: [],
      children: spansFromInline(para.join(' '), key),
    })
  }

  return out
}
