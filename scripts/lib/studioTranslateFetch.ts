/**
 * One call to the bot deployment's /api/studio-translate, validated.
 * Extracted for the scripts added on 2026-09-03 (translateBlogLead,
 * translateBlogTables); translateBlogPost.ts and translateDocsByType.ts keep
 * their own copies on purpose — they are proven and this does not touch them.
 *
 * Validation mirrors those copies: a 200 is not proof — `items` may come back
 * JSON-stringified (recoverable) or not an array at all (fatal), and a batch
 * that drops keys is a failure, never a partial success.
 */
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {chunkTranslateItems, type TranslateRequestItem, type TranslatedLocales} from '../../lib/studioAi/applyTranslations'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const AI_API_URL = (process.env.SANITY_STUDIO_AI_API_URL ?? '').trim().replace(/\/+$/, '')
const AI_API_SECRET = (process.env.SANITY_STUDIO_AI_API_SECRET ?? '').trim()
const LOCAL_STUDIO_ORIGIN = 'http://localhost:3333'
const MAX_ITEMS_PER_REQUEST = 12

export type TranslatedItem = {key: string; locales: TranslatedLocales}

export async function studioTranslate(
  sourceLang: string,
  items: TranslateRequestItem[],
  locales: readonly string[],
): Promise<{items: TranslatedItem[]; oversized: string[]}> {
  if (!AI_API_URL || !AI_API_SECRET) {
    throw new Error('SANITY_STUDIO_AI_API_URL / SANITY_STUDIO_AI_API_SECRET not set in .env')
  }
  // The endpoint requires the source language to be one of `locales` (and at
  // least two codes); the source's own "translation" is discarded downstream.
  const requestLocales = locales.includes(sourceLang) ? [...locales] : [sourceLang, ...locales]
  const maxChars = Math.max(1_000, Math.floor(6_000 / Math.max(1, requestLocales.length)))
  const {batches, oversized} = chunkTranslateItems(items, {maxItems: MAX_ITEMS_PER_REQUEST, maxChars})
  const merged: TranslatedItem[] = []
  for (const [i, batch] of batches.entries()) {
    const chars = batch.reduce((n, it) => n + it.text.length, 0)
    console.log(`  batch ${i + 1}/${batches.length}: ${batch.length} items, ${chars} chars...`)
    const res = await fetch(`${AI_API_URL}/api/studio-translate`, {
      method: 'POST',
      headers: {'content-type': 'application/json', 'x-studio-secret': AI_API_SECRET, origin: LOCAL_STUDIO_ORIGIN},
      body: JSON.stringify({sourceLang, items: batch, locales: requestLocales}),
    })
    const json = (await res.json().catch(() => ({}))) as {error?: string; items?: unknown}
    if (!res.ok) {
      throw new Error(`batch ${i + 1}/${batches.length} failed: ${json.error ?? `request failed (${res.status})`}`)
    }
    if (typeof json.items === 'string') {
      try {
        const parsed = JSON.parse(json.items)
        if (Array.isArray(parsed)) json.items = parsed
      } catch {
        /* handled below */
      }
    }
    if (!Array.isArray(json.items)) {
      throw new Error(`batch ${i + 1}/${batches.length} returned a malformed response — "items" is ${typeof json.items}`)
    }
    const returned = new Set(
      (json.items as Array<{key?: unknown}>).map((it) => (typeof it?.key === 'string' ? it.key : '')),
    )
    const missing = batch.map((it) => it.key).filter((k) => !returned.has(k))
    if (missing.length) {
      throw new Error(`batch ${i + 1}/${batches.length} is missing ${missing.length} key(s): ${missing.join(', ')}`)
    }
    merged.push(...(json.items as TranslatedItem[]))
    console.log(`  batch ${i + 1}/${batches.length}: ok`)
  }
  return {items: merged, oversized}
}
