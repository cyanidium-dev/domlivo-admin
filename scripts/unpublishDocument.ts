/**
 * Unpublishes one document by id: moves its content to `drafts.<id>` (merging
 * over whatever draft already exists there, same non-destructive convention
 * as loadBlogPost.ts) and deletes the published document, matching what
 * Studio's own "Unpublish" action does. Reversible — the content isn't
 * deleted, just taken off the published, queryable-live namespace; anyone
 * can press Publish again on the resulting draft.
 *
 * Built for `rental-investment-in-durres-in-2026-key-checks`
 * (31f12963-4544-4a32-846f-9b43bfd7f99c) — a live article that
 * seedTz13Fixtures.ts deliberately merged ТЗ-13 schema-test fixtures onto
 * (keyFacts, faq, sources, a zone embed, a tracker embed) to prove the new
 * fields render on a real document. That was a documented, intentional
 * choice at the time, not an accident — but the underlying body prose
 * predates it and is generic filler, and the article now substantially
 * overlaps buying-apartment-durres-complete-guide. One doc id per run.
 *
 * Run:
 *   npm run unpublish:document -- <doc-id>
 *   npm run unpublish:document -- <doc-id> --execute
 */

import path from 'node:path'
import fs from 'node:fs'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const args = process.argv.slice(2)
const execute = args.includes('--execute')
const id = args.find((a) => !a.startsWith('--'))
if (!id) throw new Error('usage: npm run unpublish:document -- <doc-id> [--execute]')
if (id.startsWith('drafts.')) throw new Error('pass the PUBLISHED id, not the draft id — nothing to unpublish on a draft')

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

async function main(): Promise<void> {
  const published = await client.fetch(`*[_id==$id][0]`, {id})
  if (!published) throw new Error(`no published document with id "${id}"`)

  const draftId = `drafts.${id}`
  const existingDraft = await client.fetch(`*[_id==$id][0]`, {id: draftId})

  console.log(`slug: ${published.slug?.current}, title: "${published.title?.en}"`)
  console.log(`  action: move ${id} → ${draftId}${existingDraft ? ' (merging over an existing draft)' : ''}, then delete ${id}`)

  if (!execute) {
    console.log('\nDry run. Re-run with --execute to write.')
    return
  }

  const dir = path.resolve(process.cwd(), 'scripts/data')
  fs.mkdirSync(dir, {recursive: true})
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = path.join(dir, `unpublish-${id}-backup-${stamp}.json`)
  fs.writeFileSync(backupFile, JSON.stringify(published, null, 2), 'utf8')
  console.log(`snapshot written to ${backupFile}`)

  const draftDoc: Record<string, unknown> = {...(existingDraft ?? {}), ...published, _id: draftId}
  delete draftDoc._rev

  await client.createOrReplace(draftDoc as {_id: string; _type: string})
  await client.delete(id)
  console.log(`unpublished — content now lives only at ${draftId}`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
