/**
 * Domlivo Full Seed Script
 * Populates Sanity CMS with comprehensive mock content for an Albania real estate platform.
 *
 * Run: npm run seed:full
 * Requires: SANITY_API_TOKEN in .env
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {addKeysToArrayItems} from './lib/addKeysToArrayItems'

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
    console.error('Error: SANITY_API_TOKEN required. Add to .env')
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

// --- Helpers ---
type L = {sq: string; en: string; ru: string; uk: string}
function L(sq: string, en: string, ru: string, uk: string): L {
  return {sq, en, ru, uk}
}

type Li = {sq: string; en: string; ru: string; uk: string; it: string}
function Li(sq: string, en: string, ru: string, uk: string, it: string): Li {
  return {sq, en, ru, uk, it}
}

function block(text: string, key: string) {
  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    children: [{_type: 'span', _key: `${key}-s1`, text, marks: []}],
    markDefs: [],
  }
}

function blocksFromPlainText(text: string, keyPrefix: string) {
  const paras = text
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean)
  return paras.map((p, idx) => block(p, `${keyPrefix}-p${idx}`))
}

function localizedBlockContentFromLiText(t: Li, keyPrefix: string) {
  return {
    en: blocksFromPlainText(t.en, `${keyPrefix}-en`),
    ru: blocksFromPlainText(t.ru, `${keyPrefix}-ru`),
    uk: blocksFromPlainText(t.uk, `${keyPrefix}-uk`),
    sq: blocksFromPlainText(t.sq, `${keyPrefix}-sq`),
    it: blocksFromPlainText(t.it, `${keyPrefix}-it`),
  }
}

function h2(text: string, key: string) {
  return {
    _type: 'block',
    _key: key,
    style: 'h2',
    children: [{_type: 'span', _key: `${key}-s1`, text, marks: []}],
    markDefs: [],
  }
}

function h3(text: string, key: string) {
  return {
    _type: 'block',
    _key: key,
    style: 'h3',
    children: [{_type: 'span', _key: `${key}-s1`, text, marks: []}],
    markDefs: [],
  }
}

const imageCache: Record<string, string> = {}
async function uploadImage(seed: string): Promise<string> {
  if (imageCache[seed]) return imageCache[seed]
  const res = await fetch(`https://picsum.photos/seed/${seed}/800/600`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const asset = await client.assets.upload('image', buffer, {
    filename: `seed-${seed}.jpg`,
  })
  imageCache[seed] = asset._id
  return asset._id
}

function imgRef(assetId: string) {
  return {_type: 'image', asset: {_type: 'reference', _ref: assetId}}
}

function cta(href: string, label: L) {
  return {href, label}
}

function ctaLi(href: string, label: Li) {
  return {href, label}
}

function faqItem(q: L, a: L) {
  return {question: q, answer: a}
}

function faqItemLi(q: Li, a: Li) {
  return {question: q, answer: a}
}

function buildParagraphs(words: string[], targetWordCount: number): string[] {
  const paras: string[] = []
  let current: string[] = []
  let count = 0
  for (let i = 0; i < words.length && count < targetWordCount; i++) {
    current.push(words[i])
    count++
    if (current.length >= 40 && count < targetWordCount) {
      paras.push(current.join(' ') + '.')
      current = []
    }
  }
  if (current.length) paras.push(current.join(' ') + '.')
  return paras
}

const PARAGRAPH_TEMPLATES_EN = [
  'This stunning property is located in the heart of Albania and offers exceptional value for investors and families alike. The building features modern amenities and has been recently renovated to the highest standards. Albania continues to attract international buyers due to its favorable climate and growing economy.',
  'Situated in a prime location with excellent transport links, this home provides easy access to shops, restaurants, and cultural attractions. The area has seen significant development in recent years. Property prices remain competitive compared to other Mediterranean destinations including Greece and Montenegro.',
  'With breathtaking sea views and proximity to the beach, this property represents a unique opportunity for those seeking a Mediterranean lifestyle. The rental potential is excellent year-round, with strong demand from tourists during the summer months and digital nomads throughout the year.',
  'The spacious layout and high-quality finishes make this an ideal family home. Large windows flood the interior with natural light, creating a bright and welcoming atmosphere. The neighborhood is known for its safety and friendly community.',
  'Located in a quiet residential neighborhood, this property offers peace and privacy while remaining close to urban amenities. The garden provides outdoor living space for the whole family. Schools, healthcare facilities, and supermarkets are all within convenient reach.',
  'This investment-grade property offers strong rental yields and capital appreciation potential. The area attracts both tourists and long-term tenants due to its popularity. Foreign buyers can purchase with minimal restrictions after obtaining a fiscal number and local bank account.',
  'The apartment features a modern open-plan design with premium fixtures throughout. Elevator access, secure parking, and professional building management add to the appeal for discerning buyers. The building conforms to European construction standards.',
  'Surrounded by green spaces and within walking distance of the coast, this property combines the best of both worlds. Perfect for those who value nature and convenience equally. The Albanian Riviera is renowned for its crystal-clear waters and unspoiled landscapes.',
]

function buildLongText(templates: string[], targetWords: number): string {
  const parts: string[] = []
  let count = 0
  let i = 0
  while (count < targetWords) {
    const t = templates[i % templates.length]
    parts.push(t)
    count += t.split(/\s+/).length
    i++
  }
  return parts.join(' ')
}

function localizedDescription(wordCount = 400): L {
  const en = buildLongText(PARAGRAPH_TEMPLATES_EN, wordCount)
  return L(en, en, en, en)
}

async function main() {
  validateEnv()
  console.log(`Seeding full dataset: ${ENV.projectId} / ${ENV.dataset}...`)

  // --- 1. Property Types (8) ---
  const propertyTypes = [
    {slugBase: 'apartment', title: L('Apartament', 'Apartment', 'Квартира', 'Квартира'), shortDesc: L('Apartamente për banim.', 'Residential apartments.', 'Жилые квартиры.', 'Житлові квартири.')},
    {slugBase: 'penthouse', title: L('Penthouse', 'Penthouse', 'Пентхаус', 'Пентхаус'), shortDesc: L('Apartamente në katet e larta.', 'Top-floor luxury apartments.', 'Пентхаусы.', 'Пентхауси.')},
    {slugBase: 'villa', title: L('Vilë', 'Villa', 'Вилла', 'Вілла'), shortDesc: L('Vila me standard të lartë.', 'High-standard villas.', 'Виллы высокого класса.', 'Вілли високого класу.')},
    {slugBase: 'house', title: L('Shtëpi', 'House', 'Дом', 'Будинок'), shortDesc: L('Shtëpi të pavarura.', 'Standalone houses.', 'Отдельные дома.', 'Окремі будинки.')},
    {slugBase: 'studio', title: L('Studio', 'Studio', 'Студия', 'Студія'), shortDesc: L('Hapësira kompakte.', 'Compact living spaces.', 'Компактные студии.', 'Компактні студії.')},
    {slugBase: 'commercial', title: L('Hapësirë tregtare', 'Commercial Space', 'Коммерческая площадь', 'Комерційна площа'), shortDesc: L('Hapësira tregtare.', 'Commercial space.', 'Коммерческая недвижимость.', 'Комерційна нерухомість.')},
    {slugBase: 'office', title: L('Zyra', 'Office', 'Офис', 'Офіс'), shortDesc: L('Hapësira zyrash.', 'Office spaces.', 'Офисные помещения.', 'Офісні приміщення.')},
    {slugBase: 'land', title: L('Tokë', 'Land', 'Земля', 'Земля'), shortDesc: L('Parcele për zhvillim.', 'Land for development.', 'Участки под застройку.', 'Ділянки під забудову.')},
  ]
  const propertyTypeIds: Record<string, string> = {}
  for (let i = 0; i < propertyTypes.length; i++) {
    const pt = propertyTypes[i]
    const imgId = await uploadImage(`pt-${pt.slugBase}`)
    await client.createOrReplace({
      _id: `propertyType-${pt.slugBase}`,
      _type: 'propertyType',
      title: pt.title,
      slug: {current: pt.slugBase},
      image: imgRef(imgId),
      shortDescription: pt.shortDesc,
      order: i + 1,
      active: true,
    })
    propertyTypeIds[pt.slugBase] = `propertyType-${pt.slugBase}`
  }
  console.log('Property types:', propertyTypes.length)

  // --- 2. Amenities (12) ---
  const amenities = [
    {id: 'parking', title: L('Parkim', 'Parking', 'Парковка', 'Парківка')},
    {id: 'balcony', title: L('Ballkon', 'Balcony', 'Балкон', 'Балкон')},
    {id: 'sea-view', title: L('Pamje deti', 'Sea View', 'Вид на море', 'Вид на море')},
    {id: 'elevator', title: L('Ashensor', 'Elevator', 'Лифт', 'Ліфт')},
    {id: 'furnished', title: L('E mobiluar', 'Furnished', 'Меблирована', 'Мебльована')},
    {id: 'ac', title: L('Kondicioner', 'Air Conditioning', 'Кондиционер', 'Кондиціонер')},
    {id: 'pool', title: L('Pishinë', 'Swimming Pool', 'Бассейн', 'Басейн')},
    {id: 'garden', title: L('Kopsht', 'Garden', 'Сад', 'Сад')},
    {id: 'security', title: L('Siguri', 'Security', 'Охрана', 'Охорона')},
    {id: 'terrace', title: L('Tarracë', 'Terrace', 'Терраса', 'Тераса')},
    {id: 'storage-room', title: L('Dhoma ruajtjeje', 'Storage Room', 'Кладовая', 'Кімната для зберігання')},
    {id: 'mountain-view', title: L('Pamje malore', 'Mountain View', 'Вид на горы', 'Вид на гори')},
  ]
  const amenityIds: Record<string, string> = {}
  for (let i = 0; i < amenities.length; i++) {
    const a = amenities[i]
    await client.createOrReplace({
      _id: `amenity-${a.id}`,
      _type: 'amenity',
      title: a.title,
      order: i + 1,
      active: true,
    })
    amenityIds[a.id] = `amenity-${a.id}`
  }
  console.log('Amenities:', amenities.length)

  // --- 3. Location Tags (10) ---
  const locationTags = [
    {slugBase: 'city-center', title: L('Qendra e qytetit', 'City Center', 'Центр города', 'Центр міста'), desc: L('Vendndodhje qendrore me dyqane dhe shërbime.', 'Central location with shops and services.', 'Центральное расположение с магазинами и услугами.', 'Центральне розташування з магазинами та послугами.')},
    {slugBase: 'near-beach', title: L('Afër plazhit', 'Near Beach', 'У пляжа', 'Біля пляжу'), desc: L('Akses i lehtë në plazh.', 'Easy beach access.', 'Лёгкий доступ к пляжу.', 'Легкий доступ до пляжу.')},
    {slugBase: 'quiet-area', title: L('Zonë e qetë', 'Quiet Area', 'Тихий район', 'Тихій район'), desc: L('Lagje e qetë, ideal për familje.', 'Quiet neighborhood, ideal for families.', 'Тихий район, идеален для семей.', 'Тихій район, ідеальний для сімей.')},
    {slugBase: 'new-development', title: L('Zhvillim i ri', 'New Development', 'Новая застройка', 'Нова забудова'), desc: L('Ndërtesa të reja me standarde moderne.', 'New buildings with modern standards.', 'Новые здания с современными стандартами.', 'Нові будівлі з сучасними стандартами.')},
    {slugBase: 'investment-opportunity', title: L('Mundësi investimi', 'Investment Opportunity', 'Инвестиционная возможность', 'Інвестиційна можливість'), desc: L('Përshtatshëm për investim me kthime të mira.', 'Suitable for investment with good returns.', 'Подходит для инвестиций с хорошей доходностью.', 'Підходить для інвестицій з гарною доходністю.')},
    {slugBase: 'family-friendly', title: L('I përshtatshëm për familje', 'Family Friendly', 'Семейный', 'Сімейний'), desc: L('Shkolla, parqe dhe siguri.', 'Schools, parks and safety.', 'Школы, парки и безопасность.', 'Школи, парки та безпека.')},
    {slugBase: 'premium-area', title: L('Zonë premium', 'Premium Area', 'Премиум район', 'Преміум район'), desc: L('Lokacione ekskluzive dhe cilësi e lartë.', 'Exclusive locations and high quality.', 'Эксклюзивные локации и высокое качество.', 'Ексклюзивні локації та висока якість.')},
    {slugBase: 'walkable-location', title: L('Pjesë e ecshme', 'Walkable Location', 'В шаговой доступности', 'У пішній доступності'), desc: L('Dyqane dhe transport publik afër.', 'Shops and public transport nearby.', 'Магазины и транспорт рядом.', 'Магазини та транспорт поряд.')},
    {slugBase: 'near-marina', title: L('Afër portit sportiv', 'Near Marina', 'У марины', 'Біля марини'), desc: L('Afër portit sportiv dhe aktiviteteve ujore.', 'Near marina and water activities.', 'Близко к марине и водным активностям.', 'Близько до марини та водних активностей.')},
    {slugBase: 'gated-community', title: L('Komunitet i mbyllur', 'Gated Community', 'Закрытое сообщество', 'Закрите співтовариство'), desc: L('Siguri dhe zonë të përbashkët.', 'Security and shared amenities.', 'Безопасность и общая территория.', 'Безпека та спільна територія.')},
  ]
  const locationTagIds: Record<string, string> = {}
  for (const lt of locationTags) {
    await client.createOrReplace({
      _id: `locationTag-${lt.slugBase}`,
      _type: 'locationTag',
      title: lt.title,
      slug: {current: lt.slugBase},
      description: lt.desc,
      active: true,
    })
    locationTagIds[lt.slugBase] = `locationTag-${lt.slugBase}`
  }
  console.log('Location tags:', locationTags.length)

  // --- 4. Agents (5) ---
  const agents = [
    {id: 'agent-1', name: 'Elena Krasniqi', email: 'elena@domlivo.com', phone: '+355 69 123 4567'},
    {id: 'agent-2', name: 'Arben Shala', email: 'arben@domlivo.com', phone: '+355 68 234 5678'},
    {id: 'agent-3', name: 'Olga Dervishi', email: 'olga@domlivo.com', phone: '+355 67 345 6789'},
    {id: 'agent-4', name: 'Genti Mema', email: 'genti@domlivo.com', phone: '+355 69 456 7890'},
    {id: 'agent-5', name: 'Drita Hoxha', email: 'drita@domlivo.com', phone: '+355 68 567 8901'},
  ]
  const agentIds: string[] = []
  for (const a of agents) {
    const imgId = await uploadImage(`agent-${a.id}`)
    await client.createOrReplace({
      _id: a.id,
      _type: 'agent',
      name: a.name,
      email: a.email,
      phone: a.phone,
      photo: imgRef(imgId),
    })
    agentIds.push(a.id)
  }
  console.log('Agents:', agents.length)

  // --- 5. Cities (6) ---
  const citiesData = [
    {id: 'city-tirana', slug: 'tirana', order: 1, title: L('Tirana', 'Tirana', 'Тирана', 'Тірана'), heroTitle: L('Zbuloni Tiranën', 'Discover Tirana', 'Откройте Тирану', 'Відкрийте Тірану'), heroSub: L('Kryeqyteti i shndritshëm', 'The vibrant capital', 'Столица Албании', 'Столиця Албанії'), shortDesc: L('Tirana ofron mënyrë jetese urbane.', 'Tirana offers urban lifestyle.', 'Тирана сочетает городской образ жизни.', 'Тірана пропонує міський спосіб життя.'), desc: L('Tirana është kryeqyteti i Shqipërisë.', 'Tirana is Albania\'s capital.', 'Тирана — столица Албании.', 'Тірана — столиця Албанії.'), invest: L('Investimi në Tiranë ofron kthime.', 'Investment in Tirana offers solid returns.', 'Инвестиции в Тиранe.', 'Інвестиції в Тірані.')},
    {id: 'city-durres', slug: 'durres', order: 2, title: L('Durrësi', 'Durres', 'Дуррес', 'Дуррес'), heroTitle: L('Durrësi — Jeta Bregdetare', 'Durres — Coastal Living', 'Дуррес — прибрежная жизнь', 'Дуррес — прибережне життя'), heroSub: L('Porti kryesor me plazhe', 'Main port with beaches', 'Главный портовый город', 'Головне портове місто'), shortDesc: L('Durrësi kombinon detin dhe historinë.', 'Durres combines sea and history.', 'Дуррес сочетает море и историю.', 'Дуррес поєднує море та історію.'), desc: L('Durrësi është porti kryesor.', 'Durres is the main port.', 'Дуррес — главный порт.', 'Дуррес — головний порт.'), invest: L('Kërkesa për qira është e lartë.', 'Rental demand is high.', 'Спрос на аренду высокий.', 'Попит на оренду високий.')},
    {id: 'city-vlore', slug: 'vlore', order: 3, title: L('Vlora', 'Vlore', 'Влёра', 'Вльора'), heroTitle: L('Vlora — Porta e Rivierës', 'Vlore — Riviera Gateway', 'Влёра — врата Ривьеры', 'Вльора — брама Рів\'єри'), heroSub: L('Hyrja në Rivierën Shqiptare', 'Gateway to the Albanian Riviera', 'Вход на албанскую Ривьеру', 'Вхід на албанську Рів\'єру'), shortDesc: L('Vlora ofron plazhe dhe relaks.', 'Vlore offers beaches and relaxation.', 'Влёра предлагает пляжи.', 'Вльора пропонує пляжі.'), desc: L('Vlora është hyrja në Rivierën.', 'Vlore is the gateway to the Riviera.', 'Влёра — вход на Ривьеру.', 'Вльора — вхід на Рів\'єру.'), invest: L('Tregu tërheq blerës.', 'Market attracts buyers.', 'Рынок привлекает покупателей.', 'Ринок приваблює покупців.')},
    {id: 'city-sarande', slug: 'sarande', order: 4, title: L('Saranda', 'Sarande', 'Саранда', 'Саранда'), heroTitle: L('Saranda — Guri i Jugut', 'Sarande — Southern Gem', 'Саранда — жемчужина юга', 'Саранда — перлина півдня'), heroSub: L('Dielli dhe deti në jug', 'Sun and sea in the south', 'Солнце и море на юге', 'Сонце та море на півдні'), shortDesc: L('Saranda është destinacion turistik.', 'Sarande is a popular tourist destination.', 'Саранда — популярный курорт.', 'Саранда — популярний курорт.'), desc: L('Saranda shtrihet në bregun Jonian.', 'Sarande lies on the Ionian coast.', 'Саранда на Ионическом побережье.', 'Саранда на Іонічному узбережжі.'), invest: L('Kërkesa për qira e lartë në sezon.', 'High rental demand in season.', 'Высокий спрос в сезон.', 'Високий попит в сезон.')},
    {id: 'city-shkoder', slug: 'shkoder', order: 5, title: L('Shkodra', 'Shkoder', 'Шкодер', 'Шкодер'), heroTitle: L('Shkodra — Qyteti i Liqeneve', 'Shkoder — City of Lakes', 'Шкодер — город озёр', 'Шкодер — місто озер'), heroSub: L('Trashëgimia dhe natyra', 'Heritage and nature', 'Наследие и природа', 'Спадщина та природа'), shortDesc: L('Shkodra kombinon historinë dhe bukurinë.', 'Shkoder combines history and beauty.', 'Шкодер сочетает историю и природу.', 'Шкодер поєднує історію та природу.'), desc: L('Shkodra është një nga qytetet më të vjetra.', 'Shkoder is one of the oldest cities.', 'Шкодер — один из старейших городов.', 'Шкодер — одне з найстаріших міст.'), invest: L('Çmime të arritshme.', 'Affordable prices.', 'Доступные цены.', 'Доступні ціни.')},
    {id: 'city-himare', slug: 'himare', order: 6, title: L('Himara', 'Himare', 'Химара', 'Хімара'), heroTitle: L('Himara — Bregdeti Jonian', 'Himare — Ionian Coast', 'Химара — Ионическое побережье', 'Хімара — Іонічне узбережжя'), heroSub: L('Plazhe të pastra dhe paqe', 'Pristine beaches and peace', 'Чистые пляжи и покой', 'Чисті пляжі та спокій'), shortDesc: L('Himara ofron plazhe të shkëlqyera.', 'Himare offers pristine beaches.', 'Химара предлагает чистые пляжи.', 'Хімара пропонує чисті пляжі.'), desc: L('Himara shtrihet në Rivierën Shqiptare.', 'Himare lies on the Albanian Riviera.', 'Химара на албанской Ривьере.', 'Хімара на албанській Рів\'єрі.'), invest: L('Potencial për turizëm.', 'Tourism potential.', 'Потенциал туризма.', 'Потенціал туризму.')},
  ]

  for (const c of citiesData) {
    const imgId = await uploadImage(`city-${c.slug}`)
    await client.createOrReplace({
      _id: c.id,
      _type: 'city',
      title: c.title,
      slug: {current: c.slug},
      popular: true,
      order: c.order,
      isPublished: true,
      heroTitle: c.heroTitle,
      heroSubtitle: c.heroSub,
      heroShortLine: L('Kryeqyteti', 'Capital', 'Столица', 'Столиця'),
      heroImage: imgRef(imgId),
      heroCta: cta('/properties', L('Shiko pronat', 'View properties', 'Смотреть объекты', 'Дивитися об\'єкти')),
      shortDescription: c.shortDesc,
      description: c.desc,
      investmentText: c.invest,
      featuredPropertiesTitle: L('Prona të Zgjedhura', 'Featured Properties', 'Избранные объекты', 'Обрані об\'єкти'),
      featuredPropertiesSubtitle: L('Prona në ' + c.title.sq, 'Properties in ' + c.title.en, 'Объекты в ' + c.title.ru, 'Об\'єкти в ' + c.title.uk),
      allPropertiesCta: cta('/properties', L('Shiko pronat', 'View properties', 'Смотреть объекты', 'Дивитися об\'єкти')),
      districtsTitle: L('Lagjet', 'Districts', 'Районы', 'Райони'),
      districtsIntro: L('Eksploro lagjet.', 'Explore districts.', 'Исследуйте районы.', 'Дослідіть райони.'),
      districtStats: addKeysToArrayItems([{districtName: 'Center', averagePricePerM2: 1200, averageArea: 75, popularity: 'High'}]),
      cityVideoUrl: '',
      galleryTitle: L('Galeria', 'Gallery', 'Галерея', 'Галерея'),
      gallerySubtitle: L('Pamje nga ' + c.title.en, 'Views of ' + c.title.en, 'Виды ' + c.title.ru, 'Види ' + c.title.uk),
      gallery: addKeysToArrayItems([imgRef(imgId)]),
      faqTitle: L('Pyetje', 'FAQ', 'Вопросы', 'Питання'),
      faqItems: addKeysToArrayItems([faqItem(L('Pyetje?', 'Question?', 'Вопрос?', 'Питання?'), L('Përgjigje.', 'Answer.', 'Ответ.', 'Відповідь.'))]),
      seoText: c.desc,
      seo: {metaTitle: c.title, metaDescription: c.shortDesc, ogTitle: c.title, ogDescription: c.shortDesc, noIndex: false},
    })
  }
  console.log('Cities:', citiesData.length)

  // --- 6. Districts (18) ---
  const districtsData = [
    {id: 'district-blloku', cityId: 'city-tirana', slug: 'blloku', order: 1, title: L('Blloku', 'Blloku', 'Блоку', 'Блоку'), shortDesc: L('Lagjia më e gjallë', 'Most vibrant district', 'Самый оживленный район', 'Найяскравіший район'), desc: L('Blloku është zona më e gjallë e Tiranës.', 'Blloku is Tirana\'s most vibrant district.', 'Блоку — самый оживленный район Тираны.', 'Блоку — найяскравіший район Тірани.')},
    {id: 'district-komuna-parisit', cityId: 'city-tirana', slug: 'komuna-e-parisit', order: 2, title: L('Komuna e Parisit', 'Komuna e Parisit', 'Коммуна Паризит', 'Комуна Паризит'), shortDesc: L('Lagji banimi i qetë', 'Quiet residential', 'Тихий жилой район', 'Тихій житловий район'), desc: L('Lagji banimi i qetë në Tiranë.', 'Quiet residential district in Tirana.', 'Тихий жилой район в Тиранe.', 'Тихій житловий район у Тірані.')},
    {id: 'district-new-bazaar', cityId: 'city-tirana', slug: 'new-bazaar', order: 3, title: L('Pazari i Ri', 'New Bazaar', 'Новый базар', 'Новий базар'), shortDesc: L('Tregu tradicional', 'Traditional market area', 'Район традиционного рынка', 'Район традиційного ринку'), desc: L('Pazari i Ri ofron një atmosferë unike.', 'New Bazaar (Pazari i Ri) offers a unique atmosphere with traditional market, cafes, and local life.', 'Новый базар — уникальная атмосфера с традиционным рынком.', 'Новий базар — унікальна атмосфера з традиційним ринком.')},
    {id: 'district-pazari-i-ri', cityId: 'city-tirana', slug: 'pazari-i-ri', order: 4, title: L('Pazari i Ri', 'Pazari i Ri', 'Пазари и Ри', 'Пазарі і Рі'), shortDesc: L('Zona tregtare', 'Market district', 'Район рынка', 'Район ринку'), desc: L('Pazari i Ri është tregu tradicional i Tiranës.', 'Pazari i Ri is Tirana\'s traditional market district with vibrant local culture.', 'Пазари и Ри — традиционный рынок Тираны.', 'Пазарі і Рі — традиційний ринок Тірани.')},
    {id: 'district-plazh', cityId: 'city-durres', slug: 'beachfront-durres', order: 6, title: L('Bregdeti', 'Beachfront', 'Побережье', 'Узбережжя'), shortDesc: L('Akses direkt në plazh', 'Direct beach access', 'Прямой доступ к пляжу', 'Прямий доступ до пляжу'), desc: L('Plazhi ofron akses të drejtë në plazh.', 'Beachfront offers direct beach access in Durres.', 'Побережье предлагает прямой доступ к пляжу.', 'Узбережжя пропонує прямий доступ до пляжу.')},
    {id: 'district-durres-center', cityId: 'city-durres', slug: 'city-center-durres', order: 7, title: L('Qendra', 'City Center', 'Центр', 'Центр'), shortDesc: L('Qendra e Durrësit', 'Downtown Durres', 'Центр Дурреса', 'Центр Дурреса'), desc: L('Qendra me dyqane dhe restorante.', 'Downtown with shops and restaurants.', 'Центр с магазинами и ресторанами.', 'Центр з магазинами та ресторанами.')},
    {id: 'district-shkozet', cityId: 'city-durres', slug: 'shkozet', order: 8, title: L('Shkozeti', 'Shkozet', 'Шкозет', 'Шкозет'), shortDesc: L('Zonë banimi', 'Residential area', 'Жилой район', 'Житловий район'), desc: L('Shkozeti është zonë banimi në Durrës.', 'Shkozet is a residential area in Durres with good connectivity.', 'Шкозет — жилой район Дурреса.', 'Шкозет — житловий район Дурреса.')},
    {id: 'district-lungomare', cityId: 'city-vlore', slug: 'lungomare', order: 9, title: L('Lungomare', 'Lungomare', 'Лунгомарe', 'Лунгомарe'), shortDesc: L('Promenada e famshme', 'Famous seafront', 'Знаменитая набережная', 'Знаменита набережна'), desc: L('Lungomare është promenada e Vlorës.', 'Lungomare is Vlore\'s famous seafront.', 'Лунгомарe — знаменитая набережная.', 'Лунгомарe — знаменита набережна.')},
    {id: 'district-uji-i-ftohte', cityId: 'city-vlore', slug: 'uji-i-ftohte', order: 10, title: L('Uji i Ftohtë', 'Uji i Ftohte', 'Уйи и Фтохте', 'Уйи і Фтохте'), shortDesc: L('Plazhe dhe burime', 'Beaches and springs', 'Пляжи и источники', 'Пляжі та джерела'), desc: L('Uji i Ftohtë ofron plazhe dhe natyrë.', 'Uji i Ftohte offers beaches and nature.', 'Уйи и Фтохте — пляжи и природа.', 'Уйи і Фтохте — пляжі та природа.')},
    {id: 'district-vlore-center', cityId: 'city-vlore', slug: 'city-center-vlore', order: 11, title: L('Qendra', 'City Center', 'Центр', 'Центр'), shortDesc: L('Qendra e Vlorës', 'Vlore center', 'Центр Влёры', 'Центр Вльори'), desc: L('Qendra e Vlorës me dyqane dhe shërbime.', 'Vlore city center with shops and services.', 'Центр Влёры с магазинами и услугами.', 'Центр Вльори з магазинами та послугами.')},
    {id: 'district-seafront-sarande', cityId: 'city-sarande', slug: 'seafront-sarande', order: 12, title: L('Bregdeti', 'Seafront', 'Набережная', 'Набережна'), shortDesc: L('Ngjitur me detin', 'By the sea', 'У моря', 'Біля моря'), desc: L('Bregdeti i Sarandës me pamje të detit.', 'Sarande seafront with sea views and promenade.', 'Набережная Саранды с видом на море.', 'Набережна Саранди з видом на море.')},
    {id: 'district-kodra', cityId: 'city-sarande', slug: 'kodra', order: 13, title: L('Kodra', 'Kodra', 'Кодра', 'Кодра'), shortDesc: L('Kodër me pamje', 'Hillside with views', 'Холм с видом', 'Пагорб з видом'), desc: L('Kodra ofron pamje panoramike të Sarandës.', 'Kodra offers panoramic views over Sarande.', 'Кодра предлагает панорамный вид на Саранду.', 'Кодра пропонує панорамний вид на Саранду.')},
    {id: 'district-sarande-center', cityId: 'city-sarande', slug: 'city-center-sarande', order: 14, title: L('Qendra', 'City Center', 'Центр', 'Центр'), shortDesc: L('Qendra me pamje deti', 'Central with sea views', 'Центр с видом на море', 'Центр з видом на море'), desc: L('Qendra e Sarandës me pamje të detit.', 'Central Sarande with sea views.', 'Центр Саранды с видом на море.', 'Центр Саранди з видом на море.')},
    {id: 'district-gjuhadol', cityId: 'city-shkoder', slug: 'gjuhadol', order: 15, title: L('Gjuhadoli', 'Gjuhadol', 'Гьюхадол', 'Гьюхадол'), shortDesc: L('Zonë banimi', 'Residential area', 'Жилой район', 'Житловий район'), desc: L('Gjuhadoli është zonë banimi e Shkodrës.', 'Gjuhadol is a residential area of Shkoder.', 'Гьюхадол — жилой район Шкодера.', 'Гьюхадол — житловий район Шкодера.')},
    {id: 'district-parruce', cityId: 'city-shkoder', slug: 'parruce', order: 16, title: L('Parruca', 'Parruce', 'Парруче', 'Парруче'), shortDesc: L('Afër liqenit', 'Near the lake', 'У озера', 'Біля озера'), desc: L('Parruca ofron qetësi afër liqenit.', 'Parruce offers peace near Lake Shkodra.', 'Парруче у озера Шкодер.', 'Парруче біля озера Шкодер.')},
    {id: 'district-old-town-himare', cityId: 'city-himare', slug: 'old-town-himare', order: 17, title: L('Qyteti i Vjetër', 'Old Town', 'Старый город', 'Старе місто'), shortDesc: L('Trashëgimia historike', 'Historic heritage', 'Историческое наследие', 'Історична спадщина'), desc: L('Qyteti i vjetër i Himarës me arkitekturë tradicionale.', 'Himare Old Town with traditional architecture.', 'Старый город Химары с традиционной архитектурой.', 'Старе місто Хімари з традиційною архітектурою.')},
    {id: 'district-seaside-himare', cityId: 'city-himare', slug: 'seaside-himare', order: 18, title: L('Bregdeti', 'Seaside', 'Побережье', 'Узбережжя'), shortDesc: L('Plazhet e pastra', 'Pristine beaches', 'Чистые пляжи', 'Чисті пляжі'), desc: L('Bregdeti i Himarës me plazhe të mrekullueshme.', 'Himare seaside with pristine beaches.', 'Побережье Химары с чистыми пляжами.', 'Узбережжя Хімари з чистими пляжами.')},
    {id: 'district-livadhi', cityId: 'city-himare', slug: 'livadhi', order: 19, title: L('Livadhi', 'Livadhi', 'Ливади', 'Ліваді'), shortDesc: L('Plazhet e pastra', 'Pristine beaches', 'Чистые пляжи', 'Чисті пляжі'), desc: L('Livadhi ka plazhe të mrekullueshme.', 'Livadhi has amazing beaches.', 'Ливади — удивительные пляжи.', 'Ліваді — дивовижні пляжі.')},
  ]

  for (const d of districtsData) {
    const imgId = await uploadImage(`district-${d.slug}`)
    await client.createOrReplace({
      _id: d.id,
      _type: 'district',
      title: d.title,
      slug: {current: d.slug},
      city: {_type: 'reference', _ref: d.cityId},
      isPublished: true,
      order: d.order,
      heroTitle: d.title,
      heroSubtitle: d.desc,
      heroShortLine: d.title,
      heroImage: imgRef(imgId),
      heroCta: cta('/properties', L('Shiko', 'View', 'Смотреть', 'Дивитися')),
      shortDescription: d.shortDesc,
      description: d.desc,
      metricsTitle: L('Metrikat', 'Metrics', 'Метрики', 'Метрики'),
      metrics: addKeysToArrayItems([{label: 'Avg Price', value: '€1,200/m²'}]),
      allPropertiesCta: cta('/properties', L('Prona', 'Properties', 'Объекты', 'Об\'єкти')),
      galleryTitle: L('Galeria', 'Gallery', 'Галерея', 'Галерея'),
      gallerySubtitle: d.title,
      gallery: addKeysToArrayItems([imgRef(imgId)]),
      faqTitle: L('Pyetje', 'FAQ', 'Вопросы', 'Питання'),
      faqItems: addKeysToArrayItems([faqItem(L('Pyetje?', 'Question?', 'Вопрос?', 'Питання?'), L('Përgjigje.', 'Answer.', 'Ответ.', 'Відповідь.'))]),
      seoText: d.desc,
      seo: {metaTitle: d.title, metaDescription: d.shortDesc, ogTitle: d.title, ogDescription: d.shortDesc, noIndex: false},
    })
  }
  console.log('Districts:', districtsData.length)

  // --- 7. SiteSettings ---
  const siteLogoId = await uploadImage('logo')
  await client.createOrReplace({
    _id: 'siteSettings',
    _type: 'siteSettings',
    siteName: L('Domlivo', 'Domlivo', 'Domlivo', 'Domlivo'),
    siteTagline: L('Pasuri në Shqipëri', 'Real Estate in Albania', 'Недвижимость в Албании', 'Нерухомість в Албанії'),
    logo: imgRef(siteLogoId),
    contactEmail: 'hello@domlivo.com',
    contactPhone: '+355 69 000 0000',
    companyAddress: 'Tirana, Albania',
    socialLinks: addKeysToArrayItems([
      {platform: 'Facebook', url: 'https://facebook.com/domlivo'},
      {platform: 'Instagram', url: 'https://instagram.com/domlivo'},
      {platform: 'LinkedIn', url: 'https://linkedin.com/company/domlivo'},
    ]),
    footerQuickLinks: addKeysToArrayItems([
      {href: '/properties', label: L('Pronat', 'Properties', 'Объекты', 'Об\'єкти')},
      {href: '/cities', label: L('Qytetet', 'Cities', 'Города', 'Міста')},
      {href: '/about', label: L('Rreth nesh', 'About', 'О нас', 'Про нас')},
      {href: '/contact', label: L('Kontakto', 'Contact', 'Контакты', 'Контакти')},
      {href: '/blog', label: L('Blog', 'Blog', 'Блог', 'Блог')},
    ]),
    copyrightText: L('© 2025 Domlivo', '© 2025 Domlivo', '© 2025 Domlivo', '© 2025 Domlivo'),
    priceRange: {from: 0, to: 1000000},
    defaultSeo: {metaTitle: L('Domlivo', 'Domlivo', 'Domlivo', 'Domlivo'), metaDescription: L('Pasuri në Shqipëri', 'Property in Albania', 'Недвижимость', 'Нерухомість'), noIndex: false},
  })
  console.log('SiteSettings: 1')

  // --- 8. Properties (18) ---
  const propertiesData = [
    {slug: 'modern-apartment-blloku', cityId: 'city-tirana', districtId: 'district-blloku', typeSlug: 'apartment', agentIdx: 0, status: 'sale' as const, price: 125000, bed: 2, bath: 1, area: 75, tags: ['city-center', 'new-development'], amenities: ['elevator', 'balcony', 'parking'], title: L('Apartament modern në Blloku', 'Modern Apartment in Blloku', 'Современная квартира в Блоку', 'Сучасна квартира в Блоку'), shortDesc: L('2 dhoma në Tiranë', '2-bed in Tirana', '2-комн. в Тиранe', '2-кімн. в Тірані'), featured: true},
    {slug: 'sea-view-durres', cityId: 'city-durres', districtId: 'district-plazh', typeSlug: 'apartment', agentIdx: 1, status: 'sale' as const, price: 95000, bed: 2, bath: 2, area: 65, tags: ['near-beach'], amenities: ['sea-view', 'balcony', 'ac'], title: L('Apartament me pamje deti', 'Sea View Apartment', 'Квартира с видом на море', 'Квартира з видом на море'), shortDesc: L('Bregdeti i Durrësit', 'Beachfront Durres', 'У моря в Дурресе', 'Біля моря в Дурресі'), featured: true},
    {slug: 'villa-seafront-sarande', cityId: 'city-sarande', districtId: 'district-seafront-sarande', typeSlug: 'villa', agentIdx: 2, status: 'sale' as const, price: 450000, bed: 4, bath: 4, area: 220, tags: ['near-beach', 'premium-area'], amenities: ['pool', 'garden', 'terrace', 'parking', 'ac'], title: L('Vilë luksoze në bregdet', 'Luxury Villa in Sarande Seafront', 'Люкс вилла на набережной Саранды', 'Люкс вілла на набережній Саранди'), shortDesc: L('4 dhoma me pishinë', '4-bed with pool', '4 спальни с бассейном', '4 спальні з басейном'), featured: true},
    {slug: 'penthouse-tirana', cityId: 'city-tirana', districtId: 'district-blloku', typeSlug: 'penthouse', agentIdx: 0, status: 'sale' as const, price: 285000, bed: 3, bath: 2, area: 145, tags: ['city-center', 'premium-area'], amenities: ['elevator', 'balcony', 'ac', 'sea-view'], title: L('Penthouse në Blloku', 'Penthouse in Blloku', 'Пентхаус в Блоку', 'Пентхаус в Блоку'), shortDesc: L('Pamje panoramike', 'Panoramic views', 'Панорамный вид', 'Панорамний вид'), featured: true},
    {slug: 'apartment-qender', cityId: 'city-tirana', districtId: 'district-new-bazaar', typeSlug: 'apartment', agentIdx: 1, status: 'sale' as const, price: 78000, bed: 1, bath: 1, area: 45, tags: ['city-center'], amenities: ['elevator'], title: L('Apartament qendror', 'Central Apartment', 'Центральная квартира', 'Центральна квартира'), shortDesc: L('1 dhomë', '1-bed', '1-комн.', '1-кімн.'), featured: false},
    {slug: 'house-komuna-parisit', cityId: 'city-tirana', districtId: 'district-komuna-parisit', typeSlug: 'house', agentIdx: 2, status: 'sale' as const, price: 185000, bed: 3, bath: 2, area: 140, tags: ['quiet-area', 'family-friendly'], amenities: ['garden', 'parking'], title: L('Shtëpi familjare', 'Family House', 'Семейный дом', 'Сімейний будинок'), shortDesc: L('3 dhoma me kopsht', '3-bed with garden', '3-комн. с садом', '3-кімн. з садом'), featured: false},
    {slug: 'studio-blloku-rent', cityId: 'city-tirana', districtId: 'district-blloku', typeSlug: 'studio', agentIdx: 0, status: 'rent' as const, price: 450, bed: 1, bath: 1, area: 35, tags: ['city-center'], amenities: ['furnished', 'ac'], title: L('Studio për qira', 'Studio for Rent', 'Студия в аренду', 'Студія в оренду'), shortDesc: L('Studio në Blloku', 'Studio in Blloku', 'Студия в Блоку', 'Студія в Блоку'), featured: false},
    {slug: 'short-term-lungomare', cityId: 'city-vlore', districtId: 'district-lungomare', typeSlug: 'apartment', agentIdx: 2, status: 'short-term' as const, price: 650, bed: 2, bath: 1, area: 70, tags: ['near-beach', 'walkable-location'], amenities: ['sea-view', 'ac', 'furnished'], title: L('Qira pushimi', 'Holiday Rental', 'Аренда для отдыха', 'Оренда для відпочинку'), shortDesc: L('2 dhoma në bregdet', '2-bed waterfront', '2-комн. на набережной', '2-кімн. на набережній'), featured: true},
    {slug: 'commercial-durres', cityId: 'city-durres', districtId: 'district-durres-center', typeSlug: 'commercial', agentIdx: 1, status: 'sale' as const, price: 180000, bed: 0, bath: 2, area: 100, tags: ['city-center', 'investment-opportunity'], amenities: ['parking', 'elevator'], title: L('Hapësirë tregtare', 'Commercial Space', 'Коммерческая площадь', 'Комерційна площа'), shortDesc: L('100m²', '100m²', '100м²', '100м²'), featured: false},
    {slug: 'office-tirana', cityId: 'city-tirana', districtId: 'district-pazari-i-ri', typeSlug: 'office', agentIdx: 3, status: 'rent' as const, price: 1200, bed: 0, bath: 2, area: 85, tags: ['city-center', 'new-development'], amenities: ['elevator', 'parking', 'ac'], title: L('Zyra për qira', 'Office for Rent', 'Офис в аренду', 'Офіс в оренду'), shortDesc: L('Zyra moderne', 'Modern office', 'Современный офис', 'Сучасний офіс'), featured: false},
    {slug: 'apartment-sarande-center', cityId: 'city-sarande', districtId: 'district-sarande-center', typeSlug: 'apartment', agentIdx: 0, status: 'sale' as const, price: 85000, bed: 2, bath: 1, area: 58, tags: ['city-center', 'walkable-location'], amenities: ['balcony', 'ac'], title: L('Apartament në Sarandë', 'Apartment in Sarande', 'Квартира в Саранде', 'Квартира в Саранді'), shortDesc: L('2 dhoma qendër', '2-bed center', '2-комн. центр', '2-кімн. центр'), featured: false},
    {slug: 'villa-uji-i-ftohte', cityId: 'city-vlore', districtId: 'district-uji-i-ftohte', typeSlug: 'villa', agentIdx: 2, status: 'sale' as const, price: 320000, bed: 3, bath: 3, area: 180, tags: ['near-beach', 'premium-area'], amenities: ['pool', 'terrace', 'sea-view', 'parking'], title: L('Vilë afër plazhit', 'Villa near Beach', 'Вилла у пляжа', 'Вілла біля пляжу'), shortDesc: L('3 dhoma me pishinë', '3-bed with pool', '3 спальни с бассейном', '3 спальні з басейном'), featured: true},
    {slug: 'land-shkoder', cityId: 'city-shkoder', districtId: 'district-parruce', typeSlug: 'land', agentIdx: 4, status: 'sale' as const, price: 45000, bed: 0, bath: 0, area: 500, tags: ['investment-opportunity', 'quiet-area'], amenities: [], title: L('Tokë për zhvillim', 'Land for Development', 'Участок под застройку', 'Ділянка під забудову'), shortDesc: L('500m²', '500m²', '500м²', '500м²'), featured: false},
    {slug: 'apartment-himare', cityId: 'city-himare', districtId: 'district-livadhi', typeSlug: 'apartment', agentIdx: 1, status: 'short-term' as const, price: 750, bed: 2, bath: 2, area: 72, tags: ['near-beach'], amenities: ['balcony', 'ac', 'furnished'], title: L('Apartament me pamje', 'Sea View Apartment in Livadhi', 'Квартира с видом в Ливади', 'Квартира з видом в Ліваді'), shortDesc: L('2 dhoma në Livadh', '2-bed in Livadhi', '2-комн. в Ливади', '2-кімн. в Ліваді'), featured: true},
    {slug: 'house-komuna-parisit-large', cityId: 'city-tirana', districtId: 'district-komuna-parisit', typeSlug: 'house', agentIdx: 3, status: 'sale' as const, price: 220000, bed: 4, bath: 3, area: 195, tags: ['quiet-area', 'family-friendly'], amenities: ['garden', 'terrace', 'parking'], title: L('Shtëpi familjare me pamje', 'Family House with Garden in Komuna e Parisit', 'Дом с садом в Коммуна Паризит', 'Будинок з садом у Комуна Паризит'), shortDesc: L('4 dhoma me kopsht', '4-bed with garden', '4 спальни с садом', '4 спальні з садом'), featured: false},
    {slug: 'apartment-shkozet', cityId: 'city-durres', districtId: 'district-shkozet', typeSlug: 'apartment', agentIdx: 2, status: 'sale' as const, price: 115000, bed: 2, bath: 2, area: 78, tags: ['new-development', 'investment-opportunity'], amenities: ['elevator', 'balcony', 'parking', 'ac'], title: L('Apartament i ri në Shkozet', 'New Apartment in Shkozet', 'Новая квартира в Шкозете', 'Нова квартира в Шкозеті'), shortDesc: L('2 dhoma Shkozet', '2-bed Shkozet', '2-комн. Шкозет', '2-кімн. Шкозет'), featured: false},
    {slug: 'villa-vlore-center', cityId: 'city-vlore', districtId: 'district-vlore-center', typeSlug: 'villa', agentIdx: 4, status: 'sale' as const, price: 380000, bed: 4, bath: 4, area: 250, tags: ['near-beach', 'premium-area'], amenities: ['pool', 'garden', 'terrace', 'parking', 'ac'], title: L('Vilë luksoze në Vlorë', 'Luxury Villa in Vlore', 'Люкс вилла в Влёре', 'Люкс вілла у Вльорі'), shortDesc: L('4 dhoma me pishinë', '4-bed luxury', '4 спальни люкс', '4 спальні люкс'), featured: true},
    {slug: 'apartment-shkoder', cityId: 'city-shkoder', districtId: 'district-gjuhadol', typeSlug: 'apartment', agentIdx: 0, status: 'sale' as const, price: 52000, bed: 2, bath: 1, area: 62, tags: ['city-center', 'investment-opportunity'], amenities: ['balcony', 'parking'], title: L('Apartament në Shkodër', 'Apartment in Shkoder', 'Квартира в Шкодере', 'Квартира в Шкодері'), shortDesc: L('2 dhoma Gjuhadol', '2-bed Gjuhadol', '2-комн. Гьюхадол', '2-кімн. Гьюхадол'), featured: false},
    {slug: 'apartment-kodra-sarande', cityId: 'city-sarande', districtId: 'district-kodra', typeSlug: 'apartment', agentIdx: 3, status: 'short-term' as const, price: 550, bed: 1, bath: 1, area: 48, tags: ['near-beach', 'walkable-location'], amenities: ['sea-view', 'ac', 'furnished'], title: L('Studio me pamje në Kodër', 'Studio with Views in Kodra', 'Студия с видом в Кодра', 'Студія з видом у Кодра'), shortDesc: L('Pamje panoramike', 'Panoramic views', 'Панорамный вид', 'Панорамний вид'), featured: false},
  ]

  for (const p of propertiesData) {
    const desc = localizedDescription(420)
    const galleryIds = await Promise.all([uploadImage(`prop-${p.slug}-1`), uploadImage(`prop-${p.slug}-2`), uploadImage(`prop-${p.slug}-3`)])
    const ogImgId = await uploadImage(`prop-og-${p.slug}`)
    await client.createOrReplace({
      _id: `property-${p.slug}`,
      _type: 'property',
      title: p.title,
      slug: {current: p.slug},
      shortDescription: p.shortDesc,
      description: desc,
      agent: {_type: 'reference', _ref: agentIds[p.agentIdx]},
      type: {_type: 'reference', _ref: propertyTypeIds[p.typeSlug]},
      status: p.status,
      isPublished: true,
      price: p.price,
      featured: p.featured,
      investment: p.featured,
      city: {_type: 'reference', _ref: p.cityId},
      district: {_type: 'reference', _ref: p.districtId},
      area: p.area,
      bedrooms: p.bed,
      bathrooms: p.bath,
      gallery: addKeysToArrayItems(galleryIds.map((id) => imgRef(id))),
      coordinatesLat: 41.3275,
      coordinatesLng: 19.8187,
      locationTags: addKeysToArrayItems(p.tags.map((t) => ({_type: 'reference' as const, _ref: locationTagIds[t]}))),
      amenitiesRefs: addKeysToArrayItems(p.amenities.map((s) => ({_type: 'reference' as const, _ref: amenityIds[s]}))),
      lifecycleStatus: 'active' as const,
      ownerUserId: 'seed-script',
      seo: {
        metaTitle: {en: p.title.en, uk: p.title.uk, ru: p.title.ru, sq: p.title.sq, it: p.title.en},
        metaDescription: {
          en: (p.shortDesc.en ?? '').slice(0, 155) || p.title.en,
          uk: (p.shortDesc.uk ?? '').slice(0, 155) || p.title.uk,
          ru: (p.shortDesc.ru ?? '').slice(0, 155) || p.title.ru,
          sq: (p.shortDesc.sq ?? '').slice(0, 155) || p.title.sq,
          it: (p.shortDesc.en ?? '').slice(0, 155) || p.title.en,
        },
        ogTitle: {en: p.title.en, uk: p.title.uk, ru: p.title.ru, sq: p.title.sq, it: p.title.en},
        ogDescription: {
          en: (p.shortDesc.en ?? '').slice(0, 155) || p.title.en,
          uk: (p.shortDesc.uk ?? '').slice(0, 155) || p.title.uk,
          ru: (p.shortDesc.ru ?? '').slice(0, 155) || p.title.ru,
          sq: (p.shortDesc.sq ?? '').slice(0, 155) || p.title.sq,
          it: (p.shortDesc.en ?? '').slice(0, 155) || p.title.en,
        },
        ogImage: imgRef(ogImgId),
        noIndex: false,
      },
    })
  }
  console.log('Properties:', propertiesData.length)

  // --- 10. Blog Categories (8) ---
  const blogCategoriesData = [
    {id: 'blogCategory-buying', slug: 'buying-in-albania', title: L('Blerja në Shqipëri', 'Buying in Albania', 'Покупка в Албании', 'Купівля в Албанії'), desc: L('Udhëzues për blerjen e pasurive të paluajtshme.', 'Complete guides for buying real estate in Albania.', 'Полные гайды по покупке недвижимости в Албании.', 'Повні гайди з купівлі нерухомості в Албанії.')},
    {id: 'blogCategory-renting', slug: 'renting-in-albania', title: L('Qira në Shqipëri', 'Renting in Albania', 'Аренда в Албании', 'Оренда в Албанії'), desc: L('Informacion për qira afatshkurtër dhe afatgjatë.', 'Information for short-term and long-term rentals.', 'Информация об аренде краткосрочной и долгосрочной.', 'Інформація про оренду короткострокову та довгострокову.')},
    {id: 'blogCategory-investment', slug: 'investment-guides', title: L('Udhëzues Investimi', 'Investment Guides', 'Гайды по инвестициям', 'Гайди з інвестицій'), desc: L('Këshilla investimi dhe kthime.', 'Investment tips and returns.', 'Советы по инвестициям и доходности.', 'Поради щодо інвестицій та прибутковості.')},
    {id: 'blogCategory-city-guides', slug: 'city-guides', title: L('Udhëzues Qyteti', 'City Guides', 'Гайды по городам', 'Гайди по містах'), desc: L('Eksploro Tiranën, Durrësin, Vlorën dhe më shumë.', 'Explore Tirana, Durres, Vlore and more.', 'Исследуйте Тирану, Дуррес, Влёру и др.', 'Дослідіть Тірану, Дуррес, Вльору та інші.')},
    {id: 'blogCategory-district-guides', slug: 'district-guides', title: L('Udhëzues Lagjet', 'District Guides', 'Гайды по районам', 'Гайди по районах'), desc: L('Zbuloni lagjet më të mira për blerje.', 'Discover the best districts for buying.', 'Узнайте лучшие районы для покупки.', 'Дізнайтесь найкращі райони для купівлі.')},
    {id: 'blogCategory-legal', slug: 'legal-and-taxes', title: L('Ligjore dhe Taksa', 'Legal and Taxes', 'Юридическое и налоги', 'Юридичне та податки'), desc: L('Informacion ligjor dhe tatimor.', 'Legal and tax information.', 'Юридическая и налоговая информация.', 'Юридична та податкова інформація.')},
    {id: 'blogCategory-market', slug: 'market-trends', title: L('Tendencat e Tregut', 'Market Trends', 'Тенденции рынка', 'Тенденції ринку'), desc: L('Lajme dhe analiza të tregut.', 'Market news and analysis.', 'Новости и анализ рынка.', 'Новини та аналіз ринку.')},
    {id: 'blogCategory-lifestyle', slug: 'lifestyle', title: L('Mënyrë jetese', 'Lifestyle', 'Образ жизни', 'Спосіб життя'), desc: L('Jeta dhe zhvillimi në Shqipëri.', 'Living and development in Albania.', 'Жизнь и развитие в Албании.', 'Життя та розвиток в Албанії.')},
  ]
  const blogCategoryIds: string[] = []
  for (let i = 0; i < blogCategoriesData.length; i++) {
    const c = blogCategoriesData[i]
    await client.createOrReplace({
      _id: c.id,
      _type: 'blogCategory',
      title: c.title,
      slug: {current: c.slug},
      description: c.desc,
      order: i + 1,
      active: true,
    })
    blogCategoryIds.push(c.id)
  }
  console.log('Blog categories:', blogCategoriesData.length)

  // --- 11. Blog Posts (6) - min 1500 words, with tables/FAQ/callouts ---
  const BLOG_PARAS = [
    'Albania has emerged as one of the most attractive real estate markets in Southeast Europe. With its stunning coastline along the Adriatic and Ionian seas, affordable prices compared to Western Europe, and a growing economy, the country offers unique opportunities for both investors and those seeking a second home. The government has made it easier for foreigners to purchase property, and the rental market, especially in coastal areas like Durres, Vlore, and Sarande, continues to show strong demand from tourists.',
    'The Albanian real estate market has experienced significant growth over the past decade. Property prices remain relatively low compared to neighboring countries like Greece and Montenegro, while the quality of life and natural beauty rival or exceed many Mediterranean destinations. The country offers a favorable tax regime for property owners, with no annual property tax for primary residences under certain conditions.',
    'Foreign buyers can purchase property in Albania with minimal restrictions. The main requirement is obtaining a fiscal number (NIPT) and opening a local bank account. The process typically takes several weeks, and working with a reputable real estate agent can streamline the entire experience. Most transactions are conducted in euros, and title transfers are registered with the Immovable Property Registration Office.',
    'When buying property in Albania, consider the location carefully. Coastal areas offer high rental yields during the tourist season but may have lower occupancy in winter. Tirana and other major cities provide more stable year-round demand. New developments often offer better amenities and legal clarity compared to older properties.',
    'It is essential to conduct due diligence on the title and any existing liens. Work with a local lawyer who specializes in real estate transactions. The notary plays a crucial role in the process, and fees are typically around 2-3% of the property value. Budget for additional costs including agency fees, registration, and potential renovation.',
    'The Albanian Riviera, stretching from Vlore to Sarande, is particularly popular among foreign buyers. Towns like Himare, Dhermi, and Ksamil offer crystal-clear waters and a relaxed lifestyle. Property prices in these areas have risen but remain competitive. Many investors purchase with the intention of short-term rentals, capitalizing on the growing tourism sector.',
    'Albania\'s membership in NATO and its EU candidate status have contributed to political stability and economic growth. Infrastructure improvements, including new roads and airport expansions, continue to enhance connectivity. The country\'s young population and growing middle class support long-term property demand in urban centers.',
    'Tirana, the capital, has become a hub for both business and residential investment. Districts like Blloku, Komuna e Parisit, and Pazari i Ri (New Bazaar) offer diverse options from modern apartments to traditional homes. The city continues to expand with new developments offering contemporary amenities.',
    'Coastal cities such as Durres, Vlore, and Sarande attract buyers seeking beachfront properties and holiday homes. The Albanian coast remains one of the last affordable Mediterranean frontiers, with prices significantly lower than Croatia or Italy. Rental yields of 6-8% are achievable in popular tourist zones.',
    'Before signing any contract, ensure the seller has clear title and that the property is free of encumbrances. The cadastral system has improved significantly, but older properties may require additional verification. A qualified notary will guide you through the legal requirements and ensure a secure transfer.',
    'Financing options for foreigners have improved, with some local banks offering mortgages to non-residents. However, many international buyers prefer to purchase with cash or arrange financing from their home country. Currency fluctuations should be considered when planning your budget.',
    'Property management services are widely available in tourist areas, making it easier for overseas owners to maintain and rent their properties. Management fees typically range from 15-25% of rental income and cover cleaning, maintenance, and guest communication.',
    'Climate is another advantage: Albania enjoys a Mediterranean climate with hot summers and mild winters. Coastal areas see over 300 days of sunshine per year. This appeals to buyers from Northern Europe seeking a second home or retirement destination. Heating costs are minimal compared to colder regions.',
    'The country\'s culinary scene and hospitality sector have developed rapidly. Tirana offers a vibrant restaurant culture, while coastal towns provide fresh seafood and traditional Albanian cuisine. The low cost of living makes Albania attractive for long-term stays and retirement.',
    'In conclusion, Albania presents a compelling opportunity for property investment. Whether you seek a holiday home, a rental income stream, or a permanent residence, the market offers diverse options across cities and coast. Partner with experienced professionals and take the time to understand the local context for a successful purchase.',
  ]

  const buildBlogContent = (intro: string, hasTable: boolean, hasFaq: boolean, hasCallout: boolean, seed: string) => {
    const blocks: unknown[] = []
    let ki = 0
    const k = () => `bp-${seed}-${ki++}`
    blocks.push(block(intro, k()))
    blocks.push(h2('Why Albania?', k()))
    blocks.push(block(BLOG_PARAS[1], k()))
    blocks.push(block(BLOG_PARAS[2], k()))
    blocks.push(h3('Key Considerations', k()))
    blocks.push(block(BLOG_PARAS[3], k()))
    blocks.push(block(BLOG_PARAS[4], k()))
    if (hasCallout) {
      blocks.push({
        _type: 'blogCallout',
        _key: k(),
        variant: 'tip',
        title: L('Pro Tip', 'Pro Tip', 'Совет', 'Порада'),
        content: [
          {_type: 'block', _key: `ct-${seed}`, style: 'normal' as const, children: [{_type: 'span', _key: `ct-${seed}-s`, text: 'Always visit the property in person before making an offer. Photos can be misleading, and experiencing the location firsthand helps you make an informed decision.', marks: []}], markDefs: []},
        ],
      })
    }
    blocks.push(block(BLOG_PARAS[5], k()))
    if (hasTable) {
      blocks.push({
        _type: 'blogTable',
        _key: k(),
        title: L('Average Price by City (€/m²)', 'Average Price by City (€/m²)', 'Средняя цена по городам', 'Середня ціна по містах'),
        rows: addKeysToArrayItems([
          {cells: ['City', 'Price/m²', 'Trend']},
          {cells: ['Tirana', '€1,200-1,800', '↑ 5%']},
          {cells: ['Durres', '€1,000-1,500', '↑ 7%']},
          {cells: ['Vlore', '€900-1,400', '↑ 6%']},
          {cells: ['Sarande', '€1,100-1,600', '↑ 8%']},
          {cells: ['Shkoder', '€700-1,100', '↑ 4%']},
          {cells: ['Himare', '€1,000-1,500', '↑ 9%']},
        ]),
        caption: L('Source: Domlivo Market Report 2025', 'Source: Domlivo Market Report 2025', 'Источник: Domlivo 2025', 'Джерело: Domlivo 2025'),
      })
    }
    blocks.push(block(BLOG_PARAS[6], k()))
    blocks.push(h3('Popular Locations', k()))
    blocks.push(block(BLOG_PARAS[7], k()))
    blocks.push(block(BLOG_PARAS[8], k()))
    blocks.push(h3('Legal and Practical Tips', k()))
    blocks.push(block(BLOG_PARAS[9], k()))
    blocks.push(block(BLOG_PARAS[10], k()))
    blocks.push(block(BLOG_PARAS[11], k()))
    blocks.push(block(BLOG_PARAS[12], k()))
    blocks.push(block(BLOG_PARAS[13], k()))
    blocks.push(block(BLOG_PARAS[14], k()))
    if (hasFaq) {
      blocks.push({
        _type: 'blogFaqBlock',
        _key: k(),
        title: L('Frequently Asked Questions', 'Frequently Asked Questions', 'Частые вопросы', 'Часті питання'),
        items: addKeysToArrayItems([
          faqItem(L('Can foreigners buy property?', 'Can foreigners buy property?', 'Могут ли иностранцы купить?', 'Чи можуть іноземці купити?'), L('Yes. You need a NIPT (fiscal number) and a local bank account. The process typically takes 4-8 weeks. There are no restrictions on EU or non-EU citizens.', 'Yes. You need a NIPT (fiscal number) and a local bank account. The process typically takes 4-8 weeks. There are no restrictions on EU or non-EU citizens.', 'Да. Нужен ИНН и местный счёт.', 'Так. Потрібен ІПН та місцевий рахунок.')),
          faqItem(L('What are the costs?', 'What are the costs?', 'Какие расходы?', 'Які витрати?'), L('Notary fees 2-3%, registration, and optionally agent fees. Total transaction costs typically amount to 5-8% of the purchase price. Budget for these when planning your investment.', 'Notary fees 2-3%, registration, and optionally agent fees. Total transaction costs typically amount to 5-8% of the purchase price. Budget for these when planning your investment.', 'Около 5-8% от стоимости.', 'Близько 5-8% від вартості.')),
          faqItem(L('Best areas for investment?', 'Best areas for investment?', 'Лучшие районы?', 'Найкращі райони?'), L('Tirana for capital growth and year-round demand. Coastal cities (Durres, Vlore, Sarande) for rental yield. Ksamil and Himare are especially popular for holiday rentals with strong summer demand.', 'Tirana for capital growth and year-round demand. Coastal cities for rental yield. Ksamil and Himare for holiday rentals.', 'Тирана для роста, побережье для аренды.', 'Тірана для зростання, узбережжя для оренди.')),
          faqItem(L('How long does the purchase take?', 'How long does the purchase take?', 'Сколько времени занимает покупка?', 'Скільки часу займає покупка?'), L('From offer to completion typically takes 6-12 weeks. This includes due diligence, contract preparation, notary signing, and registration. Working with an experienced agent can expedite the process.', 'From offer to completion typically takes 6-12 weeks. This includes due diligence, contract preparation, notary signing, and registration.', 'Обычно 6-12 недель.', 'Зазвичай 6-12 тижнів.')),
        ]),
      })
    }
    blocks.push(block(BLOG_PARAS[15], k()))
    return blocks
  }

  const blogPostsData = [
    {slug: 'best-areas-to-buy-property-in-tirana', title: L('Vendet më të mira për blerje në Tiranë', 'Best Areas to Buy Property in Tirana', 'Лучшие районы для покупки в Тиранe', 'Найкращі райони для купівлі в Тірані'), excerpt: L('Blloku, Komuna e Parisit, Pazari i Ri dhe më shumë.', 'Blloku, Komuna e Parisit, New Bazaar and more.', 'Блоку, Комуна Паризит, Новый базар и др.', 'Блоку, Комуна Паризит, Новий базар та інші.'), categoryIdx: 4, table: true, faq: true, callout: true},
    {slug: 'buying-apartment-durres-complete-guide', title: L('Blerja e apartamentit në Durrës: Udhëzues i plotë', 'Buying an Apartment in Durres: Complete Guide', 'Покупка квартиры в Дурресе: полный гайд', 'Купівля квартири в Дурресі: повний гайд'), excerpt: L('Udhëzues nga hapat fillestarë deri në regjistrimin.', 'From first steps to registration.', 'От первых шагов до регистрации.', 'Від перших кроків до реєстрації.'), categoryIdx: 0, table: true, faq: true, callout: true},
    {slug: 'property-investment-potential-vlore-sarande', title: L('Potenciali i investimit në Vlorë dhe Sarandë', 'Property Investment Potential in Vlore and Sarande', 'Инвестиционный потенциал Влёры и Саранды', 'Інвестиційний потенціал Вльори та Саранди'), excerpt: L('Kthime, kërkesë dhe zhvillime të reja.', 'Returns, demand and new developments.', 'Доходность, спрос и новостройки.', 'Доходність, попит та новобудови.'), categoryIdx: 2, table: true, faq: true, callout: false},
    {slug: 'can-foreigners-buy-real-estate-albania', title: L('A mund të blejnë të huajt pasuri në Shqipëri?', 'Can Foreigners Buy Real Estate in Albania?', 'Могут ли иностранцы купить недвижимость в Албании?', 'Чи можуть іноземці купити нерухомість в Албанії?'), excerpt: L('Kërkesat, procesi dhe kufizimet.', 'Requirements, process and restrictions.', 'Требования, процесс и ограничения.', 'Вимоги, процес та обмеження.'), categoryIdx: 5, table: false, faq: true, callout: true},
    {slug: 'short-term-rental-albanian-riviera', title: L('Mundësitë e qirasë afatshkurtër në Rivierën Shqiptare', 'Short-Term Rental Opportunities on the Albanian Riviera', 'Краткосрочная аренда на албанской Ривьере', 'Короткострокова оренда на албанській Рів\'єрі'), excerpt: L('Vlore, Sarande, Himare — kthime dhe kërkesë.', 'Vlore, Sarande, Himare — returns and demand.', 'Влёра, Саранда, Химара — доход и спрос.', 'Вльора, Саранда, Хімара — дохід та попит.'), categoryIdx: 1, table: true, faq: true, callout: true},
    {slug: 'how-to-choose-tirana-durres-vlore', title: L('Si të zgjidhni ndërmjet Tiranës, Durrësit dhe Vlorës', 'How to Choose Between Tirana, Durres, and Vlore', 'Как выбрать между Тираной, Дурресом и Влёрой', 'Як обрати між Тіраною, Дурресом та Вльорою'), excerpt: L('Krahasim: qëndrimi, kthime, stili i jetesës.', 'Compare: location, returns, lifestyle.', 'Сравнение: локация, доходность, образ жизни.', 'Порівняння: локація, доходність, спосіб життя.'), categoryIdx: 3, table: true, faq: true, callout: true},
  ]

  for (let i = 0; i < blogPostsData.length; i++) {
    const p = blogPostsData[i]
    const contentBlocks = buildBlogContent(BLOG_PARAS[0], p.table, p.faq, p.callout, p.slug)
    const coverImgId = await uploadImage(`blog-${p.slug}`)
    await client.createOrReplace({
      _id: `blogPost-${p.slug}`,
      _type: 'blogPost',
      title: p.title,
      slug: {current: p.slug},
      excerpt: p.excerpt,
      content: {
        en: addKeysToArrayItems(contentBlocks),
        sq: addKeysToArrayItems(contentBlocks),
        ru: addKeysToArrayItems(contentBlocks),
        uk: addKeysToArrayItems(contentBlocks),
      },
      publishedAt: new Date().toISOString(),
      categories: [{_type: 'reference', _ref: blogCategoryIds[p.categoryIdx]}],
      featured: i < 2,
      authorName: 'Domlivo Team',
      authorRole: 'Real Estate Advisors',
      coverImage: imgRef(coverImgId),
      seo: {
        metaTitle: p.title,
        metaDescription: p.excerpt,
        ogTitle: p.title,
        ogDescription: p.excerpt,
        noIndex: false,
      },
    })
  }
  console.log('Blog posts:', blogPostsData.length)

  // --- 12. HomePage (section-based) ---
  const heroImgId = await uploadImage('home-hero')
  const invImg1 = await uploadImage('investment-1')
  const invImg2 = await uploadImage('investment-2')
  const homeSections = addKeysToArrayItems([
    {
      _type: 'heroSection',
      enabled: true,
      title: Li('Gjeni pronën e ëndrrave tuaja në Shqipëri', 'Find your dream property in Albania', 'Найдите недвижимость мечты в Албании', 'Знайдіть нерухомість мрії в Албанії', 'Trova la proprietà dei tuoi sogni in Albania'),
      subtitle: Li('Apartamente, vila dhe pasuri investimi në të gjithë Shqipërinë', 'Apartments, villas and investment real estate across Albania', 'Квартиры, виллы и инвестиционная недвижимость по всей Албании', 'Квартири, вілли та інвестиційна нерухомість по всій Албанії', 'Appartamenti, ville e immobili per investimenti in tutta l\'Albania'),
      shortLine: Li('Listime të verifikuara • Çmime transparente • Pa komisione të fshehura', 'Verified listings • Transparent prices • No hidden commissions', 'Проверенные объявления • Прозрачные цены • Без скрытых комиссий', 'Перевірені оголошення • Прозорі ціни • Без прихованих комісій', 'Annunci verificati • Prezzi trasparenti • Nessuna commissione nascosta'),
      backgroundImage: imgRef(heroImgId),
      cta: ctaLi('/properties', Li('Shiko pronat', 'Browse Properties', 'Смотреть объекты', 'Переглянути об\'єкти', 'Sfoglia proprietà')),
    },
    {
      _type: 'propertyCarouselSection',
      enabled: true,
      title: Li('Prona të Zgjedhura në Shqipëri', 'Featured Properties in Albania', 'Избранные объекты в Албании', 'Обрані об\'єкти в Албанії', 'Proprietà in evidenza in Albania'),
      subtitle: Li('Apartamente, vila dhe pronë investimi të përzgjedhura me kujdes', 'Hand-picked apartments, villas and investment properties', 'Тщательно отобранные квартиры, виллы и объекты для инвестиций', 'Ретельно відібрані квартири, вілли та інвестиційні об\'єкти', 'Appartamenti, ville e immobili per investimenti selezionati a mano'),
      cta: ctaLi('/properties', Li('Shiko të gjitha pronat', 'View All Properties', 'Смотреть все объекты', 'Переглянути всі об\'єкти', 'Vedi tutte le proprietà')),
      mode: 'auto',
    },
    {
      _type: 'locationCarouselSection',
      enabled: true,
      title: Li('Qytetet më të Kërkuara në Shqipëri', 'Popular Cities in Albania', 'Популярные города Албании', 'Популярні міста Албанії', 'Città più richieste in Albania'),
      subtitle: Li('Eksploroni vendet më të kërkuara për blerjen e pasurive', 'Explore the most demanded locations for buying property', 'Исследуйте самые востребованные локации для покупки недвижимости', 'Досліджуйте найпопулярніші локації для купівлі нерухомості', 'Esplora le località più richieste per l\'acquisto di immobili'),
      cta: ctaLi('/cities', Li('Eksploro lokacionet', 'Explore Locations', 'Смотреть локации', 'Дослідити локації', 'Esplora le località')),
      mode: 'manual',
      manualItems: ['city-tirana', 'city-durres', 'city-vlore', 'city-sarande', 'city-shkoder', 'city-himare'].map((id) => ({
        _type: 'reference' as const,
        _ref: id,
      })),
    },
    {
      _type: 'propertyTypesSection',
      enabled: true,
      title: Li('Llojet e Pasurive', 'Property Types', 'Типы недвижимости', 'Типи нерухомості', 'Tipi di proprietà'),
      subtitle: Li('Zgjidhni llojin e pasurisë që u përshtatet qëllimeve tuaja', 'Choose the type of real estate that suits your goals', 'Выберите тип недвижимости под ваши цели', 'Оберіть тип нерухомості за вашими цілями', 'Scegli il tipo di immobile che si adatta ai tuoi obiettivi'),
      cta: ctaLi('/properties', Li('Shiko pronat', 'View Properties', 'Смотреть объекты', 'Переглянути об\'єкти', 'Vedi proprietà')),
      propertyTypes: [],
    },
    {
      _type: 'investmentSection',
      enabled: true,
      title: Li('Investoni në Pasurinë Shqiptare', 'Invest in Albanian Real Estate', 'Инвестируйте в недвижимость Албании', 'Інвестуйте в нерухомість Албанії', 'Investi nel mercato immobiliare albanese'),
      description: Li(
        'Shqipëria është një nga tregjet me rritje më të shpejtë të pasurive në Evropë. Investitorët tërhiqen nga çmimet e ulëta hyrëse, turizmi në rritje dhe kërkesa e lartë për qira përgjatë bregut Adriatik dhe Jon.',
        'Albania is one of the fastest growing property markets in Europe. Investors are attracted by low entry prices, increasing tourism, and strong rental demand along the Adriatic and Ionian coast.',
        'Албания — один из самых быстрорастущих рынков недвижимости в Европе. Инвесторов привлекают низкие входные цены, рост туризма и высокий спрос на аренду на побережье Адриатики и Ионического моря.',
        'Албанія — один із найдинамічніших ринків нерухомості в Європі. Інвесторів приваблюють низькі вхідні ціни, зростання туризму та високий попит на оренду вздовж узбережжя Адріатики та Іонічного моря.',
        'L\'Albania è uno dei mercati immobiliari in più rapida crescita in Europa. Gli investitori sono attratti dai prezzi di ingresso contenuti, dal turismo in crescita e dalla forte domanda di affitti lungo la costa adriatica e ionica.'
      ),
      benefits: [
        Li('Kërkesë e lartë për qira në qytetet bregdetare', 'High rental demand in coastal cities', 'Высокий спрос на аренду в прибрежных городах', 'Високий попит на оренду в прибережних містах', 'Forte domanda di affitti nelle città costiere'),
        Li('Tregu i turizmit në rritje', 'Growing tourism market', 'Растущий туристический рынок', 'Зростаючий туристичний ринок', 'Mercato turistico in crescita'),
        Li('Çmimet e pasurive ende nën mesataren e BE', 'Property prices still below EU average', 'Цены на недвижимость всё ещё ниже среднего по ЕС', 'Ціни на нерухомість досі нижчі за середні в ЄС', 'Prezzi immobiliari ancora sotto la media UE'),
      ],
      cta: ctaLi('/properties?investment=true', Li('Eksploro mundësitë e investimit', 'Explore Investment Opportunities', 'Смотреть инвестиционные возможности', 'Дослідити інвестиційні можливості', 'Esplora le opportunità di investimento')),
      primaryImage: imgRef(invImg1),
      secondaryImage: imgRef(invImg2),
    },
    {
      _type: 'aboutSection',
      enabled: true,
      title: Li('Pse të zgjidhni Domlivo', 'Why Choose Domlivo', 'Почему Domlivo', 'Чому Domlivo', 'Perché scegliere Domlivo'),
      description: Li(
        'Domlivo është një platformë pasurish e fokusuar në tregun shqiptar. Ndihmojmë blerësit të zbulojnë pronë të verifikuar, të lidhen me agjentë të besuar dhe të marrin vendime të sigurta investimi.',
        'Domlivo is a real estate platform focused on the Albanian property market. We help buyers discover verified properties, connect with trusted agents and make confident investment decisions.',
        'Domlivo — платформа недвижимости, сфокусированная на албанском рынке. Мы помогаем покупателям находить проверенные объекты, связываться с надёжными агентами и принимать уверенные инвестиционные решения.',
        'Domlivo — платформа нерухомості, зосереджена на албанському ринку. Ми допомагаємо покупцям знаходити перевірені об\'єкти, зв\'язуватися з надійними агентами та приймати впевнені інвестиційні рішення.',
        'Domlivo è una piattaforma immobiliare focalizzata sul mercato albanese. Aiutiamo gli acquirenti a scoprire immobili verificati, a mettersi in contatto con agenti fidati e a prendere decisioni di investimento con sicurezza.'
      ),
      benefits: [
        Li('Listime të verifikuara', 'Verified listings', 'Проверенные объявления', 'Перевірені оголошення', 'Annunci verificati'),
        Li('Ekspertizë lokale në pasuri', 'Local real estate expertise', 'Местная экспертиза по недвижимости', 'Місцева експертиза з нерухомості', 'Competenza locale nel settore immobiliare'),
        Li('Informacion transparent për pronat', 'Transparent property information', 'Прозрачная информация об объектах', 'Прозора інформація про об\'єкти', 'Informazioni trasparenti sugli immobili'),
      ],
    },
    {
      _type: 'agentsPromoSection',
      enabled: true,
      title: Li('Punoni me Ekspertët Lokalë', 'Work With Local Experts', 'Работайте с местными экспертами', 'Працюйте з місцевими експертами', 'Lavora con esperti locali'),
      subtitle: Li('Lidhuni me agjentë të përvojshëm të pasurive', 'Connect with experienced real estate agents', 'Свяжитесь с опытными агентами по недвижимости', 'Зв\'яжіться з досвідченими агентами з нерухомості', 'Connettiti con agenti immobiliari esperti'),
      description: Li(
        'Agjentët tanë partnerë ju ndihmojnë të lundroni në tregun shqiptar të pasurive dhe ju mbështesin gjatë gjithë procesit të blerjes.',
        'Our partner agents help you navigate the Albanian property market and support you throughout the buying process.',
        'Наши партнёрские агенты помогают ориентироваться на албанском рынке недвижимости и поддерживают вас на всём пути покупки.',
        'Наші партнерські агенти допомагають орієнтуватися на албанському ринку нерухомості та підтримують вас протягом усього процесу купівлі.',
        'I nostri agenti partner ti aiutano a orientarti nel mercato immobiliare albanese e ti supportano durante l\'intero processo di acquisto.'
      ),
      benefits: [
        Li('Njohuri të tregut lokal', 'Local market knowledge', 'Знание местного рынка', 'Знання місцевого ринку', 'Conoscenza del mercato locale'),
        Li('Mbështetje gjatë procesit të blerjes', 'Support during the purchase process', 'Поддержка в процессе покупки', 'Підтримка під час процесу купівлі', 'Supporto durante il processo di acquisto'),
        Li('Agjentë profesionistë të besuar', 'Trusted professional agents', 'Надёжные профессиональные агенты', 'Надійні професійні агенти', 'Agenti professionali fidati'),
      ],
      cta: ctaLi('/agents', Li('Kontakto një agjent', 'Contact an Agent', 'Связаться с агентом', 'Зв\'язатися з агентом', 'Contatta un agente')),
    },
    {
      _type: 'articlesSection',
      title: Li('Njohuri për Pasuri', 'Real Estate Insights', 'Обзоры рынка недвижимости', 'Огляди ринку нерухомості', 'Approfondimenti immobiliari'),
      subtitle: Li('Udhëzues, këshilla dhe analiza të tregut për pasuri në Shqipëri', 'Guides, tips and market insights about property in Albania', 'Гайды, советы и обзоры рынка недвижимости в Албании', 'Гайди, поради та огляди ринку нерухомості в Албанії', 'Guide, consigli e analisi di mercato sugli immobili in Albania'),
      cta: ctaLi('/blog', Li('Lexo të gjitha artikujt', 'Read All Articles', 'Читать все статьи', 'Читати всі статті', 'Leggi tutti gli articoli')),
      mode: 'latest',
    },
    {
      _type: 'seoTextSection',
      enabled: true,
      content: localizedBlockContentFromLiText(Li(
        'Blerja e pasurive në Shqipëri është bërë gjithnjë e më tërheqëse për blerësit dhe investitorët ndërkombëtarë. Vendi ofron një kombinim unik të stilit të jetesës mesdhetare, çmimeve të përballueshme të pasurive dhe potencialit të fortë investimi afatgjatë. Qytete si Tirana, Durrësi, Vlorë dhe Sarandë po përjetojnë zhvillim të qëndrueshëm dhe kërkesë në rritje nga blerësit vendas dhe ndërkombëtarë. Pavarësisht nëse kërkoni një apartament pushimi, një investim qiraje ose një banesë të përhershme, tregu shqiptar i pasurive ofron një gamë të gjerë mundësish.',
        'Buying property in Albania has become increasingly attractive for international buyers and investors. The country offers a unique combination of Mediterranean lifestyle, affordable real estate prices and strong long-term investment potential. Cities such as Tirana, Durres, Vlora and Saranda are experiencing steady development and growing demand from both local and international buyers. Whether you are looking for a holiday apartment, a rental investment or a permanent residence, the Albanian property market offers a wide range of opportunities.',
        'Покупка недвижимости в Албании становится всё привлекательнее для международных покупателей и инвесторов. Страна предлагает уникальное сочетание средиземноморского образа жизни, доступных цен на недвижимость и сильного долгосрочного инвестиционного потенциала. Такие города, как Тирана, Дуррес, Влёра и Саранда, переживают стабильное развитие и растущий спрос со стороны местных и иностранных покупателей. Независимо от того, ищете ли вы квартиру для отдыха, объект для сдачи в аренду или постоянное жильё, албанский рынок недвижимости предлагает широкий выбор возможностей.',
        'Купівля нерухомості в Албанії стає дедалі привабливішою для міжнародних покупців та інвесторів. Країна пропонує унікальне поєднання середземноморського способу життя, доступних цін на нерухомість та сильного довгострокового інвестиційного потенціалу. Такі міста, як Тірана, Дуррес, Вльора та Саранда, переживають стабільний розвиток і зростаючий попит з боку місцевих та іноземних покупців. Незалежно від того, шукаєте ви квартиру для відпочинку, об\'єкт для оренди чи постійне житло, албанський ринок нерухомості пропонує широкий вибір можливостей.',
        'L\'acquisto di immobili in Albania è diventato sempre più attraente per acquirenti e investitori internazionali. Il paese offre una combinazione unica di stile di vita mediterraneo, prezzi immobiliari accessibili e forte potenziale di investimento a lungo termine. Città come Tirana, Durazzo, Valona e Saranda stanno vivendo uno sviluppo costante e una domanda in crescita da parte di acquirenti locali e internazionali. Che cerchiate un appartamento per le vacanze, un investimento in affitto o una residenza permanente, il mercato immobiliare albanese offre un\'ampia gamma di opportunità.'
      ), 'home-seo'),
    },
    {
      _type: 'faqSection',
      enabled: true,
      title: Li('Pyetje të Shpeshta', 'Frequently Asked Questions', 'Часто задаваемые вопросы', 'Поширені питання', 'Domande frequenti'),
      items: addKeysToArrayItems([
        faqItemLi(
          Li('A mund të huajt të blejnë pronë në Shqipëri?', 'Can foreigners buy property in Albania?', 'Могут ли иностранцы купить недвижимость в Албании?', 'Чи можуть іноземці купити нерухомість в Албанії?', 'Gli stranieri possono acquistare immobili in Albania?'),
          Li('Po. Qytetarët e huaj mund të blejnë ligjërisht pasuri në Shqipëri. Procesi i blerjes është i qartë dhe të drejtat e pronësisë mbrohen me ligj.', 'Yes. Foreign citizens can legally purchase real estate in Albania. The buying process is straightforward and property ownership rights are protected by law.', 'Да. Иностранные граждане могут на законных основаниях приобретать недвижимость в Албании. Процесс покупки прозрачен, права собственности защищены законом.', 'Так. Іноземні громадяни можуть на законних підставах купувати нерухомість в Албанії. Процес купівлі прозорий, права власності захищені законом.', 'Sì. I cittadini stranieri possono acquistare legalmente immobili in Albania. Il processo di acquisto è lineare e i diritti di proprietà sono protetti dalla legge.')
        ),
        faqItemLi(
          Li('Cilat janë qytetet më të kërkuara për blerjen e pasurive?', 'What are the most popular cities for buying property?', 'Какие города наиболее популярны для покупки недвижимости?', 'Які міста найпопулярніші для купівлі нерухомості?', 'Quali sono le città più popolari per l\'acquisto di immobili?'),
          Li('Lokalitetet më të kërkuara përfshijnë Tiranën, Durrësin, Vlorën dhe Sarandën. Këto qytete ofrojnë kërkesë të lartë për qira dhe infrastrukturë të mirë.', 'The most popular locations include Tirana, Durres, Vlore and Saranda. These cities offer strong rental demand and good infrastructure.', 'Наиболее популярные локации — Тирана, Дуррес, Влёра и Саранда. Эти города отличаются высоким спросом на аренду и развитой инфраструктурой.', 'Найпопулярніші локації — Тірана, Дуррес, Вльора та Саранда. Ці міста мають високий попит на оренду та розвинену інфраструктуру.', 'Le località più popolari includono Tirana, Durazzo, Valona e Saranda. Queste città offrono forte domanda di affitti e buone infrastrutture.')
        ),
        faqItemLi(
          Li('Sa kohë zgjat procesi i blerjes?', 'How long does the buying process take?', 'Сколько длится процесс покупки?', 'Скільки триває процес купівлі?', 'Quanto dura il processo di acquisto?'),
          Li('Në shumicën e rasteve, blerja e një prone në Shqipëri mund të përfundojë brenda disa javëve pas nënshkrimit të marrëveshjes paraprake.', 'In most cases a property purchase in Albania can be completed within several weeks after signing the preliminary agreement.', 'В большинстве случаев покупка недвижимости в Албании может быть завершена в течение нескольких недель после подписания предварительного соглашения.', 'У більшості випадків купівлю нерухомості в Албанії можна завершити протягом кількох тижнів після підписання попередньої угоди.', 'Nella maggior parte dei casi l\'acquisto di un immobile in Albania può essere completato entro poche settimane dalla firma del preliminare.')
        ),
      ]),
    },
  ])
  await client.createOrReplace({
    _id: 'landing-home',
    _type: 'landingPage',
    pageType: 'home',
    enabled: true,
    pageSections: homeSections,
    seo: {
      metaTitle: Li('Domlivo', 'Domlivo', 'Domlivo', 'Domlivo', 'Domlivo'),
      metaDescription: Li(
        'Pasuri në Shqipëri',
        'Property in Albania',
        'Недвижимость в Албании',
        'Нерухомість в Албанії',
        'Immobiliare in Albania',
      ),
      ogTitle: Li('Domlivo', 'Domlivo', 'Domlivo', 'Domlivo', 'Domlivo'),
      ogDescription: Li('Pasuri në Shqipëri', 'Property in Albania', 'Недвижимость', 'Нерухомість', 'Immobiliare'),
      ogImage: imgRef(heroImgId),
      noIndex: false,
    },
  })
  console.log('Landing (home): 1 (pageSections)')

  console.log('\nFull seed completed successfully.')
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
