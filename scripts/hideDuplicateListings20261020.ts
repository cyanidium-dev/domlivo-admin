/**
 * Hide a Cactus listing that is the same flat as another Cactus listing, and
 * point it at the original so its URL 301s there (same mechanism as
 * hideCactusDuplicates20261009.ts).
 *
 * Found 2026-10-20 by the near-duplicate pass of the AI-text audit
 * (reports/domlivo-ai-text-audit-2026-10-20.md, item 4): identical price,
 * area and bedrooms, identical description in every language and the very
 * same first photo asset. The 36 other near-duplicate pairs are different
 * flats in the same complex with the agency's shared text, and stay published.
 *
 * Run: npx tsx scripts/hideDuplicateListings20261020.ts --dry | --execute
 */
import {getSanityClientForScripts} from './lib/sanityEnvClient'

const PAIRS: Array<[copy: string, original: string, evidence: string]> = [
  [
    'property-cactus-85538771-b92d-4c95-a0f6-d1354ae242d6',
    'property-cactus-89235a9b-003e-4b61-960e-e672180c0fee',
    'Tirana 2+1, 120.1 m², €210,175; same text, same first photo asset; copy created 24 min after the original',
  ],
]

async function main() {
  const execute = process.argv.includes('--execute')
  const c = getSanityClientForScripts()
  const tx = c.transaction()
  for (const [copyId, originalId, evidence] of PAIRS) {
    const [copy, orig] = await Promise.all([
      c.fetch<{_id: string; _rev: string; isPublished?: boolean; duplicateOf?: unknown} | null>(`*[_id==$id][0]{_id, _rev, isPublished, duplicateOf}`, {id: copyId}),
      c.fetch<{_id: string; isPublished?: boolean} | null>(`*[_id==$id][0]{_id, isPublished}`, {id: originalId}),
    ])
    if (!copy || !orig) {
      console.log(`MISSING ${copyId} → ${originalId}`)
      continue
    }
    if (copy.duplicateOf) {
      console.log(`already hidden: ${copyId}`)
      continue
    }
    console.log(`${copyId} → ${originalId} (${evidence})${orig.isPublished ? '' : ' [original unpublished!]'}`)
    tx.patch(copyId, (p) => p.ifRevisionId(copy._rev).set({isPublished: false, duplicateOf: {_type: 'reference', _ref: originalId, _weak: true}}))
  }
  if (!execute) return console.log('\nDry run.')
  await tx.commit()
  console.log('\nHidden.')
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
