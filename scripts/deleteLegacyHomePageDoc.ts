/**
 * Delete legacy homePage document from dataset (canonical homepage is landing-home).
 *
 * Deletes both published and draft variants if present:
 * - homePage
 * - drafts.homePage
 *
 * Run:
 * - npm run delete:legacy-homePage -- --dry
 * - npm run delete:legacy-homePage -- --execute
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  process.env.SANITY_PROJECT_ID ||
  'g4aqp6ex'
).trim()
const dataset = (process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production').trim()
const apiVersion = (
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ||
  process.env.SANITY_API_VERSION ||
  '2024-01-01'
).trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const isDry = process.argv.includes('--dry')
const isExecute = process.argv.includes('--execute')

if (!token) {
  console.error('Error: SANITY_API_TOKEN required. Add to .env')
  process.exit(1)
}

if (!isDry && !isExecute) {
  console.error('Use --dry to preview or --execute to delete.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
})

async function run() {
  console.log('--- Delete legacy homePage document ---\n')
  console.log(`Project: ${projectId}`)
  console.log(`Dataset: ${dataset}`)
  console.log(`Mode: ${isDry ? 'DRY (preview only)' : 'EXECUTE (deleting)'}\n`)

  const ids = ['homePage', 'drafts.homePage']
  const existing = await client.fetch<Array<{_id: string; _type: string}>>(
    `*[_id in $ids]{ _id, _type }`,
    {ids},
  )

  if (existing.length === 0) {
    console.log('No legacy homePage documents found. ✅')
    return
  }

  console.log('Found:')
  existing.forEach((d) => console.log(`- ${d._id} (${d._type})`))

  if (isDry) {
    console.log('\nDry run: nothing deleted.')
    return
  }

  const tx = client.transaction()
  existing.forEach((d) => tx.delete(d._id))
  await tx.commit()

  const after = await client.fetch<Array<{_id: string}>>(`*[_id in $ids]{ _id }`, {ids})
  console.log(`\nDeleted: ${existing.length}`)
  console.log(`Remaining matching docs: ${after.length}`)
  if (after.length === 0) console.log('Deletion confirmed. ✅')
}

run().catch((err) => {
  console.error('Deletion failed:', err)
  process.exit(1)
})

