/**
 * Runs the Content ops desk lists (lib/contentOps/desk.ts) against the dataset
 * and prints counts + the first ids — the CLI twin of the Studio section and
 * the validity check for its GROQ (a broken filter errors here instead of
 * showing an empty list in Studio). Published documents only; Studio lists
 * also show drafts. Read-only. Exit 1 if any query throws.
 *
 * Run: npm run audit:content-ops
 */
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {CONTENT_OPS_API_VERSION, CONTENT_OPS_LISTS, contentOpsParams} from '../lib/contentOps/desk'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: CONTENT_OPS_API_VERSION,
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

async function main(): Promise<void> {
  const params = contentOpsParams()
  console.log(`cut-offs: 30d ${params.cutoff30} · 90d ${params.cutoff90} · 300d ${params.cutoff300}\n`)
  let failed = 0
  for (const l of CONTENT_OPS_LISTS) {
    const published = `${l.filter} && !(_id in path("drafts.**"))`
    try {
      const count: number = await client.fetch(`count(*[${published}])`, params)
      const rows: Array<{_id: string}> = await client.fetch(
        `*[${published}] | order(${l.ordering[0].field} ${l.ordering[0].direction}) [0...20]{_id}`,
        params,
      )
      console.log(`${String(count).padStart(4)}  ${l.title}`)
      if (rows.length) console.log(`      ${rows.map((r) => r._id).join(', ')}${count > rows.length ? ', …' : ''}`)
    } catch (e) {
      failed += 1
      console.log(`ERR   ${l.title}: ${e instanceof Error ? e.message : e}`)
    }
  }
  if (failed) process.exit(1)
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
