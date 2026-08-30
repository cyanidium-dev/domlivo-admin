/**
 * Fills the missing locales on `amenity.title` (and `description` when it has
 * any text) through the same endpoint the 🌐 Translate action uses.
 *
 * Amenity titles are catalog filter chips: a locale with no text falls back to
 * another language mid-list, which is how the catalogue ended up showing
 * English chips to Italian visitors. Same job as
 * `backfillDistrictTitleIt.ts`, for a document type that acquired the gap the
 * same way.
 *
 * Only empty locales are written — an existing translation is never touched,
 * with or without this script. The English text is the source; an amenity with
 * no English title is skipped and reported.
 *
 * Run:
 * - npm run backfill:amenity-locales           (dry)
 * - npm run backfill:amenity-locales -- --execute
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {PROJECT_LOCALE_IDS} from '../lib/sanity/localizedPaste/projectLocales'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.slice(2).includes('--execute')

const base = (process.env.SANITY_STUDIO_AI_API_URL ?? '').trim().replace(/\/+$/, '')
const secret = (process.env.SANITY_STUDIO_AI_API_SECRET ?? '').trim()

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

type LocaleMap = Partial<Record<string, string>>
type Amenity = {_id: string; title?: LocaleMap; description?: LocaleMap}

async function translate(
  items: Array<{key: string; kind: 'string' | 'text'; text: string}>,
): Promise<Map<string, Record<string, string>>> {
  const out = new Map<string, Record<string, string>>()
  // The endpoint caps a request at 25 items (measured — see MAX_TRANSLATE_ITEMS);
  // amenities are short, so chunking on the item count alone is enough here.
  for (let i = 0; i < items.length; i += 25) {
    const batch = items.slice(i, i + 25)
    const res = await fetch(`${base}/api/studio-translate`, {
      method: 'POST',
      headers: {'content-type': 'application/json', 'x-studio-secret': secret, origin: 'https://domlivo-admin.vercel.app'},
      body: JSON.stringify({sourceLang: 'en', items: batch, locales: [...PROJECT_LOCALE_IDS]}),
    })
    if (!res.ok) throw new Error(`studio-translate ${res.status}: ${await res.text()}`)
    const json = (await res.json()) as {items: Array<{key: string; locales: Record<string, string>}>}
    for (const item of json.items) out.set(item.key, item.locales)
  }
  return out
}

async function main(): Promise<void> {
  if (!base || !secret) {
    console.error('SANITY_STUDIO_AI_API_URL / _SECRET missing from cms/.env')
    process.exit(1)
  }

  const amenities: Amenity[] = await client.fetch(`*[_type == "amenity"]{_id, title, description} | order(_id)`)
  const items: Array<{key: string; kind: 'string' | 'text'; text: string}> = []
  const gaps = new Map<string, {field: 'title' | 'description'; missing: string[]}[]>()

  for (const a of amenities) {
    for (const field of ['title', 'description'] as const) {
      const map = (a[field] ?? {}) as LocaleMap
      const en = (map.en ?? '').trim()
      if (!en) continue
      const missing = PROJECT_LOCALE_IDS.filter((l) => !(map[l] ?? '').trim())
      if (missing.length === 0) continue
      items.push({key: `${a._id}::${field}`, kind: field === 'title' ? 'string' : 'text', text: en})
      gaps.set(a._id, [...(gaps.get(a._id) ?? []), {field, missing}])
    }
  }

  const noEnglish = amenities.filter((a) => !((a.title?.en ?? '') as string).trim()).map((a) => a._id)
  if (noEnglish.length) console.log(`Skipped, no English title to translate from: ${noEnglish.join(', ')}`)

  if (items.length === 0) {
    console.log('Every amenity already has all five locales.')
    return
  }

  console.log(`${items.length} field(s) with gaps across ${gaps.size} amenity document(s):`)
  for (const [id, fields] of gaps) {
    console.log(`  ${id}: ${fields.map((f) => `${f.field} → ${f.missing.join(', ')}`).join(' · ')}`)
  }

  if (!execute) {
    console.log('\nDry run — nothing written. Re-run with --execute.')
    return
  }

  const translated = await translate(items)
  let tx = client.transaction()
  let written = 0
  for (const [id, fields] of gaps) {
    const set: Record<string, string> = {}
    for (const {field, missing} of fields) {
      const locales = translated.get(`${id}::${field}`)
      if (!locales) continue
      for (const locale of missing) {
        const value = (locales[locale] ?? '').trim()
        if (!value) continue
        set[`${field}.${locale}`] = value
        written += 1
      }
    }
    if (Object.keys(set).length > 0) tx = tx.patch(id, (p) => p.set(set))
  }
  await tx.commit()
  console.log(`\nWrote ${written} locale value(s) across ${gaps.size} amenity document(s).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
