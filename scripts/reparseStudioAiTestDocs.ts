/**
 * Replays the ✨ Parse from text action over the five property fixtures without
 * a browser: reads each listing text from
 * docs/engineering/TEST-studio-ai-2026-08-22.md, calls the deployed
 * /api/studio-parse, and applies the result through the very libs the dialog
 * uses — decideParseSets, the slug uniqueness query, applySetOps and
 * missingForPublish — printing the same lines the dialog would show.
 *
 * The drafts it writes to are `*-test-ai-parse-*`, always drafts, never
 * published. Use it after a change to the parse pipeline so the fixtures show
 * current behaviour instead of whatever ran months ago.
 *
 * Reset the drafts to empty first, so the run reproduces the real case — an
 * editor opening a blank draft and pressing the button with Overwrite off:
 *   npm run seed:studio-ai-tests -- --only parse --execute
 *   npm run reparse:studio-ai-tests -- --execute
 */

import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {applySetOps, decideParseSets, missingForPublish, type ParseResponse} from '../lib/studioAi/applyParse'
import {pickFreeSlug} from '../lib/studioAi/slug'
import {
  buildSuggestionDrafts,
  planSuggestionWrites,
  unmatchedAmenityNames,
} from '../lib/studioAi/amenitySuggestions'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.slice(2).includes('--execute')
const overwrite = process.argv.slice(2).includes('--overwrite')

const base = (process.env.SANITY_STUDIO_AI_API_URL ?? '').trim().replace(/\/+$/, '')
const secret = (process.env.SANITY_STUDIO_AI_API_SECRET ?? '').trim()
const DOC = path.resolve(process.cwd(), '../domlivo-workspace/docs/engineering/TEST-studio-ai-2026-08-22.md')
const LOCALES = ['en', 'uk', 'ru', 'sq', 'it']

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

async function parse(text: string): Promise<ParseResponse> {
  const res = await fetch(`${base}/api/studio-parse`, {
    method: 'POST',
    headers: {'content-type': 'application/json', 'x-studio-secret': secret, origin: 'https://domlivo-admin.vercel.app'},
    body: JSON.stringify({text, locales: LOCALES}),
  })
  if (!res.ok) throw new Error(`studio-parse ${res.status}: ${await res.text()}`)
  return (await res.json()) as ParseResponse
}

/** The same queue write the Parse action performs, so a replay exercises it too. */
async function queueSuggestions(unmatched: string[], listingTitle: string): Promise<string[]> {
  const names = unmatchedAmenityNames(unmatched)
  if (names.length === 0) return []
  const rows: Array<{slug?: string; aliases?: string[]; title?: Record<string, string>}> = await client.fetch(
    `*[_type == "amenity"]{"slug": slug.current, aliases, title}`,
  )
  const known = rows.flatMap((r) => [
    ...(r.slug ? [r.slug] : []),
    ...(r.aliases ?? []),
    ...Object.values(r.title ?? {}).filter((v): v is string => typeof v === 'string'),
  ])
  const now = new Date().toISOString()
  const {drafts, dropped} = buildSuggestionDrafts(names, known, {now, example: listingTitle})
  const lines: string[] = []
  if (dropped.length) lines.push(`Not queued (shape): ${dropped.join(', ')}.`)
  if (drafts.length === 0) return lines

  const existingRows: Array<{_id: string; examples?: string[]}> = await client.fetch(`*[_id in $ids]{_id, examples}`, {
    ids: drafts.map((d) => d._id),
  })
  const existing = new Map(existingRows.map((r) => [r._id, r]))
  let tx = client.transaction()
  for (const write of planSuggestionWrites(drafts, existing, {now, example: listingTitle})) {
    tx = tx.createIfNotExists(write.create)
    tx = tx.patch(write.create._id, (p) => {
      const b = p.inc({count: write.incCount}).set({lastSeen: write.lastSeen}).setIfMissing({examples: []})
      return write.appendExample ? b.append('examples', [write.appendExample]) : b
    })
  }
  await tx.commit()
  lines.push(`Queued for review: ${drafts.map((d) => d.name).join(', ')}.`)
  return lines
}

async function main(): Promise<void> {
  if (!base || !secret) {
    console.error('SANITY_STUDIO_AI_API_URL / _SECRET missing from cms/.env')
    process.exit(1)
  }
  const texts = [...fs.readFileSync(DOC, 'utf8').matchAll(/```text\n([\s\S]*?)```/g)].map((m) => m[1]!.trim())
  if (texts.length !== 5) {
    console.error(`expected 5 listing texts in the TEST doc, found ${texts.length}`)
    process.exit(1)
  }

  for (const [i, text] of texts.entries()) {
    const id = `drafts.property-test-ai-parse-${i + 1}`
    const doc = ((await client.getDocument(id)) ?? {}) as Record<string, unknown>
    if (!doc._id) {
      console.log(`${id}: MISSING — run npm run seed:studio-ai-tests -- --only parse --execute`)
      continue
    }

    const resp = await parse(text)
    const {setOps, skipped} = decideParseSets(doc, resp, overwrite)

    // Same slug uniqueness step the action performs under the editor's session.
    const minted = setOps.slug as {current?: string} | undefined
    if (minted?.current) {
      const taken: string[] = await client.fetch(
        `*[_type == "property" && defined(slug.current) && (slug.current == $base || slug.current match $pattern)].slug.current`,
        {base: minted.current, pattern: `${minted.current}-*`},
      )
      setOps.slug = {_type: 'slug', current: pickFreeSlug(minted.current, taken)}
    }

    const after = applySetOps(doc, setOps)
    const lines = [`Filled ${Object.keys(setOps).length} value(s).`]
    const stillNeeded = missingForPublish(after)
    if (stillNeeded.length) lines.push(`Still needed before publishing: ${stillNeeded.join(', ')}.`)
    if (skipped.length) lines.push(`Kept existing: ${skipped.join(', ')}.`)
    if (resp.refs.unmatched.length) lines.push(`Not matched (left empty): ${resp.refs.unmatched.join('; ')}.`)
    lines.push(...resp.validation.warnings.map((w) => `⚠ ${w}`))
    if (resp.parsed.parserNotes) lines.push(resp.parsed.parserNotes)

    console.log(`=== ${doc.propertyCode ?? id}${execute ? '' : '  [dry]'}`)
    console.log(`  slug   ${JSON.stringify((setOps.slug as {current?: string} | undefined)?.current ?? '(unchanged)')}`)
    console.log(`  title  ${resp.parsed.editorial.title.en}`)
    for (const line of lines) console.log(`  ${line}`)

    if (execute) {
      await client.patch(id).set(setOps as Record<string, unknown>).commit({autoGenerateArrayKeys: false})
      for (const line of await queueSuggestions(resp.refs.unmatched, resp.parsed.editorial.title.en)) {
        console.log(`  ${line}`)
      }
    }
    console.log()
  }

  if (!execute) console.log('Dry run — nothing written. Re-run with --execute to patch the drafts.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
