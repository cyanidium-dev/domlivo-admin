/**
 * Demo content seeder for apartments.
 *
 * For every published apartment (type.slug == "apartment"), this script fills
 * the parts editors haven't filled yet, based on the RU/UK description plus
 * the basic facts already in the doc. Nothing existing is overwritten unless
 * it looks like a leftover machine-generated placeholder.
 *
 * What it sets (only if currently missing / placeholder):
 *   1. amenitiesRefs        — refs to existing amenity docs, detected from RU/UK desc
 *   2. propertyOffers       — 6 inline offer chips with iconKey + 5-locale title
 *   3. yearBuilt            — pseudo-random 2015–2024 (deterministic per _id)
 *   4. description.en, .sq  — replaced when they match the known "Property for X in
 *                             Y. Price: €Z. Area: N m². Bedrooms: B." placeholder
 *   5. title.sq, .uk        — replaced when they equal title.ru (CMS import leftover)
 *
 *   npx tsx scripts/seedDemoApartmentData.ts --dry-run
 *   npx tsx scripts/seedDemoApartmentData.ts --execute
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const isDry = process.argv.includes('--dry-run')
const isExec = process.argv.includes('--execute')
if (!isDry && !isExec) {
  console.error('Use --dry-run or --execute')
  process.exit(1)
}

const token = process.env.SANITY_API_TOKEN?.trim()
if (!token) {
  console.error('SANITY_API_TOKEN required in .env')
  process.exit(1)
}

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
})

// ─── keyword → amenity slug ───────────────────────────────────────────────────
// Lowercased description matched against these substrings.
const KEYWORD_TO_SLUG: Array<[RegExp, string]> = [
  [/кондицион|кондиціон|air[- ]condition/i, 'air-conditioning'],
  [/wi-?fi|интернет|інтернет/i, 'wifi'],
  [/балкон/i, 'balcony'],
  [/паркинг|паркінг|стоянк|место для авто|місце для авт|parking|car park/i, 'parking'],
  [/лифт|ліфт|elevator/i, 'elevator'],
  [/мебел|мебл|furnished|укомплектован/i, 'furnished'],
  [/мор[ея]\b|пляж|sea[- ]view|у моря|біля моря|с видом на море|вид на море/i, 'sea-view'],
  [/террас|тарас|тераса|terrace/i, 'terrace'],
  [/\bсад\b|двор|garden/i, 'garden'],
  [/бассейн|басейн|swimming pool|\bpool\b/i, 'swimming-pool'],
  [/фитнес|фітнес|тренажер|тренажор|gym/i, 'gym'],
  [/вид на гор|горный пейзаж|гірськ|mountain view/i, 'mountain-view'],
  [/охран|охорон|безопасн|безпек|security/i, 'security'],
  [/кладов|комора|сховище|storage room/i, 'storage-room'],
]

const COASTAL_CITY_SLUGS = new Set([
  'durres', 'vlore', 'sarande', 'ksamil', 'himare',
])

// Default amenity slugs if detection yields too few.
const FALLBACK_AMENITIES = ['wifi', 'air-conditioning', 'furnished', 'parking']

// ─── icon + i18n maps for offers ─────────────────────────────────────────────
type Loc = {en: string; uk: string; ru: string; sq: string; it: string}

const AMENITY_ICON: Record<string, string> = {
  'air-conditioning': 'snowflake',
  'wifi': 'wifi',
  'balcony': 'balcony',
  'parking': 'parking',
  'elevator': 'elevator',
  'furnished': 'sofa',
  'sea-view': 'waves',
  'terrace': 'home',
  'garden': 'tree',
  'swimming-pool': 'waves',
  'gym': 'zap',
  'mountain-view': 'tree',
  'security': 'shield',
  'storage-room': 'layout',
}

const AMENITY_TITLE: Record<string, Loc> = {
  'air-conditioning': {en: 'Air conditioning', uk: 'Кондиціонер', ru: 'Кондиционер', sq: 'Kondicioner', it: 'Aria condizionata'},
  'wifi':             {en: 'Wi-Fi',            uk: 'Wi-Fi',       ru: 'Wi-Fi',       sq: 'Wi-Fi',       it: 'Wi-Fi'},
  'balcony':          {en: 'Balcony',          uk: 'Балкон',      ru: 'Балкон',      sq: 'Ballkon',     it: 'Balcone'},
  'parking':          {en: 'Parking',          uk: 'Паркінг',     ru: 'Парковка',    sq: 'Parkim',      it: 'Parcheggio'},
  'elevator':         {en: 'Elevator',         uk: 'Ліфт',        ru: 'Лифт',        sq: 'Ashensor',    it: 'Ascensore'},
  'furnished':        {en: 'Furnished',        uk: 'Меблі',       ru: 'Мебель',      sq: 'I mobiluar',  it: 'Arredato'},
  'sea-view':         {en: 'Sea view',         uk: 'Вид на море', ru: 'Вид на море', sq: 'Pamje deti',  it: 'Vista mare'},
  'terrace':          {en: 'Terrace',          uk: 'Тераса',      ru: 'Терраса',     sq: 'Tarracë',     it: 'Terrazza'},
  'garden':           {en: 'Garden',           uk: 'Сад',         ru: 'Сад',         sq: 'Kopsht',      it: 'Giardino'},
  'swimming-pool':    {en: 'Swimming pool',    uk: 'Басейн',      ru: 'Бассейн',     sq: 'Pishinë',     it: 'Piscina'},
  'gym':              {en: 'Gym',              uk: 'Спортзал',    ru: 'Спортзал',    sq: 'Palestër',    it: 'Palestra'},
  'mountain-view':    {en: 'Mountain view',    uk: 'Вид на гори', ru: 'Вид на горы', sq: 'Pamje malore',it: 'Vista monti'},
  'security':         {en: 'Security',         uk: 'Безпека',     ru: 'Безопасность',sq: 'Siguria',     it: 'Sicurezza'},
  'storage-room':     {en: 'Storage room',     uk: 'Комора',      ru: 'Кладовая',    sq: 'Magazinë',    it: 'Ripostiglio'},
}

// English wording when amenity slug appears in description sentence
const AMENITY_EN_PHRASE: Record<string, string> = {
  'air-conditioning': 'air conditioning',
  'wifi': 'Wi-Fi',
  'balcony': 'a balcony',
  'parking': 'parking',
  'elevator': 'an elevator',
  'furnished': 'modern furniture',
  'sea-view': 'a sea view',
  'terrace': 'a terrace',
  'garden': 'a garden',
  'swimming-pool': 'a pool',
  'gym': 'a gym',
  'mountain-view': 'mountain views',
  'security': '24/7 security',
  'storage-room': 'a storage room',
}

const AMENITY_SQ_PHRASE: Record<string, string> = {
  'air-conditioning': 'kondicioner',
  'wifi': 'Wi-Fi',
  'balcony': 'ballkon',
  'parking': 'parkim',
  'elevator': 'ashensor',
  'furnished': 'mobilje moderne',
  'sea-view': 'pamje nga deti',
  'terrace': 'tarracë',
  'garden': 'kopsht',
  'swimming-pool': 'pishinë',
  'gym': 'palestër',
  'mountain-view': 'pamje malore',
  'security': 'siguri 24/7',
  'storage-room': 'magazinë',
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function djb2(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

function pseudoYearBuilt(id: string): number {
  // 2015–2024 spread, stable per doc
  return 2015 + (djb2(id) % 10)
}

function makeKey(seed: string): string {
  return `k_${djb2(seed).toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`
}

function detectAmenitySlugs(text: string, citySlug?: string): string[] {
  const found = new Set<string>()
  for (const [re, slug] of KEYWORD_TO_SLUG) if (re.test(text)) found.add(slug)
  if (citySlug && COASTAL_CITY_SLUGS.has(citySlug)) {
    // Coastal cities default to sea-view if any sea/beach mention exists
    if (/мор|пляж|sea|beach|пляж/i.test(text)) found.add('sea-view')
  }
  return Array.from(found)
}

function ensureMinAmenities(slugs: string[]): string[] {
  if (slugs.length >= 4) return slugs
  const merged = new Set(slugs)
  for (const fb of FALLBACK_AMENITIES) merged.add(fb)
  return Array.from(merged)
}

const PLACEHOLDER_RE = /^Property (?:for sale|for rent|for short-term) in [^.]+\. Price: €[\d.]+\.\s*(?:Area: [\d.]+ m²\.)?\s*(?:Bedrooms: \d+\.)?$/
const FULL_PLACEHOLDER_RE = /^(?:Apartment.*?For (?:Rent|Sale|Short-term).*?\. )?Property (?:for sale|for rent|for short-term) in [^.]+\. Price: €/

function looksLikePlaceholder(text?: string): boolean {
  if (!text) return true
  const t = text.trim()
  if (!t) return true
  return PLACEHOLDER_RE.test(t) || FULL_PLACEHOLDER_RE.test(t)
}

function priceLineEn(status: string, price: number): string {
  if (status === 'rent') return `Available for rent at €${price.toLocaleString('en-US')}/month.`
  if (status === 'short-term') return `Short-term stays from €${price.toLocaleString('en-US')}/night.`
  return `Listed for sale at €${price.toLocaleString('en-US')}.`
}

function priceLineSq(status: string, price: number): string {
  if (status === 'rent') return `Me qira për €${price.toLocaleString('en-US')}/muaj.`
  if (status === 'short-term') return `Qira afatshkurtër nga €${price.toLocaleString('en-US')}/natë.`
  return `Në shitje për €${price.toLocaleString('en-US')}.`
}

function describeEn(opts: {
  bedrooms?: number
  area?: number
  cityEn: string
  districtEn?: string
  amenitySlugs: string[]
  status: string
  price: number
}): string {
  const bed = opts.bedrooms ?? 0
  const bedClause = bed > 0 ? `${bed}-bedroom` : 'studio'
  const areaClause = opts.area ? `${opts.area} m²` : ''
  const where = opts.districtEn
    ? `in ${opts.districtEn}, ${opts.cityEn}`
    : `in ${opts.cityEn}`
  const topPhrases = opts.amenitySlugs.slice(0, 4).map((s) => AMENITY_EN_PHRASE[s]).filter(Boolean)
  let amenitiesSentence = ''
  if (topPhrases.length === 1) {
    amenitiesSentence = ` The home features ${topPhrases[0]}.`
  } else if (topPhrases.length >= 2) {
    const last = topPhrases[topPhrases.length - 1]
    amenitiesSentence = ` The home features ${topPhrases.slice(0, -1).join(', ')} and ${last}.`
  }
  const intro = `Bright ${bedClause} apartment${areaClause ? ` of ${areaClause}` : ''} ${where}, Albania.`
  return `${intro}${amenitiesSentence} ${priceLineEn(opts.status, opts.price)}`.trim()
}

function describeSq(opts: {
  bedrooms?: number
  area?: number
  citySq: string
  districtSq?: string
  amenitySlugs: string[]
  status: string
  price: number
}): string {
  const bed = opts.bedrooms ?? 0
  const bedClause = bed > 0 ? `me ${bed} dhoma gjumi` : 'studio'
  const areaClause = opts.area ? ` me sipërfaqe ${opts.area} m²` : ''
  const where = opts.districtSq
    ? `në ${opts.districtSq}, ${opts.citySq}`
    : `në ${opts.citySq}`
  const topPhrases = opts.amenitySlugs.slice(0, 4).map((s) => AMENITY_SQ_PHRASE[s]).filter(Boolean)
  let amenitiesSentence = ''
  if (topPhrases.length === 1) {
    amenitiesSentence = ` Apartamenti ofron ${topPhrases[0]}.`
  } else if (topPhrases.length >= 2) {
    const last = topPhrases[topPhrases.length - 1]
    amenitiesSentence = ` Apartamenti ofron ${topPhrases.slice(0, -1).join(', ')} dhe ${last}.`
  }
  const intro = `Apartament i ndritshëm ${bedClause}${areaClause} ${where}, Shqipëri.`
  return `${intro}${amenitiesSentence} ${priceLineSq(opts.status, opts.price)}`.trim()
}

function titleSqTemplate(bedrooms: number | null, citySq: string, _status: string): string {
  void _status
  if (!bedrooms || bedrooms <= 0) return `Studio në ${citySq}`
  return `Apartament ${bedrooms}+1 në ${citySq}`
}

function titleUkTemplate(bedrooms: number | null, cityUk: string, _status: string): string {
  void _status
  if (!bedrooms || bedrooms <= 0) return `Студіо в ${cityUk}`
  return `${bedrooms}-кімнатна квартира в ${cityUk}`
}

// ─── main ────────────────────────────────────────────────────────────────────

type Apt = {
  _id: string
  status: string
  price: number
  area?: number
  bedrooms?: number | null
  yearBuilt?: number | null
  title: Record<string, string>
  description: Record<string, string>
  amenitiesRefs?: unknown[]
  propertyOffers?: unknown[]
  city?: {slug?: string; titleEn?: string; titleSq?: string; titleUk?: string; titleRu?: string}
  district?: {titleEn?: string; titleSq?: string}
}

async function main() {
  // 1. amenity slug → _id
  const amenities = await client.fetch<Array<{_id: string; slug: string}>>(
    `*[_type=="amenity"]{_id, "slug": slug.current}`,
  )
  const amenityIdBySlug = new Map(amenities.map((a) => [a.slug, a._id]))

  // 2. apartments
  const apts = await client.fetch<Apt[]>(`
    *[_type=="property" && type->slug.current=="apartment"]{
      _id, status, price, area, bedrooms, yearBuilt,
      title, description,
      "amenitiesRefs": amenitiesRefs,
      "propertyOffers": propertyOffers,
      "city": city->{
        "slug": slug.current,
        "titleEn": title.en, "titleSq": title.sq, "titleUk": title.uk, "titleRu": title.ru
      },
      "district": district->{
        "titleEn": title.en, "titleSq": title.sq
      }
    }
  `)

  console.log(`Found ${apts.length} apartment(s).\n`)

  const plan: Array<{id: string; changes: Record<string, unknown>; summary: string[]}> = []

  for (const a of apts) {
    const textBag = [
      a.description?.ru ?? '',
      a.description?.uk ?? '',
      a.title?.ru ?? '',
      a.title?.uk ?? '',
    ].join(' ').toLowerCase()

    const detected = detectAmenitySlugs(textBag, a.city?.slug)
    const finalSlugs = ensureMinAmenities(detected)

    const changes: Record<string, unknown> = {}
    const summary: string[] = []

    // amenitiesRefs — only if currently empty
    const curAmen = Array.isArray(a.amenitiesRefs) ? a.amenitiesRefs : []
    if (curAmen.length === 0) {
      const refs = finalSlugs
        .map((slug) => amenityIdBySlug.get(slug))
        .filter((id): id is string => Boolean(id))
        .map((id) => ({_type: 'reference', _ref: id, _key: makeKey(`am-${id}`)}))
      if (refs.length > 0) {
        changes.amenitiesRefs = refs
        summary.push(`amenitiesRefs: +${refs.length} (${finalSlugs.join(', ')})`)
      }
    }

    // propertyOffers — only if currently empty; top 6
    const curOffers = Array.isArray(a.propertyOffers) ? a.propertyOffers : []
    if (curOffers.length === 0) {
      const top = finalSlugs.slice(0, 6)
      const offers = top
        .map((slug) => {
          const title = AMENITY_TITLE[slug]
          const icon = AMENITY_ICON[slug]
          if (!title || !icon) return null
          return {
            _type: 'propertyOffer',
            _key: makeKey(`of-${slug}-${a._id}`),
            title: {_type: 'localizedString', ...title},
            iconKey: icon,
          }
        })
        .filter(Boolean) as unknown[]
      if (offers.length > 0) {
        changes.propertyOffers = offers
        summary.push(`propertyOffers: +${offers.length}`)
      }
    }

    // yearBuilt — only if currently null/undefined
    if (a.yearBuilt == null) {
      changes.yearBuilt = pseudoYearBuilt(a._id)
      summary.push(`yearBuilt: ${changes.yearBuilt}`)
    }

    // description.en / .sq — replace placeholders only
    const enCurrent = a.description?.en
    const sqCurrent = a.description?.sq
    if (looksLikePlaceholder(enCurrent) || looksLikePlaceholder(sqCurrent)) {
      const cityEn = a.city?.titleEn || 'Albania'
      const citySq = a.city?.titleSq || a.city?.titleEn || 'Shqipëri'
      const districtEn = a.district?.titleEn
      const districtSq = a.district?.titleSq || a.district?.titleEn
      const nextEn = describeEn({
        bedrooms: a.bedrooms ?? 0,
        area: a.area,
        cityEn,
        districtEn,
        amenitySlugs: finalSlugs,
        status: a.status,
        price: a.price,
      })
      const nextSq = describeSq({
        bedrooms: a.bedrooms ?? 0,
        area: a.area,
        citySq,
        districtSq,
        amenitySlugs: finalSlugs,
        status: a.status,
        price: a.price,
      })
      const nextDesc: Record<string, string> = {
        _type: 'localizedText' as unknown as string,
        ...(a.description as Record<string, string> | undefined),
      }
      if (looksLikePlaceholder(enCurrent)) nextDesc.en = nextEn
      if (looksLikePlaceholder(sqCurrent)) nextDesc.sq = nextSq
      changes.description = nextDesc
      summary.push(`description.en/sq regenerated`)
    }

    // title.sq / .uk — replace if equals title.ru (CMS import leftover)
    const titleRu = (a.title?.ru || '').trim()
    const titleSq = (a.title?.sq || '').trim()
    const titleUk = (a.title?.uk || '').trim()
    const needsSq = titleSq && titleRu && titleSq === titleRu
    const needsUk = titleUk && titleRu && titleUk === titleRu
    if (needsSq || needsUk) {
      const cityEn = a.city?.titleEn || 'Albania'
      const citySq = a.city?.titleSq || a.city?.titleEn || cityEn
      const cityUk = a.city?.titleUk || cityEn
      const nextTitle: Record<string, string> = {
        _type: 'localizedString' as unknown as string,
        ...(a.title as Record<string, string> | undefined),
      }
      if (needsSq) {
        nextTitle.sq = titleSqTemplate(a.bedrooms ?? null, citySq, a.status)
        summary.push(`title.sq -> "${nextTitle.sq}"`)
      }
      if (needsUk) {
        nextTitle.uk = titleUkTemplate(a.bedrooms ?? null, cityUk, a.status)
        summary.push(`title.uk -> "${nextTitle.uk}"`)
      }
      changes.title = nextTitle
    }

    if (Object.keys(changes).length === 0) continue
    plan.push({id: a._id, changes, summary})
  }

  console.log(`Apartments to patch: ${plan.length}\n`)
  for (const p of plan) {
    console.log(`  ${p.id}`)
    for (const s of p.summary) console.log(`    - ${s}`)
  }

  if (isDry) {
    console.log('\nDry run. Use --execute to apply.')
    return
  }

  if (plan.length === 0) {
    console.log('Nothing to update.')
    return
  }

  // Chunk transactions to keep payloads modest.
  const CHUNK = 10
  let applied = 0
  for (let i = 0; i < plan.length; i += CHUNK) {
    const slice = plan.slice(i, i + CHUNK)
    const tx = client.transaction()
    for (const p of slice) tx.patch(p.id, (patch) => patch.set(p.changes))
    await tx.commit()
    applied += slice.length
    console.log(`Committed ${applied}/${plan.length}`)
  }

  console.log(`\nUpdated ${plan.length} apartment(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
