/**
 * Adds an `faqSection` to district landing pages from a JSON source file.
 *
 * Why: an audit on 2026-09-02 found 51 district pages and 4 city pages with no
 * FAQ at all, while every blog post had one. District pages are the long tail
 * where answer engines actually look, so they were the largest AEO gap on the
 * site.
 *
 * The answers are written as self-contained 40-60 word blocks carrying at least
 * one specific figure, because an answer engine quotes a passage without the
 * page around it. This script enforces that shape rather than trusting the
 * source file: anything outside 35-75 words is rejected before a write happens.
 *
 * Source file shape:
 *   { "districts": { "<district-slug>": [ ["question", "answer"], ... ] } }
 *
 * Constraints:
 * - writes DRAFTS only, so nothing is published without a human in Studio;
 * - skips any landing page that already has an faqSection — re-running never
 *   duplicates a block, and never overwrites an editor's own FAQ;
 * - inserts before the closing ctaSection so the FAQ reads as the last content
 *   block rather than after the call to action;
 * - English only. Studio's Translate fills the other five locales, and sq needs
 *   native review per CONTENT-OPS.md;
 * - deterministic `_key`s, so the same run produces the same document.
 *
 * Run:
 *   npm run add:district-faq -- docs/superpowers/plans/<file>.json
 *   npm run add:district-faq -- docs/superpowers/plans/<file>.json --execute
 */

import path from 'node:path'
import fs from 'node:fs'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const args = process.argv.slice(2)
const execute = args.includes('--execute')
const fillHeading = args.includes('--fill-heading')
const srcArg = args.find((a) => !a.startsWith('--'))
if (!srcArg && !fillHeading) {
  throw new Error('usage: npm run add:district-faq -- <path-to-source.json> [--execute] | --fill-heading [--execute]')
}
const SRC_PATH = srcArg ? path.resolve(process.cwd(), srcArg) : ''

const MIN_WORDS = 35
const MAX_WORDS = 75

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

type Pair = [string, string]
type Source = {districts: Record<string, Pair[]>}

const words = (s: string): number => s.split(/\s+/).filter(Boolean).length

function loadSource(): Source {
  const raw = JSON.parse(fs.readFileSync(SRC_PATH, 'utf8')) as Source
  if (!raw?.districts || typeof raw.districts !== 'object') {
    throw new Error('source file has no "districts" object')
  }
  const problems: string[] = []
  for (const [slug, items] of Object.entries(raw.districts)) {
    if (!Array.isArray(items) || items.length === 0) {
      problems.push(`${slug}: no FAQ items`)
      continue
    }
    for (const [q, a] of items) {
      if (!q?.trim() || !a?.trim()) problems.push(`${slug}: empty question or answer`)
      // A question heading that is not a question is a wasted citation cue.
      else if (!q.trim().endsWith('?')) problems.push(`${slug}: question does not end in "?" — "${q.slice(0, 48)}"`)
      else if (words(a) < MIN_WORDS || words(a) > MAX_WORDS) {
        problems.push(`${slug}: answer is ${words(a)} words (want ${MIN_WORDS}-${MAX_WORDS}) — "${q.slice(0, 48)}"`)
      }
    }
  }
  if (problems.length) {
    throw new Error(`source file rejected:\n  - ${problems.join('\n  - ')}`)
  }
  return raw
}

const L = (en: string) => ({_type: 'localizedString', en})
const T = (en: string) => ({_type: 'localizedText', en})

/**
 * Without a title the frontend falls back to the homepage theme copy
 * ("Everything about Domlivo homes"), so every section carries its own heading.
 * Colon form so no locale has to decline the district name.
 */
export const FAQ_TITLE: Record<string, (district: string) => string> = {
  en: (d) => `${d}: frequently asked questions`,
  sq: (d) => `${d}: pyetje të shpeshta`,
  pl: (d) => `${d}: najczęstsze pytania`,
  ru: (d) => `${d}: частые вопросы`,
  uk: (d) => `${d}: часті запитання`,
  it: (d) => `${d}: domande frequenti`,
}
export const FAQ_SUBTITLE: Record<string, string> = {
  en: 'Prices, who the area suits and what to check — short answers from the DomLivo research base.',
  sq: 'Çmimet, kujt i përshtatet zona dhe çfarë duhet kontrolluar — përgjigje të shkurtra nga baza kërkimore e DomLivo.',
  pl: 'Ceny, dla kogo jest ta okolica i co sprawdzić — krótkie odpowiedzi z bazy badawczej DomLivo.',
  ru: 'Цены, кому подходит район и что проверить — короткие ответы из исследовательской базы DomLivo.',
  uk: 'Ціни, кому підходить район і що перевірити — короткі відповіді з дослідницької бази DomLivo.',
  it: 'Prezzi, a chi si adatta la zona e cosa verificare — risposte brevi dalla base di ricerca DomLivo.',
}

type DistrictTitle = Record<string, string | undefined>

export function faqHeading(districtTitle: DistrictTitle): {
  title: Record<string, string>
  subtitle: Record<string, string>
} {
  const title: Record<string, string> = {_type: 'localizedString'}
  const subtitle: Record<string, string> = {_type: 'localizedText'}
  for (const loc of Object.keys(FAQ_TITLE)) {
    const name = (districtTitle?.[loc] || districtTitle?.en || '').trim()
    if (!name) continue
    title[loc] = FAQ_TITLE[loc](name)
    subtitle[loc] = FAQ_SUBTITLE[loc]
  }
  return {title, subtitle}
}

function faqSection(slug: string, items: Pair[], districtTitle: DistrictTitle): Record<string, unknown> {
  return {
    _type: 'faqSection',
    _key: `faq-${slug}`,
    enabled: true,
    imageMode: 'withoutImage',
    ...faqHeading(districtTitle),
    items: items.map(([q, a], i) => ({
      _type: 'localizedFaqItem',
      _key: `faq-${slug}-${i}`,
      question: L(q.trim()),
      answer: T(a.trim()),
    })),
  }
}

/** Puts the six-locale heading on drafted sections written before it existed. */
async function fillHeadings(): Promise<void> {
  const drafts: Array<{_id: string; slug: string; districtTitle: DistrictTitle; key: string; hasTitle: boolean}> =
    await client.fetch(
      `*[_type=="landingPage" && pageType=="district" && _id in path("drafts.**") && count(pageSections[_type=="faqSection"])>0]{
         _id, "slug": linkedDistrict->slug.current, "districtTitle": linkedDistrict->title,
         "key": pageSections[_type=="faqSection"][0]._key,
         "hasTitle": defined(pageSections[_type=="faqSection"][0].title.en)
       }`,
    )
  const todo = drafts.filter((d) => !d.hasTitle)
  for (const d of drafts) {
    const note = d.hasTitle ? 'already has a title' : FAQ_TITLE.en(d.districtTitle?.en || d.slug)
    console.log(`  ${d.hasTitle ? 'skip ' : 'set  '} ${String(d.slug).padEnd(22)} ${note}`)
  }
  console.log(`\n  ${todo.length} of ${drafts.length} drafted FAQ sections need a heading`)
  if (!execute) {
    console.log('\nDry run. Re-run with --execute to write the drafts.')
    return
  }
  for (const d of todo) {
    const {title, subtitle} = faqHeading(d.districtTitle)
    await client
      .patch(d._id)
      .set({[`pageSections[_key=="${d.key}"].title`]: title, [`pageSections[_key=="${d.key}"].subtitle`]: subtitle})
      .commit()
    console.log(`  wrote heading on ${d._id}`)
  }
}

async function main(): Promise<void> {
  if (fillHeading) return fillHeadings()
  if (!fs.existsSync(SRC_PATH)) throw new Error(`source file not found at ${SRC_PATH}`)
  const src = loadSource()
  const slugs = Object.keys(src.districts)

  let pages: Array<{
    _id: string
    slug: string
    districtTitle: DistrictTitle
    sections: Array<Record<string, unknown>>
  }> = await client.fetch(
    `*[_type=="landingPage" && pageType=="district" && linkedDistrict->slug.current in $slugs]{
       _id, "slug": linkedDistrict->slug.current, "districtTitle": linkedDistrict->title, "sections": pageSections
     }`,
    {slugs},
  )

  // The query returns both `drafts.<id>` and `<id>` when a draft exists. Keep
  // the draft: it is what Studio shows and what a re-run must not overwrite
  // with a published copy that has no FAQ yet (found 2026-09-03, 38 matches
  // for 19 landings).
  const byBase = new Map<string, (typeof pages)[number]>()
  for (const p of pages) {
    const base = String(p._id).replace(/^drafts\./, '')
    const current = byBase.get(base)
    if (!current || String(p._id).startsWith('drafts.')) byBase.set(base, p)
  }
  pages = Array.from(byBase.values())

  const missing = slugs.filter((s) => !pages.some((p) => p.slug === s))
  if (missing.length) console.log(`  no district landing page for: ${missing.join(', ')}`)

  let planned = 0
  let skipped = 0
  const writes: Array<Record<string, unknown>> = []

  for (const page of pages) {
    const items = src.districts[page.slug]
    const sections = Array.isArray(page.sections) ? page.sections : []
    if (sections.some((s) => s?._type === 'faqSection')) {
      console.log(`  skip  ${page.slug} — already has an faqSection`)
      skipped++
      continue
    }
    // Before the closing call to action, so the FAQ is the last thing read.
    const ctaAt = sections.findIndex((s) => s?._type === 'ctaSection')
    const at = ctaAt >= 0 ? ctaAt : sections.length
    const next = [...sections.slice(0, at), faqSection(page.slug, items, page.districtTitle), ...sections.slice(at)]
    console.log(`  add   ${page.slug} — ${items.length} Q&A at position ${at + 1}/${next.length}`)
    planned++
    writes.push({_id: `drafts.${String(page._id).replace(/^drafts\./, '')}`, pageSections: next, __base: page._id})
  }

  console.log(`\n  ${planned} pages to update, ${skipped} skipped, ${pages.length} district pages matched`)

  if (!execute) {
    console.log('\nDry run. Re-run with --execute to write the drafts.')
    return
  }

  for (const w of writes) {
    const baseId = String(w.__base)
    const existing = await client.fetch(`*[_id==$id][0]`, {id: baseId})
    if (!existing) {
      console.log(`  MISS  ${baseId} disappeared between read and write — skipped`)
      continue
    }
    const doc = {...existing, _id: String(w._id), pageSections: w.pageSections}
    delete (doc as Record<string, unknown>)._rev
    delete (doc as Record<string, unknown>)._createdAt
    delete (doc as Record<string, unknown>)._updatedAt
    await client.createOrReplace(doc as {_id: string; _type: string})
    console.log(`  wrote ${w._id}`)
  }
  console.log('\nDrafts only. Open them in Studio, press 🌐 Translate with base EN, review sq natively, publish.')
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
