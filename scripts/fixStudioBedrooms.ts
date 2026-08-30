/**
 * One-shot data fix (2026-08-21): DomLivo convention change — a studio
 * apartment counts as 1 bedroom (the single living/sleeping room), not 0.
 * The intake bot was updated (domlivo-bot 7b00811); this brings existing
 * studio-type properties written under the old rule in line.
 *
 * Usage (from cms/, SANITY_API_TOKEN in .env):
 *   npx tsx scripts/fixStudioBedrooms.ts            # dry-run
 *   npx tsx scripts/fixStudioBedrooms.ts --apply    # write bedrooms = 1
 */
import {getSanityClientForScripts} from './lib/sanityEnvClient'

const APPLY = process.argv.includes('--apply')

type Row = {_id: string; bedrooms: number | null; title: string | null; isPublished: boolean | null}

const QUERY = `*[_type == "property" && type->slug.current == "studio" && (bedrooms == 0 || !defined(bedrooms))]{
  _id, bedrooms, isPublished, "title": title.en
} | order(_id asc)`

async function main() {
  const client = getSanityClientForScripts()
  const rows = (await client.fetch(QUERY)) as Row[]
  console.log(`[${APPLY ? 'APPLY' : 'DRY-RUN'}] studio properties with bedrooms 0/unset: ${rows.length}`)
  for (const r of rows) {
    console.log(`  ${r._id}  bedrooms=${r.bedrooms ?? 'unset'}  published=${r.isPublished ?? 'unset'}  "${r.title ?? ''}"`)
  }
  if (!APPLY || rows.length === 0) return

  const tx = client.transaction()
  for (const r of rows) tx.patch(r._id, (p) => p.set({bedrooms: 1}))
  await tx.commit()
  console.log(`patched ${rows.length} document(s): bedrooms = 1`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
