/**
 * Seeds the knowledge-base question pages: 30 `knowledgeArticle` documents
 * (English master), the `knowledgeFact` and `knowledgeSource` documents they
 * cite, and the supersession of two research facts that were out of date
 * (ASHK fee 3,500 → 5,000 ALL; "2% transfer tax" → land only).
 *
 * Data lives in scripts/data/knowledge-base-2026-10-19/. Ids are deterministic
 * (knowledge.article.<documentId>, knowledge.fact.<dataId>,
 * knowledge.source.<sourceId>), so a re-run updates in place. A re-run keeps
 * every translation whose English text has not changed: other locales are
 * filled afterwards by
 *   npx tsx scripts/translateLocaleGaps.ts --execute --types knowledgeArticle
 * and the seed must not wipe them.
 *
 * A page is published only when every fact it cites exists, every fact has a
 * source, and the page lists at least one source of its own. Anything else is
 * written with isPublished=false and reported.
 *
 * Section prose goes to `bodyText` (localizedText), not the rich `body`: the
 * dataset is capped at 2,000 unique attribute paths, and rich text in seven
 * languages cost about eleven paths per language — the Russian and Albanian
 * translations of the first run were refused at 2,009. The seed moves any
 * `body` written by that first run into `bodyText`, translations included, and
 * keeps `questionSet` English-only (the FAQ carries the translated questions).
 *
 * Run:
 *   npx tsx scripts/seedKnowledgeBase20261019.ts --dry
 *   npx tsx scripts/seedKnowledgeBase20261019.ts --execute
 * --execute writes a backup of every document it replaces first.
 * --carry-from <backup.json>: take section bodies (and their translations)
 * from a backup when the live document no longer has them.
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {SOURCE_TYPE_RANK, DATA_ID_PATTERN, SOURCE_ID_PATTERN, DOCUMENT_ID_PATTERN} from '../schemaTypes/constants/knowledge'
import {SOURCES} from './data/knowledge-base-2026-10-19/sources'
import {FACTS} from './data/knowledge-base-2026-10-19/facts'
import {ARTICLES_BUYING} from './data/knowledge-base-2026-10-19/articlesBuying'
import {ARTICLES_MONEY} from './data/knowledge-base-2026-10-19/articlesMoney'
import {ARTICLES_OWNERSHIP} from './data/knowledge-base-2026-10-19/articlesOwnership'
import {ARTICLES_GEOGRAPHY} from './data/knowledge-base-2026-10-19/articlesGeography'
import type {ArticleSpec, Md} from './data/knowledge-base-2026-10-19/types'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.includes('--execute')
const carryArg = process.argv.indexOf('--carry-from')
const carryFrom: Map<string, Record<string, unknown>[]> = new Map(
  carryArg > 0
    ? (JSON.parse(fs.readFileSync(process.argv[carryArg + 1], 'utf8')) as Record<string, unknown>[]).map((d) => [
        String(d._id),
        (d.sections ?? []) as Record<string, unknown>[],
      ])
    : [],
)
const dry = process.argv.includes('--dry')
if (execute === dry) {
  console.error('Use --dry or --execute.')
  process.exit(1)
}

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

const TODAY = '2026-10-19'
const AUTHOR_ID = 'blogAuthor-fedir-alpatov'
const RATE = 92.02
const RATE_DATE = '2026-09-09'
const DATA_DIR = path.resolve(process.cwd(), 'scripts/data/knowledge-base-2026-10-19')

const ARTICLES: ArticleSpec[] = [...ARTICLES_BUYING, ...ARTICLES_MONEY, ...ARTICLES_OWNERSHIP, ...ARTICLES_GEOGRAPHY]

const sourceDocId = (id: string) => `knowledge.source.${id}`
const factDocId = (id: string) => `knowledge.fact.${id}`
const articleDocId = (id: string) => `knowledge.article.${id}`
const keyOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
const ref = (id: string, key?: string) => ({_type: 'reference', _ref: id, ...(key ? {_key: key} : {})})
const ls = (en: string) => ({_type: 'localizedString', en})
const lt = (en: string) => ({_type: 'localizedText', en})

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

/** Plain blocks written by the first run → the same text format. */
function blocksToMd(blocks: unknown): string {
  if (!Array.isArray(blocks)) return ''
  const parts: string[] = []
  blocks.forEach((b: {listItem?: string; children?: {text?: string}[]}, i) => {
    const text = (b.children ?? []).map((c) => c.text ?? '').join('')
    const prevBullet = i > 0 && (blocks[i - 1] as {listItem?: string}).listItem === 'bullet'
    if (b.listItem === 'bullet' && prevBullet) parts[parts.length - 1] += `\n- ${text}`
    else parts.push(b.listItem === 'bullet' ? `- ${text}` : text)
  })
  return parts.join('\n\n')
}

/** A previous section's rich `body` as a `bodyText` value, every locale it had. */
function bodyAsText(section: Record<string, unknown>): Record<string, unknown> | undefined {
  const body = section.body as Record<string, unknown> | undefined
  if (!body || section.bodyText) return section.bodyText as Record<string, unknown> | undefined
  const out: Record<string, unknown> = {_type: 'localizedText'}
  for (const l of LOCALES) if (Array.isArray(body[l]) && (body[l] as unknown[]).length) out[l] = blocksToMd(body[l])
  return out
}

/** True when a cell has words in it once the index tokens are removed. */
const hasWords = (cell: string) => /\p{L}{2,}/u.test(cell.replace(/\{\{[^}]*\}\}/g, ''))

/* ------------------------------------------------------- merge locales --- */

const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl', 'de']
const isLocalized = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v) && 'en' in (v as object) &&
  Object.keys(v as object).every((k) => k.startsWith('_') || LOCALES.includes(k))

const blockText = (v: unknown) =>
  JSON.stringify(
    (Array.isArray(v) ? v : []).map((b: {children?: {text?: string}[]; listItem?: string}) => [
      b.listItem ?? '',
      (b.children ?? []).map((c) => c.text ?? '').join(''),
    ]),
  )

/**
 * Carries the translations of an existing document over to the new value
 * wherever the English is unchanged. Arrays are matched by `_key`.
 */
function mergeLocales(next: unknown, prev: unknown): unknown {
  if (isLocalized(next) && isLocalized(prev)) {
    const sameEn = Array.isArray(next.en)
      ? blockText(next.en) === blockText(prev.en)
      : typeof next.en === 'string' && next.en === prev.en
    if (!sameEn) return next
    const out: Record<string, unknown> = {...next}
    for (const l of LOCALES) if (l !== 'en' && prev[l] !== undefined && out[l] === undefined) out[l] = prev[l]
    return out
  }
  if (Array.isArray(next) && Array.isArray(prev)) {
    const byKey = new Map(prev.filter((p) => p && typeof p === 'object' && '_key' in p).map((p) => [(p as {_key: string})._key, p]))
    return next.map((item) => (item && typeof item === 'object' && '_key' in item ? mergeLocales(item, byKey.get((item as {_key: string})._key)) : item))
  }
  if (next && typeof next === 'object' && prev && typeof prev === 'object' && !Array.isArray(next)) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(next as Record<string, unknown>)) out[k] = mergeLocales(v, (prev as Record<string, unknown>)[k])
    return out
  }
  return next
}

/* ---------------------------------------------------------------- main --- */

async function main() {
  const problems: string[] = []
  const warn = (m: string) => problems.push(m)

  // ---- ids and shapes
  const articleIds = new Set<string>()
  const slugs = new Set<string>()
  for (const a of ARTICLES) {
    if (!DOCUMENT_ID_PATTERN.test(a.id)) warn(`bad documentId ${a.id}`)
    if (articleIds.has(a.id)) warn(`duplicate documentId ${a.id}`)
    if (slugs.has(a.slug)) warn(`duplicate slug ${a.slug}`)
    articleIds.add(a.id)
    slugs.add(a.slug)
    if (!/\d/.test(a.summary)) warn(`${a.id}: summary has no figure`)
    if (a.faq.length < 3 || a.faq.length > 5) warn(`${a.id}: ${a.faq.length} FAQ items (want 3–5)`)
    for (const s of a.sections)
      for (const t of s.tables ?? [])
        for (const r of t.rows)
          if (r.cells.length !== t.columns.length) warn(`${a.id} ${t.id}: row "${r.cells[0]}" has ${r.cells.length} cells for ${t.columns.length} columns`)
    for (const rel of a.related ?? []) if (!ARTICLES.some((x) => x.id === rel)) warn(`${a.id}: related ${rel} does not exist`)
  }
  for (const s of SOURCES) if (!SOURCE_ID_PATTERN.test(s.sourceId)) warn(`bad sourceId ${s.sourceId}`)
  for (const f of FACTS) if (!DATA_ID_PATTERN.test(f.dataId)) warn(`bad dataId ${f.dataId}`)

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
  const existingFacts = await client.fetch<{dataId: string; version?: number; hasSource: boolean; _id: string}[]>(
    `*[_type == "knowledgeFact" && dataId in $ids]{_id, dataId, version, "hasSource": defined(source->_id)}`,
    {ids: [...citedFacts, ...FACTS.map((f) => f.supersedes).filter(Boolean)]},
  )
  const existingSources = await client.fetch<{sourceId: string}[]>(
    `*[_type == "knowledgeSource" && sourceId in $ids]{sourceId}`,
    {ids: [...citedSources]},
  )
  const factOk = new Map<string, boolean>()
  for (const f of existingFacts) factOk.set(f.dataId, f.hasSource)
  for (const f of FACTS) factOk.set(f.dataId, true)
  const sourceKnown = new Set([...existingSources.map((s) => s.sourceId), ...newSourceIds])
  for (const s of citedSources) if (!sourceKnown.has(s)) warn(`source ${s} does not exist`)
  for (const f of FACTS) if (!sourceKnown.has(f.source)) warn(`${f.dataId}: source ${f.source} does not exist`)

  const cities = await client.fetch<{_id: string; slug: string}[]>(`*[_type == "city"]{_id, "slug": slug.current}`)
  const cityId = new Map(cities.map((c) => [c.slug, c._id]))
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
  const docs: Record<string, unknown>[] = []
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

  const prevVersion = new Map(existingFacts.map((f) => [f.dataId, f.version ?? 1]))
  for (const f of FACTS) {
    const place = placement.get(f.dataId)
    docs.push({
      _id: factDocId(f.dataId),
      _type: 'knowledgeFact',
      dataId: f.dataId,
      factFamily: f.factFamily,
      version: f.supersedes ? (prevVersion.get(f.supersedes) ?? 1) + 1 : 1,
      ...(f.supersedes ? {supersedes: ref(factDocId(f.supersedes))} : {}),
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

  const publishReport: {id: string; slug: string; published: boolean; why?: string}[] = []
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
    const published = why.length === 0 && !!author
    publishReport.push({id: a.id, slug: a.slug, published, why: why.join('; ') || undefined})

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

    docs.push({
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
      isPublished: published,
      ...(a.seoTitle || a.seoDescription
        ? {
            seo: {
              _type: 'localizedSeo',
              ...(a.seoTitle ? {metaTitle: ls(a.seoTitle)} : {}),
              ...(a.seoDescription ? {metaDescription: lt(a.seoDescription)} : {}),
            },
          }
        : {}),
    })
  }

  // ---- drop undefined, merge kept translations
  const clean = (v: unknown) => JSON.parse(JSON.stringify(v))
  const ids = docs.map((d) => String(d._id))
  const supersededIds = FACTS.filter((f) => f.supersedes).map((f) => factDocId(f.supersedes!))
  const existing = await client.fetch<Record<string, unknown>[]>(`*[_id in $ids]`, {ids: [...ids, ...supersededIds]})
  const existingById = new Map(existing.map((d) => [String(d._id), d]))
  const finalDocs = docs.map((d) => {
    const prev = existingById.get(String(d._id))
    const next = clean(d)
    if (!prev) return next
    if (Array.isArray(prev.sections)) {
      const carried = carryFrom.get(String(d._id)) ?? []
      prev.sections = (prev.sections as Record<string, unknown>[]).map((sec) => {
        const old = carried.find((c) => c._key === sec._key)
        return {...sec, bodyText: bodyAsText(sec.body || sec.bodyText ? sec : {...sec, body: old?.body})}
      })
    }
    // reviewedBy / reviewedAt are set by hand after review: never clear them.
    const merged = mergeLocales(next, prev) as Record<string, unknown>
    for (const k of ['reviewedBy', 'reviewedAt']) if (prev[k] !== undefined) merged[k] = prev[k]
    if (Array.isArray(merged.questionSet))
      merged.questionSet = (merged.questionSet as Record<string, unknown>[]).map(({_key, _type, en}) => ({_key, _type, en}))
    return merged
  })

  // ---- report
  const published = publishReport.filter((p) => p.published).length
  console.log(`sources: ${SOURCES.length} new/updated; facts: ${FACTS.length} new/updated, ${supersededIds.length} superseded`)
  console.log(`articles: ${ARTICLES.length} (${published} publishable)`)
  for (const p of publishReport.filter((x) => !x.published)) console.log(`  unpublished ${p.id}: ${p.why}`)
  console.log(`existing documents that will be replaced: ${existing.filter((d) => ids.includes(String(d._id))).length}`)
  if (problems.length) {
    console.log(`\n${problems.length} problem(s):`)
    problems.forEach((p) => console.log(`  - ${p}`))
    process.exit(1)
  }
  const gapCount = ARTICLES.reduce((n, a) => n + (a.gaps?.length ?? 0), 0)
  console.log(`gaps listed: ${gapCount} (${ARTICLES.flatMap((a) => a.gaps ?? []).filter((g) => g.priority === 'HIGH').length} HIGH)`)

  if (dry) {
    fs.writeFileSync(path.join(DATA_DIR, 'preview.json'), JSON.stringify(finalDocs, null, 2))
    console.log(`\nDry run: preview written to ${path.join(DATA_DIR, 'preview.json')}. Nothing sent.`)
    return
  }

  fs.writeFileSync(path.join(DATA_DIR, `backup-${Date.now()}.json`), JSON.stringify(existing, null, 2))
  const tx = client.transaction()
  for (const d of finalDocs) tx.createOrReplace(d as {_id: string; _type: string})
  for (const f of FACTS.filter((x) => x.supersedes)) {
    if (!existingById.has(factDocId(f.supersedes!))) continue
    tx.patch(factDocId(f.supersedes!), (p) =>
      p.set({isCurrent: false, ...(f.validFrom ? {validUntil: f.validFrom} : {})}),
    )
  }
  const res = await tx.commit()
  console.log(`\ncommitted transaction ${res.transactionId}: ${finalDocs.length} documents, ${supersededIds.length} superseded`)
  fs.writeFileSync(path.join(DATA_DIR, 'publish-report.json'), JSON.stringify(publishReport, null, 2))
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
