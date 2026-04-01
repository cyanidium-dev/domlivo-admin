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
  const ids = ['landing-tirana', 'landing-durres']
  const query = `*[_id in $ids]{
    _id,
    _type,
    pageType,
    enabled,
    slug,
    linkedCity->{_id, slug, title},
    "sectionTypes": pageSections[]._type,
    "sectionsCount": count(pageSections),
    "heroTabs": pageSections[_type=="heroSection"][0].search.tabs[]{key, enabled},
    "faqCount": count(pageSections[_type=="faqSection"][0].items),
    "galleryCount": count(pageSections[_type=="linkedGallerySection"][0].items),
    "hasSeoRichText": defined(pageSections[_type=="seoTextSection"][0]),
    "hasCityIntroRichText": defined(pageSections[_type=="seoTextSection" && defined(title.en)][0]),
    "hasGallery": defined(pageSections[_type=="linkedGallerySection"][0]),
    "ctaSummary": {
      "heroCtaHref": pageSections[_type=="heroSection"][0].cta.href,
      "heroCtaLabel": pageSections[_type=="heroSection"][0].cta.label,
      "carouselCtaHref": pageSections[_type=="propertyCarouselSection"][0].cta.href,
      "carouselCtaLabel": pageSections[_type=="propertyCarouselSection"][0].cta.label,
      "cityIntroCtaHref": pageSections[_type=="seoTextSection" && defined(title.en)][0].cta.href,
      "cityIntroCtaLabel": pageSections[_type=="seoTextSection" && defined(title.en)][0].cta.label
    }
  } | order(_id asc)`

  const res = await client.fetch(query, {ids})
  console.log(JSON.stringify({projectId, dataset, ids, res}, null, 2))
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})

