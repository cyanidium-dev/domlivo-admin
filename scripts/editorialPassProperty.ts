/**
 * Recomposes a listing's editorial copy from its own source ad.
 *
 * Four Dato-imported listings never got real copy: their `description` in
 * en / sq / it is the template filler *"Property for sale in X, Albania.
 * Price: … Area: … Bedrooms: …"*, with the Albanian a verbatim copy of the
 * English. The real listing text sits in `description.ru`, untranslated.
 *
 * That description is what the property page renders and what feeds the meta
 * description, the OG description and the JSON-LD, so the filler is the copy a
 * search result shows.
 *
 * This sends the Russian source through the same `/api/studio-parse` endpoint
 * the Studio ✨ Parse action uses, and writes back **only** the editorial
 * fields — `title`, `shortDescription`, `description`. Price, area, refs,
 * gallery and everything else are left exactly as they are: this is a copy
 * pass, not a re-import.
 *
 * The parse prompt carries the F7 rules, so contacts, seller commentary and
 * prices stay out of the composed text.
 *
 * Run:
 * - npm run editorial:property -- --slug <slug>              (dry)
 * - npm run editorial:property -- --slug <slug> --execute
 */

import path from 'node:path'
import fs from 'node:fs'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const args = process.argv.slice(2)
const execute = args.includes('--execute')

function flag(name: string): string {
  const inline = args.find((a) => a.startsWith(`--${name}=`))
  if (inline) return inline.slice(name.length + 3)
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : ''
}

const slug = flag('slug')
const LOCALES = ['en', 'sq', 'ru', 'uk', 'it'] as const
const EDITORIAL = ['title', 'shortDescription', 'description'] as const

const base = (process.env.SANITY_STUDIO_AI_API_URL ?? '').trim().replace(/\/+$/, '')
const secret = (process.env.SANITY_STUDIO_AI_API_SECRET ?? '').trim()

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

type LocaleMap = Record<string, string>

/** The template that says nothing a buyer wants to know. */
const FILLER =
  /(Property for (sale|rent) in|Immobile in (vendita|affitto) a|Prona (në shitje|me qira))/i

async function main(): Promise<void> {
  if (!slug) throw new Error('--slug is required')
  if (!base || !secret) throw new Error('SANITY_STUDIO_AI_API_URL / _SECRET missing from cms/.env')

  const doc = await client.fetch(`*[_type=="property" && slug.current==$slug][0]`, {slug})
  if (!doc) throw new Error(`${slug} not found`)

  // The source of truth is whichever locale holds the real ad rather than the
  // template. ru first — that is where the Dato import left the original.
  const source = ['ru', 'uk', 'en'].find((l) => {
    const text = String((doc.description as LocaleMap)?.[l] ?? '')
    return text.length > 200 && !FILLER.test(text)
  })
  if (!source) throw new Error(`no locale of ${slug}.description holds a real source ad`)

  const text = String((doc.description as LocaleMap)[source])
  console.log(`source: description.${source} (${text.length} chars)\n`)

  const res = await fetch(`${base}/api/studio-parse`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-studio-secret': secret,
      origin: 'https://domlivo-admin.vercel.app',
    },
    body: JSON.stringify({text, locales: [...LOCALES]}),
  })
  if (!res.ok) throw new Error(`studio-parse ${res.status}: ${await res.text()}`)
  const json = (await res.json()) as {
    parsed: {editorial: Record<string, LocaleMap>; parserNotes: string}
    validation: {priceEur: number | null; warnings: string[]}
  }

  const editorial = json.parsed.editorial
  if (json.parsed.parserNotes) console.log(`parserNotes: ${json.parsed.parserNotes}\n`)
  if (json.validation.warnings?.length) {
    console.log(`warnings: ${json.validation.warnings.join(' | ')}\n`)
  }

  const patch: Record<string, unknown> = {}
  for (const field of EDITORIAL) {
    const next = editorial[field]
    if (!next) continue
    const before = (doc[field] ?? {}) as LocaleMap
    const merged: LocaleMap = {...before}
    let touched = false
    for (const locale of LOCALES) {
      const value = (next[locale] ?? '').trim()
      if (!value || value === before[locale]) continue
      merged[locale] = value
      touched = true
      console.log(`=== ${field}.${locale} ===`)
      console.log(`--- before ---\n${before[locale] ?? '(empty)'}`)
      console.log(`--- after ---\n${value}\n`)
    }
    if (touched) patch[field] = merged
  }

  // The price is never taken from a parse here. The source ad may not state
  // one, and the price field has already been settled separately.
  console.log(
    `price left at €${doc.price} (parse read ${json.validation.priceEur ?? 'nothing'} — not applied)`,
  )
  console.log(`\n${Object.keys(patch).length} field(s) to write: ${Object.keys(patch).join(', ')}`)

  if (!execute) {
    console.log('Dry run. Re-run with --execute to write.')
    return
  }
  if (Object.keys(patch).length === 0) {
    console.log('Nothing to write.')
    return
  }

  const dir = path.resolve(process.cwd(), 'scripts/data')
  fs.mkdirSync(dir, {recursive: true})
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const file = path.join(dir, `editorialPass-${slug}-${stamp}.json`)
  fs.writeFileSync(
    file,
    JSON.stringify(
      {_id: doc._id, title: doc.title, shortDescription: doc.shortDescription, description: doc.description},
      null,
      2,
    ),
    'utf8',
  )
  console.log(`snapshot written to ${file}`)

  await client.patch(doc._id).set(patch).commit()
  console.log('written')
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
