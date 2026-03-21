/**
 * Populate propertyOffers for all property documents from a predefined catalog.
 *
 * Deterministically assigns 4–6 offers per property based on property._id.
 * Only fills when propertyOffers is empty/missing, unless --force.
 *
 * Run:
 *   npx tsx scripts/populate-property-offers.ts --dry-run
 *   npx tsx scripts/populate-property-offers.ts --execute
 *   npx tsx scripts/populate-property-offers.ts --execute --force
 *   npx tsx scripts/populate-property-offers.ts --execute --include-drafts
 *
 * Requires: SANITY_API_TOKEN in .env
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {addKeysToArrayItems} from './lib/addKeysToArrayItems'
import {PROPERTY_OFFERS_CATALOG} from '../property_catalog'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

if (!token) {
  console.error('Error: SANITY_API_TOKEN required. Add to .env')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
})

// --- CLI args ---
const isDry = process.argv.includes('--dry-run')
const isExecute = process.argv.includes('--execute')
const isForce = process.argv.includes('--force')
const includeDrafts = process.argv.includes('--include-drafts')
const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const idsArg = process.argv.find((a) => a.startsWith('--ids='))

const limit = limitArg ? parseInt(limitArg.split('=')[1] || '0', 10) : 0
const idsFilter = idsArg ? idsArg.split('=')[1]?.split(',').map((s) => s.trim()).filter(Boolean) : null

if (!isDry && !isExecute) {
  console.error('Use --dry-run to preview or --execute to write.')
  process.exit(1)
}

// --- Deterministic hash ---
function simpleHash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h = h & h
  }
  return Math.abs(h)
}

type CatalogEntry = (typeof PROPERTY_OFFERS_CATALOG)[number]
type PropertyOfferItem = {
  _type: 'propertyOffer'
  _key: string
  title: {en?: string; uk?: string; ru?: string; sq?: string; it?: string}
  iconKey: string
  customIcon: null
}

function generateOffersForProperty(propertyId: string): PropertyOfferItem[] {
  const seed = simpleHash(propertyId)
  const count = 4 + (seed % 3)

  const selected: CatalogEntry[] = []
  for (let i = 0; i < count; i++) {
    const index = (seed + i) % PROPERTY_OFFERS_CATALOG.length
    selected.push(PROPERTY_OFFERS_CATALOG[index])
  }

  const seen = new Set<string>()
  const unique = selected.filter((item) => {
    if (seen.has(item.key)) return false
    seen.add(item.key)
    return true
  })

  return unique.map((item, idx) => ({
    _type: 'propertyOffer' as const,
    _key: `o-${Math.abs(seed).toString(36).slice(0, 6)}-${idx}-${item.key.slice(0, 8)}`,
    title: {...item.title},
    iconKey: item.iconKey,
    customIcon: null,
  }))
}

async function run() {
  console.log('--- populate property offers ---')
  console.log(`Project: ${projectId}`)
  console.log(`Dataset: ${dataset}`)
  console.log(`Mode: ${isDry ? 'DRY-RUN' : 'EXECUTE'}`)
  if (limit) console.log(`Limit: ${limit}`)
  if (idsFilter?.length) console.log(`IDs filter: ${idsFilter.join(', ')}`)
  if (isForce) console.log('Force: overwrite existing propertyOffers')
  if (includeDrafts) console.log('Include drafts: yes')
  else console.log('Include drafts: no (skip documents with _id starting with drafts.)')
  console.log(`Catalog size: ${PROPERTY_OFFERS_CATALOG.length}`)
  console.log('')

  const idFilterGroq =
    idsFilter?.length && idsFilter.length > 0
      ? `&& _id in [${idsFilter.map((id) => JSON.stringify(id)).join(', ')}]`
      : ''
  const draftFilter = includeDrafts ? '' : '&& !(_id in path("drafts.**"))'

  const groq = `*[_type == "property" ${idFilterGroq} ${draftFilter}] | order(_id asc) {
    _id,
    "slug": slug.current,
    propertyOffers
  }`

  const docs = await client.fetch<
    {_id: string; slug?: string; propertyOffers?: unknown[]}[]
  >(groq)

  const limited = limit > 0 ? docs.slice(0, limit) : docs
  let filled = 0
  let skipped = 0

  for (const doc of limited) {
    const hasOffers =
      Array.isArray(doc.propertyOffers) && doc.propertyOffers.length > 0

    if (hasOffers && !isForce) {
      skipped++
      console.log(
        `  ${doc._id}${doc.slug ? ` (${doc.slug})` : ''}: skipped — propertyOffers already exists (${doc.propertyOffers!.length} items)`,
      )
      continue
    }

    const offers = generateOffersForProperty(doc._id)
    const items = addKeysToArrayItems(offers) as PropertyOfferItem[]
    filled++

    console.log(
      `  ${doc._id}${doc.slug ? ` (${doc.slug})` : ''}: ${isDry ? 'would fill' : 'filled'} — ${items.length} items from catalog`,
    )

    if (!isDry) {
      await client.patch(doc._id).set({propertyOffers: items}).commit()
    }
  }

  console.log('')
  console.log('--- Summary ---')
  console.log(`Properties processed: ${limited.length}`)
  console.log(`${isDry ? 'Would fill' : 'Filled'}: ${filled}`)
  console.log(`Skipped (already has offers): ${skipped}`)
  if (isDry) console.log('DRY-RUN: no changes written.')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
