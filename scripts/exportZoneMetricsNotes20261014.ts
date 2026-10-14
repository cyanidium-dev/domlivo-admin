/**
 * Export the research notes of every published zoneMetrics document so they can
 * be translated by hand into uk, sq, it, pl and de.
 *
 * The notes exist in en and ru only. The site hides a note when it is missing in
 * the reader's language, so those five locales currently show none. The owner
 * does not allow machine translation through an API, so the translations are
 * written into the exported JSON by hand and pushed with
 * applyZoneMetricsNotes20261014.ts.
 *
 *   npx tsx scripts/exportZoneMetricsNotes20261014.ts
 *
 * Writes scripts/data/zoneMetricsNotes-2026-10-14.json as [{_id, zone, en, ru}],
 * only for documents that have an English note (the source of the translation).
 * Refuses to overwrite an existing file (it may already hold translations)
 * unless --force.
 */

import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()
const isForce = process.argv.includes('--force')

if (!token || !projectId) {
  console.error('Error: SANITY_PROJECT_ID and SANITY_API_TOKEN required. Add them to .env')
  process.exit(1)
}

const OUT = path.resolve(process.cwd(), 'scripts/data/zoneMetricsNotes-2026-10-14.json')

const client = createClient({projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token})

type Row = {_id: string; zone: string | null; notes?: Record<string, unknown> | null}

async function main() {
  if (fs.existsSync(OUT) && !isForce) {
    console.error(`${OUT} exists (it may hold translations). Use --force to overwrite.`)
    process.exit(1)
  }
  const rows = await client.fetch<Row[]>(
    `*[_type == "zoneMetrics" && !(_id in path("drafts.**"))] | order(_id asc){
      _id, "zone": coalesce(zone->title.en, zone->slug.current), notes
    }`,
  )
  const out = rows.map((r) => ({
    _id: r._id,
    zone: r.zone ?? '',
    en: typeof r.notes?.en === 'string' ? (r.notes.en as string) : '',
    ru: typeof r.notes?.ru === 'string' ? (r.notes.ru as string) : '',
  }))
  const withEn = out.filter((r) => r.en.trim())
  for (const r of out) if (!r.en.trim()) console.log(`skip (no notes.en): ${r._id}`)
  const otherLocales = rows.filter((r) =>
    ['uk', 'sq', 'it', 'pl', 'de'].some((l) => typeof r.notes?.[l] === 'string' && (r.notes[l] as string).trim()),
  ).length
  fs.writeFileSync(OUT, JSON.stringify(withEn, null, 2) + '\n', 'utf8')
  console.log(`zoneMetrics docs: ${rows.length}, with notes.en: ${withEn.length}, already with uk/sq/it/pl/de: ${otherLocales}`)
  console.log(`Wrote ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
