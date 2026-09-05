/**
 * Removes the test fixtures that live in the production dataset (sweep
 * 2026-09-05, F11): the three ТЗ-4/5/6 block-test landings, the Studio-AI
 * district and property fixtures (`seed:studio-ai-tests` recreates them when
 * needed). The bot's test agent and its published Orikum test listing are
 * NOT deleted — bot work is deferred (BOT-WORK-DEFERRED-2026-09-05.md) — they
 * are unpublished so neither reaches the live site or the sitemap.
 *
 * Dry by default; snapshots every document to scripts/data/ before deleting.
 * Run: npx tsx scripts/removeTestFixtures.ts [--execute]
 */
import path from 'node:path'
import fs from 'node:fs'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const execute = process.argv.includes('--execute')
const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-06-01',
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

const DELETE_IDS = [
  'landing-test-calculators',
  'landing-test-data-blocks',
  'landing-test-tracker-developers',
  'drafts.district-test-ai-en-only',
  'drafts.district-test-ai-partial',
  'drafts.district-test-ai-uk-only',
  'drafts.property-test-ai-parse-1',
  'drafts.property-test-ai-parse-2',
  'drafts.property-test-ai-parse-3',
  'drafts.property-test-ai-parse-4',
  'drafts.property-test-ai-parse-5',
]
/** Kept for the deferred bot work, hidden from the site. */
const UNPUBLISH_IDS = ['agent-test-bot', 'property-tg-506b5f1e-cdd2-46cb-aec9-9f8ddfaeb0cf']

async function main(): Promise<void> {
  const all = [...DELETE_IDS, ...UNPUBLISH_IDS]
  const docs: Array<Record<string, unknown> & {_id: string; _type: string}> = await client.fetch(`*[_id in $ids]`, {ids: all})
  const byId = new Map(docs.map((d) => [d._id, d]))
  const referrers: Array<{_id: string; _type: string}> = await client.fetch(
    `*[references($ids) && !(_id in $ids)]{_id, _type}`,
    {ids: DELETE_IDS},
  )
  for (const id of DELETE_IDS) console.log(`  ${byId.has(id) ? 'delete   ' : 'absent   '} ${id}`)
  for (const id of UNPUBLISH_IDS) console.log(`  ${byId.has(id) ? 'unpublish' : 'absent   '} ${id}`)
  if (referrers.length) {
    console.log(`\n✖ ${referrers.length} document(s) still reference a fixture to be deleted:`)
    for (const r of referrers) console.log(`  ${r._type} ${r._id}`)
    process.exit(1)
  }
  if (!execute) {
    console.log('\nDry run. Re-run with --execute.')
    return
  }
  const dir = path.resolve(process.cwd(), 'scripts/data')
  fs.mkdirSync(dir, {recursive: true})
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  fs.writeFileSync(path.join(dir, `testFixtures-backup-${stamp}.json`), JSON.stringify(docs, null, 2), 'utf8')
  let tx = client.transaction()
  for (const id of DELETE_IDS) if (byId.has(id)) tx = tx.delete(id)
  for (const id of UNPUBLISH_IDS) if (byId.has(id)) tx = tx.patch(id, (p) => p.set({isPublished: false}))
  await tx.commit()
  console.log(`\nDone: ${DELETE_IDS.filter((id) => byId.has(id)).length} deleted, ${UNPUBLISH_IDS.filter((id) => byId.has(id)).length} unpublished. Snapshot in scripts/data/.`)
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
