/**
 * Write the rewritten text of the ten blog posts that read most like model
 * output (AI-text audit of 2026-10-20, reports/domlivo-ai-text-audit-2026-10-20.md,
 * item 2: Russian scanner scores 25-40 of 100).
 *
 * Input: a folder with `in/<slug>.json` (the posts as exported before the
 * rewrite) and `out/<slug>.json` (the same documents with only span text,
 * excerpt, subtitle, keyFacts and FAQ strings rewritten in all seven
 * languages). Every pair is checked before anything is written:
 *   - the document has not changed in Sanity since the export (same _rev);
 *   - every block and span keeps its _key, style and marks, and the FAQ and
 *     key-fact items keep their keys, so links and anchors survive;
 *   - every number in a language's text before is still in it after;
 *   - no long dash is left.
 * A post that fails any check is skipped and reported. Titles and slugs are
 * never written.
 *
 * Run:
 *   npx tsx scripts/applyBlogRewrite20261020.ts <folder>            (checks only)
 *   npx tsx scripts/applyBlogRewrite20261020.ts <folder> --execute  (backup + write)
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const dir = process.argv[2]
const execute = process.argv.includes('--execute')
if (!dir || !fs.existsSync(path.join(dir, 'out'))) {
  console.error('usage: applyBlogRewrite20261020.ts <folder with in/ and out/> [--execute]')
  process.exit(1)
}
const token = process.env.SANITY_API_TOKEN?.trim()
if (!token) {
  console.error('SANITY_API_TOKEN required in .env')
  process.exit(1)
}
const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl', 'de']
const FIELDS = ['content', 'excerpt', 'subtitle', 'keyFacts', 'faq'] as const

type Block = {_key: string; style?: string; children?: Array<{_key: string; text?: string; marks?: string[]}>}

function shape(blocks: Block[] | undefined): string {
  return JSON.stringify((blocks ?? []).map((b) => [b._key, b.style, (b.children ?? []).map((s) => [s._key, s.marks ?? []])]))
}

function localeText(doc: Record<string, any>, l: string): string {
  const parts: string[] = []
  for (const b of (doc.content?.[l] ?? []) as Block[]) parts.push((b.children ?? []).map((s) => s.text ?? '').join(''))
  for (const k of ['excerpt', 'subtitle']) if (typeof doc[k]?.[l] === 'string') parts.push(doc[k][l])
  for (const kf of doc.keyFacts ?? []) if (typeof kf?.[l] === 'string') parts.push(kf[l])
  for (const f of doc.faq ?? []) parts.push(f?.question?.[l] ?? '', f?.answer?.[l] ?? '')
  return parts.join('\n')
}

/** Digit groups as written, ignoring the separators a rewrite may legitimately change. */
function numbers(s: string): Set<string> {
  return new Set((s.match(/\d[\d.,   ]*\d|\d/g) ?? []).map((n) => n.replace(/[.,   ]/g, '')))
}

function check(before: Record<string, any>, after: Record<string, any>): string[] {
  const problems: string[] = []
  if (before._id !== after._id) problems.push('different _id')
  if (JSON.stringify(before.title) !== JSON.stringify(after.title)) problems.push('title changed')
  for (const l of LOCALES) {
    if (shape(before.content?.[l]) !== shape(after.content?.[l])) problems.push(`${l}: block/span structure changed`)
    const missing = [...numbers(localeText(before, l))].filter((n) => !numbers(localeText(after, l)).has(n))
    if (missing.length) problems.push(`${l}: numbers missing ${missing.slice(0, 8).join(', ')}`)
    if (/[—]|\s–\s/.test(localeText(after, l))) problems.push(`${l}: long dash left`)
  }
  for (const k of ['keyFacts', 'faq'] as const) {
    const keys = (d: Record<string, any>) => JSON.stringify((d[k] ?? []).map((x: {_key?: string}) => x?._key))
    if (keys(before) !== keys(after)) problems.push(`${k}: items changed`)
  }
  return problems
}

async function main() {
  const files = fs.readdirSync(path.join(dir, 'out')).filter((f) => f.endsWith('.json'))
  const ok: Array<{id: string; rev: string; set: Record<string, unknown>; backup: Record<string, unknown>}> = []
  for (const f of files) {
    const before = JSON.parse(fs.readFileSync(path.join(dir, 'in', f), 'utf8'))
    const after = JSON.parse(fs.readFileSync(path.join(dir, 'out', f), 'utf8'))
    const live = await client.fetch<{_rev: string} | null>(`*[_id == $id][0]{_rev}`, {id: before._id})
    const problems = check(before, after)
    if (!live) problems.push('document gone')
    else if (live._rev !== before._rev) problems.push('changed in Sanity since the export')
    if (problems.length) {
      console.log(`SKIP ${f}: ${problems.join('; ')}`)
      continue
    }
    const set: Record<string, unknown> = {}
    const backup: Record<string, unknown> = {_id: before._id, _rev: before._rev}
    for (const k of FIELDS) {
      if (after[k] === undefined) continue
      set[k] = after[k]
      backup[k] = before[k]
    }
    ok.push({id: before._id, rev: before._rev, set, backup})
    console.log(`ok   ${f}`)
  }
  console.log(`\n${ok.length} of ${files.length} posts pass the checks`)
  if (!execute || !ok.length) return console.log(execute ? '' : 'dry run; pass --execute to write')
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.resolve(process.cwd(), 'scripts/data/backups')
  fs.mkdirSync(backupDir, {recursive: true})
  fs.writeFileSync(path.join(backupDir, `blog-rewrite-backup-${stamp}.json`), JSON.stringify(ok.map((o) => o.backup), null, 1))
  const tx = client.transaction()
  for (const o of ok) tx.patch(o.id, (p) => p.ifRevisionId(o.rev).set(o.set))
  await tx.commit({autoGenerateArrayKeys: false})
  console.log(`written; backup scripts/data/backups/blog-rewrite-backup-${stamp}.json`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
