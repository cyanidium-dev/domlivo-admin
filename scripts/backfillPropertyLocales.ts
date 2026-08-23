/**
 * Fills empty locales on `property.title`, `shortDescription` and
 * `description` through the endpoint the 🌐 Translate action uses.
 *
 * Italian joined the site after most listings were written, so 32 of them show
 * an Italian visitor whatever the fallback picks. This is the bulk version of
 * pressing Translate on each one — same libs, same fill-empty-only rule, an
 * existing translation is never touched.
 *
 * Requests are chunked with `chunkTranslateItems`, the same packer the Studio
 * dialog uses, because descriptions are long enough that a whole catalogue
 * clears the endpoint's 20 000-character cap several times over.
 *
 * The English text is the source. A field with no English is skipped and
 * reported rather than translated from a guess.
 *
 * Run:
 * - npm run backfill:property-locales                  (dry)
 * - npm run backfill:property-locales -- --execute
 * - npm run backfill:property-locales -- --locale it   (limit to one locale)
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {chunkTranslateItems, type TranslateRequestItem} from '../lib/studioAi/applyTranslations'
import {PROJECT_LOCALE_IDS} from '../lib/sanity/localizedPaste/projectLocales'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const args = process.argv.slice(2)
const execute = args.includes('--execute')
const onlyLocale =
  args.find((a) => a.startsWith('--locale='))?.split('=')[1] ??
  (args.includes('--locale') ? args[args.indexOf('--locale') + 1] : '')

const base = (process.env.SANITY_STUDIO_AI_API_URL ?? '').trim().replace(/\/+$/, '')
const secret = (process.env.SANITY_STUDIO_AI_API_SECRET ?? '').trim()
const MAX_ITEMS = 25
const MAX_CHARS = Math.max(1_000, Math.floor(24_000 / PROJECT_LOCALE_IDS.length))

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

const FIELDS = [
  {name: 'title', kind: 'string' as const},
  {name: 'shortDescription', kind: 'text' as const},
  {name: 'description', kind: 'text' as const},
]

type Row = {_id: string} & Record<string, unknown>

async function main(): Promise<void> {
  if (!base || !secret) {
    console.error('SANITY_STUDIO_AI_API_URL / _SECRET missing from cms/.env')
    process.exit(1)
  }
  const wanted = onlyLocale ? PROJECT_LOCALE_IDS.filter((l) => l === onlyLocale) : [...PROJECT_LOCALE_IDS]
  if (wanted.length === 0) {
    console.error(`--locale ${onlyLocale} is not one of ${PROJECT_LOCALE_IDS.join(', ')}`)
    process.exit(1)
  }

  const rows: Row[] = await client.fetch(
    `*[_type == "property"]{_id, title, shortDescription, description} | order(_id)`,
  )

  const items: TranslateRequestItem[] = []
  const gaps = new Map<string, string[]>() // "id::field" -> missing locales
  const noEnglish: string[] = []

  for (const row of rows) {
    for (const field of FIELDS) {
      const map = (row[field.name] ?? {}) as Record<string, string>
      const en = (map.en ?? '').trim()
      const missing = wanted.filter((l) => l !== 'en' && !(map[l] ?? '').trim())
      if (missing.length === 0) continue
      if (!en) {
        noEnglish.push(`${row._id}.${field.name}`)
        continue
      }
      items.push({key: `${row._id}::${field.name}`, kind: field.kind, text: en})
      gaps.set(`${row._id}::${field.name}`, missing)
    }
  }

  const {batches, oversized} = chunkTranslateItems(items, {maxItems: MAX_ITEMS, maxChars: MAX_CHARS})
  const docs = new Set([...gaps.keys()].map((k) => k.split('::')[0]))
  const values = [...gaps.values()].reduce((n, l) => n + l.length, 0)

  console.log(`${gaps.size} field(s) with gaps across ${docs.size} propert(ies) — ${values} locale value(s) to write`)
  console.log(`${batches.length} request(s) of at most ${MAX_ITEMS} items / ${MAX_CHARS} characters`)
  if (noEnglish.length) console.log(`Skipped, no English to translate from: ${noEnglish.join(', ')}`)
  if (oversized.length) console.log(`Too long for any single request: ${oversized.join(', ')}`)
  if (gaps.size === 0) return

  if (!execute) {
    console.log('\nDry run — nothing written. Re-run with --execute.')
    return
  }

  const translated = new Map<string, Record<string, string>>()
  for (const [i, batch] of batches.entries()) {
    const res = await fetch(`${base}/api/studio-translate`, {
      method: 'POST',
      headers: {'content-type': 'application/json', 'x-studio-secret': secret, origin: 'https://domlivo-admin.vercel.app'},
      body: JSON.stringify({sourceLang: 'en', items: batch, locales: [...PROJECT_LOCALE_IDS]}),
    })
    if (!res.ok) throw new Error(`studio-translate ${res.status}: ${await res.text()}`)
    const json = (await res.json()) as {items: Array<{key: string; locales: Record<string, string>}>}
    for (const item of json.items) translated.set(item.key, item.locales)
    console.log(`  batch ${i + 1}/${batches.length}: ${json.items.length} field(s) translated`)
  }

  const perDoc = new Map<string, Record<string, string>>()
  for (const [key, missing] of gaps) {
    const [id, field] = key.split('::') as [string, string]
    const locales = translated.get(key)
    if (!locales) continue
    const set = perDoc.get(id) ?? {}
    for (const locale of missing) {
      const value = (locales[locale] ?? '').trim()
      if (value) set[`${field}.${locale}`] = value
    }
    perDoc.set(id, set)
  }

  let tx = client.transaction()
  let written = 0
  for (const [id, set] of perDoc) {
    if (Object.keys(set).length === 0) continue
    written += Object.keys(set).length
    tx = tx.patch(id, (p) => p.set(set))
  }
  await tx.commit()
  console.log(`\nWrote ${written} locale value(s) across ${perDoc.size} propert(ies).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
