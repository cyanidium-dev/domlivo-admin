/**
 * One-shot data fix (2026-08-14): city-shkoder had its title/slug overwritten
 * with "Canngu"/"canggu" (Bali test data) while all its content (hero, seo,
 * descriptions, 4 real districts) remained Shkoder. Restores the Shkoder
 * title/slug and deletes the imported Bali district "Berawa" (0 references).
 * Usage: sanity exec scripts/fixShkoderCity.ts --with-user-token [-- --apply]
 */
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-06-01'})
const APPLY = process.argv.includes('--apply')
const BERAWA_ID = 'a23d3ab2-e134-44cb-aa56-6485eabb7800'

// en/ru/uk mirror the doc's own seo.metaTitle; sq uses the definite form the
// doc already uses in sq copy; it gets the Italian exonym.
const TITLE = {en: 'Shkoder', sq: 'Shkodra', it: 'Scutari', ru: 'Шкодер', uk: 'Шкодер'}

async function main() {
  const berawaRefs = await client.fetch(`count(*[references($id)])`, {id: BERAWA_ID})
  if (berawaRefs > 0) throw new Error(`Berawa has ${berawaRefs} referencing docs - aborting`)

  console.log(`[${APPLY ? 'APPLY' : 'DRY-RUN'}]`)
  console.log(`patch city-shkoder: title=${JSON.stringify(TITLE)} slug.current="shkoder"`)
  console.log(`delete district ${BERAWA_ID} ("Berawa") + its draft`)
  if (!APPLY) return

  await client
    .transaction()
    .patch('city-shkoder', (p) =>
      p.set({
        'title.en': TITLE.en,
        'title.sq': TITLE.sq,
        'title.it': TITLE.it,
        'title.ru': TITLE.ru,
        'title.uk': TITLE.uk,
        'slug.current': 'shkoder',
      })
    )
    .delete(BERAWA_ID)
    .delete(`drafts.${BERAWA_ID}`)
    .commit()

  const after = await client.fetch(`*[_id == "city-shkoder"][0]{title, slug}`)
  console.log('after:', JSON.stringify(after))
  const remaining = await client.fetch(`count(*[_id in [$id, "drafts." + $id]])`, {id: BERAWA_ID})
  console.log(`berawa docs remaining: ${remaining}`)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
