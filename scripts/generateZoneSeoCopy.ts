/**
 * Search and social copy for zone pages, composed from their own `zoneMetrics`.
 *
 * Most districts still carry seed SEO — `metaTitle: "Blloku"`,
 * `metaDescription: "Most vibrant district"` — so a shared link reads as a
 * category label rather than a page worth opening. The figures to fix that
 * already exist per zone; this writes them into `seo.metaTitle` /
 * `seo.metaDescription` (and the og twins) in all five locales.
 *
 * A meta description is a summary, not prose: a consistent shape carrying real,
 * per-zone numbers is the right output here. Zones with no metrics fall back to
 * the first sentence of their editorial description, and anything already
 * hand-written is left alone unless --force.
 *
 * The district landing's SEO wins over the district document's at render time
 * (see the districts route), so both are updated together.
 *
 * Run:
 * - npm run generate:zone-seo -- --dry
 * - npm run generate:zone-seo -- --execute [--force]
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

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

import {
  resolveZoneSeo,
  SEO_LOCALES,
  type SeoLocalized,
  type ZoneMetricsForSeo,
} from './lib/zoneSeoCopy'

type Doc = {
  _id: string
  _type: 'district' | 'city'
  slug: string
  title?: SeoLocalized
  cityTitle?: SeoLocalized
  description?: SeoLocalized
  seo?: {metaTitle?: SeoLocalized; metaDescription?: SeoLocalized}
  metrics?: ZoneMetricsForSeo | null
  landing?: {
    _id: string
    title?: SeoLocalized
    metaTitle?: SeoLocalized
    metaDescription?: SeoLocalized
    heroTitle?: SeoLocalized
  } | null
}

async function main() {
  const year = String(new Date().getFullYear())

  const docs: Doc[] = await client.fetch(
    `*[_type in ["district", "city"] && isPublished != false]{
      _id, _type,
      "slug": slug.current,
      title,
      "cityTitle": select(_type == "district" => city->title, title),
      description,
      seo,
      "metrics": *[_type == "zoneMetrics" && zone._ref == ^._id] | order(periodDate desc)[0]{
        priceNewMin, priceNewMax, priceNewMedian,
        priceResaleMin, priceResaleMax, priceResaleMedian,
        priceAllMin, priceAllMax, priceAllMedian,
        rentLtr1brMin, rentLtr1brMax, referencePrice, periodLabel
      },
      "landing": *[_type == "landingPage" && linkedDistrict._ref == ^._id][0]{
        _id,
        title,
        "metaTitle": seo.metaTitle,
        "metaDescription": seo.metaDescription,
        "heroTitle": pageSections[_key == "hero"][0].title
      }
    } | order(_type asc, slug asc)`,
  )

  const mutations: Record<string, unknown>[] = []
  const skipped: string[] = []
  const noSource: string[] = []

  for (const doc of docs) {
    // Per field, not per document: a zone can have a hand-written description
    // and still be titled "Blloku".
    const seo = resolveZoneSeo(
      {
        kind: doc._type,
        slug: doc.slug,
        title: doc.title,
        cityTitle: doc.cityTitle,
        description: doc.description,
        metrics: doc.metrics,
      },
      year,
      doc.seo,
      {force: isForce},
    )
    if (!seo) { noSource.push(doc.slug); continue }
    const {metaTitle, metaDescription} = seo
    // Decide per target: the document and its landing drift apart independently,
    // and the landing carries a third copy of the title in its hero H1.
    // Compare every locale. An `.en`-only check hides drift where the English
    // happens to match and ru/uk/sq do not — which is exactly what it did.
    const differs = (a?: SeoLocalized, b?: SeoLocalized) =>
      SEO_LOCALES.some((l) => (a?.[l] ?? '') !== (b?.[l] ?? ''))

    const docNeedsWrite =
      differs(metaTitle, doc.seo?.metaTitle) || differs(metaDescription, doc.seo?.metaDescription)
    const landing = doc.landing
    const landingNeedsWrite = Boolean(
      landing &&
        (differs(metaTitle, landing.metaTitle) ||
          differs(metaDescription, landing.metaDescription) ||
          differs(metaTitle, landing.title) ||
          differs(metaTitle, landing.heroTitle)),
    )
    if (!docNeedsWrite && !landingNeedsWrite) { skipped.push(doc.slug); continue }

    const set: Record<string, unknown> = {
      'seo.metaTitle': metaTitle,
      'seo.ogTitle': metaTitle,
      'seo.metaDescription': metaDescription,
      'seo.ogDescription': metaDescription,
    }
    if (docNeedsWrite) mutations.push({patch: {id: doc._id, set}})
    // The landing's SEO wins at render time, so it has to move too.
    if (landing && landingNeedsWrite) {
      mutations.push({
        patch: {
          id: landing._id,
          set: {
            ...set,
            title: metaTitle,
            // The hero H1 is the same string; leaving it behind would show one
            // title on the page and another in the tab.
            'pageSections[_key=="hero"].title': metaTitle,
          },
        },
      })
    }

    console.log(`${doc._type === 'city' ? 'CITY' : '    '} ${doc.slug}`)
    console.log(`       ${metaTitle.en}`)
    console.log(`       ${metaDescription.en}`)
  }

  if (skipped.length) console.log(`\nleft alone (already written): ${skipped.join(', ')}`)
  if (noSource.length) console.log(`no metrics and no description: ${noSource.join(', ')}`)

  if (isDry) {
    console.log(`\nDry run. ${mutations.length} patch(es) across ${docs.length} zone documents.`)
    return
  }
  if (mutations.length === 0) { console.log('\nNothing to write.'); return }

  const res = await fetch(`https://${projectId}.api.sanity.io/v2024-01-01/data/mutate/${dataset}`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({mutations}),
  })
  if (!res.ok) throw new Error(`mutate failed: ${res.status} ${await res.text()}`)

  console.log(`\nWrote ${mutations.length} patches.`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
