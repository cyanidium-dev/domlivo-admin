/**
 * Fill uk, sq, it and pl for the copy written by `applyZoneEditorialCopy.ts`.
 *
 * That script authors `en` and `ru` and deliberately drops the other four
 * locales, so a rewritten paragraph is never left sitting next to the seed stub
 * it replaced. This closes the gap, on exactly the documents that script names
 * and no others — `translate:by-type` would sweep every district and landing on
 * the site, which is a different, much larger decision.
 *
 * Writes only empty locales. A locale an editor has since filled by hand is
 * left alone unless --force.
 *
 * Run (after apply:zone-editorial):
 * - npm run translate:zone-editorial -- --dry
 * - npm run translate:zone-editorial -- --execute [--force]
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {askJson, mapLimit, costUsd, usage, LOCALE_NAMES} from './lib/claudeTranslate'
import {ZONE_EDITORIAL_COPY, CITY_EDITORIAL_COPY} from './data/zoneEditorialCopy'

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

const LOCALE_LIST = TARGET_LOCALES.map((l) => LOCALE_NAMES[l]).join(', ')

const SYSTEM = `You translate one editorial paragraph about an Albanian property zone into ${LOCALE_LIST}.
The paragraph states a price band, how price varies inside the zone, who buys there, and one caveat.
Return JSON shaped exactly: {"uk": "...", "sq": "...", "it": "...", "pl": "..."} — one paragraph per locale, no headings, no lists.`

const TITLE_SYSTEM = `You translate one short web page heading (an H2) into ${LOCALE_LIST}.
Keep it a heading: a noun phrase of the same length class, no final full stop, natural in the target language rather than word-for-word.
Return JSON shaped exactly: {"uk": "...", "sq": "...", "it": "...", "pl": "..."}.`

type Job = {
  kind: 'district' | 'city'
  slug: string
  en: string
  /** district doc id (district jobs only) */
  districtId?: string
  landingId?: string
  /** `_key` of the seoTextSection holding this copy */
  sectionKey?: string
  /** locales already filled on the description / content */
  descriptionFilled: Set<string>
  contentFilled: Set<string>
  /** English heading of the block, when it has one, plus its filled locales */
  titleEn?: string
  titleFilled: Set<string>
}

function blocksFor(text: string, keyPrefix: string, locale: string) {
  return [
    {
      _key: `${keyPrefix}-${locale}`,
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [{_key: `${keyPrefix}-${locale}-s`, _type: 'span', marks: [], text}],
    },
  ]
}

function filledLocales(obj: Record<string, unknown> | null | undefined): Set<string> {
  const out = new Set<string>()
  for (const [key, value] of Object.entries(obj ?? {})) {
    if (key.startsWith('_')) continue
    if (typeof value === 'string' ? value.trim() : Array.isArray(value) && value.length > 0) out.add(key)
  }
  return out
}

async function collectJobs(): Promise<Job[]> {
  const districtSlugs = Object.keys(ZONE_EDITORIAL_COPY)
  const districts = await client.fetch<
    Array<{
      _id: string
      slug: string
      description?: Record<string, unknown>
      landing?: {_id: string; sections?: Array<{_key?: string; _type?: string; title?: Record<string, unknown>; content?: Record<string, unknown>}>}
    }>
  >(
    `*[_type == "district" && slug.current in $slugs]{
      _id, "slug": slug.current, description,
      "landing": *[_type == "landingPage" && pageType == "district" && linkedDistrict._ref == ^._id][0]{
        _id, "sections": pageSections[_type == "seoTextSection"]{_key, _type, title, content}
      }
    }`,
    {slugs: districtSlugs},
  )

  const jobs: Job[] = districts.map((d) => {
    const section = d.landing?.sections?.[0]
    return {
      kind: 'district',
      slug: d.slug,
      en: ZONE_EDITORIAL_COPY[d.slug].en,
      districtId: d._id,
      landingId: d.landing?._id,
      sectionKey: section?._key,
      descriptionFilled: filledLocales(d.description),
      contentFilled: filledLocales(section?.content),
      titleEn: typeof section?.title?.en === 'string' ? (section.title.en as string) : undefined,
      titleFilled: filledLocales(section?.title),
    }
  })

  const citySlugs = Object.keys(CITY_EDITORIAL_COPY)
  const cities = await client.fetch<
    Array<{_id: string; citySlug: string; sections?: Array<{_key?: string; title?: Record<string, unknown>; content?: Record<string, unknown>}>}>
  >(
    `*[_type == "landingPage" && pageType == "city" && linkedCity->slug.current in $citySlugs]{
      _id, "citySlug": linkedCity->slug.current,
      "sections": pageSections[_type == "seoTextSection"]{_key, title, content}
    }`,
    {citySlugs},
  )

  for (const city of cities) {
    const section = city.sections?.[0]
    jobs.push({
      kind: 'city',
      slug: city.citySlug,
      en: CITY_EDITORIAL_COPY[city.citySlug].en,
      landingId: city._id,
      sectionKey: section?._key,
      descriptionFilled: new Set(),
      contentFilled: filledLocales(section?.content),
      titleEn: typeof section?.title?.en === 'string' ? (section.title.en as string) : undefined,
      titleFilled: filledLocales(section?.title),
    })
  }

  return jobs
}

async function run() {
  console.log(`\n=== translate:zone-editorial (${isDry ? 'DRY RUN' : 'EXECUTE'}) ===\n`)
  const jobs = await collectJobs()

  const pending = jobs.filter((job) =>
    TARGET_LOCALES.some(
      (l) =>
        isForce ||
        !job.contentFilled.has(l) ||
        (job.districtId && !job.descriptionFilled.has(l)) ||
        (job.titleEn && !job.titleFilled.has(l)),
    ),
  )

  if (pending.length === 0) {
    console.log('Every locale is already filled — nothing to do.\n')
    return
  }
  console.log(`${pending.length} zone(s) to translate into ${TARGET_LOCALES.join(', ')}\n`)

  if (isDry) {
    for (const job of pending) {
      const missingContent = TARGET_LOCALES.filter((l) => isForce || !job.contentFilled.has(l))
      const missingDesc = job.districtId
        ? TARGET_LOCALES.filter((l) => isForce || !job.descriptionFilled.has(l))
        : []
      const missingTitle = job.titleEn
        ? TARGET_LOCALES.filter((l) => isForce || !job.titleFilled.has(l))
        : []
      console.log(
        `  ${job.kind} ${job.slug}: content → [${missingContent.join(', ') || '—'}]` +
          (job.districtId ? `, description → [${missingDesc.join(', ') || '—'}]` : '') +
          (job.titleEn ? `, heading → [${missingTitle.join(', ') || '—'}]` : ''),
      )
    }
    console.log('\nNothing was written — rerun with --execute.\n')
    return
  }

  await mapLimit(pending, 3, async (job) => {
    // A job can be pending for the heading alone — don't pay for a body
    // translation whose every locale is already filled.
    const needsBody = TARGET_LOCALES.some(
      (l) =>
        isForce ||
        !job.contentFilled.has(l) ||
        (job.districtId && !job.descriptionFilled.has(l)),
    )
    const translations: Partial<Record<TargetLocale, string>> = {}
    if (needsBody) {
      const reply = await askJson(SYSTEM, JSON.stringify({zone: job.slug, en: job.en}), 4000)
      for (const locale of TARGET_LOCALES) {
        const value = reply[locale]
        if (typeof value === 'string' && value.trim()) translations[locale] = value.trim()
        else console.warn(`  ! ${job.slug}: model returned nothing for ${locale}`)
      }
    }

    if (job.districtId) {
      const set: Record<string, string> = {}
      for (const [locale, text] of Object.entries(translations)) {
        if (!isForce && job.descriptionFilled.has(locale)) continue
        set[`description.${locale}`] = text
      }
      if (Object.keys(set).length > 0) await client.patch(job.districtId).set(set).commit()
    }

    if (job.landingId && job.sectionKey) {
      const set: Record<string, unknown> = {}
      for (const [locale, text] of Object.entries(translations)) {
        if (!isForce && job.contentFilled.has(locale)) continue
        set[`pageSections[_key=="${job.sectionKey}"].content.${locale}`] = blocksFor(
          text,
          `about-${job.slug}`,
          locale,
        )
      }

      // The heading is a separate call: asked for together with the body the
      // model returns a sentence, and an H2 that reads as a sentence is the
      // thing these pages already had too much of.
      const needsTitle =
        job.titleEn && TARGET_LOCALES.some((l) => isForce || !job.titleFilled.has(l))
      if (needsTitle) {
        const titleReply = await askJson(TITLE_SYSTEM, JSON.stringify({en: job.titleEn}), 700)
        for (const locale of TARGET_LOCALES) {
          if (!isForce && job.titleFilled.has(locale)) continue
          const value = titleReply[locale]
          if (typeof value === 'string' && value.trim()) {
            set[`pageSections[_key=="${job.sectionKey}"].title.${locale}`] = value.trim()
          }
        }
      }

      if (Object.keys(set).length > 0) await client.patch(job.landingId).set(set).commit()
    } else if (job.landingId) {
      console.warn(`  ! ${job.slug}: landing has no text block — description translated only`)
    }

    console.log(`  ${job.slug}: ${Object.keys(translations).join(', ')}`)
  })

  console.log(`\nDone. ${usage.calls} model call(s), about $${costUsd(usage)}.\n`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
