/**
 * Where does the site fall back to English?
 *
 * Walks every published document of the content types the site renders and
 * reports each localized field (an object keyed by locale ids) that is
 * missing a locale, or whose non-English value is byte-identical to the
 * English one — which is what "Browse properties in Durres…" on the Polish
 * catalogue page looks like from the inside.
 *
 * Run:
 * - npx tsx scripts/auditLocaleGaps.ts               (summary per type)
 * - npx tsx scripts/auditLocaleGaps.ts --verbose     (every field)
 * - npx tsx scripts/auditLocaleGaps.ts --json out.json
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN?.trim(),
})

const args = process.argv.slice(2)
const verbose = args.includes('--verbose')
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : ''

export const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl'] as const
type Locale = (typeof LOCALES)[number]
const LOCALE_SET = new Set<string>(LOCALES)

/** Content types the public site renders. Properties are audited separately. */
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
  'zoneMetrics',
]

export type Gap = {
  id: string
  type: string
  field: string
  missing: Locale[]
  sameAsEnglish: Locale[]
  /** Locales whose text looks like the wrong script (Cyrillic where Latin belongs, or the reverse). */
  wrongScript: Locale[]
}

function isLocalizedObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const keys = Object.keys(value).filter((k) => !k.startsWith('_'))
  if (keys.length === 0) return false
  return keys.every((k) => LOCALE_SET.has(k)) && keys.some((k) => typeof (value as Record<string, unknown>)[k] === 'string')
}

function scriptWrong(locale: Locale, text: string): boolean {
  const t = text.trim()
  if (!t) return false
  const cyr = (t.match(/[Ѐ-ӿ]/g) ?? []).length
  const lat = (t.match(/[A-Za-z]/g) ?? []).length
  if (locale === 'ru' || locale === 'uk') return cyr === 0 && lat > 3
  return lat === 0 && cyr > 3
}

export function collectGaps(doc: Record<string, unknown>, type: string, id: string): Gap[] {
  const gaps: Gap[] = []
  const walk = (value: unknown, pathName: string) => {
    if (isLocalizedObject(value)) {
      const en = typeof value.en === 'string' ? value.en.trim() : ''
      const present = (l: Locale) => typeof value[l] === 'string' && (value[l] as string).trim().length > 0
      const missing = LOCALES.filter((l) => !present(l))
      const sameAsEnglish = LOCALES.filter(
        (l) => l !== 'en' && present(l) && en && (value[l] as string).trim() === en,
      )
      const wrongScript = LOCALES.filter((l) => present(l) && scriptWrong(l, value[l] as string))
      if (missing.length || sameAsEnglish.length || wrongScript.length) {
        gaps.push({id, type, field: pathName, missing, sameAsEnglish, wrongScript})
      }
      return
    }
    if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, `${pathName}[${i}]`))
      return
    }
    if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) {
        if (k.startsWith('_')) continue
        walk(v, pathName ? `${pathName}.${k}` : k)
      }
    }
  }
  walk(doc, '')
  return gaps
}

async function main() {
  const docs = await client.fetch<Record<string, unknown>[]>(
    `*[_type in $types && !(_id in path("drafts.**")) && (isPublished != false)]`,
    {types: TYPES},
  )
  const all: Gap[] = []
  for (const doc of docs) {
    all.push(...collectGaps(doc, String(doc._type), String(doc._id)))
  }
  const byType = new Map<string, {docs: number; fields: number; missing: Record<string, number>; same: Record<string, number>; script: number}>()
  for (const t of TYPES) byType.set(t, {docs: docs.filter((d) => d._type === t).length, fields: 0, missing: {}, same: {}, script: 0})
  for (const g of all) {
    const row = byType.get(g.type)!
    row.fields += 1
    for (const l of g.missing) row.missing[l] = (row.missing[l] ?? 0) + 1
    for (const l of g.sameAsEnglish) row.same[l] = (row.same[l] ?? 0) + 1
    if (g.wrongScript.length) row.script += 1
  }
  console.log(`${docs.length} published documents, ${all.length} localized fields with gaps\n`)
  for (const [t, row] of byType) {
    if (row.docs === 0) continue
    const miss = Object.entries(row.missing).map(([l, n]) => `${l}:${n}`).join(' ') || '—'
    const same = Object.entries(row.same).map(([l, n]) => `${l}:${n}`).join(' ') || '—'
    console.log(`${t.padEnd(16)} docs ${String(row.docs).padStart(3)} | fields with gaps ${String(row.fields).padStart(4)} | missing ${miss} | same-as-en ${same} | wrong script ${row.script}`)
  }
  if (verbose) {
    console.log('')
    for (const g of all) {
      console.log(`${g.type} ${g.id} ${g.field}: missing[${g.missing.join(',')}] same-as-en[${g.sameAsEnglish.join(',')}] script[${g.wrongScript.join(',')}]`)
    }
  }
  if (jsonOut) {
    fs.writeFileSync(jsonOut, JSON.stringify(all, null, 2))
    console.log(`\nwritten ${jsonOut}`)
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
