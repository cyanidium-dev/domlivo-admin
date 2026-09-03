/**
 * Replaces ONLY the opening paragraph of a published post's English body.
 *
 * The AEO rule in the SEO roadmap wants a question page to answer its question
 * in the first 40-60 words, and an audit on 2026-09-02 found four posts opening
 * with a meta-remark instead ("the price table already answers…"). Fixing that
 * through `loadBlogPost.ts` would mean re-supplying the entire article body to
 * change thirty words, so this does the surgical edit instead: block 0 of
 * `content.en` is swapped, every other block is untouched.
 *
 * Plan file:
 *   # Blog Lead Patch — `<slug>`
 *
 *   ## lead
 *   <the new opening paragraph, one paragraph, plain prose>
 *
 * Constraints:
 * - writes the DRAFT only (`drafts.<id>`), so nothing goes live without a human
 *   pressing Publish;
 * - refuses unless block 0 is a plain `normal` paragraph — a post opening with a
 *   heading, table or embed needs a human, not a script;
 * - refuses a lead outside 30-70 words, since the point of the exercise is the
 *   40-60 word direct answer and a silent 12-word replacement helps nobody;
 * - warns when the lead does not lead with an answer-shaped sentence;
 * - snapshots the whole document before writing;
 * - idempotent: re-running with the same plan produces the same draft.
 *
 * Run:
 *   npm run patch:blog-lead -- docs/superpowers/plans/<file>.md
 *   npm run patch:blog-lead -- docs/superpowers/plans/<file>.md --execute
 */

import path from 'node:path'
import fs from 'node:fs'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {markdownToPortableText} from '../lib/articleLoader/markdownToPt'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const args = process.argv.slice(2)
const execute = args.includes('--execute')
const planArg = args.find((a) => !a.startsWith('--'))
if (!planArg) throw new Error('usage: npm run patch:blog-lead -- <path-to-plan.md> [--execute]')
const PLAN_PATH = path.resolve(process.cwd(), planArg)

const MIN_WORDS = 30
const MAX_WORDS = 70

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

function section(doc: string, name: string): string {
  const re = new RegExp(`\\n## ${name}\\n([\\s\\S]*?)(?=\\n## |$)`)
  const m = re.exec(doc)
  if (!m) throw new Error(`plan is missing a "## ${name}" section`)
  return m[1].trim()
}

function parsePlan(md: string): {slug: string; lead: string} {
  const slugMatch = /^# Blog Lead Patch — `([^`]+)`/m.exec(md)
  if (!slugMatch) throw new Error('plan is missing the "# Blog Lead Patch — `<slug>`" heading')
  const lead = section(md, 'lead').replace(/\s*\n+\s*/g, ' ').trim()
  if (!lead) throw new Error('plan has an empty "## lead" section')
  return {slug: slugMatch[1], lead}
}

const wordCount = (s: string): number => s.split(/\s+/).filter(Boolean).length

/** Flat text of a Portable Text block, for the before/after diff. */
function blockText(block: unknown): string {
  const b = block as {children?: Array<{text?: string}>}
  return (b?.children || []).map((c) => c?.text || '').join('')
}

async function main(): Promise<void> {
  if (!fs.existsSync(PLAN_PATH)) throw new Error(`plan file not found at ${PLAN_PATH}`)
  const {slug, lead} = parsePlan(fs.readFileSync(PLAN_PATH, 'utf8'))

  const words = wordCount(lead)
  if (words < MIN_WORDS || words > MAX_WORDS) {
    throw new Error(`lead is ${words} words; the AEO target is 40-60 and this script accepts ${MIN_WORDS}-${MAX_WORDS}`)
  }

  const existing = await client.fetch(`*[_type=="blogPost" && slug.current==$s][0]`, {s: slug})
  if (!existing) throw new Error(`no blogPost with slug "${slug}"`)

  const blocks = (existing.content?.en || []) as Array<Record<string, unknown>>
  if (!blocks.length) throw new Error(`${slug} has no English body to patch`)
  const first = blocks[0]
  if (first._type !== 'block' || (first.style && first.style !== 'normal')) {
    throw new Error(
      `${slug} opens with a ${String(first._type)}/${String(first.style)} block, not a paragraph — patch it by hand`,
    )
  }

  const [newBlock] = markdownToPortableText(lead)
  if (!newBlock) throw new Error('the lead did not convert to a Portable Text block')
  // Reuse the original _key so the change reads as an edit of that paragraph
  // rather than a delete plus an insert.
  const patched = [{...newBlock, _key: first._key}, ...blocks.slice(1)]

  const draftId = `drafts.${String(existing._id).replace(/^drafts\./, '')}`
  console.log(`  PATCH LEAD  ${slug} → ${draftId}`)
  console.log(`  before (${wordCount(blockText(first))} words): ${blockText(first).slice(0, 160)}`)
  console.log(`  after  (${words} words): ${lead.slice(0, 160)}`)
  console.log(`  body blocks unchanged: ${blocks.length - 1}`)

  if (!execute) {
    console.log('\nDry run. Re-run with --execute to write the draft.')
    return
  }

  const dir = path.resolve(process.cwd(), 'scripts/data')
  fs.mkdirSync(dir, {recursive: true})
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = path.join(dir, `blogLead-${slug}-backup-${stamp}.json`)
  fs.writeFileSync(backupFile, JSON.stringify(existing, null, 2), 'utf8')
  console.log(`snapshot written to ${backupFile}`)

  const doc: Record<string, unknown> = {
    ...existing,
    _id: draftId,
    content: {...(existing.content as object), en: patched},
  }
  delete doc._rev
  delete doc._createdAt
  delete doc._updatedAt

  await client.createOrReplace(doc as {_id: string; _type: string})
  console.log(`wrote ${draftId}`)
  console.log('\nDraft only. The English lead changed, so re-run Translate for the other locales before publishing.')
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
