/**
 * District taxonomy alignment (2026-08-15) — see
 * docs/engineering/PLAN-align-taxonomy-2026-08-15.md.
 *
 * 1. Deletes duplicate districts `livadhi` (dupe of `livadh`) and `new-bazaar`
 *    (dupe of `pazari-i-ri`) plus their paired catalogSeoPage docs and drafts.
 * 2. Renames `beachfront-durres` -> `plazh` and `dajti` -> `fresku` to match the
 *    KB / reference-price map, and blanks the now-wrong seed copy on `fresku`.
 * 3. Creates unpublished sibling shells for the two zones the KB prices as two
 *    separate markets: `golem-1st-line` and `lungomare-2nd-line`.
 * 4. Unpublishes `porto-romano` (an infrastructure project, no residential
 *    market) and `lukove` (no research, no listings).
 *
 * Document _ids are deterministic and are NOT changed by renames.
 * Usage: sanity exec scripts/alignDistrictTaxonomy.ts --with-user-token [-- --apply]
 */
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-06-01'})
const APPLY = process.argv.includes('--apply')

const DELETE_IDS = ['district-livadhi', 'district-new-bazaar'] as const

const RENAMES = [
  {
    id: 'district-plazh',
    fromSlug: 'beachfront-durres',
    toSlug: 'plazh',
    title: {en: 'Plazh', sq: 'Plazhi', it: 'Plazh', ru: 'Плаж', uk: 'Плаж'},
    blankCopy: false,
  },
  {
    id: 'district-dajti',
    fromSlug: 'dajti',
    toSlug: 'fresku',
    title: {en: 'Fresku', sq: 'Fresku', it: 'Fresku', ru: 'Фреску', uk: 'Фреску'},
    // Existing copy describes Dajti (a mountain/park), not the Fresku/Linzë
    // residential zone — it would be wrong under the new name.
    blankCopy: true,
  },
] as const

const SHELLS = [
  {
    id: 'district-golem-1st-line',
    slug: 'golem-1st-line',
    cityId: 'city-durres',
    title: {
      en: 'Golem 1st Line',
      sq: 'Golemi, vija e parë',
      it: 'Golem, prima linea',
      ru: 'Голем, первая линия',
      uk: 'Голем, перша лінія',
    },
  },
  {
    id: 'district-lungomare-2nd-line',
    slug: 'lungomare-2nd-line',
    cityId: 'city-vlore',
    title: {
      en: 'Lungomare 2nd Line',
      sq: 'Lungomare, vija e dytë',
      it: 'Lungomare, seconda linea',
      ru: 'Лунгомаре, вторая линия',
      uk: 'Лунгомаре, друга лінія',
    },
  },
] as const

const UNPUBLISH_IDS = ['district-porto-romano', 'district-lukove'] as const

const BLANK_FIELDS = [
  'heroTitle',
  'heroSubtitle',
  'heroShortLine',
  'shortDescription',
  'description',
  'seoText',
] as const

async function main() {
  console.log(`[${APPLY ? 'APPLY' : 'DRY-RUN'}]`)

  // --- guards -------------------------------------------------------------
  for (const id of DELETE_IDS) {
    const refs = await client.fetch<{_id: string; _type: string}[]>(
      `*[references($id)]{_id, _type}`,
      {id},
    )
    const nonSeo = refs.filter((r) => r._type !== 'catalogSeoPage')
    if (nonSeo.length > 0) {
      throw new Error(
        `${id} is referenced by ${nonSeo.length} non-catalogSeoPage doc(s): ` +
          `${nonSeo.map((r) => `${r._type}:${r._id}`).join(', ')} — aborting`,
      )
    }
    console.log(`delete ${id} + catalogSeoPage-district-${id} (+ drafts)`)
  }

  for (const id of UNPUBLISH_IDS) {
    const props = await client.fetch<number>(
      `count(*[_type == "property" && references($id)])`,
      {id},
    )
    if (props > 0) throw new Error(`${id} has ${props} listing(s) — aborting, do not unpublish`)
    console.log(`unpublish ${id} (0 listings)`)
  }

  for (const shell of SHELLS) {
    const city = await client.fetch<string | null>(`*[_id == $id][0]._id`, {id: shell.cityId})
    if (!city) throw new Error(`city ${shell.cityId} not found — aborting`)
    console.log(`create unpublished shell ${shell.id} (${shell.slug}) in ${shell.cityId}`)
  }

  for (const r of RENAMES) {
    const current = await client.fetch<string | null>(`*[_id == $id][0].slug.current`, {id: r.id})
    if (current !== r.fromSlug) {
      throw new Error(`${r.id} slug is "${current}", expected "${r.fromSlug}" — aborting`)
    }
    console.log(
      `rename ${r.id}: slug ${r.fromSlug} -> ${r.toSlug}, title -> ${JSON.stringify(r.title)}` +
        (r.blankCopy ? ` (+ blank ${BLANK_FIELDS.join('/')})` : ''),
    )
  }

  if (!APPLY) {
    console.log('\nno changes written (dry run)')
    return
  }

  // --- mutate -------------------------------------------------------------
  const tx = client.transaction()

  for (const id of DELETE_IDS) {
    tx.delete(id)
    tx.delete(`drafts.${id}`)
    tx.delete(`catalogSeoPage-district-${id}`)
    tx.delete(`drafts.catalogSeoPage-district-${id}`)
  }

  for (const r of RENAMES) {
    tx.patch(r.id, (p) => {
      const set: Record<string, unknown> = {'slug.current': r.toSlug}
      for (const [loc, value] of Object.entries(r.title)) set[`title.${loc}`] = value
      const patched = p.set(set)
      return r.blankCopy ? patched.unset([...BLANK_FIELDS]) : patched
    })
  }

  for (const shell of SHELLS) {
    tx.createIfNotExists({
      _id: shell.id,
      _type: 'district',
      title: shell.title,
      slug: {_type: 'slug', current: shell.slug},
      city: {_type: 'reference', _ref: shell.cityId},
      isPublished: false,
    })
  }

  for (const id of UNPUBLISH_IDS) {
    tx.patch(id, (p) => p.set({isPublished: false}))
  }

  await tx.commit()

  // --- verify -------------------------------------------------------------
  const after = await client.fetch(
    `{
      "deleted": count(*[_id in $deleteIds]),
      "renamed": *[_id in $renameIds]{"slug": slug.current, "en": title.en, "it": title.it},
      "shells": *[_id in $shellIds]{"slug": slug.current, isPublished},
      "unpublished": *[_id in $unpublishIds]{"slug": slug.current, isPublished}
    }`,
    {
      deleteIds: DELETE_IDS,
      renameIds: RENAMES.map((r) => r.id),
      shellIds: SHELLS.map((s) => s.id),
      unpublishIds: UNPUBLISH_IDS,
    },
  )
  console.log('after:', JSON.stringify(after, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
