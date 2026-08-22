/**
 * Thin client for the AI endpoints hosted on the domlivo-bot deployment.
 * Config via Vite-convention Studio envs (baked into the bundle — the secret
 * is therefore extractable; the endpoints are compute-only and rate-limited,
 * see SPEC-studio-ai-actions-2026-08-17.md §2).
 */
import {chunkTranslateItems, type TranslateRequestItem, type TranslatedLocales} from './applyTranslations'
import type {ParseResponse} from './applyParse'
import {PROJECT_LOCALE_IDS} from '../sanity/localizedPaste/projectLocales'

const BASE = (process.env.SANITY_STUDIO_AI_API_URL ?? '').trim().replace(/\/+$/, '')
const SECRET = (process.env.SANITY_STUDIO_AI_API_SECRET ?? '').trim()

export function aiConfigured(): boolean {
  return Boolean(BASE && SECRET)
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {'content-type': 'application/json', 'x-studio-secret': SECRET},
    body: JSON.stringify(body),
  })
  const json = (await res.json().catch(() => ({}))) as {error?: string}
  if (!res.ok) throw new Error(json.error ?? `request failed (${res.status})`)
  return json as T
}

/** Mirrors the caps in the endpoint (`api/studio-translate.ts`). */
const MAX_ITEMS_PER_REQUEST = 40
const MAX_CHARS_PER_REQUEST = 20_000

/**
 * The locale list always travels with the request (derived from languages.ts),
 * so adding a site language needs no backend change.
 *
 * Requests are sent one after another rather than at once: the endpoint's rate
 * limit is global (30/min), and a burst from a single editor would spend it on
 * one document.
 */
export async function aiTranslate(
  sourceLang: string,
  items: TranslateRequestItem[],
): Promise<{items: Array<{key: string; locales: TranslatedLocales}>; oversized: string[]}> {
  const {batches, oversized} = chunkTranslateItems(items, {
    maxItems: MAX_ITEMS_PER_REQUEST,
    maxChars: MAX_CHARS_PER_REQUEST,
  })
  const merged: Array<{key: string; locales: TranslatedLocales}> = []
  for (const batch of batches) {
    const resp = await post<{items: Array<{key: string; locales: TranslatedLocales}>}>('/api/studio-translate', {
      sourceLang,
      items: batch,
      locales: [...PROJECT_LOCALE_IDS],
    })
    merged.push(...resp.items)
  }
  return {items: merged, oversized}
}

export function aiParse(text: string): Promise<ParseResponse> {
  return post('/api/studio-parse', {text, locales: [...PROJECT_LOCALE_IDS]})
}
