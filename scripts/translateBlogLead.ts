/**
 * Translates ONLY the opening paragraph (block 0 of content.en) of a blog post
 * into the other five locales and writes it under the same block _key, leaving
 * every other block untouched.
 *
 * Why: patch:blog-lead replaces the English lead in place, and re-running
 * translate:blog-post --overwrite to carry thirty words across would re-translate
 * a 3,000-word article five times and risk the rest of it. The lead is
 * REPLACED in each locale (not filled) — the old text describes an opening that
 * no longer exists.
 *
 * Works on the draft when one exists, else the published document (same rule as
 * translateBlogPost.ts). Refuses a locale whose body has drifted (see blogLead.ts).
 *
 * Run:
 *   npm run translate:blog-lead -- <slug> [--execute]
 */
import path from 'node:path'
import fs from 'node:fs'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {PROJECT_LOCALE_IDS} from '../lib/sanity/localizedPaste/projectLocales'
import {resolveBlogPostDraftId} from './lib/resolveBlogPostDraftId'
import {studioTranslate} from './lib/studioTranslateFetch'
import {checkLeadStructure, leadBlock, type PtBlock} from './lib/blogLead'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const args = process.argv.slice(2)
const execute = args.includes('--execute')
const slug = args.find((a) => !a.startsWith('--')) ?? ''
if (!slug) throw new Error('usage: npm run translate:blog-lead -- <slug> [--execute]')
const BASE = 'en'
const TARGETS = PROJECT_LOCALE_IDS.filter((l) => l !== BASE)

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

const text = (b: PtBlock | undefined) => (b?.children || []).map((c) => c.text || '').join('')

async function main(): Promise<void> {
  const draftId = await resolveBlogPostDraftId(client, slug)
  let id = draftId
  let doc = draftId ? ((await client.getDocument(draftId)) as Record<string, unknown> | null) : null
  if (!doc && draftId) {
    id = draftId.replace(/^drafts\./, '')
    doc = (await client.getDocument(id)) as Record<string, unknown> | null
  }
  if (!doc || !id) throw new Error(`no blogPost found for slug "${slug}"`)

  const content = (doc.content || {}) as Record<string, PtBlock[]>
  const en = content[BASE] || []
  if (!en.length || en[0]._type !== 'block') throw new Error(`${slug}: block 0 of content.en is not a paragraph`)
  const lead = text(en[0])
  console.log(`${slug} (${id})\n  en lead: ${lead.slice(0, 120)}…`)

  const refusals = TARGETS.map((l) => checkLeadStructure(en, content[l] || [], l)).filter(Boolean)
  if (refusals.length) throw new Error(`structure drift, patch by hand:\n  - ${refusals.join('\n  - ')}`)

  const {items} = await studioTranslate(BASE, [{key: 'lead', kind: 'text', text: lead}], TARGETS)
  const locales = items[0].locales
  const ops: Record<string, unknown> = {}
  for (const l of TARGETS) {
    const t = String(locales[l] || '').trim()
    if (!t) throw new Error(`${l}: endpoint returned an empty lead`)
    console.log(`  ${l}: ${t.slice(0, 100)}…`)
    ops[`content.${l}[_key=="${en[0]._key}"]`] = leadBlock(en[0], t)
  }
  if (!execute) {
    console.log('\nDry run. Re-run with --execute to write.')
    return
  }
  const dir = path.resolve(process.cwd(), 'scripts/data')
  fs.mkdirSync(dir, {recursive: true})
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  fs.writeFileSync(path.join(dir, `blogLeadLocales-${slug}-backup-${stamp}.json`), JSON.stringify(doc, null, 2), 'utf8')
  await client.patch(id).set(ops).commit()
  console.log(`  wrote block 0 in ${TARGETS.join(', ')} on ${id}`)
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
