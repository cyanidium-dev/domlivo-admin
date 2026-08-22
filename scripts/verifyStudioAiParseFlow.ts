/**
 * End-to-end check of the Parse action's decision layer against a LIVE parse
 * response: calls the deployed /api/studio-parse with one of the listing texts
 * from docs/engineering/TEST-studio-ai-2026-08-22.md, then runs the same pure
 * libs the dialog runs — so the minted slug (F5) and the "still needed before
 * publishing" line (F6) are checked against real output, not a fixture.
 *
 * Writes nothing to the dataset.
 *
 * Run: npm run verify:studio-ai-parse-flow
 */

import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {applySetOps, decideParseSets, missingForPublish, type ParseResponse} from '../lib/studioAi/applyParse'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const base = (process.env.SANITY_STUDIO_AI_API_URL ?? '').trim().replace(/\/+$/, '')
const secret = (process.env.SANITY_STUDIO_AI_API_SECRET ?? '').trim()
const DOC = path.resolve(process.cwd(), '../domlivo-workspace/docs/engineering/TEST-studio-ai-2026-08-22.md')

async function main(): Promise<void> {
  if (!base || !secret) {
    console.error('SANITY_STUDIO_AI_API_URL / _SECRET missing from cms/.env')
    process.exit(1)
  }
  const texts = [...fs.readFileSync(DOC, 'utf8').matchAll(/```text\n([\s\S]*?)```/g)].map((m) => m[1]!.trim())
  const text = texts[0]!

  const res = await fetch(`${base}/api/studio-parse`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-studio-secret': secret,
      origin: 'https://domlivo-admin.vercel.app',
    },
    body: JSON.stringify({text, locales: ['en', 'uk', 'ru', 'sq', 'it']}),
  })
  if (!res.ok) {
    console.error(`parse failed: ${res.status} ${await res.text()}`)
    process.exit(1)
  }
  const resp = (await res.json()) as ParseResponse

  // An untouched property draft, as the fixtures are created.
  const emptyDraft = {_type: 'property', propertyCode: 'AI-TEST-P1', isPublished: false, lifecycleStatus: 'draft'}
  const {setOps, skipped} = decideParseSets(emptyDraft, resp, false)
  const after = applySetOps(emptyDraft, setOps)

  console.log(`title.en   ${resp.parsed.editorial.title.en}`)
  console.log(`slug       ${JSON.stringify(setOps.slug ?? '(none minted)')}`)
  console.log(`values     ${Object.keys(setOps).length} written, kept existing: ${skipped.join(', ') || 'none'}`)
  console.log(`missing    ${missingForPublish(after).join(', ') || '(nothing — publishable)'}`)
  console.log(`untouched  agent=${'agent' in setOps} gallery=${'gallery' in setOps} isPublished=${'isPublished' in setOps}`)

  const withSlug = {...emptyDraft, slug: {_type: 'slug', current: 'already-here'}}
  const second = decideParseSets(withSlug, resp, true)
  console.log(`existing slug touched with overwrite ON: ${'slug' in second.setOps}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
