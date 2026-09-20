/**
 * One-shot, 2026-09-20. Title tuning from the SERP study of the same day
 * (your-house-albania: domlivo.com-audit/2026-09-20/findings/sxo-serp.md).
 *
 * The winnable queries name the country, and our titles did not:
 * - "apartments for sale golem albania": every ranking page is a Golem page
 *   one level under the city, several with 3-4 listings; ours said
 *   "Golem, Durrës" and never "Albania".
 * - "nieruchomości albania durres" / "immobilien albanien durres": thin SERPs
 *   (Wikipedia pages, single-owner sites); the pl and de city titles get the
 *   country and the noun the query uses.
 * - ru/uk Golem titles were the generic template ("недвижимость и квартиры").
 *
 * No preposition before a place name in ru/uk/pl, as in sprint 1: the name
 * stays in the nominative and nothing needs declining.
 *
 * Only the listed fields change, and only when the current value equals the
 * expected old value, so a later manual edit is never overwritten.
 *
 * Run:
 * - npx tsx scripts/applyTitleTuning20260920.ts            (dry)
 * - npx tsx scripts/applyTitleTuning20260920.ts --execute
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.slice(2).includes('--execute')

type Change = {id: string; field: string; locale: string; from: string; to: string}

const GOLEM = 'catalogSeoPage-district-district-golem-durres'
const DURRES = 'catalogSeoPage-city-city-durres'

const CHANGES: Change[] = [
  {id: GOLEM, field: 'seo.metaTitle', locale: 'en',
    from: 'Apartments for Sale in Golem, Durrës — Beach Apartments & New Builds',
    to: 'Apartments for Sale in Golem, Albania — Beach Flats & New Builds'},
  {id: GOLEM, field: 'title', locale: 'en',
    from: 'Apartments for Sale in Golem, Durrës',
    to: 'Apartments for Sale in Golem, Albania'},
  {id: GOLEM, field: 'seo.metaTitle', locale: 'ru',
    from: 'Голем, Дуррес: недвижимость и квартиры',
    to: 'Голем, Албания: квартиры у моря на продажу — цены 2026'},
  {id: GOLEM, field: 'title', locale: 'ru',
    from: 'Голем, Дуррес: недвижимость и квартиры',
    to: 'Голем, Дуррес: квартиры у моря на продажу'},
  {id: GOLEM, field: 'seo.metaTitle', locale: 'uk',
    from: 'Голем, Дуррес: нерухомість та квартири',
    to: 'Голем, Албанія: квартири біля моря на продаж — ціни 2026'},
  {id: GOLEM, field: 'title', locale: 'uk',
    from: 'Голем, Дуррес: нерухомість та квартири',
    to: 'Голем, Дуррес: квартири біля моря на продаж'},
  {id: GOLEM, field: 'seo.metaTitle', locale: 'pl',
    from: 'Golem, Durrës: apartamenty nad morzem na sprzedaż — ceny 2026',
    to: 'Golem, Albania: apartamenty nad morzem na sprzedaż — ceny 2026'},
  {id: GOLEM, field: 'seo.metaTitle', locale: 'de',
    from: 'Wohnung am Meer kaufen in Golem, Durrës — Neubauten & Preise',
    to: 'Wohnung am Meer kaufen in Golem, Albanien — Neubauten & Preise'},

  {id: DURRES, field: 'seo.metaTitle', locale: 'en',
    from: 'Durrës Real Estate: Apartments & Property for Sale',
    to: 'Apartments & Property for Sale in Durrës, Albania — Prices 2026'},
  {id: DURRES, field: 'seo.metaTitle', locale: 'pl',
    from: 'Apartamenty i mieszkania na sprzedaż w Durrës — ceny 2026',
    to: 'Durrës, Albania: mieszkania i nieruchomości na sprzedaż — ceny 2026'},
  {id: DURRES, field: 'title', locale: 'pl',
    from: 'Durrës: apartamenty i mieszkania na sprzedaż',
    to: 'Durrës, Albania: mieszkania i apartamenty na sprzedaż'},
  {id: DURRES, field: 'seo.metaTitle', locale: 'de',
    from: 'Wohnung kaufen in Durrës, Albanien — Immobilien am Meer',
    to: 'Immobilien in Durrës, Albanien: Wohnung kaufen am Meer — Preise 2026'},
]

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

function read(doc: Record<string, unknown>, dotted: string): unknown {
  return dotted.split('.').reduce<unknown>((acc, key) => (acc as Record<string, unknown> | undefined)?.[key], doc)
}

async function main(): Promise<void> {
  const ids = [...new Set(CHANGES.map((c) => c.id))]
  const docs: Record<string, unknown>[] = await client.fetch(`*[_id in $ids]`, {ids})
  const byId = new Map(docs.map((d) => [d._id as string, d]))

  const tx = client.transaction()
  let applied = 0

  for (const c of CHANGES) {
    const doc = byId.get(c.id)
    if (!doc) {
      console.log(`SKIP ${c.id}: not found`)
      continue
    }
    const current = read(doc, `${c.field}.${c.locale}`)
    if (current === c.to) {
      console.log(`ok   ${c.id} ${c.field}.${c.locale}: already set`)
      continue
    }
    if (current !== c.from) {
      console.log(`SKIP ${c.id} ${c.field}.${c.locale}: value changed since the study ("${String(current)}")`)
      continue
    }
    if (c.field === 'seo.metaTitle' && c.to.length > 68) {
      throw new Error(`Title too long (${c.to.length}): ${c.to}`)
    }
    console.log(`SET  ${c.id} ${c.field}.${c.locale}: "${c.from}" -> "${c.to}"`)
    tx.patch(c.id, (p) => p.set({[`${c.field}.${c.locale}`]: c.to}))
    applied += 1
  }

  console.log(`${applied} of ${CHANGES.length} changes to apply.`)
  if (!execute) {
    console.log('Dry run. Re-run with --execute to write.')
    return
  }
  if (applied === 0) return
  const res = await tx.commit()
  console.log(`Committed transaction ${res.transactionId}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
