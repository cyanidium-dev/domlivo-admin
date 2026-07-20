/**
 * Inspect DatoCMS schema and sample records.
 *
 * Run:  npx tsx scripts/inspectDato.ts
 *
 * Requires DATO_API_TOKEN in .env (full read-only or full-access token).
 *
 * Prints:
 *  - List of item types (models) with API keys and field info
 *  - Sample of first record for each "property-like" model
 *
 * Used to discover the actual model/field names before running importFromDato.ts.
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const DATO_TOKEN = (process.env.DATO_API_TOKEN || '').trim()

if (!DATO_TOKEN) {
  console.error('ERROR: DATO_API_TOKEN missing. Add it to .env')
  process.exit(1)
}

const DATO_BASE = 'https://site-api.datocms.com'

async function dato<T = unknown>(pathStr: string): Promise<T> {
  const res = await fetch(`${DATO_BASE}${pathStr}`, {
    headers: {
      Authorization: `Bearer ${DATO_TOKEN}`,
      Accept: 'application/json',
      'X-Api-Version': '3',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Dato ${pathStr} -> ${res.status} ${text.slice(0, 400)}`)
  }
  return res.json() as Promise<T>
}

async function main() {
  // 1) List item types (models)
  const itemTypes = await dato<{data: any[]}>(`/item-types?page[limit]=500`)
  console.log(`\n=== ITEM TYPES (${itemTypes.data.length}) ===\n`)
  for (const t of itemTypes.data) {
    const a = t.attributes
    console.log(`- ${a.name}  (api_key: ${a.api_key})  id=${t.id}  singleton=${a.singleton}`)
  }

  // 2) For each item type, fetch fields
  console.log(`\n=== FIELDS PER MODEL ===`)
  for (const t of itemTypes.data) {
    const a = t.attributes
    const fields = await dato<{data: any[]}>(`/item-types/${t.id}/fields`)
    console.log(`\n# ${a.api_key}`)
    for (const f of fields.data) {
      const fa = f.attributes
      console.log(`   • ${fa.api_key}  [${fa.field_type}]  loc=${fa.localized}`)
    }
  }

  // 3) Find property-like model and dump 1 sample
  const propLike = itemTypes.data.find((t: any) =>
    /(property|properties|object|listing|estate|nedvizh|prodaja|prodaza|apartment|house|villa)/i.test(
      t.attributes.api_key,
    ),
  )
  if (propLike) {
    console.log(`\n=== SAMPLE RECORDS for model "${propLike.attributes.api_key}" ===`)
    const recs = await dato<{data: any[]; meta: any}>(
      `/items?filter[type]=${propLike.attributes.api_key}&page[limit]=2&version=published`,
    )
    console.log(`total_count = ${recs.meta?.total_count}`)
    console.log(JSON.stringify(recs.data, null, 2))
  } else {
    console.log(`\n(could not auto-detect property model; pick one from the list above)`)
  }
}

main().catch((e) => {
  console.error('FAILED:', e)
  process.exit(1)
})
