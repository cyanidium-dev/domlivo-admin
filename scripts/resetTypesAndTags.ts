/**
 * Reset propertyType and locationTag only. Deletes all documents of these types
 * so they can be reseeded with field-level i18n (run npm run seed after).
 *
 * Does NOT delete: property, city, district, homePage, siteSettings, blogPost, agent.
 *
 * Run: npm run reset:types-tags:dry   (preview)
 * Run: npm run reset:types-tags       (execute)
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
const dataset = (
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  process.env.SANITY_DATASET ||
  'production'
).trim()
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
  console.error('Use --dry to preview or --execute to perform deletion.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
})

type Doc = {_id: string; title?: string | {en?: string; sq?: string; ru?: string; uk?: string}}

function titleDisplay(doc: Doc): string {
  const t = doc.title
  if (typeof t === 'string') return t
  if (t && typeof t === 'object') return t.en || t.sq || t.ru || t.uk || '(localized)'
  return '(no title)'
}

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
  console.log('--- Reset propertyType and locationTag ---\n')
  console.log(`Project: ${projectId}`)
  console.log(`Dataset: ${dataset}`)
  console.log(`Mode: ${isDry ? 'DRY (preview only)' : 'EXECUTE (deleting)'}\n`)

  const propertyTypes = await client.fetch<Doc[]>(`*[_type == "propertyType"]{_id, title}`)
  const locationTags = await client.fetch<Doc[]>(`*[_type == "locationTag"]{_id, title}`)

  for (const doc of propertyTypes) {
    console.log(`  propertyType  _id: ${doc._id}  title: ${titleDisplay(doc)}`)
  }
  for (const doc of locationTags) {
    console.log(`  locationTag  _id: ${doc._id}  title: ${titleDisplay(doc)}`)
  }

  const ptIds = collectWithDrafts(propertyTypes.map((d) => d._id))
  const ltIds = collectWithDrafts(locationTags.map((d) => d._id))

  let deletedPt = 0
  let deletedLt = 0
  if (!isDry) {
    deletedPt = await deleteDocs(ptIds)
    deletedLt = await deleteDocs(ltIds)
  }

  console.log('\n--- Summary ---')
  console.log('Property types deleted:', propertyTypes.length, isDry ? '(would be)' : '')
  console.log('Location tags deleted:', locationTags.length, isDry ? '(would be)' : '')
  if (isDry && (propertyTypes.length > 0 || locationTags.length > 0)) {
    console.log('\nRun with --execute to delete, then: npm run seed')
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
