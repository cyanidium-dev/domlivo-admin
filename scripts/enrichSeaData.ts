/**
 * Domlivo CMS — read distance to the sea, first line and sea view out of
 * listing copy into structured fields.
 *
 * Why: the "near the sea" listing pages need a number to filter on, and the
 * listings already state it in prose ("70 m from the beach", "в 200 м от
 * моря", "shtatëdhjetë metra nga deti") — in 93 of 358 Durrës listings by a
 * first count — while only 18 carry the sea-view amenity and none has a
 * distance field. This script copies what the text says; it never estimates.
 *
 * Rules:
 * - Reads title, shortDescription and description in all six locales.
 * - `seaDistanceMeters`: the smallest distance stated next to sea/beach words,
 *   digits or spelled-out numbers, 5–3,000 m. Written only when the field is
 *   empty, so a value an editor set is never overwritten.
 * - `beachfront`: only explicit first-line wording (first line, vijë e parë,
 *   первая линия, перша лінія, prima linea, pierwsza linia). Written only when
 *   the field is unset.
 * - `sea-view` amenity: added when the text says sea view and does not negate
 *   it; existing amenities are kept.
 * - Dry run unless `--execute`; every change is printed with the phrase that
 *   produced it. Full documents are backed up before writing; writes use
 *   ifRevisionID. Published documents only (drafts are skipped and reported).
 *
 * Run:
 *   npx tsx scripts/enrichSeaData.ts            # dry run, all published properties
 *   npx tsx scripts/enrichSeaData.ts --execute
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {firstLinePhrase, readDistance, seaViewPhrase} from './lib/seaText'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.includes('--execute')
const token = process.env.SANITY_API_TOKEN?.trim()
if (!token) {
  console.error('SANITY_API_TOKEN required in .env')
  process.exit(1)
}
const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token,
  useCdn: false,
})

type Row = {
  _id: string
  _rev: string
  slug?: string
  city?: string
  seaDistanceMeters?: number
  beachfront?: boolean
  amenityIds: string[]
  texts: string[]
}

async function main(): Promise<void> {
  const seaViewId = await client.fetch<string | null>(`*[_type == "amenity" && slug.current == "sea-view"][0]._id`)
  if (!seaViewId) throw new Error('sea-view amenity not found')

  const rows = await client.fetch<Row[]>(`*[_type == "property" && !(_id in path("drafts.**")) && isPublished == true]{
    _id, _rev, "slug": slug.current, "city": city->slug.current, seaDistanceMeters, beachfront,
    "amenityIds": coalesce(amenitiesRefs[]._ref, []),
    "texts": [
      title.en, title.sq, title.ru, title.uk, title.it, title.pl,
      shortDescription.en, shortDescription.sq, shortDescription.ru, shortDescription.uk, shortDescription.it, shortDescription.pl,
      description.en, description.sq, description.ru, description.uk, description.it, description.pl
    ]
  }`)
  const drafts = await client.fetch<number>(`count(*[_type == "property" && _id in path("drafts.**")])`)

  type Plan = {row: Row; set: Record<string, unknown>; addSeaView: boolean; notes: string[]}
  const plans: Plan[] = []
  const stats = {distance: 0, beachfront: 0, seaView: 0, keptDistance: 0}
  for (const row of rows) {
    const texts = (row.texts ?? []).filter((t): t is string => typeof t === 'string' && t.length > 0)
    const set: Record<string, unknown> = {}
    const notes: string[] = []
    const distance = readDistance(texts)
    if (distance) {
      if (typeof row.seaDistanceMeters === 'number') stats.keptDistance++
      else {
        set.seaDistanceMeters = distance.meters
        notes.push(`distance ${distance.meters} m ← "${distance.phrase.trim()}"`)
        stats.distance++
      }
    }
    const firstLine = firstLinePhrase(texts)
    if (firstLine && typeof row.beachfront !== 'boolean') {
      set.beachfront = true
      notes.push(`first line ← "${firstLine}"`)
      stats.beachfront++
    }
    const seaView = seaViewPhrase(texts)
    const addSeaView = Boolean(seaView) && !row.amenityIds.includes(seaViewId)
    if (addSeaView) {
      notes.push(`sea view ← "${seaView}"`)
      stats.seaView++
    }
    if (Object.keys(set).length > 0 || addSeaView) plans.push({row, set, addSeaView, notes})
  }

  for (const p of plans) console.log(`${p.row.city ?? '-'} ${p.row.slug}\n  ${p.notes.join('\n  ')}`)
  console.log(
    `\n${rows.length} published properties scanned (${drafts} drafts skipped). ` +
      `To write: distance ${stats.distance}, first line ${stats.beachfront}, sea-view amenity ${stats.seaView}. ` +
      `Existing distances kept: ${stats.keptDistance}.`,
  )
  if (!execute) {
    console.log('Dry run. Re-run with --execute to write.')
    return
  }
  if (plans.length === 0) return

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.resolve(process.cwd(), 'scripts/data/backups', `enrichSeaData-${stamp}`)
  fs.mkdirSync(backupDir, {recursive: true})
  const full = await client.fetch<Array<{_id: string}>>(`*[_id in $ids]`, {ids: plans.map((p) => p.row._id)})
  for (const doc of full) fs.writeFileSync(path.join(backupDir, `${doc._id}.json`), JSON.stringify(doc, null, 2))

  for (let i = 0; i < plans.length; i += 50) {
    const tx = client.transaction()
    for (const p of plans.slice(i, i + 50)) {
      tx.patch(p.row._id, (patch) => {
        let next = patch.ifRevisionId(p.row._rev)
        if (Object.keys(p.set).length > 0) next = next.set(p.set)
        if (p.addSeaView) {
          next = next
            .setIfMissing({amenitiesRefs: []})
            .append('amenitiesRefs', [{_type: 'reference', _ref: seaViewId, _key: `seaview${p.row._id.slice(-6)}`}])
        }
        return next
      })
    }
    const res = await tx.commit()
    console.log(`batch ${i / 50 + 1}: ${res.transactionId}`)
  }
  console.log(`Backups: ${backupDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
