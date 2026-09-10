/**
 * Listings in every language, and the languages agreeing with each other.
 *
 * Two kinds of document:
 *  - Partner listings (`property-findall-*`): the import writes the partner's
 *    Albanian into `sq` and, on first import, copies it into every other
 *    locale. This script translates sq → en, uk, ru, it, pl and overwrites
 *    those copies. Titles drop the partner's "Shitet" / "Jepet me qira"
 *    prefix — the deal badge says that — and read as listing titles.
 *  - In-house listings: English is the source. Missing locales are filled;
 *    with --check, every locale is compared against English and any version
 *    that contradicts it (a different area, price, room count, place, or a
 *    fact that is not in the English) is rewritten from English. The report
 *    lists what was found.
 *
 * Never touches a locale that is already a proper translation unless
 * --check finds it wrong. Re-runnable.
 *
 * Run:
 * - npx tsx scripts/translateProperties.ts --dry
 * - npx tsx scripts/translateProperties.ts --execute [--only findall|own] [--check] [--limit 10]
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {askJson, costUsd, mapLimit, usage} from './lib/claudeTranslate'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN?.trim(),
})

const args = process.argv.slice(2)
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')
const check = args.includes('--check')
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : ''
const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : 0
if (!isDry && !isExecute) {
  console.error('Use --dry or --execute.')
  process.exit(1)
}

const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl'] as const
type Locale = (typeof LOCALES)[number]
const FIELDS = ['title', 'shortDescription', 'description'] as const
type Field = (typeof FIELDS)[number]
type Localized = Partial<Record<Locale, string>>

type Row = {
  _id: string
  title?: Localized
  shortDescription?: Localized
  description?: Localized
  area?: number
  bedrooms?: number
  bathrooms?: number
  price?: number
  rooms?: number
  type?: string
  district?: string
  city?: string
}

const val = (m: Localized | undefined, l: Locale) => (typeof m?.[l] === 'string' ? (m[l] as string).trim() : '')

const SYSTEM_PARTNER = `Task: an Albanian real-estate listing from a partner agency, to be published on a multilingual site. The user message is JSON with "title", "shortDescription" and "description" in Albanian, plus the listing facts (area, bedrooms, bathrooms, price) for reference. Produce the target languages listed in "to".
Title: a clean listing title without the sale/rent verb ("Shitet", "Jepet me qira", "Shiten") and without emoji — e.g. "1+1 apartment in Golem, Alb-Adriatik complex". Keep the layout notation (1+1, 2+1), the place and the distinctive detail. Keep it under 90 characters.
Short description: one or two sentences, the essence.
Description: the full text translated faithfully, paragraph breaks preserved as "\\n\\n". Drop nothing, add nothing.
Reply: {"title": {"en": …, "uk": …, …}, "shortDescription": {…}, "description": {…}} with a key per requested language.`

/**
 * get.al listings are rewritten rather than translated. The source is another
 * agency's marketing copy: republishing it word for word in six languages
 * would put their text on our pages and hand Google six near-duplicates of a
 * page it already knows. So the facts are kept and the prose is ours — and
 * the model is told, twice, that inventing a fact is the one unforgivable
 * move, because a listing that promises a sea view there is none is worse
 * than a dull one.
 */
const SYSTEM_GETAL = `Task: write the copy for a real-estate listing in Albania, in every language listed in "to". The user message is JSON: "source" is the selling agency's own Albanian text, and "facts" are the listing's verified fields.
Write original copy. Do NOT translate the source sentence by sentence and do NOT reuse its phrasing, structure or slogans — take the facts out of it and write the listing yourself, the way a good local agent would.
Never state anything the source and the facts do not support: no invented sea views, renovations, yields, distances, year built, furnishings or neighbours. If the source is thin, write less. Never mention the selling agency, its agents, phone numbers or a price inside the text.
Title: no sale verb ("Shitet", "Shiten"), no emoji, no "◆". Keep the layout notation (1+1, 2+1), the place and the one distinctive detail — e.g. "2+1 apartment with balcony near the hospital, Durrës". Under 90 characters.
Short description: one or two sentences, the essence, under 200 characters.
Description: 3 to 5 short paragraphs separated by "\\n\\n" — what it is and where, the layout and the condition, the surroundings, who it suits. No bullet lists, no headings.
Each language must read as if written natively in it, not as a translation of the others. Albanian is written natively too, with correct case forms.
Reply: {"title": {"en": …, "sq": …, …}, "shortDescription": {…}, "description": {…}} with a key per requested language.`

const SYSTEM_OWN_FILL = `Task: an in-house real-estate listing written in English. Produce the target languages listed in "to" for "title", "shortDescription" and "description", faithfully, paragraph breaks preserved as "\\n\\n".
Reply: {"title": {…}, "shortDescription": {…}, "description": {…}} with a key per requested language.`

const SYSTEM_OWN_CHECK = `Task: quality control of a multilingual real-estate listing. The user message is JSON with the English source and the existing versions in other languages for "title", "shortDescription" and "description", plus the listing facts.
For every non-English version decide whether it says the same as the English: same area, price, rooms, floor, place, features and claims; no facts added or dropped; correct language for the field (Ukrainian text in "uk", Russian in "ru"); natural, not a calque.
Reply: {"issues": [{"locale": "ru", "field": "description", "problem": "…"}], "rewrite": {"description": {"ru": "…"}}} — "rewrite" carries a fresh translation from the English for exactly the field/locale pairs listed in "issues", and is {} when there are none.`

async function main() {
  const filter =
    only === 'findall'
      ? '&& _id match "property-findall-*"'
      : only === 'getal'
        ? '&& _id match "property-getal-*"'
        : only === 'own'
          ? '&& !(_id match "property-findall-*") && !(_id match "property-getal-*")'
          : ''
  // get.al listings are imported unpublished on purpose — they are not fit to
  // publish until this script has replaced the Albanian in the other locales —
  // so they are the one kind selected regardless of the published flag.
  const published = only === 'getal' ? '' : '&& isPublished == true'
  let rows = await client.fetch<Row[]>(
    `*[_type == "property" ${published} ${filter}] | order(_id) {_id, title, shortDescription, description, area, bedrooms, bathrooms, price, rooms, "type": type->slug.current, "district": district->title.en, "city": city->title.en}`,
  )
  if (limit > 0) rows = rows.slice(0, limit)

  type Job = {row: Row; kind: 'partner' | 'getal' | 'fill' | 'check'; targets: Locale[]}
  const jobs: Job[] = []
  for (const row of rows) {
    // The agency's own marketing prose is not republished. Every locale,
    // Albanian included, is rewritten from the source facts, so all six
    // targets are always in play.
    if (row._id.startsWith('property-getal-')) {
      const sq = val(row.title, 'sq')
      if (!sq) continue
      // The import seeds every locale with the same Albanian string, so a
      // listing whose English still equals its Albanian has not been rewritten
      // yet. Skipping the rest makes the run resumable — the 2026-09-10 run
      // stopped halfway on an API credit limit, and re-doing the finished ones
      // would have cost the money twice.
      if (!check && val(row.title, 'en') && val(row.title, 'en') !== sq) continue
      jobs.push({row, kind: 'getal', targets: [...LOCALES]})
      continue
    }
    const partner = row._id.startsWith('property-findall-')
    if (partner) {
      const sq = val(row.title, 'sq')
      if (!sq) continue
      // Untranslated = still the Albanian copy the import made.
      const targets = LOCALES.filter((l) => l !== 'sq' && (val(row.title, l) === sq || !val(row.title, l)))
      if (targets.length) jobs.push({row, kind: 'partner', targets})
      continue
    }
    const en = val(row.title, 'en')
    if (!en) continue
    const missing = LOCALES.filter(
      (l) => l !== 'en' && FIELDS.some((f) => !val(row[f], l) || val(row[f], l) === val(row[f], 'en')),
    )
    if (missing.length) jobs.push({row, kind: 'fill', targets: missing})
    else if (check) jobs.push({row, kind: 'check', targets: LOCALES.filter((l) => l !== 'en')})
  }
  const counts = {partner: 0, getal: 0, fill: 0, check: 0}
  for (const j of jobs) counts[j.kind] += 1
  console.log(
    `${rows.length} listings → ${jobs.length} jobs: ${counts.partner} partner translations, ${counts.getal} get.al rewrites, ${counts.fill} in-house fills, ${counts.check} consistency checks`,
  )
  if (isDry) {
    for (const j of jobs.slice(0, 15)) console.log(`  ${j.kind.padEnd(7)} ${j.row._id} → ${j.targets.join(',')} "${(val(j.row.title, 'sq') || val(j.row.title, 'en')).slice(0, 60)}"`)
    console.log('\nDry run — nothing sent, nothing written.')
    return
  }

  const report: Array<Record<string, unknown>> = []
  let written = 0
  await mapLimit(jobs, 4, async (job, i) => {
    const {row, kind, targets} = job
    const facts = {area: row.area, bedrooms: row.bedrooms, bathrooms: row.bathrooms, price: row.price}
    try {
      if (kind === 'getal') {
        const payload = {
          source: {
            title: val(row.title, 'sq'),
            description: val(row.description, 'sq') || val(row.title, 'sq'),
          },
          facts: {
            ...facts,
            rooms: row.rooms,
            propertyType: row.type,
            district: row.district,
            city: row.city,
          },
          to: targets,
        }
        const reply = await askJson(SYSTEM_GETAL, JSON.stringify(payload))
        const set: Record<string, string> = {}
        for (const f of FIELDS) {
          const got = reply[f]
          if (!got || typeof got !== 'object') continue
          for (const l of targets) {
            const text = typeof (got as Record<string, unknown>)[l] === 'string' ? ((got as Record<string, string>)[l] as string).trim() : ''
            if (text) set[`${f}.${l}`] = text
          }
        }
        // Six locales × three fields. A reply missing most of them is a bad
        // generation, not a partial success — leaving the Albanian in place is
        // better than writing half a listing.
        if (Object.keys(set).length < targets.length * 2) {
          throw new Error(`only ${Object.keys(set).length} of ${targets.length * FIELDS.length} fields came back`)
        }
        await client.patch(row._id).set(set).commit()
        written += Object.keys(set).length
        report.push({id: row._id, kind, targets, fields: Object.keys(set).length, title: set['title.en']})
      } else if (kind === 'partner' || kind === 'fill') {
        const src: Locale = kind === 'partner' ? 'sq' : 'en'
        const payload = {
          title: val(row.title, src),
          shortDescription: val(row.shortDescription, src) || val(row.title, src),
          description: val(row.description, src) || val(row.title, src),
          facts,
          to: targets,
        }
        const reply = await askJson(kind === 'partner' ? SYSTEM_PARTNER : SYSTEM_OWN_FILL, JSON.stringify(payload))
        const set: Record<string, string> = {}
        for (const f of FIELDS) {
          const got = reply[f]
          if (!got || typeof got !== 'object') continue
          for (const l of targets) {
            const text = typeof (got as Record<string, unknown>)[l] === 'string' ? ((got as Record<string, string>)[l] as string).trim() : ''
            if (!text) continue
            // Fill only what is missing or still a copy on in-house docs; partner docs are overwritten.
            if (kind === 'fill' && val(row[f], l) && val(row[f], l) !== val(row[f], 'en')) continue
            set[`${f}.${l}`] = text
          }
        }
        if (Object.keys(set).length) {
          await client.patch(row._id).set(set).commit()
          written += Object.keys(set).length
        }
        report.push({id: row._id, kind, targets, fields: Object.keys(set).length, title: set['title.en'] ?? set['title.ru']})
      } else {
        const payload = {
          facts,
          title: row.title,
          shortDescription: row.shortDescription,
          description: row.description,
        }
        const reply = await askJson(SYSTEM_OWN_CHECK, JSON.stringify(payload))
        const issues = Array.isArray(reply.issues) ? (reply.issues as Array<{locale: string; field: string; problem: string}>) : []
        const rewrite = (reply.rewrite && typeof reply.rewrite === 'object' ? reply.rewrite : {}) as Record<string, Record<string, string>>
        const set: Record<string, string> = {}
        for (const issue of issues) {
          const text = rewrite[issue.field]?.[issue.locale]
          if (typeof text === 'string' && text.trim() && FIELDS.includes(issue.field as Field) && LOCALES.includes(issue.locale as Locale)) {
            set[`${issue.field}.${issue.locale}`] = text.trim()
          }
        }
        if (Object.keys(set).length) {
          await client.patch(row._id).set(set).commit()
          written += Object.keys(set).length
        }
        report.push({id: row._id, kind, issues, rewritten: Object.keys(set)})
      }
    } catch (err) {
      report.push({id: row._id, kind, error: err instanceof Error ? err.message : String(err)})
      console.log(`  ! ${row._id}: ${err instanceof Error ? err.message : err}`)
    }
    if ((i + 1) % 10 === 0 || i + 1 === jobs.length) console.log(`  ${i + 1}/${jobs.length}`)
  })

  const reportPath = path.resolve(process.cwd(), `reports/properties-translated-${new Date().toISOString().slice(0, 10)}.json`)
  fs.mkdirSync(path.dirname(reportPath), {recursive: true})
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  const flagged = report.filter((r) => Array.isArray(r.issues) && (r.issues as unknown[]).length)
  console.log(`\nwrote ${written} locale values; ${flagged.length} in-house listings had inconsistencies; report ${reportPath}`)
  console.log(`Claude: ${usage.calls} calls, ${usage.input} in / ${usage.output} out tokens ≈ $${costUsd(usage)}.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
