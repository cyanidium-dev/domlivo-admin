/**
 * Audit landingPage.pageSections[] for specific legacy field names.
 * Run: npx tsx scripts/auditStalePageSectionFields.ts
 */
import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const TRACK = new Set([
  'allowedPropertyKinds',
  'cardFields',
  'detailsCtaLabel',
  'maxItems',
  'minItems',
  'rankingStrategy',
])

function collectStale(
  docId: string,
  value: unknown,
  basePath: string,
  sectionTypeHint: string | null,
  out: Array<{field: string; docId: string; sectionType: string; path: string}>,
) {
  if (value === null || value === undefined) return
  if (Array.isArray(value)) {
    value.forEach((item, i) => {
      const st = typeof item === 'object' && item && '_type' in (item as object)
        ? String((item as {_type?: string})._type)
        : sectionTypeHint
      collectStale(docId, item, `${basePath}[${i}]`, st, out)
    })
    return
  }
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>
    const st = typeof o._type === 'string' ? o._type : sectionTypeHint
    for (const k of Object.keys(o)) {
      const p = `${basePath}.${k}`
      if (TRACK.has(k)) {
        out.push({field: k, docId, sectionType: st || '(unknown)', path: p})
      }
      collectStale(docId, o[k], p, st, out)
    }
  }
}

async function main() {
  const token = process.env.SANITY_API_TOKEN?.trim()
  if (!token) {
    console.error('SANITY_API_TOKEN required')
    process.exit(2)
  }

  const client = createClient({
    projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
    dataset: (process.env.SANITY_DATASET || 'production').trim(),
    apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
    useCdn: false,
    token,
  })

  const docs = await client.fetch<Array<{_id: string; pageSections?: unknown[]}>>(`
    *[_type == "landingPage" && defined(pageSections)]{_id, pageSections}
  `)

  const all: Array<{field: string; docId: string; sectionType: string; path: string}> = []
  for (const d of docs) {
    collectStale(d._id, d.pageSections, 'pageSections', null, all)
  }

  const byField = new Map<string, typeof all>()
  for (const row of all) {
    const arr = byField.get(row.field) ?? []
    arr.push(row)
    byField.set(row.field, arr)
  }

  const summary: Record<string, {count: number; bySectionType: Record<string, number>; docIds: string[]}> = {}
  for (const [field, rows] of byField) {
    const bySectionType: Record<string, number> = {}
    const docIds = new Set<string>()
    for (const r of rows) {
      bySectionType[r.sectionType] = (bySectionType[r.sectionType] || 0) + 1
      docIds.add(r.docId)
    }
    summary[field] = {
      count: rows.length,
      bySectionType,
      docIds: [...docIds].sort(),
    }
  }

  console.log(
    JSON.stringify(
      {
        landingDocCount: docs.length,
        staleFieldOccurrencesTotal: all.length,
        byField: Object.keys(summary).length ? summary : {},
        rawOccurrences: all.length ? all : [],
        note:
          all.length === 0
            ? 'None of the tracked field names appear in pageSections for this dataset.'
            : undefined,
      },
      null,
      2,
    ),
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
