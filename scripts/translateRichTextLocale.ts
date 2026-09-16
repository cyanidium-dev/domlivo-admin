/**
 * Fill one missing locale of the Portable Text fields (localizedBlockContent:
 * SEO text sections, rich FAQ answers) on landing pages — the part
 * translateLocaleGaps.ts cannot do, because it only handles plain strings.
 *
 * Written for the German rollout (2026-09-16), usable for any locale:
 *   npx tsx scripts/translateRichTextLocale.ts --dry --locale de [--page-types city,district] [--limit 5]
 *   npx tsx scripts/translateRichTextLocale.ts --execute --locale de [--page-types city,district]
 *
 * How the structure survives: every block is sent as one string in which each
 * marked span is wrapped in <sN>…</sN> (N = the span's index in the English
 * block). The reply is split on those tags back into spans that carry the
 * original marks, so bold text and links stay bold text and links. Blocks keep
 * the English `_key`, as every existing locale on these documents does.
 * Non-text items (images, tables, callouts) are copied from English unchanged.
 *
 * Only a locale that is missing or empty is written; nothing is overwritten.
 * Source is English, Albanian when English is empty.
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {askJson, costUsd, LOCALE_NAMES, mapLimit, usage} from './lib/claudeTranslate'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const args = process.argv.slice(2)
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')
const locale = args.includes('--locale') ? args[args.indexOf('--locale') + 1] : ''
const pageTypes = args.includes('--page-types') ? args[args.indexOf('--page-types') + 1].split(',') : null
const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : 0
if ((!isDry && !isExecute) || !LOCALE_NAMES[locale]) {
  console.error('Use --dry or --execute, and --locale <one of ' + Object.keys(LOCALE_NAMES).join(', ') + '>.')
  process.exit(1)
}

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN?.trim(),
})

const LOCALE_KEYS = new Set(Object.keys(LOCALE_NAMES))

type Span = {_key: string; _type: 'span'; marks?: string[]; text: string}
type Block = {_key: string; _type: string; children?: Span[]; markDefs?: unknown[]; style?: string; [k: string]: unknown}
type Job = {docId: string; path: string; source: Block[]; from: string}

function isBlockArray(v: unknown): v is Block[] {
  return Array.isArray(v) && v.length > 0 && v.every((b) => b && typeof b === 'object' && typeof (b as Block)._type === 'string')
}

/** Localized Portable Text objects under `node`, with their Sanity patch paths. */
function collect(node: unknown, at: string, out: Array<{path: string; obj: Record<string, unknown>}>) {
  if (Array.isArray(node)) {
    node.forEach((item, i) => {
      const key = item && typeof item === 'object' ? (item as {_key?: string})._key : undefined
      collect(item, key ? `${at}[_key=="${key}"]` : `${at}[${i}]`, out)
    })
    return
  }
  if (!node || typeof node !== 'object') return
  const obj = node as Record<string, unknown>
  const keys = Object.keys(obj).filter((k) => !k.startsWith('_'))
  if (keys.length && keys.every((k) => LOCALE_KEYS.has(k)) && keys.some((k) => isBlockArray(obj[k]))) {
    out.push({path: at, obj})
    return
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('_')) continue
    collect(v, at ? `${at}.${k}` : k, out)
  }
}

function encodeBlock(b: Block): string | null {
  if (b._type !== 'block' || !Array.isArray(b.children)) return null
  return b.children
    .map((s, i) => (s.marks && s.marks.length ? `<s${i}>${s.text}</s${i}>` : s.text))
    .join('')
}

function decodeBlock(src: Block, text: string): Block {
  const children: Span[] = []
  const re = /<s(\d+)>([\s\S]*?)<\/s\1>/g
  let last = 0
  let n = 0
  const push = (t: string, marks: string[]) => {
    if (!t) return
    children.push({_key: `${src._key}-${locale}-${n++}`, _type: 'span', marks, text: t})
  }
  for (let m = re.exec(text); m; m = re.exec(text)) {
    push(text.slice(last, m.index), [])
    const orig = src.children?.[Number(m[1])]
    push(m[2], orig?.marks ?? [])
    last = m.index + m[0].length
  }
  push(text.slice(last), [])
  if (!children.length) children.push({_key: `${src._key}-${locale}-0`, _type: 'span', marks: [], text: ''})
  return {...src, children}
}

const SYSTEM = `Task: translate rich-text website copy block by block. The user message is JSON: "from" and "to" are languages, "blocks" maps block ids to text. Inline tags like <s3>…</s3> mark formatted or linked words: keep every tag, with the same number, around the translated words that correspond, never add or drop tags. Reply with a JSON object mapping the same block ids to the translated text. Headings stay headings (short).`

async function main() {
  const filter = pageTypes ? '&& pageType in $pageTypes' : ''
  const docs = await client.fetch<Record<string, unknown>[]>(
    `*[_type == "landingPage" && !(_id in path("drafts.**")) ${filter}]`,
    {pageTypes},
  )
  let jobs: Job[] = []
  for (const doc of docs) {
    const allowed = Array.isArray(doc.locales) && doc.locales.length ? (doc.locales as string[]) : null
    if (allowed && !allowed.includes(locale)) continue
    const found: Array<{path: string; obj: Record<string, unknown>}> = []
    collect(doc.pageSections, 'pageSections', found)
    for (const {path: p, obj} of found) {
      if (isBlockArray(obj[locale])) continue
      const from = isBlockArray(obj.en) ? 'en' : isBlockArray(obj.sq) ? 'sq' : ''
      if (!from) continue
      jobs.push({docId: String(doc._id), path: `${p}.${locale}`, source: obj[from] as Block[], from})
    }
  }
  if (limit > 0) jobs = jobs.slice(0, limit)
  const chars = jobs.reduce((n, j) => n + j.source.reduce((m, b) => m + (encodeBlock(b)?.length ?? 0), 0), 0)
  console.log(`${jobs.length} rich-text fields in ${new Set(jobs.map((j) => j.docId)).size} landing pages → ${locale}; ${chars} characters`)
  if (isDry) {
    for (const j of jobs.slice(0, 15)) console.log(`  ${j.docId} ${j.path} (${j.source.length} blocks from ${j.from})`)
    console.log('\nDry run — nothing sent, nothing written.')
    return
  }

  const report: Array<Record<string, unknown>> = []
  let written = 0
  await mapLimit(jobs, 4, async (job, i) => {
    const blocks: Record<string, string> = {}
    job.source.forEach((b, idx) => {
      const enc = encodeBlock(b)
      if (enc && enc.trim()) blocks[`b${idx}`] = enc
    })
    try {
      const reply = Object.keys(blocks).length
        ? await askJson(SYSTEM, JSON.stringify({from: LOCALE_NAMES[job.from], to: LOCALE_NAMES[locale], blocks}))
        : {}
      // Short inputs sometimes come back echoing the envelope: {"blocks": {…}}.
      const map = (reply.blocks && typeof reply.blocks === 'object' ? reply.blocks : reply) as Record<string, unknown>
      const out = job.source.map((b, idx) => {
        const got = map[`b${idx}`]
        if (!(`b${idx}` in blocks)) return b
        if (typeof got !== 'string' || !got.trim()) throw new Error(`block ${idx} missing from reply`)
        const tagsIn = (blocks[`b${idx}`].match(/<s\d+>/g) ?? []).sort().join()
        const tagsOut = (got.match(/<s\d+>/g) ?? []).sort().join()
        if (tagsIn !== tagsOut) throw new Error(`block ${idx}: inline tags changed`)
        return decodeBlock(b, got.trim())
      })
      await client.patch(job.docId).set({[job.path]: out}).commit()
      written += 1
      report.push({id: job.docId, path: job.path, blocks: out.length})
    } catch (err) {
      report.push({id: job.docId, path: job.path, error: err instanceof Error ? err.message : String(err)})
      console.log(`  ! ${job.docId} ${job.path}: ${err instanceof Error ? err.message : err}`)
    }
    if ((i + 1) % 10 === 0 || i + 1 === jobs.length) console.log(`  ${i + 1}/${jobs.length}`)
  })
  const reportPath = path.resolve(process.cwd(), `reports/richtext-${locale}-${new Date().toISOString().slice(0, 10)}.json`)
  fs.mkdirSync(path.dirname(reportPath), {recursive: true})
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\nwrote ${written} of ${jobs.length} fields; report ${reportPath}`)
  console.log(`Claude: ${usage.calls} calls, ${usage.input} in / ${usage.output} out tokens ≈ $${costUsd(usage)}.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
