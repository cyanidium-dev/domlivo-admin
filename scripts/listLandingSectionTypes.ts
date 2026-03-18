import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const apiVersion = (process.env.SANITY_API_VERSION || '2024-01-01').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

if (!token) {
  console.error('Error: SANITY_API_TOKEN required. Add to .env')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion, useCdn: false, token})

async function run() {
  const docs = await client.fetch<any[]>(
    `*[_type=="landingPage"]{
      _id,
      pageType,
      "sectionTypes": pageSections[]._type
    }`,
  )

  const uniq = new Set<string>()
  for (const d of docs) {
    const arr = Array.isArray(d?.sectionTypes) ? d.sectionTypes : []
    for (const t of arr) if (typeof t === 'string' && t) uniq.add(t)
  }

  const canonical = Array.from(uniq).sort()
  console.log(JSON.stringify({projectId, dataset, landingCount: docs.length, canonicalSectionTypes: canonical}, null, 2))
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})

