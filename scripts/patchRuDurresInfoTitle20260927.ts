/**
 * One-shot, 2026-09-27. Search Console, 28 days: Russian queries about
 * "реальные цены на жильё в Дурресе 2026" (29 + 17 impressions, zero clicks)
 * landed on the district pages, whose titles carry those words, while the
 * city price page itself sat at position 2.2 with five impressions under
 * "Цены на недвижимость в Дурресе 2026: €/м² по районам". The city page is
 * the one built for that question, so its title now says what people type.
 *
 * Only the current title is replaced, so a later manual edit is kept.
 *
 * Run:
 * - npx tsx scripts/patchRuDurresInfoTitle20260927.ts            (dry)
 * - npx tsx scripts/patchRuDurresInfoTitle20260927.ts --execute
 */
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const execute = process.argv.slice(2).includes('--execute')
const OLD_TITLE = 'Цены на недвижимость в Дурресе 2026: €/м² по районам'
const NEW_TITLE = 'Цены на жильё в Дурресе 2026: реальные €/м² по районам'

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID || 'g4aqp6ex',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  apiVersion: '2025-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
})

async function main() {
  const docs = await client.fetch<{_id: string; _rev: string; ogRu?: string}[]>(
    `*[_type=="landingPage" && seo.metaTitle.ru==$t]{_id,_rev,"ogRu":seo.ogTitle.ru}`,
    {t: OLD_TITLE},
  )
  console.log(execute ? 'EXECUTE' : 'DRY', docs)
  if (!execute) return
  for (const d of docs) {
    const set: Record<string, string> = {'seo.metaTitle.ru': NEW_TITLE}
    if (d.ogRu === OLD_TITLE) set['seo.ogTitle.ru'] = NEW_TITLE
    const res = await client.patch(d._id).set(set).commit()
    console.log('patched', d._id, 'rev', res._rev)
  }
}
main().catch((e) => { console.error(e.message); process.exit(1) })
