/**
 * Migrate amenity documents: add slug where missing.
 * Generates slug from title.en (or first available locale) using a simple slugify.
 *
 * Run: npm run migrate:amenity-slug
 * Requires: SANITY_API_TOKEN in .env
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

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

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}-]/gu, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'untitled'
  )
}

function getSlugSource(title: unknown): string | null {
  if (!title || typeof title !== 'object') return null
  const t = title as Record<string, string | undefined>
  const first = t.en ?? t.sq ?? t.uk ?? t.ru ?? t.it ?? ''
  return typeof first === 'string' && first.trim() ? first : null
}

async function main() {
  const docs = await client.fetch<
    {_id: string; title?: unknown; slug?: {current?: string}}
  >(`*[_type == "amenity"]{ _id, title, slug }`)

  const tx = client.transaction()
  let count = 0

  for (const doc of docs) {
    const currentSlug = doc.slug?.current
    if (currentSlug && currentSlug.length > 0) {
      continue
    }

    const source = getSlugSource(doc.title)
    if (!source) {
      console.warn(`Skip amenity ${doc._id}: no title to derive slug`)
      continue
    }

    const slugValue = slugify(source)
    tx.patch(doc._id, (p) => p.set({slug: {current: slugValue}}))
    count++
    console.log(`  ${doc._id} -> slug.current: ${slugValue}`)
  }

  if (count > 0) {
    await tx.commit()
    console.log(`\nMigrated ${count} amenity documents.`)
  } else {
    console.log('No amenity documents needed migration.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

