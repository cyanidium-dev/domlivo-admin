/**
 * Translates blogTable blocks — title, caption and every cell that carries
 * language — into the other five locales. translateBlogPost.ts copies tables
 * verbatim into each locale because discoverPortableText only sees
 * `_type: "block"`, so table cells stayed English on every post with a table
 * (verified on three live posts, 2026-09-03). Replaces the locale's table
 * with the English structure + translated text, matched by _key.
 *
 * Draft when one exists, else published. Dry by default. Snapshot first.
 *
 * Run:
 *   npm run translate:blog-tables -- <slug> [--execute]
 */
import path from 'node:path'
import fs from 'node:fs'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {PROJECT_LOCALE_IDS} from '../lib/sanity/localizedPaste/projectLocales'
import {resolveBlogPostDraftId} from './lib/resolveBlogPostDraftId'
import {studioTranslate} from './lib/studioTranslateFetch'
import {applyTableTranslations, collectTableItems, type BlogTable} from './lib/blogTables'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const args = process.argv.slice(2)
const execute = args.includes('--execute')
const slug = args.find((a) => !a.startsWith('--')) ?? ''
if (!slug) throw new Error('usage: npm run translate:blog-tables -- <slug> [--execute]')
const BASE = 'en'
const TARGETS = PROJECT_LOCALE_IDS.filter((l) => l !== BASE)

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

async function main(): Promise<void> {
  const draftId = await resolveBlogPostDraftId(client, slug)
  let id = draftId
  let doc = draftId ? ((await client.getDocument(draftId)) as Record<string, unknown> | null) : null
  if (!doc && draftId) {
    id = draftId.replace(/^drafts\./, '')
    doc = (await client.getDocument(id)) as Record<string, unknown> | null
  }
  if (!doc || !id) throw new Error(`no blogPost found for slug "${slug}"`)

  const content = (doc.content || {}) as Record<string, Array<Record<string, unknown>>>
  const tables = (content[BASE] || []).filter((b) => b._type === 'blogTable') as unknown as BlogTable[]
  if (!tables.length) {
    console.log(`${slug}: no tables in content.en — nothing to do`)
    return
  }
  const items = collectTableItems(tables)
  console.log(`${slug} (${id}): ${tables.length} table(s), ${items.length} translatable cell(s)`)
  for (const l of TARGETS) {
    const missing = tables.filter((t) => !(content[l] || []).some((b) => b._key === t._key))
    if (missing.length) {
      throw new Error(`${l}: table(s) ${missing.map((t) => t._key).join(', ')} not present — translate the body first`)
    }
  }

  const {items: out} = await studioTranslate(BASE, items, TARGETS)
  const ops: Record<string, unknown> = {}
  for (const l of TARGETS) {
    const map = new Map(out.map((it) => [it.key, String(it.locales[l as keyof typeof it.locales] || '')]))
    for (const t of tables) {
      const rebuilt = applyTableTranslations(t, map, l)
      ops[`content.${l}[_key=="${t._key}"]`] = rebuilt
      console.log(`  ${l} ${t._key}: ${rebuilt.rows[0]?.cells.join(' | ').slice(0, 90)}`)
    }
  }
  if (!execute) {
    console.log('\nDry run. Re-run with --execute to write.')
    return
  }
  const dir = path.resolve(process.cwd(), 'scripts/data')
  fs.mkdirSync(dir, {recursive: true})
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  fs.writeFileSync(path.join(dir, `blogTables-${slug}-backup-${stamp}.json`), JSON.stringify(doc, null, 2), 'utf8')
  await client.patch(id).set(ops).commit()
  console.log(`  wrote ${tables.length} table(s) × ${TARGETS.length} locales on ${id}`)
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
