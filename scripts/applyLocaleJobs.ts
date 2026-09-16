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

type Target = {id: string; field: string}

function getPath(doc: unknown, field: string): unknown {
  let cur: unknown = doc
  for (const p of field.split(/\.|\[|\]/).filter(Boolean)) {
    if (cur == null) return undefined
    cur = (cur as Record<string, unknown>)[p]
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

  const perDoc = new Map<string, Record<string, string>>()
  for (const [key, text] of Object.entries(translated)) {
    for (const t of map[key] ?? []) {
      const set = perDoc.get(t.id) ?? {}
      set[`${t.field}.${locale}`] = text
      perDoc.set(t.id, set)
    }
  }
  const ids = [...perDoc.keys()]
  const docs = new Map<string, Record<string, unknown>>()
  for (let i = 0; i < ids.length; i += 100) {
    for (const d of await client.fetch<Record<string, unknown>[]>(`*[_id in $ids]`, {ids: ids.slice(i, i + 100)})) docs.set(String(d._id), d)
  }

  let values = 0
  let skipped = 0
  const plan: Array<{id: string; rev: string; set: Record<string, string>}> = []
  for (const [id, set] of perDoc) {
    const doc = docs.get(id)
    if (!doc) continue
    const fresh: Record<string, string> = {}
    for (const [p, text] of Object.entries(set)) {
      const current = getPath(doc, p)
      if (typeof current === 'string' && current.trim()) {
        skipped += 1
        continue
      }
      fresh[p] = text
    }
    if (Object.keys(fresh).length) {
      plan.push({id, rev: String(doc._rev), set: fresh})
      values += Object.keys(fresh).length
    }
  }
  console.log(`${files.length} translated chunks, ${Object.keys(translated).length} texts → ${values} values in ${plan.length} documents (${skipped} already filled, left alone)`)
  for (const p of plan.slice(0, 10)) {
    const [k, v] = Object.entries(p.set)[0]
    console.log(`  ${p.id} ${k}: ${v.slice(0, 90)}`)
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
