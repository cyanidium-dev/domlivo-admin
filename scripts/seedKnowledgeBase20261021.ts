/**
 * Seeds the second batch of knowledge-base question pages (2026-10-21,
 * long-tail family F4): 10 `knowledgeArticle` documents with the
 * `knowledgeFact` and `knowledgeSource` documents they add.
 *
 * Same document shape as scripts/seedKnowledgeBase20261019.ts, with three
 * differences:
 *  - translations are written by hand in the data files (`tr`), only for the
 *    locales with search demand; nothing is machine-translated;
 *  - `related` may point at any article already in the dataset, not only at
 *    this batch;
 *  - pages land unpublished on first write and keep their `isPublished` on a
 *    re-run. Publish them with
 *      npx tsx scripts/knowledge/setKnowledgePublished.ts --on <ids>
 *
 * The 2026-10-19 seed is left alone on purpose: its pages were rewritten in
 * Studio afterwards (AI-text audit, #89/#90) and a re-run would undo that.
 *
 * Run:
 *   npx tsx scripts/seedKnowledgeBase20261021.ts --dry
 *   npx tsx scripts/seedKnowledgeBase20261021.ts --execute
 * --execute writes a backup of every document it replaces first.
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {SOURCE_TYPE_RANK, DATA_ID_PATTERN, SOURCE_ID_PATTERN, DOCUMENT_ID_PATTERN} from '../schemaTypes/constants/knowledge'
import {SOURCES} from './data/knowledge-base-2026-10-21/sources'
import {FACTS} from './data/knowledge-base-2026-10-21/facts'
import {ARTICLES_F4} from './data/knowledge-base-2026-10-21/articles'
import type {ArticleSpec, ArticleTr, Md} from './data/knowledge-base-2026-10-21/types'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.includes('--execute')
const dry = process.argv.includes('--dry')
if (execute === dry) {
  console.error('Use --dry or --execute.')
  process.exit(1)
}

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

const TODAY = '2026-10-21'
const AUTHOR_ID = 'blogAuthor-fedir-alpatov'
const RATE = 92.02
const RATE_DATE = '2026-09-09'
const DATA_DIR = path.resolve(path.dirname(process.argv[1]), 'data/knowledge-base-2026-10-21')
const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl', 'de']

const ARTICLES: ArticleSpec[] = ARTICLES_F4

const sourceDocId = (id: string) => `knowledge.source.${id}`
const factDocId = (id: string) => `knowledge.fact.${id}`
const articleDocId = (id: string) => `knowledge.article.${id}`
const keyOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
const ref = (id: string, key?: string) => ({_type: 'reference', _ref: id, ...(key ? {_key: key} : {})})
const ls = (en: string) => ({_type: 'localizedString', en}) as Record<string, string>
const lt = (en: string) => ({_type: 'localizedText', en}) as Record<string, string>

function addMonths(date: string, months: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + months)
  return d.toISOString().slice(0, 10)
}

/** Prose as the page stores it: paragraphs split by a blank line, "- " bullets. */
const normalizeMd = (md: Md) =>
  md
    .split(/\n\s*\n/)
    .map((p) => p.split('\n').map((l) => l.trim()).filter(Boolean).join('\n'))
    .filter(Boolean)
    .join('\n\n')

/** True when a cell has words in it once the index tokens are removed. */
const hasWords = (cell: string) => /\p{L}{2,}/u.test(cell.replace(/\{\{[^}]*\}\}/g, ''))

/** Writing tells the style guide bans; checked in every language we write. */
const BANNED: Array<[RegExp, string]> = [
  [/—/, 'em dash'],
  [/\bnestled\b|\bvibrant\b|\bdelve\b|in the heart of/i, 'stock phrase'],
  [/\bit'?s not (just )?\w+[^.]*, it'?s\b/i, '"it\'s not X, it\'s Y"'],
  [/2\s?% (transfer|purchase) tax (for|paid by) (the )?buyer/i, 'buyer transfer tax claim'],
]

/** Every string in a spec, for the style check. */
function stringsOf(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v)
  else if (Array.isArray(v)) v.forEach((x) => stringsOf(x, out))
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => stringsOf(x, out))
  return out
}

/** The hand-written translations of one article, written into its document. */
function applyTranslations(
  doc: Record<string, any>,
  a: ArticleSpec,
  warn: (m: string) => void,
): void {
  for (const [locale, tr] of Object.entries(a.tr ?? {}) as [string, ArticleTr][]) {
    if (!LOCALES.includes(locale) || locale === 'en') {
      warn(`${a.id}: unknown locale ${locale}`)
      continue
    }
    doc.title[locale] = tr.title
    doc.summary[locale] = tr.summary
    if (!/\d/.test(tr.summary)) warn(`${a.id} ${locale}: summary has no figure`)
    if (doc.seo) {
      if (tr.seoTitle && doc.seo.metaTitle) doc.seo.metaTitle[locale] = tr.seoTitle
      if (tr.seoDescription && doc.seo.metaDescription) doc.seo.metaDescription[locale] = tr.seoDescription
      if (!tr.seoTitle || !tr.seoDescription) warn(`${a.id} ${locale}: SEO title or description missing`)
    }
    for (const section of doc.sections) {
      const st = tr.sections[section.sectionKey]
      if (!st) {
        warn(`${a.id} ${locale}: section ${section.sectionKey} not translated`)
        continue
      }
      section.heading[locale] = st.heading
      if (section.bodyText) {
        if (!st.body) warn(`${a.id} ${locale}: body of ${section.sectionKey} not translated`)
        else section.bodyText[locale] = normalizeMd(st.body)
      }
      for (const table of section.tables ?? []) {
        const tt = st.tables?.[table.tableId]
        if (!tt) {
          warn(`${a.id} ${locale}: table ${table.tableId} not translated`)
          continue
        }
        if (table.title && tt.title) table.title[locale] = tt.title
        if (tt.columns) {
          if (tt.columns.length !== table.columns.length) warn(`${a.id} ${locale} ${table.tableId}: column count`)
          table.columns.forEach((c: Record<string, string>, i: number) => {
            if (tt.columns![i]) c[locale] = tt.columns![i]
          })
        }
        if (table.methodology && tt.methodology) table.methodology[locale] = tt.methodology
        table.rows.forEach((row: Record<string, any>, i: number) => {
          const cells = tt.rows?.[i]
          if (!row.localizedCells) return
          if (!cells) {
            warn(`${a.id} ${locale} ${table.tableId}: row ${i + 1} not translated`)
            return
          }
          if (cells.length !== row.cells.length) warn(`${a.id} ${locale} ${table.tableId}: row ${i + 1} has ${cells.length} cells`)
          row.localizedCells.forEach((c: Record<string, string>, j: number) => {
            if (cells[j]) c[locale] = cells[j]
          })
        })
      }
    }
    if (tr.faq.length !== doc.faq.length) warn(`${a.id} ${locale}: ${tr.faq.length} FAQ items for ${doc.faq.length}`)
    doc.faq.forEach((f: Record<string, any>, i: number) => {
      if (!tr.faq[i]) return
      f.question[locale] = tr.faq[i].q
      f.answer[locale] = tr.faq[i].a
    })
    if (doc.gaps.length && (tr.gaps?.length ?? 0) !== doc.gaps.length) warn(`${a.id} ${locale}: gaps not translated`)
    doc.gaps.forEach((g: Record<string, any>, i: number) => {
      if (tr.gaps?.[i]) g.description[locale] = tr.gaps[i]
    })
  }
}

async function main() {
  const problems: string[] = []
  const warn = (m: string) => problems.push(m)

  // ---- ids, shapes and style
  const articleIds = new Set<string>()
  const slugs = new Set<string>()
  for (const a of ARTICLES) {
    if (!DOCUMENT_ID_PATTERN.test(a.id)) warn(`bad documentId ${a.id}`)
    if (articleIds.has(a.id)) warn(`duplicate documentId ${a.id}`)
    if (slugs.has(a.slug)) warn(`duplicate slug ${a.slug}`)
    articleIds.add(a.id)
    slugs.add(a.slug)
    if (!/\d/.test(a.summary)) warn(`${a.id}: summary has no figure`)
    if (!/20\d\d/.test(a.summary)) warn(`${a.id}: summary has no date`)
    if (a.faq.length < 3 || a.faq.length > 5) warn(`${a.id}: ${a.faq.length} FAQ items (want 3–5)`)
    for (const s of a.sections)
      for (const t of s.tables ?? [])
        for (const r of t.rows)
          if (r.cells.length !== t.columns.length) warn(`${a.id} ${t.id}: row "${r.cells[0]}" has ${r.cells.length} cells for ${t.columns.length} columns`)
    for (const text of stringsOf({...a, related: undefined}))
      for (const [re, label] of BANNED) if (re.test(text)) warn(`${a.id}: ${label} in "${text.slice(0, 80)}"`)
  }
  for (const s of SOURCES) if (!SOURCE_ID_PATTERN.test(s.sourceId)) warn(`bad sourceId ${s.sourceId}`)
  for (const f of FACTS) if (!DATA_ID_PATTERN.test(f.dataId)) warn(`bad dataId ${f.dataId}`)
  for (const f of FACTS) for (const [re, label] of BANNED) if (re.test(f.valueText + (f.methodology ?? ''))) warn(`${f.dataId}: ${label}`)

  // ---- slugs must not collide with pages already in the dataset
  const otherSlugs = await client.fetch<{documentId: string; slug: string}[]>(
    `*[_type == "knowledgeArticle" && !(documentId in $ids)]{documentId, "slug": slug.current}`,
    {ids: [...articleIds]},
  )
  for (const o of otherSlugs) if (slugs.has(o.slug)) warn(`slug ${o.slug} already used by ${o.documentId}`)

  // ---- what the pages cite
  const citedFacts = new Set<string>()
  const citedSources = new Set<string>(SOURCES.map((s) => s.sourceId))
  const factsOf = (a: ArticleSpec) => {
    const ids = new Set<string>(a.facts ?? [])
    for (const s of a.sections) for (const t of s.tables ?? []) for (const r of t.rows) for (const f of r.facts ?? []) ids.add(f)
    return [...ids]
  }
  for (const a of ARTICLES) {
    factsOf(a).forEach((f) => citedFacts.add(f))
    a.sources.forEach((s) => citedSources.add(s))
  }
  for (const f of FACTS) {
    citedSources.add(f.source)
    f.secondarySources?.forEach((s) => citedSources.add(s))
  }

  const newFactIds = new Set(FACTS.map((f) => f.dataId))
  const newSourceIds = new Set(SOURCES.map((s) => s.sourceId))
  const existingFacts = await client.fetch<{dataId: string; hasSource: boolean; isCurrent?: boolean}[]>(
    `*[_type == "knowledgeFact" && dataId in $ids]{dataId, isCurrent, "hasSource": defined(source->_id)}`,
    {ids: [...citedFacts]},
  )
  const existingSources = await client.fetch<{sourceId: string}[]>(
    `*[_type == "knowledgeSource" && sourceId in $ids]{sourceId}`,
    {ids: [...citedSources]},
  )
  const factOk = new Map<string, boolean>()
  for (const f of existingFacts) {
    factOk.set(f.dataId, f.hasSource)
    if (f.isCurrent === false && !newFactIds.has(f.dataId)) warn(`fact ${f.dataId} is superseded; cite its successor`)
  }
  for (const f of FACTS) factOk.set(f.dataId, true)
  const sourceKnown = new Set([...existingSources.map((s) => s.sourceId), ...newSourceIds])
  for (const s of citedSources) if (!sourceKnown.has(s)) warn(`source ${s} does not exist`)

  const relatedIds = [...new Set(ARTICLES.flatMap((a) => a.related ?? []))]
  const relatedFound = new Set(
    await client.fetch<string[]>(`*[_type == "knowledgeArticle" && documentId in $ids].documentId`, {ids: relatedIds}),
  )
  for (const a of ARTICLES)
    for (const r of a.related ?? []) if (!relatedFound.has(r) && !articleIds.has(r)) warn(`${a.id}: related ${r} does not exist`)

  const cities = await client.fetch<{_id: string; slug: string}[]>(`*[_type == "city"]{_id, "slug": slug.current}`)
  const cityId = new Map(cities.map((c) => [c.slug, c._id]))
  for (const a of ARTICLES) if (a.citySlug && !cityId.get(a.citySlug)) warn(`${a.id}: city ${a.citySlug} not found`)
  const author = await client.fetch<string | null>(`*[_id == $id][0]._id`, {id: AUTHOR_ID})
  if (!author) warn(`author ${AUTHOR_ID} not found`)

  // ---- placement of new facts: first table row that cites them
  const placement = new Map<string, {article: string; sectionKey: string; tableId: string; rowId: string}>()
  for (const a of ARTICLES)
    for (const s of a.sections)
      for (const t of s.tables ?? [])
        t.rows.forEach((r, i) => {
          for (const f of r.facts ?? [])
            if (newFactIds.has(f) && !placement.has(f))
              placement.set(f, {article: a.id, sectionKey: s.key, tableId: t.id, rowId: String(i + 1).padStart(2, '0')})
        })

  // ---- build documents
  const docs: Record<string, any>[] = []
  for (const s of SOURCES) {
    docs.push({
      _id: sourceDocId(s.sourceId),
      _type: 'knowledgeSource',
      sourceId: s.sourceId,
      name: s.name,
      publisher: s.publisher,
      url: s.url,
      sourceType: s.sourceType,
      priorityRank: SOURCE_TYPE_RANK[s.sourceType],
      language: s.language,
      geography: s.geography,
      dataPeriod: s.dataPeriod,
      publishedAt: s.publishedAt,
      accessedAt: s.accessedAt,
      lastVerifiedAt: s.accessedAt,
      defaultConfidence: s.defaultConfidence,
      description: s.description,
      notes: s.notes,
    })
  }

  for (const f of FACTS) {
    const place = placement.get(f.dataId)
    docs.push({
      _id: factDocId(f.dataId),
      _type: 'knowledgeFact',
      dataId: f.dataId,
      factFamily: f.factFamily,
      version: 1,
      isCurrent: true,
      category: f.category,
      metric: f.metric,
      title: f.title,
      dataKind: f.dataKind,
      value: f.value,
      valueLow: f.valueLow,
      valueHigh: f.valueHigh,
      unit: f.unit,
      valueText: f.valueText,
      originalValue: f.originalValue,
      originalCurrency: f.originalCurrency,
      ...(f.originalCurrency === 'ALL' ? {exchangeRate: RATE, exchangeRateDate: RATE_DATE} : {}),
      ...(f.citySlug && cityId.get(f.citySlug) ? {city: ref(cityId.get(f.citySlug)!)} : {}),
      geography: f.geography,
      period: f.period,
      validFrom: f.validFrom,
      source: ref(sourceDocId(f.source)),
      ...(f.secondarySources?.length
        ? {secondarySources: f.secondarySources.map((s) => ref(sourceDocId(s), keyOf(s)))}
        : {}),
      confidence: f.confidence,
      methodology: f.methodology,
      rawQuote: f.rawQuote,
      accessedAt: TODAY,
      lastVerifiedAt: TODAY,
      ...(place
        ? {article: ref(articleDocId(place.article)), sectionKey: place.sectionKey, tableId: place.tableId, rowId: place.rowId}
        : {}),
      searchText: [f.metric, f.category, f.geography, f.title].join(' '),
    })
  }

  const report: {id: string; slug: string; locales: string[]; facts: number; sources: number; ready: boolean; why?: string}[] = []
  for (const a of ARTICLES) {
    const facts = factsOf(a)
    const missing = facts.filter((f) => !factOk.has(f))
    const unsourced = facts.filter((f) => factOk.get(f) === false)
    const why = [
      missing.length ? `missing facts ${missing.join(',')}` : '',
      unsourced.length ? `facts without source ${unsourced.join(',')}` : '',
      a.sources.length === 0 ? 'no sources' : '',
      a.sources.some((s) => !sourceKnown.has(s)) ? 'unknown source' : '',
    ].filter(Boolean)
    if (why.length) warn(`${a.id}: ${why.join('; ')}`)

    const sections = a.sections.map((s) => ({
      _type: 'knowledgeSection',
      _key: keyOf(s.key),
      sectionKey: s.key,
      heading: ls(s.heading),
      ...(s.body ? {bodyText: lt(normalizeMd(s.body))} : {}),
      ...(s.tables?.length
        ? {
            tables: s.tables.map((t) => ({
              _type: 'knowledgeTable',
              _key: keyOf(t.id),
              tableId: t.id,
              ...(t.title ? {title: ls(t.title)} : {}),
              columns: t.columns.map((c, i) => ({...ls(c), _key: `c${i}`})),
              rows: t.rows.map((r, i) => {
                const rowId = String(i + 1).padStart(2, '0')
                return {
                  _type: 'knowledgeRow',
                  _key: `r${rowId}`,
                  rowId,
                  cells: r.cells,
                  ...(r.cells.some(hasWords) ? {localizedCells: r.cells.map((c, j) => ({...ls(c), _key: `l${j}`}))} : {}),
                  ...(r.facts?.length ? {facts: r.facts.map((f) => ref(factDocId(f), keyOf(f)))} : {}),
                  ...(r.note ? {note: r.note} : {}),
                }
              }),
              ...(t.methodology ? {methodology: lt(t.methodology)} : {}),
              ...(t.confidence ? {confidence: t.confidence} : {}),
            })),
          }
        : {}),
    }))

    const doc: Record<string, any> = {
      _id: articleDocId(a.id),
      _type: 'knowledgeArticle',
      documentId: a.id,
      slug: {_type: 'slug', current: a.slug},
      title: ls(a.title),
      summary: lt(a.summary),
      category: a.category,
      topicGroup: a.group,
      tags: a.tags,
      ...(a.citySlug && cityId.get(a.citySlug) ? {city: ref(cityId.get(a.citySlug)!)} : {}),
      questionSet: [a.title, ...a.faq.map((f) => f.q)].map((q, i) => ({...ls(q), _key: `q${i}`})),
      sections,
      faq: a.faq.map((f, i) => ({
        _type: 'localizedFaqItem',
        _key: `faq${i + 1}`,
        question: ls(f.q),
        answer: lt(f.a),
      })),
      sources: a.sources.map((s) => ref(sourceDocId(s), keyOf(s))),
      facts: facts.map((f) => ref(factDocId(f), keyOf(f))),
      author: ref(AUTHOR_ID),
      dataPeriod: a.dataPeriod,
      confidence: a.confidence,
      exchangeRateNote: `${RATE} ALL/EUR, Bank of Albania, ${RATE_DATE}`,
      lastUpdated: TODAY,
      nextReviewAt: addMonths(TODAY, a.reviewMonths ?? 6),
      gaps: (a.gaps ?? []).map((g) => ({_type: 'knowledgeGap', _key: keyOf(g.id), gapId: g.id, description: ls(g.text), priority: g.priority})),
      relatedArticles: (a.related ?? []).map((r) => ref(articleDocId(r), keyOf(r))),
      isPublished: false,
      ...(a.seoTitle || a.seoDescription
        ? {
            seo: {
              _type: 'localizedSeo',
              ...(a.seoTitle ? {metaTitle: ls(a.seoTitle)} : {}),
              ...(a.seoDescription ? {metaDescription: lt(a.seoDescription)} : {}),
            },
          }
        : {}),
    }
    applyTranslations(doc, a, warn)
    docs.push(doc)
    report.push({
      id: a.id,
      slug: a.slug,
      locales: ['en', ...Object.keys(a.tr ?? {})],
      facts: facts.length,
      sources: new Set([
        ...a.sources,
        ...FACTS.filter((f) => facts.includes(f.dataId)).map((f) => f.source),
      ]).size,
      ready: why.length === 0 && !!author,
      why: why.join('; ') || undefined,
    })
  }

  // ---- drop undefined; keep editor fields on a re-run
  const clean = (v: unknown) => JSON.parse(JSON.stringify(v))
  const ids = docs.map((d) => String(d._id))
  const existing = await client.fetch<Record<string, unknown>[]>(`*[_id in $ids]`, {ids})
  const existingById = new Map(existing.map((d) => [String(d._id), d]))
  const finalDocs = docs.map((d) => {
    const next = clean(d) as Record<string, unknown>
    const prev = existingById.get(String(d._id))
    if (!prev) return next
    for (const k of ['reviewedBy', 'reviewedAt', 'isPublished']) if (prev[k] !== undefined) next[k] = prev[k]
    return next
  })

  // ---- report
  console.log(`sources: ${SOURCES.length} new/updated; facts: ${FACTS.length} new/updated`)
  console.log(`articles: ${ARTICLES.length}`)
  for (const r of report)
    console.log(`  ${r.ready ? 'ok ' : 'BAD'} ${r.id.padEnd(26)} ${r.slug.padEnd(58)} ${r.locales.join(',').padEnd(8)} facts ${r.facts}, sources ${r.sources}`)
  console.log(`existing documents that will be replaced: ${existing.length}`)
  if (problems.length) {
    console.log(`\n${problems.length} problem(s):`)
    problems.forEach((p) => console.log(`  - ${p}`))
    process.exit(1)
  }

  if (dry) {
    fs.writeFileSync(path.join(DATA_DIR, 'preview.json'), JSON.stringify(finalDocs, null, 2))
    console.log(`\nDry run: preview written to ${path.join(DATA_DIR, 'preview.json')}. Nothing sent.`)
    return
  }

  fs.writeFileSync(path.join(DATA_DIR, `backup-${Date.now()}.json`), JSON.stringify(existing, null, 2))
  const tx = client.transaction()
  for (const d of finalDocs) tx.createOrReplace(d as {_id: string; _type: string})
  const res = await tx.commit()
  console.log(`\ncommitted transaction ${res.transactionId}: ${finalDocs.length} documents`)
  fs.writeFileSync(path.join(DATA_DIR, 'seed-report.json'), JSON.stringify(report, null, 2))
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
