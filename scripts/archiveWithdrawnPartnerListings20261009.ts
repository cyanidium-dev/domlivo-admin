/**
 * Partner sync, 2026-10-09: listings the partners no longer offer.
 *
 * - get.al: 23 listings live on our site return 404 on get.al (withdrawn or
 *   sold); findall: 14 are gone from the API or marked not-available/pending.
 *   They are archived (hidden from the site, kept in Sanity).
 * - Five of the get.al ones were the originals of Cactus listings hidden as
 *   duplicates the same morning. Cactus still sells those flats, so the roles
 *   swap: the Cactus listing is published again and the archived get.al one
 *   points at it (duplicateOf), so its URL 301s to the live listing.
 *
 * Run: npx tsx scripts/archiveWithdrawnPartnerListings20261009.ts --dry | --execute
 */
import fs from 'node:fs'
import {getSanityClientForScripts} from './lib/sanityEnvClient'

const SWAP: Record<string, string> = {
  'property-getal-15577': 'da6e1a14',
  'property-getal-16335': '9fcc8d88',
  'property-getal-17453': 'ad3d9275',
  'property-getal-17514': '7308f793',
  'property-getal-18187': '19792083',
}

async function main() {
  const execute = process.argv.includes('--execute')
  const c = getSanityClientForScripts()
  const sync = JSON.parse(fs.readFileSync('../domlivo-workspace/sync-2026-10-09.json', 'utf8')) as {gone_findall: string[]; gone_getal: string[]}
  const cactus: string[] = await c.fetch(`*[_type=="property" && _id match "property-cactus-*" && !(_id in path("drafts.**"))]._id`)
  const tx = c.transaction()
  for (const id of [...sync.gone_findall, ...sync.gone_getal]) {
    const swapPrefix = SWAP[id]
    if (swapPrefix) {
      const live = cactus.find((x) => x.startsWith(`property-cactus-${swapPrefix}`))
      if (!live) throw new Error(`no Cactus listing for ${swapPrefix}`)
      console.log(`swap   ${id} → archived, duplicateOf ${live}; ${live} published again`)
      tx.patch(id, (p) => p.set({lifecycleStatus: 'archived', duplicateOf: {_type: 'reference', _ref: live, _weak: true}}))
      tx.patch(live, (p) => p.set({isPublished: true, lifecycleStatus: 'active'}).unset(['duplicateOf']))
    } else {
      console.log(`archive ${id}`)
      tx.patch(id, (p) => p.set({lifecycleStatus: 'archived'}))
    }
  }
  if (!execute) return console.log('\nDry run.')
  await tx.commit()
  console.log('\nDone.')
}
main().catch((e) => { console.error(e); process.exit(1) })
