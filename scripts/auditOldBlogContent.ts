/**
 * Audit blog content: distinguish old document-level i18n vs new field-level i18n.
 * Does NOT delete anything.
 *
 * Run: npx tsx scripts/auditOldBlogContent.ts
 * Requires: SANITY_API_TOKEN in .env (or dotenv)
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset = (process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: token || undefined,
})

type BlogDoc = {
  _id: string
  _type: string
  language?: string
  title?: string | {en?: string; ru?: string; uk?: string; sq?: string}
  slug?: {current?: string} | {en?: {current?: string}; ru?: {current?: string}; uk?: {current?: string}; sq?: {current?: string}}
  excerpt?: string | {en?: string; ru?: string; uk?: string; sq?: string}
}

function isPlainString(value: unknown): value is string {
  return typeof value === 'string'
}

function isLocalizedObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function hasLocalizedShape(obj: unknown): boolean {
  if (!isLocalizedObject(obj)) return false
  const keys = Object.keys(obj)
  return keys.some((k) => ['en', 'ru', 'uk', 'sq'].includes(k))
}

function slugShape(slug: BlogDoc['slug']): string {
  if (!slug) return 'none'
  if (typeof slug !== 'object') return 'invalid'
  if ('current' in slug && typeof (slug as {current?: string}).current === 'string') return 'plain (slug.current)'
  if (hasLocalizedShape(slug)) return 'localized (slug.en/ru/uk/sq)'
  return 'other'
}

function looksOld(doc: BlogDoc): boolean {
  // Old: document-level i18n — has language field and plain title/slug/excerpt
  const hasLanguage = isPlainString(doc.language) && doc.language.length > 0
  const titleIsPlain = isPlainString(doc.title)
  const slugIsPlain = doc.slug && 'current' in doc.slug && typeof (doc.slug as {current?: string}).current === 'string'
  const excerptIsPlain = isPlainString(doc.excerpt)
  if (hasLanguage && titleIsPlain) return true
  if (hasLanguage) return true
  // Also treat as old if no localized shape on title (e.g. title is string)
  if (titleIsPlain && !hasLocalizedShape(doc.title)) return true
  return false
}

function looksNew(doc: BlogDoc): boolean {
  const titleIsLocalized = isLocalizedObject(doc.title) && hasLocalizedShape(doc.title)
  const slugIsLocalized = isLocalizedObject(doc.slug) && hasLocalizedShape(doc.slug)
  const hasNoLanguage = doc.language === undefined || doc.language === ''
  if (titleIsLocalized) return true
  if (slugIsLocalized) return true
  if (hasNoLanguage && isLocalizedObject(doc.title)) return true
  return false
}

function titlePreview(doc: BlogDoc): string {
  if (isPlainString(doc.title)) return doc.title
  if (isLocalizedObject(doc.title)) {
    const t = doc.title as Record<string, string>
    return t.en || t.sq || t.ru || t.uk || '(localized)'
  }
  return '(none)'
}

async function main() {
  console.log('--- Audit old blog content ---\n')
  console.log(`Project: ${projectId}`)
  console.log(`Dataset: ${dataset}\n`)

  const docs = await client.fetch<BlogDoc[]>(
    `*[_type == "blogPost"]{_id, _type, language, title, slug, excerpt}`
  )

  let oldCount = 0
  let newCount = 0

  for (const doc of docs) {
    const old = looksOld(doc)
    const new_ = looksNew(doc)
    if (old) oldCount++
    if (new_) newCount++

    console.log('---')
    console.log('_id:', doc._id)
    console.log('title:', titlePreview(doc))
    console.log('looks like OLD (document-level i18n):', old)
    console.log('looks like NEW (field-level i18n):', new_)
    console.log('language field:', doc.language ?? '(absent)')
    console.log('slug shape:', slugShape(doc.slug))
    console.log('')
  }

  console.log('--- Summary ---')
  console.log('Total blogPost documents:', docs.length)
  console.log('Old (document-level i18n) count:', oldCount)
  console.log('New (field-level i18n) count:', newCount)
  console.log('')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
