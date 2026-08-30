/**
 * Removes the legacy per-locale `seo` block from properties.
 *
 * `property.seo` is declared as `localizedSeo` — `{metaTitle: {en, sq, …},
 * metaDescription: {…}, ogTitle, ogDescription, ogImage, noIndex}`. The
 * DatoCMS import wrote a different shape: `{en: {title, description}, ru: {…}}`.
 *
 * Nothing reads it. `buildPropertyMetadata` looks for `seo.metaTitle` and
 * `seo.metaDescription`, finds neither, and falls through to the property's
 * own `title` and `description` — which is why the live meta description has
 * always come from `description.<locale>`. Studio renders the declared fields,
 * which are empty, so an editor cannot see this content either.
 *
 * So the block is invisible in both directions while still carrying wrong
 * copy: on four listings its English title names the wrong property type.
 * Dropping it changes nothing a visitor sees and leaves the document saying
 * only true things. The 4 bot-created listings already carry no `seo` at all
 * and render correctly.
 *
 * `migratePropertySeoToLocalized.ts` does NOT cover this — it converts a
 * different legacy shape (flat `metaTitle` strings), not the per-locale one.
 *
 * Every removed block is snapshotted first.
 *
 * Run:
 * - npm run prune:legacy-property-seo -- --slug <slug>      (dry)
 * - npm run prune:legacy-property-seo -- --all              (dry, every affected doc)
 * - npm run prune:legacy-property-seo -- --all --execute
 */

import path from 'node:path'
import fs from 'node:fs'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const args = process.argv.slice(2)
const execute = args.includes('--execute')
const all = args.includes('--all')

function flag(name: string): string {
  const inline = args.find((a) => a.startsWith(`--${name}=`))
  if (inline) return inline.slice(name.length + 3)
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : ''
}

const slug = flag('slug')
const LOCALE_KEYS = ['en', 'sq', 'ru', 'uk', 'it', 'pl']
const SCHEMA_KEYS = ['metaTitle', 'metaDescription', 'keywords', 'ogTitle', 'ogDescription', 'ogImage', 'noIndex']

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

async function main(): Promise<void> {
  if (!slug && !all) throw new Error('pass --slug <slug> or --all')

  const rows = slug
    ? await client.fetch(`*[_type=="property" && slug.current==$slug]{_id, "s":slug.current, seo}`, {slug})
    : await client.fetch(`*[_type=="property" && defined(seo)]{_id, "s":slug.current, seo}| order(slug.current)`)

  const affected: Array<{_id: string; s: string; seo: unknown; keys: string[]}> = []
  for (const r of rows) {
    const seo = (r.seo ?? {}) as Record<string, unknown>
    const keys = Object.keys(seo).filter((k) => !k.startsWith('_'))
    const legacy = keys.filter((k) => LOCALE_KEYS.includes(k))
    const schema = keys.filter((k) => SCHEMA_KEYS.includes(k))
    if (legacy.length === 0) continue
    if (schema.length > 0) {
      // Both shapes present: removing the whole block would take real data with
      // it. Report and leave alone — this needs a merge, not a delete.
      console.log(`SKIP ${r.s} — carries BOTH shapes (${schema.join(',')} + ${legacy.join(',')})`)
      continue
    }
    affected.push({_id: r._id, s: r.s, seo: r.seo, keys: legacy})
  }

  for (const a of affected) {
    const en = (a.seo as Record<string, {title?: string}>)?.en
    console.log(`  ${a.s}  [${a.keys.join(',')}]  en.title: ${en?.title ?? '(none)'}`)
  }
  console.log(`\n${affected.length} propert(ies) carry a legacy-only seo block`)

  if (!execute) {
    console.log('Dry run. Re-run with --execute to write.')
    return
  }
  if (affected.length === 0) return

  const dir = path.resolve(process.cwd(), 'scripts/data')
  fs.mkdirSync(dir, {recursive: true})
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const file = path.join(dir, `legacyPropertySeo-backup-${stamp}.json`)
  fs.writeFileSync(file, JSON.stringify(affected.map(({_id, s, seo}) => ({_id, s, seo})), null, 2), 'utf8')
  console.log(`snapshot written to ${file}`)

  let tx = client.transaction()
  for (const a of affected) tx = tx.patch(a._id, (p) => p.unset(['seo']))
  await tx.commit()
  console.log(`unset seo on ${affected.length} document(s)`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
