/**
 * Fix Missing Keys in Sanity Arrays
 *
 * Scans documents for array-of-object fields and adds _key to items that lack it.
 * Required for Sanity Studio to edit arrays correctly.
 *
 * Run: npm run fix:keys
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
const apiVersion = (process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01').trim()
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
 * Recursively add _key to object array items that lack it.
 * Modifies in place; returns the array.
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

/** Count items in array that needed _key */
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
  siteSettings: ['socialLinks', 'footerQuickLinks'],
  homePage: ['faqItems'],
  district: ['metrics', 'faqItems'],
  city: ['districtStats', 'faqItems'],
  property: ['locationTags'],
}

interface FixResult {
  documentId: string
  field: string
  fixedCount: number
}

async function main() {
  if (!token) {
    console.error(
      'Error: SANITY_API_TOKEN is required.\nAdd SANITY_API_TOKEN to .env and run again.'
    )
    process.exit(1)
  }
  if (!projectId || !dataset) {
    console.error('Error: projectId and dataset are required.')
    process.exit(1)
  }

  console.log(`Fix missing keys — projectId=${projectId} dataset=${dataset}`)
  const results: FixResult[] = []
  const types = Object.keys(ARRAY_FIELDS_BY_TYPE)
  const typeFilter = types.map((t) => `_type == "${t}"`).join(' || ')
  const query = `*[${typeFilter}]{ _id, _type, socialLinks, footerQuickLinks, faqItems, metrics, districtStats, locationTags }`

  const docs = await client.fetch<Record<string, unknown>[]>(query)
  console.log(`Fetched ${docs.length} documents`)

  const transaction = client.transaction()
  let hasChanges = false

  for (const doc of docs) {
    const docId = doc._id as string
    const docType = doc._type as string
    const fields = ARRAY_FIELDS_BY_TYPE[docType]
    if (!fields) continue

    for (const fieldName of fields) {
      const arr = doc[fieldName]
      if (!Array.isArray(arr) || arr.length === 0) continue

      const before = countFixedItems(arr)
      if (before === 0) continue

      addKeysToArrayItems(arr)
      transaction.patch(docId, (p) => p.set({[fieldName]: arr}))
      results.push({documentId: docId, field: fieldName, fixedCount: before})
      hasChanges = true
    }
  }

  if (!hasChanges) {
    console.log('No documents needed fixing.')
    return
  }

  for (const r of results) {
    console.log(`  ${r.documentId} | ${r.field}: ${r.fixedCount} fixed`)
  }
  await transaction.commit()
  console.log(`\nSummary: Patched ${results.length} field(s), ${results.reduce((s, r) => s + r.fixedCount, 0)} total items fixed.`)
}

main().catch((err) => {
  console.error('Fix failed:', err)
  process.exit(1)
})
