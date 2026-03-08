/**
 * WIPE DATASET - Full content reset
 * Deletes ALL documents and drafts from the Sanity dataset.
 * Does NOT delete media assets.
 *
 * Run: npm run wipe:dataset
 * Requires: SANITY_API_TOKEN in .env with "Editor" or "Administrator" role
 *           (token needs "manage" permission for delete operations)
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

async function main() {
  validateEnv()
  console.log(`Wiping dataset: ${ENV.projectId} / ${ENV.dataset}`)
  console.log('Fetching all document IDs (including drafts)...')

  const allDocs = await client.fetch<{_id: string}[]>(`*[defined(_id)]{_id}`)
  const allIds = allDocs.map((d) => d._id)

  if (allIds.length === 0) {
    console.log('Dataset is already empty.')
    return
  }

  console.log(`Found ${allIds.length} documents to delete.`)

  const BATCH = 100
  let deleted = 0
  for (let i = 0; i < allIds.length; i += BATCH) {
    const batch = allIds.slice(i, i + BATCH)
    const tx = client.transaction()
    for (const id of batch) {
      tx.delete(id)
      deleted++
    }
    await tx.commit()
    console.log(`Deleted ${deleted}/${allIds.length}...`)
  }

  console.log(`\nWipe complete. Deleted ${allIds.length} documents.`)
  console.log('Media assets were NOT deleted.')
}

main().catch((err) => {
  console.error('Wipe failed:', err)
  process.exit(1)
})
