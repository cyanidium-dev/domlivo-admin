/**
 * Writes a hand/inline translation (produced by an editor or by Claude directly,
 * NOT via the bot's AI translate endpoint) straight into Sanity via a patch.
 *
 * Exists because the bot deployment's AI actions depend on a Claude Console API
 * key that is expiring soon -- this script has zero dependency on that key or
 * on bot/domlivo-bot at all, so translation work can continue after it expires.
 *
 * Input is a JSON file (see InlineTranslationInput below) with:
 * - `id`: the exact Sanity document _id to patch (published or drafts.<id> --
 *   caller's responsibility to resolve which one is correct, same as every
 *   other script in this directory).
 * - `fields`: a flat map of Sanity patch paths (e.g. "title.pl",
 *   'keyFacts[_key=="kf-0"].pl') to the translated string. Only ever adds a
 *   `pl` (or whichever locale) value -- never touches en/it/ru/sq/uk.
 * - `bodyField` + `bodyLocale` + `body`: optional portable-text body
 *   replacement -- `body` is the COMPLETE translated block array for that one
 *   locale (each block keeps the source's `_key`/`markDefs`, only `children[].text`
 *   changes), written wholesale to `${bodyField}.${bodyLocale}`.
 *
 * Run:
 *   npm run translate:inline -- <path-to-json> [--execute]
 */

import path from 'node:path'
import fs from 'node:fs'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

type InlineTranslationInput = {
  id: string
  fields?: Record<string, string>
  bodyField?: string
  bodyLocale?: string
  body?: Array<{
    _key: string
    _type: 'block'
    style?: string
    markDefs?: unknown[]
    children: Array<{_key: string; _type: 'span'; marks: string[]; text: string}>
  }>
}

const args = process.argv.slice(2)
const execute = args.includes('--execute')
const filePath = args.find((a) => !a.startsWith('--'))
if (!filePath) throw new Error('usage: npm run translate:inline -- <path-to-json> [--execute]')

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

async function main(): Promise<void> {
  const raw = fs.readFileSync(path.resolve(filePath), 'utf8')
  const input = JSON.parse(raw) as InlineTranslationInput
  if (!input.id) throw new Error('input JSON must have an "id"')

  const exists = await client.getDocument(input.id)
  if (!exists) throw new Error(`document not found: ${input.id}`)

  const ops: Record<string, unknown> = {}
  let fieldCount = 0
  for (const [pathKey, value] of Object.entries(input.fields ?? {})) {
    if (typeof value !== 'string' || !value.trim()) continue
    ops[pathKey] = value
    fieldCount += 1
  }

  let bodyBlockCount = 0
  if (input.body && input.bodyField && input.bodyLocale) {
    ops[`${input.bodyField}.${input.bodyLocale}`] = input.body
    bodyBlockCount = input.body.length
  }

  console.log(`${input.id}: ${fieldCount} field value(s)${bodyBlockCount ? `, ${bodyBlockCount} body block(s)` : ''}`)

  if (Object.keys(ops).length === 0) {
    console.log('  nothing to write')
    return
  }

  if (!execute) {
    console.log(`  dry run — ${Object.keys(ops).length} path(s) would be set. Re-run with --execute to write.`)
    return
  }

  await client.patch(input.id).set(ops).commit()
  console.log(`  written to ${input.id}`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
