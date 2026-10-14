/**
 * Write the hand-made uk, sq, it, pl and de translations of the zoneMetrics
 * research notes into Sanity.
 *
 * Source: scripts/data/zoneMetricsNotes-2026-10-14.json, produced by
 * exportZoneMetricsNotes20261014.ts and then translated by hand (the owner does
 * not allow machine translation through an API). Each row is
 * {_id, zone, en, ru, uk, sq, it, pl, de}.
 *
 *   npx tsx scripts/applyZoneMetricsNotes20261014.ts --dry
 *   npx tsx scripts/applyZoneMetricsNotes20261014.ts --execute
 *
 * Safety:
 * - only sets notes.<locale> where that locale is empty; never overwrites;
 * - skips a doc whose notes.en no longer matches the English the translation
 *   was made from (the source changed, the translation would be stale);
 * - every patch carries ifRevisionId, and docs go in transactions of 20.
 */

import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const args = process.argv.slice(2)
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')

if (!token || !projectId) {
  console.error('Error: SANITY_PROJECT_ID and SANITY_API_TOKEN required. Add them to .env')
  process.exit(1)
}
if (isDry === isExecute) {
  console.error('Use exactly one of --dry or --execute.')
  process.exit(1)
}

const LOCALES = ['uk', 'sq', 'it', 'pl', 'de'] as const
type Locale = (typeof LOCALES)[number]
type Row = {_id: string; zone: string; en: string; ru: string} & Partial<Record<Locale, string>>
type Doc = {_id: string; _rev: string; notes?: Record<string, unknown> | null}

const DATA = path.resolve(process.cwd(), 'scripts/data/zoneMetricsNotes-2026-10-14.json')
const BATCH = 20

const client = createClient({projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token})

const isFilled = (v: unknown) => typeof v === 'string' && v.trim().length > 0

async function main() {
  const rows = JSON.parse(fs.readFileSync(DATA, 'utf8')) as Row[]
  const docs = await client.fetch<Doc[]>(
    `*[_type == "zoneMetrics" && _id in $ids]{_id, _rev, notes}`,
    {ids: rows.map((r) => r._id)},
  )
  const byId = new Map(docs.map((d) => [d._id, d]))

  const perLocale: Record<Locale, number> = {uk: 0, sq: 0, it: 0, pl: 0, de: 0}
  const skipped: string[] = []
  const plans: {doc: Doc; set: Record<string, string>; setNotesObject: boolean}[] = []

  for (const row of rows) {
    const doc = byId.get(row._id)
    if (!doc) {
      skipped.push(`${row._id}: not found (or not published)`)
      continue
    }
    const liveEn = typeof doc.notes?.en === 'string' ? (doc.notes.en as string) : ''
    if (liveEn.trim() !== row.en.trim()) {
      skipped.push(`${row._id}: notes.en changed since export`)
      continue
    }
    const set: Record<string, string> = {}
    for (const l of LOCALES) {
      const text = row[l]?.trim()
      if (!text) {
        skipped.push(`${row._id}: no ${l} translation in the data file`)
        continue
      }
      if (isFilled(doc.notes?.[l])) {
        skipped.push(`${row._id}: notes.${l} already set, left alone`)
        continue
      }
      set[`notes.${l}`] = text
      perLocale[l]++
    }
    if (Object.keys(set).length) plans.push({doc, set, setNotesObject: !doc.notes})
  }

  console.log(`rows in data file: ${rows.length}, docs found: ${docs.length}, docs to patch: ${plans.length}`)
  console.log('fields to set per locale:', perLocale)
  if (skipped.length) console.log(`skipped (${skipped.length}):\n  ` + skipped.join('\n  '))

  if (isDry) {
    for (const p of plans.slice(0, 3)) console.log(`\n${p.doc._id}`, p.set)
    console.log('\nDry run, nothing written.')
    return
  }

  for (let i = 0; i < plans.length; i += BATCH) {
    const chunk = plans.slice(i, i + BATCH)
    const tx = client.transaction()
    for (const p of chunk) {
      tx.patch(p.doc._id, (patch) => {
        let q = patch.ifRevisionId(p.doc._rev)
        if (p.setNotesObject) q = q.setIfMissing({notes: {_type: 'localizedText'}})
        return q.set(p.set)
      })
    }
    const res = await tx.commit({visibility: 'sync'})
    console.log(`transaction ${res.transactionId}: ${chunk.length} docs`)
  }
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
