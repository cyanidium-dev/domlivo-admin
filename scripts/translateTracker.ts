/**
 * Runs the same Translate pipeline Studio's "🌐 Translate" document action
 * uses, for a `tracker` document — even though `tracker` isn't in
 * `TRANSLATE_ACTION_TYPES` (so the button doesn't show in Studio for it).
 * `discoverLocalized` is schema-independent (see translateBlogPost.ts's own
 * note on this), and `tracker` has no Portable Text field at all, so the
 * discovery step alone covers everything: title, subject, statusSummary,
 * statusLabel, every timeline[].event, and every sources[].label... except
 * `sources[].label` is a plain `string` in the schema, not localized, so it
 * is correctly left untouched by discovery — same convention as
 * `blogPost.sources[].label`.
 *
 * One-off script, not wired into package.json: this is the only tracker
 * document in the dataset today. If more trackers ship, promote this to a
 * proper `translate:tracker` script (or add `tracker` to
 * TRANSLATE_ACTION_TYPES so Studio's own button covers it directly).
 *
 * Run:
 *   npx tsx scripts/translateTracker.ts <doc-id> [--base=en] [--overwrite] [--execute]
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {discoverLocalized} from '../lib/studioAi/discoverLocalized'
import {
  buildTranslateItems,
  chunkTranslateItems,
  decideTranslationSets,
  type TranslateRequestItem,
  type TranslatedLocales,
} from '../lib/studioAi/applyTranslations'
import {PROJECT_LOCALE_IDS, type ProjectLocaleId} from '../lib/sanity/localizedPaste/projectLocales'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const AI_API_URL = (process.env.SANITY_STUDIO_AI_API_URL ?? '').trim().replace(/\/+$/, '')
const AI_API_SECRET = (process.env.SANITY_STUDIO_AI_API_SECRET ?? '').trim()
const LOCAL_STUDIO_ORIGIN = 'http://localhost:3333'
const MAX_ITEMS_PER_REQUEST = 12
const maxCharsPerRequest = () => Math.max(1_000, Math.floor(6_000 / Math.max(1, PROJECT_LOCALE_IDS.length)))

const args = process.argv.slice(2)
const execute = args.includes('--execute')
const overwrite = args.includes('--overwrite')
const baseArg = args.find((a) => a.startsWith('--base='))
const base = (baseArg ? baseArg.slice('--base='.length) : 'en') as ProjectLocaleId
const id = args.find((a) => !a.startsWith('--'))
if (!id) throw new Error('usage: npx tsx scripts/translateTracker.ts <doc-id> [--base=en] [--overwrite] [--execute]')

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

async function studioTranslate(
  sourceLang: string,
  items: TranslateRequestItem[],
): Promise<{items: Array<{key: string; locales: TranslatedLocales}>; oversized: string[]}> {
  if (!AI_API_URL || !AI_API_SECRET) {
    throw new Error('SANITY_STUDIO_AI_API_URL / SANITY_STUDIO_AI_API_SECRET not set in .env')
  }
  const {batches, oversized} = chunkTranslateItems(items, {
    maxItems: MAX_ITEMS_PER_REQUEST,
    maxChars: maxCharsPerRequest(),
  })
  const merged: Array<{key: string; locales: TranslatedLocales}> = []
  for (const [i, batch] of batches.entries()) {
    const chars = batch.reduce((n, it) => n + it.text.length, 0)
    console.log(`  batch ${i + 1}/${batches.length}: ${batch.length} items, ${chars} chars...`)
    const res = await fetch(`${AI_API_URL}/api/studio-translate`, {
      method: 'POST',
      headers: {'content-type': 'application/json', 'x-studio-secret': AI_API_SECRET, origin: LOCAL_STUDIO_ORIGIN},
      body: JSON.stringify({sourceLang, items: batch, locales: [...PROJECT_LOCALE_IDS]}),
    })
    const json = (await res.json().catch(() => ({}))) as {error?: string; items?: unknown}
    if (!res.ok) {
      throw new Error(
        `batch ${i + 1}/${batches.length} failed: ${json.error ?? `request failed (${res.status})`} — keys: ${batch.map((it) => it.key).join(', ')}`,
      )
    }
    if (typeof json.items === 'string') {
      try {
        const parsed = JSON.parse(json.items)
        if (Array.isArray(parsed)) json.items = parsed
      } catch {
        // fall through to the Array.isArray check below, which throws
      }
    }
    if (!Array.isArray(json.items)) {
      throw new Error(`batch ${i + 1}/${batches.length} returned a malformed response — "items" is ${typeof json.items}, not an array`)
    }
    const returnedKeys = new Set(
      (json.items as Array<{key?: unknown}>).map((it) => (typeof it?.key === 'string' ? it.key : null)).filter(Boolean),
    )
    const missingKeys = batch.map((it) => it.key).filter((k) => !returnedKeys.has(k))
    if (missingKeys.length > 0) {
      throw new Error(`batch ${i + 1}/${batches.length} response is missing ${missingKeys.length} of ${batch.length} requested key(s): ${missingKeys.join(', ')}`)
    }
    merged.push(...(json.items as typeof merged))
    console.log(`  batch ${i + 1}/${batches.length}: ok, ${(json.items as unknown[]).length} item(s) back`)
  }
  return {items: merged, oversized}
}

async function main(): Promise<void> {
  const doc = (await client.getDocument(id!)) as Record<string, unknown> | null
  if (!doc) throw new Error(`document not found: ${id}`)

  const discovery = discoverLocalized(doc)
  const {items, skippedNoBase} = buildTranslateItems(discovery.entries, base)
  console.log(
    `${id}: ${discovery.entries.length} localized field(s), ${discovery.skippedNoKey} unpatchable in lists, ` +
      `${skippedNoBase.length} field(s) with no ${base.toUpperCase()} text`,
  )
  if (items.length === 0) {
    console.log(`No fields have text in ${base.toUpperCase()} — nothing to translate.`)
    return
  }

  const {items: responseItems, oversized} = await studioTranslate(base, items)
  const translated = new Map<string, TranslatedLocales>(responseItems.map((i) => [i.key, i.locales]))
  const {setOps, written} = decideTranslationSets(discovery.entries, translated, {base, overwrite})

  console.log(`  writes ${written} field-locale value(s)`)
  if (skippedNoBase.length) console.log(`  no ${base.toUpperCase()} text: ${skippedNoBase.join(', ')}`)
  if (oversized.length) console.log(`  too long to translate in one request: ${oversized.join(', ')}`)

  if (written === 0) {
    console.log('  nothing to write — all locales already filled (use --overwrite to re-translate)')
    return
  }

  if (!execute) {
    console.log('\nDry run. Re-run with --execute to write.')
    console.log(JSON.stringify(setOps, null, 2))
    return
  }

  await client.patch(id!).set(setOps).commit()
  console.log(`\nwritten to ${id}`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
