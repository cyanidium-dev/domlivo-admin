/**
 * One-shot, 2026-09-27. Search Console, 28 days: the query "ceny mieszkań w
 * albanii 2026" showed the guide `czy-warto-kupic-mieszkanie-w-albanii`
 * 73 times at position 7.6 and got zero clicks; the title ("Czy warto kupić
 * mieszkanie w Albanii w 2026? Bilans") never said "ceny". The title now
 * leads with the phrase people type and keeps the guide's promise.
 *
 * Only the current title is replaced, so a later manual edit is kept.
 *
 * Run:
 * - npx tsx scripts/patchPlGuideTitle20260927.ts            (dry)
 * - npx tsx scripts/patchPlGuideTitle20260927.ts --execute
 */
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const execute = process.argv.slice(2).includes('--execute')
const DOC_ID = 'landing-pl-czy-warto-kupic-mieszkanie-w-albanii'
const OLD_TITLE = 'Czy warto kupić mieszkanie w Albanii w 2026? Bilans'
const NEW_TITLE = 'Ceny mieszkań w Albanii 2026: czy warto kupić? Bilans'
const NEW_DESCRIPTION =
  'Ceny mieszkań w Albanii w 2026 i bilans zakupu: za i przeciw, realny zwrot z wynajmu 4–6 %, podatek 15 %, sezonowość i ryzyka. Rachunek na przykładzie Sarandy.'

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID || 'g4aqp6ex',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  apiVersion: '2025-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
})

async function main() {
  const doc = await client.fetch<{_rev: string; seo?: {metaTitle?: Record<string, string>}}>(
    `*[_id==$id][0]{_rev, seo}`,
    {id: DOC_ID},
  )
  if (!doc) throw new Error(`${DOC_ID} not found`)
  const set: Record<string, string> = {}
  for (const l of ['pl', 'en']) {
    if (doc.seo?.metaTitle?.[l] === OLD_TITLE) {
      set[`seo.metaTitle.${l}`] = NEW_TITLE
      set[`seo.ogTitle.${l}`] = NEW_TITLE
      set[`seo.metaDescription.${l}`] = NEW_DESCRIPTION
      set[`seo.ogDescription.${l}`] = NEW_DESCRIPTION
    }
  }
  console.log(execute ? 'EXECUTE' : 'DRY', DOC_ID, doc._rev, set)
  if (!execute || Object.keys(set).length === 0) return
  const res = await client.patch(DOC_ID).set(set).commit()
  console.log('patched, rev', res._rev)
}
main().catch((e) => { console.error(e.message); process.exit(1) })
