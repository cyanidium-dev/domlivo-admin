/**
 * Migration: Seed city.vibe (localizedString) for known cities.
 *
 * For every existing city document:
 * - If the city's slug appears in VIBE_MAP and vibe is currently empty (no
 *   non-empty value across all locales), set vibe to the per-locale value.
 * - If vibe already has any non-empty locale set by an editor, skip the doc
 *   (we never overwrite editor input).
 * - If the slug is not in VIBE_MAP, log it so the editor can fill in manually.
 *
 * Run:
 *   npx tsx scripts/seedCityVibes.ts --dry-run
 *   npx tsx scripts/seedCityVibes.ts --execute
 *
 * Requires: SANITY_API_TOKEN in .env
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const isDryRun = process.argv.includes('--dry-run')
const isExecute = process.argv.includes('--execute')

if (!isDryRun && !isExecute) {
  console.error('Use --dry-run to preview or --execute to apply patches.')
  process.exit(1)
}

if (!token) {
  console.error('Error: SANITY_API_TOKEN required')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
})

type LocalizedString = {en?: string; uk?: string; ru?: string; sq?: string; it?: string}

/**
 * Slug → vibe (en/uk/ru/sq/it). One-to-two word categorical tag.
 * Editors can override per-city in the Studio after this runs once.
 */
const VIBE_MAP: Record<string, LocalizedString> = {
  tirana: {en: 'Business', uk: 'Бізнес', ru: 'Бизнес', sq: 'Biznes', it: 'Business'},
  durres: {en: 'Sea', uk: 'Море', ru: 'Море', sq: 'Det', it: 'Mare'},
  vlore: {en: 'Sea', uk: 'Море', ru: 'Море', sq: 'Det', it: 'Mare'},
  sarande: {en: 'Resort', uk: 'Курорт', ru: 'Курорт', sq: 'Resort', it: 'Resort'},
  berat: {en: 'Old town', uk: 'Старе місто', ru: 'Старый город', sq: 'Qytet i vjetër', it: 'Centro storico'},
  shkoder: {en: 'Lake', uk: 'Озеро', ru: 'Озеро', sq: 'Liqen', it: 'Lago'},
  kruje: {en: 'Mountains', uk: 'Гори', ru: 'Горы', sq: 'Male', it: 'Montagne'},
  gjirokaster: {en: 'Old town', uk: 'Старе місто', ru: 'Старый город', sq: 'Qytet i vjetër', it: 'Centro storico'},
  korce: {en: 'Mountains', uk: 'Гори', ru: 'Горы', sq: 'Male', it: 'Montagne'},
  fier: {en: 'Inland', uk: 'Континент', ru: 'Континент', sq: 'Brendësi', it: 'Entroterra'},
  elbasan: {en: 'Inland', uk: 'Континент', ru: 'Континент', sq: 'Brendësi', it: 'Entroterra'},
  himare: {en: 'Sea', uk: 'Море', ru: 'Море', sq: 'Det', it: 'Mare'},
  ksamil: {en: 'Beach', uk: 'Пляж', ru: 'Пляж', sq: 'Plazh', it: 'Spiaggia'},
  pogradec: {en: 'Lake', uk: 'Озеро', ru: 'Озеро', sq: 'Liqen', it: 'Lago'},
}

type CityDoc = {_id: string; slug?: string; titleEn?: string; vibe?: LocalizedString | null}

function hasAnyVibeValue(vibe: LocalizedString | null | undefined): boolean {
  if (!vibe || typeof vibe !== 'object') return false
  return (['en', 'uk', 'ru', 'sq', 'it'] as const).some((k) => {
    const v = vibe[k]
    return typeof v === 'string' && v.trim().length > 0
  })
}

async function main() {
  const docs = await client.fetch<CityDoc[]>(
    `*[_type == "city"]{
      _id,
      "slug": slug.current,
      "titleEn": title.en,
      vibe
    } | order(slug asc)`,
  )

  if (docs.length === 0) {
    console.log('No city documents found.')
    return
  }

  const toPatch: {docId: string; slug: string; titleEn: string; vibe: LocalizedString}[] = []
  const alreadySet: {docId: string; slug: string}[] = []
  const unknownSlugs: {docId: string; slug: string; titleEn: string}[] = []

  for (const doc of docs) {
    const slug = (doc.slug ?? '').trim().toLowerCase()
    const titleEn = (doc.titleEn ?? '').trim()
    if (!slug) continue

    if (hasAnyVibeValue(doc.vibe)) {
      alreadySet.push({docId: doc._id, slug})
      continue
    }

    const preset = VIBE_MAP[slug]
    if (!preset) {
      unknownSlugs.push({docId: doc._id, slug, titleEn})
      continue
    }
    toPatch.push({docId: doc._id, slug, titleEn, vibe: preset})
  }

  console.log(`Total cities: ${docs.length}`)
  console.log(`  • Already have vibe (skipped): ${alreadySet.length}`)
  console.log(`  • Will be seeded: ${toPatch.length}`)
  console.log(`  • Unknown slugs (need manual entry in Studio): ${unknownSlugs.length}`)
  console.log()

  if (toPatch.length > 0) {
    console.log('Cities to seed:')
    toPatch.forEach((c) => {
      console.log(`  ${c.slug} (${c.titleEn || '?'}) → ${JSON.stringify(c.vibe)}`)
    })
    console.log()
  }

  if (unknownSlugs.length > 0) {
    console.log('Cities with no preset (add vibe in Studio → Basic tab):')
    unknownSlugs.forEach((c) => {
      console.log(`  ${c.slug} (${c.titleEn || '?'})`)
    })
    console.log()
  }

  if (toPatch.length === 0) {
    console.log('Nothing to do.')
    return
  }

  if (isDryRun) {
    console.log('Dry run. Re-run with --execute to apply patches.')
    return
  }

  const tx = client.transaction()
  for (const {docId, vibe} of toPatch) {
    tx.patch(docId, (p) => p.set({vibe}))
  }
  await tx.commit()
  console.log(`Updated ${toPatch.length} city document(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
