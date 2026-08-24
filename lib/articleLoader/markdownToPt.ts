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
export type LinkMarkDef = {_type: 'link'; _key: string; href: string}

const INLINE_TOKEN = /(\*\*)([^*]+)\1|(\*)([^*]+)\3|\[([^\]]+)\]\(([^)]+)\)/g

/**
 * Bold is matched before italic in the same pass; otherwise `**x**` parses as
 * an empty italic wrapping a bold one. A `[text](href)` link is a third
 * alternative in the same token pass, so a link on its own parses correctly
 * regardless of what emphasis surrounds it elsewhere in the paragraph.
 *
 * This is a single flat pass, not a recursive parser: a link written
 * *inside* `**bold**` or `*italic*` is NOT nested — the whole `**...**` span
 * matches first and the link syntax inside it is never re-examined, which
 * would silently emit the literal text `[x](y)` instead of a real link. That
 * is exactly the kind of damage this converter exists to refuse, so a bold
 * or italic run containing unparsed link syntax throws instead. Write the
 * link outside the emphasis instead of inside it.
 *
 * `onLink` turns a matched href into the mark name the span should carry —
 * the caller owns building the block's `markDefs`, so this function stays a
 * pure text→spans mapper. A link found with no handler throws rather than
 * silently dropping the URL and keeping the link text as plain text.
 */
export function spansFromInline(text: string, keyBase: string, onLink?: (href: string) => string): Span[] {
  const spans: Span[] = []
  const push = (marks: string[], value: string) => {
    if (!value) return
    spans.push({_type: 'span', _key: `${keyBase}-${spans.length}`, marks, text: value})
  }
  const assertNoNestedLink = (emphasisKind: string, value: string) => {
    if (/\[[^\]]+\]\([^)]+\)/.test(value)) {
      throw new Error(
        `a markdown link inside ${emphasisKind} is not supported (it would render as literal text): "${value}"`,
      )
    }
  }
  let cursor = 0
  let match: RegExpExecArray | null
  INLINE_TOKEN.lastIndex = 0
  while ((match = INLINE_TOKEN.exec(text)) !== null) {
    push([], text.slice(cursor, match.index))
    if (match[1] !== undefined) {
      assertNoNestedLink('**bold**', match[2])
      push(['strong'], match[2])
    } else if (match[3] !== undefined) {
      assertNoNestedLink('*italic*', match[4])
      push(['em'], match[4])
    } else {
      const [, , , , , linkText, href] = match
      if (!onLink) throw new Error(`inline link with no link handler provided: [${linkText}](${href})`)
      push([onLink(href)], linkText)
    }
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

/**
 * `blogTable` cells are plain strings in the schema — no marks, no links.
 * Reusing the inline tokenizer here strips `**bold**`/`*italic*` markers and
 * collapses a `[text](href)` link down to its text, so a table cell shows
 * "Blloku" rather than the literal, unrendered "[Blloku](/en/...)". The
 * dropped href isn't a regression: cells never had anywhere to put one.
 */
function plainTextFromInline(text: string): string {
  return spansFromInline(text, 'cell', () => '')
    .map((s) => s.text)
    .join('')
}

function tableBlock(lines: string[]): Record<string, unknown> {
  const cellsOf = (line: string) =>
    line
      .trim()
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((c) => plainTextFromInline(c.trim()))
  const rows = lines
    // The |---|---| separator is layout, not data.
    .filter((l) => !/^\s*\|[\s:|-]+\|\s*$/.test(l))
    .map((l) => ({_type: 'tableRow', _key: nextKey(), cells: cellsOf(l)}))
  return {_type: 'blogTable', _key: nextKey(), rows}
}

const ZONE_EMBED_MARKER = /^\{\{zoneStatsEmbed:([a-z0-9-]+)\}\}$/

export type MarkdownToPtOptions = {
  /** Resolves a `{{zoneStatsEmbed:<slug>}}` marker's slug to a Sanity document id. */
  resolveZoneEmbed?: (slug: string) => string
}

/** A block-level paragraph/heading with links: builds spans and their markDefs together. */
function textBlock(text: string, style: 'normal' | 'h2', key: string): Record<string, unknown> {
  const markDefs: LinkMarkDef[] = []
  const children = spansFromInline(text, key, (href) => {
    const linkKey = nextKey()
    markDefs.push({_type: 'link', _key: linkKey, href})
    return linkKey
  })
  return {_type: 'block', _key: key, style, markDefs, children}
}

export function markdownToPortableText(
  markdown: string,
  opts: MarkdownToPtOptions = {},
): Array<Record<string, unknown>> {
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

    const zoneMarker = ZONE_EMBED_MARKER.exec(line.trim())
    if (zoneMarker) {
      if (!opts.resolveZoneEmbed) {
        throw new Error(`line ${i + 1}: a zoneStatsEmbed marker was found but no zone resolver was provided`)
      }
      out.push({
        _type: 'zoneStatsEmbed',
        _key: nextKey(),
        zone: {_type: 'reference', _ref: opts.resolveZoneEmbed(zoneMarker[1])},
      })
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
      out.push(textBlock(heading[2].trim(), 'h2', key))
      i += 1
      continue
    }

    const listItem = /^\s*(?:([-*+])\s+|(\d+)\.\s+)(.*)$/.exec(line)
    if (listItem) {
      const kind: 'bullet' | 'number' = listItem[1] ? 'bullet' : 'number'
      while (i < lines.length) {
        const li = /^\s*(?:([-*+])\s+|(\d+)\.\s+)(.*)$/.exec(lines[i])
        // A blank-or-mismatched line ends this run; a list of the other kind
        // starting right after is picked up fresh on the next loop iteration.
        if (!li || (li[1] ? 'bullet' : 'number') !== kind) break
        out.push({...textBlock(li[3].trim(), 'normal', nextKey()), listItem: kind, level: 1})
        i += 1
      }
      continue
    }

    if (/^\s*(>|!\[|```)/.test(line)) {
      throw new Error(
        `line ${i + 1}: unsupported construct — this loader takes paragraphs, #### headings, tables, lists, {{zoneStatsEmbed:slug}}, [links](href), *italic* and **bold** only`,
      )
    }

    // A paragraph runs until a blank line.
    const start = i
    const para: string[] = []
    while (i < lines.length && lines[i].trim() && !lines[i].trimStart().startsWith('|')) {
      if (/^#{1,6}\s/.test(lines[i]) && i > start) break
      if (ZONE_EMBED_MARKER.test(lines[i].trim()) && i > start) break
      para.push(lines[i].trim())
      i += 1
    }
    out.push(textBlock(para.join(' '), 'normal', nextKey()))
  }

  return out
}
