/**
 * Puts the get.al listings live once their copy is written, and corrects the
 * few fields the scrape got wrong that only reading each listing revealed.
 *
 * A separate step on purpose: re-running importGetAlListings.ts with
 * --publish would reset `sq` to the agency's text, overwriting the Albanian
 * that was rewritten alongside the other five locales.
 *
 * Refuses to publish a listing whose English still equals its Albanian —
 * that is an untranslated one, and it would show Albanian in every locale.
 *
 * Run: npx tsx scripts/publishGetAlListings.ts --dry | --execute
 */
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN?.trim(),
})
const execute = process.argv.includes('--execute')

/** Corrections read off the listing text; each note says what the scrape did. */
const FIXES: Record<string, {set?: Record<string, unknown>; type?: string; note: string}> = {
  'property-getal-5713': {set: {area: 320, plotArea: 700}, note: 'area was 800; built 140+180 m² on a 700 m² plot'},
  'property-getal-6669': {set: {area: 262}, note: 'area was 130; built 129.8+132 m²'},
  'property-getal-8001': {set: {rooms: 6}, note: 'rooms was 5; two living rooms + four bedrooms'},
  'property-getal-8985': {set: {area: 97}, note: 'area missing; 97 m² net'},
  'property-getal-9995': {set: {area: 88}, note: 'area missing; 88 m² net'},
  'property-getal-9212': {set: {bedrooms: 1, rooms: 2}, note: 'one bedroom, not two'},
  'property-getal-9828': {set: {bedrooms: 2}, note: '2+1 read as one bedroom'},
  'property-getal-6347': {type: 'apartment', note: 'apartments typed as commercial space'},
  'property-getal-6348': {type: 'apartment', note: 'apartments typed as commercial space'},
  'property-getal-6349': {type: 'apartment', note: 'apartments typed as commercial space'},
  'property-getal-6350': {type: 'apartment', note: 'apartments typed as commercial space'},
}

async function main() {
  const rows = await client.fetch<Array<{_id: string; en?: string; sq?: string; isPublished?: boolean; lifecycleStatus?: string}>>(
    `*[_type=="property" && _id match "property-getal-*" && !(_id in path("drafts.**"))]{
      _id, "en": title.en, "sq": title.sq, isPublished, lifecycleStatus
    }`,
  )
  const types = await client.fetch<Array<{_id: string; slug: string}>>(`*[_type=="propertyType"]{_id, "slug": slug.current}`)
  const typeId = new Map(types.map((t) => [t.slug, t._id]))

  const untranslated = rows.filter((r) => !r.en || r.en === r.sq)
  const ready = rows.filter((r) => r.en && r.en !== r.sq)
  console.log(`${rows.length} get.al listings: ${ready.length} translated, ${untranslated.length} not`)
  if (untranslated.length) console.log(`  held back: ${untranslated.map((r) => r._id).join(', ')}`)

  for (const [id, fix] of Object.entries(FIXES)) console.log(`  fix ${id}: ${fix.note}`)
  if (!execute) return console.log('\nDry run. Re-run with --execute.')

  let n = 0
  for (let i = 0; i < ready.length; i += 50) {
    const tx = client.transaction()
    for (const row of ready.slice(i, i + 50)) {
      const fix = FIXES[row._id]
      const set: Record<string, unknown> = {isPublished: true, ...(fix?.set ?? {})}
      // Sold and reserved were never imported; anything still in draft is for sale.
      if (!row.lifecycleStatus || row.lifecycleStatus === 'draft') set.lifecycleStatus = 'active'
      if (fix?.type) {
        const ref = typeId.get(fix.type)
        if (!ref) throw new Error(`property type "${fix.type}" not found`)
        set.type = {_type: 'reference', _ref: ref}
      }
      tx.patch(row._id, (p) => p.set(set))
      n += 1
    }
    await tx.commit()
  }
  console.log(`\nPublished ${n} listings.`)
}

// Message only: a Sanity client error carries the request, token included.
main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e))
  process.exit(1)
})
