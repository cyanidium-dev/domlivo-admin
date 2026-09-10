/**
 * Translate `/privacy` and `/terms` into uk, sq, it and pl.
 *
 * `createLegalPages.ts` authors `en` and `ru`; without this the other four
 * locales fall back to English, which on the Albanian version of an Albanian
 * site is the worst case — that is the jurisdiction the policy names.
 *
 * The text is translated block by block so the document structure is preserved
 * exactly: a heading stays a heading, a bullet stays a bullet, and the count
 * has to match or the locale is skipped rather than written half-formed.
 *
 * `TODO(legal)` markers are carried through untranslated on purpose. They mark
 * the three facts that cannot be read out of code — the registered entity, the
 * retention period, the competent forum — and they must stay visible in every
 * locale until someone fills them in.
 *
 * These translations need the same legal review the originals do.
 *
 * Run:
 * - npm run translate:legal-pages -- --dry
 * - npm run translate:legal-pages -- --execute [--force]
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {askJson, mapLimit, costUsd, usage, LOCALE_NAMES} from './lib/claudeTranslate'
import {LEGAL_DOCS, type LegalBlock} from './data/legalPages'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const args = process.argv.slice(2)
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')
const isForce = args.includes('--force')

if (!token || !projectId) {
  console.error('Error: SANITY_PROJECT_ID and SANITY_API_TOKEN required. Add them to .env')
  process.exit(1)
}
if (!isDry && !isExecute) {
  console.error('Use --dry to preview or --execute to write.')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token})

const TARGET_LOCALES = ['uk', 'sq', 'it', 'pl'] as const
type TargetLocale = (typeof TARGET_LOCALES)[number]

const SYSTEM = `You translate a website's legal page — a privacy policy or terms of use — into ${LOCALE_NAMES.uk}, ${LOCALE_NAMES.sq}, ${LOCALE_NAMES.it} and ${LOCALE_NAMES.pl}.

This is a legal document about a real service. Rules on top of the house style:
- Translate precisely. Do not soften, strengthen, generalise or omit any obligation, right or limitation.
- Keep every proper noun and identifier exactly: Domlivo, Vercel, Sanity, Telegram, Anthropic, Google Tag Manager, Google Analytics 4, Microsoft Clarity, GTM-T27ZZ289, x4l0dctgle, NEXT_LOCALE, favorites, catalogViewMode, domlivo:ai-chat, hello@domlivo.com, idp.al, HTTPS, Consent Mode v2.
- Leave any string containing "TODO(legal)" in English, verbatim.
- Use the target language's established legal register, not a word-for-word calque.

You receive a JSON array of blocks: {heading?, paragraphs?, bullets?}. Return JSON shaped
{"uk": [...], "sq": [...], "it": [...], "pl": [...]}
where each value is the SAME array with the SAME number of blocks, the same keys present on each block, and arrays of the same length — only the text translated.`

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

/** Same shape, same counts — anything else means the model reshaped the document. */
function sameShape(source: LegalBlock[], candidate: unknown): candidate is LegalBlock[] {
  if (!Array.isArray(candidate) || candidate.length !== source.length) return false
  return source.every((block, i) => {
    const other = candidate[i] as LegalBlock | undefined
    if (!other || typeof other !== 'object') return false
    if (Boolean(block.heading) !== Boolean(other.heading)) return false
    if ((block.paragraphs?.length ?? 0) !== (other.paragraphs?.length ?? 0)) return false
    if ((block.bullets?.length ?? 0) !== (other.bullets?.length ?? 0)) return false
    return true
  })
}

async function run() {
  console.log(`\n=== translate:legal-pages (${isDry ? 'DRY RUN' : 'EXECUTE'}) ===\n`)

  const ids = LEGAL_DOCS.map((d) => `landing-${d.slug}`)
  const rows = await client.fetch<
    Array<{_id: string; sections?: Array<{_key?: string; content?: Record<string, unknown>; title?: Record<string, unknown>}>; title?: Record<string, unknown>; seo?: Record<string, Record<string, unknown>>}>
  >(`*[_id in $ids]{_id, title, seo, "sections": pageSections[]{_key, title, content}}`, {ids})

  const jobs = LEGAL_DOCS.map((doc) => {
    const row = rows.find((r) => r._id === `landing-${doc.slug}`)
    const section = row?.sections?.[0]
    const filled = new Set(
      Object.entries((section?.content ?? {}) as Record<string, unknown>)
        .filter(([k, v]) => !k.startsWith('_') && Array.isArray(v) && v.length > 0)
        .map(([k]) => k),
    )
    const missing = TARGET_LOCALES.filter((l) => isForce || !filled.has(l))
    return {doc, id: row?._id, sectionKey: section?._key, missing}
  })

  const pending = jobs.filter((j) => j.id && j.sectionKey && j.missing.length > 0)
  if (pending.length === 0) {
    console.log('Every locale is already filled — nothing to do.\n')
    return
  }
  for (const j of pending) console.log(`  /${j.doc.slug}: → [${j.missing.join(', ')}]`)
  if (isDry) {
    console.log('\nNothing was written — rerun with --execute.\n')
    return
  }

  await mapLimit(pending, 2, async (job) => {
    const reply = await askJson(SYSTEM, JSON.stringify(job.doc.body.en), 16000)
    const set: Record<string, unknown> = {}
    for (const locale of job.missing) {
      const candidate = reply[locale]
      if (!sameShape(job.doc.body.en, candidate)) {
        console.warn(`  ! ${job.doc.slug} [${locale}]: reply did not keep the document's shape — skipped`)
        continue
      }
      set[`pageSections[_key=="${job.sectionKey}"].content.${locale}`] = toPortableText(
        candidate as LegalBlock[],
        `${job.doc.slug}-${locale}`,
      )
    }
    if (Object.keys(set).length > 0) {
      await client.patch(job.id!).set(set).commit()
      console.log(`  ${job.doc.slug}: ${Object.keys(set).length} locale(s) written`)
    }
  })

  console.log(`\nDone. ${usage.calls} model call(s), about $${costUsd(usage)}.`)
  console.log('These translations need the same legal review the originals do.\n')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
