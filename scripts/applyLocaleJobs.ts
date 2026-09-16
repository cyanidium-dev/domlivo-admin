/**
 * Write translated chunks from exportLocaleJobs.ts back into Sanity.
 *
 * Reads <dir>/map.json and every <dir>/chunk-NN.<locale>.json. A value is only
 * written where the field still has no text in that locale — a translation made
 * meanwhile in Studio wins. Properties and CMS documents alike; one patch per
 * document, backups of every touched document first.
 *
 * Run:
 *   npx tsx scripts/applyLocaleJobs.ts --locale de            (dry run: counts and 10 samples)
 *   npx tsx scripts/applyLocaleJobs.ts --locale de --execute
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {buildRichArray, isBlockArray, type Block} from './lib/richTextJobs'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const args = process.argv.slice(2)
const arg = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : '')
const locale = arg('--locale')
const execute = args.includes('--execute')
const dir = path.resolve(process.cwd(), arg('--dir') || `reports/locale-jobs-${locale}`)
if (!locale || !fs.existsSync(path.join(dir, 'map.json'))) {
  console.error('--locale <code> required, and map.json must exist in ' + dir)
  process.exit(1)
}

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN?.trim(),
})

type Target = {id: string; field: string; item?: string}

/** Reads `a.b[2].c` and keyed paths like `pageSections[_key=="x"].content.en`. */
function getPath(doc: unknown, field: string): unknown {
  let cur: unknown = doc
  const re = /([^.[\]]+)|\[_key=="([^"]+)"\]|\[(\d+)\]/g
  for (let m = re.exec(field); m; m = re.exec(field)) {
    if (cur == null) return undefined
    if (m[1] !== undefined) cur = (cur as Record<string, unknown>)[m[1]]
    else if (m[2] !== undefined) cur = Array.isArray(cur) ? cur.find((x) => (x as {_key?: string})?._key === m[2]) : undefined
    else cur = Array.isArray(cur) ? cur[Number(m[3])] : undefined
  }
  return cur
}

async function main() {
  const map = JSON.parse(fs.readFileSync(path.join(dir, 'map.json'), 'utf8')) as Record<string, Target[]>
  const translated: Record<string, string> = {}
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(`.${locale}.json`)).sort()
  for (const f of files) {
    const src = JSON.parse(fs.readFileSync(path.join(dir, f.replace(`.${locale}.json`, '.src.json')), 'utf8')) as Record<string, string>
    const out = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as Record<string, string>
    const missing = Object.keys(src).filter((k) => typeof out[k] !== 'string' || !out[k].trim())
    if (missing.length) console.log(`  ${f}: ${missing.length} keys untranslated (${missing.slice(0, 5).join(', ')}) — skipped`)
    for (const [k, v] of Object.entries(out)) if (k in src && typeof v === 'string' && v.trim()) translated[k] = v.trim()
  }

  const richPath = path.join(dir, 'rich.json')
  const rich = fs.existsSync(richPath) ? (JSON.parse(fs.readFileSync(richPath, 'utf8')) as Record<string, {from: string; refs: string[]}>) : {}
  const perDoc = new Map<string, Record<string, unknown>>()
  const richParts = new Map<string, Record<string, string>>()
  for (const [key, text] of Object.entries(translated)) {
    for (const t of map[key] ?? []) {
      if (t.item) {
        const parts = richParts.get(`${t.id}::${t.field}`) ?? {}
        parts[t.item] = text
        richParts.set(`${t.id}::${t.field}`, parts)
        continue
      }
      const set = perDoc.get(t.id) ?? {}
      set[`${t.field}.${locale}`] = text
      perDoc.set(t.id, set)
    }
  }
  for (const jobKey of Object.keys(rich)) {
    const id = jobKey.split('::')[0]
    if (!perDoc.has(id)) perDoc.set(id, {})
  }
  const ids = [...perDoc.keys()]
  const docs = new Map<string, Record<string, unknown>>()
  for (let i = 0; i < ids.length; i += 100) {
    for (const d of await client.fetch<Record<string, unknown>[]>(`*[_id in $ids]`, {ids: ids.slice(i, i + 100)})) docs.set(String(d._id), d)
  }

  let values = 0
  let skipped = 0
  let richFailed = 0
  const plan: Array<{id: string; rev: string; set: Record<string, unknown>}> = []
  for (const [id, set] of perDoc) {
    const doc = docs.get(id)
    if (!doc) continue
    const fresh: Record<string, unknown> = {}
    for (const [p, text] of Object.entries(set)) {
      const current = getPath(doc, p)
      if (typeof current === 'string' && current.trim()) {
        skipped += 1
        continue
      }
      fresh[p] = text
    }
    for (const [jobKey, job] of Object.entries(rich)) {
      const sep = jobKey.indexOf('::')
      if (jobKey.slice(0, sep) !== id) continue
      const field = jobKey.slice(sep + 2)
      if (isBlockArray(getPath(doc, field))) {
        skipped += 1
        continue
      }
      const source = getPath(doc, field.slice(0, -locale.length) + job.from)
      try {
        if (!isBlockArray(source)) throw new Error('source array missing')
        fresh[field] = buildRichArray(source as Block[], richParts.get(jobKey) ?? {}, locale)
      } catch (err) {
        richFailed += 1
        console.log(`  ! ${jobKey}: ${err instanceof Error ? err.message : err}`)
      }
    }
    if (Object.keys(fresh).length) {
      plan.push({id, rev: String(doc._rev), set: fresh})
      values += Object.keys(fresh).length
    }
  }
  console.log(`${files.length} translated chunks, ${Object.keys(translated).length} texts → ${values} values in ${plan.length} documents (${skipped} already filled, left alone; ${richFailed} rich-text fields incomplete)`)
  for (const p of plan.slice(0, 10)) {
    const [k, v] = Object.entries(p.set)[0]
    console.log(`  ${p.id} ${k}: ${(typeof v === 'string' ? v : JSON.stringify(v)).slice(0, 90)}`)
  }
  if (!execute) {
    console.log('\nDry run — pass --execute to write.')
    return
  }
  const backup = path.resolve(process.cwd(), `scripts/data/backups/localeJobs-${locale}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  fs.mkdirSync(path.dirname(backup), {recursive: true})
  fs.writeFileSync(backup, JSON.stringify(plan.map((p) => docs.get(p.id)), null, 1))
  let done = 0
  for (let i = 0; i < plan.length; i += 50) {
    const tx = client.transaction()
    for (const p of plan.slice(i, i + 50)) tx.patch(p.id, (patch) => patch.ifRevisionId(p.rev).set(p.set))
    await tx.commit()
    done += Math.min(50, plan.length - i)
    console.log(`  ${done}/${plan.length}`)
  }
  console.log(`wrote ${values} values; backup ${backup}`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
