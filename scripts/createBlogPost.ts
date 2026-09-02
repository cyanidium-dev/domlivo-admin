/**
 * Creates a brand-new blog post from a plan file — the flow `loadBlogPost.ts`
 * refers to when it refuses an unknown slug ("use a different flow to create a
 * brand-new post"). That flow did not exist, so every new article had to be
 * hand-assembled in Studio, which is exactly what CONTENT-OPS.md forbids.
 *
 * Same plan format as `loadBlogPost.ts`, plus two sections that only matter
 * when the document does not exist yet and therefore has nothing to carry
 * forward:
 *
 *   ## categories      one blogCategory slug per line
 *   ## publishedAt     a single ISO date, or the word `unset`
 *
 * Deliberate constraints, mirroring the rewrite loader:
 * - writes the DRAFT only (`drafts.blog-<slug>`), never the published
 *   document, so nothing reaches the live site without a human pressing
 *   Publish in Studio;
 * - refuses when a published document with that slug already exists — that is
 *   a rewrite, and `npm run load:blog-post` is the tool for it;
 * - idempotent: the draft id is derived from the slug, so re-running with
 *   --execute updates that draft instead of creating a second one;
 * - dry run by default;
 * - `coverImage` is left unset on purpose. CONTENT-OPS.md forbids stock
 *   photography, so the owner attaches a real image in Studio, and the
 *   dry-run output lists the post under "needs photo" as the delivery report
 *   requires.
 *
 * Run:
 *   npm run create:blog-post -- docs/superpowers/plans/<file>.md
 *   npm run create:blog-post -- docs/superpowers/plans/<file>.md --execute
 */

import path from 'node:path'
import fs from 'node:fs'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {markdownToPortableText, plainTextFromInline} from '../lib/articleLoader/markdownToPt'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const args = process.argv.slice(2)
const execute = args.includes('--execute')
const planArg = args.find((a) => !a.startsWith('--'))
if (!planArg) {
  throw new Error('usage: npm run create:blog-post -- <path-to-plan.md> [--execute]')
}
const PLAN_PATH = path.resolve(process.cwd(), planArg)
const AUTHOR_ID = 'blogAuthor-domlivo-editorial'

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

type Faq = {question: string; answer: string}
type Plan = {
  slug: string
  title: string
  keyFacts: string[]
  excerpt: string
  body: string
  faq: Faq[]
  sources: string[]
  categories: string[]
  publishedAt: string | null
}

/** Extracts one `## <name>` section's body, stopping at the next `## ` header. */
function section(doc: string, name: string): string {
  const re = new RegExp(`\\n## ${name}\\n([\\s\\S]*?)(?=\\n## |$)`)
  const m = re.exec(doc)
  if (!m) throw new Error(`plan is missing a "## ${name}" section`)
  return m[1].trim()
}

function optionalSection(doc: string, name: string): string | null {
  const re = new RegExp(`\\n## ${name}\\n([\\s\\S]*?)(?=\\n## |$)`)
  const m = re.exec(doc)
  return m ? m[1].trim() : null
}

function parsePlan(md: string): Plan {
  const slugMatch = /^# Blog Post Plan — `([^`]+)`/m.exec(md)
  if (!slugMatch) throw new Error('plan is missing the "# Blog Post Plan — `<slug>`" heading')
  const slug = slugMatch[1]

  // title/excerpt/keyFacts/faq are plain localizedString/localizedText fields:
  // no marks. plainTextFromInline strips emphasis that reads as ordinary prose
  // in the plan but would ship as literal asterisks.
  const title = plainTextFromInline(section(md, 'Title').replace(/^\*\*(.+)\*\*$/, '$1').trim())

  const keyFacts = section(md, 'keyFacts')
    .split('\n')
    .map((l) => plainTextFromInline(l.replace(/^\d+\.\s*/, '').trim()))
    .filter(Boolean)

  const excerpt = plainTextFromInline(section(md, 'excerpt').replace(/\s*\n+\s*/g, ' ').trim())
  const body = section(md, 'Body')

  const faq: Faq[] = []
  for (const pair of section(md, 'faq').split(/\n\n(?=\*\*)/)) {
    const m = /^\*\*(.+?)\*\*\n([\s\S]+)$/.exec(pair.trim())
    if (m) {
      faq.push({
        question: plainTextFromInline(m[1].trim()),
        answer: plainTextFromInline(m[2].trim().replace(/\s*\n+\s*/g, ' ')),
      })
    }
  }

  const sources = section(md, 'sources')
    .split('\n')
    .map((l) => plainTextFromInline(l.replace(/^-\s*/, '').trim()))
    .filter(Boolean)

  const categories = (optionalSection(md, 'categories') || '')
    .split('\n')
    .map((l) => l.replace(/^-\s*/, '').trim())
    .filter(Boolean)

  const publishedRaw = (optionalSection(md, 'publishedAt') || '').trim()
  const publishedAt = !publishedRaw || publishedRaw === 'unset' ? null : publishedRaw

  if (!title || !body || keyFacts.length === 0) {
    throw new Error(`plan for ${slug} is missing title, body, or keyFacts`)
  }
  if (categories.length === 0) {
    throw new Error(`plan for ${slug} is missing a "## categories" section (one slug per line)`)
  }
  if (publishedAt && Number.isNaN(Date.parse(publishedAt))) {
    throw new Error(`plan for ${slug} has an unparseable publishedAt: "${publishedAt}"`)
  }
  return {slug, title, keyFacts, excerpt, body, faq, sources, categories, publishedAt}
}

const L = (en: string) => ({_type: 'localizedString', en})
const T = (en: string) => ({_type: 'localizedText', en})

/** Resolves `{{zoneStatsEmbed:<slug>}}` markers, refusing zones that would render an empty card. */
async function resolveZoneSlugs(body: string): Promise<Map<string, string>> {
  const wanted = Array.from(
    new Set(Array.from(body.matchAll(/\{\{zoneStatsEmbed:([a-z0-9-]+)\}\}/g), (m) => m[1])),
  )
  const map = new Map<string, string>()
  if (wanted.length === 0) return map

  const rows: Array<{
    slug: string
    _id: string
    isPublished?: boolean
    hasMetrics: boolean
    title?: string
  }> = await client.fetch(
    `*[_type in ["city","district"] && slug.current in $slugs]{
      "slug": slug.current, _id, isPublished,
      "hasMetrics": count(*[_type=="zoneMetrics" && references(^._id)]) > 0,
      "title": title.en
    }`,
    {slugs: wanted},
  )

  for (const zoneSlug of wanted) {
    const row = rows.find((r) => r.slug === zoneSlug)
    if (!row) throw new Error(`{{zoneStatsEmbed:${zoneSlug}}} — no city or district with that slug`)
    if (row.isPublished === false) {
      throw new Error(`{{zoneStatsEmbed:${zoneSlug}}} — "${row.title}" is unpublished`)
    }
    if (!row.hasMetrics) {
      throw new Error(`{{zoneStatsEmbed:${zoneSlug}}} — "${row.title}" has no zoneMetrics`)
    }
    map.set(zoneSlug, row._id)
  }
  return map
}

async function main(): Promise<void> {
  if (!fs.existsSync(PLAN_PATH)) throw new Error(`plan file not found at ${PLAN_PATH}`)
  const plan = parsePlan(fs.readFileSync(PLAN_PATH, 'utf8'))

  const author = await client.fetch(`*[_id==$id][0]._id`, {id: AUTHOR_ID})
  if (!author) throw new Error(`${AUTHOR_ID} not found — run seed:tz13 first`)

  // Read the real document ids rather than deriving them from the slug: the
  // two do not match (slug `investment-guides` lives on `blogCategory-investment`),
  // and a guessed _ref would write a reference to a document that isn't there.
  const categoryRows: Array<{slug: string; _id: string}> = await client.fetch(
    `*[_type=="blogCategory" && slug.current in $slugs]{"slug": slug.current, _id}`,
    {slugs: plan.categories},
  )
  const categoryIdBySlug = new Map(categoryRows.map((r) => [r.slug, r._id]))
  const unknown = plan.categories.filter((c) => !categoryIdBySlug.has(c))
  if (unknown.length) {
    throw new Error(`unknown blogCategory slug(s): ${unknown.join(', ')}`)
  }

  // A published document with this slug means the article already exists and
  // this is a rewrite, which has its own loader and its own merge rules.
  const published = await client.fetch(
    `*[_type=="blogPost" && slug.current==$s && !(_id in path("drafts.**"))][0]{_id}`,
    {s: plan.slug},
  )
  if (published) {
    throw new Error(
      `a published blogPost with slug "${plan.slug}" already exists (${published._id}) — ` +
        `use "npm run load:blog-post" to rewrite it in place`,
    )
  }

  const zoneIdBySlug = await resolveZoneSlugs(plan.body)
  const blocks = markdownToPortableText(plan.body, {
    resolveZoneEmbed: (slug) => {
      const id = zoneIdBySlug.get(slug)
      if (!id) throw new Error(`{{zoneStatsEmbed:${slug}}} — missing from the pre-fetched map`)
      return id
    },
  })

  const baseId = `blog-${plan.slug}`
  const draftId = `drafts.${baseId}`
  const existingDraft = await client.fetch(`*[_id==$id][0]{_id}`, {id: draftId})

  const doc: Record<string, unknown> = {
    _id: draftId,
    _type: 'blogPost',
    slug: {_type: 'slug', current: plan.slug},
    title: L(plan.title),
    excerpt: T(plan.excerpt),
    content: {_type: 'localizedBlockContent', en: blocks},
    keyFacts: plan.keyFacts.map((f, i) => ({...L(f), _key: `kf-${plan.slug}-${i}`})),
    faq: plan.faq.map((f, i) => ({
      _type: 'localizedFaqItem',
      _key: `faq-${plan.slug}-${i}`,
      question: L(f.question),
      answer: T(f.answer),
    })),
    sources: plan.sources.map((s, i) => ({
      _type: 'sourceItem',
      _key: `src-${plan.slug}-${i}`,
      label: s,
    })),
    categories: plan.categories.map((c) => ({
      _type: 'reference',
      _key: `cat-${plan.slug}-${c}`,
      _ref: categoryIdBySlug.get(c)!,
    })),
    author: {_type: 'reference', _ref: AUTHOR_ID},
    ...(plan.publishedAt ? {publishedAt: plan.publishedAt} : {}),
  }

  const action = existingDraft ? 'UPDATE new-post draft' : 'CREATE new-post draft'
  const zoneNote = zoneIdBySlug.size
    ? ` — zoneStatsEmbed: ${Array.from(zoneIdBySlug.keys()).join(', ')}`
    : ''
  console.log(`  ${action}  ${plan.slug} → ${draftId}  (${blocks.length} blocks)${zoneNote}`)
  console.log(`  title: ${plan.title}`)
  console.log(
    `  ${plan.keyFacts.length} keyFacts, ${plan.faq.length} faq, ${plan.sources.length} sources, ` +
      `categories: ${plan.categories.join(', ')}`,
  )
  console.log(`  publishedAt: ${plan.publishedAt ?? 'unset (stays out of the listing until set)'}`)
  console.log(`  needs photo: /blog/${plan.slug} — coverImage is left unset by design`)

  if (!execute) {
    console.log('\nDry run. Re-run with --execute to write the draft.')
    return
  }

  await client.createOrReplace(doc as {_id: string; _type: string})
  console.log(`wrote ${draftId}`)
  console.log('\nDraft only. Open it in Studio, add a real cover image, press 🌐 Translate with base EN, review, publish.')
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
