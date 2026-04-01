/**
 * Sanity dataset check: no legacy landing grid/carousel section _types in landingPage.pageSections.
 * Run after migrate:landing-collection --execute.
 *
 * Run: npx tsx scripts/verifyLandingCollectionUnification.ts
 */
import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

async function main() {
  const token = process.env.SANITY_API_TOKEN?.trim()
  if (!token) {
    console.error(JSON.stringify({ok: false, error: 'SANITY_API_TOKEN missing'}))
    process.exit(2)
  }

  const client = createClient({
    projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
    dataset: (process.env.SANITY_DATASET || 'production').trim(),
    apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
    useCdn: false,
    token,
  })

  const legacyDocIds = await client.fetch<string[]>(
    '*[_type == "landingPage" && count(pageSections[_type == "landingGridSection" || _type == "landingCarouselSection"]) > 0]._id',
  )

  const docs = await client.fetch<Array<{_id: string; pageSections?: Array<Record<string, unknown>>}>>(
    '*[_type == "landingPage" && defined(pageSections)]{_id, pageSections}',
  )
  const unifiedMissingPresentation: Array<{docId: string; sectionKey?: string}> = []
  for (const d of docs) {
    const secs = Array.isArray(d.pageSections) ? d.pageSections : []
    for (const s of secs) {
      if (s._type === 'landingCollectionSection' && (s.presentation === undefined || s.presentation === null)) {
        unifiedMissingPresentation.push({docId: d._id, sectionKey: typeof s._key === 'string' ? s._key : undefined})
      }
    }
  }

  const result = {
    ok: legacyDocIds.length === 0 && unifiedMissingPresentation.length === 0,
    legacyLandingSectionDocIds: legacyDocIds,
    unifiedSectionsMissingPresentation: unifiedMissingPresentation,
  }

  console.log(JSON.stringify(result, null, 2))
  if (!result.ok) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
