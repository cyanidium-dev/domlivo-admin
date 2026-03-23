/**
 * Migration: Convert property.seo from legacy (non-localized) to localizedSeo shape.
 *
 * Legacy shape: metaTitle, metaDescription, ogTitle, ogDescription (string/text), ogImage, noIndex
 * Target shape: metaTitle.en, metaDescription.en, ogTitle.en, ogDescription.en, ogImage, noIndex
 *
 * Rules:
 * - Only migrates _type == "property"
 * - Writes legacy string values into .en locale
 * - Preserves ogImage and noIndex
 * - Does not overwrite already localized data (idempotent)
 *
 * Run:
 *   npx tsx scripts/migratePropertySeoToLocalized.ts --dry-run
 *   npx tsx scripts/migratePropertySeoToLocalized.ts --execute
 *   npx tsx scripts/migratePropertySeoToLocalized.ts --execute --ids=id1,id2
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

type LegacySeo = {
  metaTitle?: string
  metaDescription?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: unknown
  noIndex?: boolean
}

type Doc = {_id: string; seo?: LegacySeo | Record<string, unknown>}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isLocalizedObject(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return 'en' in value
}

async function main() {
  const filter = idsFilter
    ? `_type == "property" && _id in $ids && defined(seo)`
    : `_type == "property" && defined(seo)`
  const params = idsFilter ? {ids: idsFilter} : {}

  const docs = await client.fetch<Doc[]>(
    `*[${filter}]{
      _id,
      seo
    }`,
    params,
  )

  if (docs.length === 0) {
    console.log('No property documents with seo found.')
    return
  }

  const changes: {docId: string; patch: Record<string, unknown>}[] = []

  for (const doc of docs) {
    const seo = doc.seo as LegacySeo | undefined
    if (!seo || typeof seo !== 'object') continue

    const patch: Record<string, unknown> = {}

    if (isString(seo.metaTitle) && !isLocalizedObject(seo.metaTitle)) {
      patch['seo.metaTitle'] = {en: seo.metaTitle.trim()}
    }
    if (isString(seo.metaDescription) && !isLocalizedObject(seo.metaDescription)) {
      patch['seo.metaDescription'] = {en: seo.metaDescription.trim()}
    }
    if (isString(seo.ogTitle) && !isLocalizedObject(seo.ogTitle)) {
      patch['seo.ogTitle'] = {en: seo.ogTitle.trim()}
    }
    if (isString(seo.ogDescription) && !isLocalizedObject(seo.ogDescription)) {
      patch['seo.ogDescription'] = {en: seo.ogDescription.trim()}
    }

    if (Object.keys(patch).length > 0) {
      changes.push({docId: doc._id, patch})
    }
  }

  if (changes.length === 0) {
    console.log(`Checked ${docs.length} property document(s). None need migration.`)
    return
  }

  console.log(`Found ${changes.length} property document(s) to migrate.`)
  changes.forEach((c) => {
    const keys = Object.keys(c.patch)
    console.log(`  ${c.docId}: ${keys.join(', ')}`)
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
  console.log(`\nMigrated ${changes.length} property document(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
