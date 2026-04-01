/**
 * Migrate landingPage.pageSections[] items from cityRichDescriptionSection to seoTextSection.
 * Converts localized plain-text `content` to localizedBlockContent (portable text).
 *
 * Run:
 * - npm run migrate:city-description-to-seo:dry
 * - npm run migrate:city-description-to-seo
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

function localizedBlockContentFromLocalizedText(localizedText: Record<string, unknown> | undefined | null) {
  const out: Record<string, unknown[]> = {}
  for (const locale of REQUIRED_LOCALES) {
    const v = localizedText?.[locale]
    out[locale] = typeof v === 'string' && v.trim() ? blocksFromPlainText(v) : []
  }
  return out
}

function ensureNonEmptyContent(blockContent: Record<string, unknown[]>) {
  const hasAny = REQUIRED_LOCALES.some((locale) => {
    const a = blockContent[locale]
    return Array.isArray(a) && a.length > 0
  })
  if (!hasAny) {
    blockContent.en = blocksFromPlainText('\u00a0')
  }
}

function migrateSection(section: Record<string, unknown>) {
  if (section?._type !== 'cityRichDescriptionSection') return section

  const blockContent = localizedBlockContentFromLocalizedText(
    section.content as Record<string, unknown> | undefined,
  )
  ensureNonEmptyContent(blockContent)

  const next: Record<string, unknown> = {
    _type: 'seoTextSection',
    _key: section._key,
    enabled: section.enabled !== false,
    content: blockContent,
  }

  if (section.title !== undefined) next.title = section.title
  if (section.videoUrl !== undefined && String(section.videoUrl || '').trim()) {
    next.videoUrl = section.videoUrl
  }
  if (section.cta !== undefined) next.cta = section.cta

  return next
}

async function run() {
  if (!token) {
    console.error('Error: SANITY_API_TOKEN required. Add to .env')
    process.exit(1)
  }
  if (!isDry && !isExecute) {
    console.error('Use --dry to preview or --execute to write.')
    process.exit(1)
  }

  const client = createClient({projectId, dataset, apiVersion, useCdn: false, token})

  console.log('--- migrate cityRichDescriptionSection → seoTextSection ---')
  console.log(`Project: ${projectId}`)
  console.log(`Dataset: ${dataset}`)
  console.log(`Mode: ${isDry ? 'DRY' : 'EXECUTE'}`)
  console.log('')

  const docs = await client.fetch<Array<{_id: string; pageSections?: unknown[]}>>(`
    *[_type == "landingPage" && defined(pageSections)]{_id, pageSections}
  `)

  let touchedDocs = 0
  let touchedSections = 0

  for (const doc of docs) {
    const sections = Array.isArray(doc.pageSections) ? doc.pageSections : []
    let changed = false
    const nextSections = sections.map((s: any) => {
      if (s?._type !== 'cityRichDescriptionSection') return s
      changed = true
      touchedSections++
      return migrateSection(s)
    })

    if (!changed) continue

    touchedDocs++
    if (isDry) {
      console.log(`Would migrate: ${doc._id}`)
    }

    if (isExecute) {
      await client.patch(doc._id).set({pageSections: nextSections}).commit()
    }
  }

  console.log('')
  console.log(JSON.stringify({landingPageCount: docs.length, touchedDocs, touchedSections}, null, 2))
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
