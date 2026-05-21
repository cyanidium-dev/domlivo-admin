/**
 * One-shot: assign iconKey to amenities that don't have one yet.
 * Idempotent: skips any amenity that already has iconKey set.
 *
 *   npx tsx scripts/seedAmenityIcons.ts --dry-run
 *   npx tsx scripts/seedAmenityIcons.ts --execute
 */
import {getSanityClientForScripts} from './lib/sanityEnvClient'

const ICON_MAP: Record<string, string> = {
  gym: 'zap',
  'mountain-view': 'tree',
  security: 'shield',
  'storage-room': 'layout',
}

const isDry = process.argv.includes('--dry-run')
const isExec = process.argv.includes('--execute')
if (!isDry && !isExec) {
  console.error('Use --dry-run or --execute')
  process.exit(1)
}

async function main() {
  const c = getSanityClientForScripts()
  const rows = await c.fetch<Array<{_id: string; slug: string; iconKey?: string}>>(
    `*[_type=="amenity"]{_id, "slug": slug.current, iconKey}`,
  )
  const toPatch = rows.filter((r) => !r.iconKey && ICON_MAP[r.slug])

  console.log(`Amenities scanned: ${rows.length}`)
  console.log(`Will set iconKey on: ${toPatch.length}`)
  toPatch.forEach((r) => console.log(`  ${r.slug.padEnd(20)} -> ${ICON_MAP[r.slug]}`))

  if (toPatch.length === 0 || isDry) {
    if (isDry) console.log('\nDry run.')
    return
  }
  const tx = c.transaction()
  for (const r of toPatch) tx.patch(r._id, (p) => p.set({iconKey: ICON_MAP[r.slug]}))
  await tx.commit()
  console.log(`\nUpdated ${toPatch.length} amenity doc(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
