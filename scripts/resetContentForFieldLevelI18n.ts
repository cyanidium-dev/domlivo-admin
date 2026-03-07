/**
 * Reset content: remove bad migrated + old document-level i18n content for
 * city, district, homePage, siteSettings and related translation metadata.
 *
 * Run: npm run reset:content:dry   (preview only)
 * Run: npm run reset:content       (execute deletion)
 *
 * Does NOT delete: property, propertyType, locationTag, agent, blogPost
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
const dataset = (
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  process.env.SANITY_DATASET ||
  'production'
).trim()
const apiVersion = (
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ||
  process.env.SANITY_API_VERSION ||
  '2024-01-01'
).trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const isDry = process.argv.includes('--dry')
const isExecute = process.argv.includes('--execute')

if (!token) {
  console.error('Error: SANITY_API_TOKEN required. Add to .env')
  process.exit(1)
}

if (!isDry && !isExecute) {
  console.error('Use --dry to preview or --execute to perform deletion.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
})

type Doc = {_id: string; _type: string; language?: string; title?: string}

function collectWithDrafts(ids: string[]): string[] {
  const set = new Set<string>()
  for (const id of ids) {
    set.add(id)
    set.add(id.startsWith('drafts.') ? id.slice(7) : `drafts.${id}`)
  }
  return [...set]
}

async function deleteDocs(ids: string[]): Promise<number> {
  if (ids.length === 0 || isDry) return 0
  const tx = client.transaction()
  for (const id of ids) tx.delete(id)
  await tx.commit()
  return ids.length
}

async function run() {
  console.log('--- Reset content for field-level i18n ---\n')
  console.log(`Project: ${projectId}`)
  console.log(`Dataset: ${dataset}`)
  console.log(`Mode: ${isDry ? 'DRY (preview only)' : 'EXECUTE (deleting)'}\n`)

  const toDelete: Array<{id: string; type: string; title?: string; reason: string}> = []
  let actuallyDeleted = 0
  let skipped = 0

  // City: old doc-level + broken migrated
  const cityDocs = await client.fetch<Doc[]>('*[_type == "city"]{_id, _type, language, title}')
  for (const d of cityDocs) {
    const id = d._id
    const reason = id.startsWith('city-migrated-')
      ? 'Broken migrated doc from failed migration'
      : d.language
        ? 'Old document-level i18n city'
        : 'City doc (unknown)'
    toDelete.push({id, type: 'city', title: typeof d.title === 'string' ? d.title : undefined, reason})
  }
  const allCityIds = collectWithDrafts(cityDocs.map((d) => d._id))

  // District: old doc-level + broken migrated
  const districtDocs = await client.fetch<Doc[]>('*[_type == "district"]{_id, _type, language, title}')
  for (const d of districtDocs) {
    const reason = d._id.startsWith('district-migrated-')
      ? 'Broken migrated doc from failed migration'
      : d.language
        ? 'Old document-level i18n district'
        : 'District doc (unknown)'
    toDelete.push({id: d._id, type: 'district', title: typeof d.title === 'string' ? d.title : undefined, reason})
  }
  const allDistrictIds = collectWithDrafts(districtDocs.map((d) => d._id))

  // HomePage: old per-language + broken migrated
  const homePageDocs = await client.fetch<Doc[]>('*[_type == "homePage"]{_id, _type, language}')
  for (const d of homePageDocs) {
    const pubId = d._id.startsWith('drafts.') ? d._id.slice(7) : d._id
    const reason =
      pubId === 'homePage-migrated'
        ? 'Broken migrated doc from failed migration'
        : /^homePage-(en|sq|ru|uk)$/.test(pubId)
          ? 'Old document-level i18n homePage'
          : 'HomePage doc'
    toDelete.push({id: d._id, type: 'homePage', reason})
  }
  const allHomePageIds = collectWithDrafts(homePageDocs.map((d) => d._id))

  // SiteSettings: old per-language + broken migrated
  const siteSettingsDocs = await client.fetch<Doc[]>('*[_type == "siteSettings"]{_id, _type, language}')
  for (const d of siteSettingsDocs) {
    const pubId = d._id.startsWith('drafts.') ? d._id.slice(7) : d._id
    const reason =
      pubId === 'siteSettings-migrated'
        ? 'Broken migrated doc from failed migration'
        : /^siteSettings-(en|sq|ru|uk)$/.test(pubId)
          ? 'Old document-level i18n siteSettings'
          : 'SiteSettings doc'
    toDelete.push({id: d._id, type: 'siteSettings', reason})
  }
  const allSiteSettingsIds = collectWithDrafts(siteSettingsDocs.map((d) => d._id))

  // Documents referencing city/district: must delete first; seed will recreate properties
  const refsToCity = await client.fetch<{_id: string}[]>(
    '*[references(*[_type == "city"]._id)]{_id}'
  )
  const refsToDistrict = await client.fetch<{_id: string}[]>(
    '*[references(*[_type == "district"]._id)]{_id}'
  )
  const propertyDocs = await client.fetch<Doc[]>('*[_type == "property"]{_id, _type, title}')
  const allRefIds = new Set([
    ...refsToCity.map((d) => d._id),
    ...refsToDistrict.map((d) => d._id),
    ...propertyDocs.map((d) => d._id),
  ])
  for (const id of allRefIds) {
    const d = propertyDocs.find((p) => p._id === id)
    toDelete.push({
      id,
      type: d?._type ?? 'reference',
      title: d && typeof d.title === 'string' ? d.title : undefined,
      reason: 'References city/district; seed will recreate',
    })
  }
  const allPropertyIds = collectWithDrafts([...allRefIds])

  // Translation metadata for city, district, homePage, siteSettings
  const metaDocs = await client.fetch<{_id: string}[]>(
    `*[_type == "translation.metadata" && (_id match "translation.metadata.city.*" || _id match "translation.metadata.district.*" || _id match "translation.metadata.homePage.*" || _id match "translation.metadata.siteSettings.*")]{_id}`
  )
  for (const m of metaDocs) {
    toDelete.push({id: m._id, type: 'translation.metadata', reason: 'Obsolete metadata for migrated types'})
  }
  const allMetaIds = metaDocs.map((m) => m._id)

  // Log
  for (const t of toDelete) {
    const titlePart = t.title ? ` | title: ${t.title}` : ''
    console.log(`  [would delete] ${t.type}`)
    console.log(`    id: ${t.id}${titlePart}`)
    console.log(`    reason: ${t.reason}`)
    console.log('')
  }

  if (!isDry) {
    if (allPropertyIds.length > 0) {
      actuallyDeleted += await deleteDocs(allPropertyIds)
    }
    const restIds = [...new Set([...allDistrictIds, ...allCityIds, ...allHomePageIds, ...allSiteSettingsIds, ...allMetaIds])]
    if (restIds.length > 0) {
      actuallyDeleted += await deleteDocs(restIds)
    }
  }

  console.log('--- Summary ---')
  console.log(`Docs to delete: ${toDelete.length}`)
  console.log(`Docs actually deleted: ${actuallyDeleted}`)
  console.log(`Docs skipped: ${skipped}`)
  if (isDry && toDelete.length > 0) {
    console.log('\nRun with --execute to perform deletion.')
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
