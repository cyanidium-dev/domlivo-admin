/**
 * Give every property a construction stage, where the data already says one.
 *
 * `constructionStage` is new, so every listing starts empty and the catalogue
 * filter would return nothing. Only one inference is safe: a building with a
 * `yearBuilt` in the past is finished. Everything else — no year at all — is
 * left empty and listed here for a human, because the alternative is telling a
 * buyer a building is ready when nobody checked.
 *
 * `documentation` is not guessed at all. Nothing in the current dataset records
 * whether a certificate exists, and inventing that answer is the one mistake
 * that costs a buyer money.
 *
 * Run:
 * - npm run backfill:construction-stage -- --dry
 * - npm run backfill:construction-stage -- --execute
 */
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const token = process.env.SANITY_API_TOKEN?.trim()
if (!token || !projectId) {
  console.error('Error: SANITY_PROJECT_ID and SANITY_API_TOKEN required.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
})

const args = process.argv.slice(2)
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')
if (!isDry && !isExecute) {
  console.error('Use --dry or --execute.')
  process.exit(1)
}

type Row = {
  _id: string
  title?: unknown
  yearBuilt?: number
  constructionStage?: string
  isPublished?: boolean
}

function label(row: Row): string {
  const t = row.title as Record<string, string> | string | undefined
  const text = typeof t === 'string' ? t : t?.en || t?.sq || t?.ru || ''
  return (text || row._id).slice(0, 52)
}

async function main() {
  const thisYear = new Date().getFullYear()
  const rows: Row[] = await client.fetch(
    `*[_type == "property"]{_id, title, yearBuilt, constructionStage, isPublished} | order(_id asc)`,
  )

  const alreadySet = rows.filter((r) => r.constructionStage)
  // A building finished in a past year is finished. A yearBuilt of this year or
  // later says nothing — it may be the promised completion, not a fact.
  const toComplete = rows.filter(
    (r) => !r.constructionStage && typeof r.yearBuilt === 'number' && r.yearBuilt < thisYear,
  )
  const needsHuman = rows.filter(
    (r) => !r.constructionStage && !(typeof r.yearBuilt === 'number' && r.yearBuilt < thisYear),
  )

  console.log(`${rows.length} properties.`)
  console.log(`  ${alreadySet.length} already have a stage — untouched.`)
  console.log(`  ${toComplete.length} have a yearBuilt before ${thisYear} -> completed.`)
  console.log(`  ${needsHuman.length} have no evidence either way -> left empty.\n`)

  for (const r of toComplete) {
    console.log(`  completed  ${String(r.yearBuilt).padEnd(6)} ${label(r)}`)
  }
  if (needsHuman.length) {
    console.log('\nNeeds a human (published ones first):')
    for (const r of [...needsHuman].sort((a, b) => Number(b.isPublished) - Number(a.isPublished))) {
      console.log(`  ${r.isPublished ? 'published' : 'draft    '}  ${label(r)}`)
    }
  }

  if (isDry) {
    console.log('\nDry run — nothing written.')
    return
  }
  if (!toComplete.length) {
    console.log('\nNothing to write.')
    return
  }

  let tx = client.transaction()
  for (const r of toComplete) {
    tx = tx.patch(r._id, (p) => p.set({constructionStage: 'completed'}))
  }
  await tx.commit()
  console.log(`\nSet constructionStage=completed on ${toComplete.length} properties.`)
  console.log(`${needsHuman.length} still need a stage chosen in Studio.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
