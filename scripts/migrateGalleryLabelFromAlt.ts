/**
 * Migration: Backfill gallery image label from alt.
 *
 * For property, city, and district documents:
 * - Where gallery[i] has alt and (label is missing or empty), set label = alt
 * - Does not overwrite existing label
 *
 * Run:
 *   npx tsx scripts/migrateGalleryLabelFromAlt.ts --dry-run
 *   npx tsx scripts/migrateGalleryLabelFromAlt.ts --execute
 *   npx tsx scripts/migrateGalleryLabelFromAlt.ts --execute --ids=id1,id2
 *
 * Requires: SANITY_API_TOKEN in .env
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const isDryRun = process.argv.includes('--dry-run')
const isExecute = process.argv.includes('--execute')
const idsArg = process.argv.find((a) => a.startsWith('--ids='))
const idsFilter: string[] | null = idsArg
  ? idsArg.slice(6).split(',').map((s) => s.trim()).filter(Boolean)
  : null

if (!isDryRun && !isExecute) {
  console.error('Use --dry-run to preview or --execute to apply patches.')
  process.exit(1)
}

if (!token) {
  console.error('Error: SANITY_API_TOKEN required')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
})

type GalleryItem = {_key?: string; alt?: string; label?: string; asset?: {_ref?: string}}
type Doc = {_id: string; _type: string; gallery?: GalleryItem[]}

function hasAlt(item: GalleryItem): boolean {
  const v = item?.alt
  return typeof v === 'string' && v.trim().length > 0
}

function needsLabel(item: GalleryItem): boolean {
  const v = item?.label
  return v === undefined || (typeof v === 'string' && v.trim().length === 0)
}

async function main() {
  const filter = idsFilter
    ? `_id in $ids && _type in ["property", "city", "district"] && defined(gallery) && count(gallery) > 0`
    : `_type in ["property", "city", "district"] && defined(gallery) && count(gallery) > 0`
  const params = idsFilter ? {ids: idsFilter} : {}

  const docs = await client.fetch<Doc[]>(
    `*[${filter}]{
      _id,
      _type,
      gallery[]{
        _key,
        alt,
        label,
        asset
      }
    }`,
    params,
  )

  if (docs.length === 0) {
    console.log('No matching documents found.')
    return
  }

  const changes: {docId: string; type: string; patch: Record<string, string>}[] = []

  for (const doc of docs) {
    const gallery = Array.isArray(doc.gallery) ? doc.gallery : []
    const patch: Record<string, string> = {}
    for (let i = 0; i < gallery.length; i++) {
      const item = gallery[i]
      if (hasAlt(item) && needsLabel(item)) {
        patch[`gallery[${i}].label`] = (item.alt ?? '').trim()
      }
    }
    if (Object.keys(patch).length > 0) {
      changes.push({docId: doc._id, type: doc._type, patch})
    }
  }

  if (changes.length === 0) {
    console.log(`Checked ${docs.length} document(s). No items need label backfill.`)
    return
  }

  const totalItems = changes.reduce((n, c) => n + Object.keys(c.patch).length, 0)
  console.log(`Found ${changes.length} document(s) with ${totalItems} gallery item(s) to update.`)
  changes.forEach((c) => {
    const keys = Object.keys(c.patch)
    console.log(`  ${c.docId} (${c.type}): ${keys.length} item(s)`)
    keys.forEach((k) => console.log(`    - ${k} <- alt value`))
  })

  if (isDryRun) {
    console.log('\nDry run. Run with --execute to apply patches.')
    return
  }

  const tx = client.transaction()
  for (const {docId, patch} of changes) {
    tx.patch(docId, (p) => p.set(patch))
  }
  await tx.commit()
  console.log(`\nUpdated ${changes.length} document(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
