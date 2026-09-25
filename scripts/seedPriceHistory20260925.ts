/**
 * One-shot, 2026-09-25. Gives every published listing its first
 * `priceHistory` entry: the price it carries today, dated by the partner's
 * `createdAt` when the listing has one, else by the document's creation.
 * From here on the partner imports append an entry whenever the price
 * changes (scripts/importFindallListings.ts, `nextPriceHistory`).
 *
 * Only listings without a history are touched, and only when they have a
 * price above zero (zero means unknown).
 *
 * Run:
 * - npx tsx scripts/seedPriceHistory20260925.ts            (dry)
 * - npx tsx scripts/seedPriceHistory20260925.ts --execute
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.slice(2).includes('--execute')

type Row = {_id: string; price?: number; priceUnit?: string; createdAt?: string; _createdAt: string}

async function main() {
  const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID!,
    dataset: process.env.SANITY_DATASET!,
    apiVersion: '2024-01-01',
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
  })
  const rows = await client.fetch<Row[]>(
    `*[_type == "property" && !(_id in path("drafts.**")) && !defined(priceHistory) && defined(price) && price > 0]{ _id, price, priceUnit, createdAt, _createdAt }`,
  )
  console.log(`${rows.length} listing(s) without a price history`)
  if (!execute) {
    for (const r of rows.slice(0, 5)) console.log(`  ${r._id}: ${(r.createdAt ?? r._createdAt).slice(0, 10)} €${r.price}${r.priceUnit === 'per-sqm' ? '/m²' : ''}`)
    console.log('\nDry run. Re-run with --execute.')
    return
  }
  let tx = client.transaction()
  let n = 0
  for (const r of rows) {
    const date = (r.createdAt ?? r._createdAt).slice(0, 10)
    tx = tx.patch(r._id, (p) =>
      p.setIfMissing({
        priceHistory: [
          {
            _key: `seed-${date}`,
            _type: 'priceHistoryEntry',
            date,
            price: r.price,
            priceUnit: r.priceUnit === 'per-sqm' ? 'per-sqm' : 'total',
          },
        ],
      }),
    )
    n += 1
    if (n % 100 === 0) {
      await tx.commit()
      tx = client.transaction()
      console.log(`  ${n}/${rows.length}`)
    }
  }
  if (n % 100 !== 0) await tx.commit()
  console.log(`Seeded ${n} listing(s).`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
