/**
 * Create the 12 Tirana district documents the knowledge base prices but the CMS
 * lacks — see docs/engineering/PLAN-zone-metrics-2026-08-15.md Task 2.
 *
 * Identity fields only (title × 5 locales, slug, city, order) and unpublished.
 * Hero images, descriptions and SEO copy are ТЗ-11's job; a shell exists so
 * `zoneMetrics` has a zone to attach to and so the Tirana price table is 16
 * rows rather than 5.
 *
 * Source of the list: knowledge-base/03-districts/tirana-districts.md §1.
 * Paskuqan and Kamëz are formally their own municipalities inside Tirana
 * county; the KB prices them in the Tirana table and the market treats them as
 * Tirana's cheap edge, so they are modelled as districts here.
 *
 * Run:
 * - npm run create:tirana-shells -- --dry
 * - npm run create:tirana-shells -- --execute
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const apiVersion = (process.env.SANITY_API_VERSION || '2024-01-01').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const isDry = process.argv.includes('--dry')
const isExecute = process.argv.includes('--execute')

if (!token || !projectId) {
  console.error('Error: SANITY_PROJECT_ID and SANITY_API_TOKEN required. Add them to .env')
  process.exit(1)
}
if (!isDry && !isExecute) {
  console.error('Use --dry to preview or --execute to write.')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion, useCdn: false, token})

const CITY_ID = 'city-tirana'

type Shell = {
  slug: string
  title: {en: string; uk: string; ru: string; sq: string; it: string}
}

/** Albanian toponyms pass through unchanged; descriptive names get translated. */
const SHELLS: Shell[] = [
  {
    slug: 'liqeni-artificial',
    title: {
      en: 'Artificial Lake',
      uk: 'Штучне озеро',
      ru: 'Искусственное озеро',
      sq: 'Liqeni Artificial',
      it: 'Lago Artificiale',
    },
  },
  {
    slug: 'myslym-shyri',
    title: {en: 'Myslym Shyri', uk: 'Мюслім Шюрі', ru: 'Мюслим Шюри', sq: 'Myslym Shyri', it: 'Myslym Shyri'},
  },
  {
    slug: 'bulevardi-i-ri',
    title: {
      en: 'New Boulevard',
      uk: 'Новий бульвар',
      ru: 'Новый бульвар',
      sq: 'Bulevardi i Ri',
      it: 'Nuovo Boulevard',
    },
  },
  {
    slug: 'don-bosko',
    title: {en: 'Don Bosko', uk: 'Дон Боско', ru: 'Дон Боско', sq: 'Don Bosko', it: 'Don Bosko'},
  },
  {
    slug: 'ali-demi',
    title: {en: 'Ali Demi', uk: 'Алі Демі', ru: 'Али Деми', sq: 'Ali Demi', it: 'Ali Demi'},
  },
  {
    slug: '21-dhjetori',
    title: {en: '21 Dhjetori', uk: '21 Дьєтори', ru: '21 Дьетори', sq: '21 Dhjetori', it: '21 Dhjetori'},
  },
  {
    slug: 'astir-unaza-e-re',
    title: {
      en: 'Astir / Unaza e Re',
      uk: 'Астір / Нове кільце',
      ru: 'Астир / Новое кольцо',
      sq: 'Astir / Unaza e Re',
      it: 'Astir / Unaza e Re',
    },
  },
  {
    slug: 'shkoze',
    title: {en: 'Shkozë', uk: 'Шкоза', ru: 'Шкоза', sq: 'Shkozë', it: 'Shkozë'},
  },
  {
    slug: 'kashar',
    title: {en: 'Kashar', uk: 'Кашар', ru: 'Кашар', sq: 'Kashar', it: 'Kashar'},
  },
  {
    slug: 'kombinat',
    title: {en: 'Kombinat', uk: 'Комбінат', ru: 'Комбинат', sq: 'Kombinat', it: 'Kombinat'},
  },
  {
    slug: 'paskuqan',
    title: {en: 'Paskuqan', uk: 'Паскукан', ru: 'Паскукан', sq: 'Paskuqan', it: 'Paskuqan'},
  },
  {
    slug: 'kamez',
    title: {en: 'Kamëz', uk: 'Камза', ru: 'Камза', sq: 'Kamëz', it: 'Kamëz'},
  },
]

async function main() {
  const city = await client.fetch<{_id: string} | null>(`*[_id == $id][0]{_id}`, {id: CITY_ID})
  if (!city) {
    console.error(`Error: ${CITY_ID} not found — refusing to create orphan districts.`)
    process.exit(1)
  }

  const existing = await client.fetch<{_id: string; slug: string}[]>(
    `*[_type == "district" && city._ref == $cityId]{_id, "slug": slug.current}`,
    {cityId: CITY_ID},
  )
  const existingSlugs = new Set(existing.map((d) => d.slug))

  const maxOrder = await client.fetch<number | null>(
    `math::max(*[_type == "district" && city._ref == $cityId].order)`,
    {cityId: CITY_ID},
  )
  let order = (maxOrder ?? 0) + 1

  const toCreate = SHELLS.filter((s) => !existingSlugs.has(s.slug))
  const skipped = SHELLS.filter((s) => existingSlugs.has(s.slug))

  for (const s of skipped) console.log(`skip    ${s.slug} (already exists)`)

  if (toCreate.length === 0) {
    console.log('\nNothing to create.')
    return
  }

  const docs = toCreate.map((s) => ({
    _id: `district-${s.slug}`,
    _type: 'district',
    title: s.title,
    slug: {_type: 'slug', current: s.slug},
    city: {_type: 'reference', _ref: CITY_ID},
    order: order++,
    isPublished: false,
  }))

  for (const d of docs) console.log(`create  ${d.slug.current}  order=${d.order}  (unpublished)`)

  if (isDry) {
    console.log(`\nDry run. ${docs.length} would be created, ${skipped.length} skipped.`)
    return
  }

  // `create` rather than `createOrReplace`: a doc that already carries editorial
  // copy must never be flattened back to a shell by a re-run.
  const tx = docs.reduce((t, d) => t.create(d), client.transaction())
  await tx.commit()
  console.log(`\nCreated ${docs.length}, skipped ${skipped.length}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
