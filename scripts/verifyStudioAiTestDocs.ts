/**
 * Dry-checks the Translate fixtures without a browser: fetches the three test
 * district drafts and runs the very libs the document action runs
 * (discoverLocalized → buildTranslateItems → decideTranslationSets) with a
 * stubbed translator, so the field counts printed in
 * docs/engineering/TEST-studio-ai-2026-08-22.md are verified rather than
 * assumed. Writes nothing.
 *
 * Run: npm run verify:studio-ai-tests
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {discoverLocalized} from '../lib/studioAi/discoverLocalized'
import {buildTranslateItems, decideTranslationSets, type TranslatedLocales} from '../lib/studioAi/applyTranslations'
import {PROJECT_LOCALE_IDS, type ProjectLocaleId} from '../lib/sanity/localizedPaste/projectLocales'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

const CASES: Array<{id: string; base: ProjectLocaleId}> = [
  {id: 'drafts.district-test-ai-en-only', base: 'en'},
  {id: 'drafts.district-test-ai-uk-only', base: 'uk'},
  {id: 'drafts.district-test-ai-partial', base: 'en'},
]

/** Stands in for the endpoint: every locale gets a marker, never an empty string. */
function fakeTranslate(text: string): TranslatedLocales {
  return Object.fromEntries(PROJECT_LOCALE_IDS.map((l) => [l, `${l}:${text.slice(0, 12)}`])) as TranslatedLocales
}

async function main(): Promise<void> {
  for (const {id, base} of CASES) {
    const doc = await client.getDocument(id)
    if (!doc) {
      console.log(`${id}: MISSING — run npm run seed:studio-ai-tests -- --execute`)
      continue
    }
    const discovery = discoverLocalized(doc as Record<string, unknown>)
    const {items, skippedNoBase} = buildTranslateItems(discovery.entries, base)
    const translated = new Map(items.map((i) => [i.key, fakeTranslate(i.text)]))

    for (const overwrite of [false, true]) {
      const {setOps, written} = decideTranslationSets(discovery.entries, translated, {base, overwrite})
      const fields = new Set(Object.keys(setOps).map((p) => p.slice(0, p.lastIndexOf('.'))))
      console.log(
        `${id} base=${base} overwrite=${overwrite ? 'ON ' : 'OFF'} → ` +
          `${discovery.entries.length} field(s) found, ${discovery.skippedNoKey} unpatchable in lists, ` +
          `${skippedNoBase.length} without ${base.toUpperCase()} text, ` +
          `writes ${written} value(s) across ${fields.size} field(s)`,
      )
      if (!overwrite && setOps[`title.${base}`] !== undefined) {
        console.log('  !! base locale would be overwritten — that is a bug')
      }
    }
    console.log(`  fields: ${discovery.entries.map((e) => e.path).join(', ')}`)
    if (skippedNoBase.length) console.log(`  no ${base.toUpperCase()} text: ${skippedNoBase.join(', ')}`)
    console.log()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
