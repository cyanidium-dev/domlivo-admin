/**
 * Unify `landingGridSection` and `landingCarouselSection` into `landingCollectionSection`.
 *
 * - landingCarouselSection → _type: landingCollectionSection, presentation: carousel, mode: manual
 *   (also maps legacy `items` → `manualItems` if needed)
 * - landingGridSection → _type: landingCollectionSection, presentation: grid
 *   (also maps legacy `sourceMode` → `mode` if needed)
 *
 * Idempotent: leaves sections that are already `landingCollectionSection` unchanged.
 * Applies to all landingPage documents (published and draft ids).
 *
 * Run:
 * - npm run migrate:landing-collection:dry
 * - npm run migrate:landing-collection
 */
import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const token = process.env.SANITY_API_TOKEN?.trim()
const isDry = process.argv.includes('--dry')
const isExecute = process.argv.includes('--execute')

function cleanUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out = {...obj} as Record<string, unknown>
  for (const k of Object.keys(out)) {
    if (out[k] === undefined) delete out[k]
  }
  return out as T
}

function migrateSection(section: Record<string, unknown>): Record<string, unknown> {
  const t = section._type
  if (t === 'landingCollectionSection') {
    return section
  }
  if (t === 'landingCarouselSection') {
    const next = {...section} as Record<string, unknown>
    if (next.manualItems === undefined && next.items !== undefined) {
      next.manualItems = next.items
    }
    delete next.items
    next._type = 'landingCollectionSection'
    next.presentation = 'carousel'
    next.mode = 'manual'
    return cleanUndefined(next)
  }
  if (t === 'landingGridSection') {
    const next = {...section} as Record<string, unknown>
    if (next.mode === undefined && next.sourceMode !== undefined) {
      next.mode = next.sourceMode
    }
    delete next.sourceMode
    next._type = 'landingCollectionSection'
    next.presentation = 'grid'
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
  let carouselCount = 0
  let gridCount = 0

  for (const doc of docs) {
    const sections = Array.isArray(doc.pageSections) ? doc.pageSections : []
    let changed = false
    const next = sections.map((s: Record<string, unknown>) => {
      const before = JSON.stringify(s)
      const t = s._type
      if (t === 'landingCarouselSection') carouselCount++
      if (t === 'landingGridSection') gridCount++
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
      await client.patch(doc._id).set({pageSections: next}).commit({autoGenerateArrayKeys: false})
    }
  }

  console.log(
    JSON.stringify(
      {
        landingPageCount: docs.length,
        touchedDocs,
        touchedSections,
        legacySectionsSeen: {landingCarouselSection: carouselCount, landingGridSection: gridCount},
        dry: isDry,
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
