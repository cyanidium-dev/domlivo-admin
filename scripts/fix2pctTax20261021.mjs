/**
 * Text fix of 21.10.2026: remove the false "2% transfer tax paid by (or shifted to) the buyer"
 * claim and recompute the cost totals derived from it.
 *
 * Reads an edits file (JSON array of {id, path, old, new}) built in
 * domlivo-workspace/knowledge/content-and-texts/domlivo-2pct-tax-fix-2026-10-21/:
 *   path  Sanity JSONMatch path to ONE string, e.g. content.en[_key=="x"].children[_key=="y"].text
 *   old   substring that must occur exactly once in the current value
 *   new   its replacement
 * Several edits on one path are applied in order and written as one `set`.
 *
 * Dry run (default) prints doc / path / old sentence -> new sentence and every check.
 * --execute writes a backup of the touched values next to the edits file, then patches
 * each document with ifRevisionId (only the changed paths; _key values untouched).
 *
 *   node scripts/fix2pctTax20261021.mjs <edits.json>            (dry run)
 *   node scripts/fix2pctTax20261021.mjs <edits.json> --execute
 */
import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'

const req = createRequire(path.resolve(process.env.ADMIN_ROOT || '.', 'package.json'))
const {config} = req('dotenv')
config({path: path.resolve(process.env.ADMIN_ROOT || '.', '.env')})
const {createClient} = req('@sanity/client')

const editsFile = process.argv[2]
const execute = process.argv.includes('--execute')
if (!editsFile) throw new Error('usage: node scripts/fix2pctTax20261021.mjs <edits.json> [--execute]')
const edits = JSON.parse(fs.readFileSync(editsFile, 'utf8'))

const client = createClient({
  projectId: 'g4aqp6ex',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: (process.env.SANITY_API_TOKEN || '').trim(),
  useCdn: false,
  perspective: 'raw',
})

function parsePath(p) {
  const segs = []
  const re = /([A-Za-z0-9_]+)|\[_key=="([^"]+)"\]|\[(\d+)\]|\./g
  let m
  while ((m = re.exec(p))) {
    if (m[1]) segs.push({field: m[1]})
    else if (m[2]) segs.push({key: m[2]})
    else if (m[3]) segs.push({index: Number(m[3])})
  }
  return segs
}
function getAt(doc, p) {
  let x = doc
  for (const s of parsePath(p)) {
    if (x == null) return undefined
    if (s.field) x = x[s.field]
    else if (s.key) x = Array.isArray(x) ? x.find((v) => v && v._key === s.key) : undefined
    else x = Array.isArray(x) ? x[s.index] : undefined
  }
  return x
}
const count = (hay, needle) => hay.split(needle).length - 1
const sentenceOf = (text, needle) => {
  const i = text.indexOf(needle)
  const start = Math.max(text.lastIndexOf('. ', i) + 1, text.lastIndexOf('\n', i) + 1, 0)
  let end = text.indexOf('. ', i + needle.length)
  end = end < 0 ? text.length : end + 1
  return text.slice(start, end).trim()
}

const ids = [...new Set(edits.map((e) => e.id))]
const docs = Object.fromEntries((await client.fetch('*[_id in $ids]', {ids})).map((d) => [d._id, d]))
const drafts = await client.fetch('*[_id in $ids]._id', {ids: ids.map((i) => 'drafts.' + i)})
let problems = 0
const byDoc = {}
for (const e of edits) {
  const doc = docs[e.id]
  if (!doc) { console.log(`!! missing document ${e.id}`); problems++; continue }
  byDoc[e.id] ??= {rev: doc._rev, paths: {}}
  const slot = byDoc[e.id].paths
  const cur = slot[e.path]?.after ?? getAt(doc, e.path)
  if (typeof cur !== 'string') { console.log(`!! ${e.id} ${e.path}: not a string`); problems++; continue }
  const n = count(cur, e.old)
  if (n !== 1) { console.log(`!! ${e.id} ${e.path}: old text found ${n} times: ${e.old}`); problems++; continue }
  const after = cur.replace(e.old, () => e.new)
  slot[e.path] = {before: slot[e.path]?.before ?? getAt(doc, e.path), after}
  const bad = []
  if (/[—]/.test(e.new)) bad.push('em dash')
  if (/ {2}/.test(after) && !/ {2}/.test(cur)) bad.push('double space')
  if (/\b(delve|tapestry|seamless|crucial|navigate the)\b/i.test(e.new)) bad.push('slop word')
  if (bad.length) { console.log(`!! ${e.id} ${e.path}: ${bad.join(', ')}`); problems++ }
  console.log(`\n# ${e.id}  ${e.path}`)
  console.log(`  - ${sentenceOf(cur, e.old)}`)
  console.log(`  + ${sentenceOf(after, e.new)}`)
}
for (const d of drafts) { console.log(`!! a draft exists: ${d} (would need the same edit)`); problems++ }
const nPaths = Object.values(byDoc).reduce((a, d) => a + Object.keys(d.paths).length, 0)
console.log(`\n${edits.length} edits, ${Object.keys(byDoc).length} documents, ${nPaths} fields, ${problems} problems`)
if (!execute) process.exit(problems ? 1 : 0)
if (problems) throw new Error('refusing to write: fix the problems first')

const backupFile = editsFile.replace(/\.json$/, '') + `.backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
fs.writeFileSync(backupFile, JSON.stringify(Object.fromEntries(Object.entries(byDoc).map(([id, d]) => [id, {rev: d.rev, before: Object.fromEntries(Object.entries(d.paths).map(([p, v]) => [p, v.before]))}])), null, 1))
console.log('backup', backupFile)
for (const [id, d] of Object.entries(byDoc)) {
  const set = Object.fromEntries(Object.entries(d.paths).map(([p, v]) => [p, v.after]))
  const res = await client.patch(id).ifRevisionId(d.rev).set(set).commit({autoGenerateArrayKeys: false})
  console.log('patched', id, Object.keys(set).length, 'fields ->', res._rev)
}
