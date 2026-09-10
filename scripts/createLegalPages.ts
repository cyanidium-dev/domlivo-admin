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
 * Idempotent by `createOrReplace` on a fixed id. All six locales are written:
 * `en` and `ru` from `data/legalPages.ts`, the other four from
 * `data/legalPagesTranslations.ts`, translated by hand rather than by the
 * model — a mistranslated obligation is a different class of error from a
 * mistranslated marketing line. The shapes are asserted equal before writing.
 *
 * Run:
 * - npm run create:legal-pages -- --dry
 * - npm run create:legal-pages -- --execute
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {LEGAL_DOCS, type LegalBlock, type LegalDoc} from './data/legalPages'
import {
  PRIVACY_BODY,
  PRIVACY_META,
  PRIVACY_TITLES,
  TERMS_BODY,
  TERMS_META,
  TERMS_TITLES,
  type TranslatedLocale,
} from './data/legalPagesTranslations'

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

const AUTHORED = ['en', 'ru'] as const
const TRANSLATED: readonly TranslatedLocale[] = ['uk', 'sq', 'it', 'pl']
const LOCALES = [...AUTHORED, ...TRANSLATED] as const

/** Hand-written translations, keyed the same way as the authored copy. */
const TRANSLATIONS: Record<string, {
  title: Record<TranslatedLocale, string>
  meta: Record<TranslatedLocale, string>
  body: Record<TranslatedLocale, LegalBlock[]>
}> = {
  privacy: {title: PRIVACY_TITLES, meta: PRIVACY_META, body: PRIVACY_BODY},
  terms: {title: TERMS_TITLES, meta: TERMS_META, body: TERMS_BODY},
}

/**
 * A translation has to be the same document, not a similar one: same number of
 * blocks, same block shapes, same list lengths. A mismatch means the copy has
 * drifted apart between locales and is a build failure, not a warning — a legal
 * page missing a clause in one language is worse than one that is untranslated.
 */
function assertSameShape(slug: string, locale: string, source: LegalBlock[], other: LegalBlock[]) {
  const fail = (why: string) => {
    throw new Error(`${slug} [${locale}]: ${why}`)
  }
  if (other.length !== source.length) {
    fail(`${other.length} blocks against ${source.length} in English`)
  }
  source.forEach((block, i) => {
    const t = other[i]
    if (Boolean(block.heading) !== Boolean(t.heading)) fail(`block ${i} disagrees about having a heading`)
    if ((block.paragraphs?.length ?? 0) !== (t.paragraphs?.length ?? 0)) fail(`block ${i} has a different paragraph count`)
    if ((block.bullets?.length ?? 0) !== (t.bullets?.length ?? 0)) fail(`block ${i} has a different bullet count`)
  })
}

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
  const tr = TRANSLATIONS[doc.slug]
  for (const locale of TRANSLATED) {
    assertSameShape(doc.slug, locale, doc.body.en, tr.body[locale])
  }
  const title = localized((l) =>
    l === 'en' || l === 'ru' ? doc.title[l] : tr.title[l as TranslatedLocale],
  )
  const metaDescription = localized((l) =>
    l === 'en' || l === 'ru' ? doc.metaDescription[l] : tr.meta[l as TranslatedLocale],
  )
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
        content: localized((l) =>
          toPortableText(
            l === 'en' || l === 'ru' ? doc.body[l] : tr.body[l as TranslatedLocale],
            `${doc.slug}-${l}`,
          ),
        ),
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
      `  /${doc.slug}: ${blocks} blocks × ${LOCALES.length} locales ` +
        `(${LOCALES.join(', ')}), ~${chars} chars (en), ` +
        `${todos} TODO(legal) marker(s) per locale`,
    )
    if (isExecute) await client.createOrReplace(built as never)
  }
  console.log(`\nDone: ${LEGAL_DOCS.length} page(s), shapes verified across all locales.`)
  if (isDry) console.log('Nothing was written — rerun with --execute.\n')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
