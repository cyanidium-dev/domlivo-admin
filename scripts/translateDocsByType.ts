/**
 * Bulk-fills empty locales (by default just `pl`, the newly added 6th
 * locale) across every document of a given type, using the exact same
 * discovery/translate/write pipeline as `translateBlogPost.ts` and the
 * Studio "🌐 Translate" document action — generalized to any type instead
 * of being blog-specific, and to a whole type's worth of documents instead
 * of one doc per run.
 *
 * Draft handling: a document that has a pending, unpublished draft is
 * translated on the DRAFT (matching what Studio's own Translate action
 * would operate on if an editor opened that document) rather than the
 * published copy — writing to the published copy instead would be
 * silently discarded the next time that draft is published. A document
 * with no draft is translated on its published `_id` directly.
 *
 * Only empty locales are ever written (no --overwrite flag here, unlike
 * translateBlogPost.ts) -- this script's whole purpose is closing the pl
 * gap without touching the five already-filled locales.
 *
 * Run:
 *   npm run translate:by-type -- <type> [--locales=pl] [--execute]
 *   npm run translate:by-type -- city --execute
 *   npm run translate:by-type -- district --locales=pl,it --execute
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {discoverLocalized, filledLocale} from '../lib/studioAi/discoverLocalized'
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

const args = process.argv.slice(2)
const execute = args.includes('--execute')
const type = args.find((a) => !a.startsWith('--'))
const localesArg = args.find((a) => a.startsWith('--locales='))
const base: ProjectLocaleId = 'en'
const targetLocales: string[] = localesArg
  ? localesArg.slice('--locales='.length).split(',').map((s) => s.trim()).filter(Boolean)
  : [...PROJECT_LOCALE_IDS]
// The endpoint requires >=2 locale codes even when only one is actually
// wanted -- `base` is always discarded downstream (decideTranslationSets
// never writes it), so padding with it costs nothing but satisfies the
// floor.
const requestLocales = targetLocales.includes(base) || targetLocales.length >= 2
  ? targetLocales
  : [base, ...targetLocales]

if (!type) {
  throw new Error('usage: npm run translate:by-type -- <sanityType> [--locales=pl] [--execute]')
}

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

function maxCharsPerRequest(): number {
  return Math.max(1_000, Math.floor(6_000 / Math.max(1, requestLocales.length)))
}

async function studioTranslate(
  items: TranslateRequestItem[],
): Promise<{items: Array<{key: string; locales: TranslatedLocales}>; oversized: string[]}> {
  const {batches, oversized} = chunkTranslateItems(items, {
    maxItems: MAX_ITEMS_PER_REQUEST,
    maxChars: maxCharsPerRequest(),
  })
  const merged: Array<{key: string; locales: TranslatedLocales}> = []
  for (const [i, batch] of batches.entries()) {
    let attempt = 0
    // eslint-disable-next-line no-constant-condition
    while (true) {
      attempt += 1
      const res = await fetch(`${AI_API_URL}/api/studio-translate`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-studio-secret': AI_API_SECRET,
          origin: LOCAL_STUDIO_ORIGIN,
        },
        body: JSON.stringify({sourceLang: base, items: batch, locales: requestLocales}),
      })
      if (res.status === 429 && attempt <= 5) {
        const wait = 3000 * attempt
        console.log(`    rate-limited (attempt ${attempt}), waiting ${wait}ms...`)
        await new Promise((r) => setTimeout(r, wait))
        continue
      }
      const json = (await res.json().catch(() => ({}))) as {error?: string; items?: unknown}
      if (!res.ok) {
        throw new Error(
          `batch ${i + 1}/${batches.length} (${batch.length} items) failed: ${json.error ?? `request failed (${res.status})`}`,
        )
      }
      if (typeof json.items === 'string') {
        try {
          const parsed = JSON.parse(json.items)
          if (Array.isArray(parsed)) json.items = parsed
        } catch {
          // falls through to the Array.isArray check below, which throws
        }
      }
      if (!Array.isArray(json.items)) {
        throw new Error(`batch ${i + 1}/${batches.length} returned a malformed response — "items" is ${typeof json.items}`)
      }
      const returnedKeys = new Set(
        (json.items as Array<{key?: unknown}>).map((it) => (typeof it?.key === 'string' ? it.key : null)).filter(Boolean),
      )
      const missingKeys = batch.map((it) => it.key).filter((k) => !returnedKeys.has(k))
      if (missingKeys.length > 0) {
        throw new Error(`batch ${i + 1}/${batches.length} response is missing ${missingKeys.length} of ${batch.length} key(s)`)
      }
      merged.push(...(json.items as typeof merged))
      break
    }
  }
  return {items: merged, oversized}
}

async function main(): Promise<void> {
  if (!AI_API_URL || !AI_API_SECRET) {
    throw new Error('SANITY_STUDIO_AI_API_URL / SANITY_STUDIO_AI_API_SECRET not set in .env')
  }

  const rawDocs: Array<Record<string, unknown>> = await client.fetch(`*[_type == $type]`, {type})
  // Excludes known AI-testing fixture drafts (e.g. `district-test-ai-*`) --
  // real content never carries `-test-` in its id, and translating a
  // fixture that exists specifically to model a partial/untranslated state
  // would defeat its purpose.
  const allDocs = rawDocs.filter((d) => !String(d._id).includes('-test-'))
  const excluded = rawDocs.length - allDocs.length
  console.log(`fetched ${rawDocs.length} raw document(s) of type "${type}"${excluded ? ` (${excluded} test-fixture id(s) excluded)` : ''}`)

  // Dedupe draft/published pairs, preferring the draft when one exists.
  const byBaseId = new Map<string, Record<string, unknown>>()
  for (const doc of allDocs) {
    const rawId = String(doc._id)
    const isDraft = rawId.startsWith('drafts.')
    const baseId = isDraft ? rawId.slice('drafts.'.length) : rawId
    const existing = byBaseId.get(baseId)
    if (!existing || (isDraft && !String(existing._id).startsWith('drafts.'))) {
      byBaseId.set(baseId, doc)
    }
  }
  const docs = [...byBaseId.values()]
  const draftCount = docs.filter((d) => String(d._id).startsWith('drafts.')).length
  console.log(`${docs.length} unique document(s) after draft/published dedup (${draftCount} targeted via their draft)`)
  console.log(`target locales: ${targetLocales.join(', ')} (request locales: ${requestLocales.join(', ')}, base: ${base})`)

  let totalWritten = 0
  let totalSkippedNoBase = 0
  let touchedDocs = 0
  let erroredDocs = 0

  for (const [idx, doc] of docs.entries()) {
    const id = String(doc._id)
    const label = (doc as {title?: {en?: string}; name?: string; slug?: {current?: string}})
    const humanLabel = label?.title?.en || label?.name || label?.slug?.current || id
    const discovery = discoverLocalized(doc)
    const {items, skippedNoBase} = buildTranslateItems(discovery.entries, base)

    // Filter down to items missing at least one of targetLocales -- avoids
    // spending an API call translating a field that's already fully filled
    // in every target locale (e.g. already has pl from a prior partial run).
    const itemsNeedingWork = items.filter((it) => {
      const entry = discovery.entries.find((e) => e.path === it.key)
      if (!entry) return true
      return targetLocales.some((l) => l !== base && !filledLocale(entry.value, l as ProjectLocaleId))
    })

    if (itemsNeedingWork.length === 0) {
      continue
    }

    console.log(`[${idx + 1}/${docs.length}] ${id} (${humanLabel}): ${itemsNeedingWork.length} field(s) need ${targetLocales.join('/')}`)

    if (!execute) {
      touchedDocs += 1
      totalWritten += itemsNeedingWork.length
      totalSkippedNoBase += skippedNoBase.length
      continue
    }

    try {
      const {items: translated} = await studioTranslate(itemsNeedingWork)
      const translatedMap = new Map(translated.map((t) => [t.key, t.locales]))
      const {setOps, written} = decideTranslationSets(discovery.entries, translatedMap, {base, overwrite: false})
      // decideTranslationSets writes every PROJECT_LOCALE_IDS locale that
      // came back empty -- but we only *requested* targetLocales, so only
      // those keys are actually present in translatedMap's locale objects;
      // filter setOps down to just the requested locales as a belt-and-
      // braces guard against writing an accidental empty string for a
      // locale we never asked the endpoint to translate.
      const filteredOps: Record<string, string> = {}
      let filteredWritten = 0
      for (const [opPath, value] of Object.entries(setOps)) {
        const locale = opPath.split('.').pop()
        if (locale && targetLocales.includes(locale)) {
          filteredOps[opPath] = value
          filteredWritten += 1
        }
      }
      if (filteredWritten > 0) {
        await client.patch(id).set(filteredOps).commit()
        touchedDocs += 1
        totalWritten += filteredWritten
      }
      totalSkippedNoBase += skippedNoBase.length
      console.log(`    wrote ${filteredWritten} value(s)${written !== filteredWritten ? ` (${written} total incl. non-target locales, discarded)` : ''}`)
    } catch (err) {
      erroredDocs += 1
      console.error(`    ERROR on ${id}: ${err instanceof Error ? err.message : err}`)
    }
  }

  console.log('')
  console.log(
    execute
      ? `Done. Wrote ${totalWritten} value(s) across ${touchedDocs} document(s). ${erroredDocs} document(s) errored.`
      : `Dry run — would write ~${totalWritten} value(s) across ${touchedDocs} document(s). Re-run with --execute.`,
  )
  if (totalSkippedNoBase > 0) console.log(`${totalSkippedNoBase} field-instance(s) had no ${base.toUpperCase()} text to translate from (across all docs).`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
