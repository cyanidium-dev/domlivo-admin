/**
 * Migrate city and district slug from localized (slug.en/sq/ru/uk) to single (slug.current).
 *
 * Run: tsx scripts/migrateCityDistrictSlug.ts
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

function getCurrentSlug(slug: unknown): string | null {
  if (slug && typeof slug === 'object') {
    const s = slug as Record<string, unknown>
    if (typeof s.current === 'string') return s.current
    const first = s.en ?? s.sq ?? s.ru ?? s.uk
    if (typeof first === 'string') return first
  }
  return null
}

async function main() {
  const cities = await client.fetch<{_id: string; slug?: unknown}[]>(
    `*[_type == "city"]{ _id, slug }`
  )
  const districts = await client.fetch<{_id: string; slug?: unknown}[]>(
    `*[_type == "district"]{ _id, slug }`
  )

  const tx = client.transaction()
  let count = 0

  for (const doc of [...cities, ...districts]) {
    const current = getCurrentSlug(doc.slug)
    if (current && (!doc.slug || typeof (doc.slug as {current?: string}).current !== 'string')) {
      tx.patch(doc._id, (p) => p.set({slug: {current}}))
      count++
      console.log(`  ${doc._id} -> slug.current: ${current}`)
    }
  }

  if (count > 0) {
    await tx.commit()
    console.log(`\nMigrated ${count} documents.`)
  } else {
    console.log('No documents needed migration.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
