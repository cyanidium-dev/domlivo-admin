/**
 * Import the partner's listings from get.al (Get Real Estate) into Sanity.
 *
 * Source: the JSON `scrapeGetAlListings.ts` writes into
 * `../domlivo-workspace/getal/getal-listings.json`.
 *
 * What is imported, and what is not:
 *
 *  - Sales only. Rentals are scraped (they cost nothing extra to read) but
 *    skipped here at the user's instruction, and the front end hides rentals
 *    anyway (PUBLIC_DEAL_TYPES = ['sale']).
 *  - Anything outside Albania is skipped. The agency's CMS stamps every record
 *    with its own city, so a villa on Zakynthos arrives claiming Durrës; the
 *    structured data cannot be trusted for this and the title is read instead.
 *  - Nearly everything is Durrës — the agency works the city and the coast
 *    south of it — but the title decides, and the two listings that say Tiranë
 *    are filed under Tirana rather than dropped onto a Durrës zone page.
 *  - The district comes from the label the site prints under the title —
 *    a place name the agency typed, not a guess from the prose. DISTRICT_RULES
 *    maps it onto the site's own taxonomy; an unmapped label stops the run
 *    rather than quietly filing the listing under the city alone. Towns of
 *    Durrës county (Manëz, Shijak, Sukth, Arapaj …) become districts of
 *    Durrës, never cities — the precedent Kavajë and Spille set.
 *  - The contact for every listing is Adrian (see AGENT), at the user's
 *    instruction, regardless of which of the agency's agents the source page
 *    names.
 *
 * Prices, which are the awkward part:
 *  - "80,000 €"  → a total.
 *  - "1400€/ m²" → `priceUnit: 'per-sqm'`; the card renders a rate and the
 *    price filter skips it.
 *  - lek figures are lekë të vjetra, the old lek: ten to the new one, and
 *    about 100 new lek to the euro, so the divisor is 1 000. "98 Milion Lekë"
 *    is €98 000.
 *  - on request → price 0, which reads as "unknown" and stays out of sorting.
 *  A sale that converts to less than IMPLAUSIBLE_UNDER is reported instead of
 *  being trusted; a mis-read unit is the one error that puts a wrong number in
 *  front of a buyer.
 *
 * Text: the scrape's Albanian is written to `sq` as the translation source
 * only. `translateProperties.ts --only getal` then writes all six locales as
 * original copy — the facts kept, the agency's marketing prose not reused.
 * Until that runs the listings stay unpublished unless --publish is passed.
 *
 * Idempotent: ids are `property-getal-<id>`, so a second run patches rather
 * than duplicates, and photographs already uploaded are matched by their
 * source filename instead of fetched again.
 *
 * Run:
 * - npm run import:getal -- --dry
 * - npm run import:getal -- --execute
 * - npm run import:getal -- --execute --limit 5      (a slice, for a first look)
 * - npm run import:getal -- --execute --skip-photos  (documents only)
 * - npm run import:getal -- --execute --publish      (publish immediately)
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
const publishNow = args.includes('--publish')
const limitArg = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : 0
const sourceArg = args.includes('--source') ? args[args.indexOf('--source') + 1] : ''
if (!isDry && !isExecute) {
  console.error('Use --dry or --execute.')
  process.exit(1)
}

const SOURCE =
  sourceArg || path.resolve(process.cwd(), '../domlivo-workspace/getal/getal-listings.json')
const PARTNER = 'getal'
/** Where a listing goes when nothing in the title says otherwise. */
const DEFAULT_CITY = 'durres'
const PACE_MS = 250

/** Ten old lek to the new one, about 100 new lek to the euro. */
const OLD_LEK_PER_EUR = 1000
/** Below this a converted sale price is a unit error, not a bargain. */
const IMPLAUSIBLE_UNDER = 5000

/**
 * The contact on every imported listing, at the user's instruction. The
 * agency's own pages name several agents per listing; the site shows this one,
 * and enquiries come to Domlivo rather than to the agency.
 *
 * The phone is deliberately empty: siteSettings.contactPhone is still the
 * placeholder +355 69 000 0000, and a fake number on two hundred listings is
 * worse than no number — the schema makes phone optional for exactly this.
 * Fill it in the Studio once Adrian's real line is known.
 */
const AGENT = {
  slug: 'adrian',
  name: 'Adrian',
  email: 'adrian@domlivo.com',
  phone: '',
}

type Scraped = {
  id: number
  sourceUrl: string
  reference: string
  title: string
  dealType: 'sale' | 'rent'
  rentPeriod: 'month' | 'day' | ''
  priceKind: 'eur' | 'old-lek' | 'on-request'
  pricePerSqm: boolean
  priceRaw: string
  priceValue: number
  city: string
  districtLabel: string
  typeLabel: string
  statusLabel: string
  bedrooms: number
  bathrooms: number
  livingRooms: number
  rooms: number
  floor: number
  floorRaw: string
  area: number
  interiorArea: number
  plotArea: number
  views: number
  datePosted: string
  descriptionText: string
  photos: string[]
  agentName: string
}

type Localized = {en: string; sq: string; ru: string; uk: string; it: string; pl: string}

/**
 * The district label the site prints, mapped onto the site's taxonomy. Order
 * matters: "Shkëmbi i Kavajës" must match Shkëmbi before the Kavajë rule sees
 * it, and every "Plazh …" variant (Iliria, Rrota e Kuqe, Hekurudha) is the
 * one Plazh district.
 *
 * The second element is a district slug that must already exist, or a key of
 * NEW_DISTRICTS to be created as an unpublished shell.
 */
/**
 * Which city a listing belongs to. Almost everything is Durrës — the agency
 * works the city and the coast south of it — but a handful of records name
 * Tiranë in the title, and filing those under Durrës would put a Tirana
 * supermarket on a Durrës zone page.
 *
 * "Maminas, Tiranë-Durrës" names both: it sits on the motorway between them
 * and belongs to Durrës county, so the Durrës mention wins.
 */
const CITY_RULES: Array<[RegExp, string]> = [
  [/durr/, 'durres'],
  [/tiran/, 'tirana'],
]

function cityFor(row: Scraped): string {
  const text = fold(`${row.title} ${row.districtLabel}`)
  for (const [re, slug] of CITY_RULES) if (re.test(text)) return slug
  return DEFAULT_CITY
}

const DISTRICT_RULES: Array<[RegExp, string]> = [
  // Tirana, for the couple of listings that are not in Durrës at all.
  [/kodra e diellit/, 'kodra-e-diellit'],
  // TEG is Tirana East Gate, the mall out at Lundër — not a "treg", the
  // Albanian for market, which the Durrës catch-all below matches.
  [/\bteg\b|tregtare teg|luminor/, 'farke-lunder'],
  [/rinas/, 'rinas'],
  [/laprak/, 'laprake'],
  [/shkemb/, 'shkembi-durres'],
  [/mali?\s*(i\s*)?robit/, 'mali-i-robit'],
  [/qerret/, 'qerret'],
  [/golem|tilaj/, 'golem-durres'],
  [/spille|bashtov/, 'spille'],
  [/lalz|rodon/, 'gjiri-i-lalzit'],
  [/plepa/, 'plepa-durres'],
  [/plazh|iliria|rrota e kuqe|hekurudh/, 'plazh'],
  [/shkozet/, 'shkozet'],
  [/currila/, 'currila'],
  [/rrashbull/, 'rrashbull'],
  [/porto\s*romano/, 'porto-romano'],
  // Spitallë, the district north of the city, is not Spitali, the hospital
  // quarter in the middle of it. One "l" apart, and several kilometres.
  [/spitall/, 'spitalle'],
  /**
   * Towns and villages of Durrës county, each its own bashki or njësi on
   * paper. They follow Kavajë and Spille: a district of Durrës, never a city
   * of its own (user's decision, 2026-09-10). Arapaj must come before the
   * Kavajë rule — one listing reads "Arapaj, Kavajë | Durrës".
   */
  [/arapaj/, 'arapaj'],
  [/manez|man[ëe]z/, 'manez'],
  [/xhafzotaj/, 'xhafzotaj'],
  [/shkallnur/, 'shkallnur'],
  [/shijak/, 'shijak'],
  [/fllake|fllak[ëe]/, 'fllake'],
  [/sukth/, 'sukth'],
  [/koxhas/, 'koxhas'],
  [/maminas/, 'maminas'],
  [/kavaj/, 'kavaje'],
  /**
   * Durrës proper. The agency labels the city at street granularity — the
   * hospital, the Red Cross junction, the old police station, the sports
   * palace, the market, the waterworks — and those are addresses rather than
   * zones the site has pages for, so they file under the city centre
   * (user's decision, 2026-09-10).
   */
  [
    /qender|qendra|city\s*cent|kryqi i kuq|vollg|ish\s*k[ëe]net|kenet|hyrja e durr|rajoni|lagj|treg|ujesjell|ukd|spitali|nish\s*tull|nishtull|pallati|sport|stacion|shetitor|stadium|pranvera|rinia|bulevard|polic|muze|ish[\s-]*urt|goga|cezma|kuajve|dyrrah/,
    'city-center-durres',
  ],
]

/**
 * Districts the site does not have yet, created as unpublished shells — the
 * precedent set by Kavajë and Spille in the findall import: a place the
 * agency sells in becomes a district of Durrës, never a city of its own, and
 * stays unpublished until someone writes the zone page.
 */
const NEW_DISTRICTS: Record<string, {city: string; title: Localized}> = {
  // Durrës county. Each is a bashki or njësi administrative of its own on
  // paper and a Durrës address in every listing.
  arapaj: {city: 'durres', title: {en: 'Arapaj', sq: 'Arapaj', ru: 'Арапай', uk: 'Арапай', it: 'Arapaj', pl: 'Arapaj'}},
  manez: {city: 'durres', title: {en: 'Manëz', sq: 'Manëz', ru: 'Манэз', uk: 'Манез', it: 'Manëz', pl: 'Manëz'}},
  xhafzotaj: {city: 'durres', title: {en: 'Xhafzotaj', sq: 'Xhafzotaj', ru: 'Джафзотай', uk: 'Джафзотай', it: 'Xhafzotaj', pl: 'Xhafzotaj'}},
  shkallnur: {city: 'durres', title: {en: 'Shkallnur', sq: 'Shkallnur', ru: 'Шкальнур', uk: 'Шкальнур', it: 'Shkallnur', pl: 'Shkallnur'}},
  shijak: {city: 'durres', title: {en: 'Shijak', sq: 'Shijak', ru: 'Шияк', uk: 'Шияк', it: 'Shijak', pl: 'Shijak'}},
  fllake: {city: 'durres', title: {en: 'Fllakë', sq: 'Fllakë', ru: 'Фллака', uk: 'Фллака', it: 'Fllakë', pl: 'Fllakë'}},
  sukth: {city: 'durres', title: {en: 'Sukth', sq: 'Sukth', ru: 'Сукт', uk: 'Сукт', it: 'Sukth', pl: 'Sukth'}},
  koxhas: {city: 'durres', title: {en: 'Koxhas', sq: 'Koxhas', ru: 'Коджас', uk: 'Коджас', it: 'Koxhas', pl: 'Koxhas'}},
  maminas: {city: 'durres', title: {en: 'Maminas', sq: 'Maminas', ru: 'Маминас', uk: 'Маминас', it: 'Maminas', pl: 'Maminas'}},
  // Tirana, by the airport.
  rinas: {city: 'tirana', title: {en: 'Rinas', sq: 'Rinas', ru: 'Ринас', uk: 'Рінас', it: 'Rinas', pl: 'Rinas'}},
}

/**
 * Listings that are not in Albania at all. The agency's CMS stamps every
 * record with its own city, so a luxury villa on Zakynthos arrives claiming
 * `addressLocality: "Durrës"` and a Durrës district label — the structured
 * data cannot be trusted for this and the text has to be read. Filing a Greek
 * villa under a Durrës district would corrupt the zone pages and the map.
 */
const FOREIGN = /\bgreqi\b|\bgreece\b|zakynthos|zaki?nthos|\bitali\b|\bitaly\b|\bmali i zi\b|montenegro|\bkosov|\bturqi\b|\bturkey\b|\bdubai\b|\bspanj/i

/** get.al's "Lloji" to our propertyType slugs. */
const TYPE_SLUGS: Record<string, string> = {
  apartment: 'apartment',
  studio: 'studio',
  house: 'house',
  villa: 'villa',
  land: 'land',
  commercial: 'commercial-space',
  shop: 'commercial-space',
  office: 'office',
  // The site has no duplex type; a duplex is an apartment over two floors.
  duplex: 'apartment',
  // Land is land, whatever the buyer means to put on it.
  'commercial land': 'land',
  'industrial land': 'land',
  // A garage, a parking space, a restaurant and a whole building sold as one
  // investment are all closer to commercial space than to a home.
  garage: 'commercial-space',
  parking: 'commercial-space',
  'apartment block': 'commercial-space',
  'commercial complex': 'commercial-space',
  'bar / restaurant': 'commercial-space',
  building: 'commercial-space',
  hotel: 'commercial-space',
  penthouse: 'penthouse',
}

/** get.al's "Statusi" to our construction stage. */
const STAGE: Record<string, string> = {
  new: 'completed',
  used: 'completed',
  'under construction': 'under-construction',
}

/** What the title says, to refine "apartment" and to cover an empty Lloji. */
const TYPE_FROM_TITLE: Array<[RegExp, string]> = [
  [/penthouse/, 'penthouse'],
  [/\bvil[ëe]\b|\bvila\b/, 'villa'],
  [/tok[ëe]|truall/, 'land'],
  [/dyqan|ambient biznesi|kapanon|magazin|bar\b|restorant|hotel/, 'commercial-space'],
  [/zyre|zyra|office/, 'office'],
  [/garsonier|studio/, 'studio'],
  [/sht[ëe]pi/, 'house'],
  [/apartament/, 'apartment'],
]

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

function sameEverywhere(value: string): Localized {
  return {en: value, ru: value, uk: value, sq: value, it: value, pl: value}
}

/** The agency's "◆" bullet, emoji and stray punctuation off the title. */
function cleanTitle(title: string): string {
  return title
    .replace(/[\p{Extended_Pictographic}◆◇■□●○★☆▪▫️]/gu, '')
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/\s*\|\s*/g, ' | ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * The agency's contact block, hashtags and its own price line come out: the
 * price is a field, and a phone number in the body outlives the listing.
 */
function cleanDescription(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(/#[\p{L}\p{N}_]+/gu, '').replace(/^[◆◇■□●○▪▫]\s*/u, '').replace(/\s+/g, ' ').trim())
    .filter((line) => {
      if (!line) return false
      if (/get real estate|get\.al/i.test(line)) return false
      if (/\+?355|^\+?\d[\d\s/+.-]{7,}$/.test(line)) return false
      if (/^(per|për) m[ëe] shum[ëe]|contact us|kontaktoni|na kontaktoni/i.test(line)) return false
      return true
    })
    .join('\n')
}

function districtFor(row: Scraped): string {
  const haystacks = [fold(row.districtLabel), fold(row.title)]
  for (const text of haystacks) {
    if (!text) continue
    for (const [re, slug] of DISTRICT_RULES) if (re.test(text)) return slug
  }
  return ''
}

/**
 * A title that leads with a commercial noun, on a listing that names no
 * dwelling. The agency's own "Lloji" is wrong on a handful of these — a
 * business unit filed as Land, a supermarket as Apartment — and a shop on the
 * flats filter is worse than one that is merely imprecise, so the title wins.
 * "Shtëpi Private + Dyqan" keeps its house type: it is a home with a shop
 * attached, not a shop.
 */
const COMMERCIAL_TITLE =
  /^(shitet|shiten|jepet)?\s*(\/\s*jepet me qira)?\s*(ambient|aktivitet|njesi|lokal|dyqan|kapanon|magazin|supermarket|market|bar|restorant|hotel)\b/
const DWELLING_TITLE = /apartament|garsonier|vil[ëe]|vila|sht[ëe]pi|penthouse|duplex/

function typeFor(row: Scraped): string {
  const title = fold(row.title)
  const fromLabel = TYPE_SLUGS[fold(row.typeLabel).trim()] || ''
  const leadTitle = title.replace(/^[^\p{L}\p{N}]+/u, '')
  if (COMMERCIAL_TITLE.test(leadTitle) && !DWELLING_TITLE.test(title)) {
    return /\bzyr[ae]\b|office/.test(title) && !/ambient/.test(leadTitle) ? 'office' : 'commercial-space'
  }
  if (fromLabel === 'apartment') {
    if (/penthouse/.test(title)) return 'penthouse'
    if (/garsonier/.test(title) && !/\d\s*\+\s*\d/.test(title)) return 'studio'
    return 'apartment'
  }
  if (fromLabel) return fromLabel
  for (const [re, slug] of TYPE_FROM_TITLE) if (re.test(title)) return slug
  return ''
}

/** Sold and reserved listings stay out of the catalogue but keep their URL. */
function lifecycleFor(row: Scraped): string {
  const text = fold(`${row.title}\n${row.descriptionText}`)
  if (/\bshitur\b|u shit\b/.test(text)) return 'sold'
  if (/rezervuar/.test(text)) return 'reserved'
  return 'active'
}

/**
 * The agency leaves the room counts at zero on some listings while the title
 * says "2+1" — the Albanian notation for two bedrooms and a living room.
 */
function bedroomsFor(row: Scraped): number {
  if (row.bedrooms > 0) return row.bedrooms
  const m = /(\d)\s*\+\s*\d/.exec(row.title) ?? /(\d)\s*dhom[ëa]?\s*gjumi/i.exec(row.descriptionText)
  return m ? Number(m[1]) : 0
}

/**
 * Rooms means bedrooms plus living rooms — the number behind "2+1", and what
 * the ru/uk titles count.
 *
 * The title's own notation is trusted first. The agency's structured data
 * reports numberOfRooms as the bedroom count on most flats, so a "1+1" would
 * otherwise be stored as one room and read as a studio; the notation is the
 * figure a person actually typed.
 */
function roomsFor(row: Scraped, bedrooms: number): number {
  const notation = /(\d)\s*\+\s*(\d)/.exec(row.title)
  if (notation) return Number(notation[1]) + Number(notation[2])
  // A garsoniere is one room with no separate bedroom.
  if (/garsonier|studio/i.test(row.title)) return 1
  if (row.livingRooms > 0) return bedrooms + row.livingRooms
  if (row.rooms > bedrooms) return row.rooms
  return bedrooms > 0 ? bedrooms + 1 : 0
}

const DWELLINGS = new Set(['apartment', 'studio', 'house', 'villa', 'penthouse'])

function bathsFor(row: Scraped, typeSlug: string): number {
  if (row.bathrooms > 0) return row.bathrooms
  const text = `${row.title}\n${row.descriptionText}`
  const notation = /\d\s*\+\s*\d\s*\+\s*(\d)\b/.exec(text)
  if (notation) return Number(notation[1])
  const words = /(\d)\s*(?:tualet|banj[oa]|wc\b)/i.exec(text)
  if (words) return Number(words[1])
  return DWELLINGS.has(typeSlug) ? 1 : 0
}

/**
 * The year the keys are promised, out of the description. The schema asks for
 * one on anything unfinished, and the agency does write it — "dorëzimi i
 * çelësave … 2027".
 *
 * A year already past is not returned: several listings still promise a 2025
 * handover, which means the record is stale rather than that the keys arrive
 * next year, and printing it would mislead. Those come back 0 and are counted
 * in the run's report so someone can ask the agency.
 */
function handoverFrom(text: string): number {
  const thisYear = new Date().getFullYear()
  const years = [...text.matchAll(/\b(20[2-3]\d)\b/g)]
    .map((m) => Number(m[1]))
    .filter((y) => y >= 2020 && y <= 2035)
  if (!years.length) return 0
  const future = years.filter((y) => y >= thisYear)
  return future.length ? Math.min(...future) : 0
}

/** The price in euro, and whether the figure is a rate rather than a total. */
function priceEur(row: Scraped): number {
  if (row.priceKind === 'on-request' || !row.priceValue) return 0
  if (row.priceKind === 'old-lek') return Math.round(row.priceValue / OLD_LEK_PER_EUR)
  return Math.round(row.priceValue)
}

async function uploadPhoto(url: string, publicId: string) {
  const res = await fetch(url, {headers: {'User-Agent': 'DomLivoImportBot/1.0 (+https://domlivo.com)'}})
  if (!res.ok) throw new Error(`photo ${res.status} ${url}`)
  const bytes = Buffer.from(await res.arrayBuffer())
  const ext = (url.match(/\.(jpe?g|png|webp)(?:\?|$)/i)?.[1] ?? 'jpg').toLowerCase()
  return client.assets.upload('image', bytes, {
    filename: `${publicId}.${ext}`,
    description: `Imported from get.al (partner listing). Source: ${url}`,
  })
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`No scrape at ${SOURCE}\nRun npm run scrape:getal first, or pass --source <file>.`)
    process.exit(1)
  }
  const all: Scraped[] = JSON.parse(fs.readFileSync(SOURCE, 'utf8'))
  const rentals = all.filter((r) => r.dealType === 'rent')
  const sales = all.filter((r) => r.dealType === 'sale')
  const foreign = sales.filter((r) => FOREIGN.test(`${r.title}\n${r.descriptionText.slice(0, 400)}`))
  const foreignIds = new Set(foreign.map((r) => r.id))
  let rows = sales.filter((r) => !foreignIds.has(r.id))
  if (limitArg > 0) rows = rows.slice(0, limitArg)

  const [cities, districts, existingTypes, existingAgent] = await Promise.all([
    client.fetch<Array<{slug: string; _id: string}>>(`*[_type=="city"]{_id, "slug": slug.current}`),
    client.fetch<Array<{slug: string; _id: string; city: string; isPublished: boolean | null}>>(
      `*[_type=="district"]{_id, "slug": slug.current, "city": city->slug.current, isPublished}`,
    ),
    client.fetch<Array<{slug: string; _id: string}>>(`*[_type=="propertyType"]{_id, "slug": slug.current}`),
    client.fetch<{_id: string} | null>(`*[_type=="agent" && slug.current==$s][0]{_id}`, {s: AGENT.slug}),
  ])
  const cityBySlug = new Map(cities.map((c) => [c.slug, c._id]))
  if (!cityBySlug.has(DEFAULT_CITY)) {
    console.error(`No city document with slug "${DEFAULT_CITY}".`)
    process.exit(1)
  }
  const districtBySlug = new Map(districts.map((d) => [d.slug, d]))
  const typeBySlug = new Map(existingTypes.map((t) => [t.slug, t._id]))

  // --- plan ---
  const problems: string[] = []
  const unmappedLabels = new Map<string, number>()
  const districtsNeeded = new Set<string>()
  const priceWarnings: string[] = []

  const plan = rows.map((row) => {
    const citySlug = cityFor(row)
    const districtSlug = districtFor(row)
    const typeSlug = typeFor(row)
    const eur = priceEur(row)

    if (!cityBySlug.has(citySlug)) problems.push(`#${row.id}: city "${citySlug}" does not exist`)

    if (!districtSlug) {
      const key = `${row.districtLabel || '(no label)'} [${citySlug}]`
      unmappedLabels.set(key, (unmappedLabels.get(key) ?? 0) + 1)
    } else if (!districtBySlug.has(districtSlug)) {
      if (NEW_DISTRICTS[districtSlug]) districtsNeeded.add(districtSlug)
      else problems.push(`#${row.id}: district "${districtSlug}" does not exist`)
    } else if (districtBySlug.get(districtSlug)!.city !== citySlug) {
      // The district exists but under another city — the label matched a rule
      // meant for somewhere else, and the listing would land on a zone page
      // for the wrong town.
      problems.push(
        `#${row.id}: district "${districtSlug}" is in ${districtBySlug.get(districtSlug)!.city}, listing is in ${citySlug}`,
      )
    }

    if (!typeSlug) problems.push(`#${row.id}: no property type for "${row.typeLabel}" / "${row.title.slice(0, 40)}"`)
    else if (!typeBySlug.has(typeSlug)) problems.push(`#${row.id}: propertyType "${typeSlug}" does not exist`)

    if (eur > 0 && !row.pricePerSqm && eur < IMPLAUSIBLE_UNDER) {
      priceWarnings.push(`#${row.id}: €${eur} from "${row.priceRaw}" (${row.priceKind}) — ${row.title.slice(0, 44)}`)
    }
    return {row, citySlug, districtSlug, typeSlug, lifecycle: lifecycleFor(row), eur}
  })

  const tally = (pick: (p: (typeof plan)[number]) => string) =>
    Object.entries(
      plan.reduce<Record<string, number>>((acc, p) => {
        const k = pick(p)
        return k ? {...acc, [k]: (acc[k] || 0) + 1} : acc
      }, {}),
    )
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ${v}`)
      .join(', ')

  const photoCount = plan.reduce((n, p) => n + p.row.photos.length, 0)
  console.log(
    `${all.length} listings scraped — ${rentals.length} rentals skipped, ${foreign.length} outside Albania skipped, ${rows.length} sales to import\n`,
  )
  if (foreign.length) {
    console.log('OUTSIDE ALBANIA (the source files these under Durrës anyway):')
    for (const r of foreign) console.log(`  #${r.id} ${r.title.slice(0, 70)}`)
    console.log('')
  }
  console.log(`  cities:      ${tally((p) => p.citySlug)}`)
  console.log(`  districts:   ${tally((p) => p.districtSlug || '(unmapped)')}`)
  if (districtsNeeded.size) console.log(`  to create:   ${[...districtsNeeded].join(', ')} (unpublished shells)`)
  console.log(`  types:       ${tally((p) => p.typeSlug || '(none)')}`)
  console.log(`  lifecycle:   ${tally((p) => p.lifecycle)}`)
  console.log(`  agent:       ${existingAgent ? `exists (${existingAgent._id})` : 'to create'} — ${AGENT.name}`)
  console.log(`  photographs: ${photoCount}${skipPhotos ? ' (skipped)' : ''}`)
  console.log(`  prices:      ${tally((p) => p.row.priceKind)}; per-m² ${plan.filter((p) => p.row.pricePerSqm).length}, no figure ${plan.filter((p) => p.eur === 0).length}`)
  console.log(`  published:   ${publishNow ? 'yes (--publish)' : 'no — run translateProperties.ts --only getal first, then publish'}`)

  if (unmappedLabels.size) {
    console.log('\nUNMAPPED DISTRICT LABELS (add a rule to DISTRICT_RULES):')
    for (const [label, n] of [...unmappedLabels.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(n).padStart(3)}  ${label}`)
    }
  }
  if (priceWarnings.length) {
    console.log(`\nPRICE LOOKS WRONG (${priceWarnings.length}) — imported with price 0 instead:`)
    for (const w of priceWarnings.slice(0, 15)) console.log(`  ${w}`)
  }
  if (problems.length) {
    console.log('\nPROBLEMS:')
    for (const p of problems.slice(0, 15)) console.log(`  ${p}`)
    if (problems.length > 15) console.log(`  … and ${problems.length - 15} more`)
  }

  if (isDry) {
    console.log('\nDry run — nothing written.')
    return
  }
  if (problems.length || unmappedLabels.size) {
    console.error('\nRefusing to write while listings cannot be placed. Fix the rules above and re-run.')
    process.exit(1)
  }

  // --- agent ---
  const agentId = existingAgent?._id ?? `agent-${PARTNER}-${AGENT.slug}`
  await client
    .transaction()
    .createIfNotExists({_id: agentId, _type: 'agent'} as never)
    .patch(agentId, (p) =>
      p
        .set({
          name: AGENT.name,
          slug: {_type: 'slug', current: AGENT.slug},
          email: AGENT.email,
          isPublished: true,
          // Never clobber a phone an editor has filled in with an empty string.
          ...(AGENT.phone ? {phone: AGENT.phone} : {}),
        })
        .setIfMissing({
          description: sameEverywhere(
            'Estate agent in Durrës, working the city and the coast to the south. Listings are supplied by the agency; contact Adrian directly.',
          ),
        }),
    )
    .commit()
  console.log(`\nagent ${agentId}`)

  // --- district shells ---
  if (districtsNeeded.size) {
    // Ordering is per city, so each city's running counter starts from its own
    // highest existing district.
    const nextOrder = new Map<string, number>()
    for (const slug of districtsNeeded) {
      const {city: shellCity} = NEW_DISTRICTS[slug]
      if (!nextOrder.has(shellCity)) {
        const maxOrder = await client.fetch<number | null>(
          `math::max(*[_type=="district" && city->slug.current==$city].order)`,
          {city: shellCity},
        )
        nextOrder.set(shellCity, maxOrder ?? 0)
      }
      const id = `district-${slug}`
      const order = nextOrder.get(shellCity)! + 1
      nextOrder.set(shellCity, order)
      await client.createOrReplace({
        _id: id,
        _type: 'district',
        title: NEW_DISTRICTS[slug].title,
        slug: {_type: 'slug', current: slug},
        city: {_type: 'reference', _ref: cityBySlug.get(NEW_DISTRICTS[slug].city)},
        order,
        isPublished: false,
      } as never)
      districtBySlug.set(slug, {_id: id, slug, city: NEW_DISTRICTS[slug].city, isPublished: false})
      console.log(`district ${id} (unpublished shell — needs a description before it can go live)`)
    }
  }

  // --- listings ---
  let done = 0
  let uploaded = 0
  for (const {row, citySlug, districtSlug, typeSlug, lifecycle, eur} of plan) {
    const docId = `property-${PARTNER}-${row.id}`
    const existing = await client.fetch<{gallery?: Array<Record<string, unknown> & {publicId?: string}>} | null>(
      `*[_id==$id][0]{ "gallery": gallery[]{ ..., "publicId": asset->originalFilename } }`,
      {id: docId},
    )
    const kept = (existing?.gallery ?? []).map(({publicId, ...item}) => ({
      item,
      publicId: (publicId || '').replace(/\.[a-z]+$/i, ''),
    }))
    const already = new Set(kept.map((k) => k.publicId).filter(Boolean))

    const title = cleanTitle(row.title) || row.title
    const description = cleanDescription(row.descriptionText) || title
    const short = description.split('\n').find((l) => l.length > 40) || description.split('\n')[0] || title

    const fresh: Array<Record<string, unknown>> = []
    if (!skipPhotos) {
      // The gallery is capped at 30 by the schema.
      const urls = row.photos.slice(0, 30)
      const seen = new Set<string>()
      for (const url of urls) {
        const publicId = (url.split('/').pop() || '').replace(/\.[a-z]+$/i, '')
        if (!publicId || seen.has(publicId)) continue
        seen.add(publicId)
        if (already.has(publicId)) continue
        try {
          const asset = await uploadPhoto(url, publicId)
          fresh.push({
            _key: slugify(publicId).slice(0, 40) || `p${fresh.length}`,
            _type: 'image',
            asset: {_type: 'reference', _ref: asset._id},
            alt: title.slice(0, 120),
          })
          uploaded += 1
          await sleep(PACE_MS)
        } catch (err) {
          console.log(`   photo failed for #${row.id}: ${err instanceof Error ? err.message : err}`)
        }
      }
    }

    const bedrooms = bedroomsFor(row)
    const rooms = roomsFor(row, bedrooms)
    const bathrooms = bathsFor(row, typeSlug)
    const district = districtSlug ? districtBySlug.get(districtSlug)?._id : undefined
    // A per-m² rate is a rate; a total under IMPLAUSIBLE_UNDER is a unit error.
    const price = eur > 0 && !row.pricePerSqm && eur < IMPLAUSIBLE_UNDER ? 0 : eur
    // Land is a plot: its area belongs in Area, and plotArea stays empty.
    const plotArea = typeSlug === 'land' ? 0 : row.plotArea
    const stage = STAGE[fold(row.statusLabel).trim()] ?? ''
    const handoverYear = stage === 'under-construction' ? handoverFrom(row.descriptionText) : 0

    const doc: Record<string, unknown> = {
      _id: docId,
      _type: 'property',
      slug: {_type: 'slug', current: `${slugify(title)}-${row.id}`.slice(0, 90)},
      agent: {_type: 'reference', _ref: agentId},
      city: {_type: 'reference', _ref: cityBySlug.get(citySlug)},
      ...(district ? {district: {_type: 'reference', _ref: district}} : {}),
      type: {_type: 'reference', _ref: typeBySlug.get(typeSlug)},
      status: 'sale',
      isPublished: publishNow,
      lifecycleStatus: publishNow ? lifecycle : 'draft',
      price,
      priceUnit: row.pricePerSqm && price > 0 ? 'per-sqm' : 'total',
      ...(row.area > 0 ? {area: row.area} : {}),
      ...(plotArea > 0 ? {plotArea} : {}),
      ...(bedrooms > 0 ? {bedrooms} : {}),
      ...(rooms > 0 ? {rooms} : {}),
      ...(bathrooms > 0 ? {bathrooms} : {}),
      ...(stage ? {constructionStage: stage} : {}),
      ...(handoverYear ? {handoverYear} : {}),
      ...(row.datePosted ? {createdAt: new Date(row.datePosted).toISOString()} : {}),
      propertyCode: row.reference || `GETAL-${row.id}`,
      locationPrecision: 'approximate',
    }

    // The Albanian is the translation source only; the other locales are
    // seeded with it so nothing renders empty, and setIfMissing keeps the
    // translations a later run writes.
    const textSq: Record<string, string> = {
      'title.sq': title,
      'shortDescription.sq': short.slice(0, 300),
      'description.sq': description,
    }
    const textSeed: Record<string, string> = {}
    for (const loc of ['en', 'ru', 'uk', 'it', 'pl']) {
      textSeed[`title.${loc}`] = title
      textSeed[`shortDescription.${loc}`] = short.slice(0, 300)
      textSeed[`description.${loc}`] = description
    }

    // Always a patch, never createOrReplace: the document accumulates things
    // this import does not own — translations, an editor's coordinates, a
    // hand-picked seo block — and a replace would wipe them.
    const {_id, _type, ...rest} = doc
    await client
      .transaction()
      .createIfNotExists({_id: _id as string, _type: _type as string} as never)
      .patch(_id as string, (p) => {
        let patch = p.set(rest).set(textSq).setIfMissing(textSeed).unset(district ? [] : ['district'])
        if (fresh.length) patch = patch.set({gallery: [...kept.map((k) => k.item), ...fresh]})
        return patch
      })
      .commit()

    done += 1
    if (done % 10 === 0 || done === plan.length) console.log(`  ${done}/${plan.length} listings, ${uploaded} photos uploaded`)
  }

  console.log(`\nImported ${done} listings, ${uploaded} new photographs.`)
  console.log(
    publishNow
      ? 'Published. Run translateProperties.ts --only getal --execute so the other locales stop showing Albanian.'
      : 'Left unpublished. Next: translateProperties.ts --only getal --execute, then re-run with --publish.',
  )
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
