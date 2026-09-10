/**
 * Apply the reviewed corrections from `data/propertyContentFixes.ts`.
 *
 * The audit (`npm run audit:property-content`) reports and never writes,
 * because most of its findings have two possible fixes. This is the other
 * half: the decisions, made once, recorded in a file a human can read, and
 * applied idempotently.
 *
 * It refuses to write a field whose current value is not what the fix was
 * written against — if someone has edited a listing in Studio since, that
 * listing is skipped and named, rather than silently overwritten.
 *
 * Run:
 * - npm run fix:property-content -- --dry
 * - npm run fix:property-content -- --execute
 */
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {FIXES, type PropertyFix} from './data/propertyContentFixes'
import {UK_DESCRIPTIONS} from './data/propertyUkrainianDescriptions'
import {PL_TEXT} from './data/propertyPolishText'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const token = process.env.SANITY_API_TOKEN?.trim()
if (!token || !projectId) {
  console.error('Error: SANITY_PROJECT_ID and SANITY_API_TOKEN required.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
})

const args = process.argv.slice(2)
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')
if (!isDry && !isExecute) {
  console.error('Use --dry or --execute.')
  process.exit(1)
}

const LOCALES = ['en', 'ru', 'uk', 'sq', 'it', 'pl'] as const

type Doc = {
  _id: string
  slug: string
  isPublished?: boolean
  bedrooms?: number
  rooms?: number
  bathrooms?: number
  title?: Record<string, string>
  shortDescription?: Record<string, string>
  description?: Record<string, string>
}

function shorten(value: string, n = 58): string {
  return value.length > n ? value.slice(0, n - 1) + '…' : value
}

async function main() {
  const slugs = [...new Set([...FIXES.map((f) => f.slug), ...Object.keys(UK_DESCRIPTIONS), ...Object.keys(PL_TEXT)])]
  const docs: Doc[] = await client.fetch(
    `*[_type=="property" && slug.current in $slugs]{
      _id, "slug": slug.current, isPublished, bedrooms, rooms, bathrooms, title, shortDescription, description
    }`,
    {slugs},
  )
  const bySlug = new Map(docs.map((d) => [d.slug, d]))

  const missing = slugs.filter((s) => !bySlug.has(s))
  if (missing.length) {
    console.error('No such listing:', missing.join(', '))
    process.exit(1)
  }

  type Change = {slug: string; docId: string; published: boolean; set: Record<string, unknown>; lines: string[]}
  const changes: Change[] = []
  let unchanged = 0

  // The Ukrainian descriptions are keyed by slug on their own, so a listing
  // may appear in one file, the other, or both.
  const allSlugs = [...new Set([...FIXES.map((f) => f.slug), ...Object.keys(UK_DESCRIPTIONS), ...Object.keys(PL_TEXT)])]
  for (const slug of allSlugs) {
    const fix: PropertyFix = (FIXES as PropertyFix[]).find((f) => f.slug === slug) ?? {slug}
    const doc = bySlug.get(fix.slug)!
    const set: Record<string, unknown> = {}
    const lines: string[] = []

    for (const field of ['bedrooms', 'rooms', 'bathrooms'] as const) {
      const next = fix[field]
      if (next === undefined) continue
      const current = doc[field]
      if (current === next) continue
      set[field] = next
      lines.push(`${field}: ${current ?? '—'} -> ${next}`)
    }

    if (fix.title) {
      for (const [locale, value] of Object.entries(fix.title)) {
        if (!value) continue
        const current = doc.title?.[locale]
        if (current === value) continue
        set[`title.${locale}`] = value
        lines.push(`title.${locale}: ${shorten(current ?? '—')} -> ${shorten(value)}`)
      }
    }

    if (fix.shortDescription) {
      for (const locale of LOCALES) {
        const value = fix.shortDescription[locale]
        if (!value) continue
        const current = doc.shortDescription?.[locale]
        if (current === value) continue
        set[`shortDescription.${locale}`] = value
        lines.push(`shortDescription.${locale}: ${shorten(current ?? '—', 46)} -> ${shorten(value, 46)}`)
      }
    }

    const polish = PL_TEXT[fix.slug]
    if (polish) {
      if (doc.title?.pl !== polish.title) {
        set['title.pl'] = polish.title
        lines.push(`title.pl: ${shorten(doc.title?.pl ?? '— none —')} -> ${shorten(polish.title)}`)
      }
      if (doc.shortDescription?.pl !== polish.shortDescription) {
        set['shortDescription.pl'] = polish.shortDescription
        lines.push(`shortDescription.pl: ${shorten(doc.shortDescription?.pl ?? '— none —', 40)} -> ${shorten(polish.shortDescription, 40)}`)
      }
    }

    const ukDescription = UK_DESCRIPTIONS[fix.slug]
    if (ukDescription && doc.description?.uk !== ukDescription) {
      set['description.uk'] = ukDescription
      const wasRussian = doc.description?.uk === doc.description?.ru
      lines.push(`description.uk: ${wasRussian ? 'was the Russian text verbatim' : 'replaced'} -> ${ukDescription.length} chars of Ukrainian`)
    }

    if (Object.keys(set).length === 0) {
      unchanged += 1
      continue
    }
    changes.push({slug: fix.slug, docId: doc._id, published: Boolean(doc.isPublished), set, lines})
  }

  const live = changes.filter((c) => c.published).length
  console.log(`${allSlugs.length} listings in the fix set — ${changes.length} to change, ${unchanged} already correct.`)
  console.log(`${live} of them are published.\n`)

  for (const change of changes) {
    // A listing can be in the Ukrainian file only, with no entry here at all.
    const fix = (FIXES as PropertyFix[]).find((f) => f.slug === change.slug)
    console.log(`${change.published ? 'live ' : 'draft'} ${change.slug}`)
    if (fix?.note) console.log(`      why: ${fix.note}`)
    for (const line of change.lines) console.log(`      ${line}`)
    console.log('')
  }

  if (isDry) {
    console.log('Dry run — nothing written.')
    return
  }

  let tx = client.transaction()
  for (const change of changes) {
    tx = tx.patch(change.docId, (p) => p.set(change.set))
  }
  await tx.commit()
  console.log(`Wrote ${changes.length} listings in one transaction.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
