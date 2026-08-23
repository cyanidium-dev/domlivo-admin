/**
 * Fills `property.rooms` on listings written before the field existed, from the
 * Albanian notation their own titles already carry.
 *
 * `Apartament 2+1` says three rooms and two bedrooms; a `Studio` says one of
 * each. Nothing is derived from the area, and nothing is derived from the
 * bedroom count alone — see SPEC-rooms-line-2026-08-22.md.
 *
 * **When the notation and the stored bedroom count disagree, this writes
 * nothing and reports it.** `1+1` on a document that says two bedrooms is a
 * contradiction a person has to resolve: silently trusting either number would
 * bake a guess into the catalogue.
 *
 * A document with an open draft is patched in both places, so publishing the
 * draft later does not wipe the value.
 *
 * Run:
 * - npm run backfill:property-rooms            (dry)
 * - npm run backfill:property-rooms -- --execute
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.slice(2).includes('--execute')

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

type Row = {
  _id: string
  rooms?: number
  bedrooms?: number
  title?: Record<string, string>
  description?: Record<string, string>
}

/** `2+1` → {bedrooms: 2, rooms: 3}; a studio → {bedrooms: 1, rooms: 1}. */
export function readLayout(text: string): {bedrooms: number; rooms: number} | null {
  const notation = /(\d)\s*\+\s*(\d)/.exec(text)
  if (notation) {
    const beds = Number(notation[1])
    const living = Number(notation[2])
    if (beds > 0 && beds <= 20 && living >= 0 && living <= 5) return {bedrooms: beds, rooms: beds + living}
  }
  // A garsonierë counts its single room as one bedroom, so both are 1.
  if (/\bgarsonier|\bstudio\b|студи/i.test(text)) return {bedrooms: 1, rooms: 1}
  return null
}

async function main(): Promise<void> {
  const rows: Row[] = await client.fetch(
    `*[_type == "property" && !defined(rooms)]{_id, rooms, bedrooms, title, description} | order(_id)`,
  )

  const writes: Array<{id: string; rooms: number; from: string}> = []
  const conflicts: Array<{id: string; says: string; stored: number; title: string}> = []
  const silent: string[] = []

  for (const r of rows) {
    const title = (r.title ?? {}) as Record<string, string>
    const haystack = [title.sq, title.en, title.ru, (r.description ?? {}).sq].filter(Boolean).join(' | ')
    const layout = readLayout(haystack)
    if (!layout) {
      silent.push(r._id)
      continue
    }
    if (typeof r.bedrooms === 'number' && r.bedrooms !== layout.bedrooms) {
      conflicts.push({
        id: r._id,
        says: `${layout.bedrooms}+${layout.rooms - layout.bedrooms}`,
        stored: r.bedrooms,
        title: (title.sq || title.en || '').slice(0, 60),
      })
      continue
    }
    writes.push({id: r._id, rooms: layout.rooms, from: (title.sq || title.en || '').slice(0, 60)})
  }

  console.log(`${rows.length} propert(ies) without rooms\n`)
  console.log(`Derivable (${writes.length}):`)
  for (const w of writes) console.log(`  ${w.id.padEnd(34)} rooms=${w.rooms}  ${w.from}`)
  console.log(`\nContradictory, left for a person (${conflicts.length}):`)
  for (const c of conflicts) {
    console.log(`  ${c.id.padEnd(34)} title says ${c.says}, document says ${c.stored} bedrooms  ${c.title}`)
  }
  console.log(`\nNothing states the layout, left empty (${silent.length}): ${silent.join(', ') || 'none'}`)

  if (!execute) {
    console.log('\nDry run — nothing written. Re-run with --execute.')
    return
  }

  // Patch the draft too where one exists, so publishing it later does not
  // discard the value.
  const draftIds: string[] = await client.fetch(`*[_id in $ids]._id`, {
    ids: writes.map((w) => `drafts.${w.id}`),
  })
  const draftSet = new Set(draftIds)

  // The query returns drafts as their own rows, so a listing whose draft is
  // also missing the field would otherwise be patched twice in one transaction.
  const targets = new Map<string, number>()
  for (const w of writes) {
    targets.set(w.id, w.rooms)
    if (draftSet.has(`drafts.${w.id}`)) targets.set(`drafts.${w.id}`, w.rooms)
  }
  let tx = client.transaction()
  for (const [id, rooms] of targets) tx = tx.patch(id, (p) => p.set({rooms}))
  const patched = targets.size
  if (patched > 0) await tx.commit()
  console.log(`\nWrote rooms on ${patched} document(s) (${writes.length} listings, ${patched - writes.length} of them with an open draft).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
