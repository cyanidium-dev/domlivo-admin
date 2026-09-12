/**
 * Write `description` onto the city and district documents that had a stub.
 *
 * All seven cities carried something like "Durres is the main port." — 24
 * characters — and one published district, Shëngjin's centre, carried nothing.
 * That field is what `buildZoneMetaDescription` borrows a sentence from when
 * the figures alone leave a description thin, so a stub there is why those
 * zones' search snippets were a price and nothing else.
 *
 * Run this, then regenerate the SEO copy so the new sentences reach the
 * descriptions:
 *   npm run apply:zone-descriptions -- --execute
 *   npm run generate:zone-seo -- --execute
 *   npm run translate:zone-editorial -- --execute   (uk, sq, it, pl)
 *
 * Only `en` and `ru` are authored, and the other four locales are dropped
 * rather than left holding the stub — same contract as
 * `applyZoneEditorialCopy.ts`, and for the same reason.
 *
 * Idempotent: a zone whose description already clears the threshold is left
 * alone unless --force.
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {CITY_ZONE_DESCRIPTIONS, EXTRA_DISTRICT_DESCRIPTIONS} from './data/cityZoneDescriptions'
import type {EditorialCopy} from './data/zoneEditorialCopy'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const args = process.argv.slice(2)
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')
const isForce = args.includes('--force')

if (!token || !projectId) {
  console.error('Error: SANITY_PROJECT_ID and SANITY_API_TOKEN required. Add them to .env')
  process.exit(1)
}
if (!isDry && !isExecute) {
  console.error('Use --dry to preview or --execute to write.')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token})

/** The same bar `generateDistrictLandings.ts` uses to call a description real. */
const MIN_DESCRIPTION = 150

type Row = {_id: string; slug: string; length: number}

async function applyTo(
  type: 'city' | 'district',
  copy: Record<string, EditorialCopy>,
): Promise<number> {
  const slugs = Object.keys(copy)
  if (slugs.length === 0) return 0

  const rows = await client.fetch<Row[]>(
    `*[_type == $type && slug.current in $slugs]{
      _id, "slug": slug.current, "length": length(coalesce(description.en, ""))
    }`,
    {type, slugs},
  )

  const found = new Set(rows.map((r) => r.slug))
  for (const slug of slugs) {
    if (!found.has(slug)) console.warn(`  ! no ${type} document for "${slug}" — skipped`)
  }

  let written = 0
  for (const row of rows) {
    const text = copy[row.slug]
    if (row.length >= MIN_DESCRIPTION && !isForce) {
      console.log(`  ${type} ${row.slug}: already ${row.length} chars — left alone`)
      continue
    }
    console.log(
      `  ${type} ${row.slug}: ${row.length} → ${text.en.length} chars (en), ` +
        `${text.ru.length} (ru); first sentence ${text.en.split(/(?<=[.!?])\s/)[0].length} chars`,
    )
    if (isExecute) {
      // The whole field is replaced: the four unauthored locales still hold the
      // stub, and leaving them would pair a real paragraph with "Durres is the
      // main port." in Italian.
      await client.patch(row._id).set({description: {en: text.en, ru: text.ru}}).commit()
    }
    written += 1
  }
  return written
}

async function run() {
  console.log(`\n=== apply:zone-descriptions (${isDry ? 'DRY RUN' : 'EXECUTE'}${isForce ? ', force' : ''}) ===\n`)
  const cities = await applyTo('city', CITY_ZONE_DESCRIPTIONS)
  const districts = await applyTo('district', EXTRA_DISTRICT_DESCRIPTIONS)
  console.log(`\nDone: ${cities} city, ${districts} district description(s).`)
  if (isDry) console.log('Nothing was written — rerun with --execute.\n')
  else console.log('Now run: npm run generate:zone-seo -- --execute\n')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
