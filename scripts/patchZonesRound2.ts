/**
 * Zone taxonomy round 2 — patch-only half (2026-08-15).
 *
 * Field-level patches only, deliberately NOT a document round-trip: the Sanity
 * CLI mangles Cyrillic through a pipe on Windows, so `documents get |
 * documents create --replace` would write lone surrogates into text that is
 * clean in the dataset. Patching named fields never touches the rest.
 *
 * 1. Moves `lukove` from Saranda to Himare — Lukove is an administrative unit
 *    of Bashkia Himare (2015 reform) and the state reference-price map groups
 *    it there. Unpublished, so no live URL changes.
 * 2. Renames `seafront-sarande` -> `buze-shetitores`: "Bregdeti" (the coast) is
 *    a descriptor, while Saranda listings name this strip "Buzë Shetitores".
 *    The 301 ships separately in the frontend.
 *
 * The `kodra` deletion is NOT here — deletes are handled separately.
 * Usage: sanity exec scripts/patchZonesRound2.ts --with-user-token [-- --apply]
 */
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-06-01'})
const APPLY = process.argv.includes('--apply')

const MOVE = {id: 'district-lukove', fromCity: 'city-sarande', toCity: 'city-himare'} as const

const RENAME = {
  id: 'district-bregdeti-sarande',
  fromSlug: 'seafront-sarande',
  toSlug: 'buze-shetitores',
  title: {
    en: 'Promenade',
    sq: 'Buzë Shetitores',
    it: 'Lungomare',
    ru: 'Набережная',
    uk: 'Набережна',
  },
} as const

async function main() {
  console.log(`[${APPLY ? 'APPLY' : 'DRY-RUN'}]`)

  // --- resolve the rename target by slug (its _id is not derived from it) ---
  const renameDoc = await client.fetch<{_id: string; slug: string} | null>(
    `*[_type == "district" && slug.current == $s][0]{_id, "slug": slug.current}`,
    {s: RENAME.fromSlug},
  )
  if (!renameDoc) throw new Error(`district with slug "${RENAME.fromSlug}" not found — aborting`)

  const slugTaken = await client.fetch<number>(
    `count(*[_type == "district" && slug.current == $s && _id != $id])`,
    {s: RENAME.toSlug, id: renameDoc._id},
  )
  if (slugTaken > 0) throw new Error(`slug "${RENAME.toSlug}" already in use — aborting`)

  const moveDoc = await client.fetch<{city: string; isPublished: boolean} | null>(
    `*[_id == $id][0]{"city": city._ref, isPublished}`,
    {id: MOVE.id},
  )
  if (!moveDoc) throw new Error(`${MOVE.id} not found — aborting`)
  if (moveDoc.city !== MOVE.fromCity) {
    throw new Error(`${MOVE.id} city is ${moveDoc.city}, expected ${MOVE.fromCity} — aborting`)
  }
  if (moveDoc.isPublished !== false) {
    throw new Error(`${MOVE.id} is published — moving it would change a live URL; aborting`)
  }

  console.log(`move ${MOVE.id}: city ${MOVE.fromCity} -> ${MOVE.toCity} (unpublished)`)
  console.log(
    `rename ${renameDoc._id}: slug ${RENAME.fromSlug} -> ${RENAME.toSlug}, ` +
      `title -> ${JSON.stringify(RENAME.title)}`,
  )

  if (!APPLY) {
    console.log('\nno changes written (dry run)')
    return
  }

  const tx = client.transaction()
  tx.patch(MOVE.id, (p) => p.set({city: {_type: 'reference', _ref: MOVE.toCity}}))
  tx.patch(renameDoc._id, (p) => {
    const set: Record<string, unknown> = {'slug.current': RENAME.toSlug}
    for (const [loc, value] of Object.entries(RENAME.title)) set[`title.${loc}`] = value
    return p.set(set)
  })
  await tx.commit()

  const after = await client.fetch(
    `{
      "lukove": *[_id == $move][0]{"city": city->title.en, isPublished},
      "renamed": *[_id == $ren][0]{"slug": slug.current, "en": title.en, "sq": title.sq},
      "total": count(*[_type == "district"]),
      "published": count(*[_type == "district" && isPublished != false])
    }`,
    {move: MOVE.id, ren: renameDoc._id},
  )
  console.log('after:', JSON.stringify(after, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
