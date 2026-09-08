/**
 * Pure decisions behind translateBlogTables.ts.
 *
 * `discoverPortableText` only yields `_type: "block"` items, so every
 * `blogTable` is copied verbatim into each locale by translateBlogPost.ts and
 * its cells stay English (verified on three live posts, 2026-09-03). This
 * module decides which cells carry language and rebuilds a locale's table from
 * the English one, so a translated table always has the English structure.
 */
import type {TranslateRequestItem} from '../../lib/studioAi/applyTranslations'

export type LocalizedString = {_type?: string; [locale: string]: string | undefined}
export type TableRow = {_key: string; _type: 'tableRow'; cells: string[]}
export type BlogTable = {
  _key: string
  _type: 'blogTable'
  title?: LocalizedString
  caption?: LocalizedString
  rows: TableRow[]
}

/** Units and abbreviations that contain letters but carry no language. */
const UNIT_TOKENS = ['m²', 'm2', 'sqm', 'sq m', 'lek', 'all', 'eur', 'usd', 'km', 'y/y', 'q/q', 'h1', 'h2', 'q1', 'q2', 'q3', 'q4']

export function isTranslatableCell(cell: string): boolean {
  let s = (cell || '').toLowerCase()
  for (const tok of UNIT_TOKENS) s = s.split(tok).join(' ')
  return /\p{L}{2,}/u.test(s)
}

const textOf = (v: LocalizedString | undefined): string => (v?.en ?? '').trim()

export function collectTableItems(tables: BlogTable[]): TranslateRequestItem[] {
  const items: TranslateRequestItem[] = []
  for (const t of tables) {
    if (textOf(t.title)) items.push({key: `${t._key}|title`, kind: 'string', text: textOf(t.title)})
    if (textOf(t.caption)) items.push({key: `${t._key}|caption`, kind: 'string', text: textOf(t.caption)})
    t.rows.forEach((row, ri) =>
      row.cells.forEach((cell, ci) => {
        if (isTranslatableCell(cell)) items.push({key: `${t._key}|r${ri}|c${ci}`, kind: 'string', text: cell})
      }),
    )
  }
  return items
}

/** English table + translations for one locale → that locale's table. */
export function applyTableTranslations(en: BlogTable, translated: Map<string, string>, locale: string): BlogTable {
  const pick = (key: string, fallback: string) => translated.get(key)?.trim() || fallback
  const out: BlogTable = {
    ...en,
    rows: en.rows.map((row, ri) => ({
      ...row,
      cells: row.cells.map((cell, ci) => pick(`${en._key}|r${ri}|c${ci}`, cell)),
    })),
  }
  if (textOf(en.title)) out.title = {...en.title, [locale]: pick(`${en._key}|title`, textOf(en.title))}
  if (textOf(en.caption)) out.caption = {...en.caption, [locale]: pick(`${en._key}|caption`, textOf(en.caption))}
  return out
}
