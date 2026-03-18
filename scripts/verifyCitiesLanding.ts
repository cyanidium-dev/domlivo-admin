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
  const q = `*[_type=="landingPage" && _id=="landing-cities"][0]{
    _id,
    _type,
    pageType,
    enabled,
    slug,
    seo,
    "sectionTypes": pageSections[]._type,
    "grid": pageSections[_type=="landingGridSection"][0]{
      enabled,
      title,
      sourceMode,
      auto,
      "landings": select(
        sourceMode == "manual" => manualItems[]->{
          _id, pageType, slug, title, cardTitle, cardDescription, cardImage,
          linkedCity->{_id, slug, title}
        },
        sourceMode == "auto" => *[_type=="landingPage" && enabled!=false && pageType in ^.auto.pageTypes && _id != "landing-home" && _id != ^.^._id]
          | order(title.en asc)[0...200]{
            _id, pageType, slug, title, cardTitle, cardDescription, cardImage,
            linkedCity->{_id, slug, title}
          }
      )
    }
  }`

  const r = await client.fetch(q)
  console.log(JSON.stringify({projectId, dataset, r, gridItems: r?.grid?.landings?.length ?? 0}, null, 2))
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})

