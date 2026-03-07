/**
 * Delete only old document-level i18n blog content and related translation metadata.
 *
 * Run: npm run reset:blog:dry   (preview only)
 * Run: npm run reset:blog      (execute)
 *
 * Does NOT delete: new field-level i18n blogPost docs, blogCategory docs.
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset = (process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production').trim()
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
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
})

type BlogDoc = {
  _id: string
  _type: string
  language?: string
  title?: string | {en?: string; ru?: string; uk?: string; sq?: string}
  slug?: {current?: string} | {en?: {current?: string}; ru?: {current?: string}; uk?: {current?: string}; sq?: {current?: string}}
}

function isPlainString(value: unknown): value is string {
  return typeof value === 'string'
}

function isLocalizedObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function hasLocalizedShape(obj: unknown): boolean {
  if (!isLocalizedObject(obj)) return false
  return Object.keys(obj).some((k) => ['en', 'ru', 'uk', 'sq'].includes(k))
}

function isOldBlogDoc(doc: BlogDoc): boolean {
  const hasLanguage = isPlainString(doc.language) && doc.language.length > 0
  const titleIsPlain = isPlainString(doc.title)
  const titleIsLocalized = isLocalizedObject(doc.title) && hasLocalizedShape(doc.title)
  if (titleIsLocalized) return false
  if (hasLanguage || titleIsPlain) return true
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
  console.log('--- Reset old blog content ---\n')
  console.log(`Project: ${projectId}`)
  console.log(`Dataset: ${dataset}`)
  console.log(`Mode: ${isDry ? 'DRY (preview only)' : 'EXECUTE (deleting)'}\n`)

  let deletedOldBlog = 0
  let deletedMeta = 0
  let skipped = 0

  const blogDocs = await client.fetch<BlogDoc[]>(
    `*[_type == "blogPost"]{_id, _type, language, title, slug}`
  )

  const toDeleteBlogIds: string[] = []
  for (const doc of blogDocs) {
    if (isOldBlogDoc(doc)) {
      toDeleteBlogIds.push(doc._id)
      const title = titlePreview(doc)
      console.log(`  [would delete] blogPost`)
      console.log(`    id: ${doc._id}`)
      console.log(`    title: ${title}`)
      console.log(`    reason: Old document-level i18n (language field or plain title/slug)`)
      console.log('')
    } else {
      skipped++
      console.log(`  [skip] blogPost ${doc._id} (new field-level i18n)`)
    }
  }

  const blogIdsWithDrafts = collectWithDrafts(toDeleteBlogIds)

  const metaDocs = await client.fetch<{_id: string}[]>(
    `*[_type == "translation.metadata" && _id match "translation.metadata.blogPost.*"]{_id}`
  )
  for (const m of metaDocs) {
    console.log(`  [would delete] translation.metadata`)
    console.log(`    id: ${m._id}`)
    console.log(`    reason: Obsolete metadata for old blog document-level i18n`)
    console.log('')
  }
  const metaIds = metaDocs.map((m) => m._id)
  const metaIdsWithDrafts = collectWithDrafts(metaIds)

  if (!isDry) {
    deletedOldBlog = await deleteDocs(blogIdsWithDrafts)
    deletedMeta = await deleteDocs(metaIdsWithDrafts)
  }

  console.log('--- Summary ---')
  console.log('Deleted old blog docs:', isDry ? toDeleteBlogIds.length : deletedOldBlog)
  console.log('Deleted translation.metadata docs:', isDry ? metaIds.length : deletedMeta)
  console.log('Skipped (new blog docs):', skipped)
  if (isDry && (toDeleteBlogIds.length > 0 || metaIds.length > 0)) {
    console.log('\nRun with --execute to perform deletion.')
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
