/**
 * Writes fresh English SEO meta (title/description, mirrored into Open Graph)
 * onto whichever blog post drafts a JSON file names. Built for the
 * 2026-08-24 batch, where a rewrite changed every article's body and title
 * but the seo block still carried the pre-rewrite meta text describing the
 * old article — found while auditing publish readiness. Generalized to take
 * the draft file as an argument so the same script covers the next batch's
 * SEO fix too, not just this one. Only `.en` is set here — the Translate
 * pass (translateBlogPost.ts) picks these up and produces the other
 * locales from them.
 *
 * The draft JSON is `{ "<slug>": {"metaTitle": "...", "metaDescription":
 * "..."} }` — see scripts/data/blogSeoDraft-2026-08-24.json for the shape.
 *
 * Run:
 *   npm run apply:blog-seo-draft -- scripts/data/blogSeoDraft-<date>.json
 *   npm run apply:blog-seo-draft -- scripts/data/blogSeoDraft-<date>.json --execute
 */

import path from 'node:path'
import fs from 'node:fs'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {resolveBlogPostDraftId} from './lib/resolveBlogPostDraftId'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const args = process.argv.slice(2)
const execute = args.includes('--execute')
const draftArg = args.find((a) => !a.startsWith('--'))
if (!draftArg) {
  throw new Error('usage: npm run apply:blog-seo-draft -- <path-to-draft.json> [--execute]')
}
const DRAFT_PATH = path.resolve(process.cwd(), draftArg)

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

type SeoDraft = Record<string, {metaTitle: string; metaDescription: string}>

async function main(): Promise<void> {
  const draft = JSON.parse(fs.readFileSync(DRAFT_PATH, 'utf8')) as SeoDraft

  for (const [slug, {metaTitle, metaDescription}] of Object.entries(draft)) {
    if (metaTitle.length > 60) throw new Error(`${slug}: metaTitle is ${metaTitle.length} chars, over 60`)
    if (metaDescription.length > 160) {
      throw new Error(`${slug}: metaDescription is ${metaDescription.length} chars, over 160`)
    }

    const id = await resolveBlogPostDraftId(client, slug)
    const existing = id ? await client.getDocument(id) : null
    if (!existing || !id) {
      console.log(`${slug}: NO DRAFT — skipped`)
      continue
    }

    console.log(`${slug}`)
    console.log(`  metaTitle: "${metaTitle}"`)
    console.log(`  metaDescription: "${metaDescription}"`)

    if (!execute) continue

    await client
      .patch(id)
      .set({
        'seo.metaTitle.en': metaTitle,
        'seo.metaDescription.en': metaDescription,
        'seo.ogTitle.en': metaTitle,
        'seo.ogDescription.en': metaDescription,
      })
      .commit()
    console.log(`  written`)
  }

  if (!execute) console.log('\nDry run. Re-run with --execute to write.')
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
