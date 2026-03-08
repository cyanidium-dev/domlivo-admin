/**
 * Fix Translation Groups (DEPRECATED)
 *
 * Links existing multilingual documents into documentInternationalization translation groups.
 * Used only with @sanity/document-internationalization (document-level i18n).
 *
 * This project uses field-level i18n; document-internationalization is not used.
 * Kept for reference. Run directly: tsx scripts/fix-translation-groups.ts
 */

import path from 'path'
import crypto from 'crypto'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId =
  (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset =
  (process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production').trim()
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01'
const token = process.env.SANITY_API_TOKEN?.trim() || null

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: token || undefined,
})

const LANGUAGE_FIELD = 'language'
const METADATA_TYPE = 'translation.metadata'
const TRANSLATIONS_FIELD = 'translations'

function createTranslationRef(lang: string, publishedId: string, schemaType: string) {
  return {
    _key: crypto.randomUUID().replace(/-/g, '').slice(0, 12),
    [LANGUAGE_FIELD]: lang,
    _type: 'internationalizedArrayReferenceValue',
    value: {
      _type: 'reference',
      _ref: publishedId,
      _weak: true,
      _strengthenOnPublish: {type: schemaType},
    },
  }
}

type Doc = {_id: string; _type: string; language?: string; slug?: {current?: string}; city?: {_ref?: string}}

function getGroupKey(type: string, doc: Doc): string | null {
  const lang = doc.language
  if (!lang) return null

  const baseId = doc._id.replace(/^drafts\./, '')

  switch (type) {
    case 'city':
      return (
        doc.slug?.current ||
        baseId.replace(/^city-/, '').replace(/-(en|ru|uk|sq)$/, '') ||
        baseId
      )
    case 'district': {
      const m = baseId.match(/^district-(.+?)-(en|ru|uk|sq)$/)
      return m ? m[1] : baseId.replace(/^district-/, '').replace(/-(en|ru|uk|sq)$/, '')
    }
    case 'blogPost': {
      const m = baseId.match(/^blogPost-(.+?)-(en|ru|uk|sq)$/)
      return m ? m[1] : doc.slug?.current || baseId.replace(/^blogPost-/, '').replace(/-(en|ru|uk|sq)$/, '')
    }
    case 'homePage':
      return 'homePage'
    case 'siteSettings':
      return 'siteSettings'
    default:
      return null
  }
}

function getMetadataId(type: string, groupKey: string): string {
  return `translation.metadata.${type}.${groupKey}`
}

interface Duplicate {
  docId: string
  language: string
  groupKey: string
  type: string
}

async function main() {
  if (!token) {
    console.error('Error: SANITY_API_TOKEN is required. Add it to .env')
    process.exit(1)
  }

  console.log(`Fix translation groups — projectId=${projectId} dataset=${dataset}\n`)

  const types = ['city', 'district', 'blogPost', 'homePage', 'siteSettings'] as const
  let totalRepaired = 0
  const duplicates: Duplicate[] = []
  const processedTypes: string[] = []

  for (const type of types) {
    const query = `*[_type == $type]{ _id, _type, language, slug, city }`
    const docs = await client.fetch<Doc[]>(query, {type})

    const groups = new Map<string, Doc[]>()
    for (const doc of docs) {
      const key = getGroupKey(type, doc)
      if (!key) continue
      const existing = groups.get(key) || []
      existing.push(doc)
      groups.set(key, existing)
    }

    for (const [groupKey, groupDocs] of groups) {
      const byLang = new Map<string, Doc[]>()
      for (const d of groupDocs) {
        const lang = d.language || 'unknown'
        const arr = byLang.get(lang) || []
        arr.push(d)
        byLang.set(lang, arr)
      }

      const langDups: string[] = []
      for (const [lang, arr] of byLang) {
        if (arr.length > 1) {
          for (const d of arr) {
            duplicates.push({docId: d._id, language: lang, groupKey, type})
            langDups.push(`${lang}:${arr.map((x) => x._id).join(',')}`)
          }
        }
      }
      if (langDups.length > 0) {
        console.log(`  [${type}] Duplicates in group "${groupKey}": ${langDups.join('; ')}`)
        continue
      }

      if (groupDocs.length === 0) continue

      const metadataId = getMetadataId(type, groupKey)
      const translations = groupDocs
        .filter((d) => d.language)
        .map((d) => createTranslationRef(d.language!, d._id.replace(/^drafts\./, ''), type))

      if (translations.length === 0) continue

      const schemaTypes = [type]
      const existingMeta = await client.fetch<{_id: string; translations?: unknown[]} | null>(
        `*[_id == $id][0]{ _id, translations }`,
        {id: metadataId}
      )

      if (existingMeta) {
        const existingRefs = new Set(
          ((existingMeta.translations || []) as Array<{value?: {_ref?: string}}>)
            .map((t) => t?.value?._ref)
            .filter((x): x is string => !!x)
        )
        const toAdd = translations.filter((t) => !existingRefs.has(t.value._ref))
        if (toAdd.length === 0) continue

        await client
          .patch(metadataId)
          .setIfMissing({translations: []})
          .insert('after', 'translations[-1]', toAdd)
          .commit()
      } else {
        await client.createOrReplace({
          _id: metadataId,
          _type: METADATA_TYPE,
          schemaTypes,
          translations,
        })
      }

      totalRepaired++
      console.log(`  [${type}] Group "${groupKey}": linked ${translations.length} docs -> ${metadataId}`)
    }

    if (docs.length > 0) processedTypes.push(type)
  }

  console.log('\n--- Summary ---')
  console.log('Translation groups repaired:', totalRepaired)
  console.log('Duplicates found (same language in one group):', duplicates.length)
  if (duplicates.length > 0) {
    const byGroup = new Map<string, Duplicate[]>()
    for (const d of duplicates) {
      const k = `${d.type}.${d.groupKey}.${d.language}`
      const arr = byGroup.get(k) || []
      arr.push(d)
      byGroup.set(k, arr)
    }
    console.log('Duplicate groups (conflicting docs):')
    for (const [k, arr] of byGroup) {
      const ids = [...new Set(arr.map((x) => x.docId))]
      if (ids.length > 1) {
        console.log(`  ${k}: ${ids.join(', ')}`)
        console.log('    -> Resolve manually: keep one, delete or merge others, then re-run.')
      }
    }
  }
  console.log('Document types processed:', processedTypes.join(', ') || 'none')
}

main().catch((err) => {
  console.error('Fix failed:', err)
  process.exit(1)
})
