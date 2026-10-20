/**
 * Removes the generated boilerplate from catalogue SEO documents (SEO audit of
 * 2026-10-20, reports/domlivo-ai-text-audit-2026-10-20.md, item 3).
 *
 * 29 of 49 `catalogSeoPage` documents carried the same two strings with only
 * the place swapped in: the intro "Apartments, houses and villas for sale in
 * {place}." (repeating the H1) and the bottom text "Property catalog in
 * {place}. Domlivo aggregates up-to-date listings from owners and agents.
 * Filter by price, rooms and type." (or its shorter district variant) in
 * seven languages. Tirana and Vlorë matched the old audit grep but carry
 * hand-written bottom text and are left alone. Google's spam policy
 * calls pages that differ only by a place name doorways; the page's own
 * content is the figures line under the listing heading and the price,
 * recent-listings and FAQ sections, which are computed per place.
 *
 * Unsets `intro` and `bottomText` only where every language of both fields is
 * short boilerplate; the hero then shows its generic one-line fallback.
 * Written documents (Durrës, Plazh, Golem …) are untouched.
 *
 * Run:
 *   npx tsx scripts/clearTemplateCatalogCopy.ts            (dry run)
 *   npx tsx scripts/clearTemplateCatalogCopy.ts --execute  (backup + one transaction)
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

const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl', 'de'] as const
const EN_INTRO = /^Apartments, houses and villas for sale in [^.]+\.$/
const EN_BOTTOM = /^Property catalog in [^.]+\. Domlivo aggregates up-to-date listings( from owners and agents)?\. Filter by price(, rooms)? and type\.$/
/** Boilerplate is one or two short sentences; anything longer was written by someone. */
const MAX_INTRO = 140
const MAX_BOTTOM = 260

function plain(v: unknown): string {
  if (typeof v === 'string') return v.trim()
  if (Array.isArray(v)) return v.map((b: any) => (b?.children ?? []).map((s: any) => s?.text ?? '').join('')).join(' ').trim()
  return ''
}

async function main() {
  const docs = await client.fetch<Array<Record<string, any>>>(
    `*[_type == "catalogSeoPage" && !(_id in path("drafts.**"))]{_id, _rev, intro, bottomText}`,
  )
  const targets: typeof docs = []
  for (const d of docs) {
    if (!EN_INTRO.test(plain(d.intro?.en)) || !EN_BOTTOM.test(plain(d.bottomText?.en))) continue
    const long = LOCALES.filter(
      (l) => plain(d.intro?.[l]).length > MAX_INTRO || plain(d.bottomText?.[l]).length > MAX_BOTTOM,
    )
    if (long.length) {
      console.log(`skip ${d._id}: hand-written text in ${long.join(', ')}`)
      continue
    }
    targets.push(d)
  }
  console.log(`${targets.length} of ${docs.length} documents carry only the boilerplate:`)
  for (const d of targets) console.log(`  ${d._id}  intro.ru="${plain(d.intro?.ru)}"`)
  if (!execute) {
    console.log('\ndry run; pass --execute to unset intro and bottomText on these documents')
    return
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const dir = path.resolve(process.cwd(), 'scripts/data/backups')
  fs.mkdirSync(dir, {recursive: true})
  const file = path.join(dir, `catalog-template-copy-backup-${stamp}.json`)
  fs.writeFileSync(file, JSON.stringify(targets, null, 2))
  console.log('backup:', file)
  const tx = client.transaction()
  for (const d of targets) tx.patch(d._id, (p) => p.ifRevisionId(d._rev).unset(['intro', 'bottomText']))
  await tx.commit()
  console.log(`unset intro and bottomText on ${targets.length} documents`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
