/**
 * Import properties from DatoCMS into Sanity.
 *
 * Steps:
 *   1. Fetch all property records from DatoCMS (paginated).
 *   2. Build a city map (find existing in Sanity, create missing).
 *   3. Build a district map (extract district from description).
 *   4. Clean titles: strip CAPS, "продажа", emojis, redundant words.
 *   5. Generate localized title/desc/SEO for en/ru/sq/uk/it.
 *   6. Upload property images (or use one shared placeholder if missing).
 *   7. DELETE all existing Sanity properties (per user instruction:
 *      cities/districts NOT touched).
 *   8. Create new Sanity property documents.
 *
 * Run:
 *   npx tsx scripts/importFromDato.ts --dry-run
 *   npx tsx scripts/importFromDato.ts --execute
 *
 * Required env (.env):
 *   SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN
 *   DATO_API_TOKEN
 *
 * Optional env:
 *   DATO_PROPERTY_MODEL  (default auto-detected; set to api_key from inspectDato.ts)
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

// ---------- ENV ----------
const ENV = {
  projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  sanityToken: (process.env.SANITY_API_TOKEN || '').trim(),
  datoToken: (process.env.DATO_API_TOKEN || '').trim(),
  datoModel: (process.env.DATO_PROPERTY_MODEL || '').trim(),
}

if (!ENV.sanityToken) {
  console.error('ERROR: SANITY_API_TOKEN missing in .env')
  process.exit(1)
}
if (!ENV.datoToken) {
  console.error('ERROR: DATO_API_TOKEN missing in .env')
  process.exit(1)
}

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run') || args.includes('--dry')
const EXECUTE = args.includes('--execute')
if (!DRY && !EXECUTE) {
  console.error('Pass --dry-run or --execute')
  process.exit(1)
}

const sanity = createClient({
  projectId: ENV.projectId,
  dataset: ENV.dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: ENV.sanityToken,
})

// ---------- Dato client ----------
const DATO_BASE = 'https://site-api.datocms.com'
async function dato<T = any>(pathStr: string): Promise<T> {
  const res = await fetch(`${DATO_BASE}${pathStr}`, {
    headers: {
      Authorization: `Bearer ${ENV.datoToken}`,
      Accept: 'application/json',
      'X-Api-Version': '3',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Dato ${pathStr} -> ${res.status} ${text.slice(0, 400)}`)
  }
  return res.json() as Promise<T>
}

// ---------- Utils ----------
type Locales = {en: string; ru: string; sq: string; uk: string; it: string}
const EMPTY_LOC = (): Locales => ({en: '', ru: '', sq: '', uk: '', it: ''})

const slugify = (s: string) =>
  s
    .toString()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[ёЁ]/g, 'e')
    .replace(/[а-яА-Я]/g, (ch) => {
      const map: Record<string, string> = {
        а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z',
        и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
        р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch',
        ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
      }
      return map[ch.toLowerCase()] ?? ''
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 90)

// Clean a title: strip ALL-CAPS shouting, "ПРОДАЖА"/"продажа",
// stray quotes, repeated whitespace, emoji, etc.
function cleanTitle(raw: string): string {
  if (!raw) return ''
  let s = String(raw)
    // remove emojis and pictographs
    .replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}]/gu,
      '',
    )
    // strip "продажа/продажи/продаж/прода"  ru/uk/sq/en variants
    .replace(/\bпрода(жа|жи|ж|ется|ём|ем|жу|жей)?\b/giu, '')
    .replace(/\bпро́даж\w*\b/giu, '')
    .replace(/\bпродаются?\b/giu, '')
    .replace(/\bsale\b/gi, '')
    .replace(/\bfor sale\b/gi, '')
    .replace(/\bshitje(t)?\b/gi, '') // sq for sale
    .replace(/\b(rent|аренда|оренда)\b/gi, '')
    // strip leading "!!!", "***", etc.
    .replace(/^[\s!*\-#·•·•►→]+/g, '')
    .replace(/[\s!*\-#·•·•►→]+$/g, '')
    // collapse whitespace
    .replace(/\s+/g, ' ')
    .trim()

  // De-shout: if 70%+ of letters are uppercase, convert to title case.
  const letters = s.replace(/[^A-Za-zА-Яа-яЁёЇїІіЄєҐґЇї]/g, '')
  if (letters.length > 6) {
    const upper = letters.replace(/[^A-ZА-ЯЁЇІЄҐ]/g, '')
    if (upper.length / letters.length > 0.7) {
      s = s
        .toLowerCase()
        .replace(/(^|[\s«»\"'(])(\p{L})/gu, (_m, p, c) => p + c.toUpperCase())
    }
  }

  // remove stray double quotes pairs around the whole title
  s = s.replace(/^["«»'`]+|["«»'`]+$/g, '').trim()

  return s
}

// Extract a district hint from a description.
//   Looks for patterns like "район <Name>", "rajoni i <Name>", "in the <Name> district",
//   or first capitalized word groups after common keywords.
function extractDistrict(text: string): string | null {
  if (!text) return null
  const t = text.replace(/\s+/g, ' ')
  const patterns: RegExp[] = [
    /район\s+([«"']?)([А-ЯA-ZЁЇІЄҐ][\p{L}\-' ]{2,40}?)\1[,.;\n]/u,
    /у\s+район[іеу]\s+([А-ЯA-ZЁЇІЄҐ][\p{L}\- ]{2,40}?)[,.;\n]/u,
    /в\s+район[еау]\s+([А-ЯA-ZЁЇІЄҐ][\p{L}\- ]{2,40}?)[,.;\n]/u,
    /rajon[ai]?\s+i?\s+([A-ZA-ZË][\p{L}\- ]{2,40}?)[,.;\n]/u,
    /rajoni\s+([A-ZA-ZË][\p{L}\- ]{2,40}?)[,.;\n]/u,
    /\bin\s+the\s+([A-Z][\p{L}\- ]{2,40}?)\s+district\b/u,
    /\b([A-Z][\p{L}\-]{2,30})\s+district\b/u,
    /район[е,]\s*([А-ЯA-ZЁЇІЄҐ][\p{L}\-' ]{2,30})/u,
  ]
  for (const re of patterns) {
    const m = t.match(re)
    if (m) {
      const name = (m[2] || m[1] || '').trim().replace(/[«»"']/g, '')
      if (name && name.length >= 3) return name
    }
  }
  return null
}

// Extract city hint from description if Dato record didn't expose it.
function extractCityHint(text: string, knownCities: string[]): string | null {
  if (!text) return null
  const lower = text.toLowerCase()
  for (const c of knownCities) {
    if (lower.includes(c.toLowerCase())) return c
  }
  return null
}

const COMMON_AL_CITIES = [
  'Tirana', 'Tirane', 'Tiranë',
  'Durres', 'Durrës',
  'Vlora', 'Vlorë',
  'Saranda', 'Sarandë',
  'Shkoder', 'Shkodër',
  'Korca', 'Korçë',
  'Berat',
  'Gjirokaster', 'Gjirokastër',
  'Fier',
  'Lushnje',
  'Pogradec',
  'Lezhe', 'Lezhë',
  'Elbasan',
  'Kavaja', 'Kavajë',
  'Ksamil',
  'Himara', 'Himarë',
  'Golem',
  'Lalez', 'Lalëz',
]

// Locale fallback: copy primary string into all languages (user later edits).
function asLocalized(primary: string): Locales {
  return {en: primary, ru: primary, sq: primary, uk: primary, it: primary}
}

// Try to read multilingual fields from Dato record value (could be string or
// {en,...} or array of locale objects). Returns 5-locale object.
function readDatoMultilang(val: any): Locales {
  if (val == null) return EMPTY_LOC()
  if (typeof val === 'string') return asLocalized(val)
  if (typeof val === 'object') {
    // shape: {en: 'x', ru: 'y', ...}
    const keys = Object.keys(val)
    if (keys.length && keys.some((k) => /^[a-z]{2}(-[A-Z]{2})?$/.test(k))) {
      const get = (lang: string, ...alts: string[]) => {
        for (const k of [lang, ...alts]) if (val[k]) return String(val[k])
        return ''
      }
      const en = get('en', 'en-US', 'en-GB')
      const ru = get('ru', 'ru-RU')
      const sq = get('sq', 'sq-AL', 'al')
      const uk = get('uk', 'uk-UA')
      const it = get('it', 'it-IT')
      // Fill missing locales with first non-empty value.
      const fallback = en || ru || sq || uk || it || ''
      return {
        en: en || fallback,
        ru: ru || fallback,
        sq: sq || fallback,
        uk: uk || fallback,
        it: it || fallback,
      }
    }
  }
  return asLocalized(String(val))
}

// SEO generators (templated). Locale-specific simple variants.
function buildSeo(args: {
  title: Locales
  city: Locales
  price: number | null
  bedrooms: number | null
  area: number | null
  status: 'sale' | 'rent' | 'short-term'
}): {
  metaTitle: Locales
  metaDescription: Locales
  keywords: Locales
  ogTitle: Locales
  ogDescription: Locales
} {
  const priceStr = args.price ? `€${Number(args.price).toLocaleString('en-US')}` : ''
  const beds = args.bedrooms ? `${args.bedrooms} bd` : ''
  const area = args.area ? `${args.area} m²` : ''

  const stTokens: Record<typeof args.status, Locales> = {
    sale: {en: 'for sale', ru: 'на продажу', sq: 'në shitje', uk: 'на продаж', it: 'in vendita'},
    rent: {en: 'for rent', ru: 'в аренду', sq: 'me qira', uk: 'в оренду', it: 'in affitto'},
    'short-term': {en: 'short-term', ru: 'посуточно', sq: 'afatshkurtër', uk: 'подобово', it: 'breve termine'},
  }
  const sTok = stTokens[args.status]

  const mkTitle = (loc: keyof Locales) =>
    [args.title[loc], sTok[loc], args.city[loc] ? `— ${args.city[loc]}` : ''].filter(Boolean).join(' ').slice(0, 60)

  const mkDesc = (loc: keyof Locales) => {
    const titleP = args.title[loc] || args.title.en
    const cityP = args.city[loc] || args.city.en
    const parts = [titleP, beds, area, priceStr, sTok[loc], cityP].filter(Boolean)
    return parts.join(' · ').slice(0, 160)
  }

  const mkKw = (loc: keyof Locales) => {
    const t = (args.title[loc] || '').toLowerCase()
    const c = (args.city[loc] || '').toLowerCase()
    return [t, c, sTok[loc], 'real estate', 'albania'].filter(Boolean).join(', ').slice(0, 200)
  }

  const locs: (keyof Locales)[] = ['en', 'ru', 'sq', 'uk', 'it']
  const acc = <K extends string>(fn: (l: keyof Locales) => string) =>
    Object.fromEntries(locs.map((l) => [l, fn(l)])) as Locales

  return {
    metaTitle: acc(mkTitle),
    metaDescription: acc(mkDesc),
    keywords: acc(mkKw),
    ogTitle: acc(mkTitle),
    ogDescription: acc(mkDesc),
  }
}

// ---------- Sanity helpers ----------
async function fetchAllSanity<T = any>(query: string, params?: Record<string, unknown>) {
  return sanity.fetch<T>(query, params || {})
}

async function findOrCreateCountry(name: string): Promise<string> {
  const slug = slugify(name)
  const existing = await fetchAllSanity<{_id: string} | null>(
    `*[_type=="country" && (slug.current==$slug || lower(title)==lower($name))][0]{_id}`,
    {slug, name},
  )
  if (existing?._id) return existing._id
  if (DRY) return `country-DRY-${slug}`
  const doc = await sanity.create({
    _type: 'country',
    title: name,
    slug: {_type: 'slug', current: slug},
    code: name.slice(0, 2).toUpperCase(),
  })
  return doc._id
}

async function findOrCreateCity(name: string, countryId: string): Promise<string> {
  const slug = slugify(name)
  const existing = await fetchAllSanity<{_id: string} | null>(
    `*[_type=="city" && (slug.current==$slug || title.en==$name || title.sq==$name || title.ru==$name)][0]{_id}`,
    {slug, name},
  )
  if (existing?._id) return existing._id
  if (DRY) return `city-DRY-${slug}`
  const doc = await sanity.create({
    _type: 'city',
    title: asLocalized(name),
    slug: {_type: 'slug', current: slug},
    country: {_type: 'reference', _ref: countryId},
    isPublished: true,
    popular: false,
  })
  console.log(`  + city created: ${name} (${slug})`)
  return doc._id
}

async function findOrCreateDistrict(
  name: string,
  cityId: string,
): Promise<string | null> {
  if (!name) return null
  const slug = slugify(name)
  if (!slug) return null
  const existing = await fetchAllSanity<{_id: string} | null>(
    `*[_type=="district" && city._ref==$cityId && (slug.current==$slug || title.en==$name || title.sq==$name || title.ru==$name)][0]{_id}`,
    {cityId, slug, name},
  )
  if (existing?._id) return existing._id
  if (DRY) return `district-DRY-${slug}`
  const doc = await sanity.create({
    _type: 'district',
    title: asLocalized(name),
    slug: {_type: 'slug', current: slug},
    city: {_type: 'reference', _ref: cityId},
    isPublished: true,
    popular: false,
  })
  console.log(`    + district created: ${name} (${slug})`)
  return doc._id
}

let placeholderAssetId: string | null = null
async function getPlaceholderImage(): Promise<string> {
  if (placeholderAssetId) return placeholderAssetId
  if (DRY) return (placeholderAssetId = 'image-PLACEHOLDER-DRY')
  console.log('  uploading shared placeholder image...')
  const res = await fetch('https://picsum.photos/seed/domlivo-placeholder/1200/800')
  if (!res.ok) throw new Error('placeholder fetch failed')
  const buffer = Buffer.from(await res.arrayBuffer())
  const asset = await sanity.assets.upload('image', buffer, {
    filename: 'imported-placeholder.jpg',
  })
  placeholderAssetId = asset._id
  return asset._id
}

const datoAssetCache = new Map<string, string>()
async function uploadDatoAsset(url: string, filename = 'dato-image.jpg'): Promise<string | null> {
  if (!url) return null
  if (datoAssetCache.has(url)) return datoAssetCache.get(url)!
  if (DRY) {
    const id = `image-DRY-${datoAssetCache.size}`
    datoAssetCache.set(url, id)
    return id
  }
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`    [warn] image ${url} -> ${res.status}`)
      return null
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    const asset = await sanity.assets.upload('image', buffer, {filename})
    datoAssetCache.set(url, asset._id)
    return asset._id
  } catch (e) {
    console.warn(`    [warn] image upload failed ${url}: ${(e as Error).message}`)
    return null
  }
}

// Resolve DatoCMS upload reference to URL.
// Dato uploads return file under attributes.url (we fetch via /uploads/:id).
async function resolveDatoUploadUrl(uploadId: string): Promise<string | null> {
  if (!uploadId) return null
  try {
    const r = await dato<{data: any}>(`/uploads/${uploadId}`)
    const u = r?.data?.attributes?.url
    return u || null
  } catch {
    return null
  }
}

// ---------- Field mapping helpers ----------
function pickField(record: any, candidates: string[]): any {
  for (const k of candidates) {
    if (record?.[k] !== undefined && record?.[k] !== null && record?.[k] !== '') {
      return record[k]
    }
  }
  return undefined
}

function pickNumber(record: any, candidates: string[]): number | null {
  const v = pickField(record, candidates)
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d.,-]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function pickBool(record: any, candidates: string[]): boolean | null {
  const v = pickField(record, candidates)
  if (v == null) return null
  if (typeof v === 'boolean') return v
  return /^(1|true|yes|да|on)$/i.test(String(v))
}

// Extract image asset urls from Dato record. Dato gallery fields contain
// arrays of {upload_id} or {id} objects.
async function extractImageUrls(record: any): Promise<string[]> {
  const candidates: any[] = []
  for (const key of Object.keys(record || {})) {
    const v = record[key]
    if (Array.isArray(v) && v.length && typeof v[0] === 'object' && (v[0]?.upload_id || v[0]?.id)) {
      candidates.push(...v)
    } else if (v && typeof v === 'object' && (v.upload_id || v.id) && (v.alt !== undefined || v.url || v.format)) {
      candidates.push(v)
    }
  }
  const urls: string[] = []
  for (const c of candidates) {
    if (c.url) {
      urls.push(c.url)
    } else if (c.upload_id) {
      const u = await resolveDatoUploadUrl(c.upload_id)
      if (u) urls.push(u)
    } else if (c.id) {
      const u = await resolveDatoUploadUrl(c.id)
      if (u) urls.push(u)
    }
  }
  return urls.slice(0, 30) // schema max 30
}

// ---------- Main pipeline ----------
async function main() {
  console.log(`\n=== Domlivo: import properties from DatoCMS ===`)
  console.log(`mode: ${DRY ? 'DRY-RUN (no writes)' : 'EXECUTE'}`)
  console.log(`sanity: ${ENV.projectId}/${ENV.dataset}`)

  // Auto-detect property model in Dato unless override
  let modelKey = ENV.datoModel
  if (!modelKey) {
    const types = await dato<{data: any[]}>(`/item-types?page[limit]=500`)
    const found = types.data.find((t: any) =>
      /(property|properties|object|listing|estate|nedvizh|prodaja|prodaza|apartment|house|villa)/i.test(
        t.attributes.api_key,
      ),
    )
    if (!found) {
      console.error('Could not auto-detect property model. Set DATO_PROPERTY_MODEL in .env')
      console.error('Available models:')
      for (const t of types.data) console.error(`  ${t.attributes.api_key}`)
      process.exit(1)
    }
    modelKey = found.attributes.api_key
  }
  console.log(`dato model: ${modelKey}`)

  // Fetch all items (paginated, 100 per page)
  const all: any[] = []
  let offset = 0
  const limit = 100
  while (true) {
    const page = await dato<{data: any[]; meta: {total_count: number}}>(
      `/items?filter[type]=${modelKey}&page[limit]=${limit}&page[offset]=${offset}&version=published`,
    )
    all.push(...page.data)
    console.log(`  fetched ${all.length} / ${page.meta.total_count}`)
    if (all.length >= page.meta.total_count || page.data.length === 0) break
    offset += limit
  }
  console.log(`total dato properties: ${all.length}`)

  // Resolve required Sanity references
  const albaniaId = await findOrCreateCountry('Albania')

  const agents = await fetchAllSanity<{_id: string; name: string}[]>(
    `*[_type=="agent"]{_id, name} | order(_createdAt asc)`,
  )
  if (agents.length === 0) {
    console.error('No agent in Sanity. Create at least one agent first.')
    process.exit(1)
  }
  const defaultAgentId = agents[0]._id
  console.log(`default agent: ${agents[0].name} (${defaultAgentId})`)

  // Property types map (slug -> id)
  type PT = {_id: string; slug?: {current?: string}; titleEn?: string}
  const ptypes = await fetchAllSanity<PT[]>(
    `*[_type=="propertyType"]{_id, slug, "titleEn": title.en}`,
  )
  if (ptypes.length === 0) {
    console.error('No propertyType in Sanity. Create at least one.')
    process.exit(1)
  }
  const ptBySlug = new Map<string, string>()
  for (const p of ptypes) {
    if (p.slug?.current) ptBySlug.set(p.slug.current.toLowerCase(), p._id)
    if (p.titleEn) ptBySlug.set(p.titleEn.toLowerCase(), p._id)
  }
  const defaultPtypeId = ptypes[0]._id

  // ---------- DELETE existing properties (per request) ----------
  if (EXECUTE) {
    console.log(`\nDeleting existing properties (cities/districts kept)...`)
    const existing = await sanity.fetch<string[]>(`*[_type=="property"]._id`)
    console.log(`  found ${existing.length} existing properties`)
    let deleted = 0
    while (existing.length) {
      const batch = existing.splice(0, 100)
      const tx = sanity.transaction()
      for (const id of batch) tx.delete(id)
      await tx.commit({visibility: 'async'})
      deleted += batch.length
      console.log(`  deleted ${deleted}`)
    }
  } else {
    const cnt = await sanity.fetch<number>(`count(*[_type=="property"])`)
    console.log(`\n[dry-run] would delete ${cnt} existing properties`)
  }

  // ---------- Import each Dato property ----------
  const placeholderId = await getPlaceholderImage()

  let ok = 0
  let fail = 0
  const usedSlugs = new Set<string>()

  for (const item of all) {
    try {
      const a = item.attributes || item
      const rawTitle =
        readDatoMultilang(pickField(a, ['title', 'name', 'headline', 'heading'])).en ||
        readDatoMultilang(pickField(a, ['title', 'name', 'headline'])).ru ||
        ''
      const cleanedSourceTitle = cleanTitle(rawTitle)

      // multilingual title (one localized object across en/ru/sq/uk/it)
      const datoTitle = readDatoMultilang(pickField(a, ['title', 'name', 'headline']))
      const titleLoc: Locales = {
        en: cleanTitle(datoTitle.en) || cleanedSourceTitle,
        ru: cleanTitle(datoTitle.ru) || cleanedSourceTitle,
        sq: cleanTitle(datoTitle.sq) || cleanedSourceTitle,
        uk: cleanTitle(datoTitle.uk) || cleanedSourceTitle,
        it: cleanTitle(datoTitle.it) || cleanedSourceTitle,
      }
      // Fallback chain: any locale -> any non-empty
      const fb =
        titleLoc.en || titleLoc.ru || titleLoc.sq || titleLoc.uk || titleLoc.it || 'Property'
      for (const k of Object.keys(titleLoc) as (keyof Locales)[]) {
        if (!titleLoc[k]) titleLoc[k] = fb
      }

      // descriptions
      const datoDesc = readDatoMultilang(
        pickField(a, ['description', 'body', 'text', 'content', 'detail']),
      )
      const datoShort = readDatoMultilang(
        pickField(a, ['short_description', 'shortDescription', 'summary', 'excerpt']),
      )

      // city
      const datoCityRaw = pickField(a, ['city', 'town', 'location_city', 'place'])
      let cityName = ''
      if (datoCityRaw) {
        const v = readDatoMultilang(datoCityRaw)
        cityName = v.en || v.ru || v.sq || ''
      }
      // fallback: extract from descriptions
      const allDescBlob = [datoDesc.en, datoDesc.ru, datoDesc.sq, datoDesc.uk, datoDesc.it]
        .filter(Boolean)
        .join(' \n ')
      if (!cityName) cityName = extractCityHint(allDescBlob, COMMON_AL_CITIES) || ''
      // last fallback: extract from raw title
      if (!cityName) cityName = extractCityHint(rawTitle, COMMON_AL_CITIES) || ''
      if (!cityName) cityName = 'Tirana' // sane default for an Albania-focused site
      // normalize common aliases
      cityName = cityName
        .replace(/^Tirana$/i, 'Tirana')
        .replace(/^Tirane[ëe]?$/i, 'Tirana')
        .replace(/^Durres$/i, 'Durrës')
        .replace(/^Vlora$/i, 'Vlorë')
        .replace(/^Saranda$/i, 'Sarandë')
      const cityId = await findOrCreateCity(cityName, albaniaId)

      // district
      let districtName: string | null = null
      const datoDistrictRaw = pickField(a, ['district', 'neighborhood', 'area_name', 'rajon', 'rajoni'])
      if (datoDistrictRaw) {
        const v = readDatoMultilang(datoDistrictRaw)
        districtName = v.en || v.ru || v.sq || v.uk || v.it || null
      }
      if (!districtName) districtName = extractDistrict(allDescBlob)
      const districtId = districtName ? await findOrCreateDistrict(districtName, cityId) : null

      // status
      let status: 'sale' | 'rent' | 'short-term' = 'sale'
      const sRaw = String(pickField(a, ['status', 'listing_type', 'deal', 'transaction', 'offer_type']) || '').toLowerCase()
      if (/(rent|аренда|оренда|qira)/.test(sRaw)) status = 'rent'
      else if (/(short|day|posutoch|подобов|afatshkurt)/.test(sRaw)) status = 'short-term'

      // price
      const price = pickNumber(a, ['price', 'cost', 'amount', 'price_eur']) ?? 0

      // numeric details
      const bedrooms = pickNumber(a, ['bedrooms', 'rooms', 'beds', 'bedroom_count'])
      const bathrooms = pickNumber(a, ['bathrooms', 'baths', 'bathroom_count', 'wc'])
      const area = pickNumber(a, ['area', 'square_meters', 'm2', 'sqm', 'size'])
      const yearBuilt = pickNumber(a, ['year_built', 'year', 'built_year', 'construction_year'])

      // type
      const tRaw = String(pickField(a, ['type', 'property_type', 'category', 'kind']) || '').toLowerCase()
      let ptypeId = defaultPtypeId
      for (const [k, v] of ptBySlug.entries()) {
        if (tRaw && tRaw.includes(k)) {
          ptypeId = v
          break
        }
      }

      // coords
      const lat = pickNumber(a, ['latitude', 'lat', 'coordinates_lat'])
      const lng = pickNumber(a, ['longitude', 'lng', 'lon', 'coordinates_lng'])

      // gallery (Dato uploads)
      const imageUrls = await extractImageUrls(a)
      const galleryAssets: string[] = []
      for (const u of imageUrls) {
        const id = await uploadDatoAsset(u)
        if (id) galleryAssets.push(id)
      }
      if (galleryAssets.length === 0) galleryAssets.push(placeholderId)

      // slug
      let baseSlug = slugify(titleLoc.en || cleanedSourceTitle || `property-${item.id}`)
      if (!baseSlug) baseSlug = `property-${item.id}`
      let finalSlug = baseSlug
      let n = 1
      while (usedSlugs.has(finalSlug)) {
        n += 1
        finalSlug = `${baseSlug}-${n}`
      }
      usedSlugs.add(finalSlug)

      // SEO
      const cityLoc = asLocalized(cityName)
      const seoBlock = buildSeo({
        title: titleLoc,
        city: cityLoc,
        price: price || null,
        bedrooms: bedrooms || null,
        area: area || null,
        status,
      })

      // Build description fallback in 5 locales
      const descLoc: Locales = (() => {
        const fb =
          datoDesc.en || datoDesc.ru || datoDesc.sq || datoDesc.uk || datoDesc.it || cleanedSourceTitle
        return {
          en: datoDesc.en || fb,
          ru: datoDesc.ru || fb,
          sq: datoDesc.sq || fb,
          uk: datoDesc.uk || fb,
          it: datoDesc.it || fb,
        }
      })()
      const shortLoc: Locales = (() => {
        const fb =
          datoShort.en || datoShort.ru || datoShort.sq || datoShort.uk || datoShort.it ||
          (descLoc.en || '').slice(0, 180)
        return {
          en: datoShort.en || fb,
          ru: datoShort.ru || fb,
          sq: datoShort.sq || fb,
          uk: datoShort.uk || fb,
          it: datoShort.it || fb,
        }
      })()

      const doc: {_type: string; [key: string]: any} = {
        _type: 'property',
        title: titleLoc,
        slug: {_type: 'slug', current: finalSlug},
        shortDescription: shortLoc,
        description: descLoc,
        agent: {_type: 'reference', _ref: defaultAgentId},
        type: {_type: 'reference', _ref: ptypeId},
        status,
        isPublished: true,
        lifecycleStatus: 'active',
        price: price || 0,
        promoted: false,
        investment: false,
        city: {_type: 'reference', _ref: cityId },
        ...(districtId ? {district: {_type: 'reference', _ref: districtId}} : {}),
        ...(area ? {area} : {}),
        ...(bedrooms != null ? {bedrooms} : {}),
        ...(bathrooms != null ? {bathrooms} : {}),
        ...(yearBuilt ? {yearBuilt} : {}),
        ...(lat != null ? {coordinatesLat: lat} : {}),
        ...(lng != null ? {coordinatesLng: lng} : {}),
        gallery: galleryAssets.map((assetId, i) => ({
          _type: 'image',
          _key: `g-${i}-${Math.random().toString(36).slice(2, 8)}`,
          asset: {_type: 'reference', _ref: assetId},
          alt: `${titleLoc.en} — ${i + 1}`,
        })),
        propertyCode: `DATO-${item.id}`,
        seo: {
          metaTitle: seoBlock.metaTitle,
          metaDescription: seoBlock.metaDescription,
          keywords: seoBlock.keywords,
          ogTitle: seoBlock.ogTitle,
          ogDescription: seoBlock.ogDescription,
          noIndex: false,
          noFollow: false,
        },
        createdAt: new Date().toISOString(),
        viewCount: 0,
        saveCount: 0,
        contactCount: 0,
      }

      if (DRY) {
        console.log(
          `  [dry] ${titleLoc.en.slice(0, 60)}  city=${cityName}  district=${districtName || '—'}  €${price}`,
        )
        ok += 1
      } else {
        const created = await sanity.create(doc)
        console.log(`  + ${created._id}  ${titleLoc.en.slice(0, 60)}  €${price}`)
        ok += 1
      }
    } catch (e) {
      fail += 1
      console.error(`  X failed item id=${item.id}:`, (e as Error).message)
    }
  }

  console.log(`\nDone. ok=${ok}  fail=${fail}  total=${all.length}`)
  console.log(DRY ? '(dry-run — no documents written)' : '(real run — properties created)')
}

main().catch((e) => {
  console.error('\nFATAL:', e)
  process.exit(1)
})
cess.exit(1)
})
