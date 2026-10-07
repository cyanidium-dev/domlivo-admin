/**
 * Import the partner's listings from Cactus Real Estate (Durrës) into Sanity.
 *
 * Source: the agency's own Sanity dataset, which is public and readable
 * without a token — one GROQ query against
 * https://e3a1f8cg.apicdn.sanity.io/v2024-01-08/data/query/production.
 * Nothing is scraped; the records are the agency's structured fields plus
 * the English and Russian copy they wrote themselves.
 *
 * What is imported, and what is not:
 *
 *  - Sales only. Rentals are counted and skipped — the site hides rentals.
 *  - The city is the agency's own `cityName`, mapped onto our city slugs.
 *    Kavajë, Qerret and Spille are districts of Durrës by site convention
 *    (see importGetAlListings.ts / importFindallListings.ts), Lukovë is a
 *    district of Himarë. Delvinë and Korçë have no city here and are skipped.
 *    Two corrections come from the title: a flat the agency filed under
 *    Durrës whose title says Tirana goes to Tirana, and Velipojë goes to
 *    Shkodër.
 *  - The district is read from the English title, then the Russian title,
 *    then the two descriptions, with DISTRICT_RULES — the agency types the
 *    zone into the title ("Plazh area", "р-н Голем"). A rule's district must
 *    belong to the listing's city or the match is ignored, so "Centre near
 *    Port" in Durrës does not land on Sarandë's port zone. Unlike the get.al
 *    import an unmatched district does not stop the run: the listing is filed
 *    under the city alone and the title is listed in the report so someone
 *    can add a rule.
 *  - The contact is the agency itself (AGENT): name linked to our own
 *    catalogue filtered by agent, no phone, no social links.
 *
 * Text: `title.en` / `description.en` from the English fields, `.ru` from the
 * Russian ones. The agency's trailing price line ("Price: 110 000€ (object
 * 250226-6)") comes out — the price is a field — and the object code from it
 * becomes `propertyCode` as CACTUS-250226-6. Nothing is written to uk, sq,
 * it, pl or de: a separate step translates. Until it runs the listings stay
 * unpublished unless --publish is passed.
 *
 * Coordinates: 94 records carry a Google Maps link, nearly all of them
 * maps.app.goo.gl short links. Those cannot be resolved over plain HTTP —
 * the 302 lands on `maps.google.com?q=<place name>&ftid=…` with no
 * coordinates, and the page is JavaScript-only — so the links are resolved
 * in a real browser beforehand and written to
 * ../domlivo-workspace/cactus/gmaps-cache.json, keyed by the link with its
 * query string removed: `{ lat, lng, precision: 'exact' | 'approximate',
 * note }`. This script only reads that file. A link missing from it leaves
 * the coordinates empty with locationPrecision 'approximate' and is counted
 * as unresolved; the one `maps.google.com?q=lat,lng` link is parsed directly
 * as a fallback. Nothing here fetches Google.
 *
 * Idempotent: ids are `property-cactus-<source _id>`, so a second run patches
 * rather than duplicates (createIfNotExists + patch, never createOrReplace),
 * and photographs already uploaded are matched by their source filename.
 *
 * Run:
 * - npm run import:cactus -- --dry
 * - npm run import:cactus -- --execute
 * - npm run import:cactus -- --execute --limit 5          (a slice)
 * - npm run import:cactus -- --execute --skip-photos      (documents only)
 * - npm run import:cactus -- --execute --publish          (publish immediately)
 * - npm run import:cactus -- --execute --only <id>[,<id>] (source _id prefix or object code)
 * - add --gmaps-cache <file> to read the pins from another file
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
const onlyArg = args.includes('--only') ? args[args.indexOf('--only') + 1] : ''
const cacheArg = args.includes('--gmaps-cache') ? args[args.indexOf('--gmaps-cache') + 1] : ''
const only = onlyArg ? onlyArg.split(',').map((s) => s.trim()).filter(Boolean) : []
if (!isDry && !isExecute) {
  console.error('Use --dry or --execute.')
  process.exit(1)
}

const PARTNER = 'cactus'
const SOURCE_API = 'https://e3a1f8cg.apicdn.sanity.io/v2024-01-08/data/query/production'
const SOURCE_QUERY = `*[_type=="property"]{
  _id, _createdAt, _updatedAt,
  titleEnglish, titleRussian, descriptionEnglish, descriptionRussian,
  price, areaActual, areaCertificate, bathroomNumber,
  roomsEnglish, roomsRussian, stateEnglish, stateRussian, locationGmapsLink,
  "city": cityName->name,
  "deal": sellOrRent->value,
  "type": typeOfProperty->value,
  "photos": allPhotos[]{ "url": asset->url, "w": asset->metadata.dimensions.width, "h": asset->metadata.dimensions.height },
  "mainPhotoUrl": mainPhoto.asset->url
}`
const WORKSPACE = path.resolve(process.cwd(), '../domlivo-workspace/cactus')
const GMAPS_CACHE = cacheArg ? path.resolve(cacheArg) : path.join(WORKSPACE, 'gmaps-cache.json')
const PACE_MS = 250
/** Below this a sale total is a unit error or a per-m² rate, not a bargain. */
const IMPLAUSIBLE_UNDER = 15000
/** Albania, roughly: a resolved pin outside this is a wrong link. */
const ALBANIA = {latMin: 39.6, latMax: 42.7, lngMin: 19.2, lngMax: 21.1}
const UA = 'DomLivoImportBot/1.0 (+https://domlivo.com)'

const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl', 'de'] as const
type Locale = (typeof LOCALES)[number]
type Localized = Record<Locale, string>

/**
 * The agency as the contact on every listing. The name links to our own
 * catalogue filtered by agent — nothing external — so noPublicLink stays
 * false. No phone and no social links: enquiries come through Domlivo.
 */
const AGENT = {
  id: `agent-${PARTNER}`,
  slug: PARTNER,
  name: 'Cactus Real Estate',
  email: 'cactusbusines@gmail.com',
  bio: {
    en: 'Cactus Real Estate is a Durrës agency working the coast from Plazh to Golem and Shkëmbi i Kavajës, with a focus on renovated, furnished apartments and new developments for investment.',
    uk: 'Cactus Real Estate — агенція з Дурреса, що працює на узбережжі від Пляжа до Голема та Шкембі-і-Каваєс; спеціалізується на квартирах з ремонтом і меблями та новобудовах для інвестицій.',
    ru: 'Cactus Real Estate — агентство из Дурреса, работающее на побережье от Пляжа до Голема и Шкемби-и-Каваес; специализируется на квартирах с ремонтом и мебелью и новостройках для инвестиций.',
    sq: 'Cactus Real Estate është një agjenci në Durrës që punon bregdetin nga Plazhi te Golemi dhe Shkëmbi i Kavajës, me fokus te apartamentet e rinovuara e të mobiluara dhe ndërtimet e reja për investim.',
    it: "Cactus Real Estate è un'agenzia di Durazzo che opera sulla costa da Plazh a Golem e Shkëmbi i Kavajës, con un focus su appartamenti ristrutturati e arredati e nuove costruzioni da investimento.",
    pl: 'Cactus Real Estate to agencja z Durrës działająca na wybrzeżu od Plazh po Golem i Shkëmbi i Kavajës, wyspecjalizowana w wyremontowanych, umeblowanych mieszkaniach i nowych inwestycjach deweloperskich.',
    de: 'Cactus Real Estate ist eine Agentur aus Durrës, die an der Küste von Plazh bis Golem und Shkëmbi i Kavajës arbeitet, mit Schwerpunkt auf renovierten, möblierten Wohnungen und Neubauten als Kapitalanlage.',
  } satisfies Localized,
}

type Source = {
  _id: string
  _createdAt: string
  _updatedAt: string
  titleEnglish?: string | null
  titleRussian?: string | null
  descriptionEnglish?: string | null
  descriptionRussian?: string | null
  price?: number | null
  areaActual?: number | null
  areaCertificate?: number | null
  bathroomNumber?: string | null
  roomsEnglish?: string | null
  roomsRussian?: string | null
  stateEnglish?: string | null
  stateRussian?: string | null
  locationGmapsLink?: string | null
  city?: string | null
  deal?: string | null
  type?: string | null
  photos?: Array<{url?: string | null; w?: number | null; h?: number | null}> | null
  mainPhotoUrl?: string | null
}

/**
 * The agency's city names to our city slugs, with the district the city
 * itself implies. Kavajë, Qerret and Spille are Durrës districts by site
 * convention; Lukovë is a village of Himarë. Anything not listed is skipped.
 */
const CITY_MAP: Record<string, {city: string; district?: string}> = {
  durres: {city: 'durres'},
  shengjin: {city: 'shengjin'},
  tirana: {city: 'tirana'},
  vlore: {city: 'vlore'},
  saranda: {city: 'sarande'},
  lukove: {city: 'himare', district: 'lukove'},
  kavaje: {city: 'durres', district: 'kavaje'},
  qerret: {city: 'durres', district: 'qerret'},
  spille: {city: 'durres', district: 'spille'},
}

/**
 * The title overrules the agency's city stamp. A handful of flats say
 * "Tirana, new building" while filed under Durrës, and one Velipojë flat
 * (Shkodër's beach, a hundred kilometres north) is filed under Durrës too.
 */
const CITY_FROM_TITLE: Array<[RegExp, string]> = [
  [/velipoj/, 'shkoder'],
  [/\btiran[ae]?\b|тиран/, 'tirana'],
]

/** The city-centre district of each city, for the "centre" rule. */
const CENTER_BY_CITY: Record<string, string> = {
  durres: 'city-center-durres',
  tirana: 'qender-tirana',
  vlore: 'city-center-vlore',
  sarande: 'city-center-sarande',
  shengjin: 'center-shengjin',
  himare: 'center-himare',
  shkoder: 'qender-shkoder',
}

/**
 * Place name → district slug, on text with diacritics stripped. Order
 * matters: "Shkëmbi i Kavajës" must land on Shkëmbi before the Kavajë rule
 * sees it, and "Plazhi i Golemit" on Golem before Plazh. A match only counts
 * when the district belongs to the listing's city.
 *
 * 'CENTER' is resolved through CENTER_BY_CITY. "Durres city" / "в городе
 * Дуррес" is the agency's wording for the town proper as opposed to the
 * beach zones, so it files under the centre too.
 */
const DISTRICT_RULES: Array<[RegExp, string]> = [
  // Durrës coast and county
  [/shkemb|шкемб/, 'shkembi-durres'],
  [/mali?\s*(i\s*)?robit|мали\s*(и\s*)?робит/, 'mali-i-robit'],
  [/qerret|черр?ет/, 'qerret'],
  [/golem|голем|kolosue/, 'golem-durres'],
  [/spille|спилле/, 'spille'],
  [/lalz|rodon/, 'gjiri-i-lalzit'],
  [/plepa|плепа/, 'plepa-durres'],
  [/curr?il+a|цурилла|dyrrakium/, 'currila'],
  [/plazh|пляж|il+ir|илир|hekurudh|tocak|toqac|rotondo/, 'plazh'],
  [/shkozet/, 'shkozet'],
  [/spitall/, 'spitalle'],
  [/porto\s*romano/, 'porto-romano'],
  [/arapaj|арапай/, 'arapaj'],
  [/manez|манез/, 'manez'],
  [/xhafzotaj|джафзотай/, 'xhafzotaj'],
  [/shkallnur|шкальнур/, 'shkallnur'],
  [/shijak/, 'shijak'],
  [/fllake/, 'fllake'],
  [/sukth/, 'sukth'],
  [/koxhas/, 'koxhas'],
  [/maminas/, 'maminas'],
  [/rrashbull/, 'rrashbull'],
  [/kavaj|кавая|кавае/, 'kavaje'],
  // Tirana
  [/kodra e diellit/, 'kodra-e-diellit'],
  [/kashar/, 'kashar'],
  [/blloku/, 'blloku'],
  [/laprak/, 'laprake'],
  [/rinas/, 'rinas'],
  [/\bsauk/, 'sauk'],
  [/fark[ëe]|lund[ëe]r|\bteg\b/, 'farke-lunder'],
  [/kamez|kam[ëe]z/, 'kamez'],
  [/yzberisht/, 'yzberisht'],
  [/kombinat/, 'kombinat'],
  [/don bosko/, 'don-bosko'],
  [/fresku/, 'fresku'],
  [/ali demi/, 'ali-demi'],
  [/kinostudio/, 'kinostudio'],
  [/liqeni artificial|parku i madh/, 'liqeni-artificial'],
  [/pazari i ri/, 'pazari-i-ri'],
  [/komuna e parisit/, 'komuna-e-parisit'],
  [/myslym shyri/, 'myslym-shyri'],
  [/21 dhjetori/, '21-dhjetori'],
  [/astir|unaza e re/, 'astir-unaza-e-re'],
  [/bulevardi i ri/, 'bulevardi-i-ri'],
  [/rruga e elbasanit/, 'rruga-e-elbasanit'],
  [/liqeni i thate/, 'liqeni-i-thate'],
  [/paskuqan/, 'paskuqan'],
  // Vlorë
  [/lungo\s*mare|лунгомаре/, 'lungomare'],
  [/uji i ftohte|уйи и фтохте/, 'uji-i-ftohte'],
  [/orikum/, 'orikum'],
  [/jonufer|radhim/, 'jonufer-radhime'],
  [/skele/, 'skele-vlore'],
  [/transballkanik/, 'transballkanike'],
  [/akerni/, 'akernia'],
  // Sarandë
  [/ksamil/, 'ksamil'],
  [/gjiri i hartes/, 'gjiri-i-hartes'],
  [/butrint/, 'rruga-butrinti'],
  [/\bport/, 'zona-e-portit'],
  // Shëngjin
  [/rana e hedhur|рана е хедур/, 'rana-e-hedhur'],
  [/\btale\b/, 'tale'],
  // Himarë
  [/lukov/, 'lukove'],
  // The town proper, whichever town it is.
  [
    /\bcent(?:re|er)\b|central|qend[eë]r|центр|durres city|city of durres|в городе дуррес|sports palace|дворца спорта|globe|bus station|автовокзал|villa zogu|вилла зогу|vollg|volga|волга/,
    'CENTER',
  ],
]

/** Cactus "typeOfProperty" to our propertyType slugs. */
const TYPE_SLUGS: Record<string, string> = {
  apartment: 'apartment',
  house: 'house',
  villa: 'villa',
  land: 'land',
  office: 'office',
  hotel: 'commercial-space',
  'commercial property': 'commercial-space',
}

/**
 * The title corrects the agency's type on a handful of records: a hotel
 * filed as Villa, a cafe filed as Office, a garage or a shop filed as
 * Apartment. A title that opens with a commercial noun and names no dwelling
 * is commercial space.
 */
const COMMERCIAL_TITLE =
  /^(?:commercial|garage|beauty salon|hotel|\d+-storey hotel|shop|store|for sell for an office|premises|коммерч|гараж|отель|салон)/
const OFFICE_TITLE = /\boffice\b|офис/
const HOTEL_TITLE = /\bhotel\b|отель/
const DWELLING_TITLE = /^\s*\d\s*\+|apartment|studio|студия|квартир|penthouse|пентхаус|villa|вилла|house|дом\b|townhou/

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

/** Zero-width characters and the braille blank the agency's editor leaves behind. */
function stripInvisible(text: string): string {
  return text.replace(/[​-‍⁠﻿⠀]/g, '')
}

function cleanTitle(title: string): string {
  return stripInvisible(title)
    .replace(/[\p{Extended_Pictographic}️]/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*,/g, ',')
    .replace(/\s*,\s*$/, '')
    .trim()
}

/**
 * The agency's price line comes out — the price is a field — along with
 * hashtags, phone numbers, emails and any line that names the agency.
 */
function cleanDescription(text: string): string {
  return stripInvisible(text)
    .replace(/\s*(?:Price|Цена)\s*:[^\n]*/gi, '')
    .replace(/\((?:object|объект|item)?\s*\d{6}-\d{1,2}(?:\s*,\s*\d{6}-\d{1,2})*\)\.?/gi, '')
    .split('\n')
    .map((line) =>
      line
        .replace(/#[\p{L}\p{N}_]+/gu, '')
        .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '')
        .replace(/(?:\+?355|\b0)\s?6\d[\s-]?\d{3}[\s-]?\d{3,4}\b/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((line) => {
      if (!line) return false
      if (/cactus/i.test(line)) return false
      if (/^\+?\d[\d\s/+.-]{7,}$/.test(line)) return false
      if (/^[^\p{L}\p{N}]+$/u.test(line)) return false
      return true
    })
    .join('\n')
    .trim()
}

/** The first sentence, at most 160 characters. */
function firstSentence(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  const sentence = flat.split(/(?<=[.!?])\s+/)[0] || flat
  if (sentence.length <= 160) return sentence
  const cut = sentence.slice(0, 157)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 100))}…`
}

/** The agency's object code, "250226-6", from the price line. */
function objectCode(row: Source): string {
  const m = /\b(\d{6}-\d{1,2})\b/.exec(`${row.descriptionEnglish ?? ''}\n${row.descriptionRussian ?? ''}`)
  return m ? m[1] : ''
}

function priceLines(row: Source): string[] {
  return `${row.descriptionEnglish ?? ''}\n${row.descriptionRussian ?? ''}`.match(/(?:Price|Цена)\s*:[^\n]*/gi) ?? []
}

/** Whether the agency's price line quotes a rate per square metre. */
function textSaysPerSqm(row: Source): boolean {
  return priceLines(row).some((l) => /\/\s*(?:sq|m²|m2|м\.?\s*кв)|per\s+(?:square|sq)|за\s+\d*\s*м/i.test(l))
}

/**
 * The total the agency's own price line states — "Price: €145,000",
 * "Цена: 1 700 000€" — to check the price field against. The field is what
 * is imported; the text catches a field typed without its thousands (620
 * for 620 000) or left empty.
 */
function priceFromText(row: Source): number {
  const isRate = (l: string) => /\/\s*(?:sq|m²|m2|м\.?\s*кв)|per\s+(?:square|sq)|за\s+\d*\s*м/i.test(l)
  // A total first; a line that quotes a rate ("Price: €1,250/m²") only when
  // there is nothing else.
  const lines = priceLines(row).sort((a, b) => Number(isRate(a)) - Number(isRate(b)))
  for (const line of lines) {
    const cleaned = line
      .replace(/^(?:Price|Цена)\s*:/i, '')
      .replace(/\(?(?:object|объект|item)?\s*\d{6}-\d{1,2}(?:\s*,\s*\d{6}-\d{1,2})*\)?/gi, '')
      .replace(/\s+/g, ' ')
    const m = /(\d{1,3}(?:[\s,.]\d{3})+|\d{4,7})/.exec(cleaned)
    if (!m) continue
    const n = Number(m[1].replace(/[\s,.]/g, ''))
    if (Number.isFinite(n) && n > 0) return n
  }
  return 0
}

type Rooms = {bedrooms?: number; rooms?: number; bathrooms?: number; studio: boolean}

/**
 * "2+1" is two bedrooms and a living room: bedrooms 2, rooms 3. "2+1+2" adds
 * two bathrooms. "Studio" is one room with no separate bedroom; "open space"
 * is one room. A plain number is the room count (hotels, whole houses).
 */
function parseRooms(notation: string): Rooms {
  const t = fold(notation).trim()
  if (!t) return {studio: false}
  if (/studio|студия/.test(t)) return {bedrooms: 0, rooms: 1, studio: true}
  if (/open\s*space/.test(t)) return {rooms: 1, studio: false}
  let m = /^(\d+)\s*\+\s*(\d+)(?:\s*\+\s*(\d+))?/.exec(t)
  if (m) {
    const bedrooms = Number(m[1])
    const rooms = bedrooms + Number(m[2])
    return {bedrooms, rooms, ...(m[3] ? {bathrooms: Number(m[3])} : {}), studio: false}
  }
  m = /^(\d+)\s*\+?\s*$/.exec(t)
  if (m) return {rooms: Number(m[1]), studio: false}
  return {studio: false}
}

function roomsFor(row: Source): Rooms {
  const fromField = parseRooms(row.roomsEnglish || row.roomsRussian || '')
  if (fromField.rooms !== undefined) return fromField
  const title = `${row.titleEnglish ?? ''} ${row.titleRussian ?? ''}`
  if (/studio|студия/i.test(title) && !/\d\s*\+\s*\d/.test(title)) return {bedrooms: 0, rooms: 1, studio: true}
  const m = /(\d)\s*\+\s*(\d)(?:\s*\+\s*(\d))?/.exec(title)
  if (m) return {bedrooms: Number(m[1]), rooms: Number(m[1]) + Number(m[2]), ...(m[3] ? {bathrooms: Number(m[3])} : {}), studio: false}
  return {studio: false}
}

function typeFor(row: Source, rooms: Rooms): string {
  const title = fold(cleanTitle(row.titleEnglish ?? ''))
  const fromSource = TYPE_SLUGS[fold(row.type ?? '').trim()] ?? ''
  if (COMMERCIAL_TITLE.test(title) && !DWELLING_TITLE.test(title)) {
    return OFFICE_TITLE.test(title) && !/commercial|premises|cafe|shop|store/.test(title) ? 'office' : 'commercial-space'
  }
  if (fromSource === 'office' && /cafe|shop|store|salon|commercial/.test(title)) return 'commercial-space'
  if ((fromSource === 'villa' || fromSource === 'house') && HOTEL_TITLE.test(title)) return 'commercial-space'
  if (fromSource === 'apartment' || !fromSource) {
    if (/penthouse|пентхаус/.test(title)) return 'penthouse'
    if (rooms.studio) return 'studio'
    return 'apartment'
  }
  return fromSource
}

/** Cactus "stateEnglish"/"stateRussian" to our construction stage. */
function stageFor(row: Source, typeSlug: string): string {
  if (typeSlug === 'land') return ''
  const state = fold(`${row.stateEnglish ?? ''} ${row.stateRussian ?? ''}`)
  if (/being built|under construction|unfinished|строит|недостро/.test(state)) return 'under-construction'
  if (/plot of land|for construction/.test(state)) return ''
  return 'completed'
}

/**
 * The year the keys are promised, out of the description — the schema asks
 * for one on anything unfinished. A year already past is not returned: the
 * record is stale rather than due next year, and the report counts it.
 */
function handoverFrom(text: string): number {
  const thisYear = new Date().getFullYear()
  const years = [...text.matchAll(/\b(20[2-3]\d)\b/g)].map((m) => Number(m[1])).filter((y) => y >= 2020 && y <= 2035)
  const future = years.filter((y) => y >= thisYear)
  return future.length ? Math.min(...future) : 0
}

function toNumber(s: string): number {
  return Number(s.replace(/\s/g, '').replace(',', '.'))
}

/**
 * The plot a house or villa stands on, out of the text: "with a plot of 500
 * sq.m", "land 304.6 sq.m", "The land is 370 sq", "участок 400 м.кв", or a
 * title's "265 sq.m and 593 sq.m" where the second figure is the land.
 */
function plotAreaFrom(row: Source, area: number): number {
  const text = `${row.titleEnglish ?? ''}\n${row.titleRussian ?? ''}\n${row.descriptionEnglish ?? ''}\n${row.descriptionRussian ?? ''}`
  const patterns = [
    /(?:plot|land|truall|trual|земл[яией]|участ\w*)[^\d\n]{0,40}?(\d[\d\s]*(?:[.,]\d+)?)\s*(?:sq|m²|m2|м\.?\s*кв|кв\.?\s*м|square)/i,
    /(\d[\d\s]*(?:[.,]\d+)?)\s*(?:sq\.?\s*m\.?|м\.?\s*кв\.?|m²|m2)\s*(?:of\s+)?(?:land|plot|земл|участ)/i,
    /\d+(?:[.,]\d+)?\s*(?:sq\.?\s*m\.?|м\.?\s*кв\.?)\s*(?:and|и|\+)\s*(\d+(?:[.,]\d+)?)\s*(?:sq|м\.?\s*кв)/i,
  ]
  for (const re of patterns) {
    const m = re.exec(text)
    if (!m) continue
    const n = toNumber(m[1])
    if (Number.isFinite(n) && n > 0 && n !== area) return n
  }
  return 0
}

// --- coordinates ---

type Pin = {lat: number; lng: number; precision: 'exact' | 'approximate'; note?: string}
type GmapsCache = Record<string, Pin>

/**
 * The browser-resolved pins, keyed by the link without its query string
 * (`?g_st=ic` and the like vary between copies of the same link).
 */
function loadCache(): GmapsCache {
  if (!fs.existsSync(GMAPS_CACHE)) return {}
  try {
    return JSON.parse(fs.readFileSync(GMAPS_CACHE, 'utf8')) as GmapsCache
  } catch (err) {
    console.log(`   could not read ${GMAPS_CACHE}: ${err instanceof Error ? err.message : err}`)
    return {}
  }
}

function normaliseLink(link: string): string {
  return link.trim().replace(/[?#].*$/, '')
}

/** The one link that carries its coordinates in the open: maps.google.com?q=lat,lng. */
function pinFromUrl(link: string): Pin | null {
  const m = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/.exec(link)
  return m ? {lat: Number(m[1]), lng: Number(m[2]), precision: 'exact', note: 'q= in the link itself'} : null
}

function pinFor(link: string, cache: GmapsCache): Pin | null {
  const key = normaliseLink(link)
  const cached = cache[key] ?? cache[link.trim()]
  if (cached && typeof cached.lat === 'number' && typeof cached.lng === 'number') return cached
  return pinFromUrl(link)
}

function inAlbania(p: {lat: number; lng: number}): boolean {
  return p.lat >= ALBANIA.latMin && p.lat <= ALBANIA.latMax && p.lng >= ALBANIA.lngMin && p.lng <= ALBANIA.lngMax
}

// --- photos ---

/** The Sanity asset's content hash out of its CDN filename. */
function photoPublicId(url: string): string {
  return (url.split('/').pop() || '').replace(/\.[a-z0-9]+$/i, '')
}

async function uploadPhoto(url: string, publicId: string) {
  const res = await fetch(url, {headers: {'User-Agent': UA}})
  if (!res.ok) throw new Error(`photo ${res.status} ${url}`)
  const bytes = Buffer.from(await res.arrayBuffer())
  const ext = (url.match(/\.(jpe?g|png|webp)(?:\?|$)/i)?.[1] ?? 'jpg').toLowerCase()
  return client.assets.upload('image', bytes, {
    filename: `${publicId}.${ext}`,
    description: `Imported from Cactus Real Estate (partner listing). Source: ${url}`,
  })
}

// --- source ---

async function fetchSource(): Promise<Source[]> {
  const res = await fetch(`${SOURCE_API}?query=${encodeURIComponent(SOURCE_QUERY)}`, {headers: {'User-Agent': UA}})
  if (!res.ok) throw new Error(`source API ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const body = (await res.json()) as {result?: Source[]}
  if (!Array.isArray(body.result)) throw new Error('source API returned no result array')
  return body.result
}

type Plan = {
  row: Source
  code: string
  citySlug: string
  cityCorrected: boolean
  districtSlug: string
  districtSource: 'rule' | 'city' | ''
  typeSlug: string
  rooms: Rooms
  price: number
  perSqm: boolean
  area: number
  plotArea: number
  stage: string
  handoverYear: number
  coords: Pin | null
  title: {en: string; ru: string}
  description: {en: string; ru: string}
  photos: string[]
}

async function main() {
  const all = await fetchSource()
  const rentals = all.filter((r) => fold(r.deal ?? '') !== 'sell')
  const sales = all.filter((r) => fold(r.deal ?? '') === 'sell')
  const noCity = sales.filter((r) => !CITY_MAP[fold(r.city ?? '').trim()])
  const noCityIds = new Set(noCity.map((r) => r._id))
  let rows = sales.filter((r) => !noCityIds.has(r._id))
  if (only.length) {
    rows = rows.filter((r) => {
      const code = objectCode(r)
      return only.some((o) => r._id.startsWith(o) || (code && code === o.replace(/^CACTUS-/i, '')))
    })
  }
  if (limitArg > 0) rows = rows.slice(0, limitArg)

  const [cities, districts, existingTypes, existingAgent, existingCount] = await Promise.all([
    client.fetch<Array<{slug: string; _id: string}>>(`*[_type=="city"]{_id, "slug": slug.current}`),
    client.fetch<Array<{slug: string; _id: string; city: string; isPublished: boolean | null}>>(
      `*[_type=="district"]{_id, "slug": slug.current, "city": city->slug.current, isPublished}`,
    ),
    client.fetch<Array<{slug: string; _id: string}>>(`*[_type=="propertyType"]{_id, "slug": slug.current}`),
    client.fetch<{_id: string} | null>(`*[_type=="agent" && slug.current==$s][0]{_id}`, {s: AGENT.slug}),
    client.fetch<number>(`count(*[_type=="property" && _id match $p])`, {p: `property-${PARTNER}-*`}),
  ])
  const cityBySlug = new Map(cities.map((c) => [c.slug, c._id]))
  const districtBySlug = new Map(districts.map((d) => [d.slug, d]))
  const typeBySlug = new Map(existingTypes.map((t) => [t.slug, t._id]))
  if (existingAgent && existingAgent._id !== AGENT.id) {
    console.error(`An agent with slug "${AGENT.slug}" already exists as ${existingAgent._id}, not ${AGENT.id}.`)
    process.exit(1)
  }

  const cityFor = (row: Source): {citySlug: string; impliedDistrict: string; corrected: boolean} => {
    const mapped = CITY_MAP[fold(row.city ?? '').trim()]
    const title = fold(`${row.titleEnglish ?? ''} ${row.titleRussian ?? ''}`)
    for (const [re, slug] of CITY_FROM_TITLE) {
      if (re.test(title) && slug !== mapped.city) return {citySlug: slug, impliedDistrict: '', corrected: true}
    }
    return {citySlug: mapped.city, impliedDistrict: mapped.district ?? '', corrected: false}
  }

  const districtFor = (row: Source, citySlug: string): string => {
    const haystacks = [
      fold(row.titleEnglish ?? ''),
      fold(row.titleRussian ?? ''),
      fold(row.descriptionEnglish ?? ''),
      fold(row.descriptionRussian ?? ''),
    ]
    for (const [i, text] of haystacks.entries()) {
      if (!text) continue
      for (const [re, target] of DISTRICT_RULES) {
        // The centre catch-all is for titles only: every description mentions
        // "the centre" of something.
        if (target === 'CENTER' && i > 1) continue
        if (!re.test(text)) continue
        const slug = target === 'CENTER' ? CENTER_BY_CITY[citySlug] : target
        const district = slug ? districtBySlug.get(slug) : undefined
        if (district && district.city === citySlug) return slug
      }
    }
    return ''
  }

  // --- coordinates, from the browser-resolved cache ---
  const cache = loadCache()
  const cacheExists = fs.existsSync(GMAPS_CACHE)
  const linked = rows.filter((r) => (r.locationGmapsLink ?? '').trim())

  // --- plan ---
  const problems: string[] = []
  const unmatched: string[] = []
  const priceWarnings: string[] = []
  const priceMismatch: string[] = []
  const outsideAlbania: string[] = []
  const unresolvedLinks: string[] = []
  const noHandover: string[] = []
  const corrected: string[] = []

  const plan: Plan[] = rows.map((row) => {
    const code = objectCode(row)
    const label = `${code || row._id.slice(0, 8)}: ${cleanTitle(row.titleEnglish ?? '').slice(0, 60)}`
    const {citySlug, impliedDistrict, corrected: cityCorrected} = cityFor(row)
    if (cityCorrected) corrected.push(`${label} — "${row.city}" → ${citySlug}`)
    if (!cityBySlug.has(citySlug)) problems.push(`${label}: city "${citySlug}" does not exist`)

    let districtSlug = districtFor(row, citySlug)
    let districtSource: Plan['districtSource'] = districtSlug ? 'rule' : ''
    if (!districtSlug && impliedDistrict && districtBySlug.get(impliedDistrict)?.city === citySlug) {
      districtSlug = impliedDistrict
      districtSource = 'city'
    }
    if (!districtSlug) unmatched.push(`${label} [${citySlug}] | ${cleanTitle(row.titleRussian ?? '').slice(0, 50)}`)

    const rooms = roomsFor(row)
    let typeSlug = typeFor(row, rooms)
    if (!typeBySlug.has(typeSlug)) {
      if (typeBySlug.has('commercial-space') && ['office', 'studio', 'penthouse'].includes(typeSlug)) {
        typeSlug = typeSlug === 'studio' || typeSlug === 'penthouse' ? 'apartment' : 'commercial-space'
      }
      if (!typeBySlug.has(typeSlug)) problems.push(`${label}: propertyType "${typeSlug}" does not exist`)
    }

    const fieldPrice = typeof row.price === 'number' && Number.isFinite(row.price) && row.price > 0 ? Math.round(row.price) : 0
    const textPrice = priceFromText(row)
    // A small figure is a rate only when the agency's own line says so; a
    // total whose line also quotes "or 3100€/m²" stays a total.
    const perSqm = fieldPrice > 0 && fieldPrice < IMPLAUSIBLE_UNDER && textSaysPerSqm(row)
    let price = fieldPrice
    if (!perSqm && fieldPrice < IMPLAUSIBLE_UNDER && textPrice >= IMPLAUSIBLE_UNDER) {
      // The field was typed without its thousands or left empty; the text has the total.
      price = textPrice
      priceWarnings.push(`${label} — field €${fieldPrice || 'empty'}, text says €${textPrice} → imported €${textPrice}`)
    } else if (price > 0 && price < IMPLAUSIBLE_UNDER) {
      priceWarnings.push(`${label} — €${price}${perSqm ? ' (text says per m², stored as a rate)' : ' (no total in the text either)'}`)
    } else if (price > 0 && textPrice > 0 && !perSqm && Math.abs(price - textPrice) / price > 0.01) {
      priceMismatch.push(`${label} — field €${price}, text €${textPrice} (field kept)`)
    }

    const area = row.areaActual || row.areaCertificate || 0
    const plotArea = ['house', 'villa', 'land'].includes(typeSlug) ? plotAreaFrom(row, area) : 0
    const stage = stageFor(row, typeSlug)
    const handoverYear = stage === 'under-construction' ? handoverFrom(`${row.descriptionEnglish ?? ''}\n${row.descriptionRussian ?? ''}`) : 0
    if (stage === 'under-construction' && !handoverYear) noHandover.push(label)

    let coords: Plan['coords'] = null
    const link = (row.locationGmapsLink ?? '').trim()
    if (link) {
      const pin = pinFor(link, cache)
      if (!pin) unresolvedLinks.push(`${label} — ${normaliseLink(link)}`)
      else if (!inAlbania(pin)) outsideAlbania.push(`${label} — ${pin.lat},${pin.lng}`)
      else coords = pin
    }

    const titleEn = cleanTitle(row.titleEnglish ?? '') || cleanTitle(row.titleRussian ?? '') || code || row._id.slice(0, 8)
    const titleRu = cleanTitle(row.titleRussian ?? '') || titleEn
    const descEn = cleanDescription(row.descriptionEnglish ?? '') || titleEn
    const descRu = cleanDescription(row.descriptionRussian ?? '') || titleRu

    const photos: string[] = []
    const seen = new Set<string>()
    for (const url of [row.mainPhotoUrl, ...(row.photos ?? []).map((p) => p?.url)]) {
      if (!url || seen.has(url)) continue
      seen.add(url)
      photos.push(url)
    }

    return {
      row,
      code,
      citySlug,
      cityCorrected,
      districtSlug,
      districtSource,
      typeSlug,
      rooms,
      price,
      perSqm,
      area,
      plotArea,
      stage,
      handoverYear,
      coords,
      title: {en: titleEn, ru: titleRu},
      description: {en: descEn, ru: descRu},
      photos: photos.slice(0, 30),
    }
  })

  const tally = (pick: (p: Plan) => string) =>
    Object.entries(
      plan.reduce<Record<string, number>>((acc, p) => {
        const k = pick(p)
        if (k) acc[k] = (acc[k] || 0) + 1
        return acc
      }, {}),
    )
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ${v}`)
      .join(', ')

  const photoCount = plan.reduce((n, p) => n + p.photos.length, 0)
  const withCoords = plan.filter((p) => p.coords).length
  const exact = plan.filter((p) => p.coords?.precision === 'exact').length

  console.log(`${all.length} records in the Cactus dataset — ${rentals.length} rentals skipped, ${noCity.length} with no city here skipped, ${rows.length} sales to import${only.length ? ` (--only ${only.join(',')})` : ''}${limitArg ? ` (--limit ${limitArg})` : ''}\n`)
  if (noCity.length) {
    console.log('NO CITY HERE (skipped):')
    for (const r of noCity) console.log(`  ${r.city}: ${cleanTitle(r.titleEnglish ?? '').slice(0, 70)}`)
    console.log('')
  }
  console.log(`  cities:      ${tally((p) => p.citySlug)}`)
  if (corrected.length) {
    console.log(`  corrected:   ${corrected.length} from the title`)
    for (const c of corrected) console.log(`                 ${c}`)
  }
  console.log(`  districts:   ${tally((p) => p.districtSlug || '(unmatched)')}`)
  console.log(`  types:       ${tally((p) => p.typeSlug)}`)
  console.log(`  stage:       ${tally((p) => p.stage || '(unset)')}`)
  console.log(`  rooms:       ${tally((p) => (p.rooms.rooms !== undefined ? `${p.rooms.bedrooms ?? '-'}/${p.rooms.rooms}` : '(none)'))}`)
  console.log(`  coordinates: ${withCoords} with (${exact} exact, ${withCoords - exact} approximate), ${plan.length - withCoords} without; links on ${linked.length} listings, cache ${cacheExists ? `${Object.keys(cache).length} entries` : 'missing — every link counts as unresolved'}`)
  console.log(`  prices:      ${plan.filter((p) => p.price > 0).length} with a figure, ${plan.filter((p) => !p.price).length} on request, ${plan.filter((p) => p.perSqm).length} per-m² rates`)
  console.log(`  photographs: ${photoCount}${skipPhotos ? ' (skipped)' : ''}`)
  console.log(`  agent:       ${existingAgent ? `exists (${existingAgent._id})` : 'to create'} — ${AGENT.name}`)
  console.log(`  existing:    ${existingCount} property-${PARTNER}-* documents already in the dataset`)
  console.log(`  published:   ${publishNow ? 'yes (--publish)' : 'no — translate the other locales first, then re-run with --publish'}`)

  if (unmatched.length) {
    console.log(`\nNO DISTRICT MATCHED (${unmatched.length}) — filed under the city alone; add rules to DISTRICT_RULES:`)
    for (const u of unmatched) console.log(`  ${u}`)
  }
  if (priceWarnings.length) {
    console.log(`\nPRICE FIELD UNDER €${IMPLAUSIBLE_UNDER} (${priceWarnings.length}) — check:`)
    for (const w of priceWarnings) console.log(`  ${w}`)
  }
  if (priceMismatch.length) {
    console.log(`\nPRICE FIELD DIFFERS FROM THE TEXT (${priceMismatch.length}) — the field is imported; ask the agency:`)
    for (const w of priceMismatch.slice(0, 20)) console.log(`  ${w}`)
    if (priceMismatch.length > 20) console.log(`  … and ${priceMismatch.length - 20} more`)
  }
  if (outsideAlbania.length) {
    console.log(`\nPIN OUTSIDE ALBANIA (${outsideAlbania.length}) — coordinates left empty:`)
    for (const w of outsideAlbania) console.log(`  ${w}`)
  }
  if (unresolvedLinks.length) {
    console.log(`\nLINK NOT RESOLVED (${unresolvedLinks.length}) — not in gmaps-cache.json; coordinates left empty, precision approximate:`)
    for (const w of unresolvedLinks) console.log(`  ${w}`)
  }
  if (noHandover.length) {
    console.log(`\nUNDER CONSTRUCTION WITHOUT A HANDOVER YEAR (${noHandover.length}) — the Studio will ask for one:`)
    for (const w of noHandover) console.log(`  ${w}`)
  }
  if (problems.length) {
    console.log(`\nPROBLEMS (${problems.length}):`)
    for (const p of problems.slice(0, 20)) console.log(`  ${p}`)
    if (problems.length > 20) console.log(`  … and ${problems.length - 20} more`)
  }

  const buildDoc = (p: Plan): Record<string, unknown> => {
    const district = p.districtSlug ? districtBySlug.get(p.districtSlug)?._id : undefined
    const bathrooms = Number(p.row.bathroomNumber)
    const baths = Number.isFinite(bathrooms) && bathrooms > 0 ? bathrooms : (p.rooms.bathrooms ?? 0)
    const rooms = p.rooms.rooms !== undefined && p.rooms.rooms >= 1 && p.rooms.rooms <= 20 ? p.rooms.rooms : undefined
    return {
      slug: {_type: 'slug', current: `${slugify(p.title.en)}-${p.code ? p.code.toLowerCase() : p.row._id.slice(0, 8)}`.slice(0, 90)},
      agent: {_type: 'reference', _ref: AGENT.id},
      city: {_type: 'reference', _ref: cityBySlug.get(p.citySlug)},
      ...(district ? {district: {_type: 'reference', _ref: district}} : {}),
      type: {_type: 'reference', _ref: typeBySlug.get(p.typeSlug)},
      status: 'sale',
      isPublished: publishNow,
      lifecycleStatus: 'active',
      price: p.price,
      priceUnit: p.perSqm ? 'per-sqm' : 'total',
      ...(p.area > 0 ? {area: p.area} : {}),
      ...(p.plotArea > 0 ? {plotArea: p.plotArea} : {}),
      ...(p.rooms.bedrooms !== undefined ? {bedrooms: p.rooms.bedrooms} : {}),
      ...(rooms !== undefined ? {rooms} : {}),
      ...(baths > 0 ? {bathrooms: baths} : {}),
      ...(p.stage ? {constructionStage: p.stage} : {}),
      ...(p.handoverYear ? {handoverYear: p.handoverYear} : {}),
      ...(p.coords ? {coordinatesLat: p.coords.lat, coordinatesLng: p.coords.lng} : {}),
      locationPrecision: p.coords ? p.coords.precision : 'approximate',
      propertyCode: p.code ? `CACTUS-${p.code}` : `CACTUS-${p.row._id.slice(0, 8)}`,
      createdAt: new Date(p.row._createdAt).toISOString(),
      'title.en': p.title.en,
      'title.ru': p.title.ru,
      'shortDescription.en': firstSentence(p.description.en),
      'shortDescription.ru': firstSentence(p.description.ru),
      'description.en': p.description.en,
      'description.ru': p.description.ru,
    }
  }

  if (isDry) {
    console.log('\nSAMPLE (5 planned documents, gallery omitted):')
    const step = Math.max(1, Math.floor(plan.length / 5))
    for (const p of plan.filter((_, i) => i % step === 0).slice(0, 5)) {
      const doc = buildDoc(p)
      console.log(`\n  property-${PARTNER}-${p.row._id}  (${p.photos.length} photos, city ${p.citySlug}, district ${p.districtSlug || '—'}${p.districtSource === 'city' ? ' via city' : ''}, type ${p.typeSlug})`)
      console.log(
        JSON.stringify(doc, null, 2)
          .split('\n')
          .map((l) => `    ${l.length > 160 ? `${l.slice(0, 157)}…` : l}`)
          .join('\n'),
      )
    }
    console.log('\nDry run — nothing written.')
    return
  }
  if (problems.length) {
    console.error('\nRefusing to write while listings cannot be placed. Fix the problems above and re-run.')
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
          noPublicLink: false,
        })
        .setIfMissing({bio: AGENT.bio})
        .unset(['facebookUrl', 'instagramUrl', 'youtubeUrl', 'telegramUrl', 'phone']),
    )
    .commit()
  console.log(`\nagent ${AGENT.id}`)

  // --- listings ---
  let done = 0
  let uploaded = 0
  for (const p of plan) {
    const docId = `property-${PARTNER}-${p.row._id}`
    const existing = await client.fetch<{gallery?: Array<Record<string, unknown> & {publicId?: string}>} | null>(
      `*[_id==$id][0]{ "gallery": gallery[]{ ..., "publicId": asset->originalFilename } }`,
      {id: docId},
    )
    const kept = (existing?.gallery ?? []).map(({publicId, ...item}) => ({
      item,
      publicId: (publicId || '').replace(/\.[a-z0-9]+$/i, ''),
    }))
    const already = new Set(kept.map((k) => k.publicId).filter(Boolean))

    const fresh: Array<Record<string, unknown>> = []
    if (!skipPhotos) {
      for (const url of p.photos) {
        const publicId = photoPublicId(url)
        if (!publicId || already.has(publicId)) continue
        try {
          const asset = await uploadPhoto(url, publicId)
          fresh.push({
            _key: slugify(publicId).slice(0, 40) || `p${fresh.length}`,
            _type: 'image',
            asset: {_type: 'reference', _ref: asset._id},
            alt: p.title.en.slice(0, 120),
          })
          uploaded += 1
          await sleep(PACE_MS)
        } catch (err) {
          console.log(`   photo failed for ${docId}: ${err instanceof Error ? err.message : err}`)
        }
      }
    }

    const doc = buildDoc(p)
    // Always a patch, never createOrReplace: the document accumulates things
    // this import does not own — translations, an editor's coordinates, a
    // hand-picked seo block — and a replace would wipe them.
    await client
      .transaction()
      .createIfNotExists({_id: docId, _type: 'property'} as never)
      .patch(docId, (q) => {
        let patch = q.set(doc).unset([...(doc.district ? [] : ['district']), 'documentation'])
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
      ? 'Published. Translate uk/sq/it/pl/de next so the other locales stop falling back.'
      : 'Left unpublished. Next: translate uk/sq/it/pl/de, run generatePropertyUrlSlugs.ts --execute, then re-run with --publish.',
  )
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
