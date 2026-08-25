/**
 * Runs the same Translate pipeline Studio's "🌐 Translate" document action
 * uses — discoverLocalized → discoverPortableText → the bot deployment's
 * /api/studio-translate → decideTranslationSets/deserializeBlockText — from
 * a script instead of the browser, and writes the result with a direct
 * Sanity patch instead of Studio's document-operations hook. One doc (by
 * slug) per run, so a bad translation only ever touches one document.
 *
 * The network call is its own thin wrapper here rather than reusing
 * lib/studioAi/client.ts's `aiTranslate`: the endpoint gates on the
 * `Origin` header (see domlivo-bot's `studioApi.ts`), which a browser sets
 * automatically and refuses to let JS override, so `client.ts` never sets
 * it — correctly, for its one real caller. Node's fetch has no such
 * restriction and sends no Origin at all unless told to, so this script
 * sends the one Origin the gate's default rule allows for local tooling,
 * `http://localhost:3333` (Studio's own dev port). Everything upstream of
 * the network call — discovery, batching, deserialization — is the exact
 * same code the document action runs; only the transport differs.
 *
 * `--overwrite` matches the document action's "Overwrite existing
 * translations" checkbox: off (default) fills empty locales only; on
 * replaces every non-base locale, which is what a content rewrite needs —
 * the old locale text describes an article that no longer exists.
 *
 * Run:
 *   npm run translate:blog-post -- <slug> [--base=en] [--overwrite] [--execute]
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {discoverLocalized, discoverPortableText, deserializeBlockText} from '../lib/studioAi/discoverLocalized'
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
// client.ts's own caps (24,000 / locale count ≈ 4,800 chars/request) are
// sized for short field values (titles, keyFacts). Article-body items are
// full paragraphs, and a batch of them has failed two different ways once
// the response has to carry roughly five translated paragraphs at once:
// "translation failed, try again" on a 20-item/4,129-char batch, and later
// a 7-item/2,168-char batch whose response came back as truncated JSON text
// instead of a parsed array — deterministic on retry, so it reads as an
// output-budget problem on the endpoint side rather than a transient one.
// Halved twice from client.ts's original cap; costs nothing on short-field
// batches, which were never close to either cap regardless of the value here.
const MAX_ITEMS_PER_REQUEST = 12
const maxCharsPerRequest = () => Math.max(1_000, Math.floor(6_000 / Math.max(1, PROJECT_LOCALE_IDS.length)))

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
      headers: {
        'content-type': 'application/json',
        'x-studio-secret': AI_API_SECRET,
        origin: LOCAL_STUDIO_ORIGIN,
      },
      body: JSON.stringify({sourceLang, items: batch, locales: [...PROJECT_LOCALE_IDS]}),
    })
    const json = (await res.json().catch(() => ({}))) as {error?: string; items?: unknown}
    if (!res.ok) {
      throw new Error(
        `batch ${i + 1}/${batches.length} (${batch.length} items, ${chars} chars) failed: ` +
          `${json.error ?? `request failed (${res.status})`} — keys: ${batch.map((it) => it.key).join(', ')}`,
      )
    }
    // A 200 response isn't proof the payload is right. Two failure modes
    // observed running this against real documents:
    // (a) `items` comes back as a JSON-stringified array instead of a
    //     parsed one — the endpoint's own serialization double-encoded it.
    //     Recoverable: parse it ourselves. This repeats deterministically
    //     for the same batch, so a bare retry doesn't help; recovering the
    //     data does.
    // (b) `items` is genuinely not an array at all, or the parse in (a)
    //     doesn't yield one — nothing to recover, fail loudly rather than
    //     spread garbage (spreading a raw string below would silently push
    //     one "item" per character, none matching a real key, so the whole
    //     batch's translation would quietly vanish while the run reports
    //     success — which is exactly what happened before this check
    //     existed).
    if (typeof json.items === 'string') {
      try {
        const parsed = JSON.parse(json.items)
        if (Array.isArray(parsed)) json.items = parsed
      } catch {
        // fall through to the Array.isArray check below, which throws
      }
    }
    if (!Array.isArray(json.items)) {
      throw new Error(
        `batch ${i + 1}/${batches.length} returned a malformed response — ` +
          `"items" is ${typeof json.items}, not an array (got ${JSON.stringify(json).slice(0, 200)}...)`,
      )
    }
    const returnedKeys = new Set(
      (json.items as Array<{key?: unknown}>).map((it) => (typeof it?.key === 'string' ? it.key : null)).filter(Boolean),
    )
    const missingKeys = batch.map((it) => it.key).filter((k) => !returnedKeys.has(k))
    if (missingKeys.length > 0) {
      throw new Error(
        `batch ${i + 1}/${batches.length} response is missing ${missingKeys.length} of ${batch.length} requested key(s): ` +
          missingKeys.join(', '),
      )
    }
    const validatedItems = json.items as typeof merged
    merged.push(...validatedItems)
    console.log(`  batch ${i + 1}/${batches.length}: ok, ${validatedItems.length} item(s) back`)
  }
  return {items: merged, oversized}
}

const args = process.argv.slice(2)
const execute = args.includes('--execute')
const overwrite = args.includes('--overwrite')
const baseArg = args.find((a) => a.startsWith('--base='))
const base = (baseArg ? baseArg.slice('--base='.length) : 'en') as ProjectLocaleId
const slug = args.find((a) => !a.startsWith('--'))
if (!slug) throw new Error('usage: npm run translate:blog-post -- <slug> [--base=en] [--overwrite] [--execute]')
if (!PROJECT_LOCALE_IDS.includes(base)) throw new Error(`--base=${base} is not a project locale`)

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

const PT_FIELD = 'content'

async function main(): Promise<void> {
  const id = `drafts.blogPost-${slug}`
  const doc = (await client.getDocument(id)) as Record<string, unknown> | null
  if (!doc) throw new Error(`draft not found: ${id}`)

  // `content` is handled entirely by discoverPortableText below — excluded
  // here so the generic walker doesn't also reach into it. A rewritten
  // article's non-base content locales can still hold the OLD body's
  // embedded blogCallout/blogFaqBlock items (constructs this loader's
  // markdown converter doesn't produce, so the new EN body never has them);
  // those carry their own real localized sub-fields and discoverLocalized
  // has no way to know they're about to be discarded once the body rebuild
  // below overwrites every non-base content locale wholesale. Translating
  // them anyway is wasted work at best; one such batch also came back
  // "translation failed" from the endpoint, so it's a real failure mode too.
  const {content: _content, ...docWithoutBody} = doc
  const discovery = discoverLocalized(docWithoutBody)
  const pt = discoverPortableText(doc[PT_FIELD], PT_FIELD, base)

  const {items, skippedNoBase} = buildTranslateItems(discovery.entries, base)
  const bodyItems = pt.entries.map((e) => ({key: e.path, kind: 'text' as const, text: e.text}))
  console.log(
    `${slug}: ${discovery.entries.length} localized field(s), ${discovery.skippedNoKey} unpatchable in lists, ` +
      `${pt.entries.length} body block(s) (${pt.markedBlocks} carry formatting), ` +
      `${skippedNoBase.length} field(s) with no ${base.toUpperCase()} text`,
  )
  if (items.length === 0 && bodyItems.length === 0) {
    console.log(`No fields have text in ${base.toUpperCase()} — nothing to translate.`)
    return
  }

  // Sent as two separate calls rather than one concatenated batch: short
  // field values (titles, keyFacts) and full body paragraphs are different
  // enough in shape that a batch mixing both was one of the ones that came
  // back "translation failed" while field-only and body-only batches of
  // comparable size succeeded — isolating them also makes a failure easier
  // to attribute to one or the other.
  const oversized: string[] = []
  const responses = []
  if (items.length) {
    const r = await studioTranslate(base, items)
    responses.push(...r.items)
    oversized.push(...r.oversized)
  }
  if (bodyItems.length) {
    const r = await studioTranslate(base, bodyItems)
    responses.push(...r.items)
    oversized.push(...r.oversized)
  }
  const resp = {items: responses, oversized}
  const translated = new Map<string, TranslatedLocales>(resp.items.map((i) => [i.key, i.locales]))
  const {setOps, written} = decideTranslationSets(discovery.entries, translated, {base, overwrite})
  const ops: Record<string, unknown> = {...setOps}

  let bodyWritten = 0
  let lostMarks = 0
  if (pt.entries.length) {
    const sourceBlocks = ((doc[PT_FIELD] as Record<string, unknown>)?.[base] ?? []) as unknown[]
    for (const locale of PROJECT_LOCALE_IDS) {
      if (locale === base) continue
      const existingLocale = (doc[PT_FIELD] as Record<string, unknown>)?.[locale]
      const hasContent = Array.isArray(existingLocale) && existingLocale.length > 0
      if (hasContent && !overwrite) continue
      const rebuilt = new Map<string, {children: unknown[]; lost: number}>()
      for (const e of pt.entries) {
        const value = translated.get(e.path)?.[locale]
        if (typeof value !== 'string' || !value.trim()) continue
        const source = (sourceBlocks as Array<Record<string, unknown>>).find((b) => b?._key === e.key)
        if (!source) continue
        const out = deserializeBlockText(source, value, e.runs)
        rebuilt.set(e.key, {children: out.children, lost: out.lostMarks})
        lostMarks += out.lostMarks
      }
      if (rebuilt.size === 0) continue
      ops[`${PT_FIELD}.${locale}`] = (sourceBlocks as Array<Record<string, unknown>>).map((b) => {
        const key = typeof b?._key === 'string' ? b._key : ''
        const next = key ? rebuilt.get(key) : undefined
        return next ? {...b, children: next.children} : b
      })
      bodyWritten += 1
    }
  }

  console.log(`  writes ${written} field-locale value(s), body for ${bodyWritten} locale(s)`)
  if (lostMarks > 0) console.log(`  ${lostMarks} formatting run(s) did not come back — wording intact, styling lost`)
  if (skippedNoBase.length) console.log(`  no ${base.toUpperCase()} text: ${skippedNoBase.join(', ')}`)
  if (resp.oversized.length) console.log(`  too long to translate in one request: ${resp.oversized.join(', ')}`)

  if (written === 0 && bodyWritten === 0) {
    console.log('  nothing to write — all locales already filled (use --overwrite to re-translate)')
    return
  }

  if (!execute) {
    console.log(`  dry run — ${Object.keys(ops).length} path(s) would be set. Re-run with --execute to write.`)
    return
  }

  await client.patch(id).set(ops).commit()
  console.log(`  written to ${id}`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
