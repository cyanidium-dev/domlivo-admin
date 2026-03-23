/**
 * Remove legacy `currency` field from all property documents.
 * Required after schema update: property.currency has been removed; EUR is the only base currency.
 *
 * Run: npx tsx scripts/migrateRemovePropertyCurrency.ts [--dry-run]
 * Requires: SANITY_API_TOKEN in .env
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()
const dryRun = process.argv.includes('--dry-run')

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

async function main() {
  const docs = await client.fetch<
    {_id: string; currency?: string}[]
  >(`*[_type == "property" && defined(currency)]{ _id, currency }`)

  if (docs.length === 0) {
    console.log('No property documents have the legacy currency field. Nothing to do.')
    return
  }

  console.log(`Found ${docs.length} property document(s) with currency field.`)
  if (dryRun) {
    docs.forEach((d) => console.log(`  - ${d._id} (currency: ${d.currency})`))
    console.log('\nDry run. Run without --dry-run to apply patches.')
    return
  }

  const tx = client.transaction()
  for (const doc of docs) {
    tx.patch(doc._id, (p) => p.unset(['currency']))
    console.log(`  ${doc._id} -> unset currency`)
  }

  await tx.commit()
  console.log(`\nRemoved currency field from ${docs.length} property document(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
