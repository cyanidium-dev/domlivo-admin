/**
 * Unset legacy property.country ONLY when it equals city->country->slug.current (redundant).
 *
 * Default: dry-run (list IDs only).
 * Execute: npx tsx scripts/cleanupPropertyCountryRedundant.ts --execute
 *
 * Requires: SANITY_API_TOKEN in .env
 */

import {getSanityClientForScripts} from './lib/sanityEnvClient'

async function main() {
  const execute = process.argv.includes('--execute')
  const client = getSanityClientForScripts()

  const matches = await client.fetch<{_id: string; country: string; expected: string}[]>(
    `*[_type == "property" && defined(country) && country == city->country->slug.current]{
      _id,
      country,
      "expected": city->country->slug.current
    }`,
  )

  console.log(
    execute
      ? `Found ${matches.length} property document(s) where legacy country matches city (will unset).`
      : `[DRY RUN] Found ${matches.length} property document(s) where legacy country matches city (safe to unset).`,
  )

  for (const m of matches) {
    console.log(`  ${m._id.replace(/^drafts\./, '')}  country="${m.country}"`)
  }

  if (!execute) {
    console.log('\nNo changes written. Pass --execute to unset property.country on these documents.')
    return
  }

  if (matches.length === 0) {
    console.log('Nothing to do.')
    return
  }

  const transaction = client.transaction()
  for (const m of matches) {
    transaction.patch(m._id, (p) => p.unset(['country']))
  }
  await transaction.commit()
  console.log(`\nUnset property.country on ${matches.length} document(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
