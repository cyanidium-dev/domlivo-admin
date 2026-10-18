/**
 * DatoCMS → Sanity import script
 * Reads dato_objects.json, deletes all existing Sanity properties,
 * creates missing cities/districts, and imports all objects.
 */

import https from 'https'
import http from 'http'
import fs from 'fs'
import { createReadStream } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { tmpdir } from 'os'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SANITY_PROJECT_ID = 'g4aqp6ex'
const SANITY_DATASET = 'production'
const SANITY_TOKEN = 'skkpHfFMHF5MeSnGL312RLexi4eBTG9nlZ2UeQ5DHSKiBRiNlsfqT3uFBVJfOkdJrImcIWIGfEeDpYGYhYaDErY1dTUorruOIuea08fNs7ioCicSDB4oQxsrmcAk4eu0eXDmVssgLHiDW4lLf3jMI6vRdJyWN9OZdiR7cUHItUOYOshKuX0U'
const SANITY_API = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01`
const SANITY_MUTATE = `${SANITY_API}/data/mutate/${SANITY_DATASET}`

// ─── HTTP helpers ────────────────────────────────────────────────────────────

function fetchJson(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    const req = lib.request(url, {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...opts.headers },
    }, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    if (opts.body) req.write(typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body))
    req.end()
  })
}

function sanityQuery(groq) {
  const encoded = encodeURIComponent(groq)
  return fetchJson(`${SANITY_API}/data/query/${SANITY_DATASET}?query=${encoded}`, {
    headers: { Authorization: `Bearer ${SANITY_TOKEN}` }
  })
}

function sanityMutate(mutations) {
  return fetchJson(SANITY_MUTATE + '?returnIds=true', {
    method: 'POST',
    headers: { Authorization: `Bearer ${SANITY_TOKEN}` },
    body: { mutations }
  })
}

// Download a URL to a temp file, return the path
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const ext = path.extname(new URL(url).pathname) || '.jpg'
    const tmp = path.join(tmpdir(), `dato_img_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`)
    const file = fs.createWriteStream(tmp)
    const lib = url.startsWith('https') ? https : http
    lib.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close()
        fs.unlinkSync(tmp)
        return downloadFile(res.headers.location).then(resolve).catch(reject)
      }
      res.pipe(file)
      file.on('finish', () => file.close(() => resolve(tmp)))
    }).on('error', err => { fs.unlinkSync(tmp); reject(err) })
  })
}

// Upload a file to Sanity assets, return asset _id
async function uploadImageToSanity(url) {
  try {
    const tmpFile = await downloadFile(url)
    const stats = fs.statSync(tmpFile)
    const ext = path.extname(tmpFile).slice(1) || 'jpg'
    const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`

    const result = await new Promise((resolve, reject) => {
      const fileStream = createReadStream(tmpFile)
      const options = {
        hostname: `${SANITY_PROJECT_ID}.api.sanity.io`,
        path: `/v2024-01-01/assets/images/${SANITY_DATASET}`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SANITY_TOKEN}`,
          'Content-Type': mime,
          'Content-Length': stats.size,
        }
      }
      const req = https.request(options, res => {
        let data = ''
        res.on('data', c => data += c)
        res.on('end', () => {
          try { resolve(JSON.parse(data)) }
          catch { reject(new Error(`Upload parse error: ${data}`)) }
        })
      })
      req.on('error', reject)
      fileStream.pipe(req)
    })

    fs.unlinkSync(tmpFile)
    if (result.document?._id) return result.document._id
    throw new Error(`No asset id: ${JSON.stringify(result)}`)
  } catch (err) {
    console.warn(`  ⚠ Image upload failed: ${url} — ${err.message}`)
    return null
  }
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function cleanTitle(raw) {
  let t = raw.trim()
  // Remove sale/rent prefix words (case-insensitive)
  t = t.replace(/^(ПРОДАЖА|ПРОДАЁТСЯ|ПРОДАЕТСЯ|Для\s+АРЕНДЫ|ДЛЯ\s+АРЕНДЫ)\s*/i, '')
  // Proper case: lower everything then capitalize first letter
  t = t.charAt(0).toUpperCase() + t.slice(1)
  // Trim trailing punctuation artifacts
  t = t.replace(/\s+/g, ' ').trim()
  // Remove trailing | if present
  t = t.replace(/\s*\|$/, '').trim()
  return t
}

function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[ñ]/g, 'n')
    .replace(/[ëë]/g, 'e').replace(/ë/g, 'e')
    // Transliterate Russian
    .replace(/а/g,'a').replace(/б/g,'b').replace(/в/g,'v').replace(/г/g,'g')
    .replace(/д/g,'d').replace(/е/g,'e').replace(/ё/g,'e').replace(/ж/g,'zh')
    .replace(/з/g,'z').replace(/и/g,'i').replace(/й/g,'y').replace(/к/g,'k')
    .replace(/л/g,'l').replace(/м/g,'m').replace(/н/g,'n').replace(/о/g,'o')
    .replace(/п/g,'p').replace(/р/g,'r').replace(/с/g,'s').replace(/т/g,'t')
    .replace(/у/g,'u').replace(/ф/g,'f').replace(/х/g,'kh').replace(/ц/g,'ts')
    .replace(/ч/g,'ch').replace(/ш/g,'sh').replace(/щ/g,'sch').replace(/ъ/g,'')
    .replace(/ы/g,'y').replace(/ь/g,'').replace(/э/g,'e').replace(/ю/g,'yu')
    .replace(/я/g,'ya')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function extractDistrict(obj) {
  const title = (obj.title || '').toLowerCase()
  const desc = (obj.description || '').toLowerCase()
  const text = title + ' ' + desc

  if (obj.city?.includes('Durres')) {
    if (text.includes('р-н плепа') || text.includes('район плепа') || text.includes('плепа')) return 'plepa'
    if (text.includes('шкемби') || text.includes('shkëmbi') || text.includes('shkembi')) return 'shkembi'
    if (text.includes('голем') || text.includes('golem')) return 'golem'
    if (text.includes('р-н пляж') || text.includes('район пляж') || text.includes('пляж') || text.includes('побережь') || text.includes('beachfront')) return 'plazh'
    if (text.includes('центр')) return 'center'
    if (text.includes('порто романо') || text.includes('porto romano')) return 'porto-romano'
    if (text.includes('шкозет') || text.includes('shkozet')) return 'shkozet'
    // Default for Durres sea properties
    if (text.includes('у моря') || text.includes('море') || text.includes('пляж')) return 'plazh'
    return 'center'
  }
  if (obj.city?.includes('Saranda')) {
    if (text.includes('набережн') || text.includes('seafront')) return 'seafront-sarande'
    return 'center'
  }
  if (obj.city?.includes('Vlore')) {
    if (text.includes('лунгомаре') || text.includes('lungomare')) return 'lungomare'
    return 'center'
  }
  if (obj.city?.includes('Shëngjin')) return null // no district for shengjin yet
  return null
}

// Map dato city name → sanity city _id
const CITY_MAP = {
  'Durres': 'city-durres',
  'Shëngjin': 'city-shengjin',
  'Saranda': 'city-sarande',
  'Vlore': 'city-vlore',
  'Tirana': 'city-tirana',
}

// Map district key → sanity district _id
const DISTRICT_MAP = {
  'plazh': 'district-plazh',
  'center-durres': 'district-durres-center',
  'center': null, // filled per-city below
  'plepa': 'district-plepa-durres',
  'shkembi': 'district-shkembi-durres',
  'golem': 'district-golem-durres',
  'porto-romano': 'district-porto-romano',
  'shkozet': 'district-shkozet',
  'seafront-sarande': 'district-seafront-sarande',
  'center-sarande': 'district-sarande-center',
  'lungomare': 'district-lungomare',
  'center-vlore': 'district-vlore-center',
  'center-shengjin': 'district-shengjin-center',
}

function getDistrictId(districtKey, cityName) {
  if (!districtKey) return null
  if (districtKey === 'center') {
    if (cityName === 'Durres') return 'district-durres-center'
    if (cityName === 'Saranda') return 'district-sarande-center'
    if (cityName === 'Vlore') return 'district-vlore-center'
    return null
  }
  return DISTRICT_MAP[districtKey] || null
}

// Map dato typeofobj → sanity propertyType _id
function getPropertyTypeId(typeofobj) {
  const t = (typeofobj?.[0] || '').toLowerCase()
  if (t.includes('студия') || t.includes('studio')) return 'propertyType-studio'
  if (t.includes('элитн') || t.includes('люкс') || t.includes('penthouse') || t.includes('пентхаус')) return 'propertyType-penthouse'
  if (t.includes('дом') || t.includes('house') || t.includes('вилл') || t.includes('отель')) {
    if (t.includes('отель') || t.includes('hotel') || t.includes('коммерч')) return 'propertyType-commercial'
    return 'propertyType-house'
  }
  if (t.includes('апартамент') || t.includes('квартир') || t.includes('apart')) return 'propertyType-apartment'
  return 'propertyType-apartment'
}

function getStatus(saleorrent) {
  const s = (saleorrent?.[0] || '').toLowerCase()
  if (s === 'rent') return 'rent'
  return 'sale'
}

// Generate English title from cleaned Russian title + context
function makeEnglishTitle(cleanRu, obj) {
  const status = getStatus(obj.saleorrent) === 'sale' ? 'For Sale' : 'For Rent'
  const typeofobj = (obj.typeofobj?.[0] || 'Apartment')
  const typeEn = typeofobj.toLowerCase().includes('дом') ? 'House'
    : typeofobj.toLowerCase().includes('элитн') ? 'Premium Property'
    : typeofobj.toLowerCase().includes('студи') ? 'Studio'
    : 'Apartment'
  const beds = obj.bedrooms ? `${obj.bedrooms}+1` : ''
  const area = obj.area ? `${obj.area} m²` : ''
  const cityName = obj.city?.[0] || ''

  // Build descriptive English title
  const parts = [typeEn, beds, area, status, 'in', cityName].filter(Boolean)
  return parts.join(' ')
}

function makeDescription(obj, cleanTitle) {
  const desc = (obj.description || '').trim()
  // Remove emoji lines and clean up
  const cleaned = desc
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .join('\n')
  return cleaned || `${cleanTitle} — недвижимость в ${obj.city?.[0] || 'Албании'}.`
}

function makeSeoTitle(cleanTitle, city, status) {
  const statusStr = status === 'sale' ? 'купить' : 'снять'
  return `${cleanTitle} | ${statusStr} в ${city} — Domlivo`
}

function makeSeoDescription(obj, cleanTitle) {
  const price = obj.price ? `Цена: €${obj.price.toLocaleString()}.` : ''
  const area = obj.area ? `Площадь: ${obj.area} м².` : ''
  const beds = obj.bedrooms ? `Спален: ${obj.bedrooms}.` : ''
  const city = obj.city?.[0] || 'Албании'
  const base = `${cleanTitle} в ${city}. ${price} ${area} ${beds}`
  return base.replace(/\s+/g, ' ').trim().slice(0, 155)
}

function makeSeoTitleEn(cleanRu, city, status) {
  const statusStr = status === 'sale' ? 'Buy' : 'Rent'
  return `${makeEnglishTitle(cleanRu, { city: [city], saleorrent: [status] })} | ${statusStr} in ${city} — Domlivo`
}

function makeSeoDescEn(obj) {
  const price = obj.price ? `Price: €${obj.price.toLocaleString()}.` : ''
  const area = obj.area ? `Area: ${obj.area} m².` : ''
  const beds = obj.bedrooms ? `Bedrooms: ${obj.bedrooms}.` : ''
  const city = obj.city?.[0] || 'Albania'
  return `Property for ${getStatus(obj.saleorrent)} in ${city}, Albania. ${price} ${area} ${beds}`.replace(/\s+/g, ' ').trim().slice(0, 155)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== DatoCMS → Sanity Import ===\n')

  // Load DatoCMS data
  const datoData = JSON.parse(fs.readFileSync(path.join(__dirname, 'dato_objects.json'), 'utf8'))
  const objects = datoData.data.allObjects
  console.log(`Loaded ${objects.length} objects from DatoCMS\n`)

  // ── Step 1: Delete all existing properties ──────────────────────────────────
  console.log('Step 1: Clearing references to properties from other documents...')

  // Find documents that reference properties
  const refDocs = await sanityQuery(
    '*[_type != "property" && references(*[_type=="property"]._id)]{_id,_type}'
  )
  const referencingDocs = refDocs.body.result || []
  console.log(`  Found ${referencingDocs.length} documents referencing properties`)

  for (const doc of referencingDocs) {
    // Unset all property array fields that might contain references
    const unsetMutation = {
      patch: {
        id: doc._id,
        unset: ['relatedProperties', 'featuredProperties', 'properties', 'articlesSection.properties'],
      }
    }
    const r = await sanityMutate([unsetMutation])
    if (r.body.error) console.warn(`  ⚠ Could not patch ${doc._id}: ${JSON.stringify(r.body.error).slice(0,100)}`)
    else console.log(`  ✓ Cleared property refs in ${doc._type} (${doc._id})`)
  }

  console.log('\n  Fetching existing property IDs...')
  const existingRes = await sanityQuery('*[_type == "property"]._id')
  const existingIds = existingRes.body.result || []
  console.log(`  Found ${existingIds.length} existing properties to delete`)

  if (existingIds.length > 0) {
    // Delete in batches of 20 to avoid timeouts
    for (let i = 0; i < existingIds.length; i += 20) {
      const batch = existingIds.slice(i, i + 20)
      const mutations = batch.map(id => ({ delete: { id } }))
      const res = await sanityMutate(mutations)
      if (res.body.error) {
        console.warn(`  ⚠ Batch delete error: ${JSON.stringify(res.body.error).slice(0,200)}`)
        // Try one by one
        for (const id of batch) {
          const r2 = await sanityMutate([{ delete: { id } }])
          if (r2.body.error) console.warn(`  ✗ Could not delete ${id}: ${JSON.stringify(r2.body.error).slice(0,100)}`)
          else console.log(`  Deleted ${id}`)
        }
      } else {
        console.log(`  Deleted ${i + batch.length}/${existingIds.length}`)
      }
    }
  }
  console.log('  ✓ All properties deleted\n')

  // ── Step 2: Create missing city: Shëngjin ──────────────────────────────────
  console.log('Step 2: Creating Shëngjin city if missing...')
  const cityCheck = await sanityQuery('*[_type == "city" && _id == "city-shengjin"]._id')
  const albaniaCountryRes = await sanityQuery('*[_type == "country"][0]._id')
  const countryId = albaniaCountryRes.body.result

  if (!cityCheck.body.result?.length) {
    const cityMutation = {
      create: {
        _id: 'city-shengjin',
        _type: 'city',
        title: { en: 'Shëngjin', ru: 'Шенджин', sq: 'Shëngjini', uk: 'Шенджін' },
        slug: { _type: 'slug', current: 'shengjin' },
        country: countryId ? { _type: 'reference', _ref: countryId } : undefined,
        popular: false,
        isPublished: true,
        order: 10,
        shortDescription: {
          en: 'Shëngjin is a coastal resort town in northwestern Albania, known for its beaches and peaceful atmosphere.',
          ru: 'Шенджин — прибрежный курортный городок на северо-западе Албании, известный своими пляжами и спокойной атмосферой.',
          sq: 'Shëngjini është qytet bregdetar i Shqipërisë veriperëndimore, i njohur për plazhet e tij.',
          uk: 'Шенджін — прибережне курортне містечко на північному заході Албанії.'
        },
        seo: {
          en: { title: 'Real Estate in Shëngjin, Albania | Buy & Rent | Domlivo', description: 'Find apartments, houses and villas for sale and rent in Shëngjin, Albania. Browse listings with photos and prices.' },
          ru: { title: 'Недвижимость в Шенджине, Албания | Купить и снять | Domlivo', description: 'Квартиры, дома и виллы в Шенджине, Албания. Каталог объектов с фото и ценами.' },
          sq: { title: 'Prona në Shëngjin, Shqipëri | Bli & Qiraja | Domlivo', description: 'Gjeni apartamente, shtëpi dhe vila për shitje dhe qira në Shëngjin, Shqipëri.' },
          uk: { title: 'Нерухомість у Шенджіні, Албанія | Купити та орендувати | Domlivo', description: 'Квартири, будинки та вілли в Шенджіні, Албанія. Каталог обʼєктів з фото та цінами.' },
        }
      }
    }
    const res = await sanityMutate([cityMutation])
    if (res.body.error) throw new Error(`City create error: ${JSON.stringify(res.body.error)}`)
    console.log('  ✓ Created city: Shëngjin')
  } else {
    console.log('  ✓ Shëngjin already exists')
  }

  // ── Step 3: Create missing districts ────────────────────────────────────────
  console.log('\nStep 3: Creating missing districts for Durres...')

  const newDistricts = [
    {
      _id: 'district-plepa-durres',
      cityRef: 'city-durres',
      title: { en: 'Plepa', ru: 'Плепа', sq: 'Plepa', uk: 'Плепа' },
      slug: 'plepa-durres',
      shortDesc: {
        en: 'Plepa is a quiet residential district of Durres with sea views and good infrastructure.',
        ru: 'Плепа — тихий жилой район Дурреса с видом на море и развитой инфраструктурой.',
        sq: 'Plepa është lagje e qetë banimi e Durrësit me pamje nga deti dhe infrastrukturë të mirë.',
        uk: 'Плепа — тихий житловий район Дурреса з видом на море.'
      }
    },
    {
      _id: 'district-shkembi-durres',
      cityRef: 'city-durres',
      title: { en: 'Shkëmbi', ru: 'Шкемби', sq: 'Shkëmbi', uk: 'Шкембі' },
      slug: 'shkembi-durres',
      shortDesc: {
        en: 'Shkëmbi is a seaside neighbourhood in Durres, 150m from the waterfront, calm and green.',
        ru: 'Шкемби — приморский район Дурреса в 150 м от набережной, тихий и зелёный.',
        sq: 'Shkëmbi është lagje bregdetare e Durrësit, 150m nga lungomare, e qetë dhe e gjelbër.',
        uk: 'Шкембі — приморський район Дурреса за 150 м від набережної.'
      }
    },
    {
      _id: 'district-golem-durres',
      cityRef: 'city-durres',
      title: { en: 'Golem', ru: 'Голем', sq: 'Golemi', uk: 'Голем' },
      slug: 'golem-durres',
      shortDesc: {
        en: 'Golem is a popular beach resort district south of Durres city centre, with direct sea access.',
        ru: 'Голем — популярный пляжный район к югу от центра Дурреса с прямым выходом к морю.',
        sq: 'Golemi është lagje popullore balneare në jug të qendrës së Durrësit, me akses të drejtpërdrejtë në det.',
        uk: 'Голем — популярний пляжний район на південь від центру Дурреса.'
      }
    },
    {
      _id: 'district-shengjin-center',
      cityRef: 'city-shengjin',
      title: { en: 'City Center', ru: 'Центр', sq: 'Qendra', uk: 'Центр' },
      slug: 'center-shengjin',
      shortDesc: {
        en: 'The central area of Shëngjin with easy access to the beach and all amenities.',
        ru: 'Центральный район Шенджина с удобным доступом к пляжу и инфраструктуре.',
        sq: 'Zona qendrore e Shëngjinit me akses të lehtë në plazh dhe të gjitha shërbimet.',
        uk: 'Центральний район Шенджіна з зручним доступом до пляжу.'
      }
    },
  ]

  for (const d of newDistricts) {
    const check = await sanityQuery(`*[_type == "district" && _id == "${d._id}"]._id`)
    if (check.body.result?.length) {
      console.log(`  ✓ District already exists: ${d.title.ru}`)
      continue
    }
    const mutation = {
      create: {
        _id: d._id,
        _type: 'district',
        title: { _type: 'localizedString', ...d.title },
        slug: { _type: 'slug', current: d.slug },
        city: { _type: 'reference', _ref: d.cityRef },
        isPublished: true,
        shortDescription: {
          _type: 'localizedText',
          en: d.shortDesc.en,
          ru: d.shortDesc.ru,
          sq: d.shortDesc.sq,
          uk: d.shortDesc.uk,
        },
        seo: {
          en: { title: `${d.title.en} — ${d.cityRef.replace('city-','')} | Domlivo`, description: d.shortDesc.en.slice(0,155) },
          ru: { title: `${d.title.ru} — недвижимость | Domlivo`, description: d.shortDesc.ru.slice(0,155) },
          sq: { title: `${d.title.sq} — Prona | Domlivo`, description: d.shortDesc.sq.slice(0,155) },
          uk: { title: `${d.title.uk} — нерухомість | Domlivo`, description: d.shortDesc.uk.slice(0,155) },
        }
      }
    }
    const res = await sanityMutate([mutation])
    if (res.body.error) throw new Error(`District create error: ${JSON.stringify(res.body.error)}`)
    console.log(`  ✓ Created district: ${d.title.ru} (${d._id})`)
  }

  // ── Step 4: Import properties ────────────────────────────────────────────────
  console.log('\nStep 4: Importing properties...')

  // Default agent to rotate through
  const agentIds = ['agent-1', 'agent-2', 'agent-3', 'agent-4', 'agent-5']
  let agentIdx = 0

  const slugsSeen = new Set()

  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i]
    console.log(`\n  [${i+1}/${objects.length}] Processing: ${obj.title.trim().slice(0,60)}`)

    const cleanTitleRu = cleanTitle(obj.title)
    const cityName = obj.city?.[0] || 'Durres'
    const cityId = CITY_MAP[cityName] || 'city-durres'
    const districtKey = extractDistrict(obj)
    const districtId = getDistrictId(districtKey, cityName)
    const propertyTypeId = getPropertyTypeId(obj.typeofobj)
    const status = getStatus(obj.saleorrent)
    const agentId = agentIds[agentIdx % agentIds.length]
    agentIdx++

    // Slug: prefer dato slug, else generate from title
    let slugBase = obj.slug || toSlug(cleanTitleRu)
    // Ensure unique
    let slug = slugBase
    let slugSuffix = 1
    while (slugsSeen.has(slug)) {
      slug = `${slugBase}-${slugSuffix++}`
    }
    slugsSeen.add(slug)

    // Upload images
    console.log(`    Uploading images (${1 + (obj.allphotos?.length || 0)} total)...`)
    const galleryUrls = [
      ...(obj.mainphoto?.url ? [obj.mainphoto.url] : []),
      ...(obj.allphotos || []).map(p => p.url).filter(u => u && u !== obj.mainphoto?.url)
    ].filter(Boolean).slice(0, 20)

    const uploadedAssets = []
    for (const url of galleryUrls) {
      const assetId = await uploadImageToSanity(url)
      if (assetId) {
        uploadedAssets.push({
          _type: 'image',
          _key: Math.random().toString(36).slice(2),
          asset: { _type: 'reference', _ref: assetId },
          alt: cleanTitleRu,
        })
      }
    }
    console.log(`    Uploaded ${uploadedAssets.length}/${galleryUrls.length} images`)

    if (uploadedAssets.length === 0) {
      console.log(`    ⚠ No images uploaded, skipping property`)
      continue
    }

    // Build English title
    const cleanTitleEn = makeEnglishTitle(cleanTitleRu, obj)
    const description = makeDescription(obj, cleanTitleRu)

    // Price validation: some prices look like they might be per m² or typos
    let price = obj.price || 0
    // Object 10 has price 1300 for 62m² — probably price/m², estimate full price
    if (price > 0 && price < 5000 && obj.area && obj.area > 10) {
      console.log(`    ⚠ Price ${price} looks like price/m², estimating: ${price * obj.area}`)
      price = price * obj.area
    }

    const doc = {
      _type: 'property',
      title: {
        _type: 'localizedString',
        en: cleanTitleEn,
        ru: cleanTitleRu,
        sq: cleanTitleRu, // Albanian placeholder same as Russian until translated
        uk: cleanTitleRu,
      },
      slug: { _type: 'slug', current: slug },
      shortDescription: {
        _type: 'localizedText',
        en: makeSeoDescEn(obj),
        ru: makeSeoDescription(obj, cleanTitleRu),
        sq: makeSeoDescEn(obj),
        uk: makeSeoDescription(obj, cleanTitleRu),
      },
      description: {
        _type: 'localizedText',
        en: cleanTitleEn + '. ' + makeSeoDescEn(obj),
        ru: description,
        sq: cleanTitleEn + '. ' + makeSeoDescEn(obj),
        uk: description,
      },
      agent: { _type: 'reference', _ref: agentId },
      type: { _type: 'reference', _ref: propertyTypeId },
      status,
      isPublished: true,
      lifecycleStatus: 'active',
      price,
      promoted: false,
      investment: status === 'sale' && price > 100000,
      city: { _type: 'reference', _ref: cityId },
      ...(districtId ? { district: { _type: 'reference', _ref: districtId } } : {}),
      address: {
        _type: 'localizedString',
        en: cityName,
        ru: cityName === 'Durres' ? 'Дуррес' : cityName === 'Saranda' ? 'Саранда' : cityName === 'Vlore' ? 'Влёра' : cityName === 'Shëngjin' ? 'Шенджин' : cityName,
        sq: cityName,
        uk: cityName === 'Durres' ? 'Дуррес' : cityName,
      },
      area: obj.area || null,
      bedrooms: obj.bedrooms || null,
      bathrooms: obj.bathrooms || null,
      gallery: uploadedAssets,
      propertyCode: `DATO-${obj.id.slice(0,8).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      viewCount: 0,
      saveCount: 0,
      contactCount: 0,
      seo: {
        en: {
          title: makeSeoTitleEn(cleanTitleRu, cityName, status),
          description: makeSeoDescEn(obj),
        },
        ru: {
          title: makeSeoTitle(cleanTitleRu, cityName === 'Durres' ? 'Дурресе' : cityName === 'Saranda' ? 'Саранде' : cityName === 'Vlore' ? 'Влёре' : cityName, status),
          description: makeSeoDescription(obj, cleanTitleRu),
        },
        sq: {
          title: `${cleanTitleEn} | Domlivo`,
          description: makeSeoDescEn(obj),
        },
        uk: {
          title: makeSeoTitle(cleanTitleRu, cityName === 'Durres' ? 'Дурресі' : cityName, status),
          description: makeSeoDescription(obj, cleanTitleRu),
        },
      },
    }

    const res = await sanityMutate([{ create: doc }])
    if (res.body.error) {
      console.log(`    ✗ Error: ${JSON.stringify(res.body.error).slice(0,200)}`)
    } else {
      const newId = res.body.results?.[0]?.id || '?'
      console.log(`    ✓ Created property: ${newId}`)
    }
  }

  console.log('\n=== Import complete! ===')
}

main().catch(err => { console.error('FATAL:', err); process.exit(1) })
