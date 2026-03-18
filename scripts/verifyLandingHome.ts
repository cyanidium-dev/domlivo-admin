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
  const q = `*[_type=="landingPage" && _id=="landing-home"][0]{
    _id,
    _type,
    pageType,
    enabled,
    "sectionTypes": pageSections[]._type,
    seo
  }`
  const r = await client.fetch(q)
  console.log(JSON.stringify({projectId, dataset, r}, null, 2))
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})

