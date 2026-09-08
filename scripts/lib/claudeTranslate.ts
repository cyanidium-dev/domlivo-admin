/**
 * One Claude call that translates a batch of strings into several locales
 * and returns strict JSON. Shared by the CMS gap filler and the listing
 * translator; the prompts differ, the plumbing does not.
 *
 * The key is read from ANTHROPIC_API_KEY. This repo's .env does not carry
 * it; the front end's .env.local does, so that file is loaded as a fallback
 * — never the other way round, and nothing is copied.
 */
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
if (!process.env.ANTHROPIC_API_KEY) {
  loadDotenv({path: path.resolve(process.cwd(), '../your-house-albania/.env.local')})
}

export const MODEL = 'claude-opus-5'

export const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  uk: 'Ukrainian',
  ru: 'Russian',
  sq: 'Albanian',
  it: 'Italian',
  pl: 'Polish',
}

export const HOUSE_STYLE = `You translate for Domlivo, a real-estate website about Albania (domlivo.com).
Rules that apply to every locale:
- Translate meaning, not words; the result must read as if written by a native real-estate copywriter, not as a translation.
- Keep every number, unit (m², €, %), date, price and the notation "1+1", "2+1", "2+1+2" exactly as written.
- Keep placeholders such as {city}, {district}, {count} and any HTML or Markdown untouched.
- Keep brand and product names (Domlivo, Telegram, WhatsApp, iOS, Android) as they are.
- Place names: use the target language's established form when one exists (Durrës → ru Дуррес, uk Дуррес, it Durazzo, pl Durrës; Tiranë → ru Тирана, it Tirana; Vlorë → it Valona; Sarandë → ru Саранда; Shkodër → it Scutari), otherwise keep the Albanian spelling. District names in Cyrillic: Голем, Шкемби-и-Каваяс (or short: Шкемби), Черрет, Плаж, Плепа, Мали-и-Робит, Спилле, Кавая, залив Лальзит.
- Albanian: write natively with correct case forms (në Tiranë, në Durrës, i/e Durrësit) — never a word-for-word calque.
- Ukrainian and Russian are different languages; never return Russian for a Ukrainian field or the reverse.
- Never add facts, prices, opinions or calls to action that are not in the source. Never leave a field in the source language.
Return only JSON. No prose, no code fences.`

let client: Anthropic | null = null
function getClient(): Anthropic {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set')
    client = new Anthropic()
  }
  return client
}

/** Pull the first JSON object out of a model reply, tolerating stray text. */
export function parseJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  try {
    return JSON.parse(trimmed) as Record<string, unknown>
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>
    throw new Error(`model reply is not JSON: ${trimmed.slice(0, 200)}`)
  }
}

export type Usage = {input: number; output: number; calls: number}
export const usage: Usage = {input: 0, output: 0, calls: 0}

/**
 * Ask for JSON; retry on rate limits and transient errors. Returns the parsed
 * object. `system` is the task prompt on top of HOUSE_STYLE.
 */
export async function askJson(system: string, user: string, maxTokens = 16000): Promise<Record<string, unknown>> {
  const c = getClient()
  let attempt = 0
  for (;;) {
    attempt += 1
    try {
      const response = await c.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system: [{type: 'text', text: `${HOUSE_STYLE}\n\n${system}`, cache_control: {type: 'ephemeral'}}],
        messages: [{role: 'user', content: user}],
        output_config: {effort: 'medium'},
      })
      usage.calls += 1
      usage.input += response.usage.input_tokens + (response.usage.cache_read_input_tokens ?? 0)
      usage.output += response.usage.output_tokens
      if (response.stop_reason === 'refusal') throw new Error('model refused the request')
      if (response.stop_reason === 'max_tokens') throw new Error('reply truncated at max_tokens — shrink the batch')
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('')
      return parseJsonObject(text)
    } catch (err) {
      const retryable =
        err instanceof Anthropic.RateLimitError ||
        err instanceof Anthropic.InternalServerError ||
        err instanceof Anthropic.APIConnectionError ||
        (err instanceof Error && /not JSON/.test(err.message))
      if (!retryable || attempt >= 4) throw err
      await new Promise((r) => setTimeout(r, 4000 * attempt))
    }
  }
}

/** Run `worker` over `items` with at most `limit` in flight. */
export async function mapLimit<T, R>(items: T[], limit: number, worker: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  const runners = Array.from({length: Math.min(limit, items.length)}, async () => {
    for (;;) {
      const i = next++
      if (i >= items.length) return
      out[i] = await worker(items[i], i)
    }
  })
  await Promise.all(runners)
  return out
}

export function costUsd(u: Usage): string {
  // claude-opus-5 list price: $5 / 1M input, $25 / 1M output
  return ((u.input * 5 + u.output * 25) / 1_000_000).toFixed(2)
}
