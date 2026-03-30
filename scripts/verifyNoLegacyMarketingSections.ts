/**
 * One-off: confirm no landingPage.pageSections items use legacy marketing section _types.
 * Run: npx tsx scripts/verifyNoLegacyMarketingSections.ts
 */
import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const LEGACY = ['aboutSection', 'investmentSection', 'agentsPromoSection'] as const

async function main() {
  const token = process.env.SANITY_API_TOKEN?.trim()
  if (!token) {
    console.error('SANITY_API_TOKEN required in .env')
    process.exit(1)
  }
  const client = createClient({
    projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
    dataset: (process.env.SANITY_DATASET || 'production').trim(),
    apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
    useCdn: false,
    token,
  })

  const docs = await client.fetch<
    {_id: string; pageSections?: {_type?: string}[]}[]
  >(`*[_type == "landingPage" && defined(pageSections)]{_id, pageSections}`)

  const hits: {_id: string; types: string[]}[] = []
  for (const d of docs) {
    const secs = Array.isArray(d.pageSections) ? d.pageSections : []
    const types = [
      ...new Set(
        secs
          .map((s) => s?._type)
          .filter((t): t is string => typeof t === 'string' && LEGACY.includes(t as any)),
      ),
    ]
    if (types.length) hits.push({_id: d._id, types})
  }

  console.log(JSON.stringify({landingPageCount: docs.length, legacyUsage: hits}, null, 2))
  if (hits.length) process.exit(2)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
