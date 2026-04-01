/**
 * Remove legacy unknown keys from `propertyCarouselSection` blocks in `landingPage.pageSections`.
 * Safe: keys are not in schema or repo queries (see STALE_PROPERTY_CAROUSEL_DATASET_FIELDS).
 *
 * Run:
 * - npm run migrate:stale-property-carousel-fields:dry
 * - npm run migrate:stale-property-carousel-fields
 */
import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {STALE_PROPERTY_CAROUSEL_DATASET_FIELDS} from './lib/stalePropertyCarouselDatasetFields'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const token = process.env.SANITY_API_TOKEN?.trim()
const isDry = process.argv.includes('--dry')
const isExecute = process.argv.includes('--execute')

function stripStaleFromSection(section: Record<string, unknown>): {
  next: Record<string, unknown>
  removed: Array<{path: string; sample: unknown}>
} {
  if (section._type !== 'propertyCarouselSection') {
    return {next: section, removed: []}
  }
  const removed: Array<{path: string; sample: unknown}> = []
  const next = {...section}
  for (const k of STALE_PROPERTY_CAROUSEL_DATASET_FIELDS) {
    if (k in next && next[k] !== undefined) {
      removed.push({path: k, sample: next[k]})
      delete next[k]
    }
  }
  return {next, removed}
}

async function main() {
  if (!token) {
    console.error('SANITY_API_TOKEN required')
    process.exit(2)
  }
  if (!isDry && !isExecute) {
    console.error('Use --dry or --execute')
    process.exit(1)
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

  const report: {
    docId: string
    sectionIndex: number
    removedKeys: string[]
  }[] = []

  let touchedDocs = 0

  for (const doc of docs) {
    const sections = Array.isArray(doc.pageSections) ? doc.pageSections : []
    let changed = false
    const nextSections = sections.map((s: Record<string, unknown>, idx: number) => {
      const {next, removed} = stripStaleFromSection(s)
      if (removed.length > 0) {
        changed = true
        report.push({
          docId: doc._id,
          sectionIndex: idx,
          removedKeys: removed.map((r) => r.path),
        })
        if (isDry) {
          console.log(
            JSON.stringify({
              docId: doc._id,
              sectionIndex: idx,
              removed: removed.map((r) => ({key: r.path, valuePreview: summarize(r.sample)})),
            }),
          )
        }
      }
      return next
    })

    if (!changed) continue
    touchedDocs++
    if (isDry) {
      console.log(`[dry] would patch ${doc._id}`)
    } else {
      console.log(`[execute] patching ${doc._id}`)
      await client.patch(doc._id).set({pageSections: nextSections}).commit({autoGenerateArrayKeys: false})
    }
  }

  console.log(
    JSON.stringify(
      {
        landingPageDocs: docs.length,
        touchedDocs,
        removals: report,
        fields: [...STALE_PROPERTY_CAROUSEL_DATASET_FIELDS],
        dry: isDry,
      },
      null,
      2,
    ),
  )
}

function summarize(v: unknown): string {
  if (v === null) return 'null'
  const t = typeof v
  if (t === 'string') return v.length > 80 ? `${(v as string).slice(0, 77)}…` : (v as string)
  if (t === 'number' || t === 'boolean') return String(v)
  if (Array.isArray(v)) return `array(${v.length})`
  if (t === 'object') return 'object'
  return t
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
