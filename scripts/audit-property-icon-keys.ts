/**
 * Audit property documents for iconKey consistency.
 * Reports unknown keys, missing keys, and naming inconsistencies.
 *
 * Run: npx tsx scripts/audit-property-icon-keys.ts
 *
 * Requires: SANITY_API_TOKEN in .env (optional — will report "no data" if missing)
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {PROPERTY_ICON_KEYS} from '../schemaTypes/constants/iconOptions'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  ...(token && {token}),
})

const ALLOWED_KEYS = new Set<string>(PROPERTY_ICON_KEYS as unknown as string[])

type PropertyDoc = {
  _id: string
  slug?: {current?: string}
  amenities?: Array<{_key?: string; iconKey?: string; customIcon?: unknown}>
  propertyOffers?: Array<{_key?: string; iconKey?: string; customIcon?: unknown}>
}

async function run() {
  const groq = `*[_type == "property"] {
    _id,
    "slug": slug.current,
    amenities,
    propertyOffers
  }`

  let docs: PropertyDoc[] = []
  try {
    docs = await client.fetch<PropertyDoc[]>(groq)
  } catch (e) {
    console.error('Failed to fetch properties (check SANITY_API_TOKEN):', e)
    process.exit(1)
  }

  const unknownKeys = new Map<string, {count: number; source: 'amenities' | 'propertyOffers'; docIds: string[]}>()
  let missingIconKeyCount = 0
  const docMissing: string[] = []
  const inconsistencies: string[] = []

  for (const doc of docs) {
    const slugPart = doc.slug ? ` (${doc.slug})` : ''

    const amenities = doc.amenities ?? []
    const offers = doc.propertyOffers ?? []

    for (const item of amenities) {
      const key = item.iconKey
      if (!key || key.trim() === '') {
        missingIconKeyCount++
        if (!docMissing.includes(doc._id)) docMissing.push(doc._id)
      } else if (!ALLOWED_KEYS.has(key)) {
        const existing = unknownKeys.get(key)
        if (existing) {
          existing.count++
          if (existing.docIds.length < 5) existing.docIds.push(doc._id)
        } else {
          unknownKeys.set(key, {count: 1, source: 'amenities', docIds: [doc._id]})
        }
      }
    }

    for (const item of offers) {
      const key = item.iconKey
      if (!key || key.trim() === '') {
        missingIconKeyCount++
        if (!docMissing.includes(doc._id)) docMissing.push(doc._id)
      } else if (!ALLOWED_KEYS.has(key)) {
        const existing = unknownKeys.get(key)
        if (existing) {
          existing.count++
          if (existing.docIds.length < 5) existing.docIds.push(doc._id)
        } else {
          unknownKeys.set(key, {count: 1, source: 'propertyOffers', docIds: [doc._id]})
        }
      }
    }
  }

  // Check for naming inconsistencies (e.g. map-pin vs mappin)
  const normalized = new Map<string, string[]>()
  for (const key of unknownKeys.keys()) {
    const norm = key.toLowerCase().replace(/[-_\s]/g, '')
    if (!normalized.has(norm)) normalized.set(norm, [])
    normalized.get(norm)!.push(key)
  }
  for (const [norm, keys] of normalized) {
    if (keys.length > 1) {
      inconsistencies.push(`Variants for "${norm}": ${keys.join(', ')}`)
    }
    // Also check if norm matches an allowed key (e.g. mappin could match map-pin)
    const allowedNorm = Array.from(ALLOWED_KEYS).find((a) => a.toLowerCase().replace(/[-_\s]/g, '') === norm)
    if (allowedNorm && keys.some((k) => k !== allowedNorm)) {
      inconsistencies.push(`Possible typo: "${keys.join(', ')}" could normalize to "${allowedNorm}"`)
    }
  }

  // Write report to stdout (caller can redirect to file)
  console.log(JSON.stringify({
    allowedKeys: [...ALLOWED_KEYS],
    propertiesScanned: docs.length,
    unknownKeys: Object.fromEntries(
      Array.from(unknownKeys.entries()).map(([k, v]) => [k, {count: v.count, source: v.source, sampleDocIds: v.docIds}]),
    ),
    missingIconKeyCount,
    docIdsWithMissingKeys: docMissing.slice(0, 20),
    inconsistencies,
  }, null, 2))
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
