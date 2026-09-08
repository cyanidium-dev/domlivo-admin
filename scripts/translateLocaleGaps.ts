/**
 * Fill the locale gaps the audit finds (scripts/auditLocaleGaps.ts) with
 * Claude translations, from the English text (Albanian when English is the
 * one missing).
 *
 * What gets written:
 *  - every missing locale of a localized field;
 *  - a locale whose text is byte-identical to the English one, when the
 *    English is a sentence (≥ 25 characters) — "Blog", "Home", "Telegram"
 *    are the same word in most languages and stay.
 * What is left alone: slugs, hrefs, e-mails, phone numbers, brand fields,
 * zoneMetrics notes (internal), and any locale a landing page excludes
 * through its `locales` field. Existing translations are never overwritten.
 *
 * Content policy: these are machine translations. They fix a Polish visitor
 * reading English, and the Albanian ones are marked in the report as
 * pending native review — CONTENT-OPS still wants sq read by a native.
 *
 * Run:
 * - npx tsx scripts/translateLocaleGaps.ts --dry
 * - npx tsx scripts/translateLocaleGaps.ts --execute [--types city,district] [--limit 20]
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {askJson, costUsd, LOCALE_NAMES, mapLimit, usage} from './lib/claudeTranslate'
import {collectGaps, LOCALES, type Gap} from './auditLocaleGaps'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN?.trim(),
})

const args = process.argv.slice(2)
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')
const typesArg = args.includes('--types') ? args[args.indexOf('--types') + 1].split(',') : null
const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : 0
if (!isDry && !isExecute) {
  console.error('Use --dry or --execute.')
  process.exit(1)
}

const TYPES = [
  'siteSettings',
  'city',
  'district',
  'propertyType',
  'amenity',
  'catalogSeoPage',
  'landingPage',
  'agent',
  'developer',
  'blogCategory',
  'blogAuthor',
]
const SKIP_FIELD = /(^|\.)(slug|href|url|email|phone|siteName|brandName|copyrightText)(\.|$|\[)/i
const SENTENCE_MIN = 25
const BATCH_CHARS = 6000

type Task = {id: string; type: string; field: string; source: string; sourceLocale: string; targets: string[]}

function getPath(doc: unknown, field: string): Record<string, unknown> | null {
  const parts = field.split(/\.|\[|\]/).filter(Boolean)
  let cur: unknown = doc
  for (const p of parts) {
    if (cur == null) return null
    cur = (cur as Record<string, unknown>)[p]
  }
  return cur && typeof cur === 'object' ? (cur as Record<string, unknown>) : null
}

function tasksFor(doc: Record<string, unknown>, gaps: Gap[]): Task[] {
  const allowed: string[] | null = Array.isArray(doc.locales) && doc.locales.length ? (doc.locales as string[]) : null
  const out: Task[] = []
  for (const g of gaps) {
    if (SKIP_FIELD.test(g.field)) continue
    const obj = getPath(doc, g.field)
    if (!obj) continue
    const en = typeof obj.en === 'string' ? obj.en.trim() : ''
    const sq = typeof obj.sq === 'string' ? obj.sq.trim() : ''
    const ru = typeof obj.ru === 'string' ? obj.ru.trim() : ''
    const source = en || sq || ru
    const sourceLocale = en ? 'en' : sq ? 'sq' : 'ru'
    if (!source) continue
    const targets = new Set<string>()
    for (const l of g.missing) if (l !== sourceLocale) targets.add(l)
    if (source.length >= SENTENCE_MIN) for (const l of g.sameAsEnglish) targets.add(l)
    for (const l of g.wrongScript) if (l !== sourceLocale) targets.add(l)
    const final = [...targets].filter((l) => LOCALES.includes(l as never) && (!allowed || allowed.includes(l)))
    if (final.length) out.push({id: g.id, type: g.type, field: g.field, source, sourceLocale, targets: final})
  }
  return out
}

const SYSTEM = `Task: translate website copy fields. The user message is a JSON object: each key is a field id, each value has "source" (text), "from" (source language code) and "to" (array of target language codes). Reply with a JSON object keyed by the same field ids; each value is an object keyed by target language code with the translated string. Titles stay titles (short, no trailing period); descriptions stay descriptions.`

async function main() {
  const types = typesArg ?? TYPES
  const docs = await client.fetch<Record<string, unknown>[]>(
    `*[_type in $types && !(_id in path("drafts.**")) && (isPublished != false)]`,
    {types},
  )
  let tasks: Task[] = []
  for (const doc of docs) {
    const gaps = collectGaps(doc, String(doc._type), String(doc._id))
    tasks.push(...tasksFor(doc, gaps))
  }
  if (limit > 0) tasks = tasks.slice(0, limit)
  const chars = tasks.reduce((n, t) => n + t.source.length, 0)
  const values = tasks.reduce((n, t) => n + t.targets.length, 0)
  const perLocale: Record<string, number> = {}
  for (const t of tasks) for (const l of t.targets) perLocale[l] = (perLocale[l] ?? 0) + 1
  console.log(`${tasks.length} fields across ${new Set(tasks.map((t) => t.id)).size} documents → ${values} locale values`)
  console.log(`source text ${chars} characters; per locale ${JSON.stringify(perLocale)}`)
  if (isDry) {
    for (const t of tasks.slice(0, 25)) console.log(`  ${t.type} ${t.id} ${t.field} [${t.sourceLocale}→${t.targets.join(',')}] "${t.source.slice(0, 60)}"`)
    if (tasks.length > 25) console.log(`  … and ${tasks.length - 25} more`)
    console.log('\nDry run — nothing sent, nothing written.')
    return
  }

  // Batch by character budget, one document's fields kept together when possible.
  const batches: Task[][] = []
  let cur: Task[] = []
  let curChars = 0
  for (const t of tasks) {
    if (cur.length && curChars + t.source.length > BATCH_CHARS) {
      batches.push(cur)
      cur = []
      curChars = 0
    }
    cur.push(t)
    curChars += t.source.length
  }
  if (cur.length) batches.push(cur)
  console.log(`${batches.length} requests`)

  const results = new Map<string, Record<string, string>>()
  await mapLimit(batches, 4, async (batch, i) => {
    const payload: Record<string, {source: string; from: string; to: string[]}> = {}
    batch.forEach((t, j) => {
      payload[`f${j}`] = {source: t.source, from: LOCALE_NAMES[t.sourceLocale], to: t.targets}
    })
    const reply = await askJson(SYSTEM, JSON.stringify(payload))
    batch.forEach((t, j) => {
      const got = reply[`f${j}`]
      if (got && typeof got === 'object') results.set(`${t.id}::${t.field}`, got as Record<string, string>)
    })
    console.log(`  batch ${i + 1}/${batches.length} done (${batch.length} fields)`)
  })

  const report: Array<{id: string; field: string; locale: string; text: string}> = []
  const perDoc = new Map<string, Record<string, string>>()
  for (const t of tasks) {
    const got = results.get(`${t.id}::${t.field}`)
    if (!got) continue
    const set = perDoc.get(t.id) ?? {}
    for (const l of t.targets) {
      const text = typeof got[l] === 'string' ? got[l].trim() : ''
      if (!text) continue
      set[`${t.field}.${l}`] = text
      report.push({id: t.id, field: t.field, locale: l, text})
    }
    perDoc.set(t.id, set)
  }
  let written = 0
  for (const [id, set] of perDoc) {
    if (!Object.keys(set).length) continue
    await client.patch(id).set(set).commit()
    written += Object.keys(set).length
  }
  const reportPath = path.resolve(process.cwd(), `reports/locale-gaps-translated-${new Date().toISOString().slice(0, 10)}.json`)
  fs.mkdirSync(path.dirname(reportPath), {recursive: true})
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\nwrote ${written} locale values into ${perDoc.size} documents; report ${reportPath}`)
  console.log(`Claude: ${usage.calls} calls, ${usage.input} in / ${usage.output} out tokens ≈ $${costUsd(usage)}. Albanian values are pending native review.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
