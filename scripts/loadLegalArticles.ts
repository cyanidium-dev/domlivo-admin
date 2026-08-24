/**
 * Loads the two prepared legal articles from
 * docs/engineering/CONTENT-legal-drafts-2026-08-23.md into Sanity.
 *
 * Both are written as DRAFTS. The new article has no `publishedAt`, so it stays
 * invisible until somebody sets one. The existing article keeps the
 * `publishedAt` it already has — its URL is live today with the duplicate body,
 * and publishing the draft swaps that body for the real one without the page
 * ever going dark.
 *
 * `buying-property-albania` is UPDATED IN PLACE. It has been indexed since
 * 2026-03-08 and the URL is the asset; creating a new document would throw six
 * months of indexing away and leave the duplicate body live.
 *
 * The body goes through `lib/articleLoader/markdownToPt`, which accepts five
 * constructs and throws on anything else — a loader that silently drops a
 * construct is worse than one that refuses to run.
 *
 * Run:
 * - npm run load:legal-articles            (dry)
 * - npm run load:legal-articles -- --execute
 */

import path from 'node:path'
import fs from 'node:fs'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {markdownToPortableText} from '../lib/articleLoader/markdownToPt'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.slice(2).includes('--execute')
const DOC = path.resolve(
  process.cwd(),
  '../domlivo-workspace/docs/engineering/CONTENT-legal-drafts-2026-08-23.md',
)
const AUTHOR_ID = 'blogAuthor-domlivo-editorial'

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

type Article = {
  slug: string
  title: string
  categories: string[]
  keyFacts: string[]
  excerpt: string
  body: string
  faq: Array<{question: string; answer: string}>
  sources: string[]
}

/** Pulls the articles out of the prepared markdown rather than duplicating the
 *  text here — one copy, and the doc stays the thing a human reviews. */
function parseDoc(md: string): Article[] {
  const out: Article[] = []
  const sections = md.split(/\n## Article \d+ — /).slice(1)
  for (const section of sections) {
    const field = (name: string): string => {
      const m = new RegExp(`^\\*\\*${name}:\\*\\* (.*)$`, 'm').exec(section)
      return m ? m[1].trim() : ''
    }
    const between = (from: string, to: string): string => {
      const m = new RegExp(`\\n### ${from}\\n([\\s\\S]*?)\\n### ${to}`).exec(section)
      return m ? m[1].trim() : ''
    }

    const slug = (/^\*\*Slug:\*\* `([^`]+)`/m.exec(section) ?? [])[1] ?? ''
    const title = field('Title')
    const categories = field('Categories').split(',').map((c) => c.trim()).filter(Boolean)

    const keyFacts = between('keyFacts', 'excerpt')
      .split('\n')
      .map((l) => l.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean)

    const excerpt = between('excerpt', 'Body')
    const body = between('Body', 'FAQ')

    const faq: Array<{question: string; answer: string}> = []
    const faqBlock = between('FAQ', 'sources')
    const pairs = faqBlock.split(/\n\n(?=\*\*)/)
    for (const pair of pairs) {
      const m = /^\*\*(.+?)\*\*\n([\s\S]+)$/.exec(pair.trim())
      if (m) faq.push({question: m[1].trim(), answer: m[2].trim()})
    }

    const sourcesBlock = (/\n### sources\n([\s\S]*?)(?:\n---|\n## |$)/.exec(section) ?? [])[1] ?? ''
    const sources = sourcesBlock
      .split('\n')
      .map((l) => l.replace(/^-\s*/, '').trim())
      .filter(Boolean)

    if (slug && title && body) out.push({slug, title, categories, keyFacts, excerpt, body, faq, sources})
  }
  return out
}

const L = (en: string) => ({_type: 'localizedString', en})
const T = (en: string) => ({_type: 'localizedText', en})

async function main(): Promise<void> {
  if (!fs.existsSync(DOC)) throw new Error(`prepared article doc not found at ${DOC}`)
  const articles = parseDoc(fs.readFileSync(DOC, 'utf8'))
  if (articles.length !== 2) throw new Error(`expected 2 articles in the doc, parsed ${articles.length}`)

  const author = await client.fetch(`*[_id==$id][0]._id`, {id: AUTHOR_ID})
  if (!author) throw new Error(`${AUTHOR_ID} not found — run seed:tz13 first`)

  const snapshot: unknown[] = []
  const plan: Array<{slug: string; action: string; id: string; blocks: number}> = []

  for (const a of articles) {
    // The WHOLE document, not a projection: this is a replace, so anything not
    // carried forward is dropped — coverImage, categories, featured,
    // relatedPosts, and publishedAt, which is what keeps the URL live.
    const existing = await client.fetch(`*[_type=="blogPost" && slug.current==$s][0]`, {s: a.slug})
    const blocks = markdownToPortableText(a.body)
    const categoryIds = await client.fetch(
      `*[_type=="blogCategory" && title.en in $names]._id`,
      {names: a.categories},
    )

    const doc: Record<string, unknown> = {
      // Existing fields first, so a rewrite keeps the cover image, the
      // categories somebody chose, and above all `publishedAt`. Without that
      // last one, publishing this draft would replace a live article with an
      // unpublished one and the URL would 404.
      ...(existing ?? {}),
      _type: 'blogPost',
      slug: {_type: 'slug', current: a.slug},
      title: L(a.title),
      excerpt: T(a.excerpt),
      content: {_type: 'localizedBlockContent', en: blocks},
      keyFacts: a.keyFacts.map((f) => L(f)),
      faq: a.faq.map((f, i) => ({
        _type: 'localizedFaqItem',
        _key: `faq-${a.slug}-${i}`,
        question: L(f.question),
        answer: T(f.answer),
      })),
      sources: a.sources.map((s, i) => ({
        _type: 'sourceItem',
        _key: `src-${a.slug}-${i}`,
        label: L(s),
      })),
      author: {_type: 'reference', _ref: AUTHOR_ID},
      ...(categoryIds.length
        ? {categories: categoryIds.map((id: string, i: number) => ({_type: 'reference', _ref: id, _key: `cat-${i}`}))}
        : {}),
    }
    delete doc._rev
    delete doc._createdAt
    delete doc._updatedAt

    if (existing) {
      snapshot.push(existing)
      plan.push({
        slug: a.slug,
        action: existing.publishedAt ? 'UPDATE live article (draft)' : 'UPDATE (draft)',
        id: `drafts.${String(existing._id).replace(/^drafts\./, '')}`,
        blocks: blocks.length,
      })
    } else {
      plan.push({slug: a.slug, action: 'CREATE (draft)', id: `drafts.blogPost-${a.slug}`, blocks: blocks.length})
    }
    ;(a as Article & {doc?: unknown; id?: string}).doc = doc
    ;(a as Article & {id?: string}).id = plan[plan.length - 1].id
  }

  for (const p of plan) console.log(`  ${p.action}  ${p.slug}  → ${p.id}  (${p.blocks} blocks)`)
  for (const a of articles) {
    console.log(`\n  ${a.slug}: ${a.keyFacts.length} keyFacts, ${a.faq.length} faq, ${a.sources.length} sources`)
  }

  if (!execute) {
    console.log('\nDry run. Re-run with --execute to write.')
    return
  }

  if (snapshot.length) {
    const dir = path.resolve(process.cwd(), 'scripts/data')
    fs.mkdirSync(dir, {recursive: true})
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const file = path.join(dir, `legalArticles-backup-${stamp}.json`)
    fs.writeFileSync(file, JSON.stringify(snapshot, null, 2), 'utf8')
    console.log(`snapshot written to ${file}`)
  }

  for (const a of articles as Array<Article & {doc: Record<string, unknown>; id: string}>) {
    await client.createOrReplace({...a.doc, _id: a.id} as {_id: string; _type: string})
    console.log(`wrote ${a.id}`)
  }
  console.log('\nBoth are drafts. Open each in Studio, press 🌐 Translate with base EN, review, publish.')
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
