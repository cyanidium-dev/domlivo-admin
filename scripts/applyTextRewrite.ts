/**
 * Rewrite the prose of any Sanity document type in all seven languages without
 * touching anything else (AI-text audit, wave 2, 2026-10-21; generalises
 * applyBlogRewrite20261020.ts, which only knew blog posts).
 *
 * "Prose" is every localized string ({en,ru,...}) and every span of localized
 * Portable Text, except page titles (top-level `title`, `heroTitle`), the whole
 * `seo` object (title/description experiments run elsewhere), slugs, addresses,
 * button labels and table cells (see EXCLUDE_KEYS).
 *
 * Three steps, each on a work folder:
 *   export <folder> <id...>   in/<id>.json (the live document) and seg/<id>.<locale>.txt
 *                             (one "[sN hint]" header per string, text below it)
 *   merge  <folder>           seg-new/<id>.<locale>.txt (the rewritten segments; a
 *                             missing file keeps that language as it was) -> out/<id>.json
 *   apply  <folder> [--execute] [--only id,id]
 *                             checks every in/out pair, then (with --execute) writes
 *                             a backup and patches the passing documents.
 *
 * Checks before anything is written:
 *   - the document has not changed in Sanity since the export (same _rev);
 *   - nothing but prose strings differs (every key, _key, mark, style, number,
 *     reference and excluded string is identical), so links and anchors survive;
 *   - every number in a language's prose before is still in it after, unless
 *     notes/<id>.json lists it under allowMissingNumbers.<locale> (a corrected
 *     translation error, recorded in the report);
 *   - no long dash, no empty link text.
 *
 * Run (from the repo root):
 *   npx tsx scripts/applyTextRewrite.ts export ../work blogPost-abc landing-tirana
 *   npx tsx scripts/applyTextRewrite.ts merge ../work
 *   npx tsx scripts/applyTextRewrite.ts apply ../work            (checks only)
 *   npx tsx scripts/applyTextRewrite.ts apply ../work --execute  (backup + write)
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

export const LOCALES = ['en', 'ru', 'uk', 'sq', 'it', 'pl', 'de'] as const
const LSET = new Set<string>(LOCALES)
export const EXCLUDE_KEYS = new Set([
  'seo', 'slug', 'localizedSlug', 'address', 'keywords', 'heroTitle', 'label', 'submitLabel', 'seeAllLabel',
  'cardCtaLabel', 'tabs', 'presets', 'columns', 'localizedCells', 'cells', 'search', 'questionSet', 'propertyOffers',
])

type Doc = Record<string, any>
type Path = Array<string | number>
export type Segment = {path: Path; hint: string; text: string}

function isLocalized(x: unknown): x is Record<string, unknown> {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return false
  const keys = Object.keys(x).filter((k) => k !== '_type' && k !== '_key')
  return keys.length > 0 && keys.every((k) => LSET.has(k)) && keys.some((k) => typeof (x as any)[k] === 'string' || Array.isArray((x as any)[k]))
}

const hintOf = (p: Path) => p.map((s) => (typeof s === 'number' ? '#' : s)).join('.')

/** Editable prose of one locale, in document order (same walk as scripts/aiText/textmodel.py; keep the two in step). */
export function segments(doc: Doc, locale: string): Segment[] {
  const out: Segment[] = []
  const walk = (x: unknown, p: Path, top: boolean) => {
    if (Array.isArray(x)) return x.forEach((v, i) => walk(v, [...p, i], false))
    if (!x || typeof x !== 'object') return
    if (isLocalized(x)) {
      const v = (x as any)[locale]
      if (typeof v === 'string') {
        if (v.trim()) out.push({path: [...p, locale], hint: hintOf(p), text: v})
      } else if (Array.isArray(v)) {
        v.forEach((b: any, bi: number) => {
          if (b?._type !== 'block') return
          ;(b.children ?? []).forEach((s: any, si: number) => {
            if (typeof s?.text !== 'string' || !s.text.trim()) return
            const hint = `${hintOf(p)} ${b.style ?? ''}${s.marks?.length ? ' LINK' : ''}${b.listItem ? ' li' : ''}`
            out.push({path: [...p, locale, bi, 'children', si, 'text'], hint, text: s.text})
          })
        })
      }
      return
    }
    for (const [k, v] of Object.entries(x)) {
      if (k.startsWith('_') || EXCLUDE_KEYS.has(k) || (top && k === 'title')) continue
      walk(v, [...p, k], false)
    }
  }
  walk(doc, [], true)
  return out
}

const getAt = (d: any, p: Path) => p.reduce((o, k) => o?.[k], d)
function setAt(d: any, p: Path, v: unknown) {
  const parent = p.slice(0, -1).reduce((o, k) => o[k], d)
  parent[p[p.length - 1]] = v
}

/** Prose of one locale as plain text, spans of one block joined. */
export function plain(doc: Doc, locale: string): string {
  const lines: string[] = []
  let last: string | null = null
  for (const s of segments(doc, locale)) {
    const blk = s.path[s.path.length - 1] === 'text' ? JSON.stringify(s.path.slice(0, -2)) : null
    if (blk !== null && blk === last) lines[lines.length - 1] += s.text
    else lines.push(s.text)
    last = blk
  }
  return lines.join('\n')
}

/** Digit groups as written, ignoring the separators a rewrite may legitimately change. */
export function numbers(s: string): Set<string> {
  return new Set((s.match(/\d[\d.,   ]*\d|\d/g) ?? []).map((n) => n.replace(/[.,   ]/g, '')))
}

/** Everything except prose strings, so two versions can be compared for structure. */
function skeleton(doc: Doc): string {
  const copy = JSON.parse(JSON.stringify(doc))
  for (const l of LOCALES) for (const s of segments(doc, l)) setAt(copy, s.path, '§')
  return JSON.stringify(copy)
}

export function check(before: Doc, after: Doc, allow: Record<string, string[]> = {}): string[] {
  const problems: string[] = []
  if (before._id !== after._id) problems.push('different _id')
  // prose that became empty would hide from segments(); compare skeletons both ways
  const a = JSON.parse(JSON.stringify(after))
  for (const l of LOCALES) for (const s of segments(before, l)) if (typeof getAt(a, s.path) === 'string') setAt(a, s.path, '§')
  if (JSON.stringify(a) !== skeleton(before)) problems.push('something besides prose changed (structure, keys, marks, titles, seo or excluded fields)')
  for (const l of LOCALES) {
    const textAfter = plain(after, l)
    const have = numbers(textAfter)
    const missing = [...numbers(plain(before, l))].filter((n) => !have.has(n) && !(allow[l] ?? []).includes(n))
    if (missing.length) problems.push(`${l}: numbers missing ${missing.slice(0, 8).join(', ')}`)
    if (/—|\s–\s/.test(textAfter)) problems.push(`${l}: long dash left`)
    for (const s of segments(before, l)) {
      if (!s.hint.includes('LINK')) continue
      const t = getAt(after, s.path)
      if (typeof t !== 'string' || !t.trim()) problems.push(`${l}: empty link text at ${s.hint}`)
    }
  }
  return problems
}

// ---------- segment files

const TAG = /^\[s(\d+)(?: [^\]]*)?\]\s*$/

function writeSegments(file: string, segs: Segment[]) {
  fs.writeFileSync(file, segs.map((s, i) => `[s${i} ${s.hint}]\n${s.text.trim()}\n`).join('\n'))
}

function readSegments(file: string): Map<number, string> {
  const out = new Map<number, string>()
  let cur: number | null = null
  let buf: string[] = []
  const flush = () => cur !== null && out.set(cur, buf.join('\n').trim())
  for (const line of fs.readFileSync(file, 'utf8').replace(/^﻿/, '').split(/\r?\n/)) {
    const m = TAG.exec(line)
    if (m) {
      flush()
      cur = Number(m[1])
      buf = []
    } else buf.push(line)
  }
  flush()
  return out
}

const safe = (id: string) => id.replace(/[^\w.-]/g, '_')

// ---------- commands

function client() {
  const token = process.env.SANITY_API_TOKEN?.trim()
  if (!token) throw new Error('SANITY_API_TOKEN required in .env')
  return createClient({
    projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
    dataset: (process.env.SANITY_DATASET || 'production').trim(),
    apiVersion: '2024-01-01',
    token,
    useCdn: false,
  })
}

async function exportDocs(dir: string, ids: string[]) {
  for (const sub of ['in', 'seg', 'seg-new', 'out', 'notes']) fs.mkdirSync(path.join(dir, sub), {recursive: true})
  const docs = await client().fetch<Doc[]>(`*[_id in $ids]`, {ids})
  for (const d of docs) {
    fs.writeFileSync(path.join(dir, 'in', `${safe(d._id)}.json`), JSON.stringify(d, null, 1))
    for (const l of LOCALES) {
      const segs = segments(d, l)
      if (segs.length) writeSegments(path.join(dir, 'seg', `${safe(d._id)}.${l}.txt`), segs)
    }
    console.log(`exported ${d._id} (${d._type})`)
  }
  const missing = ids.filter((id) => !docs.some((d) => d._id === id))
  if (missing.length) console.log(`not found: ${missing.join(', ')}`)
}

function mergeDocs(dir: string) {
  for (const f of fs.readdirSync(path.join(dir, 'in')).filter((x) => x.endsWith('.json'))) {
    const before: Doc = JSON.parse(fs.readFileSync(path.join(dir, 'in', f), 'utf8'))
    const after: Doc = JSON.parse(JSON.stringify(before))
    const notes: string[] = []
    let touched = 0
    for (const l of LOCALES) {
      const file = path.join(dir, 'seg-new', `${f.replace(/\.json$/, '')}.${l}.txt`)
      if (!fs.existsSync(file)) continue
      touched++
      const segs = segments(before, l)
      const next = readSegments(file)
      segs.forEach((s, i) => {
        const t = next.get(i)
        if (t === undefined) return notes.push(`${l}: s${i} missing, kept`)
        // keep the span's own leading/trailing spaces, they join it to its neighbours
        const lead = /^[.,;:!?)]/.test(t) ? '' : s.text.slice(0, s.text.length - s.text.trimStart().length)
        const trail = s.text.slice(s.text.trimEnd().length)
        setAt(after, s.path, lead + t + trail)
      })
      const extra = [...next.keys()].filter((i) => i >= segs.length)
      if (extra.length) notes.push(`${l}: unknown segments s${extra.join(', s')}`)
    }
    if (!touched) continue
    fs.writeFileSync(path.join(dir, 'out', f), JSON.stringify(after, null, 1))
    console.log(`merged ${f} (${touched} languages)${notes.length ? `\n   ${notes.join('\n   ')}` : ''}`)
  }
}

async function apply(dir: string, execute: boolean, only?: Set<string>) {
  const c = client()
  const files = fs.readdirSync(path.join(dir, 'out')).filter((f) => f.endsWith('.json'))
  const ok: Array<{id: string; rev: string; set: Doc; backup: Doc}> = []
  for (const f of files) {
    const before: Doc = JSON.parse(fs.readFileSync(path.join(dir, 'in', f), 'utf8'))
    if (only && !only.has(before._id)) continue
    const after: Doc = JSON.parse(fs.readFileSync(path.join(dir, 'out', f), 'utf8'))
    const notesFile = path.join(dir, 'notes', f)
    const allow = fs.existsSync(notesFile) ? JSON.parse(fs.readFileSync(notesFile, 'utf8')).allowMissingNumbers ?? {} : {}
    const problems = check(before, after, allow)
    const live = await c.fetch<{_rev: string} | null>(`*[_id == $id][0]{_rev}`, {id: before._id})
    if (!live) problems.push('document gone')
    else if (live._rev !== before._rev) problems.push('changed in Sanity since the export')
    if (problems.length) {
      console.log(`SKIP ${before._id}: ${problems.join('; ')}`)
      continue
    }
    const set: Doc = {}
    const backup: Doc = {_id: before._id, _rev: before._rev}
    for (const k of Object.keys(after)) {
      if (k.startsWith('_') || JSON.stringify(after[k]) === JSON.stringify(before[k])) continue
      set[k] = after[k]
      backup[k] = before[k]
    }
    if (!Object.keys(set).length) {
      console.log(`same ${before._id}`)
      continue
    }
    ok.push({id: before._id, rev: before._rev, set, backup})
    console.log(`ok   ${before._id}: ${Object.keys(set).join(', ')}`)
  }
  console.log(`\n${ok.length} documents pass the checks`)
  if (!execute || !ok.length) return console.log(execute ? '' : 'dry run; pass --execute to write')
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.resolve(process.cwd(), 'scripts/data/backups')
  fs.mkdirSync(backupDir, {recursive: true})
  const backupFile = path.join(backupDir, `text-rewrite-backup-${stamp}.json`)
  fs.writeFileSync(backupFile, JSON.stringify(ok.map((o) => o.backup), null, 1))
  for (let i = 0; i < ok.length; i += 20) {
    const tx = c.transaction()
    for (const o of ok.slice(i, i + 20)) tx.patch(o.id, (p) => p.ifRevisionId(o.rev).set(o.set))
    await tx.commit({autoGenerateArrayKeys: false})
  }
  console.log(`written; backup ${path.relative(process.cwd(), backupFile)}`)
}

if (process.argv[1]?.endsWith('applyTextRewrite.ts')) {
  const [cmd, dir, ...rest] = process.argv.slice(2)
  const onlyArg = rest.indexOf('--only')
  const only = onlyArg >= 0 ? new Set(rest[onlyArg + 1].split(',')) : undefined
  const run =
    cmd === 'export' ? exportDocs(dir, rest) :
    cmd === 'merge' ? Promise.resolve(mergeDocs(dir)) :
    cmd === 'apply' ? apply(dir, rest.includes('--execute'), only) :
    Promise.reject(new Error('usage: applyTextRewrite.ts export|merge|apply <folder> ...'))
  run.catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
