/**
 * Fix Missing Keys in Sanity Arrays
 *
 * Adds _key to array items that lack it. Required for Sanity Studio.
 * Does NOT patch system docs or translation.metadata.
 *
 * Run: npm run fix-keys
 */

import path from 'path'
import crypto from 'crypto'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId =
  (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset =
  (process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production').trim()
const apiVersion =
  (process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01').trim()
const token = process.env.SANITY_API_TOKEN?.trim() || null

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: token || undefined,
})

function genKey(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
}

/**
 * Add _key to object/image array items that lack it.
 * Leaves primitives and existing _key unchanged.
 */
function addKeysToArrayItems<T>(items: T[]): T[] {
  if (!Array.isArray(items)) return items
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
      const obj = item as Record<string, unknown>
      if (typeof obj._key !== 'string' || !obj._key) {
        obj._key = genKey()
      }
      for (const key of Object.keys(obj)) {
        if (key === '_key') continue
        const val = obj[key]
        if (Array.isArray(val)) {
          addKeysToArrayItems(val)
        }
      }
    }
  }
  return items
}

function countFixedItems<T>(items: T[]): number {
  if (!Array.isArray(items)) return 0
  let count = 0
  for (const item of items) {
    if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
      const obj = item as Record<string, unknown>
      if (typeof obj._key !== 'string' || !obj._key) count++
    }
  }
  return count
}

const ARRAY_FIELDS_BY_TYPE: Record<string, string[]> = {
  city: ['gallery', 'faqItems', 'districtStats'],
  district: ['gallery', 'faqItems', 'metrics'],
  homePage: ['homepageSections'],
  siteSettings: ['socialLinks', 'footerQuickLinks'],
  property: ['gallery', 'locationTags'],
  blogPost: ['gallery'],
}

function isEditableDoc(doc: {_id?: string; _type?: string}): boolean {
  const type = doc._type
  const id = doc._id || ''
  if (type === 'translation.metadata' || id.startsWith('_.') || id.startsWith('sanity.')) {
    return false
  }
  return true
}

async function main() {
  if (!token) {
    console.error('Error: SANITY_API_TOKEN is required. Add it to .env')
    process.exit(1)
  }
  if (!projectId || !dataset) {
    console.error('Error: projectId and dataset are required.')
    process.exit(1)
  }

  console.log(`Fix missing keys — projectId=${projectId} dataset=${dataset}\n`)

  const types = Object.keys(ARRAY_FIELDS_BY_TYPE)
  const allFields = [...new Set(types.flatMap((t) => ARRAY_FIELDS_BY_TYPE[t]))]
  const selectFields = allFields.join(', ')
  const typeFilter = types.map((t) => `_type == "${t}"`).join(' || ')
  const query = `*[${typeFilter}]{ _id, _type, ${selectFields} }`

  const docs = await client.fetch<Record<string, unknown>[]>(query)

  for (const doc of docs) {
    const docId = doc._id as string
    const docType = doc._type as string
    if (!isEditableDoc({_id: docId, _type: docType})) continue

    const fields = ARRAY_FIELDS_BY_TYPE[docType]
    if (!fields) continue

    for (const fieldName of fields) {
      const arr = doc[fieldName]
      if (!Array.isArray(arr) || arr.length === 0) continue

      const fixedCount = countFixedItems(arr)
      if (fixedCount === 0) continue

      const fixedArray = JSON.parse(JSON.stringify(arr))
      addKeysToArrayItems(fixedArray)

      await client.patch(docId).set({[fieldName]: fixedArray}).commit()

      console.log(`Fixing ${docType} ${docId}`)
      console.log(`  Added keys to ${fieldName} (${fixedCount} items)`)
    }
  }

  console.log('\nMigration finished')
}

main().catch((err) => {
  console.error('Fix failed:', err)
  process.exit(1)
})
