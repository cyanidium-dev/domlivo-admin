/**
 * Backfill district `title.it` (2026-08-15) — see
 * docs/engineering/PLAN-align-taxonomy-2026-08-15.md Task 6.
 *
 * Italian is a shipped locale but no district carries title.it. Albanian place
 * names are used unchanged in Italian; the descriptive English names get real
 * Italian. Also repairs "Лунгомарe" (mixed Cyrillic + Latin e) in ru/uk.
 * Usage: sanity exec scripts/backfillDistrictTitleIt.ts --with-user-token [-- --apply]
 */
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-06-01'})
const APPLY = process.argv.includes('--apply')

/** Descriptive names that must be translated rather than passed through. */
const IT_OVERRIDES: Record<string, string> = {
  'city-center-durres': 'Centro città',
  'city-center-sarande': 'Centro città',
  'city-center-vlore': 'Centro città',
  'qender-tirana': 'Centro città',
  'qender-shkoder': 'Centro città',
  'center-shengjin': 'Centro città',
  'center-himare': 'Centro',
  'old-town-himare': 'Città vecchia',
  'seaside-himare': 'Lungomare',
  'seafront-sarande': 'Lungomare',
}

const RU_UK_FIXES: Record<string, {ru: string; uk: string}> = {
  lungomare: {ru: 'Лунгомаре', uk: 'Лунгомаре'},
}

async function main() {
  console.log(`[${APPLY ? 'APPLY' : 'DRY-RUN'}]`)

  const docs = await client.fetch<{_id: string; slug: string; en: string; it?: string}[]>(
    `*[_type == "district"]{_id, "slug": slug.current, "en": title.en, "it": title.it}`,
  )

  const patches = docs
    .filter((d) => !d.it)
    .map((d) => ({
      id: d._id,
      slug: d.slug,
      // Albanian toponyms are identical in Italian; only descriptive names differ.
      it: IT_OVERRIDES[d.slug] ?? d.en,
    }))

  for (const p of patches) console.log(`  ${p.slug}: title.it = "${p.it}"`)
  console.log(`districts to patch: ${patches.length}`)

  const fixes = Object.entries(RU_UK_FIXES).filter(([slug]) => docs.some((d) => d.slug === slug))
  for (const [slug, v] of fixes) console.log(`  ${slug}: ru/uk -> "${v.ru}"/"${v.uk}"`)

  if (!APPLY) {
    console.log('\nno changes written (dry run)')
    return
  }

  const tx = client.transaction()
  for (const p of patches) tx.patch(p.id, (patch) => patch.set({'title.it': p.it}))
  for (const [slug, v] of fixes) {
    const doc = docs.find((d) => d.slug === slug)
    if (doc) tx.patch(doc._id, (patch) => patch.set({'title.ru': v.ru, 'title.uk': v.uk}))
  }
  await tx.commit()

  const left = await client.fetch<number>(`count(*[_type == "district" && !defined(title.it)])`)
  console.log(`districts still missing title.it: ${left}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
