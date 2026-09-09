/**
 * Put city names into the right case in Russian and Ukrainian page headings.
 *
 * The city landings were generated from templates like "Недвижимость в {n}" /
 * "Об'єкти в {n}" with `{n}` filled from `city.title`, which is nominative. In
 * Albanian that was already handled — `city.sqDeclension` exists and
 * `fetchCityNameForms` uses it — but Russian and Ukrainian got the raw
 * nominative after a preposition that governs the prepositional/locative:
 *
 *   "Недвижимость в Влёра"   → "Недвижимость во Влёре"
 *   "Об'єкти в Вльора"       → "Об'єкти у Вльорі"
 *
 * These are H1s and H2s on four city landings — Himarë, Sarandë, Shëngjin and
 * Vlorë — so they are the first thing a Russian- or Ukrainian-speaking reader
 * sees, and they read as machine output. Durrës, Tirana and Shkodër were
 * written by hand and are already correct.
 *
 * Also fixes one Russian field holding Ukrainian text: the Durrës listings
 * carousel had "Найпопулярніші об'єкти для купівлі в Дурресі" under `title.ru`.
 *
 * Exact strings, not a regex over the corpus: twenty headings are worth
 * reviewing one by one, and a rule clever enough to decline Albanian toponyms
 * in two Slavic languages is a rule that will eventually be wrong somewhere
 * nobody is looking.
 *
 * Run:
 * - npm run fix:city-heading-cases -- --dry
 * - npm run fix:city-heading-cases -- --execute
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

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

type Fix = {locale: 'ru' | 'uk'; from: string; to: string}

/** Keyed by city slug; every `from` must match the stored heading exactly. */
const FIXES: Record<string, Fix[]> = {
  himare: [
    {locale: 'ru', from: 'Недвижимость в Химара: цены 2026', to: 'Недвижимость в Химаре: цены 2026'},
    {locale: 'ru', from: 'Объекты в Химара', to: 'Объекты в Химаре'},
    {locale: 'ru', from: 'Ищете что-то в Химара?', to: 'Ищете что-то в Химаре?'},
    {locale: 'uk', from: 'Нерухомість у Хімара: ціни 2026', to: 'Нерухомість у Хімарі: ціни 2026'},
    {locale: 'uk', from: 'Об’єкти в Хімара', to: 'Об’єкти в Хімарі'},
    {locale: 'uk', from: 'Шукаєте щось у Хімара?', to: 'Шукаєте щось у Хімарі?'},
  ],
  sarande: [
    {locale: 'ru', from: 'Недвижимость в Саранда: цены 2026', to: 'Недвижимость в Саранде: цены 2026'},
    {locale: 'ru', from: 'Цены в Саранда по районам', to: 'Цены в Саранде по районам'},
    {locale: 'ru', from: 'Объекты в Саранда', to: 'Объекты в Саранде'},
    {locale: 'ru', from: 'Ищете что-то в Саранда?', to: 'Ищете что-то в Саранде?'},
    {locale: 'uk', from: 'Нерухомість у Саранда: ціни 2026', to: 'Нерухомість у Саранді: ціни 2026'},
    {locale: 'uk', from: 'Ціни в Саранда по районах', to: 'Ціни в Саранді по районах'},
    {locale: 'uk', from: 'Об’єкти в Саранда', to: 'Об’єкти в Саранді'},
    {locale: 'uk', from: 'Шукаєте щось у Саранда?', to: 'Шукаєте щось у Саранді?'},
  ],
  shengjin: [
    {locale: 'ru', from: 'Недвижимость в Шенджин: цены 2026', to: 'Недвижимость в Шенджине: цены 2026'},
    {locale: 'ru', from: 'Объекты в Шенджин', to: 'Объекты в Шенджине'},
    {locale: 'ru', from: 'Ищете что-то в Шенджин?', to: 'Ищете что-то в Шенджине?'},
    {locale: 'uk', from: 'Нерухомість у Шенджін: ціни 2026', to: 'Нерухомість у Шенджіні: ціни 2026'},
    {locale: 'uk', from: 'Об’єкти в Шенджін', to: 'Об’єкти в Шенджіні'},
    {locale: 'uk', from: 'Шукаєте щось у Шенджін?', to: 'Шукаєте щось у Шенджіні?'},
  ],
  vlore: [
    // "в" before the consonant cluster "Вл" is unpronounceable in Russian;
    // the preposition becomes "во", as in "во Владивостоке".
    {locale: 'ru', from: 'Недвижимость в Влёра: цены 2026', to: 'Недвижимость во Влёре: цены 2026'},
    {locale: 'ru', from: 'Цены в Влёра по районам', to: 'Цены во Влёре по районам'},
    {locale: 'ru', from: 'Объекты в Влёра', to: 'Объекты во Влёре'},
    {locale: 'ru', from: 'Ищете что-то в Влёра?', to: 'Ищете что-то во Влёре?'},
    {locale: 'uk', from: 'Нерухомість у Вльора: ціни 2026', to: 'Нерухомість у Вльорі: ціни 2026'},
    {locale: 'uk', from: 'Ціни в Вльора по районах', to: 'Ціни у Вльорі по районах'},
    {locale: 'uk', from: 'Об’єкти в Вльора', to: 'Об’єкти у Вльорі'},
    {locale: 'uk', from: 'Шукаєте щось у Вльора?', to: 'Шукаєте щось у Вльорі?'},
  ],
  durres: [
    // A Ukrainian sentence sitting in the Russian field.
    {
      locale: 'ru',
      from: 'Найпопулярніші об’єкти для купівлі в Дурресі',
      to: 'Самые популярные объекты для покупки в Дурресе',
    },
  ],
}

/**
 * The same nominative leaked into the document's own title and its SEO fields,
 * which is what search results and shared links actually show. `title`,
 * `seo.metaTitle` and `seo.ogTitle` all carry the identical string.
 */
const DOC_FIELDS = ['title', 'seo.metaTitle', 'seo.ogTitle'] as const

const DOC_FIXES: Record<string, Fix[]> = {
  himare: [
    {locale: 'ru', from: 'Недвижимость в Химара: цены 2026', to: 'Недвижимость в Химаре: цены 2026'},
    {locale: 'uk', from: 'Нерухомість у Хімара: ціни 2026', to: 'Нерухомість у Хімарі: ціни 2026'},
  ],
  sarande: [
    {locale: 'ru', from: 'Недвижимость в Саранда: цены 2026', to: 'Недвижимость в Саранде: цены 2026'},
    {locale: 'uk', from: 'Нерухомість у Саранда: ціни 2026', to: 'Нерухомість у Саранді: ціни 2026'},
  ],
  shengjin: [
    {locale: 'ru', from: 'Недвижимость в Шенджин: цены 2026', to: 'Недвижимость в Шенджине: цены 2026'},
    {locale: 'uk', from: 'Нерухомість у Шенджін: ціни 2026', to: 'Нерухомість у Шенджіні: ціни 2026'},
  ],
  vlore: [
    {locale: 'ru', from: 'Недвижимость в Влёра: цены 2026', to: 'Недвижимость во Влёре: цены 2026'},
    {locale: 'uk', from: 'Нерухомість у Вльора: ціни 2026', to: 'Нерухомість у Вльорі: ціни 2026'},
  ],
}

type Row = {
  _id: string
  citySlug: string
  sections: Array<{_key?: string; _type?: string; title?: Record<string, string>}>
  title?: Record<string, string>
  seo?: {metaTitle?: Record<string, string>; ogTitle?: Record<string, string>}
}

/** Current value at one of DOC_FIELDS for a locale. */
function docFieldValue(row: Row, field: (typeof DOC_FIELDS)[number], locale: string): string | undefined {
  if (field === 'title') return row.title?.[locale]
  if (field === 'seo.metaTitle') return row.seo?.metaTitle?.[locale]
  return row.seo?.ogTitle?.[locale]
}

async function run() {
  console.log(`\n=== fix:city-heading-cases (${isDry ? 'DRY RUN' : 'EXECUTE'}) ===\n`)

  const citySlugs = Array.from(new Set([...Object.keys(FIXES), ...Object.keys(DOC_FIXES)]))
  const rows = await client.fetch<Row[]>(
    `*[_type == "landingPage" && pageType == "city" && linkedCity->slug.current in $citySlugs]{
      _id,
      "citySlug": linkedCity->slug.current,
      "sections": pageSections[]{_key, _type, title},
      title,
      seo { metaTitle, ogTitle }
    }`,
    {citySlugs},
  )

  let applied = 0
  let unmatched = 0

  for (const row of rows) {
    const fixes = FIXES[row.citySlug] ?? []
    const set: Record<string, string> = {}

    for (const fix of fixes) {
      const section = row.sections.find((s) => s.title?.[fix.locale] === fix.from)
      if (!section?._key) {
        // Already applied on an earlier run is the common case and not a
        // problem; anything else means the heading was edited since this map
        // was written, which is worth saying rather than guessing at.
        if (row.sections.some((s) => s.title?.[fix.locale] === fix.to)) continue
        console.warn(`  ! ${row.citySlug} [${fix.locale}]: no heading reads "${fix.from}" — skipped`)
        unmatched += 1
        continue
      }
      set[`pageSections[_key=="${section._key}"].title.${fix.locale}`] = fix.to
      console.log(`  ${row.citySlug} [${fix.locale}] ${section._type}`)
      console.log(`      "${fix.from}"`)
      console.log(`   →  "${fix.to}"`)
      applied += 1
    }

    for (const fix of DOC_FIXES[row.citySlug] ?? []) {
      for (const field of DOC_FIELDS) {
        const current = docFieldValue(row, field, fix.locale)
        if (current !== fix.from) {
          if (current !== undefined && current !== fix.to) {
            console.warn(
              `  ! ${row.citySlug} [${fix.locale}] ${field}: reads "${current}" — skipped`,
            )
            unmatched += 1
          }
          continue
        }
        set[`${field}.${fix.locale}`] = fix.to
        console.log(`  ${row.citySlug} [${fix.locale}] ${field}`)
        console.log(`      "${fix.from}"`)
        console.log(`   →  "${fix.to}"`)
        applied += 1
      }
    }

    if (isExecute && Object.keys(set).length > 0) {
      await client.patch(row._id).set(set).commit()
    }
  }

  console.log(`\nDone: ${applied} heading(s)${unmatched ? `, ${unmatched} unmatched` : ''}.`)
  if (isDry) console.log('Nothing was written — rerun with --execute.\n')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
