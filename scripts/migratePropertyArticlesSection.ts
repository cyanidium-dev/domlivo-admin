/**
 * Migrate property `articlesSection` field from legacy `articlesSection` shape to `propertyArticlesSection`.
 * Drops: title, subtitle, cta, cardCtaLabel, mode. Keeps: enabled, posts (posts when mode was `selected`, else []).
 *
 * Run:
 * - npm run migrate:property-articles:dry
 * - npm run migrate:property-articles
 */
import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const token = process.env.SANITY_API_TOKEN?.trim()
const isDry = process.argv.includes('--dry')
const isExecute = process.argv.includes('--execute')

function migrateBlock(
  v: Record<string, unknown> | null | undefined,
): Record<string, unknown> | undefined {
  if (!v || typeof v !== 'object') return undefined
  if (v._type !== 'articlesSection') return v as Record<string, unknown>

  const mode = v.mode
  const posts = mode === 'selected' && Array.isArray(v.posts) ? v.posts : []

  return {
    _type: 'propertyArticlesSection',
    _key: v._key,
    enabled: v.enabled !== false,
    posts,
  }
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

  const docs = await client.fetch<Array<{_id: string; articlesSection?: Record<string, unknown>}>>(`
    *[_type == "property" && defined(articlesSection)]{_id, articlesSection}
  `)

  const report: {_id: string; beforeType?: string; afterType: string}[] = []

  for (const d of docs) {
    const before = d.articlesSection
    const beforeType = before?._type
    const after = migrateBlock(before)
    if (!after || after._type === beforeType) continue

    report.push({_id: d._id, beforeType, afterType: String(after._type)})
    console.log(isDry ? `[dry] would patch ${d._id}` : `[execute] patching ${d._id}`)

    if (isExecute) {
      await client.patch(d._id).set({articlesSection: after}).commit()
    }
  }

  console.log(JSON.stringify({propertyDocs: docs.length, migrated: report.length, report, dry: isDry}, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
