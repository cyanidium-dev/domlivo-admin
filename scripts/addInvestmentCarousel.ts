/**
 * Put an "investment property" carousel on the homepage.
 *
 * The `investment` flag has been on the property schema all along and 15
 * listings carry it, but nothing on the site ever read it — the flag was an
 * editorial judgement with no surface. This is that surface: an auto-mode
 * carousel filtered to `investment == true`, which the section handler now
 * understands alongside city, district, type and deal.
 *
 * Why not a new-builds carousel in the same pass: no property is marked
 * off-plan or under-construction yet, so that block would render empty. The
 * schema and the handler are ready for it; add it when there is inventory.
 *
 * Idempotent: keyed on `_key`, so a second run updates the copy in place
 * rather than stacking a second carousel on the page.
 *
 * Run:
 * - npm run add:investment-carousel -- --dry
 * - npm run add:investment-carousel -- --execute
 */
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
if (!isDry && !isExecute) {
  console.error('Use --dry or --execute.')
  process.exit(1)
}

const LANDING_ID = 'landing-home'
const SECTION_KEY = 'investment-picks'
/** Sits after the city carousel: browse listings, browse cities, then the picks. */
const INSERT_AFTER_TYPE = 'locationCarouselSection'

const SECTION = {
  _key: SECTION_KEY,
  _type: 'propertyCarouselSection',
  enabled: true,
  mode: 'auto',
  limit: 8,
  title: {
    en: 'Property in Albania worth investing in',
    ru: 'Недвижимость в Албании под инвестицию',
    uk: 'Нерухомість в Албанії під інвестицію',
    sq: 'Prona në Shqipëri që ia vlen të investohet',
    it: 'Immobili in Albania su cui vale la pena investire',
    pl: 'Nieruchomości w Albanii warte inwestycji',
  },
  subtitle: {
    en: 'Listings our agents rate for rental demand and resale, chosen one by one rather than by a formula.',
    ru: 'Объекты, которые наши агенты отобрали по спросу на аренду и перспективе перепродажи — вручную, а не по формуле.',
    uk: 'Об’єкти, які наші агенти відібрали за попитом на оренду та перспективою перепродажу — вручну, а не за формулою.',
    sq: 'Prona që agjentët tanë i vlerësojnë për kërkesën me qira dhe rishitjen, të zgjedhura një nga një.',
    it: 'Immobili che i nostri agenti valutano per la domanda di affitto e la rivendita, scelti uno per uno.',
    pl: 'Oferty ocenione przez naszych agentów pod kątem popytu na wynajem i odsprzedaży, wybierane pojedynczo.',
  },
  cta: {
    href: '/catalog?investment=1',
    label: {
      en: 'See all investment listings',
      ru: 'Все объекты под инвестицию',
      uk: 'Усі об’єкти під інвестицію',
      sq: 'Shiko të gjitha pronat për investim',
      it: 'Vedi tutti gli immobili da investimento',
      pl: 'Zobacz wszystkie oferty inwestycyjne',
    },
  },
  filters: {
    investment: true,
  },
  autoMode: {
    limit: 8,
    sort: 'newest',
  },
}

type Section = {_key?: string; _type?: string}

async function main() {
  const doc = await client.fetch<{_id: string; pageSections?: Section[]} | null>(
    `*[_id == $id][0]{_id, pageSections}`,
    {id: LANDING_ID},
  )
  if (!doc) {
    console.error(`No document ${LANDING_ID}.`)
    process.exit(1)
  }

  const sections = doc.pageSections ?? []
  const existingIndex = sections.findIndex((s) => s._key === SECTION_KEY)
  const anchorIndex = sections.findIndex((s) => s._type === INSERT_AFTER_TYPE)
  const insertAt = anchorIndex >= 0 ? anchorIndex + 1 : sections.length

  // Show what the block will actually pull, so a dry run says "8 listings",
  // not "trust me".
  const matching = await client.fetch<number>(
    `count(*[_type == "property" && isPublished == true && investment == true && status in ["sale"]])`,
  )

  console.log(`${LANDING_ID}: ${sections.length} sections`)
  sections.forEach((s, i) => console.log(`  ${String(i).padStart(2)} ${s._type}`))
  console.log('')
  if (existingIndex >= 0) {
    console.log(`"${SECTION_KEY}" already at index ${existingIndex} — its copy and filters will be refreshed in place.`)
  } else {
    console.log(`"${SECTION_KEY}" will be inserted at index ${insertAt}, after ${INSERT_AFTER_TYPE}.`)
  }
  console.log(`It will show up to ${SECTION.limit} of the ${matching} published sale listings flagged as an investment.`)

  if (matching === 0) {
    console.error('\nRefusing: nothing carries the investment flag, so the block would render empty.')
    process.exit(1)
  }

  if (isDry) {
    console.log('\nDry run — nothing written.')
    return
  }

  if (existingIndex >= 0) {
    await client
      .patch(LANDING_ID)
      .set({[`pageSections[_key=="${SECTION_KEY}"]`]: SECTION})
      .commit()
    console.log(`\nRefreshed "${SECTION_KEY}" in place.`)
    return
  }

  await client
    .patch(LANDING_ID)
    .insert('after', `pageSections[${insertAt - 1}]`, [SECTION])
    .commit()
  console.log(`\nInserted "${SECTION_KEY}" at index ${insertAt}.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
