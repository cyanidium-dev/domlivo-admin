/**
 * Strict verification: canonical homepage source of truth.
 *
 * Checks in Sanity dataset:
 * - landing-home exists
 * - pageType === "home"
 * - enabled !== false (informational)
 * - pageSections exists + count + ordered list of section _type values
 *
 * Run:
 * - npm run verify:canonical-home
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  process.env.SANITY_PROJECT_ID ||
  'g4aqp6ex'
).trim()
const dataset = (process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production').trim()
const apiVersion = (
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ||
  process.env.SANITY_API_VERSION ||
  '2024-01-01'
).trim()
const token = process.env.SANITY_API_TOKEN?.trim()

if (!token) {
  console.error('Error: SANITY_API_TOKEN required. Add to .env')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
})

type Section = {_type?: string; _key?: string}

function typesList(sections: unknown): string[] {
  if (!Array.isArray(sections)) return []
  return sections
    .map((s) => (s && typeof s === 'object' ? (s as Section)._type : undefined))
    .filter(Boolean) as string[]
}

async function run() {
  console.log('--- Verify canonical homepage (landing-home) ---\n')
  console.log(`Project: ${projectId}`)
  console.log(`Dataset: ${dataset}`)
  console.log(`API version: ${apiVersion}\n`)

  const landing = await client.fetch<{
    _id: string
    _type: string
    pageType?: string
    enabled?: boolean
    pageSections?: unknown[]
  } | null>(`*[_type == "landingPage" && _id == "landing-home"][0]{
      _id,
      _type,
      pageType,
      enabled,
      pageSections
    }`)

  console.log(`landing-home exists: ${landing ? 'YES' : 'NO'}`)
  if (!landing) process.exit(1)

  console.log(`pageType: ${landing.pageType ?? '(missing)'}`)
  console.log(`enabled: ${landing.enabled === false ? 'false' : 'true/undefined'}`)

  const types = typesList(landing.pageSections)
  console.log(`pageSections count: ${types.length}`)
  console.log(`pageSections unique types: ${Array.from(new Set(types)).join(', ') || '(none)'}`)
  if (types.length) console.log(`pageSections order: ${types.join(' -> ')}`)

  const okPageType = landing.pageType === 'home'
  const okHasSections = types.length > 0

  console.log('\nAssertions:')
  console.log(`- landing-home.pageType === "home": ${okPageType ? 'PASS' : 'FAIL'}`)
  console.log(`- landing-home.pageSections non-empty: ${okHasSections ? 'PASS' : 'FAIL'}`)

  if (!okPageType || !okHasSections) process.exit(1)
}

run().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})

