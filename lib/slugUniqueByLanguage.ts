/**
 * Custom slug uniqueness for multilingual documents.
 * Slug must be unique only within (_type, language) — same slug allowed across languages.
 * Uses sanity::versionOf to exclude current document (draft + published).
 */

import {getPublishedId} from 'sanity'

export async function isUniqueSlugByLanguage(
  slug: {current?: string} | string,
  context: {
    document?: {_id?: string; _type?: string; language?: string}
    getClient: (opts: {apiVersion: string}) => {fetch: (q: string, p: Record<string, unknown>) => Promise<unknown>}
  }
): Promise<boolean> {
  const {document, getClient} = context

  // No slug → let required() handle it
  const slugValue = typeof slug === 'string' ? slug : slug?.current
  if (!slugValue || typeof slugValue !== 'string') return true

  // Language missing (e.g. during translation draft creation) → allow to avoid false red errors
  const language = typeof document?.language === 'string' ? document.language : null
  if (!language) return true

  const rawId = document?._id
  if (!rawId || typeof rawId !== 'string') return true

  const docType = document?._type
  if (!docType || typeof docType !== 'string') return true

  const publishedId = getPublishedId(rawId)
  const client = getClient({apiVersion: '2025-02-19'})

  // Official pattern: !sanity::versionOf excludes current doc (draft + published)
  const query = `!defined(*[
    _type == $type &&
    language == $language &&
    slug.current == $slug &&
    !sanity::versionOf($published)
  ][0]._id)`

  const isUnique = await client.fetch(query, {
    published: publishedId,
    type: docType,
    language,
    slug: String(slugValue).trim(),
  })

  return Boolean(isUnique)
}
