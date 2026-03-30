/**
 * One-time migration:
 * - Rename legacy section _type values inside landingPage.pageSections[] to canonical generic names.
 * - Normalize SEO text into seoTextSection(content: localizedBlockContent).
 *
 * Run:
 * - npm run migrate:landing-sections -- --dry
 * - npm run migrate:landing-sections -- --execute
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const apiVersion = (process.env.SANITY_API_VERSION || '2024-01-01').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const isDry = process.argv.includes('--dry')
const isExecute = process.argv.includes('--execute')

if (!token) {
  console.error('Error: SANITY_API_TOKEN required. Add to .env')
  process.exit(1)
}
if (!isDry && !isExecute) {
  console.error('Use --dry to preview or --execute to write.')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion, useCdn: false, token})

const SECTION_TYPE_MAP: Record<string, string> = {
  // Legacy -> canonical
  homeHeroSection: 'heroSection',
  homePropertyCarouselSection: 'propertyCarouselSection',
  homeLocationCarouselSection: 'locationCarouselSection',
  homePropertyTypesSection: 'propertyTypesSection',
  homeBlogSection: 'articlesSection',
  homeFaqSection: 'faqSection',
  landingFaqSection: 'faqSection',
  landingSeoRichTextSection: 'seoTextSection',
  homeSeoTextSection: 'seoTextSection',
}

const REQUIRED_LOCALES = ['en', 'ru', 'uk', 'sq', 'it'] as const

function blocksFromPlainText(text: string) {
  const paras = String(text || '')
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean)
  return paras.map((p, idx) => ({
    _type: 'block',
    _key: `m${idx}-${Math.random().toString(16).slice(2, 8)}`,
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: `s${idx}-${Math.random().toString(16).slice(2, 8)}`,
        text: p,
        marks: [],
      },
    ],
  }))
}

function localizedBlockContentFromLocalizedText(localizedText: any) {
  const out: Record<string, any[]> = {}
  for (const locale of REQUIRED_LOCALES) {
    const v = localizedText?.[locale]
    out[locale] = v ? blocksFromPlainText(v) : []
  }
  return out
}

function migrateLocationCarouselLegacyFields(section: any) {
  // If old data still uses cities[]/districts[] (legacy), move them to manualItems.
  if (section?._type !== 'locationCarouselSection') return section
  const hasLegacyLists = Array.isArray(section?.cities) || Array.isArray(section?.districts)
  const hasManualItems = Array.isArray(section?.manualItems) && section.manualItems.length > 0
  if (!hasLegacyLists || hasManualItems) return section

  const cities = Array.isArray(section?.cities) ? section.cities : []
  const districts = Array.isArray(section?.districts) ? section.districts : []
  const manualItems = [...cities, ...districts]

  return {
    ...section,
    mode: section?.mode || 'manual',
    manualItems,
    cities: undefined,
    districts: undefined,
  }
}

function cleanUndefined(obj: any) {
  if (Array.isArray(obj)) return obj.map(cleanUndefined)
  if (!obj || typeof obj !== 'object') return obj
  const out: any = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue
    out[k] = cleanUndefined(v)
  }
  return out
}

function migrateSection(section: any) {
  const oldType = section?._type
  const newType = oldType && SECTION_TYPE_MAP[oldType] ? SECTION_TYPE_MAP[oldType] : oldType
  let next = oldType === newType ? section : {...section, _type: newType}

  // Normalize SEO section to seoTextSection(content: localizedBlockContent)
  if (oldType === 'homeSeoTextSection') {
    const contentText = next?.content
    next = {
      enabled: next?.enabled ?? true,
      _type: 'seoTextSection',
      _key: next?._key,
      content: localizedBlockContentFromLocalizedText(contentText),
    }
  }
  if (oldType === 'landingSeoRichTextSection') {
    next = {
      enabled: next?.enabled ?? true,
      _type: 'seoTextSection',
      _key: next?._key,
      content: next?.content ?? {},
    }
  }

  // Normalize FAQ section name only (items types stay as-is)
  if (oldType === 'homeFaqSection' || oldType === 'landingFaqSection') {
    next = {
      ...next,
      _type: 'faqSection',
      enabled: next?.enabled ?? true,
    }
  }

  next = migrateLocationCarouselLegacyFields(next)
  return cleanUndefined(next)
}

async function run() {
  console.log('--- migrate landing section types ---')
  console.log(`Project: ${projectId}`)
  console.log(`Dataset: ${dataset}`)
  console.log(`Mode: ${isDry ? 'DRY' : 'EXECUTE'}`)
  console.log('')

  const docs = await client.fetch<any[]>(
    `*[_type=="landingPage" && defined(pageSections)]{_id, pageSections}`,
  )

  let touchedDocs = 0
  let touchedSections = 0

  for (const doc of docs) {
    const sections = Array.isArray(doc?.pageSections) ? doc.pageSections : []
    if (sections.length === 0) continue

    let changed = false
    const nextSections = sections.map((s: any) => {
      const beforeType = s?._type
      const after = migrateSection(s)
      const afterType = after?._type
      if (beforeType !== afterType) {
        changed = true
        touchedSections++
      }
      // Also count changes when we reshaped seo/faq/location payload
      if (!changed) {
        const b = JSON.stringify(s)
        const a = JSON.stringify(after)
        if (b !== a) {
          changed = true
          touchedSections++
        }
      }
      return after
    })

    if (!changed) continue
    touchedDocs++

    if (isDry) continue
    await client
      .patch(doc._id)
      .set({pageSections: nextSections})
      .commit({autoGenerateArrayKeys: false})
  }

  console.log(`Touched landingPage docs: ${touchedDocs}`)
  console.log(`Touched section items: ${touchedSections}`)
  if (isDry) console.log('DRY: no changes written.')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})

