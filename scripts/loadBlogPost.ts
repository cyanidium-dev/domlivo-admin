/**
 * Generalized blog-post loader: takes ONE plan file per run, so a bad run
 * only ever touches one document. Generalizes `loadLegalArticles.ts` (which
 * was hard-coded to two articles from one combined doc) to any plan file
 * shaped like `docs/superpowers/plans/<date>-blogpost-<slug>.md` — the
 * per-post deliverable defined in
 * `docs/engineering/SPEC-blog-content-batch-2026-08-24.md` §7.
 *
 * Rewrite mechanics (spec §6, identical to loadLegalArticles.ts):
 * - fetch the WHOLE existing document and merge the new fields over it —
 *   never a blind replace, which is what dropped coverImage/publishedAt the
 *   first time this pattern was built;
 * - `publishedAt`, `coverImage`, `categories` etc. are carried forward
 *   untouched — this script only ever sets the fields the plan actually
 *   specifies (title, excerpt, content, keyFacts, faq, sources, author);
 * - title/excerpt/content are merged one level deeper too: only their `en`
 *   sub-field is overwritten, so an existing article's real uk/ru/sq/it
 *   translations survive the rewrite instead of being wiped down to
 *   English-only (the same "blind replace" mistake the whole-document merge
 *   exists to prevent, just one level down — caught auditing these six
 *   drafts for publish-readiness, before anything reached Studio's publish
 *   button);
 * - every array item gets a `_key` — the bug that left keyFacts untranslated
 *   on the first legal-article run;
 * - writes to the DRAFT only, never the published document;
 * - snapshots the pre-write state before every --execute.
 *
 * The body markdown may contain `{{zoneStatsEmbed:<slug>}}` marker lines
 * (own line, blank lines around it) — resolved here against live `city`/
 * `district` documents, refusing to write a reference to an unpublished
 * zone or one with no zoneMetrics, since that renders an empty card (the
 * Currila mistake caught in this batch's self-review).
 *
 * Run:
 *   npm run load:blog-post -- docs/superpowers/plans/2026-08-24-blogpost-<slug>.md
 *   npm run load:blog-post -- docs/superpowers/plans/2026-08-24-blogpost-<slug>.md --execute
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
  throw new Error(
    'usage: npm run load:blog-post -- <path-to-plan.md> [--execute]',
  )
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
}

/** Extracts one `## <name>` section's body from the plan doc, stopping at the next `## ` header. */
function section(doc: string, name: string): string {
  const re = new RegExp(`\\n## ${name}\\n([\\s\\S]*?)(?=\\n## |$)`)
  const m = re.exec(doc)
  if (!m) throw new Error(`plan is missing a "## ${name}" section`)
  return m[1].trim()
}

function parsePlan(md: string): Plan {
  const slugMatch = /^# Blog Post Plan — `([^`]+)`/m.exec(md)
  if (!slugMatch) throw new Error('plan is missing the "# Blog Post Plan — `<slug>`" heading')
  const slug = slugMatch[1]

  // title/excerpt/keyFacts/faq are plain localizedString/localizedText
  // fields in the schema — no marks, no links, same as a blogTable cell.
  // Run every one through plainTextFromInline so a plan file that slips
  // *emphasis* into one of these (easy to do — it reads as ordinary prose
  // in the source markdown) ships as plain text instead of with literal,
  // unrendered asterisks. Found exactly that bug live in two already-
  // published drafts before this existed.
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

  if (!title || !body || keyFacts.length === 0) {
    throw new Error(`plan for ${slug} is missing title, body, or keyFacts`)
  }
  return {slug, title, keyFacts, excerpt, body, faq, sources}
}

const L = (en: string) => ({_type: 'localizedString', en})
const T = (en: string) => ({_type: 'localizedText', en})

async function resolveZoneSlugs(body: string): Promise<Map<string, string>> {
  const wanted = Array.from(new Set(Array.from(body.matchAll(/\{\{zoneStatsEmbed:([a-z0-9-]+)\}\}/g), (m) => m[1])))
  const map = new Map<string, string>()
  if (wanted.length === 0) return map

  const rows: Array<{slug: string; _id: string; isPublished?: boolean; hasMetrics: boolean; title?: string}> =
    await client.fetch(
      `*[_type in ["city","district"] && slug.current in $slugs]{
        "slug": slug.current, _id, isPublished,
        "hasMetrics": count(*[_type=="zoneMetrics" && references(^._id)]) > 0,
        "title": title.en
      }`,
      {slugs: wanted},
    )

  for (const zoneSlug of wanted) {
    const row = rows.find((r) => r.slug === zoneSlug)
    if (!row) throw new Error(`{{zoneStatsEmbed:${zoneSlug}}} — no city or district with slug "${zoneSlug}" found`)
    if (row.isPublished === false) {
      throw new Error(`{{zoneStatsEmbed:${zoneSlug}}} — "${row.title}" is unpublished; the card would render empty`)
    }
    if (!row.hasMetrics) {
      throw new Error(`{{zoneStatsEmbed:${zoneSlug}}} — "${row.title}" has no zoneMetrics; the card would render empty`)
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

  const zoneIdBySlug = await resolveZoneSlugs(plan.body)
  const blocks = markdownToPortableText(plan.body, {
    resolveZoneEmbed: (slug) => {
      const id = zoneIdBySlug.get(slug)
      if (!id) throw new Error(`{{zoneStatsEmbed:${slug}}} — resolved slug missing from the pre-fetched map`)
      return id
    },
  })

  // The WHOLE existing document, not a projection: anything not carried
  // forward is dropped by createOrReplace. This keeps coverImage,
  // categories, featured, relatedPosts, and above all publishedAt, which is
  // what keeps the live URL up while this draft is reviewed.
  const existing = await client.fetch(`*[_type=="blogPost" && slug.current==$s][0]`, {s: plan.slug})
  if (!existing) {
    throw new Error(
      `no existing blogPost with slug "${plan.slug}" — this loader only rewrites in place; ` +
        `use a different flow to create a brand-new post`,
    )
  }

  // title/excerpt/content are single localized objects with real uk/ru/sq/it
  // translations already sitting on the existing document. Only `en` is new
  // here, so only `en` gets overwritten — spreading the existing object
  // first keeps every other locale's translation intact rather than wiping
  // it down to an English-only field. A rewrite means "the source text
  // changed, re-translate it," not "delete the translations."
  const doc: Record<string, unknown> = {
    ...existing,
    _type: 'blogPost',
    slug: {_type: 'slug', current: plan.slug},
    title: {...(existing.title as object), ...L(plan.title)},
    excerpt: {...(existing.excerpt as object), ...T(plan.excerpt)},
    content: {...(existing.content as object), _type: 'localizedBlockContent', en: blocks},
    // keyFacts/faq are wholesale NEW content, not a same-facts-reworded edit,
    // so there is no old translation worth keeping — an old locale's text
    // would describe a different fact at the same array index. English only
    // until Translate produces real ones for the new facts.
    keyFacts: plan.keyFacts.map((f, i) => ({...L(f), _key: `kf-${plan.slug}-${i}`})),
    faq: plan.faq.map((f, i) => ({
      _type: 'localizedFaqItem',
      _key: `faq-${plan.slug}-${i}`,
      question: L(f.question),
      answer: T(f.answer),
    })),
    // sourceItem.label is a plain `string` field in the schema, not
    // localizedString — writing a {_type, en} object into it doesn't match
    // the field type and would show broken in Studio's source-item preview.
    sources: plan.sources.map((s, i) => ({
      _type: 'sourceItem',
      _key: `src-${plan.slug}-${i}`,
      label: s,
    })),
    author: {_type: 'reference', _ref: AUTHOR_ID},
  }
  delete doc._rev
  delete doc._createdAt
  delete doc._updatedAt

  const draftId = `drafts.${String(existing._id).replace(/^drafts\./, '')}`
  const action = existing.publishedAt ? 'UPDATE live article (draft)' : 'UPDATE (draft)'
  const zoneNote = zoneIdBySlug.size
    ? ` — zoneStatsEmbed: ${Array.from(zoneIdBySlug.keys()).join(', ')}`
    : ''

  console.log(`  ${action}  ${plan.slug} → ${draftId}  (${blocks.length} blocks)${zoneNote}`)
  console.log(
    `  ${plan.keyFacts.length} keyFacts, ${plan.faq.length} faq, ${plan.sources.length} sources`,
  )

  if (!execute) {
    console.log('\nDry run. Re-run with --execute to write.')
    return
  }

  const dir = path.resolve(process.cwd(), 'scripts/data')
  fs.mkdirSync(dir, {recursive: true})
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = path.join(dir, `blogPost-${plan.slug}-backup-${stamp}.json`)
  fs.writeFileSync(backupFile, JSON.stringify(existing, null, 2), 'utf8')
  console.log(`snapshot written to ${backupFile}`)

  await client.createOrReplace({...doc, _id: draftId} as {_id: string; _type: string})
  console.log(`wrote ${draftId}`)
  console.log('\nDraft only. Open it in Studio, press 🌐 Translate with base EN, review, publish.')
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
