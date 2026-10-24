/**
 * Writes hand-written translations of knowledge question pages into Sanity.
 *
 * The English master of a page is seeded by seedKnowledgeBase20261019.ts; a
 * page is written only in the languages its question is actually asked in
 * (the frontend indexes a page in the locales that have a title and serves
 * the English fallback as noindex elsewhere). Those translations are written
 * in Claude Code by hand, not through the API, so this script takes a
 * structured translation (the same shape as the English ArticleSpec, strings
 * only) and patches the locale keys of every localized field by path:
 * title, summary, section headings and prose, table titles, columns and
 * cells, FAQ, gaps and SEO meta. No new field path is created: every key it
 * writes already exists for `en` on the same document (the dataset is at its
 * 2,000-attribute cap).
 *
 * Translations are matched to the live document by position and checked
 * (same number of sections, tables, rows, cells, FAQ items), so a translation
 * written against an older English version fails loudly instead of landing in
 * the wrong row. `questionSet` stays English-only on purpose.
 *
 * Run:
 *   npx tsx scripts/applyKnowledgeTranslations.ts --dry  [--file <module>]
 *   npx tsx scripts/applyKnowledgeTranslations.ts --execute [--file <module>]
 * Default module: scripts/data/knowledge-base-2026-10-19/translations20261024.ts
 */
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import type {ArticleTranslation} from './data/knowledge-base-2026-10-19/types'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const args = process.argv.slice(2)
const execute = args.includes('--execute')
const dry = args.includes('--dry')
if (execute === dry) {
  console.error('Use --dry or --execute.')
  process.exit(1)
}
const fileArg = args.indexOf('--file')
const modulePath = path.resolve(
  process.cwd(),
  fileArg > 0 ? args[fileArg + 1] : 'scripts/data/knowledge-base-2026-10-19/translations20261024.ts',
)

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

type Loc = Record<string, unknown>
type LiveDoc = {
  _id: string
  documentId: string
  title: Loc
  summary: Loc
  sections?: {
    _key: string
    heading: Loc
    bodyText?: Loc
    tables?: {
      _key: string
      title?: Loc
      columns: ({_key: string} & Loc)[]
      rows: {_key: string; cells: string[]; localizedCells?: ({_key: string} & Loc)[]}[]
      methodology?: Loc
    }[]
  }[]
  faq?: {_key: string; question: Loc; answer: Loc}[]
  gaps?: {_key: string; description: Loc}[]
  seo?: {metaTitle?: Loc; metaDescription?: Loc}
}

const normalizeMd = (md: string) =>
  md
    .split(/\n\s*\n/)
    .map((p) => p.split('\n').map((l) => l.trim()).filter(Boolean).join('\n'))
    .filter(Boolean)
    .join('\n\n')

/** Index tokens ({{median:durres}}) must survive translation unchanged. */
const tokensOf = (s: string) => (s.match(/\{\{[^}]*\}\}/g) ?? []).sort().join(' ')

async function main() {
  const mod = (await import(pathToFileURL(modulePath).href)) as {TRANSLATIONS: ArticleTranslation[]}
  const translations = mod.TRANSLATIONS
  if (!Array.isArray(translations) || translations.length === 0) throw new Error(`no TRANSLATIONS in ${modulePath}`)

  const ids = [...new Set(translations.map((t) => `knowledge.article.${t.id}`))]
  const docs = await client.fetch<LiveDoc[]>(`*[_id in $ids]`, {ids})
  const byId = new Map(docs.map((d) => [d.documentId, d]))

  const problems: string[] = []
  const patches: {id: string; locale: string; set: Record<string, string>}[] = []

  for (const t of translations) {
    const doc = byId.get(t.id)
    const where = `${t.id}/${t.locale}`
    if (!doc) {
      problems.push(`${where}: document not seeded`)
      continue
    }
    const set: Record<string, string> = {}
    const put = (p: string, en: unknown, value: string | undefined) => {
      if (value === undefined) return
      if (typeof en !== 'string') {
        problems.push(`${where}: ${p} has no English value to translate`)
        return
      }
      if (tokensOf(en) !== tokensOf(value)) problems.push(`${where}: ${p} changes the index tokens (${tokensOf(en)} → ${tokensOf(value)})`)
      set[`${p}.${t.locale}`] = value
    }

    put('title', doc.title?.en, t.title)
    put('summary', doc.summary?.en, t.summary)

    const sections = doc.sections ?? []
    if (sections.length !== t.sections.length) {
      problems.push(`${where}: ${t.sections.length} sections given, document has ${sections.length}`)
      continue
    }
    sections.forEach((sec, i) => {
      const ts = t.sections[i]
      const sp = `sections[_key=="${sec._key}"]`
      put(`${sp}.heading`, sec.heading?.en, ts.heading)
      if (ts.body !== undefined) put(`${sp}.bodyText`, sec.bodyText?.en, normalizeMd(ts.body))
      else if (sec.bodyText?.en) problems.push(`${where}: section ${i + 1} (${sec._key}) has prose but no translation`)
      const tables = sec.tables ?? []
      const tts = ts.tables ?? []
      if (tables.length !== tts.length) {
        problems.push(`${where}: section ${sec._key} has ${tables.length} tables, ${tts.length} translated`)
        return
      }
      tables.forEach((tab, j) => {
        const tt = tts[j]
        const tp = `${sp}.tables[_key=="${tab._key}"]`
        if (tab.title?.en) put(`${tp}.title`, tab.title.en, tt.title)
        if (tab.columns.length !== tt.columns.length) {
          problems.push(`${where}: table ${tab._key} has ${tab.columns.length} columns, ${tt.columns.length} translated`)
          return
        }
        tab.columns.forEach((c, k) => put(`${tp}.columns[_key=="${c._key}"]`, c.en, tt.columns[k]))
        if (tab.rows.length !== tt.rows.length) {
          problems.push(`${where}: table ${tab._key} has ${tab.rows.length} rows, ${tt.rows.length} translated`)
          return
        }
        tab.rows.forEach((row, r) => {
          const cells = tt.rows[r]
          if (cells.length !== row.cells.length) {
            problems.push(`${where}: table ${tab._key} row ${r + 1} has ${row.cells.length} cells, ${cells.length} translated`)
            return
          }
          if (!row.localizedCells) return // numbers only: nothing to translate
          row.localizedCells.forEach((lc, k) => put(`${tp}.rows[_key=="${row._key}"].localizedCells[_key=="${lc._key}"]`, lc.en, cells[k]))
        })
        if (tab.methodology?.en) put(`${tp}.methodology`, tab.methodology.en, tt.methodology)
      })
    })

    const faq = doc.faq ?? []
    if (faq.length !== t.faq.length) problems.push(`${where}: ${t.faq.length} FAQ items given, document has ${faq.length}`)
    else
      faq.forEach((f, i) => {
        put(`faq[_key=="${f._key}"].question`, f.question?.en, t.faq[i].q)
        put(`faq[_key=="${f._key}"].answer`, f.answer?.en, t.faq[i].a)
      })

    const gaps = doc.gaps ?? []
    if (t.gaps) {
      if (gaps.length !== t.gaps.length) problems.push(`${where}: ${t.gaps.length} gaps given, document has ${gaps.length}`)
      else gaps.forEach((g, i) => put(`gaps[_key=="${g._key}"].description`, g.description?.en, t.gaps![i]))
    }
    if (doc.seo?.metaTitle?.en) put('seo.metaTitle', doc.seo.metaTitle.en, t.seoTitle)
    if (doc.seo?.metaDescription?.en) put('seo.metaDescription', doc.seo.metaDescription.en, t.seoDescription)

    patches.push({id: doc._id, locale: t.locale, set})
  }

  for (const p of patches) console.log(`${p.id} ${p.locale}: ${Object.keys(p.set).length} fields`)
  if (problems.length) {
    console.log(`\n${problems.length} problem(s):`)
    problems.forEach((p) => console.log(`  - ${p}`))
    process.exit(1)
  }
  if (dry) {
    console.log('\nDry run: nothing sent.')
    return
  }
  const tx = client.transaction()
  for (const p of patches) tx.patch(p.id, (patch) => patch.set(p.set))
  const res = await tx.commit()
  console.log(`\ncommitted transaction ${res.transactionId}: ${patches.length} patches`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
