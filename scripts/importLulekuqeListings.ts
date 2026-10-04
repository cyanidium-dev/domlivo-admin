/**
 * Import the Lulekuqe Consulting listings (Sarandë) into Sanity.
 *
 * Source: `../domlivo-workspace/lulekuqe/listings.json`, a curated file, not
 * a scrape. The agency publishes free-text posts in a Facebook group
 * (facebook.com/groups/368942569186784, admin Inna Kataeva); the posts were
 * read by hand on 2026-10-04, each one turned into structured fields, and the
 * seven languages written as original copy in the site's voice. This script
 * only checks that file and writes it: nothing here parses prose.
 *
 * The agent is `agent-lulekuqe`, shown on listings by name only
 * (`noPublicLink: true`): the owner's contact in Albania routes each lead to
 * the agency, so nothing on the page leads away from the lead form. No
 * Facebook URL, no phone.
 *
 * Checks before anything is written:
 *  - every listing has all seven locales for title, shortDescription,
 *    description, and every number of two or more digits in a translation
 *    also appears in the English text (the rule the article pipeline uses);
 *  - the district exists under Sarandë (or is omitted), the type exists,
 *    the price is a plausible total in euros (0 = on request);
 *  - photos are URLs; the gallery keeps at most 30.
 *
 * Idempotent like the GetAl import: ids are `property-lulekuqe-<id>`, a second
 * run patches, photos already uploaded are matched by their source filename.
 *
 * Run:
 * - npx tsx scripts/importLulekuqeListings.ts --dry
 * - npx tsx scripts/importLulekuqeListings.ts --execute
 * - npx tsx scripts/importLulekuqeListings.ts --execute --publish
 * - npx tsx scripts/importLulekuqeListings.ts --execute --skip-photos
 * - npx tsx scripts/importLulekuqeListings.ts --execute --only <id>[,<id>]
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const args = process.argv.slice(2)
const execute = args.includes('--execute')
const publishNow = args.includes('--publish')
const skipPhotos = args.includes('--skip-photos')
const onlyArg = args[args.indexOf('--only') + 1]
const only = args.includes('--only') && onlyArg ? new Set(onlyArg.split(',')) : null
const sourceArg = args[args.indexOf('--source') + 1]
const SOURCE = args.includes('--source') && sourceArg ? path.resolve(sourceArg) : path.resolve(process.cwd(), '../domlivo-workspace/lulekuqe/listings.json')

const PARTNER = 'lulekuqe'
const CITY = 'sarande'
const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl', 'de'] as const
const PACE_MS = 250
const IMPLAUSIBLE_UNDER = 5000

const AGENT = {
  id: 'agent-lulekuqe',
  slug: 'lulekuqe',
  name: 'Lulekuqe Consulting',
  email: 'lulekuqe@domlivo.com',
  description: {
    en: 'Consulting agency in Sarandë, on the Ionian coast. The listings are supplied by the agency; Domlivo handles enquiries and passes each one on.',
    uk: 'Консалтингова агенція в Саранді, на Іонічному узбережжі. Оголошення надає агенція; запити приймає Domlivo і передає кожен далі.',
    ru: 'Консалтинговое агентство в Саранде, на Ионическом побережье. Объявления предоставляет агентство; запросы принимает Domlivo и передаёт каждый дальше.',
    sq: 'Agjenci konsulence në Sarandë, në bregun e Jonit. Njoftimet i ofron agjencia; kërkesat i merr Domlivo dhe i përcjell një nga një.',
    it: 'Agenzia di consulenza a Saranda, sulla costa ionica. Gli annunci sono forniti dall’agenzia; le richieste le riceve Domlivo e le inoltra una per una.',
    pl: 'Agencja doradcza w Sarandzie, na wybrzeżu Jońskim. Oferty dostarcza agencja; zapytania przyjmuje Domlivo i przekazuje każde dalej.',
    de: 'Beratungsagentur in Saranda an der Ionischen Küste. Die Inserate stellt die Agentur; Anfragen nimmt Domlivo entgegen und leitet jede weiter.',
  },
}

type Localized = Record<(typeof LOCALES)[number], string>

type Listing = {
  id: string
  sourceUrl: string
  author: string
  postedAt: string
  type: 'apartment' | 'studio' | 'house' | 'villa' | 'land' | 'commercial-space' | 'penthouse' | 'office'
  price: number
  priceUnit?: 'total' | 'per-sqm'
  area?: number
  plotArea?: number
  bedrooms?: number
  rooms?: number
  bathrooms?: number
  yearBuilt?: number
  constructionStage?: 'completed' | 'under-construction' | 'off-plan'
  handoverYear?: number
  documentation?: 'certificate' | 'in-process'
  seaDistanceMeters?: number
  district?: string
  address?: Localized
  coordinates?: {lat: number; lng: number} | null
  locationPrecision: 'exact' | 'approximate'
  propertyCode?: string
  photos: string[]
  title: Localized
  shortDescription: Localized
  description: Localized
}

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID || 'g4aqp6ex',
  dataset: process.env.SANITY_STUDIO_DATASET || process.env.SANITY_DATASET || 'production',
  apiVersion: '2025-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
})

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Numbers of two or more digits, with thousands separators removed; "1+1" and years count too. */
function numbersIn(text: string): Set<string> {
  const out = new Set<string>()
  for (const m of text.replace(/(\d)[   .,](?=\d{3}\b)/g, '$1').matchAll(/\d{2,}/g)) out.add(m[0])
  return out
}

function checkListing(l: Listing, districts: Map<string, {city: string}>, types: Set<string>): string[] {
  const p: string[] = []
  if (!/^[a-z0-9-]+$/.test(l.id)) p.push('id must be a slug-safe string')
  for (const field of ['title', 'shortDescription', 'description'] as const) {
    for (const loc of LOCALES) {
      const v = l[field]?.[loc]
      if (!v || !v.trim()) p.push(`${field}.${loc} missing`)
    }
  }
  const en = numbersIn(`${l.title.en} ${l.description.en}`)
  for (const loc of LOCALES) {
    if (loc === 'en') continue
    for (const n of numbersIn(`${l.title[loc]} ${l.description[loc]}`)) {
      if (!en.has(n)) p.push(`number ${n} in ${loc} is not in the English text`)
    }
  }
  if (l.title.en.length > 110) p.push(`title.en ${l.title.en.length} chars, keep under 110`)
  if (l.shortDescription.en.length > 300) p.push('shortDescription.en over 300 chars')
  if (!types.has(l.type)) p.push(`type ${l.type} does not exist`)
  if (l.district) {
    const d = districts.get(l.district)
    if (!d) p.push(`district ${l.district} does not exist`)
    else if (d.city !== CITY) p.push(`district ${l.district} is in ${d.city}`)
  }
  if (l.price < 0) p.push('negative price')
  if (l.price > 0 && (l.priceUnit ?? 'total') === 'total' && l.price < IMPLAUSIBLE_UNDER) p.push(`price €${l.price} looks like a unit error`)
  if (l.type !== 'land' && !(l.area && l.area > 0)) p.push('area missing')
  if (!Array.isArray(l.photos) || l.photos.length === 0) p.push('no photos')
  for (const u of l.photos) if (!/^https?:\/\//.test(u)) p.push(`photo is not a URL: ${u.slice(0, 40)}`)
  if (l.coordinates && (Math.abs(l.coordinates.lat - 39.87) > 0.4 || Math.abs(l.coordinates.lng - 20.0) > 0.4)) p.push('coordinates are not near Sarandë')
  if (!['exact', 'approximate'].includes(l.locationPrecision)) p.push('locationPrecision must be exact|approximate')
  return p
}

async function uploadPhoto(url: string, publicId: string) {
  const res = await fetch(url, {headers: {'User-Agent': 'Mozilla/5.0 (DomLivoImportBot; +https://domlivo.com)'}})
  if (!res.ok) throw new Error(`photo ${res.status}`)
  const bytes = Buffer.from(await res.arrayBuffer())
  const type = res.headers.get('content-type') || ''
  const ext = /png/.test(type) ? 'png' : /webp/.test(type) ? 'webp' : 'jpg'
  return client.assets.upload('image', bytes, {
    filename: `${publicId}.${ext}`,
    description: `Imported from Lulekuqe Consulting (partner listing, Facebook group post). Source: ${url.split('?')[0]}`,
  })
}

/** Facebook CDN filenames carry two ids; the second is stable per photo. */
function photoPublicId(url: string, index: number, listingId: string): string {
  const base = (url.split('?')[0].split('/').pop() || '').replace(/\.[a-z]+$/i, '')
  const stable = base.match(/^\d+_(\d+)_/)?.[1]
  return stable ? `${PARTNER}-${stable}` : `${PARTNER}-${listingId}-${index + 1}`
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`No curated file at ${SOURCE}`)
    process.exit(1)
  }
  let listings: Listing[] = JSON.parse(fs.readFileSync(SOURCE, 'utf8'))
  if (only) listings = listings.filter((l) => only.has(l.id))

  const [cityId, districts, types] = await Promise.all([
    client.fetch<string | null>(`*[_type=="city" && slug.current==$s][0]._id`, {s: CITY}),
    client.fetch<Array<{slug: string; _id: string; city: string}>>(`*[_type=="district"]{_id, "slug": slug.current, "city": city->slug.current}`),
    client.fetch<Array<{slug: string; _id: string}>>(`*[_type=="propertyType"]{_id, "slug": slug.current}`),
  ])
  if (!cityId) throw new Error(`city ${CITY} not found`)
  const districtBySlug = new Map(districts.map((d) => [d.slug, d]))
  const typeBySlug = new Map(types.map((t) => [t.slug, t._id]))

  const problems: string[] = []
  const ids = new Set<string>()
  for (const l of listings) {
    if (ids.has(l.id)) problems.push(`#${l.id}: duplicate id`)
    ids.add(l.id)
    for (const p of checkListing(l, districtBySlug, new Set(typeBySlug.keys()))) problems.push(`#${l.id}: ${p}`)
  }
  const photoCount = listings.reduce((n, l) => n + Math.min(l.photos.length, 30), 0)
  const tally = (pick: (l: Listing) => string) =>
    Object.entries(listings.reduce<Record<string, number>>((a, l) => ({...a, [pick(l)]: (a[pick(l)] ?? 0) + 1}), {}))
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ${v}`)
      .join(', ')
  console.log(`${listings.length} listings in ${path.basename(SOURCE)}`)
  console.log(`  types:      ${tally((l) => l.type)}`)
  console.log(`  districts:  ${tally((l) => l.district || '(city only)')}`)
  console.log(`  prices:     ${listings.filter((l) => l.price > 0).length} with a figure, ${listings.filter((l) => !l.price).length} on request`)
  console.log(`  coords:     ${listings.filter((l) => l.coordinates).length} with coordinates`)
  console.log(`  photos:     ${photoCount}${skipPhotos ? ' (skipped)' : ''}`)
  console.log(`  published:  ${publishNow ? 'yes (--publish)' : 'no'}`)
  if (problems.length) {
    console.log(`\nPROBLEMS (${problems.length}):`)
    for (const p of problems) console.log(`  ${p}`)
  }
  if (!execute) {
    console.log('\nDry run — nothing written.')
    return
  }
  if (problems.length) {
    console.error('\nRefusing to write with problems.')
    process.exit(1)
  }

  // --- agent ---
  await client
    .transaction()
    .createIfNotExists({_id: AGENT.id, _type: 'agent'} as never)
    .patch(AGENT.id, (p) =>
      p
        .set({
          name: AGENT.name,
          slug: {_type: 'slug', current: AGENT.slug},
          email: AGENT.email,
          isPublished: true,
          noPublicLink: true,
        })
        .setIfMissing({description: AGENT.description})
        .unset(['facebookUrl', 'instagramUrl', 'youtubeUrl', 'telegramUrl', 'phone']),
    )
    .commit()
  console.log(`\nagent ${AGENT.id} (name only, no link)`)

  // --- listings ---
  let uploaded = 0
  let done = 0
  for (const l of listings) {
    const docId = `property-${PARTNER}-${l.id}`
    const existing = await client.fetch<{gallery?: Array<Record<string, unknown> & {publicId?: string}>} | null>(
      `*[_id==$id][0]{ "gallery": gallery[]{ ..., "publicId": asset->originalFilename } }`,
      {id: docId},
    )
    const kept = (existing?.gallery ?? []).map(({publicId, ...item}) => ({item, publicId: (publicId || '').replace(/\.[a-z]+$/i, '')}))
    const already = new Set(kept.map((k) => k.publicId).filter(Boolean))

    const fresh: Array<Record<string, unknown>> = []
    if (!skipPhotos) {
      const seen = new Set<string>()
      for (const [i, url] of l.photos.slice(0, 30).entries()) {
        const publicId = photoPublicId(url, i, l.id)
        if (seen.has(publicId) || already.has(publicId)) continue
        seen.add(publicId)
        try {
          const asset = await uploadPhoto(url, publicId)
          fresh.push({_key: slugify(publicId).slice(0, 40), _type: 'image', asset: {_type: 'reference', _ref: asset._id}, alt: l.title.en.slice(0, 120)})
          uploaded += 1
          await sleep(PACE_MS)
        } catch (err) {
          console.log(`   photo ${i + 1} failed for #${l.id}: ${err instanceof Error ? err.message : err}`)
        }
      }
    }

    const district = l.district ? districtBySlug.get(l.district)!._id : undefined
    const doc: Record<string, unknown> = {
      slug: {_type: 'slug', current: `${slugify(l.title.en)}-${l.id}`.slice(0, 90)},
      agent: {_type: 'reference', _ref: AGENT.id},
      city: {_type: 'reference', _ref: cityId},
      ...(district ? {district: {_type: 'reference', _ref: district}} : {}),
      type: {_type: 'reference', _ref: typeBySlug.get(l.type)},
      status: 'sale',
      isPublished: publishNow,
      lifecycleStatus: publishNow ? 'active' : 'draft',
      price: l.price,
      priceUnit: l.priceUnit ?? 'total',
      ...(l.area ? {area: l.area} : {}),
      ...(l.plotArea ? {plotArea: l.plotArea} : {}),
      ...(l.bedrooms ? {bedrooms: l.bedrooms} : {}),
      ...(l.rooms ? {rooms: l.rooms} : {}),
      ...(l.bathrooms ? {bathrooms: l.bathrooms} : {}),
      ...(l.yearBuilt ? {yearBuilt: l.yearBuilt} : {}),
      ...(l.constructionStage ? {constructionStage: l.constructionStage} : {}),
      ...(l.handoverYear ? {handoverYear: l.handoverYear} : {}),
      ...(l.documentation ? {documentation: l.documentation} : {}),
      ...(typeof l.seaDistanceMeters === 'number' ? {seaDistanceMeters: l.seaDistanceMeters} : {}),
      ...(l.coordinates ? {coordinatesLat: l.coordinates.lat, coordinatesLng: l.coordinates.lng} : {}),
      locationPrecision: l.locationPrecision,
      ...(l.address ? {address: l.address} : {}),
      propertyCode: l.propertyCode || `LLK-${l.id}`,
      createdAt: new Date(l.postedAt).toISOString(),
      title: l.title,
      shortDescription: l.shortDescription,
      description: l.description,
    }

    await client
      .transaction()
      .createIfNotExists({_id: docId, _type: 'property'} as never)
      .patch(docId, (p) => {
        let patch = p.set(doc).unset(district ? [] : ['district'])
        if (fresh.length) patch = patch.set({gallery: [...kept.map((k) => k.item), ...fresh]})
        return patch
      })
      .commit()
    done += 1
    console.log(`  ${done}/${listings.length} ${docId} (${fresh.length} new photos)`)
  }
  console.log(`\nImported ${done} listings, ${uploaded} photographs uploaded.`)
  console.log('Next: npx tsx scripts/generatePropertyUrlSlugs.ts --execute, then IndexNow per slug.')
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
