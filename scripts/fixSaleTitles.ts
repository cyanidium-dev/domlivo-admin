/**
* Meta titles (and og titles) of the national /sale page (catalogSeoPage-propertiesRoot) in
 * en, it and pl, rewritten to fit the line with the brand.
 *
 * Why: the frontend drops whole trailing segments of a title longer than 60
 * characters (lib/seo/brandTitle.ts), so the 61–64-character titles written on
 * 2026-09-16 shipped as "Case in vendita in Albania — Domlivo" and "Mieszkanie
 * w Albanii — Domlivo": the query word and nothing else (SEO hypothesis 2,
 * 2026-10-19). At 50 characters or fewer the brand fits and nothing is cut.
 * ru, uk and de already fit.
 *
 * Run:
 *   npx tsx scripts/fixSaleTitles.ts            (dry run: prints before → after)
 *   npx tsx scripts/fixSaleTitles.ts --execute
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.includes('--execute')
const token = process.env.SANITY_API_TOKEN?.trim()
if (!token) {
  console.error('SANITY_API_TOKEN required in .env')
  process.exit(1)
}
const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

const ID = 'catalogSeoPage-propertiesRoot'
const MAX_WITH_BRAND = 50

const META_TITLE: Record<string, string> = {
  en: 'Property for Sale in Albania: Prices 2026 by City',
  it: 'Case in vendita in Albania al mare: prezzi 2026',
  pl: 'Mieszkania w Albanii na sprzedaż: ceny 2026',
}

async function main() {
  for (const [loc, t] of Object.entries(META_TITLE)) {
    if (t.length > MAX_WITH_BRAND) throw new Error(`${loc}: ${t.length} chars, over ${MAX_WITH_BRAND}`)
  }
  const doc = await client.fetch<Record<string, any> | null>(`*[_id == $id][0]`, {id: ID})
  if (!doc) throw new Error(`${ID} not found`)
  console.log('current metaTitle:', JSON.stringify(doc.seo?.metaTitle, null, 2))
  console.log('current title:    ', JSON.stringify(doc.title, null, 2))
  for (const [loc, t] of Object.entries(META_TITLE)) {
    console.log(`${loc}: "${doc.seo?.metaTitle?.[loc] ?? ''}" (${(doc.seo?.metaTitle?.[loc] ?? '').length}) → "${t}" (${t.length})`)
  }
  if (!execute) {
    console.log('\ndry run; pass --execute to write')
    return
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.resolve(process.cwd(), 'scripts/data/backups')
  fs.mkdirSync(backupDir, {recursive: true})
  const backup = path.join(backupDir, `sale-titles-backup-${stamp}.json`)
  fs.writeFileSync(backup, JSON.stringify(doc, null, 2))
  console.log('backup:', backup)
  const patch: Record<string, string> = {}
  for (const [loc, t] of Object.entries(META_TITLE)) {
    patch[`seo.metaTitle.${loc}`] = t
    // de already keeps ogTitle equal to metaTitle; en/it/pl had the generic "Real Estate in Albania | Domlivo".
    patch[`seo.ogTitle.${loc}`] = t
  }
  await client.patch(ID).ifRevisionId(doc._rev).set(patch).commit()
  console.log('written')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
