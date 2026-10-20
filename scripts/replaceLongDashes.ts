/**
 * Replace long dashes in the site's prose (AI-text audit of 2026-10-20,
 * reports/domlivo-ai-text-audit-2026-10-20.md, item 1).
 *
 * The em dash was the most frequent model tell on the site: 763 in the
 * Russian blog alone, 7-12 per 1,000 words in the English and German blog,
 * landing pages and district texts. The house rule is a hyphen, not a dash.
 *
 * Rules, in order, on every string and Portable Text span:
 *   1. A range between figures loses its spaces and gets a hyphen:
 *      "€1,800 – 2,200", "1.800–2.200" → "1,800-2,200".
 *   2. A dash pair around an aside inside one sentence becomes commas:
 *      "Golem — the cheapest strip — asks…" → "Golem, the cheapest strip, asks…".
 *   3. A dash joining two words, dates or live-figure tokens without spaces
 *      becomes a hyphen ("Tirana–Durrës", "{{p20:x}}–{{p80:x}}"); a dash
 *      stranded before punctuation is dropped.
 *   4. Any other em dash or spaced en dash becomes a spaced hyphen " - ";
 *      a dash opening a line or list item becomes "- ".
 *
 * Titles are left alone (`title`, `metaTitle`, `ogTitle`, `seoTitle`): the
 * frontend splits an over-long <title> on " — " (lib/seo/brandTitle.ts), and a
 * title separator is not prose. Slugs, keys, references and URLs are never
 * touched. Drafts get the same patch, so publishing a draft does not bring the
 * dashes back.
 *
 * Run:
 *   npx tsx scripts/replaceLongDashes.ts                 (dry run: counts + samples)
 *   npx tsx scripts/replaceLongDashes.ts --execute       (backup + patches)
 *   --types blogPost,district                            (limit to some types)
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const execute = process.argv.includes('--execute')
const typesArg = process.argv.includes('--types') ? process.argv[process.argv.indexOf('--types') + 1] : ''
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

const TYPES = typesArg
  ? typesArg.split(',')
  : ['blogPost', 'knowledgeArticle', 'landingPage', 'catalogSeoPage', 'city', 'district', 'property', 'developer', 'agent']

/** Keys whose whole subtree is left as it is. */
const SKIP_KEYS = new Set([
  '_id', '_rev', '_type', '_key', '_ref', '_createdAt', '_updatedAt', '_weak',
  'slug', 'localizedSlug', 'asset', 'crop', 'hotspot', 'url', 'href', 'markDefs', 'marks', 'style', 'listItem',
  'title', 'metaTitle', 'ogTitle', 'seoTitle',
])

const DASH = '[\\u2014\\u2013]'
const FIGURE_RANGE = new RegExp(`(\\d[\\d.,\\u00a0\\u202f]*)\\s*${DASH}\\s*(?=[€$]?\\s?\\d)`, 'g')
const ASIDE_PAIR = new RegExp(`\\s\\u2014\\s([^\\u2014\\u2013.!?\\n]{1,140}?)\\s\\u2014\\s`, 'g')
const LINE_START = new RegExp(`(^|\\n)\\s*${DASH}\\s*`, 'g')
const SPACED = new RegExp(`\\s+${DASH}\\s+`, 'g')
const BARE_EM = /—/g
/** "Tirana–Durrës", "Aug25–Jul26", "{{p20:x}}–{{p80:x}}": a joined pair, not a pause. */
const JOINED = /([\p{L}\p{N}}])[—–](?=[\p{L}\p{N}{€$])/gu
/** "für Familien –, und": a dash left before punctuation by an earlier edit. */
const BEFORE_PUNCT = /\s+[—–](?=[,.;:!?])/g

export function fixDashes(s: string): string {
  if (!/[—–]/.test(s)) return s
  let out = s.replace(FIGURE_RANGE, '$1-')
  out = out.replace(JOINED, '$1-')
  out = out.replace(BEFORE_PUNCT, '')
  out = out.replace(ASIDE_PAIR, ', $1, ')
  out = out.replace(LINE_START, '$1- ')
  out = out.replace(SPACED, ' - ')
  out = out.replace(BARE_EM, ' - ')
  return out.replace(/ ,/g, ',').replace(/,,/g, ',')
}

type Stats = {strings: number; dashesBefore: number; dashesAfter: number}
const count = (s: string) => (s.match(/[—–]/g) || []).length

/** A new tree with fixed strings, or the same object when nothing changed. */
function walk(v: unknown, stats: Stats, samples: string[]): unknown {
  if (typeof v === 'string') {
    const next = fixDashes(v)
    if (next !== v) {
      stats.strings++
      stats.dashesBefore += count(v)
      stats.dashesAfter += count(next)
      if (samples.length < 6) samples.push(`${v.slice(0, 140)}\n      → ${next.slice(0, 140)}`)
    }
    return next
  }
  if (Array.isArray(v)) {
    let changed = false
    const out = v.map((x) => {
      const n = walk(x, stats, samples)
      if (n !== x) changed = true
      return n
    })
    return changed ? out : v
  }
  if (v && typeof v === 'object') {
    let changed = false
    const out: Record<string, unknown> = {}
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      if (SKIP_KEYS.has(k)) {
        out[k] = x
        continue
      }
      const n = walk(x, stats, samples)
      if (n !== x) changed = true
      out[k] = n
    }
    return changed ? out : v
  }
  return v
}

async function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.resolve(process.cwd(), 'scripts/data/backups')
  let totalDocs = 0
  for (const type of TYPES) {
    const docs = await client.fetch<Array<Record<string, unknown>>>(`*[_type == $type]`, {type})
    const stats: Stats = {strings: 0, dashesBefore: 0, dashesAfter: 0}
    const samples: string[] = []
    const patches: Array<{id: string; rev: string; set: Record<string, unknown>; before: Record<string, unknown>}> = []
    for (const d of docs) {
      const set: Record<string, unknown> = {}
      const before: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(d)) {
        if (SKIP_KEYS.has(k) || k.startsWith('_')) continue
        const n = walk(v, stats, samples)
        if (n !== v) {
          set[k] = n
          before[k] = v
        }
      }
      if (Object.keys(set).length) patches.push({id: String(d._id), rev: String(d._rev), set, before})
    }
    totalDocs += patches.length
    console.log(
      `${type.padEnd(18)} ${String(patches.length).padStart(4)} docs, ${String(stats.strings).padStart(5)} strings, dashes ${stats.dashesBefore} → ${stats.dashesAfter}`,
    )
    for (const s of samples.slice(0, execute ? 0 : 3)) console.log(`    ${s}`)
    if (!execute || !patches.length) continue
    fs.mkdirSync(backupDir, {recursive: true})
    fs.writeFileSync(
      path.join(backupDir, `dashes-${type}-backup-${stamp}.json`),
      JSON.stringify(patches.map((p) => ({_id: p.id, _rev: p.rev, ...p.before})), null, 1),
    )
    for (let i = 0; i < patches.length; i += 40) {
      const tx = client.transaction()
      for (const p of patches.slice(i, i + 40)) tx.patch(p.id, (q) => q.ifRevisionId(p.rev).set(p.set))
      await tx.commit({autoGenerateArrayKeys: false})
    }
  }
  console.log(execute ? `\npatched ${totalDocs} documents; backups in scripts/data/backups/dashes-*-${stamp}.json` : '\ndry run; pass --execute to write')
}

if (process.argv[1]?.endsWith('replaceLongDashes.ts')) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
