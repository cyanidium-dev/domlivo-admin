/**
 * Publishes one or more blogPost drafts by slug: moves the draft's content
 * to the published id and deletes the draft, matching exactly what Studio's
 * own Publish button does. Resolves the published id by slug rather than
 * assuming a fixed prefix, since this dataset has two conventions
 * (`blogPost-<slug>` for posts created by loadBlogPost.ts, `blog-<slug>` for
 * batch-3 posts rewritten in place from pre-existing stub documents — see
 * loadBlogPost.ts's own by-slug resolution for the same reason).
 *
 * Snapshots the pre-publish published doc (if one already existed) before
 * writing, same convention as unpublishDocument.ts, so a publish can be
 * rolled back by hand if needed.
 *
 * Run:
 *   npm run publish:blog-post -- <slug> [<slug> ...]
 *   npm run publish:blog-post -- <slug> [<slug> ...] --execute
 */

import path from 'node:path'
import fs from 'node:fs'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const args = process.argv.slice(2)
const execute = args.includes('--execute')
const slugs = args.filter((a) => !a.startsWith('--'))
if (slugs.length === 0) {
  throw new Error('usage: npm run publish:blog-post -- <slug> [<slug> ...] [--execute]')
}

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

async function publishOne(slug: string): Promise<{slug: string; status: string}> {
  const candidates: Array<{_id: string}> = await client.fetch(
    `*[_type=="blogPost" && slug.current==$slug]{_id}`,
    {slug},
  )
  const draftRow = candidates.find((d) => d._id.startsWith('drafts.'))
  if (!draftRow) {
    return {slug, status: 'SKIPPED — no draft found (already published with no pending edits, or missing)'}
  }
  const draftId = draftRow._id
  const publishedId = draftId.replace(/^drafts\./, '')

  const draftDoc: any = await client.getDocument(draftId)
  if (!draftDoc) return {slug, status: `SKIPPED — draft id ${draftId} resolved but document not found`}

  const existingPublished = await client.getDocument(publishedId)
  console.log(`${slug}`)
  console.log(`  title: "${draftDoc.title?.en}"`)
  console.log(
    `  action: publish ${draftId} → ${publishedId}${existingPublished ? ' (overwriting existing published content)' : ' (new — no published doc existed)'}, then delete ${draftId}`,
  )

  if (!execute) return {slug, status: 'dry-run only'}

  const dir = path.resolve(process.cwd(), 'scripts/data')
  fs.mkdirSync(dir, {recursive: true})
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  if (existingPublished) {
    const backupFile = path.join(dir, `publish-${slug}-prevpublished-backup-${stamp}.json`)
    fs.writeFileSync(backupFile, JSON.stringify(existingPublished, null, 2), 'utf8')
    console.log(`  snapshot of previous published content: ${backupFile}`)
  }

  const publishedDoc: Record<string, unknown> = {...draftDoc, _id: publishedId}
  delete publishedDoc._rev
  delete publishedDoc._createdAt
  delete publishedDoc._updatedAt

  await client.createOrReplace(publishedDoc as {_id: string; _type: string})
  await client.delete(draftId)
  console.log(`  published — live at ${publishedId}`)
  return {slug, status: 'published'}
}

async function main(): Promise<void> {
  const results: Array<{slug: string; status: string}> = []
  for (const slug of slugs) {
    results.push(await publishOne(slug))
    console.log()
  }

  console.log('=== Summary ===')
  for (const r of results) console.log(`${r.slug}: ${r.status}`)

  if (!execute) console.log('\nDry run. Re-run with --execute to publish.')
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
