/**
 * Validates city + deal landing assumptions against the live dataset.
 * Requires: SANITY_API_TOKEN in .env
 *
 * Run: npx tsx scripts/validateSidebarNavCmsStructure.ts
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const apiVersion = (process.env.SANITY_API_VERSION || '2024-01-01').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

async function main() {
  if (!token) {
    console.error('Missing SANITY_API_TOKEN — add to .env to run live validation.')
    process.exit(1)
  }

  const client = createClient({projectId, dataset, apiVersion, useCdn: false, token})

  const cityLandingsInvalid = await client.fetch<
    {_id: string; pageType?: string; linkedCity?: unknown}[]
  >(
    `*[_type == "landingPage" && pageType == "city" && (!defined(linkedCity) || linkedCity == null)]{_id, pageType, linkedCity}`,
  )

  const allCityLandings = await client.fetch<{_id: string; cityRef: string | null}[]>(
    `*[_type == "landingPage" && pageType == "city"]{_id, "cityRef": linkedCity._ref}`,
  )
  const byCityRef = new Map<string, string[]>()
  for (const row of allCityLandings) {
    if (!row.cityRef) continue
    const list = byCityRef.get(row.cityRef) ?? []
    list.push(row._id)
    byCityRef.set(row.cityRef, list)
  }
  const cityLandingsDup = [...byCityRef.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([ref, ids]) => ({linkedCityRef: ref, landingPageIds: ids}))

  const citiesWithoutLanding = await client.fetch<
    {_id: string; slug: string | null}[]
  >(
    `*[_type == "city" && isPublished == true && !(_id in *[_type == "landingPage" && pageType == "city" && defined(linkedCity)].linkedCity._ref)]{
      _id,
      "slug": slug.current
    } | order(slug asc)`,
  )

  const dealSlugCandidates = ['sale', 'rent', 'short-term-rent', 'short-term', 'shortTerm']
  const dealLandingsBySlug = await client.fetch<Record<string, unknown>[]>(
    `*[_type == "landingPage" && slug.current in $slugs]{
      _id,
      pageType,
      "slug": slug.current,
      enabled
    } | order(slug asc)`,
    {slugs: dealSlugCandidates},
  )

  const pageTypesPresent = await client.fetch<string[]>(
    `array::unique(*[_type == "landingPage"].pageType)`,
  )

  const investmentLandings = await client.fetch<
    {_id: string; pageType: string; slug: string | null; enabled: boolean | null}[]
  >(
    `*[_type == "landingPage" && pageType == "investment"]{_id, pageType, "slug": slug.current, enabled} | order(slug asc)`,
  )

  const rentSlugLanding = await client.fetch<Record<string, unknown> | null>(
    `*[_type == "landingPage" && slug.current == "rent"][0]{_id, pageType, "slug": slug.current, enabled}`,
  )

  const report = {
    projectId,
    dataset,
    cityLandings_total: allCityLandings.length,
    cityLandings_missingLinkedCity: cityLandingsInvalid,
    cityLandings_duplicateLinkedCity: cityLandingsDup,
    citiesPublished_withoutCityLanding: citiesWithoutLanding,
    dealLanding_matchesKnownSlugs: dealLandingsBySlug,
    rentSlugLanding: rentSlugLanding,
    allLandingPage_pageTypes: pageTypesPresent.sort(),
    investmentLandings_all: investmentLandings,
    note:
      'Schema enum for pageType does not include sale/rent/shortTerm; marketing routes may use slug + pageType investment or custom.',
  }

  console.log(JSON.stringify(report, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
