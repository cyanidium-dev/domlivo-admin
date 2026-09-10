/**
 * Create (or refresh) the `/privacy` and `/terms` landing pages.
 *
 * The footer of every page and the cookie banner link to both, and neither
 * existed — 2,591 internal links to `/privacy` alone resolving to a 404 in the
 * Ahrefs crawl of 2026-09-10, and a consent banner pointing at nothing on a
 * site that runs Google Tag Manager and Microsoft Clarity.
 *
 * The content lives in `data/legalPages.ts`, where its provenance is documented:
 * every factual claim is read out of the application code, not copied from
 * another site. Three items cannot be read out of code and are marked
 * `TODO(legal)` in the copy itself — the registered entity, the retention
 * period for lead messages, and the competent forum.
 *
 * Idempotent by `createOrReplace` on a fixed id. Only `en` and `ru` are
 * authored; run the translator afterwards for the rest:
 *   npm run translate:legal-pages -- --execute
 *
 * Run:
 * - npm run create:legal-pages -- --dry
 * - npm run create:legal-pages -- --execute
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {LEGAL_DOCS, type LegalBlock, type LegalDoc} from './data/legalPages'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const args = process.argv.slice(2)
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')

if (!token || !projectId) {
  console.error('Error: SANITY_PROJECT_ID and SANITY_API_TOKEN required. Add them to .env')
  process.exit(1)
}
if (!isDry && !isExecute) {
  console.error('Use --dry to preview or --execute to write.')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token})

const LOCALES = ['en', 'ru'] as const

/** Blocks → Portable Text, with deterministic keys so a rerun is a no-op diff. */
function toPortableText(blocks: LegalBlock[], prefix: string): unknown[] {
  const out: unknown[] = []
  blocks.forEach((block, i) => {
    if (block.heading) {
      out.push({
        _key: `${prefix}-h${i}`,
        _type: 'block',
        style: 'h2',
        markDefs: [],
        children: [{_key: `${prefix}-h${i}-s`, _type: 'span', marks: [], text: block.heading}],
      })
    }
    block.paragraphs?.forEach((text, j) => {
      out.push({
        _key: `${prefix}-p${i}-${j}`,
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [{_key: `${prefix}-p${i}-${j}-s`, _type: 'span', marks: [], text}],
      })
    })
    block.bullets?.forEach((text, j) => {
      out.push({
        _key: `${prefix}-b${i}-${j}`,
        _type: 'block',
        style: 'normal',
        listItem: 'bullet',
        level: 1,
        markDefs: [],
        children: [{_key: `${prefix}-b${i}-${j}-s`, _type: 'span', marks: [], text}],
      })
    })
  })
  return out
}

function localized<T>(build: (locale: (typeof LOCALES)[number]) => T): Record<string, T> {
  const out: Record<string, T> = {}
  for (const locale of LOCALES) out[locale] = build(locale)
  return out
}

function buildDocument(doc: LegalDoc) {
  const title = localized((l) => doc.title[l])
  const metaDescription = localized((l) => doc.metaDescription[l])
  return {
    _id: `landing-${doc.slug}`,
    _type: 'landingPage',
    pageType: 'custom',
    enabled: true,
    slug: {_type: 'slug', current: doc.slug},
    title,
    contentUpdatedAt: doc.updated,
    seo: {
      metaTitle: title,
      metaDescription,
      ogTitle: title,
      ogDescription: metaDescription,
      noIndex: false,
    },
    pageSections: [
      {
        _key: 'legal-body',
        _type: 'seoTextSection',
        enabled: true,
        title,
        content: localized((l) => toPortableText(doc.body[l], `${doc.slug}-${l}`)),
      },
    ],
  }
}

async function run() {
  console.log(`\n=== create:legal-pages (${isDry ? 'DRY RUN' : 'EXECUTE'}) ===\n`)
  for (const doc of LEGAL_DOCS) {
    const built = buildDocument(doc)
    const blocks = (built.pageSections[0].content as Record<string, unknown[]>).en.length
    const chars = doc.body.en.reduce(
      (n, b) =>
        n +
        (b.heading?.length ?? 0) +
        (b.paragraphs?.join('').length ?? 0) +
        (b.bullets?.join('').length ?? 0),
      0,
    )
    const todos = JSON.stringify(doc.body).match(/TODO\(legal\)/g)?.length ?? 0
    console.log(
      `  /${doc.slug}: ${blocks} blocks, ~${chars} chars (en), ${todos} TODO(legal) marker(s)`,
    )
    if (isExecute) await client.createOrReplace(built as never)
  }
  console.log(`\nDone: ${LEGAL_DOCS.length} page(s).`)
  if (isDry) console.log('Nothing was written — rerun with --execute.\n')
  else console.log('Now run: npm run translate:legal-pages -- --execute\n')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
