/**
 * Give zone pages the prose they never got.
 *
 * `generateDistrictLandings.ts` attaches the "About {district}" block only when
 * the district's own `description` clears 150 characters. Six Durrës districts
 * never cleared it, so their pages shipped as figures + listings + links with
 * no copy at all — and the city landing's "About Durrës" block was a single
 * sentence true of every coastal city on the site. This applies the authored
 * replacements from `data/zoneEditorialCopy.ts`:
 *
 *   1. `district.description`      — the six stub/empty districts
 *   2. district landing            — insert the `about` block after the figures
 *   3. city landing                — replace the "About {city}" body, and put
 *                                    the city's own photograph on the block
 *
 * Locales: only `en` and `ru` are authored, and the previous value's other four
 * locales are DROPPED rather than left in place — a stub sentence surviving in
 * Polish next to a rewritten English one is worse than a gap, and the project
 * translator fills gaps but never overwrites. Follow every run with:
 *   npm run translate:by-type -- district    --locales=uk,sq,it,pl --execute
 *   npm run translate:by-type -- landingPage --locales=uk,sq,it,pl --execute
 *
 * Idempotent: a district whose description already clears the threshold is left
 * alone, and a landing that already has a `seoTextSection` is not given a
 * second one. `--force` overrides the first of those, never the second.
 *
 * Run:
 * - npm run apply:zone-editorial -- --dry
 * - npm run apply:zone-editorial -- --execute [--force]
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {
  ZONE_EDITORIAL_COPY,
  CITY_EDITORIAL_COPY,
  type EditorialCopy,
} from './data/zoneEditorialCopy'

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

/** Same gate `generateDistrictLandings.ts` uses to decide a description is real. */
const MIN_DESCRIPTION = 150

const AUTHORED_LOCALES = ['en', 'ru'] as const

/** "About {district}" heading, per locale, as the landing generator writes it. */
const ABOUT_TITLE: Record<string, string> = {
  en: 'About {n}',
  uk: 'Про {n}',
  ru: 'О районе {n}',
  sq: 'Rreth {n}',
  it: 'Informazioni su {n}',
  pl: 'O dzielnicy {n}',
}

type Localized = Record<string, string>

type DistrictRow = {
  _id: string
  slug: string
  title?: Localized
  description?: Localized
  landing?: {_id: string; sections?: Array<{_key?: string; _type?: string}>} | null
}

type CityLandingRow = {
  _id: string
  citySlug: string
  cityTitle?: Localized
  heroImageRef?: string
  heroImageAlt?: string
  galleryImageRef?: string
  galleryImageAlt?: string
  sections?: Array<{_key?: string; _type?: string; content?: Record<string, unknown>}>
}

/** Locales beyond the two this script authors that already hold copy. */
function translatedLocales(content: Record<string, unknown> | undefined): string[] {
  return Object.entries(content ?? {})
    .filter(
      ([key, value]) =>
        !key.startsWith('_') &&
        !(AUTHORED_LOCALES as readonly string[]).includes(key) &&
        Array.isArray(value) &&
        value.length > 0,
    )
    .map(([key]) => key)
}

/** One Portable Text paragraph per authored locale. */
function toBlocks(copy: EditorialCopy, keyPrefix: string): Record<string, unknown[]> {
  const out: Record<string, unknown[]> = {}
  for (const locale of AUTHORED_LOCALES) {
    out[locale] = [
      {
        _key: `${keyPrefix}-${locale}`,
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [{_key: `${keyPrefix}-${locale}-s`, _type: 'span', marks: [], text: copy[locale]}],
      },
    ]
  }
  return out
}

/** Heading in every locale the district has a name for. */
function aboutTitle(title: Localized | undefined): Localized {
  const out: Localized = {}
  for (const [locale, template] of Object.entries(ABOUT_TITLE)) {
    const name = title?.[locale] ?? title?.en
    if (name) out[locale] = template.replace('{n}', name)
  }
  return out
}

async function run() {
  const mode = isDry ? 'DRY RUN' : 'EXECUTE'
  console.log(`\n=== apply:zone-editorial (${mode}${isForce ? ', force' : ''}) ===\n`)

  // --- 1 & 2: districts ------------------------------------------------------
  const slugs = Object.keys(ZONE_EDITORIAL_COPY)
  const districts = await client.fetch<DistrictRow[]>(
    `*[_type == "district" && slug.current in $slugs]{
      _id,
      "slug": slug.current,
      title,
      description,
      "landing": *[_type == "landingPage" && pageType == "district" && linkedDistrict._ref == ^._id][0]{
        _id,
        "sections": pageSections[]{_key, _type}
      }
    }`,
    {slugs},
  )

  const found = new Set(districts.map((d) => d.slug))
  for (const slug of slugs) {
    if (!found.has(slug)) console.warn(`  ! no district document for "${slug}" — skipped`)
  }

  let descPatched = 0
  let blocksInserted = 0

  for (const district of districts) {
    const copy = ZONE_EDITORIAL_COPY[district.slug]
    const currentLength = (district.description?.en ?? '').length
    const needsDescription = currentLength < MIN_DESCRIPTION || isForce

    if (needsDescription) {
      // The whole field is replaced, not merged: the four unauthored locales
      // still hold the seed stub, and leaving them would pair a rewritten
      // English paragraph with "Beachfront offers direct beach access" in
      // Italian. Dropping them hands the gap to the translator.
      const description: Localized = {en: copy.en, ru: copy.ru}
      console.log(
        `  ${district.slug}: description ${currentLength} → ${copy.en.length} chars (en), ` +
          `${copy.ru.length} (ru), other locales cleared for the translator`,
      )
      if (isExecute) {
        await client.patch(district._id).set({description}).commit()
      }
      descPatched += 1
    } else {
      console.log(`  ${district.slug}: description already ${currentLength} chars — left alone`)
    }

    const landing = district.landing
    if (!landing?._id) {
      console.warn(`  ! ${district.slug}: no district landing — "about" block not inserted`)
      continue
    }
    const sections = landing.sections ?? []
    if (sections.some((s) => s._type === 'seoTextSection')) {
      console.log(`    landing ${landing._id}: already has a text block — not inserting`)
      continue
    }

    const block = {
      _key: 'about',
      _type: 'seoTextSection',
      enabled: true,
      title: aboutTitle(district.title),
      content: toBlocks(copy, `about-${district.slug}`),
    }

    // The generator's order is hero → figures → about → listings, and the copy
    // reads as a caption to the numbers when it follows them.
    const statsIndex = sections.findIndex((s) => s._type === 'zoneStatsAutoSection')
    const anchor = statsIndex >= 0 ? sections[statsIndex] : sections[0]
    const position = statsIndex >= 0 || sections.length === 0 ? 'after' : 'before'
    const selector = anchor?._key
      ? `pageSections[_key=="${anchor._key}"]`
      : `pageSections[${sections.length}]`

    console.log(`    landing ${landing._id}: insert "about" ${position} ${anchor?._type ?? 'end'}`)
    if (isExecute) {
      await client
        .patch(landing._id)
        .insert(position as 'after' | 'before', selector, [block])
        .commit()
    }
    blocksInserted += 1
  }

  // --- 3: city landings ------------------------------------------------------
  const citySlugs = Object.keys(CITY_EDITORIAL_COPY)
  const cityLandings = await client.fetch<CityLandingRow[]>(
    `*[_type == "landingPage" && pageType == "city" && linkedCity->slug.current in $citySlugs]{
      _id,
      "citySlug": linkedCity->slug.current,
      "cityTitle": linkedCity->title,
      "heroImageRef": linkedCity->heroImage.asset._ref,
      "heroImageAlt": linkedCity->heroImage.alt,
      "galleryImageRef": linkedCity->gallery[0].asset._ref,
      "galleryImageAlt": linkedCity->gallery[0].alt,
      "sections": pageSections[]{_key, _type, content}
    }`,
    {citySlugs},
  )

  let cityPatched = 0
  for (const landing of cityLandings) {
    const copy = CITY_EDITORIAL_COPY[landing.citySlug]
    const sections = landing.sections ?? []
    const textBlocks = sections.filter((s) => s._type === 'seoTextSection')

    // Vlora and Sarandë shipped with no city copy at all — figures, listings
    // and links, and not a sentence saying what the place is. Those pages get
    // the block created rather than rewritten.
    if (textBlocks.length === 0) {
      const imageRef = landing.galleryImageRef ?? landing.heroImageRef
      const imageAlt = landing.galleryImageRef
        ? landing.galleryImageAlt
        : landing.heroImageAlt
      const block: Record<string, unknown> = {
        _key: 'about-city',
        _type: 'seoTextSection',
        enabled: true,
        title: {en: copy.title.en, ru: copy.title.ru},
        content: toBlocks(copy, `about-${landing.citySlug}`),
      }
      if (imageRef) {
        // The photograph's own alt describes what is in the picture; the
        // city name describes the page. Alt text is for the former.
        block.image = {
          _type: 'image',
          asset: {_type: 'reference', _ref: imageRef},
          alt: imageAlt ?? landing.cityTitle?.en ?? landing.citySlug,
        }
      }

      // After the listings carousel and before the district links: the reader
      // has seen the figures and the stock, and the copy hands them on to the
      // zone that fits.
      const anchor =
        sections.find((s) => s._type === 'propertyCarouselSection') ??
        sections.find((s) => s._type === 'zonePriceTableAutoSection') ??
        sections[sections.length - 1]
      if (!anchor?._key) {
        console.warn(`  ! ${landing.citySlug}: cannot place the block — skipped`)
        continue
      }

      console.log(
        `  ${landing.citySlug}: create "about-city" after ${anchor._type} ` +
          `(${copy.en.length} chars en)${imageRef ? ' + photograph' : ''}`,
      )
      if (isExecute) {
        await client
          .patch(landing._id)
          .insert('after', `pageSections[_key=="${anchor._key}"]`, [block])
          .commit()
      }
      cityPatched += 1
      continue
    }

    const target = textBlocks[0]

    // Rewriting `content` replaces the whole localized object, which would
    // silently discard the uk/sq/it/pl paragraphs the translator wrote on a
    // previous pass. Once the copy is in and translated there is nothing left
    // to do here, so a second run is a no-op instead of a regression.
    const translated = translatedLocales(target.content)
    if (translated.length > 0 && !isForce) {
      console.log(
        `  ${landing.citySlug}: ${target._key} already translated into ` +
          `${translated.join(', ')} — left alone (use --force to rewrite)`,
      )
      continue
    }
    // The city's own photograph, so the block is not a wall of text. The
    // gallery shot is preferred over the hero: the hero already runs
    // full-bleed at the top of the same page.
    const imageRef = landing.galleryImageRef ?? landing.heroImageRef
    const image = imageRef
      ? {
          _type: 'image',
          asset: {_type: 'reference', _ref: imageRef},
          alt:
            (landing.galleryImageRef ? landing.galleryImageAlt : landing.heroImageAlt) ??
            landing.cityTitle?.en ??
            landing.citySlug,
        }
      : undefined
    const content = toBlocks(copy, `about-${landing.citySlug}`)
    const title: Localized = {en: copy.title.en, ru: copy.title.ru}

    const patch: Record<string, unknown> = {
      [`pageSections[_key=="${target._key}"].content`]: content,
      [`pageSections[_key=="${target._key}"].title`]: title,
    }
    if (image) patch[`pageSections[_key=="${target._key}"].image`] = image

    console.log(
      `  ${landing.citySlug}: rewrite ${target._key} (${copy.en.length} chars en) ` +
        `${image ? '+ photograph' : '(no photograph available)'}`,
    )
    if (isExecute) await client.patch(landing._id).set(patch).commit()
    cityPatched += 1

    // Anything after the first text block on a city page has been boilerplate
    // ("Domlivo helps you find verified offers…") carrying no fact a reader
    // could act on. Two text blocks on one page also split the page's topical
    // weight; the rewritten first block now carries it.
    for (const extra of textBlocks.slice(1)) {
      console.log(`    remove boilerplate text block ${extra._key}`)
      if (isExecute) {
        await client.patch(landing._id).unset([`pageSections[_key=="${extra._key}"]`]).commit()
      }
    }
  }

  console.log(
    `\nDone: ${descPatched} descriptions, ${blocksInserted} district blocks, ${cityPatched} city blocks.`,
  )
  if (isDry) console.log('Nothing was written — rerun with --execute.\n')
  else console.log('Now run the translator for uk, sq, it and pl (see the header).\n')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
