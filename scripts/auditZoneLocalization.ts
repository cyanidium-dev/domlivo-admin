/**
 * Locale completeness for every `city` and `district` document.
 *
 * The site ships five locales and falls back to `en` when a field is missing,
 * so a gap never breaks a page — it silently serves English to a Russian or
 * Albanian reader. That is invisible in the UI and invisible in the existing
 * taxonomy audit, which only checks `title.it`.
 *
 * Run: npm run audit:zone-localization [-- --verbose]
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()
const VERBOSE = process.argv.includes('--verbose')

if (!token || !projectId) {
  console.error('Error: SANITY_PROJECT_ID and SANITY_API_TOKEN required. Add them to .env')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token})

const LOCALES = ['en', 'sq', 'it', 'ru', 'uk', 'pl'] as const
type Locale = (typeof LOCALES)[number]

/** Fields a reader actually sees. `title` is required; the rest matter once written. */
const FIELDS = [
  {name: 'title', required: true},
  {name: 'shortDescription', required: false},
  {name: 'heroSubtitle', required: false},
  {name: 'description', required: false},
  {name: 'seoText', required: false},
  {name: 'seo.metaTitle', required: false},
  {name: 'seo.metaDescription', required: false},
] as const

type Doc = {
  _id: string
  _type: string
  slug?: string
  city?: string
  isPublished?: boolean
  [field: string]: unknown
}

function localized(doc: Doc, field: string): Record<string, unknown> | undefined {
  const value = field.includes('.')
    ? field.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], doc)
    : doc[field]
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined
}

function filled(bag: Record<string, unknown> | undefined, locale: Locale): boolean {
  const v = bag?.[locale]
  return typeof v === 'string' ? v.trim().length > 0 : false
}

async function main() {
  const docs: Doc[] = await client.fetch(
    `*[_type in ["city", "district"] ]{
      _id, _type, isPublished,
      "slug": slug.current,
      "city": city->slug.current,
      title, shortDescription, heroSubtitle, description, seoText, seo
    } | order(_type asc, city asc, slug asc)`,
  )

  const published = docs.filter((d) => d.isPublished !== false)
  console.log(
    `${docs.length} zone documents (${docs.filter((d) => d._type === 'city').length} cities, ` +
      `${docs.filter((d) => d._type === 'district').length} districts); ` +
      `${published.length} published. Locales: ${LOCALES.join('/')}\n`,
  )

  // --- per-field, per-locale coverage over published documents ---------------
  console.log('Coverage on published documents — written / has any content at all')
  console.log(`${'field'.padEnd(22)}${LOCALES.map((l) => l.padStart(7)).join('')}   any`)
  const rows: Array<{field: string; missing: Array<{doc: Doc; locales: Locale[]}>}> = []

  for (const field of FIELDS) {
    const bags = published.map((doc) => ({doc, bag: localized(doc, field.name)}))
    const withAny = bags.filter(({bag}) => LOCALES.some((l) => filled(bag, l)))
    const counts = LOCALES.map((l) => bags.filter(({bag}) => filled(bag, l)).length)
    console.log(
      `${field.name.padEnd(22)}${counts.map((c) => String(c).padStart(7)).join('')}   ${withAny.length}/${published.length}`,
    )
    // A gap only counts when the document has the field in some locale: a
    // document with no description at all is an editorial gap, not a locale one.
    const missing = withAny
      .map(({doc, bag}) => ({doc, locales: LOCALES.filter((l) => !filled(bag, l))}))
      .filter((m) => m.locales.length > 0)
    rows.push({field: field.name, missing})
  }

  // --- documents missing a locale where siblings have one --------------------
  console.log('\nPartial localisation (field written in some locales, missing in others)')
  let totalGaps = 0
  for (const row of rows) {
    if (row.missing.length === 0) continue
    totalGaps += row.missing.length
    console.log(`\n  ${row.field}: ${row.missing.length} document(s)`)
    const show = VERBOSE ? row.missing : row.missing.slice(0, 8)
    for (const m of show) {
      const where = m.doc._type === 'district' ? `${m.doc.city}/${m.doc.slug}` : m.doc.slug
      console.log(`    ${String(where).padEnd(28)} missing: ${m.locales.join(', ')}`)
    }
    if (!VERBOSE && row.missing.length > show.length) {
      console.log(`    …and ${row.missing.length - show.length} more (--verbose to list)`)
    }
  }

  // --- required-field failures ----------------------------------------------
  const titleGaps = published
    .map((doc) => ({doc, locales: LOCALES.filter((l) => !filled(localized(doc, 'title'), l))}))
    .filter((m) => m.locales.length > 0)

  console.log('\n' + '-'.repeat(60))
  if (titleGaps.length > 0) {
    console.log(`FAIL: ${titleGaps.length} published document(s) missing a required title locale`)
    for (const m of titleGaps) {
      const where = m.doc._type === 'district' ? `${m.doc.city}/${m.doc.slug}` : m.doc.slug
      console.log(`  ${String(where).padEnd(28)} missing: ${m.locales.join(', ')}`)
    }
    process.exitCode = 1
  } else {
    console.log('PASS: every published city and district has a title in all five locales')
  }
  console.log(`${totalGaps} partial-localisation gap(s) across the other fields`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
