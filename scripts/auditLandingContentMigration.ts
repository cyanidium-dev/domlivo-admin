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

const REQUIRED_LOCALES = ['en', 'ru', 'uk', 'sq', 'it'] as const

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isEmptyLocalized(v: unknown): boolean {
  if (!isRecord(v)) return true
  return REQUIRED_LOCALES.every((l) => {
    const x = v[l]
    if (x === null || x === undefined) return true
    if (typeof x === 'string') return x.trim().length === 0
    if (Array.isArray(x)) return x.length === 0
    return false
  })
}

function summarizeSectionMissing(section: any) {
  const misses: string[] = []
  const t = section?._type
  if (!t) return {type: 'UNKNOWN', misses: ['missing _type']}

  // common
  if ('title' in section && isEmptyLocalized(section.title)) misses.push('title')
  if ('subtitle' in section && isEmptyLocalized(section.subtitle)) misses.push('subtitle')
  if ('shortLine' in section && isEmptyLocalized(section.shortLine)) misses.push('shortLine')
  if ('description' in section && isEmptyLocalized(section.description)) misses.push('description')

  // CTA
  if (section?.cta) {
    if (!section.cta.href) misses.push('cta.href')
    if (isEmptyLocalized(section.cta.label)) misses.push('cta.label')
  }

  if (t === 'heroSection') {
    if (section?.search?.enabled && Array.isArray(section?.search?.tabs) && section.search.tabs.length === 0) {
      misses.push('search.tabs (empty)')
    }
  }

  if (t === 'faqSection') {
    if (!Array.isArray(section?.items) || section.items.length === 0) misses.push('items (empty)')
  }

  if (t === 'seoTextSection') {
    if (isEmptyLocalized(section?.content)) misses.push('content (localizedBlockContent empty)')
  }

  if (t === 'articlesSection') {
    if ('title' in section && isEmptyLocalized(section.title)) misses.push('title')
    // posts optional by mode; do not enforce here
  }

  if (t === 'landingCollectionSection') {
    if (!section?.presentation) misses.push('presentation')
    if (!section?.mode && section?.presentation !== 'carousel') misses.push('mode')
    if (
      (section?.presentation === 'carousel' || section?.mode === 'manual') &&
      (!Array.isArray(section?.manualItems) || section.manualItems.length === 0)
    ) {
      misses.push('manualItems (empty)')
    }
    if (section?.presentation === 'grid' && section?.mode === 'auto') {
      if (!section?.auto?.pageTypes || section.auto.pageTypes.length === 0) misses.push('auto.pageTypes (empty)')
    }
  }

  return {type: t as string, misses}
}

async function run() {
  const targetIds = ['landing-home', 'landing-cities', 'landing-tirana', 'landing-durres']

  // 1) Inspect new docs
  const landings = await client.fetch<any[]>(
    `*[_type=="landingPage" && _id in $ids]{
      _id,
      pageType,
      enabled,
      title,
      slug,
      seo,
      linkedCity->{_id, slug, title, heroTitle, heroSubtitle, heroShortLine, heroCta, heroImage, shortDescription, description, featuredPropertiesTitle, featuredPropertiesSubtitle, allPropertiesCta, districtsTitle, districtsIntro, districtStats, cityVideoUrl, galleryTitle, gallerySubtitle, gallery, faqTitle, faqItems, seoText, seo},
      pageSections
    } | order(_id asc)`,
    {ids: targetIds},
  )

  // 2) Search legacy sources in dataset (even if schema removed)
  const legacy = await client.fetch<any>(
    `{
      "homePageDocs": *[_type=="homePage"]{_id,_type},
      "docsWithHomepageSections": *[defined(homepageSections)]{_id,_type},
      "docsWithHomeSections": *[defined(homeSections)]{_id,_type},
      "docsWithHomepageBuilder": *[defined(homepageBuilder)]{_id,_type},
      "docsWithHomeHeroFields": *[defined(heroTitle) || defined(heroSubtitle) || defined(heroShortLine)]{_id,_type}[0...20],
      "homePageById": *[_id=="homePage" || _id=="drafts.homePage"]{_id,_type}
    }`,
  )

  // 3) Missing summary
  const incomplete: any[] = []
  for (const d of landings) {
    const sections = Array.isArray(d?.pageSections) ? d.pageSections : []
    const sectionFindings = sections
      .map((s: any, idx: number) => {
        const {type, misses} = summarizeSectionMissing(s)
        return {index: idx, _type: type, _key: s?._key, missing: misses}
      })
      .filter((x) => x.missing.length > 0)

    const docFindings: string[] = []
    if (isEmptyLocalized(d?.title)) docFindings.push('doc.title missing')
    // seo required for enabled; but allow missing if editors not finished. We'll report.
    if (!d?.seo) docFindings.push('doc.seo missing/null')

    incomplete.push({
      _id: d._id,
      pageType: d.pageType,
      enabled: d.enabled,
      slug: d.slug?.current,
      linkedCity: d.linkedCity?._id ? {id: d.linkedCity._id, slug: d.linkedCity.slug?.current} : null,
      docMissing: docFindings,
      sectionMissing: sectionFindings,
      sectionsCount: sections.length,
    })
  }

  console.log(
    JSON.stringify(
      {
        projectId,
        dataset,
        targetIds,
        legacySources: legacy,
        incompleteNewDocs: incomplete,
      },
      null,
      2,
    ),
  )
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})

