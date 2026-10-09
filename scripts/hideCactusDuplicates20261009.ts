/**
 * Hide Cactus Real Estate listings that are the same flat as one already on
 * the site, and point each at its original so the copy's URL 301s there.
 *
 * Found 2026-10-09: candidates matched on city, area (±4%), price (±8%) and
 * bedrooms; then either ≥2 photos matched by perceptual hash (pHash ≤8 and
 * dHash ≤10 on 320 px thumbnails) or, for identical area and price, the photo
 * sheets were compared by eye (same bathroom, same furniture, same façade).
 * Six numeric look-alikes were different flats and stay published.
 *
 * Run: npx tsx scripts/hideCactusDuplicates20261009.ts --dry | --execute
 */
import {getSanityClientForScripts} from './lib/sanityEnvClient'

const PAIRS: Array<[cactus: string, original: string, evidence: string]> = [
  ['9f8cb39f', 'property-getal-18512', '5 photos'],
  ['19792083', 'property-getal-18187', '4 photos'],
  ['8cb005d0', 'property-getal-16115', '4 photos'],
  ['ba5be8e3', 'property-getal-17596', '4 photos'],
  ['da6e1a14', 'property-getal-15577', '4 photos'],
  ['9fcc8d88', 'property-getal-16335', '3 photos'],
  ['ad3d9275', 'property-getal-17453', '3 photos'],
  ['ef300e52', 'property-findall-312', '3 photos'],
  ['0536abbb', 'property-getal-11682', '2 photos'],
  ['2855aa3e', 'property-getal-18293', 'same bathroom, 57 m², €118,000'],
  ['3d806e90', 'Bvr0zm8arkql17QDTGKeaR', 'same bathroom, 90 m², €160,000'],
  ['7308f793', 'property-getal-17514', 'same interior, 76.6 m², €138,000'],
  ['aa0aec95', 'Fbta1oBE0kPqbOrzwcNWJu', 'same interior, 46 m², €83,000'],
  ['db1107e6', 'property-getal-10134', 'same interior, 92 m², €130,000'],
  ['1e2bc192', 'property-getal-18064', 'same building photo, 61 m², €80,000'],
  ['bf433a4d', 'property-getal-18556', 'same shop front, 88 m², €155,000'],
]

async function main() {
  const execute = process.argv.includes('--execute')
  const c = getSanityClientForScripts()
  const ids: Array<{_id: string; isPublished?: boolean}> = await c.fetch(`*[_type=="property" && _id match "property-cactus-*" && !(_id in path("drafts.**"))]{_id, isPublished}`)
  const tx = c.transaction()
  for (const [prefix, original, evidence] of PAIRS) {
    const copy = ids.find((r) => r._id.startsWith(`property-cactus-${prefix}`))
    const orig = await c.fetch<{_id: string; isPublished?: boolean} | null>(`*[_id==$id][0]{_id, isPublished}`, {id: original})
    if (!copy || !orig) {
      console.log(`MISSING ${prefix} → ${original}`)
      continue
    }
    console.log(`${copy._id} → ${original} (${evidence})${orig.isPublished ? '' : ' [original unpublished!]'}`)
    tx.patch(copy._id, (p) => p.set({isPublished: false, duplicateOf: {_type: 'reference', _ref: original, _weak: true}}))
  }
  if (!execute) return console.log('\nDry run.')
  await tx.commit()
  console.log('\nHidden.')
}
main().catch((e) => { console.error(e); process.exit(1) })
