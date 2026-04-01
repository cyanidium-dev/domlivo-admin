/**
 * Legacy one-off: align field names on old section _types before unification.
 * Superseded for new work by `migrateLandingCollectionSection.ts`, which merges
 * types and applies the same field fixes (sourceMode→mode, items→manualItems).
 *
 * Run only if you still have `landingGridSection` / `landingCarouselSection` in
 * the dataset and want field renames without the unified _type (rare).
 *
 * Run:
 * - npm run migrate:landing-family:dry
 * - npm run migrate:landing-family
 */
import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const token = process.env.SANITY_API_TOKEN?.trim()
const isDry = process.argv.includes('--dry')
const isExecute = process.argv.includes('--execute')

function cleanUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out = {...obj}
  for (const k of Object.keys(out)) {
    if (out[k] === undefined) delete out[k]
  }
  return out
}

function migrateSection(section: Record<string, unknown>): Record<string, unknown> {
  const t = section._type
  if (t === 'landingGridSection') {
    const next = {...section} as Record<string, unknown>
    if (next.mode === undefined && next.sourceMode !== undefined) {
      next.mode = next.sourceMode
    }
    delete next.sourceMode
    return cleanUndefined(next)
  }
  if (t === 'landingCarouselSection') {
    const next = {...section} as Record<string, unknown>
    if (next.manualItems === undefined && next.items !== undefined) {
      next.manualItems = next.items
    }
    delete next.items
    return cleanUndefined(next)
  }
  return section
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

  let touchedDocs = 0
  let touchedSections = 0

  for (const doc of docs) {
    const sections = Array.isArray(doc.pageSections) ? doc.pageSections : []
    let changed = false
    const next = sections.map((s: Record<string, unknown>) => {
      const before = JSON.stringify(s)
      const after = migrateSection(s)
      if (JSON.stringify(after) !== before) {
        changed = true
        touchedSections++
      }
      return after
    })

    if (!changed) continue
    touchedDocs++
    console.log(isDry ? `[dry] would patch ${doc._id}` : `[execute] patching ${doc._id}`)

    if (isExecute) {
      await client.patch(doc._id).set({pageSections: next}).commit()
    }
  }

  console.log(JSON.stringify({landingPageCount: docs.length, touchedDocs, touchedSections, dry: isDry}, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
