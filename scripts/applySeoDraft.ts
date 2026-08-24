/**
 * Writes fresh English SEO meta (title/description, mirrored into Open Graph)
 * onto the six 2026-08-24 blog post drafts. The rewrite changed every
 * article's body and title; the seo block still carried the pre-rewrite
 * meta text describing the old article, found while auditing publish
 * readiness. Only `.en` is set here — the Translate pass (translateBlogPost.ts)
 * picks these up and produces the other locales from them.
 *
 * Run:
 *   npm run apply:blog-seo-draft
 *   npm run apply:blog-seo-draft -- --execute
 */

import path from 'node:path'
import fs from 'node:fs'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.slice(2).includes('--execute')
const DRAFT_PATH = path.resolve(process.cwd(), 'scripts/data/blogSeoDraft-2026-08-24.json')

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

    const id = `drafts.blogPost-${slug}`
    const existing = await client.getDocument(id)
    if (!existing) {
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
