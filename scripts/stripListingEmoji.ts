/**
 * Strip the emoji the partner feed left in listing copy.
 *
 * Findall descriptions arrive as decorated bullet lists — "📐Area: 59.50 m²",
 * "🇦🇱 Real Estate Agency in Albania 🇦🇱". They render as clutter on the page,
 * and they broke the AI assistant outright: the catalog teaser is cut at 130
 * characters, six listings were cut through the middle of a surrogate pair,
 * and half a character cannot be encoded in the JSON body the Anthropic API
 * reads. The frontend now truncates safely, so this is the content half of the
 * same fix.
 *
 * Only emoji go. Wording, line breaks and the source agency's own text are
 * left exactly as they are — deciding what of that belongs on DomLivo is an
 * editorial call, not a migration.
 *
 * Every value it is about to overwrite is written to a timestamped backup file
 * first, so a bad pass can be put back.
 *
 * Run:
 * - npm run strip:listing-emoji -- --dry
 * - npm run strip:listing-emoji -- --execute
 * - add --all to cover every listing rather than the six known breakers
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

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
const isAll = args.includes('--all')
if (!isDry && !isExecute) {
  console.error('Use --dry or --execute.')
  process.exit(1)
}

/** The six whose 130-character teaser was cut through an emoji. */
const BREAKERS = [
  'shitet-toke-ne-plazhin-spille-154',
  'shitet-apartament-1-1-ne-plazhin-e-golemit-ndertim-i-ri-242',
  'shitet-apartament-1-1-ne-plazhin-e-golemit-ndertim-i-ri-246',
  'shitet-apartament1-1-ne-plazhin-e-golemit-ndertim-i-ri-247',
  'shitet-apartament-1-1-ne-plazhin-e-golemit-ndertim-i-ri-259',
  'shitet-apartament-1-1-ne-plazhin-e-golemit-ndertim-i-ri-263',
]

const FIELDS = ['shortDescription', 'description'] as const

/**
 * Pictographs, dingbats, arrows and the variation selector that trails them.
 * Deliberately not the whole of General Punctuation: em dashes and curly
 * quotes are ordinary copy, not decoration.
 */
const EMOJI =
  /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{20E3}]/gu

/** Removes the emoji and the gap they leave, without touching line structure. */
export function stripEmoji(value: string): string {
  return value
    .replace(EMOJI, '')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

type Doc = {
  _id: string
  slug: string
  isPublished?: boolean
  shortDescription?: Record<string, string>
  description?: Record<string, string>
}

function preview(value: string, n = 64): string {
  const oneLine = value.replace(/\n/g, ' ⏎ ')
  return oneLine.length > n ? oneLine.slice(0, n - 1) + '…' : oneLine
}

async function main() {
  // Drafts carry the same copy under a `drafts.` id and would put the emoji
  // straight back on the next publish, so they are patched alongside.
  const docs: Doc[] = isAll
    ? await client.fetch(
        `*[_type=="property"]{_id, "slug": slug.current, isPublished, shortDescription, description}`,
      )
    : await client.fetch(
        `*[_type=="property" && (slug.current in $slugs || _id in $draftIds)]{
          _id, "slug": slug.current, isPublished, shortDescription, description
        }`,
        {slugs: BREAKERS, draftIds: []},
      )

  const draftIds = docs.map((d) => `drafts.${d._id}`)
  const drafts: Doc[] = draftIds.length
    ? await client.fetch(
        `*[_id in $ids]{_id, "slug": slug.current, isPublished, shortDescription, description}`,
        {ids: draftIds},
      )
    : []

  if (!isAll) {
    const found = new Set(docs.map((d) => d.slug))
    const missing = BREAKERS.filter((s) => !found.has(s))
    if (missing.length) {
      console.error('No such listing:', missing.join(', '))
      process.exit(1)
    }
  }

  type Change = {docId: string; slug: string; published: boolean; set: Record<string, string>; lines: string[]}
  const changes: Change[] = []
  const backup: Record<string, Record<string, string>> = {}

  for (const doc of [...docs, ...drafts]) {
    const set: Record<string, string> = {}
    const lines: string[] = []
    for (const field of FIELDS) {
      const localized = doc[field]
      if (!localized || typeof localized !== 'object') continue
      for (const [locale, text] of Object.entries(localized)) {
        if (typeof text !== 'string') continue
        const next = stripEmoji(text)
        if (next === text) continue
        set[`${field}.${locale}`] = next
        lines.push(`${field}.${locale}: ${preview(text)}`)
        backup[doc._id] ??= {}
        backup[doc._id][`${field}.${locale}`] = text
      }
    }
    if (Object.keys(set).length === 0) continue
    changes.push({docId: doc._id, slug: doc.slug, published: Boolean(doc.isPublished), set, lines})
  }

  console.log(
    `${docs.length + drafts.length} documents read — ${changes.length} carry emoji${isAll ? '' : ' (the six known breakers)'}.\n`,
  )
  for (const change of changes) {
    console.log(`${change.published ? 'live ' : 'draft'} ${change.docId} (${change.slug})`)
    for (const line of change.lines) console.log(`      ${line}`)
    console.log('')
  }

  if (changes.length === 0) return

  if (isDry) {
    console.log('Dry run — nothing written.')
    return
  }

  const backupPath = path.resolve(
    process.cwd(),
    `listing-emoji-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
  )
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf8')
  console.log(`Previous values saved to ${path.basename(backupPath)}`)

  let tx = client.transaction()
  for (const change of changes) {
    tx = tx.patch(change.docId, (p) => p.set(change.set))
  }
  await tx.commit()
  console.log(`Wrote ${changes.length} documents in one transaction.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
