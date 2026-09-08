/**
 * Import the partner's listings from findall.al into Sanity.
 *
 * Source: the JSON files `scrapeFindallListings.ts` writes into
 * `../domlivo-workspace/findall/` — one per deal type (sale, rent), read from
 * the same public API the partner's own site uses.
 *
 * Where the listings go:
 *
 *  - Every listing is filed under Durrës. The partner works the coastal strip
 *    south of the city — Shkëmbi i Kavajës, Golem, Mali i Robit, Qerret, Spille —
 *    and the site already treats Golem and Qerret as districts of Durrës by
 *    market convention (scripts/data/zones.json, "Administrative attachment").
 *    Kavajë town and Spille follow the same precedent as districts, not as
 *    cities of their own; their district documents are created as unpublished
 *    shells, so the listings carry the zone while the zone page waits for copy.
 *  - The district is read from the title first, then the address: "Shkëmbi i
 *    Kavajës" is a place name, not a guess, and the address field says the same.
 *
 * What the listings carry:
 *
 *  - The descriptions are the partner's own text, in Albanian, repeated in
 *    every locale. Contact lines and hashtags are dropped; nothing else is
 *    rewritten. Titles lose their emoji.
 *  - Per-m² prices (flagged by the scraper) keep `priceUnit: 'per-sqm'`, so
 *    the card renders a rate and the price filter skips them.
 *  - Prices quoted in lek are converted at LEK_PER_EUR.
 *  - Availability becomes the lifecycle status: sold, reserved and withdrawn
 *    listings are imported but the site's published filter hides them.
 *  - Rentals get `status: 'rent'` (or 'short-term' for daily rates). Whether
 *    rentals are shown is the front end's decision (PUBLIC_DEAL_TYPES).
 *
 * Idempotent: every document has a deterministic id derived from the partner's
 * own listing id, so a second run updates rather than duplicates, and photos
 * already uploaded are matched by their Cloudinary id instead of fetched again.
 *
 * Run:
 * - npm run import:findall -- --dry
 * - npm run import:findall -- --execute
 * - npm run import:findall -- --execute --limit 5       (a slice, for a first look)
 * - npm run import:findall -- --execute --skip-photos   (documents only)
 * - npm run import:findall -- --execute --unpublished   (import but keep hidden)
 * - npm run import:findall -- --execute --source <file> (one file instead of the folder)
 */
import fs from 'node:fs'
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
const skipPhotos = args.includes('--skip-photos')
const keepUnpublished = args.includes('--unpublished')
const limitArg = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : 0
const sourceArg = args.includes('--source') ? args[args.indexOf('--source') + 1] : ''
if (!isDry && !isExecute) {
  console.error('Use --dry or --execute.')
  process.exit(1)
}

const SOURCE_DIR = path.resolve(process.cwd(), '../domlivo-workspace/findall')
const SOURCES = sourceArg
  ? [path.resolve(sourceArg)]
  : ['findall-sale.json', 'findall-rent.json'].map((f) => path.join(SOURCE_DIR, f)).filter(fs.existsSync)
const PARTNER = 'findall'
const CITY_SLUG = 'durres'
const PACE_MS = 250
const LEK_PER_EUR = 100

type Scraped = {
  id: number
  sourceUrl: string
  title: string
  publishedFor?: 'sale' | 'rent'
  rentPeriod?: string | null
  price: number
  currency: string
  priceFlag: '' | 'per-sqm' | 'implausible'
  category: string | null
  status: string | null
  availability: string | null
  documentation: string | null
  address: string
  city: string
  bedrooms: number
  baths: number
  floor: number
  area: number
  interiorArea: number
  createdAt?: string
  descriptionText: string
  mainPhoto: string | null
  photos: string[]
  agent: {name: string; email: string; phone: string; description: string}
}

type Localized = {en: string; sq: string; ru: string; uk: string; it: string; pl: string}

/**
 * Districts the site does not have yet, created as unpublished shells under
 * Durrës — same precedent as Golem and Qerret, which are Bashkia Kavajë on
 * paper and Durrës in every listing. Also declared in scripts/data/zones.json.
 */
const NEW_DISTRICTS: Record<string, Localized> = {
  kavaje: {en: 'Kavajë', sq: 'Kavaja', ru: 'Кавая', uk: 'Кавая', it: 'Kavajë', pl: 'Kavajë'},
  spille: {en: 'Spille', sq: 'Spille', ru: 'Спилле', uk: 'Спілле', it: 'Spille', pl: 'Spille'},
}

/**
 * Place name → district slug, matched against the title first and the address
 * second, on text with diacritics stripped. Order matters: "Shkëmbi i Kavajës"
 * must land on Shkëmbi before the Kavajë rule sees it, and "Plazhi i Golemit"
 * on Golem before the Plazh rule does.
 */
const DISTRICT_RULES: Array<[RegExp, string]> = [
  [/shkemb/, 'shkembi-durres'],
  [/mali?\s*(i\s*)?robit|malin e robit/, 'mali-i-robit'],
  [/qerret/, 'qerret'],
  [/golem|tilaj/, 'golem-durres'],
  [/spille|greth|bashtov|patk/, 'spille'],
  [/lalz|rodon/, 'gjiri-i-lalzit'],
  [/rroten e kuqe|tek posta|plazh[^\n]{0,12}durr/, 'plazh'],
  [/kryeluzaj|merhorve|shengjergj|plazh\w* (i|e) bardh|kavaj/, 'kavaje'],
]

/** findall categories to our propertyType slugs. Unmapped ones are reported. */
const TYPE_SLUGS: Record<string, string> = {
  apartment: 'apartment',
  land: 'land',
  villa: 'villa',
  commercial: 'commercial-space',
  hotel: 'commercial-space',
  garage: 'commercial-space',
}

/** What the title says, for listings with no category and to refine "apartment". */
const TYPE_FROM_TITLE: Array<[RegExp, string]> = [
  [/penthouse/, 'penthouse'],
  [/tok[ëe]\s+are\b|\btok[ëe]\b/, 'land'],
  [/\bvil[ëe]\b|\bvila\b/, 'villa'],
  [/hotel|restorant|kapanon|ndertes|godin|dyqan|ambient|njesi biznesi|biznes/, 'commercial-space'],
  [/garsonier/, 'studio'],
  [/apartament/, 'apartment'],
]

/** findall's build status to our construction stage. */
const STAGE: Record<string, string> = {
  'under construction': 'under-construction',
  new: 'completed',
  used: 'completed',
}

const DOCS: Record<string, string> = {
  'has-certificate': 'certificate',
  'in-process': 'in-process',
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function fold(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function slugify(input: string): string {
  return fold(input)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70)
}

/** One localized value repeated: the source has a single Albanian-market text. */
function sameEverywhere(value: string): Localized {
  return {en: value, ru: value, uk: value, sq: value, it: value, pl: value}
}

/** Emoji, leading "##" and stray symbols off the front and out of the middle. */
function cleanTitle(title: string): string {
  return title
    .replace(/[\p{Extended_Pictographic}️]/gu, '')
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** The partner's contact block and hashtags are theirs, not the listing's. */
function cleanDescription(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(/#[\p{L}\p{N}_]+/gu, '').replace(/\s+/g, ' ').trim())
    .filter((line) => {
      if (!line) return false
      if (/findall|find all properties/i.test(line)) return false
      if (/\+?355|^\+?\d[\d\s/+.-]{7,}$/.test(line)) return false
      if (/^(per|për) m[ëe] shum[ëe]|contact us|kontaktoni|na kontaktoni/i.test(line)) return false
      return true
    })
    .join('\n')
}

function districtFor(row: Scraped): string {
  for (const text of [fold(row.title), fold(row.address || '')]) {
    for (const [re, slug] of DISTRICT_RULES) if (re.test(text)) return slug
  }
  return ''
}

function typeFor(row: Scraped): string {
  const title = fold(row.title)
  const fromCategory = TYPE_SLUGS[(row.category || '').trim().toLowerCase()] || ''
  if (fromCategory === 'apartment') {
    if (/penthouse/.test(title)) return 'penthouse'
    if (/garsonier/.test(title) && !/\d\+\d|apartament/.test(title)) return 'studio'
    return 'apartment'
  }
  if (fromCategory) return fromCategory
  for (const [re, slug] of TYPE_FROM_TITLE) if (re.test(title)) return slug
  return ''
}

function statusFor(row: Scraped): 'sale' | 'rent' | 'short-term' {
  if (row.publishedFor !== 'rent') return 'sale'
  return row.rentPeriod === 'daily' ? 'short-term' : 'rent'
}

function lifecycleFor(row: Scraped): string {
  const title = fold(row.title)
  const gone = row.publishedFor === 'rent' ? 'rented' : 'sold'
  if (/shitur|rented|dhene me qera/.test(title)) return gone
  if (/rezervuar/.test(title)) return 'reserved'
  if (/padisponueshme/.test(title)) return 'archived'
  switch (row.availability) {
    case 'sold':
    case 'rented':
      return gone
    case 'pending':
      return 'reserved'
    case 'not-available':
      return 'archived'
    default:
      return 'active'
  }
}

/**
 * The partner's CMS leaves bedrooms at 0 on most flats while the title says
 * "2+1" — the Albanian notation for two bedrooms and a living room. The
 * title is the figure the agency actually typed, so it fills the gap.
 */
function bedroomsFor(row: Scraped): number {
  if (row.bedrooms > 0) return row.bedrooms
  const m = /(\d)\s*\+\s*1\b/.exec(row.title)
  return m ? Number(m[1]) : 0
}

function priceEur(row: Scraped): number {
  if (row.priceFlag === 'implausible') return 0
  if ((row.currency || 'EUR').toUpperCase() === 'LEK' || row.currency === 'ALL') {
    return Math.round(row.price / LEK_PER_EUR)
  }
  return row.price
}

async function uploadPhoto(url: string, publicId: string) {
  const res = await fetch(url.replace(/^http:/, 'https:'), {
    headers: {'User-Agent': 'DomLivoImportBot/1.0 (+https://domlivo.com)'},
  })
  if (!res.ok) throw new Error(`photo ${res.status} ${url}`)
  const bytes = Buffer.from(await res.arrayBuffer())
  return client.assets.upload('image', bytes, {
    filename: `${publicId}.jpg`,
    description: `Imported from findall.al (partner listing). Source: ${url}`,
  })
}

async function main() {
  if (!SOURCES.length) {
    console.error(`No scrape in ${SOURCE_DIR}\nRun npm run scrape:findall first, or pass --source <file>.`)
    process.exit(1)
  }
  let rows: Scraped[] = SOURCES.flatMap((file) => JSON.parse(fs.readFileSync(file, 'utf8')) as Scraped[])
  if (limitArg > 0) rows = rows.slice(0, limitArg)

  const [cityId, districts, existingTypes, existingAgent] = await Promise.all([
    client.fetch<string | null>(`*[_type=="city" && slug.current==$s][0]._id`, {s: CITY_SLUG}),
    client.fetch<Array<{slug: string; _id: string; city: string; isPublished: boolean | null}>>(
      `*[_type=="district"]{_id, "slug": slug.current, "city": city->slug.current, isPublished}`,
    ),
    client.fetch<Array<{slug: string; _id: string}>>(`*[_type=="propertyType"]{_id, "slug": slug.current}`),
    client.fetch<{_id: string} | null>(`*[_type=="agent" && slug.current==$s][0]{_id}`, {s: PARTNER}),
  ])
  if (!cityId) {
    console.error(`No city document with slug "${CITY_SLUG}".`)
    process.exit(1)
  }
  const districtBySlug = new Map(districts.map((d) => [d.slug, d]))
  const typeBySlug = new Map(existingTypes.map((t) => [t.slug, t._id]))

  // --- plan ---
  const problems: string[] = []
  const districtsNeeded = new Set<string>()
  const noDistrict: string[] = []
  const plan = rows.map((row) => {
    const districtSlug = districtFor(row)
    const typeSlug = typeFor(row)
    if (!districtSlug) {
      noDistrict.push(`#${row.id}: ${cleanTitle(row.title).slice(0, 48)} — "${row.address || 'no address'}"`)
    } else if (!districtBySlug.has(districtSlug)) {
      if (NEW_DISTRICTS[districtSlug]) districtsNeeded.add(districtSlug)
      else problems.push(`#${row.id}: district "${districtSlug}" does not exist`)
    } else if (districtBySlug.get(districtSlug)!.city !== CITY_SLUG) {
      problems.push(`#${row.id}: district "${districtSlug}" belongs to another city`)
    }
    if (!typeSlug) problems.push(`#${row.id}: no property type for category "${row.category}"`)
    else if (!typeBySlug.has(typeSlug)) problems.push(`#${row.id}: propertyType "${typeSlug}" does not exist`)
    return {row, districtSlug, typeSlug, status: statusFor(row), lifecycle: lifecycleFor(row)}
  })

  const count = (pred: (p: (typeof plan)[number]) => boolean) => plan.filter(pred).length
  const byDistrict: Record<string, number> = {}
  for (const p of plan) byDistrict[p.districtSlug || '(none)'] = (byDistrict[p.districtSlug || '(none)'] || 0) + 1
  const byLifecycle: Record<string, number> = {}
  for (const p of plan) byLifecycle[p.lifecycle] = (byLifecycle[p.lifecycle] || 0) + 1
  const photoCount = plan.reduce((n, p) => n + p.row.photos.length, 0)

  console.log(`${rows.length} listings from findall.al (${SOURCES.map((s) => path.basename(s)).join(', ')})\n`)
  console.log(`  city:        ${CITY_SLUG} (every listing)`)
  console.log(`  districts:   ${Object.entries(byDistrict).map(([k, v]) => `${k} ${v}`).join(', ')}`)
  if (districtsNeeded.size) console.log(`  to create:   ${[...districtsNeeded].join(', ')} (unpublished shells)`)
  console.log(`  deal:        sale ${count((p) => p.status === 'sale')}, rent ${count((p) => p.status === 'rent')}, short-term ${count((p) => p.status === 'short-term')}`)
  console.log(`  lifecycle:   ${Object.entries(byLifecycle).map(([k, v]) => `${k} ${v}`).join(', ')}`)
  console.log(`  agent:       ${existingAgent ? 'exists' : 'to create'} — ${rows[0]?.agent?.name ?? 'FIND ALL PROPERTIES'}`)
  console.log(`  photographs: ${photoCount}${skipPhotos ? ' (skipped)' : ''}`)
  console.log(`  per-m² rate rather than a total: ${count((p) => p.row.priceFlag === 'per-sqm')}`)
  console.log(`  quoted in lek, converted:        ${count((p) => /lek|all/i.test(p.row.currency))}`)
  console.log(`  price neither a total nor a rate: ${count((p) => p.row.priceFlag === 'implausible')} — imported with price 0`)
  console.log(`\n  every listing is ${keepUnpublished ? 'kept unpublished (--unpublished)' : 'published; the lifecycle status decides what the site shows'}`)
  if (noDistrict.length) {
    console.log('\nNO DISTRICT (city only):')
    for (const line of noDistrict) console.log(`  ${line}`)
  }
  if (problems.length) {
    console.log('\nPROBLEMS:')
    for (const p of problems.slice(0, 12)) console.log(`  ${p}`)
    if (problems.length > 12) console.log(`  … and ${problems.length - 12} more`)
  }

  if (isDry) {
    console.log('\nDry run — nothing written.')
    return
  }
  if (problems.length) {
    console.error('\nRefusing to write while listings cannot be placed.')
    process.exit(1)
  }

  // --- agent ---
  const agentId = existingAgent?._id ?? `agent-${PARTNER}`
  const first = rows[0]?.agent
  await client.createOrReplace({
    _id: agentId,
    _type: 'agent',
    name: first?.name || 'FIND ALL PROPERTIES',
    slug: {_type: 'slug', current: PARTNER},
    email: first?.email || 'info.findall@gmail.com',
    phone: first?.phone || '',
    description: sameEverywhere(
      'Partner agency on the Durrës–Kavajë coast. Listings are supplied by the agency; contact them directly.',
    ),
    isPublished: true,
  } as never)
  console.log(`\nagent ${agentId}`)

  // --- district shells ---
  if (districtsNeeded.size) {
    const maxOrder = await client.fetch<number | null>(
      `math::max(*[_type=="district" && city->slug.current==$city].order)`,
      {city: CITY_SLUG},
    )
    let order = maxOrder ?? 0
    for (const slug of districtsNeeded) {
      const id = `district-${slug}`
      order += 1
      await client.createOrReplace({
        _id: id,
        _type: 'district',
        title: NEW_DISTRICTS[slug],
        slug: {_type: 'slug', current: slug},
        city: {_type: 'reference', _ref: cityId},
        order,
        isPublished: false,
      } as never)
      districtBySlug.set(slug, {_id: id, slug, city: CITY_SLUG, isPublished: false})
      console.log(`district ${id} (unpublished shell — needs a description before it can go live)`)
    }
  }

  // --- listings ---
  let done = 0
  let uploaded = 0
  for (const {row, districtSlug, typeSlug, status, lifecycle} of plan) {
    const docId = `property-${PARTNER}-${row.id}`
    const existing = await client.fetch<{gallery?: Array<Record<string, unknown> & {publicId?: string}>} | null>(
      `*[_id==$id][0]{ "gallery": gallery[]{ ..., "publicId": asset->originalFilename } }`,
      {id: docId},
    )
    const kept = (existing?.gallery ?? []).map(({publicId, ...item}) => ({item, publicId: (publicId || '').replace(/\.jpg$/, '')}))
    const already = new Set(kept.map((k) => k.publicId).filter(Boolean))

    const fresh: Array<Record<string, unknown>> = []
    if (!skipPhotos) {
      const urls = [row.mainPhoto, ...row.photos].filter(Boolean) as string[]
      const seen = new Set<string>()
      for (const url of urls) {
        const publicId = (url.split('/').pop() || '').replace(/\.[a-z]+$/i, '')
        if (!publicId || seen.has(publicId)) continue
        seen.add(publicId)
        if (already.has(publicId)) continue
        try {
          const asset = await uploadPhoto(url, publicId)
          fresh.push({
            _key: publicId,
            _type: 'image',
            asset: {_type: 'reference', _ref: asset._id},
            alt: cleanTitle(row.title).slice(0, 120),
          })
          uploaded += 1
          await sleep(PACE_MS)
        } catch (err) {
          console.log(`   photo failed for #${row.id}: ${err instanceof Error ? err.message : err}`)
        }
      }
    }

    const title = cleanTitle(row.title) || row.title
    const description = cleanDescription(row.descriptionText) || title
    const stage = STAGE[(row.status || '').toLowerCase()]
    const district = districtSlug ? districtBySlug.get(districtSlug)?._id : undefined
    const doc: Record<string, unknown> = {
      _id: docId,
      _type: 'property',
      title: sameEverywhere(title),
      slug: {_type: 'slug', current: `${slugify(title)}-${row.id}`},
      shortDescription: sameEverywhere(description.split('\n')[0]?.slice(0, 200) || title),
      description: sameEverywhere(description),
      agent: {_type: 'reference', _ref: agentId},
      city: {_type: 'reference', _ref: cityId},
      ...(district ? {district: {_type: 'reference', _ref: district}} : {}),
      type: {_type: 'reference', _ref: typeBySlug.get(typeSlug)},
      status,
      isPublished: !keepUnpublished,
      lifecycleStatus: keepUnpublished ? 'draft' : lifecycle,
      // Required by the schema; zero reads as "unknown" and stays out of price sorting.
      price: priceEur(row),
      priceUnit: row.priceFlag === 'per-sqm' ? 'per-sqm' : 'total',
      ...(row.area > 0 ? {area: row.area} : {}),
      ...(bedroomsFor(row) > 0 ? {bedrooms: bedroomsFor(row)} : {}),
      ...(row.baths > 0 ? {bathrooms: row.baths} : {}),
      ...(stage ? {constructionStage: stage} : {}),
      ...(DOCS[row.documentation || ''] ? {documentation: DOCS[row.documentation || '']} : {}),
      ...(row.address ? {address: sameEverywhere(row.address)} : {}),
      ...(row.createdAt ? {createdAt: new Date(row.createdAt).toISOString()} : {}),
      propertyCode: `FINDALL-${row.id}`,
      locationPrecision: 'approximate',
    }

    if (fresh.length) {
      // Photos uploaded on an earlier run stay in front; new ones follow.
      await client.createOrReplace({...doc, gallery: [...kept.map((k) => k.item), ...fresh]} as never)
    } else {
      // Nothing new to upload: patch the facts and leave the gallery alone.
      const {_id, _type, ...rest} = doc
      await client
        .transaction()
        .createIfNotExists({_id: _id as string, _type: _type as string} as never)
        .patch(_id as string, (p) => p.set(rest).unset(district ? [] : ['district']))
        .commit()
    }

    done += 1
    if (done % 10 === 0 || done === plan.length) console.log(`  ${done}/${plan.length} listings, ${uploaded} photos uploaded`)
  }

  // --- city shells from the first import, now that nothing points at them ---
  for (const slug of ['kavaje', 'rrogozhine']) {
    const id = `city-${slug}`
    const refs = await client.fetch<number>(`count(*[references($id)])`, {id})
    const exists = await client.fetch<boolean>(`defined(*[_id==$id][0]._id)`, {id})
    if (!exists) continue
    if (refs > 0) {
      console.log(`city ${id} kept — still referenced by ${refs} document(s)`)
      continue
    }
    await client.delete(id)
    console.log(`city ${id} deleted — it was an empty shell; ${slug} is a district of Durrës now`)
  }

  console.log(`\nImported ${done} listings, ${uploaded} new photographs.`)
  if (districtsNeeded.size) {
    console.log(`${[...districtsNeeded].join(' and ')} exist as unpublished district shells; give them a description before publishing the zone pages.`)
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
