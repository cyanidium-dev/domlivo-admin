import 'dotenv/config'
import {createClient} from '@sanity/client'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_TOKEN

if (!projectId) {
  throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID')
}

if (!dataset) {
  throw new Error('Missing NEXT_PUBLIC_SANITY_DATASET')
}

if (!token) {
  throw new Error('Missing SANITY_API_TOKEN')
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-02-01',
  token,
  useCdn: false,
})

async function main() {
  console.log({
    projectId,
    dataset,
    tokenExists: !!token,
    tokenLength: token?.length ?? 0,
  })

  const existing = await client.fetch(`*[_type == "locationTag"][0]{_id, title}`)
  console.log('Fetch OK:', existing ?? null)

  const created = await client.createIfNotExists({
    _id: 'debug-auth-test',
    _type: 'locationTag',
    title: 'Debug Auth Test',
    slug: {current: 'debug-auth-test'},
    active: true,
  })

  console.log('Write OK:', {
    _id: created._id,
    _type: created._type,
  })
}

main().catch((error) => {
  console.error('Auth test failed')
  console.error(error)
  process.exit(1)
})
