/**
 * Delete all propertyType and locationTag documents so they can be reseeded
 * with field-level i18n (run npm run seed after this).
 *
 * Use when existing docs are still old non-localized shape.
 *
 * Run: npm run reset:taxonomy:dry   (preview)
 * Run: npm run reset:taxonomy       (execute)
 *
 * Does NOT touch: property, city, district, or any other content.
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset = (process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const isDry = process.argv.includes('--dry')
const isExecute = process.argv.includes('--execute')

if (!token) {
  console.error('Error: SANITY_API_TOKEN required. Add to .env')
  process.exit(1)
}

if (!isDry && !isExecute) {
  console.error('Use --dry to preview or --execute to perform deletion.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
})

function collectWithDrafts(ids: string[]): string[] {
  const set = new Set<string>()
  for (const id of ids) {
    set.add(id)
    set.add(id.startsWith('drafts.') ? id.slice(7) : `drafts.${id}`)
  }
  return [...set]
}

async function deleteDocs(ids: string[]): Promise<number> {
  if (ids.length === 0 || isDry) return 0
  const tx = client.transaction()
  for (const id of ids) tx.delete(id)
  await tx.commit()
  return ids.length
}

async function run() {
  console.log('--- Reset property types and location tags ---\n')
  console.log(`Project: ${projectId}`)
  console.log(`Dataset: ${dataset}`)
  console.log(`Mode: ${isDry ? 'DRY (preview only)' : 'EXECUTE (deleting)'}\n`)

  const propertyTypeIds = await client.fetch<string[]>(`*[_type == "propertyType"]._id`)
  const locationTagIds = await client.fetch<string[]>(`*[_type == "locationTag"]._id`)

  for (const id of propertyTypeIds) {
    console.log(`  [would delete] propertyType  id: ${id}`)
  }
  for (const id of locationTagIds) {
    console.log(`  [would delete] locationTag   id: ${id}`)
  }

  const allTypeIds = collectWithDrafts(propertyTypeIds)
  const allTagIds = collectWithDrafts(locationTagIds)

  let deleted = 0
  if (!isDry) {
    deleted += await deleteDocs(allTypeIds)
    deleted += await deleteDocs(allTagIds)
  }

  console.log('\n--- Summary ---')
  console.log('Property types to delete:', propertyTypeIds.length)
  console.log('Location tags to delete:', locationTagIds.length)
  console.log('Docs actually deleted:', isDry ? 0 : deleted)
  if (isDry && (propertyTypeIds.length > 0 || locationTagIds.length > 0)) {
    console.log('\nRun with --execute to delete, then run: npm run seed')
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
