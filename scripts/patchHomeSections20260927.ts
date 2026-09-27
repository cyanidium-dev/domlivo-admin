/**
 * One-shot, 2026-09-27, home landing (`landing-home`), from the traffic audit:
 *
 * - The "Property in Albania worth investing in" carousel (`investment-picks`)
 *   showed the same cards as "Popular listings" two screens above it, on a
 *   12,300 px phone page with 38% average scroll depth. Removed.
 * - The "Platform for agents and agencies" pitch (`c4b3d3db14e5`) sold a B2B
 *   product on the buyers' storefront. Removed; /for-realtors stays linked
 *   from the footer.
 * - The investment block promised "7-10%" average rental yield while the
 *   guides on the same site say 4–6% gross. One number: the guides'.
 * - The popular carousel (sort "popular", no scope) opened with May 2026
 *   demo listings in Vlora whose photos carry another agency's watermark.
 *   Scoped to Durrës, where the stock and the partner photos are.
 *
 * Every change checks the current value first, so a later manual edit is
 * never overwritten.
 *
 * Run:
 * - npx tsx scripts/patchHomeSections20260927.ts            (dry)
 * - npx tsx scripts/patchHomeSections20260927.ts --execute
 */
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const execute = process.argv.slice(2).includes('--execute')
const DOC_ID = 'landing-home'
const REMOVE_KEYS = ['investment-picks', 'c4b3d3db14e5']
const YIELD_SECTION = '381af8cb9d85'
const YIELD_GROUP = 'cc7e80b0c0e8'
const YIELD_CARD = '8ed9de13b24d'
const POPULAR_SECTION = 'a1c65b3d8602'
const OLD_YIELD = /^7\s*[-–]\s*10\s*%$/
const NEW_YIELD = '4–6 %'

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID || 'g4aqp6ex',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  apiVersion: '2025-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
})

async function main() {
  const doc = await client.fetch<{
    _rev: string
    keys: string[]
    yieldValue: Record<string, string> | null
    popularFilters: unknown
  }>(
    `*[_id==$id][0]{_rev, "keys": pageSections[]._key,
      "yieldValue": pageSections[_key==$ys][0].contentGroups[_key==$yg][0].cards[_key==$yc][0].value,
      "popularFilters": pageSections[_key==$ps][0].filters}`,
    {id: DOC_ID, ys: YIELD_SECTION, yg: YIELD_GROUP, yc: YIELD_CARD, ps: POPULAR_SECTION},
  )
  if (!doc) throw new Error(`${DOC_ID} not found`)
  const unset = REMOVE_KEYS.filter((k) => doc.keys.includes(k)).map((k) => `pageSections[_key=="${k}"]`)
  const set: Record<string, unknown> = {}
  for (const [l, v] of Object.entries(doc.yieldValue ?? {})) {
    if (l.startsWith('_')) continue
    if (OLD_YIELD.test(String(v).trim())) {
      set[`pageSections[_key=="${YIELD_SECTION}"].contentGroups[_key=="${YIELD_GROUP}"].cards[_key=="${YIELD_CARD}"].value.${l}`] = NEW_YIELD
    }
  }
  // `filters.city` is a reference in the schema; a slug string there is ignored by the projection.
  const pf = doc.popularFilters as {city?: {_ref?: string}} | null
  if (!pf?.city?._ref) set[`pageSections[_key=="${POPULAR_SECTION}"].filters`] = {city: {_type: 'reference', _ref: 'city-durres'}}
  console.log(execute ? 'EXECUTE' : 'DRY', {rev: doc._rev, unset, set})
  if (!execute) return
  let patch = client.patch(DOC_ID)
  if (unset.length) patch = patch.unset(unset)
  if (Object.keys(set).length) patch = patch.set(set)
  const res = await patch.commit()
  console.log('patched, rev', res._rev)
}
main().catch((e) => { console.error(e.message); process.exit(1) })
