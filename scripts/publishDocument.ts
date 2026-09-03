/**
 * Publishes one or more documents by id: moves `drafts.<id>` to `<id>` and
 * deletes the draft — what Studio's Publish button does. Generic mirror of
 * unpublishDocument.ts; publishBlogPost.ts stays blog-specific (it resolves
 * by slug across two id conventions). Snapshots the previous published doc
 * first, so a publish can be rolled back by hand.
 *
 * Run:
 *   npm run publish:document -- <id> [<id> ...]
 *   npm run publish:document -- <id> [<id> ...] --execute
 */
import path from 'node:path'
import fs from 'node:fs'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const args = process.argv.slice(2)
const execute = args.includes('--execute')
const ids = args.filter((a) => !a.startsWith('--')).map((id) => id.replace(/^drafts\./, ''))
if (!ids.length) throw new Error('usage: npm run publish:document -- <id> [<id> ...] [--execute]')

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

async function publishOne(id: string): Promise<string> {
  const draftId = `drafts.${id}`
  const draft = (await client.getDocument(draftId)) as Record<string, unknown> | null
  if (!draft) return 'SKIPPED — no draft'
  const published = await client.getDocument(id)
  console.log(`${id}: publish ${draftId} → ${id}${published ? ' (replacing published)' : ' (new)'}`)
  if (!execute) return 'dry-run'
  const dir = path.resolve(process.cwd(), 'scripts/data')
  fs.mkdirSync(dir, {recursive: true})
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  if (published) {
    const file = path.join(dir, `publish-${id}-prevpublished-backup-${stamp}.json`)
    fs.writeFileSync(file, JSON.stringify(published, null, 2), 'utf8')
    console.log(`  snapshot: ${file}`)
  }
  const doc: Record<string, unknown> = {...draft, _id: id}
  delete doc._rev
  delete doc._createdAt
  delete doc._updatedAt
  await client.createOrReplace(doc as {_id: string; _type: string})
  await client.delete(draftId)
  return 'published'
}

async function main(): Promise<void> {
  const results: string[] = []
  for (const id of ids) results.push(`${id}: ${await publishOne(id)}`)
  console.log('\n=== Summary ===\n' + results.join('\n'))
  if (!execute) console.log('\nDry run. Re-run with --execute to publish.')
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
