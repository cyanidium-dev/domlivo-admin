/**
 * Migration: Mark N random apartments as popular (`promoted = true`).
 *
 * Targets only property documents where:
 *   - isPublished === true
 *   - type->slug.current === "apartment"
 *
 * Behavior:
 *   - Counts how many qualifying apartments already have promoted === true.
 *   - If already >= TARGET, does nothing (idempotent).
 *   - Otherwise picks (TARGET - current) random non-promoted apartments and
 *     sets promoted=true on them. Never unsets existing promoted=true rows.
 *
 * Run:
 *   npx tsx scripts/seedPopularApartments.ts --dry-run
 *   npx tsx scripts/seedPopularApartments.ts --execute
 *   npx tsx scripts/seedPopularApartments.ts --execute --target=10
 *
 * Requires: SANITY_API_TOKEN in .env
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const isDryRun = process.argv.includes('--dry-run')
const isExecute = process.argv.includes('--execute')
const targetArg = process.argv.find((a) => a.startsWith('--target='))
const DEFAULT_TARGET = 7
const target = (() => {
  if (!targetArg) return DEFAULT_TARGET
  const n = Number(targetArg.slice('--target='.length))
  return Number.isFinite(n) && n > 0 && n < 1000 ? Math.floor(n) : DEFAULT_TARGET
})()

if (!isDryRun && !isExecute) {
  console.error('Use --dry-run to preview or --execute to apply patches.')
  process.exit(1)
}
if (!token) {
  console.error('Error: SANITY_API_TOKEN required in .env')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
})

type Apt = {_id: string; titleEn?: string; promoted?: boolean}

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

async function main() {
  const all = await client.fetch<Apt[]>(
    `*[_type == "property" && isPublished == true && type->slug.current == "apartment"]{
      _id,
      "titleEn": title.en,
      promoted
    }`,
  )

  const alreadyPromoted = all.filter((p) => p.promoted === true)
  const notPromoted = all.filter((p) => p.promoted !== true)

  console.log(`Apartments published & typed:        ${all.length}`)
  console.log(`Already promoted (popular):          ${alreadyPromoted.length}`)
  console.log(`Target popular count:                ${target}`)

  if (alreadyPromoted.length >= target) {
    console.log(`\nNothing to do — already have ≥ ${target} popular apartments.`)
    return
  }
  if (notPromoted.length === 0) {
    console.log('\nNo non-promoted apartments to choose from.')
    return
  }

  const need = target - alreadyPromoted.length
  const picked = shuffle(notPromoted).slice(0, need)

  console.log(`\nWill promote ${picked.length} apartment(s):`)
  picked.forEach((p) => {
    console.log(`  ${p._id}  ${p.titleEn || '(no en title)'}`)
  })

  if (isDryRun) {
    console.log('\nDry run. Re-run with --execute to apply patches.')
    return
  }

  const tx = client.transaction()
  for (const p of picked) {
    tx.patch(p._id, (patch) => patch.set({promoted: true}))
  }
  await tx.commit()
  console.log(`\nUpdated ${picked.length} apartment(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
