/**
 * Numbered markdown documents of the research repo → `knowledgeArticle`.
 *
 * The research documents are already written as addressable structures:
 * a fenced metadata block, `## SECTION_ID: KEY — Heading`, `### Table TABLE_ID`
 * followed by a markdown table whose first column is a stable `row_id`. This
 * importer preserves exactly that shape, so a citation minted today
 * (DOC § SECTION › TABLE row 04 → DATA-…) keeps resolving after edits.
 *
 * English only: translations are a Studio job afterwards, because a machine
 * translation of a tariff table is a good way to publish a wrong number.
 *
 * Dry run:  npm run knowledge:articles
 * Apply:    npm run knowledge:articles:apply
 */
import fs from 'node:fs'
import path from 'node:path'
import {getSanityClientForScripts} from '../lib/sanityEnvClient'
import {
  articleDocId,
  categoryFor,
  citySlugFor,
  DATA_ID_RE,
  factDocId,
  factFamily,
  hasFlag,
  isoDate,
  knowledgeDir,
  localizedString,
  localizedText,
  logTable,
  markdownToBlocks,
  nextKey,
  normalizeConfidence,
  sourceDocId,
} from './lib'

/** Documents to publish. Reference material (schema, methodology) stays internal. */
const PUBLISHABLE = /^(0[4-9]|1[0-9]|2[0-6])-/

type ParsedTable = {
  tableId: string
  title?: string
  columns: string[]
  rows: Array<{rowId: string; cells: string[]; dataIds: string[]}>
  methodology?: string
}

type ParsedSection = {
  sectionKey: string
  heading: string
  prose: string
  tables: ParsedTable[]
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[ë]/g, 'e')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .filter((part) => part && !['the', 'for', 'and', 'in', 'of', 'a', 'by'].includes(part))
    .slice(0, 9)
    .join('-')
}

/** The fenced block right under the H1 carries the document's metadata. */
function parseFrontBlock(markdown: string): Record<string, string> {
  const match = markdown.match(/```\n([\s\S]*?)\n```/)
  if (!match) return {}
  const out: Record<string, string> = {}
  let key = ''
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/)
    if (kv) {
      key = kv[1]
      out[key] = kv[2].trim()
    } else if (key && line.trim()) {
      out[key] = `${out[key]} ${line.trim()}`.trim()
    }
  }
  return out
}

/** A markdown table block → columns, rows and the data ids each row cites. */
function parseTable(lines: string[]): {columns: string[]; rows: ParsedTable['rows']} | null {
  const tableLines = lines.filter((l) => l.trim().startsWith('|'))
  if (tableLines.length < 3) return null
  const cells = (line: string) =>
    line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim())

  const header = cells(tableLines[0])
  const body = tableLines.slice(2).filter((l) => !/^\|[\s:|-]+\|?$/.test(l.trim()))

  // A leading `row_id` column is the row's identity, not a value: it becomes
  // `rowId` and drops out of the rendered cells.
  const hasRowIdColumn = /^row[_ ]?id$/i.test(header[0] || '')
  const columns = hasRowIdColumn ? header.slice(1) : header

  const rows = body.map((line, index) => {
    const all = cells(line)
    const rowId = hasRowIdColumn ? all[0] || String(index + 1).padStart(2, '0') : String(index + 1).padStart(2, '0')
    const values = hasRowIdColumn ? all.slice(1) : all
    const dataIds = Array.from(new Set(line.match(DATA_ID_RE) || []))
    return {rowId: rowId.replace(/\D/g, '') || String(index + 1).padStart(2, '0'), cells: values, dataIds}
  })
  return {columns, rows}
}

/**
 * Section headings come in two shapes. Hand-written documents use
 * `## SECTION_ID: KEY — Heading`, where the heading may instead be a
 * parenthesised qualifier (`KEY (ESTIMATE, formula …)`). Generated documents
 * (the ROI scenario tables) use a bare `## KEY — Heading`. Both are addressable,
 * so both are accepted; the bare form is only trusted when a document has no
 * explicit SECTION_ID at all, so an ordinary `## Questions…` heading in a
 * hand-written file is never mistaken for a section.
 */
const SECTION_ID_HEAD = /^## SECTION_ID:\s*([A-Z0-9_]+)\s*(?:[—–-]\s*)?(.*)$/m
const BARE_KEY_HEAD = /^##\s+([A-Z][A-Z0-9_]{2,})\s*(?:[—–-]\s*)?(.*)$/m

function parseSections(body: string): ParsedSection[] {
  const sections: ParsedSection[] = []
  const chunks = body.split(/\n(?=## )/)
  const explicit = SECTION_ID_HEAD.test(body)
  for (const chunk of chunks) {
    const head = chunk.match(explicit ? SECTION_ID_HEAD : BARE_KEY_HEAD)
    if (!head) continue
    const sectionKey = head[1]
    const heading = (head[2] || sectionKey.replace(/_/g, ' ')).trim()
    const rest = chunk.slice(chunk.indexOf('\n', chunk.indexOf(head[0])) + 1)

    const tables: ParsedTable[] = []
    const proseParts: string[] = []
    const blocks = rest.split(/\n(?=### )/)

    for (const block of blocks) {
      const tableHead = block.match(/^###\s+Table\s+([A-Z][A-Z0-9_]*)\s*(.*)$/m)
      const lines = block.split('\n')
      if (tableHead) {
        const parsed = parseTable(lines)
        if (parsed) {
          const after = lines
            .filter((l) => !l.trim().startsWith('|') && !l.startsWith('###'))
            .join('\n')
            .trim()
          tables.push({
            tableId: tableHead[1],
            title: tableHead[2]?.replace(/^[（(]|[）)]$/g, '').trim() || undefined,
            columns: parsed.columns,
            rows: parsed.rows,
            methodology: after || undefined,
          })
          continue
        }
      }
      // A bare table with no "### Table" heading still deserves to be a table.
      if (lines.some((l) => l.trim().startsWith('|'))) {
        const parsed = parseTable(lines)
        if (parsed) {
          tables.push({
            tableId: `${sectionKey}_${tables.length + 1}`,
            columns: parsed.columns,
            rows: parsed.rows,
          })
          proseParts.push(lines.filter((l) => !l.trim().startsWith('|')).join('\n'))
          continue
        }
      }
      proseParts.push(block)
    }
    sections.push({sectionKey, heading, prose: proseParts.join('\n\n').trim(), tables})
  }
  return sections
}

function parseQuestions(body: string): string[] {
  const match = body.match(/## Questions this document answers\n([\s\S]*?)(?=\n##|\n---)/)
  if (!match) return []
  return match[1]
    .split('?')
    .map((q) => q.replace(/\s+/g, ' ').trim())
    .filter((q) => q.length > 8)
    .map((q) => `${q}?`)
    .slice(0, 20)
}

const REVIEW_DAYS: Record<string, number> = {
  electricity: 180,
  water: 180,
  internet: 180,
  gas: 180,
  taxes: 180,
  legal: 180,
  building_fees: 180,
}

function reviewDate(lastUpdated: string, category: string): string {
  const days = REVIEW_DAYS[category] ?? 365
  const base = new Date(`${lastUpdated}T00:00:00Z`)
  base.setUTCDate(base.getUTCDate() + days)
  return base.toISOString().slice(0, 10)
}


/**
 * Source of record for values the research base derives rather than reads.
 *
 * Formula inputs — an inverter's average draw factor, litres per person per
 * day, the furnishing budget per m² — are defined in the documents' own tables
 * and cited from the rows they feed. Without a fact behind those ids the
 * citation silently disappears, which is the worst of both worlds: a number on
 * the page and nothing to check it against. They get real fact documents,
 * marked ESTIMATE and pointing at the row that defines them.
 */
const DERIVED_SOURCE_ID = 'INTERNAL-CALC-001'

const DERIVED_SOURCE = {
  _id: sourceDocId(DERIVED_SOURCE_ID),
  _type: 'knowledgeSource' as const,
  sourceId: DERIVED_SOURCE_ID,
  name: 'DomLivo research calculation engine',
  publisher: 'DomLivo Research Department',
  sourceType: 'internal_calculation',
  priorityRank: 9,
  accessedAt: '2026-09-10',
  defaultConfidence: 'ESTIMATE',
  description:
    'Parameters derived inside the knowledge base (12-ai-database/data/calc_engine.py and the documents\' own tables), not read from an outside publication.',
}

type DerivedDefinition = {
  dataId: string
  documentId: string
  sectionKey: string
  tableId: string
  rowId: string
  cells: string[]
  period?: string
}

async function main(): Promise<void> {
  const apply = hasFlag('--apply')
  const dir = knowledgeDir()
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') && PUBLISHABLE.test(f))
    .sort()

  console.log(`Knowledge articles from ${dir}`)
  console.log(`${files.length} documents${apply ? '' : ' (dry run — pass --apply to write)'}\n`)

  const client = getSanityClientForScripts()
  const cities = await client.fetch<Array<{_id: string; slug: string}>>(
    `*[_type == "city" && defined(slug.current)]{_id, "slug": slug.current}`,
  )
  const cityIdBySlug = new Map(cities.map((c) => [c.slug, c._id]))
  const knownFacts = new Set(await client.fetch<string[]>(`*[_type == "knowledgeFact"].dataId`))

  const tx = client.transaction()
  const report: Array<[string, string | number]> = []
  // Where each unknown id is defined, so a stub can point back at its row.
  const derived = new Map<string, DerivedDefinition>()
  let missingFacts = 0
  let totalTables = 0
  let totalRows = 0

  for (const file of files) {
    // Normalised to LF first: the generated scenario file is written on
    // Windows, and a CRLF after the opening fence made the metadata block
    // invisible to the parser — the document silently stopped importing.
    const markdown = fs.readFileSync(path.join(dir, file), 'utf8').replace(/\r\n?/g, '\n')
    const h1 = markdown.match(/^#\s+(.*)$/m)?.[1] || file
    const front = parseFrontBlock(markdown)
    const documentId = front.document_id
    if (!documentId) {
      console.log(`  skip ${file}: no document_id in the metadata block`)
      continue
    }

    const body = markdown.slice(markdown.indexOf('```', markdown.indexOf('```') + 3) + 3)
    const sections = parseSections(body)
    const questions = parseQuestions(body)
    const category = (front.category || '').split(',')[0].trim() || 'market_analysis'
    const lastUpdated = isoDate(front.last_updated) || '2026-09-10'

    // Gaps live in their own section as a table; lift them into the field so
    // the page can show "what we do not have" next to what we do.
    const gapsSection = sections.find((s) => s.sectionKey === 'GAPS')
    const gaps = (gapsSection?.tables[0]?.rows || []).map((row, index) => ({
      _type: 'knowledgeGap',
      _key: `gap${index}`,
      gapId: row.cells[0]?.slice(0, 40),
      description: localizedString(row.cells[1]),
      priority: /HIGH|MEDIUM|LOW/i.exec(row.cells[2] || '')?.[0]?.toUpperCase(),
    }))

    const factRefs = new Set<string>()
    const sectionDocs = sections
      .filter((s) => s.sectionKey !== 'GAPS')
      .map((section) => {
        const tables = section.tables.map((table) => {
          totalTables += 1
          const rows = table.rows.map((row) => {
            totalRows += 1
            const refs = row.dataIds.filter((id) => {
              if (!knownFacts.has(id)) {
                // Not in facts.json: a parameter the documents define
                // themselves. Remember where, and give it a fact of its own
                // below rather than dropping the citation.
                if (!derived.has(id)) {
                  derived.set(id, {
                    dataId: id,
                    documentId,
                    sectionKey: section.sectionKey,
                    tableId: table.tableId,
                    rowId: row.rowId,
                    cells: row.cells,
                    period: front.data_period,
                  })
                }
                missingFacts += 1
                return false
              }
              factRefs.add(id)
              return true
            })
            return {
              _type: 'knowledgeRow',
              _key: nextKey('row'),
              rowId: row.rowId,
              cells: row.cells,
              facts: refs.map((id, i) => ({
                _type: 'reference',
                _ref: factDocId(id),
                _key: `f${i}`,
              })),
            }
          })
          return {
            _type: 'knowledgeTable',
            _key: nextKey('tbl'),
            tableId: table.tableId,
            title: localizedString(table.title),
            columns: table.columns.map((c) => ({...localizedString(c)!, _key: nextKey('col')})),
            rows,
            methodology: localizedText(table.methodology),
          }
        })
        return {
          _type: 'knowledgeSection',
          _key: nextKey('sec'),
          sectionKey: section.sectionKey,
          heading: localizedString(section.heading),
          body: section.prose
            ? {_type: 'localizedBlockContent', en: markdownToBlocks(section.prose)}
            : undefined,
          tables,
        }
      })

    const citySlug = citySlugFor(front.city, h1)
    const cityId = citySlug ? cityIdBySlug.get(citySlug) : undefined

    const doc = {
      _id: articleDocId(documentId),
      _type: 'knowledgeArticle' as const,
      documentId,
      slug: {_type: 'slug' as const, current: slugify(front.title || h1.replace(/^\d+\s*[—–-]\s*/, ''))},
      title: localizedString(h1.replace(/^\d+\s*[—–-]\s*/, '')),
      summary: localizedText(front.summary),
      category,
      tags: (front.category || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      city: cityId ? {_type: 'reference' as const, _ref: cityId} : undefined,
      questionSet: questions.map((q) => ({...localizedString(q)!, _key: nextKey('q')})),
      sections: sectionDocs,
      facts: Array.from(factRefs).map((id, i) => ({
        _type: 'reference' as const,
        _ref: factDocId(id),
        _key: `af${i}`,
      })),
      dataPeriod: front.data_period,
      confidence: normalizeConfidence(front.confidence),
      exchangeRateNote: front.exchange_rate,
      lastUpdated,
      nextReviewAt: reviewDate(lastUpdated, category),
      gaps,
      sourceFile: `12-ai-database/${file}`,
      isPublished: false,
    }

    report.push([
      `${documentId}`,
      `${sectionDocs.length} sections · ${doc.sections.reduce((n, s) => n + s.tables.length, 0)} tables · ${factRefs.size} facts · ${questions.length} questions`,
    ])

    tx.createIfNotExists({...doc, isPublished: false})
    // Structure is re-imported wholesale; `isPublished`, translations and SEO
    // are editor territory and are not touched on re-run.
    // Empty fields are unset, not skipped: a summary or a city removed upstream
    // must disappear here too, rather than lingering from the previous import.
    const {_id, _type, isPublished, ...fields} = doc
    const present = Object.entries(fields).filter(([, v]) => v !== undefined)
    const absent = Object.entries(fields)
      .filter(([, v]) => v === undefined)
      .map(([key]) => key)
    tx.patch(_id, (p) => {
      const patched = p.set(Object.fromEntries(present) as Record<string, unknown>)
      return absent.length > 0 ? patched.unset(absent) : patched
    })
  }

  // Derived parameters become facts of their own. The row that defines them is
  // the value: it is where a reader would look anyway, so it is what the fact
  // carries, verbatim.
  if (derived.size > 0) {
    tx.createIfNotExists(DERIVED_SOURCE)
    for (const definition of derived.values()) {
      const label = definition.cells[0]?.slice(0, 300) || definition.dataId
      tx.createIfNotExists({
        _id: factDocId(definition.dataId),
        _type: 'knowledgeFact',
        dataId: definition.dataId,
        factFamily: factFamily(definition.dataId),
        version: 1,
        isCurrent: true,
        category: categoryFor(definition.dataId),
        metric: definition.dataId.toLowerCase().replace(/-/g, '_'),
        title: label,
        dataKind: 'model_estimate',
        unit: 'derived',
        valueText: definition.cells.filter(Boolean).join(' · ').slice(0, 2000),
        geography: 'Albania',
        season: 'annual',
        period: definition.period?.slice(0, 60) || '2026',
        confidence: 'ESTIMATE',
        methodology: `Derived parameter, defined in ${definition.documentId} § ${definition.sectionKey} › ${definition.tableId} row ${definition.rowId}.`,
        source: {_type: 'reference', _ref: sourceDocId(DERIVED_SOURCE_ID)},
        accessedAt: '2026-09-10',
        lastVerifiedAt: '2026-09-10',
        searchText: `${definition.dataId} ${label} derived parameter estimate`,
        article: {_type: 'reference', _ref: articleDocId(definition.documentId)},
        sectionKey: definition.sectionKey,
        tableId: definition.tableId,
        rowId: definition.rowId,
      })
    }
  }

  logTable(report)
  console.log('')
  logTable([
    ['documents', report.length],
    ['tables', totalTables],
    ['rows', totalRows],
    ['derived parameters given a fact of their own', derived.size],
  ])

  if (!apply) {
    console.log(`\nDry run. Would write ${report.length} knowledgeArticle documents.`)
    return
  }
  await tx.commit({visibility: 'async'})
  console.log(`\nWrote ${report.length} knowledgeArticle documents (unpublished — review, then flip Published).`)
  if (derived.size > 0) {
    console.log(
      `Created ${derived.size} derived-parameter facts. Re-run this importer once to link the rows that cite them.`,
    )
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
