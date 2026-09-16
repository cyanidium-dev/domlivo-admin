/**
 * Export everything that still lacks one locale as plain JSON, for translation
 * outside any API — by hand or in a chat — and write it back with
 * applyLocaleJobs.ts. The API-driven fillers (translateLocaleGaps,
 * translateProperties) stay for when that is wanted; this is the no-API path.
 *
 * Output in --out (default reports/locale-jobs-<locale>/):
 * - map.json          key → every {id, field} that takes this text (identical
 *                     sources are sent once: district FAQs repeat a lot)
 * - chunk-NN.src.json {"key": "source text", …}, about --chunk-chars characters each
 * Translate each chunk into chunk-NN.<locale>.json with the same keys.
 *
 * Run:
 *   npx tsx scripts/exportLocaleJobs.ts --locale de [--types city,district] [--page-types home,city] [--properties] [--chunk-chars 12000]
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {collectGaps, LOCALES} from './auditLocaleGaps'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const args = process.argv.slice(2)
const arg = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : '')
const locale = arg('--locale')
if (!LOCALES.includes(locale as never)) {
  console.error(`--locale must be one of ${LOCALES.join(', ')}`)
  process.exit(1)
}
const types = arg('--types') ? arg('--types').split(',') : ['siteSettings', 'city', 'district', 'propertyType', 'amenity', 'catalogSeoPage', 'landingPage']
const pageTypes = arg('--page-types') ? arg('--page-types').split(',') : null
const withProperties = args.includes('--properties')
const chunkChars = Number(arg('--chunk-chars') || 12000)
const outDir = path.resolve(process.cwd(), arg('--out') || `reports/locale-jobs-${locale}`)

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN?.trim(),
})

const SKIP_FIELD = /(^|\.)(slug|href|url|email|phone|siteName|brandName|copyrightText)(\.|$|\[)/i

type Target = {id: string; field: string}

function getPath(doc: unknown, field: string): Record<string, unknown> | null {
  let cur: unknown = doc
  for (const p of field.split(/\.|\[|\]/).filter(Boolean)) {
    if (cur == null) return null
    cur = (cur as Record<string, unknown>)[p]
  }
  return cur && typeof cur === 'object' ? (cur as Record<string, unknown>) : null
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

async function main() {
  const bySource = new Map<string, Target[]>()
  const add = (source: string, target: Target) => {
    const list = bySource.get(source) ?? []
    list.push(target)
    bySource.set(source, list)
  }

  const docs = await client.fetch<Record<string, unknown>[]>(
    `*[_type in $types && !(_id in path("drafts.**")) && (isPublished != false) && ($pageTypes == null || _type != "landingPage" || pageType in $pageTypes)]`,
    {types, pageTypes},
  )
  for (const doc of docs) {
    const scope = Array.isArray(doc.locales) && doc.locales.length ? (doc.locales as string[]) : null
    if (scope && !scope.includes(locale)) continue
    for (const g of collectGaps(doc, String(doc._type), String(doc._id))) {
      if (SKIP_FIELD.test(g.field) || !g.missing.includes(locale as never)) continue
      const obj = getPath(doc, g.field)
      const source = obj ? str(obj.en) || str(obj.sq) : ''
      if (source) add(source, {id: String(doc._id), field: g.field})
    }
  }

  if (withProperties) {
    const rows = await client.fetch<Array<Record<string, any>>>(
      `*[_type == "property" && isPublished == true && !(_id in path("drafts.**"))]{_id, title, shortDescription, description}`,
    )
    for (const row of rows) {
      for (const field of ['title', 'shortDescription', 'description']) {
        const v = row[field] ?? {}
        if (str(v[locale])) continue
        // English is the edited copy (partner and get.al listings were rewritten
        // into it); Albanian only where English is missing or still the import copy.
        const source = str(v.en) && str(v.en) !== str(v.sq) ? str(v.en) : str(v.sq) || str(v.en)
        if (source) add(source, {id: row._id, field})
      }
    }
  }

  fs.rmSync(outDir, {recursive: true, force: true})
  fs.mkdirSync(outDir, {recursive: true})
  const map: Record<string, Target[]> = {}
  const chunks: Array<Record<string, string>> = []
  let cur: Record<string, string> = {}
  let curChars = 0
  let k = 0
  // Longest first inside each type keeps a chunk's size predictable.
  for (const [source, targets] of [...bySource.entries()].sort((a, b) => a[1][0].id.localeCompare(b[1][0].id))) {
    const key = `k${k++}`
    map[key] = targets
    if (curChars && curChars + source.length > chunkChars) {
      chunks.push(cur)
      cur = {}
      curChars = 0
    }
    cur[key] = source
    curChars += source.length
  }
  if (curChars) chunks.push(cur)
  fs.writeFileSync(path.join(outDir, 'map.json'), JSON.stringify(map, null, 1))
  chunks.forEach((c, i) => fs.writeFileSync(path.join(outDir, `chunk-${String(i).padStart(2, '0')}.src.json`), JSON.stringify(c, null, 1)))
  const chars = [...bySource.keys()].reduce((n, s) => n + s.length, 0)
  const fields = [...bySource.values()].reduce((n, t) => n + t.length, 0)
  console.log(`${fields} fields → ${bySource.size} distinct texts, ${chars} characters, ${chunks.length} chunks in ${outDir}`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
