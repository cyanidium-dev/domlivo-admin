/**
 * Domlivo CMS — Catalog SEO Pages Seed Script
 *
 * Seeds catalogSeoPage documents for:
 * - /properties (root)
 * - /properties/[city] (all cities)
 * - /properties/[city]/[district] (valid districts with city)
 *
 * Run: npm run seed:catalog-seo
 * Requires: SANITY_API_TOKEN in .env
 *
 * Uses createOrReplace with deterministic _id for safe re-runs (no duplicates).
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const ENV = {
  projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  token: process.env.SANITY_API_TOKEN?.trim() || null,
}

function validateEnv(): void {
  if (!ENV.projectId || !ENV.dataset) {
    console.error('Error: SANITY_PROJECT_ID and SANITY_DATASET required.')
    process.exit(1)
  }
  if (!ENV.token) {
    console.error('Error: SANITY_API_TOKEN required. Add it to .env')
    process.exit(1)
  }
}

const client = createClient({
  projectId: ENV.projectId,
  dataset: ENV.dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: ENV.token!,
})

/** Localized content: uk, ru, sq, en, it (matches localizedString/localizedText) */
type Li = {uk: string; ru: string; sq: string; en: string; it: string}

function Li(uk: string, ru: string, sq: string, en: string, it: string): Li {
  return {uk, ru, sq, en, it}
}

type LocalizedDoc = {en?: string; uk?: string; ru?: string; sq?: string; it?: string}

/** Build Li from Sanity localized object, fallback to en */
function liFromDoc(doc: LocalizedDoc | null | undefined, fallback = ''): Li {
  const e = doc?.en ?? fallback
  return Li(
    doc?.uk ?? e,
    doc?.ru ?? e,
    doc?.sq ?? e,
    e,
    doc?.it ?? e,
  )
}

// ——— Root catalog page content ———
const ROOT = {
  title: Li(
    'Нерухомість в Албанії',
    'Недвижимость в Албании',
    'Pasuri në Shqipëri',
    'Real Estate in Albania',
    'Immobiliare in Albania',
  ),
  intro: Li(
    'Огляньте квартири, будинки та вілли для купівлі та оренди. Фільтруйте за містом, ціною та типом.',
    'Просмотрите квартиры, дома и виллы для покупки и аренды. Фильтруйте по городу, цене и типу.',
    'Shikoni apartamente, shtëpi dhe vila për blerje dhe qira. Filtroni sipas qytetit, çmimit dhe llojit.',
    'Browse apartments, houses and villas for sale and rent. Filter by city, price and type.',
    'Sfoglia appartamenti, case e ville in vendita e affitto. Filtra per città, prezzo e tipo.',
  ),
  bottomText: Li(
    "Domlivo допомагає знайти нерухомість в Албанії. Каталог включає об'єкти в Тирані, Дурресі, Вльорі, Саранді та інших містах. Актуальні оголошення, контакти власників та агентів.",
    'Domlivo помогает найти недвижимость в Албании. Каталог включает объекты в Тиране, Дурресе, Влёре, Саранде и других городах. Актуальные объявления, контакты владельцев и агентов.',
    'Domlivo ndihmon të gjeni pasuri në Shqipëri. Katalogu përfshin objekte në Tiranë, Durrës, Vlorë, Sarandë dhe qytete të tjera. Njoftime aktuale, kontakte të pronarëve dhe agjentëve.',
    'Domlivo helps you find property in Albania. The catalog includes listings in Tirana, Durres, Vlore, Sarande and other cities. Up-to-date offers and direct contact with owners and agents.',
    'Domlivo ti aiuta a trovare immobili in Albania. Il catalogo include annunci a Tirana, Durazzo, Valona, Saranda e altre città. Offerte aggiornate e contatti diretti con proprietari e agenti.',
  ),
  metaTitle: Li(
    'Нерухомість в Албанії | Domlivo',
    'Недвижимость в Албании | Domlivo',
    'Pasuri në Shqipëri | Domlivo',
    'Real Estate in Albania | Domlivo',
    'Immobiliare in Albania | Domlivo',
  ),
  metaDescription: Li(
    'Квартири, будинки та вілли в Тирані, Дурресі та по всій Албанії. Купівля, оренда. Актуальні оголошення.',
    'Квартиры, дома и виллы в Тиране, Дурресе и по всей Албании. Покупка, аренда. Актуальные объявления.',
    'Apartamente, shtëpi dhe vila në Tiranë, Durrës dhe në të gjithë Shqipërinë. Blerje, qira.',
    'Apartments, houses and villas in Tirana, Durres and across Albania. Sale and rent. Up-to-date listings.',
    "Appartamenti, case e ville a Tirana, Durazzo e in tutta l'Albania. Vendita e affitto.",
  ),
}

// ——— City catalog page content (parametrized) ———
function cityContent(cityNameLi: Li) {
  return {
    title: Li(
      `Нерухомість в ${cityNameLi.uk}`,
      `Недвижимость в ${cityNameLi.ru}`,
      `Pasuri në ${cityNameLi.sq}`,
      `Real Estate in ${cityNameLi.en}`,
      `Immobiliare a ${cityNameLi.it}`,
    ),
    intro: Li(
      `Огляньте об'єкти в ${cityNameLi.uk}: квартири, будинки, вілли для купівлі та оренди.`,
      `Просмотрите объекты в ${cityNameLi.ru}: квартиры, дома, виллы для покупки и аренды.`,
      `Shikoni pronat në ${cityNameLi.sq}: apartamente, shtëpi, vila për blerje dhe qira.`,
      `Browse properties in ${cityNameLi.en}: apartments, houses, villas for sale and rent.`,
      `Sfoglia immobili a ${cityNameLi.it}: appartamenti, case, ville in vendita e affitto.`,
    ),
    bottomText: Li(
      `Каталог нерухомості в ${cityNameLi.uk}. Domlivo збирає актуальні оголошення від власників та агентів. Фільтри за ціною, кількістю кімнат та типом об'єкта.`,
      `Каталог недвижимости в ${cityNameLi.ru}. Domlivo собирает актуальные объявления от владельцев и агентов. Фильтры по цене, количеству комнат и типу объекта.`,
      `Katalogu i pronave në ${cityNameLi.sq}. Domlivo mbledh njoftime aktuale nga pronarët dhe agjentët.`,
      `Property catalog in ${cityNameLi.en}. Domlivo aggregates up-to-date listings from owners and agents. Filter by price, rooms and type.`,
      `Catalogo immobiliare a ${cityNameLi.it}. Domlivo raccoglie annunci aggiornati da proprietari e agenti.`,
    ),
    metaTitle: Li(
      `${cityNameLi.uk} — Нерухомість | Domlivo`,
      `${cityNameLi.ru} — Недвижимость | Domlivo`,
      `${cityNameLi.sq} — Pasuri | Domlivo`,
      `${cityNameLi.en} — Real Estate | Domlivo`,
      `${cityNameLi.it} — Immobiliare | Domlivo`,
    ),
    metaDescription: Li(
      `Квартири та будинки в ${cityNameLi.uk}. Купівля та оренда. Перевірені оголошення.`,
      `Квартиры и дома в ${cityNameLi.ru}. Покупка и аренда. Проверенные объявления.`,
      `Apartamente dhe shtëpi në ${cityNameLi.sq}. Blerje dhe qira.`,
      `Apartments and houses in ${cityNameLi.en}. Sale and rent. Verified listings.`,
      `Appartamenti e case a ${cityNameLi.it}. Vendita e affitto.`,
    ),
  }
}

// ——— District catalog page content (parametrized) ———
function districtContent(districtNameLi: Li, cityNameLi: Li) {
  return {
    title: Li(
      `Нерухомість в ${districtNameLi.uk}, ${cityNameLi.uk}`,
      `Недвижимость в ${districtNameLi.ru}, ${cityNameLi.ru}`,
      `Pasuri në ${districtNameLi.sq}, ${cityNameLi.sq}`,
      `Real Estate in ${districtNameLi.en}, ${cityNameLi.en}`,
      `Immobiliare a ${districtNameLi.it}, ${cityNameLi.it}`,
    ),
    intro: Li(
      `Огляньте об'єкти в районі ${districtNameLi.uk} (${cityNameLi.uk}): квартири, будинки, вілли для купівлі та оренди.`,
      `Просмотрите объекты в районе ${districtNameLi.ru} (${cityNameLi.ru}): квартиры, дома, виллы для покупки и аренды.`,
      `Shikoni pronat në ${districtNameLi.sq}, ${cityNameLi.sq}: apartamente, shtëpi, vila për blerje dhe qira.`,
      `Browse properties in ${districtNameLi.en}, ${cityNameLi.en}: apartments, houses, villas for sale and rent.`,
      `Sfoglia immobili a ${districtNameLi.it}, ${cityNameLi.it}: appartamenti, case, ville in vendita e affitto.`,
    ),
    bottomText: Li(
      `Каталог нерухомості в районі ${districtNameLi.uk}, м. ${cityNameLi.uk}. Domlivo збирає актуальні оголошення. Фільтри за ціною та типом.`,
      `Каталог недвижимости в районе ${districtNameLi.ru}, г. ${cityNameLi.ru}. Domlivo собирает актуальные объявления. Фильтры по цене и типу.`,
      `Katalogu i pronave në ${districtNameLi.sq}, ${cityNameLi.sq}. Domlivo mbledh njoftime aktuale.`,
      `Property catalog in ${districtNameLi.en}, ${cityNameLi.en}. Domlivo aggregates up-to-date listings. Filter by price and type.`,
      `Catalogo immobiliare a ${districtNameLi.it}, ${cityNameLi.it}. Domlivo raccoglie annunci aggiornati.`,
    ),
    metaTitle: Li(
      `${districtNameLi.uk}, ${cityNameLi.uk} — Нерухомість | Domlivo`,
      `${districtNameLi.ru}, ${cityNameLi.ru} — Недвижимость | Domlivo`,
      `${districtNameLi.sq}, ${cityNameLi.sq} — Pasuri | Domlivo`,
      `${districtNameLi.en}, ${cityNameLi.en} — Real Estate | Domlivo`,
      `${districtNameLi.it}, ${cityNameLi.it} — Immobiliare | Domlivo`,
    ),
    metaDescription: Li(
      `Квартири та будинки в районі ${districtNameLi.uk}, ${cityNameLi.uk}. Купівля та оренда.`,
      `Квартиры и дома в районе ${districtNameLi.ru}, ${cityNameLi.ru}. Покупка и аренда.`,
      `Apartamente dhe shtëpi në ${districtNameLi.sq}, ${cityNameLi.sq}. Blerje dhe qira.`,
      `Apartments and houses in ${districtNameLi.en}, ${cityNameLi.en}. Sale and rent.`,
      `Appartamenti e case a ${districtNameLi.it}, ${cityNameLi.it}. Vendita e affitto.`,
    ),
  }
}

type CityRecord = {_id: string; slug: string | null; title: LocalizedDoc}
type DistrictRecord = {
  _id: string
  slug: string | null
  cityRef: string | null
  citySlug: string | null
  cityTitle: LocalizedDoc | null
  title: LocalizedDoc
}

async function main() {
  validateEnv()

  const cities = await client.fetch<CityRecord[]>(
    `*[_type == "city"]{ _id, "slug": slug.current, title } | order(title.en asc)`,
  )

  const districts = await client.fetch<DistrictRecord[]>(
    `*[_type == "district"]{
      _id,
      "slug": slug.current,
      "cityRef": city._ref,
      "citySlug": city->slug.current,
      "cityTitle": city->title,
      title
    } | order(title.en asc)`,
  )

  const validCities = cities.filter((c) => c.slug && c.slug.trim().length > 0)
  const skippedCities = cities.filter((c) => !c.slug || !c.slug.trim())
  const validDistricts = districts.filter(
    (d) =>
      d.slug &&
      d.slug.trim().length > 0 &&
      d.cityRef &&
      d.citySlug &&
      d.citySlug.trim().length > 0,
  )
  const skippedDistricts = districts.filter(
    (d) =>
      !d.slug ||
      !d.slug.trim() ||
      !d.cityRef ||
      !d.citySlug ||
      !d.citySlug.trim(),
  )

  const created: string[] = []
  const skipped: {type: string; id: string; reason: string}[] = []

  skippedCities.forEach((c) =>
    skipped.push({type: 'city', id: c._id, reason: 'Missing or empty slug'}),
  )
  skippedDistricts.forEach((d) =>
    skipped.push({
      type: 'district',
      id: d._id,
      reason: d.cityRef && d.citySlug ? 'Missing slug' : 'Missing city ref or city slug',
    }),
  )

  // 1. Root catalog page
  const rootId = 'catalogSeoPage-propertiesRoot'
  await client.createOrReplace({
    _id: rootId,
    _type: 'catalogSeoPage',
    pageScope: 'propertiesRoot',
    active: true,
    title: ROOT.title,
    intro: ROOT.intro,
    bottomText: ROOT.bottomText,
    seo: {
      _type: 'localizedSeo',
      metaTitle: ROOT.metaTitle,
      metaDescription: ROOT.metaDescription,
      ogTitle: ROOT.metaTitle,
      ogDescription: ROOT.metaDescription,
      noIndex: false,
    },
  })
  created.push(rootId)
  console.log('Created/updated:', rootId)

  // 2. City catalog pages (all valid cities)
  for (const city of validCities) {
    const cityNameLi = liFromDoc(city.title, city.slug ?? '')
    if (!cityNameLi.en) {
      skipped.push({type: 'city', id: city._id, reason: 'No usable title'})
      continue
    }
    const content = cityContent(cityNameLi)
    const docId = `catalogSeoPage-city-${city._id}`
    await client.createOrReplace({
      _id: docId,
      _type: 'catalogSeoPage',
      pageScope: 'city',
      city: {_type: 'reference', _ref: city._id},
      active: true,
      title: content.title,
      intro: content.intro,
      bottomText: content.bottomText,
      seo: {
        _type: 'localizedSeo',
        metaTitle: content.metaTitle,
        metaDescription: content.metaDescription,
        ogTitle: content.metaTitle,
        ogDescription: content.metaDescription,
        noIndex: false,
      },
    })
    created.push(docId)
    console.log('Created/updated:', docId)
  }

  // 3. District catalog pages (valid districts with city)
  for (const district of validDistricts) {
    const districtNameLi = liFromDoc(district.title, district.slug ?? '')
    const cityNameLi = liFromDoc(district.cityTitle, district.citySlug ?? '')
    if (!districtNameLi.en || !cityNameLi.en) {
      skipped.push({
        type: 'district',
        id: district._id,
        reason: 'No usable district or city title',
      })
      continue
    }
    const content = districtContent(districtNameLi, cityNameLi)
    const docId = `catalogSeoPage-district-${district._id}`
    await client.createOrReplace({
      _id: docId,
      _type: 'catalogSeoPage',
      pageScope: 'district',
      city: {_type: 'reference', _ref: district.cityRef!},
      district: {_type: 'reference', _ref: district._id},
      active: true,
      title: content.title,
      intro: content.intro,
      bottomText: content.bottomText,
      seo: {
        _type: 'localizedSeo',
        metaTitle: content.metaTitle,
        metaDescription: content.metaDescription,
        ogTitle: content.metaTitle,
        ogDescription: content.metaDescription,
        noIndex: false,
      },
    })
    created.push(docId)
    console.log('Created/updated:', docId)
  }

  // Verification
  console.log('\n--- Verification ---')
  const rootDoc = await client.fetch(
    `*[_type == "catalogSeoPage" && pageScope == "propertiesRoot" && active == true][0]{ _id, pageScope, "titleEn": title.en }`,
  )
  const cityDocs = await client.fetch(
    `*[_type == "catalogSeoPage" && pageScope == "city" && active == true]{ _id, "citySlug": city->slug.current, "titleEn": title.en }`,
  )
  const districtDocs = await client.fetch(
    `*[_type == "catalogSeoPage" && pageScope == "district" && active == true]{
      _id,
      "citySlug": city->slug.current,
      "districtSlug": district->slug.current,
      "titleEn": title.en
    }`,
  )

  console.log('Root:', rootDoc ? JSON.stringify(rootDoc, null, 2) : 'NOT FOUND')
  console.log('City pages:', cityDocs?.length ?? 0)
  cityDocs?.forEach(
    (d: {_id: string; citySlug: string; titleEn: string}) =>
      console.log(`  - ${d._id} (city: ${d.citySlug})`),
  )
  console.log('District pages:', districtDocs?.length ?? 0)
  districtDocs?.forEach(
    (d: {_id: string; citySlug: string; districtSlug: string; titleEn: string}) =>
      console.log(`  - ${d._id} (${d.citySlug}/${d.districtSlug})`),
  )

  // Route-matching verification
  const verifyRoot =
    rootDoc &&
    (await client.fetch(
      `*[_type == "catalogSeoPage" && pageScope == "propertiesRoot" && active == true][0]._id`,
    ))
  const sampleCity = cityDocs?.[0] as {citySlug: string} | undefined
  const verifyCity =
    sampleCity &&
    (await client.fetch(
      `*[_type == "catalogSeoPage" && pageScope == "city" && city->slug.current == $slug && active == true][0]._id`,
      {slug: sampleCity.citySlug},
    ))
  const sampleDistrict = districtDocs?.[0] as {
    citySlug: string
    districtSlug: string
  } | undefined
  const verifyDistrict =
    sampleDistrict &&
    (await client.fetch(
      `*[_type == "catalogSeoPage" && pageScope == "district" && district->slug.current == $districtSlug && district->city->slug.current == $citySlug && active == true][0]._id`,
      {
        districtSlug: sampleDistrict.districtSlug,
        citySlug: sampleDistrict.citySlug,
      },
    ))

  // Fetch full docs for report
  const rootFull = await client.fetch(
    `*[_type == "catalogSeoPage" && pageScope == "propertiesRoot"][0]{ title, intro, bottomText, seo }`,
  )
  const cityFull = await client.fetch(
    `*[_type == "catalogSeoPage" && pageScope == "city"]{ "citySlug": city->slug.current, title, intro, bottomText, seo } | order(citySlug asc)`,
  )
  const districtFull = await client.fetch(
    `*[_type == "catalogSeoPage" && pageScope == "district"]{
      "citySlug": city->slug.current,
      "districtSlug": district->slug.current,
      title, intro, bottomText, seo
    } | order(citySlug asc, districtSlug asc)`,
  )

  return {
    created,
    skipped,
    rootDoc,
    cityDocs,
    districtDocs,
    rootFull,
    cityFull,
    districtFull,
    verifyRoot,
    verifyCity,
    verifyDistrict,
  }
}

function printReport(r: Awaited<ReturnType<typeof main>>) {
  if (!r) return
  console.log('\n=== CONTENT SUMMARY ===')
  if (r.rootFull) {
    console.log('\n[propertiesRoot]')
    console.log('  title:     ', JSON.stringify(r.rootFull.title))
    console.log('  intro:     ', JSON.stringify(r.rootFull.intro))
    console.log('  bottomText:', JSON.stringify(r.rootFull.bottomText))
  }
  r.cityFull?.forEach(
    (c: {citySlug: string; title: Li; intro: Li; bottomText: Li}) => {
      console.log(`\n[city:${c.citySlug}]`)
      console.log('  title:     ', JSON.stringify(c.title))
      console.log('  intro:     ', JSON.stringify(c.intro))
      console.log('  bottomText:', JSON.stringify(c.bottomText))
    },
  )
  r.districtFull?.forEach(
    (d: {
      citySlug: string
      districtSlug: string
      title: Li
      intro: Li
      bottomText: Li
    }) => {
      console.log(`\n[district:${d.citySlug}/${d.districtSlug}]`)
      console.log('  title:     ', JSON.stringify(d.title))
      console.log('  intro:     ', JSON.stringify(d.intro))
      console.log('  bottomText:', JSON.stringify(d.bottomText))
    },
  )
  console.log('\n=== SEO SUMMARY ===')
  if (r.rootFull?.seo) {
    console.log('\n[propertiesRoot] metaTitle:', JSON.stringify(r.rootFull.seo.metaTitle))
    console.log('  metaDescription:', JSON.stringify(r.rootFull.seo.metaDescription))
  }
  r.cityFull?.forEach(
    (c: {citySlug: string; seo: {metaTitle: Li; metaDescription: Li}}) => {
      console.log(`\n[city:${c.citySlug}] metaTitle:`, JSON.stringify(c.seo?.metaTitle))
      console.log('  metaDescription:', JSON.stringify(c.seo?.metaDescription))
    },
  )
  r.districtFull?.forEach(
    (d: {
      citySlug: string
      districtSlug: string
      seo: {metaTitle: Li; metaDescription: Li}
    }) => {
      console.log(
        `\n[district:${d.citySlug}/${d.districtSlug}] metaTitle:`,
        JSON.stringify(d.seo?.metaTitle),
      )
      console.log('  metaDescription:', JSON.stringify(d.seo?.metaDescription))
    },
  )
  if (r.skipped?.length) {
    console.log('\n=== SKIPPED ===')
    r.skipped.forEach((s) => console.log(`  ${s.type} ${s.id}: ${s.reason}`))
  }
}

main()
  .then((r) => {
    console.log('\nDone. Seeded:', r.created.length, 'documents.')
    printReport(r)
    console.log('\n=== ROUTE MATCHING VERIFICATION ===')
    console.log('  propertiesRoot:', r.verifyRoot ? 'OK' : 'FAIL')
    console.log('  city slug:', r.verifyCity ? 'OK' : r.cityDocs?.length ? 'N/A' : 'FAIL')
    console.log('  district+city slug:', r.verifyDistrict ? 'OK' : r.districtDocs?.length ? 'N/A' : 'FAIL')
  })
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
