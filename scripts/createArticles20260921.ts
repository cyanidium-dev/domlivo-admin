/**
 * Creates the buyer-persona articles of 2026-09-21 as published blog posts, in
 * all seven locales, from `scripts/data/articles-2026-09-21/`.
 *
 * A generalisation of createPriceIndexArticle.ts: the same file format and the
 * same pre-write checks, for articles whose figures come from the research
 * knowledge base rather than from one index JSON.
 *
 * - Same file format (`<slug>.<locale>.md`): `## title`, `## metaTitle`,
 *   `## metaDescription`, `## excerpt`, `## keyFacts` (numbered), `## body`,
 *   `## faq` (`**Question?**` then answer), and in English only `## sources`
 *   (`label | url`). Only those names are markers, so the body keeps its own
 *   `## ` headings, which become h2 blocks. No links inside table cells.
 * - The English file is the reviewed one: every figure in it was checked
 *   against the knowledge base by hand. The script then holds the other six to
 *   it: every number in a locale file must also appear in the English file, so
 *   a translation cannot introduce a figure nobody checked.
 * - Same counts of key facts, FAQ items, table rows and the same body links in
 *   every locale; metaTitle <= 60 and metaDescription 140–160 characters;
 *   internal links must answer 200 in every locale (one request a second,
 *   never an /api/ path).
 *
 * Publishes with createIfNotExists: an existing post is never touched.
 *
 * Run:
 *   npx tsx scripts/createArticles20260921.ts
 *   npx tsx scripts/createArticles20260921.ts --skip-links   (text checks only)
 *   npx tsx scripts/createArticles20260921.ts --execute
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {markdownToPortableText, plainTextFromInline} from '../lib/articleLoader/markdownToPt'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.includes('--execute')
const AUTHOR_ID = 'blogAuthor-domlivo-editorial'
const SITE = 'https://www.domlivo.com'
const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl', 'de'] as const
type Locale = (typeof LOCALES)[number]

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

type Article = {
  slug: string
  categories: string[]
  /** A cover already on the site, with the alt text it carries there. */
  cover: {ref: string; alt: string}
}

const DIR = 'scripts/data/articles-2026-09-21'

const ARTICLES: Article[] = [
  {
    slug: 'retiring-to-albania-property-costs',
    categories: ['blogCategory-lifestyle', 'blogCategory-buying'],
    cover: {ref: 'image-4286970d8f57e0bd3038a6c34422749dae29975a-1920x1440-jpg', alt: 'The beach promenade at Durrës, Albania'},
  },
  {
    slug: 'albania-rental-yield-for-investors',
    categories: ['blogCategory-investment', 'blogCategory-renting'],
    cover: {ref: 'image-b0fb6c8fc536fab6fb577f85d1cddffebfd75b6c-1920x1440-jpg', alt: 'Golem beach looking north toward Durrës'},
  },
  {
    slug: 'moving-to-albania-with-family',
    categories: ['blogCategory-lifestyle', 'blogCategory-guides'],
    cover: {ref: 'image-e0710445958bc5a06d6605c0bd7002fba420a7eb-1920x1469-jpg', alt: 'Vlorë seen from a balcony above the bay, Albania'},
  },
]

/**
 * Anything up to SMALL_FREE passes unchecked: days, months, room counts and the
 * small integers of ordinary prose. Everything larger in a locale file must be
 * a number of the English file.
 */
const SMALL_FREE = 12

const MARKERS = ['title', 'metaTitle', 'metaDescription', 'excerpt', 'keyFacts', 'body', 'faq', 'sources'] as const
type Parsed = {
  raw: string
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
    raw: text,
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

/** Numbers as written in any of the locales: 100,000 · 100.000 · 100 000 · 1413. */
function numbersIn(text: string): number[] {
  const withoutUrls = text.replace(/https?:\/\/\S+/g, ' ').replace(/\]\([^)]+\)/g, ']')
  return [...withoutUrls.matchAll(/\d{1,3}(?:[.,   ]\d{3})+(?!\d)|\d+/g)].map((m) => Number(m[0].replace(/\D/g, '')))
}

async function main(): Promise<void> {
  const problems: string[] = []
  const built: Array<{id: string; doc: Record<string, unknown>}> = []
  const internal = new Set<string>()

  for (const a of ARTICLES) {
    const dir = path.resolve(process.cwd(), DIR)
    const byLocale = {} as Record<Locale, Parsed>
    for (const l of LOCALES) {
      const file = path.join(dir, `${a.slug}.${l}.md`)
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
    const allowed = new Set(numbersIn(en.raw))
    const enLinks = links(en.body).sort().join(' ')
    const enTables = (en.body.match(/^\|/gm) ?? []).length
    for (const href of links(en.body)) {
      if (href.startsWith('/api/')) problems.push(`${a.slug}: an /api/ path is not a link target: ${href}`)
      else if (href.startsWith('/')) internal.add(href)
    }
    for (const l of LOCALES) {
      const p = byLocale[l]
      if (p.keyFacts.length !== en.keyFacts.length) problems.push(`${a.slug}.${l}: ${p.keyFacts.length} key facts, en has ${en.keyFacts.length}`)
      if (p.faq.length !== en.faq.length) problems.push(`${a.slug}.${l}: ${p.faq.length} FAQ items, en has ${en.faq.length}`)
      if (links(p.body).sort().join(' ') !== enLinks) problems.push(`${a.slug}.${l}: body links differ from en`)
      if ((p.body.match(/^\|/gm) ?? []).length !== enTables) problems.push(`${a.slug}.${l}: table rows differ from en`)
      if (p.body.split('\n').some((line) => line.trimStart().startsWith('|') && /\]\(/.test(line))) {
        problems.push(`${a.slug}.${l}: a link inside a table cell would be dropped`)
      }
      for (const f of p.faq) if (!f.q.endsWith('?')) problems.push(`${a.slug}.${l}: question without "?": ${f.q}`)
      if (p.metaTitle.length > 60) problems.push(`${a.slug}.${l}: metaTitle is ${p.metaTitle.length} chars`)
      if (p.metaDescription.length < 140 || p.metaDescription.length > 160) {
        problems.push(`${a.slug}.${l}: metaDescription is ${p.metaDescription.length} chars, wants 140–160`)
      }
      const stray = [...new Set(numbersIn(p.raw).filter((n) => n > SMALL_FREE && !allowed.has(n)))]
      if (stray.length) problems.push(`${a.slug}.${l}: numbers that the English file does not have: ${stray.join(', ')}`)
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
    for (const l of LOCALES) {
      const p = byLocale[l]
      const faqWords = p.faq.map((f) => f.a.split(/\s+/).length).join('/')
      console.log(`  ${l}: metaTitle ${p.metaTitle.length}, metaDescription ${p.metaDescription.length}, FAQ answer words ${faqWords}`)
    }
  }

  // --skip-links is for iterating on the text; a run that writes always checks them.
  if ((problems.length === 0 && (execute || !process.argv.includes('--skip-links'))) || process.argv.includes('--check-links')) {
    // Gently: one request a second, and every locale's copy of each target.
    for (const href of internal) {
      for (const l of LOCALES) {
        const res = await fetch(`${SITE}/${l}${href}`, {redirect: 'manual', signal: AbortSignal.timeout(60_000)})
        if (res.status !== 200) problems.push(`internal link /${l}${href} answers ${res.status}`)
        await new Promise((r) => setTimeout(r, 1000))
      }
    }
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
