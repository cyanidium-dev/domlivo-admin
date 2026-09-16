/**
 * Creates the Durrës research articles of 2026-09-16 as published blog
 * posts, in all six locales, from `scripts/data/articles-2026-09-16/`.
 *
 * Why these four: the knowledge base (02-cities/durres.md §5–8, 06-developers
 * §5, 08-infrastructure §2–3) documents what no portal ranking for Durrës
 * writes about — Durrës Marina's subsidence, Golem's sewage, the old stock after
 * the 2019 earthquake, and what the Tirana–Durrës train is really worth. The
 * existing posts mention each in a sentence at most.
 *
 * Differences from loadBlogPost.ts, and why:
 * - Creates new documents. loadBlogPost only rewrites existing posts in place.
 * - All six locales come from files, one per locale. Studio's translate step is
 *   not configured in this environment, so an English-only draft would stay
 *   English-only.
 * - Publishes directly with createIfNotExists: an existing post is never
 *   touched, so a re-run after Studio edits is harmless.
 *
 * File format (`<slug>.<locale>.md`): `## title`, `## metaTitle`,
 * `## metaDescription`, `## excerpt`, `## keyFacts` (numbered), `## body`,
 * `## faq` (`**Question?**` then answer), and in English only `## sources`
 * (`label | url`). Only those names are markers, so the body keeps its own
 * `## ` headings, which become the h2 blocks the article renderer expects.
 *
 * Checked before any write: every locale present, same number of key facts,
 * FAQ items and body links in every locale, the same link targets, questions
 * ending in "?", and that every internal link target answers 200 on the site.
 *
 * Run:
 *   npx tsx scripts/createDurresArticles.ts
 *   npx tsx scripts/createDurresArticles.ts --execute
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {markdownToPortableText, plainTextFromInline} from '../lib/articleLoader/markdownToPt'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.includes('--execute')
const DIR = path.resolve(process.cwd(), 'scripts/data/articles-2026-09-16')
const AUTHOR_ID = 'blogAuthor-domlivo-editorial'
const SITE = 'https://www.domlivo.com'
const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl'] as const
type Locale = (typeof LOCALES)[number]

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

/** Cover photos already on the site, with the alt text they carry there. */
const ARTICLES: Array<{slug: string; categories: string[]; cover: {ref: string; alt: string}}> = [
  {
    slug: 'durres-marina-eagle-hills-2026',
    categories: ['blogCategory-investment', 'blogCategory-market'],
    cover: {ref: 'image-1cf6d066c64bf3dd3872028133d517db16323bed-3840x2560-jpg', alt: 'The beach and seafront at Durrës, Albania'},
  },
  {
    slug: 'golem-sewage-buying-2026',
    categories: ['blogCategory-district-guides', 'blogCategory-investment'],
    cover: {ref: 'image-b0fb6c8fc536fab6fb577f85d1cddffebfd75b6c-1920x1440-jpg', alt: 'Golem beach looking north toward Durrës'},
  },
  {
    slug: 'durres-old-apartment-earthquake-check',
    categories: ['blogCategory-buying', 'blogCategory-guides'],
    cover: {ref: 'image-4286970d8f57e0bd3038a6c34422749dae29975a-1920x1440-jpg', alt: 'The beach promenade at Durrës, Albania'},
  },
  {
    slug: 'durres-reference-prices-2026',
    categories: ['blogCategory-legal', 'blogCategory-buying'],
    cover: {ref: 'image-913e2db279d7a045eddbd3d1b96bd893d1418c3e-1280x1707-jpg', alt: 'Bank of Albania building, central Durrës'},
  },
  {
    slug: 'tirana-durres-train-property-prices',
    categories: ['blogCategory-market', 'blogCategory-investment'],
    cover: {ref: 'image-8366e91e3d24c492fef999cbfaaad5b2e266c02b-1920x1440-jpg', alt: 'The Roman amphitheatre in Durrës, Albania'},
  },
]

const MARKERS = ['title', 'metaTitle', 'metaDescription', 'excerpt', 'keyFacts', 'body', 'faq', 'sources'] as const
type Parsed = {
  title: string
  metaTitle: string
  metaDescription: string
  excerpt: string
  keyFacts: string[]
  body: string
  faq: Array<{q: string; a: string}>
  sources: Array<{label: string; url: string}>
}

function parse(file: string): Parsed {
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
  const parts: Record<string, string> = {}
  let current: string | null = null
  for (const line of text.split('\n')) {
    const m = /^## (\w+)\s*$/.exec(line)
    if (m && (MARKERS as readonly string[]).includes(m[1])) {
      current = m[1]
      parts[current] = ''
      continue
    }
    if (current) parts[current] += `${line}\n`
  }
  const need = (k: string) => {
    const v = parts[k]?.trim()
    if (!v) throw new Error(`${path.basename(file)}: missing "## ${k}"`)
    return v
  }
  const faq = need('faq')
    .split(/\n\s*\n/)
    .map((pair) => /^\*\*(.+?)\*\*\s*\n([\s\S]+)$/.exec(pair.trim()))
    .filter((m): m is RegExpExecArray => Boolean(m))
    .map((m) => ({q: plainTextFromInline(m[1].trim()), a: plainTextFromInline(m[2].trim().replace(/\s*\n+\s*/g, ' '))}))
  return {
    title: plainTextFromInline(need('title')),
    metaTitle: plainTextFromInline(need('metaTitle')),
    metaDescription: plainTextFromInline(need('metaDescription')),
    excerpt: plainTextFromInline(need('excerpt').replace(/\s*\n+\s*/g, ' ')),
    keyFacts: need('keyFacts')
      .split('\n')
      .map((l) => plainTextFromInline(l.replace(/^\d+\.\s*/, '').trim()))
      .filter(Boolean),
    body: need('body'),
    faq,
    sources: (parts.sources ?? '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [label, url] = l.split(' | ')
        return {label: label.trim(), url: url?.trim() ?? ''}
      }),
  }
}

const links = (body: string) => [...body.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1])

async function main(): Promise<void> {
  const problems: string[] = []
  const built: Array<{id: string; doc: Record<string, unknown>}> = []
  const internal = new Set<string>()

  for (const a of ARTICLES) {
    const byLocale = {} as Record<Locale, Parsed>
    for (const l of LOCALES) {
      const file = path.join(DIR, `${a.slug}.${l}.md`)
      if (!fs.existsSync(file)) {
        problems.push(`${a.slug}: no ${l} file`)
        continue
      }
      try {
        byLocale[l] = parse(file)
      } catch (e) {
        problems.push((e as Error).message)
      }
    }
    if (LOCALES.some((l) => !byLocale[l])) continue
    const en = byLocale.en
    if (en.sources.length === 0 || en.sources.some((s) => !s.url.startsWith('https://'))) {
      problems.push(`${a.slug}: English sources missing or without URL`)
    }
    const enLinks = links(en.body).sort().join(' ')
    for (const href of links(en.body)) if (href.startsWith('/')) internal.add(href)
    for (const l of LOCALES) {
      const p = byLocale[l]
      if (p.keyFacts.length !== en.keyFacts.length) problems.push(`${a.slug}.${l}: ${p.keyFacts.length} key facts, en has ${en.keyFacts.length}`)
      if (p.faq.length !== en.faq.length) problems.push(`${a.slug}.${l}: ${p.faq.length} FAQ items, en has ${en.faq.length}`)
      if (links(p.body).sort().join(' ') !== enLinks) problems.push(`${a.slug}.${l}: body links differ from en`)
      for (const f of p.faq) if (!f.q.endsWith('?')) problems.push(`${a.slug}.${l}: question without "?": ${f.q}`)
      if (p.metaTitle.length > 70) problems.push(`${a.slug}.${l}: metaTitle is ${p.metaTitle.length} chars`)
    }

    const loc = (type: 'localizedString' | 'localizedText', pick: (p: Parsed) => string) => ({
      _type: type,
      ...Object.fromEntries(LOCALES.map((l) => [l, pick(byLocale[l])])),
    })
    const content: Record<string, unknown> = {_type: 'localizedBlockContent'}
    for (const l of LOCALES) {
      // The article renderer reads h2 blocks, which the converter makes from ####.
      content[l] = markdownToPortableText(byLocale[l].body.replace(/^## /gm, '#### '))
    }
    const id = `blogPost-${a.slug}`
    built.push({
      id,
      doc: {
        _id: id,
        _type: 'blogPost',
        slug: {_type: 'slug', current: a.slug},
        publishedAt: new Date().toISOString(),
        title: loc('localizedString', (p) => p.title),
        excerpt: loc('localizedText', (p) => p.excerpt),
        keyFacts: en.keyFacts.map((_, i) => ({
          _key: `kf-${a.slug}-${i}`,
          ...loc('localizedString', (p) => p.keyFacts[i]),
        })),
        content,
        coverImage: {_type: 'image', asset: {_type: 'reference', _ref: a.cover.ref}, alt: a.cover.alt},
        categories: a.categories.map((ref) => ({_type: 'reference', _key: `cat-${a.slug}-${ref}`, _ref: ref})),
        author: {_type: 'reference', _ref: AUTHOR_ID},
        faq: en.faq.map((_, i) => ({
          _type: 'localizedFaqItem',
          _key: `faq-${a.slug}-${i}`,
          question: loc('localizedString', (p) => p.faq[i].q),
          answer: loc('localizedText', (p) => p.faq[i].a),
        })),
        sources: en.sources.map((s, i) => ({_type: 'sourceItem', _key: `src-${a.slug}-${i}`, label: s.label, url: s.url})),
        seo: {
          _type: 'localizedSeo',
          metaTitle: loc('localizedString', (p) => p.metaTitle),
          metaDescription: loc('localizedText', (p) => p.metaDescription),
          ogTitle: loc('localizedString', (p) => p.metaTitle),
          ogDescription: loc('localizedText', (p) => p.metaDescription),
          noIndex: false,
        },
      },
    })
    const words = (l: Locale) => byLocale[l].body.split(/\s+/).length
    console.log(`${a.slug}: ${LOCALES.map((l) => `${l} ${words(l)}w`).join(', ')}; ${en.keyFacts.length} facts, ${en.faq.length} FAQ, ${en.sources.length} sources`)
  }

  for (const href of internal) {
    const res = await fetch(`${SITE}/en${href}`, {redirect: 'manual', signal: AbortSignal.timeout(60_000)})
    if (res.status !== 200) problems.push(`internal link ${href} answers ${res.status}`)
  }
  const refs = [...new Set(ARTICLES.flatMap((a) => [a.cover.ref, ...a.categories])), AUTHOR_ID]
  const found = await client.fetch<string[]>(`*[_id in $ids]._id`, {ids: refs})
  for (const r of refs) if (!found.includes(r)) problems.push(`referenced document ${r} does not exist`)

  if (problems.length) {
    console.error(`\n${problems.length} problem(s):\n${problems.join('\n')}`)
    process.exit(1)
  }

  const existing = await client.fetch<string[]>(`*[_id in $ids]._id`, {
    ids: built.flatMap((b) => [b.id, `drafts.${b.id}`]),
  })
  const toWrite = built.filter((b) => !existing.includes(b.id) && !existing.includes(`drafts.${b.id}`))
  for (const b of built) console.log(`${toWrite.includes(b) ? 'create' : 'skip  '} ${b.id}`)
  if (!execute) {
    console.log(`\nDry run: ${toWrite.length} to create. Re-run with --execute.`)
    return
  }
  if (!toWrite.length) return
  const tx = toWrite.reduce((t, b) => t.createIfNotExists(b.doc as {_id: string; _type: string}), client.transaction())
  const res = await tx.commit()
  console.log(`Created ${toWrite.length} posts in transaction ${res.transactionId}.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
