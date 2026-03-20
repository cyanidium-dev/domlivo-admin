/**
 * Domlivo CMS — Clear Blog Content (Seed-Targeted)
 *
 * Deletes only the documents created by seed-blog.ts, to avoid reference
 * conflicts (e.g. other blog posts may be referenced by landing pages).
 *
 * Deletes:
 * - blog-settings
 * - blogCategory-real-estate, blogCategory-recreation
 * - blogAuthor-domlivo
 * - blogPost-real-estate-durres, blogPost-living-albania
 *
 * Run: npm run clear:blog
 * Requires: SANITY_API_TOKEN in .env
 *
 * Use before seed:blog for a clean slate.
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const ENV = {
  projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  token: process.env.SANITY_API_TOKEN?.trim() || null,
}

function validateEnv(): void {
  if (!ENV.projectId || !ENV.dataset) {
    console.error('Error: SANITY_PROJECT_ID and SANITY_DATASET required.')
    process.exit(1)
  }
  if (!ENV.token) {
    console.error('Error: SANITY_API_TOKEN required. Add to .env')
    process.exit(1)
  }
}

const client = createClient({
  projectId: ENV.projectId,
  dataset: ENV.dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: ENV.token!,
})

/** Document IDs created by seed-blog.ts. Deletes both published and draft. */
const SEED_BLOG_IDS = [
  'blog-settings',
  'blogCategory-real-estate',
  'blogCategory-recreation',
  'blogAuthor-domlivo',
  'blogPost-real-estate-durres',
  'blogPost-living-albania',
] as const

function withDrafts(id: string): string[] {
  if (id.startsWith('drafts.')) {
    return [id, id.slice(7)]
  }
  return [id, `drafts.${id}`]
}

async function main() {
  validateEnv()
  console.log(`Clearing seed blog content in ${ENV.projectId} / ${ENV.dataset}...`)

  const idsToTry = new Set<string>()
  for (const id of SEED_BLOG_IDS) {
    withDrafts(id).forEach((i) => idsToTry.add(i))
  }

  const existing = await client.fetch<{_id: string}[]>(
    `*[_id in ${JSON.stringify([...idsToTry])}]{_id}`
  )
  const toDelete = existing.map((d) => d._id)

  if (toDelete.length === 0) {
    console.log('No seed blog documents found. Nothing to delete.')
    return
  }

  console.log(`Found ${toDelete.length} document(s) to delete.`)

  const tx = client.transaction()
  for (const id of toDelete) {
    tx.delete(id)
  }
  await tx.commit()

  console.log(`\nClear complete. Deleted ${toDelete.length} document(s).`)
}

main().catch((err) => {
  console.error('Clear blog failed:', err)
  process.exit(1)
})
