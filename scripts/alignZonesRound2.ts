/**
 * Zone taxonomy alignment, round 2 (2026-08-15) — follows
 * docs/engineering/ZONE-TAXONOMY.md and the research in
 * knowledge-base/02-cities/saranda-ksamil.md §2b/§2c + himara.md §8.
 *
 * 1. Creates `zona-e-portit` (Saranda port zone) — a label the market actually
 *    uses on listings ("Zona e Portit"), unlike `kodra`.
 * 2. Deletes `kodra`: a descriptor ("hillside with views"), not a toponym.
 *    Zero listings carry it and no source segments Saranda that way; its price
 *    band (~EUR 1,550-1,800/m2) is already covered by `city-center-sarande`.
 *    A 301 to city-center-sarande ships with the frontend.
 * 3. Moves `lukove` from Saranda to Himare: Lukove is an administrative unit of
 *    Bashkia Himare (2015 reform) and the state reference-price map groups it
 *    with Himare. It is unpublished, so no live URL changes.
 *
 * Usage: sanity exec scripts/alignZonesRound2.ts --with-user-token [-- --apply]
 */
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-06-01'})
const APPLY = process.argv.includes('--apply')

const PORT_ZONE = {
  _id: 'district-zona-e-portit',
  slug: 'zona-e-portit',
  cityId: 'city-sarande',
  title: {
    en: 'Port Zone',
    sq: 'Zona e Portit',
    it: 'Zona del porto',
    ru: 'Портовая зона',
    uk: 'Портова зона',
  },
} as const

const DELETE_ID = 'district-kodra'
const MOVE = {id: 'district-lukove', fromCity: 'city-sarande', toCity: 'city-himare'} as const

async function main() {
  console.log(`[${APPLY ? 'APPLY' : 'DRY-RUN'}]`)

  // --- guards -------------------------------------------------------------
  const city = await client.fetch<string | null>(`*[_id == $id][0]._id`, {id: PORT_ZONE.cityId})
  if (!city) throw new Error(`city ${PORT_ZONE.cityId} not found — aborting`)

  const slugTaken = await client.fetch<number>(
    `count(*[_type == "district" && slug.current == $s && _id != $id])`,
    {s: PORT_ZONE.slug, id: PORT_ZONE._id},
  )
  if (slugTaken > 0) throw new Error(`slug "${PORT_ZONE.slug}" already in use — aborting`)
  console.log(`create district ${PORT_ZONE._id} (${PORT_ZONE.slug}) in ${PORT_ZONE.cityId}, unpublished`)

  const kodraRefs = await client.fetch<{_id: string; _type: string}[]>(
    `*[references($id)]{_id, _type}`,
    {id: DELETE_ID},
  )
  const kodraBlockers = kodraRefs.filter((r) => r._type !== 'catalogSeoPage')
  if (kodraBlockers.length > 0) {
    throw new Error(
      `${DELETE_ID} referenced by ${kodraBlockers.map((r) => `${r._type}:${r._id}`).join(', ')} — aborting`,
    )
  }
  console.log(`delete ${DELETE_ID} + catalogSeoPage-district-${DELETE_ID} (+ drafts)`)

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
  console.log(`move ${MOVE.id}: city ${MOVE.fromCity} -> ${MOVE.toCity} (unpublished, no URL impact)`)

  if (!APPLY) {
    console.log('\nno changes written (dry run)')
    return
  }

  // --- mutate -------------------------------------------------------------
  await client
    .transaction()
    .createIfNotExists({
      _id: PORT_ZONE._id,
      _type: 'district',
      title: PORT_ZONE.title,
      slug: {_type: 'slug', current: PORT_ZONE.slug},
      city: {_type: 'reference', _ref: PORT_ZONE.cityId},
      isPublished: false,
    })
    .delete(DELETE_ID)
    .delete(`drafts.${DELETE_ID}`)
    .delete(`catalogSeoPage-district-${DELETE_ID}`)
    .delete(`drafts.catalogSeoPage-district-${DELETE_ID}`)
    .patch(MOVE.id, (p) => p.set({city: {_type: 'reference', _ref: MOVE.toCity}}))
    .commit()

  // --- verify -------------------------------------------------------------
  const after = await client.fetch(
    `{
      "portZone": *[_id == $port][0]{"slug": slug.current, "city": city->title.en, isPublished},
      "kodraLeft": count(*[_id in [$del, "drafts." + $del]]),
      "kodraSeoLeft": count(*[_id match "catalogSeoPage-district-" + $del + "*"]),
      "lukove": *[_id == $move][0]{"city": city->title.en, isPublished},
      "total": count(*[_type == "district"]),
      "published": count(*[_type == "district" && isPublished != false])
    }`,
    {port: PORT_ZONE._id, del: DELETE_ID, move: MOVE.id},
  )
  console.log('after:', JSON.stringify(after, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
