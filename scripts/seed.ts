/**
 * Domlivo CMS Seed Script
 * Creates clean field-level i18n mock content.
 *
 * Run: npm run seed
 *
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

const LANGS = ['sq', 'en', 'ru', 'uk'] as const
type L = {sq: string; en: string; ru: string; uk: string}

function L(sq: string, en: string, ru: string, uk: string): L {
  return {sq, en, ru, uk}
}

function block(text: string, key?: string) {
  const k = key || `k-${Math.random().toString(36).slice(2, 10)}`
  return {
    _type: 'block',
    _key: k,
    style: 'normal',
    children: [{_type: 'span', _key: `${k}-s1`, text, marks: []}],
    markDefs: [],
  }
}

async function uploadPlaceholderImage(): Promise<string> {
  const res = await fetch('https://picsum.photos/800/600')
  const buffer = Buffer.from(await res.arrayBuffer())
  const asset = await client.assets.upload('image', buffer, {filename: 'placeholder.jpg'})
  return asset._id
}

function img(assetId: string) {
  return {_type: 'image', asset: {_type: 'reference', _ref: assetId}}
}

async function main() {
  validateEnv()
  console.log(`Seeding ${ENV.projectId} / ${ENV.dataset}...`)

  const placeholderId = await uploadPlaceholderImage()
  const imgRef = () => img(placeholderId)

  // --- 1. Property Types (field-level i18n: one doc per type) ---
  const propertyTypes = [
    {slugBase: 'apartment', title: L('Apartament', 'Apartment', 'Квартира', 'Квартира'), shortDescription: L('Apartamente për banim.', 'Residential apartments.', 'Жилые квартиры.', 'Житлові квартири.')},
    {slugBase: 'house', title: L('Shtëpi', 'House', 'Дом', 'Будинок'), shortDescription: L('Shtëpi të pavarura.', 'Standalone houses.', 'Отдельные дома.', 'Окремі будинки.')},
    {slugBase: 'villa', title: L('Vilë', 'Villa', 'Вилла', 'Вілла'), shortDescription: L('Vila me standard të lartë.', 'High-standard villas.', 'Виллы высокого класса.', 'Вілли високого класу.')},
    {slugBase: 'commercial', title: L('Tregtare', 'Commercial', 'Коммерческая', 'Комерційна'), shortDescription: L('Hapësira tregtare.', 'Commercial space.', 'Коммерческая недвижимость.', 'Комерційна нерухомість.')},
    {slugBase: 'short-term-rental', title: L('Qira afatshkurtër', 'Short Term Rental', 'Краткосрочная аренда', 'Короткострокова оренда'), shortDescription: L('Qira për pushime.', 'Holiday rentals.', 'Аренда для отдыха.', 'Оренда для відпочинку.')},
  ]
  const propertyTypeIds: Record<string, string> = {}
  for (let i = 0; i < propertyTypes.length; i++) {
    const pt = propertyTypes[i]
    const doc = await client.createOrReplace({
      _id: `propertyType-${pt.slugBase}`,
      _type: 'propertyType',
      title: pt.title,
      image: imgRef(),
      shortDescription: pt.shortDescription,
      order: i + 1,
      active: true,
    })
    propertyTypeIds[pt.slugBase] = doc._id
  }
  console.log('Property types:', propertyTypes.length)

  // --- 2. Location Tags (field-level i18n: one doc per tag) ---
  const locationTags = [
    {slugBase: 'sea-view', title: L('Pamje deti', 'Sea View', 'Вид на море', 'Вид на море'), description: L('Prona me pamje të detit.', 'Properties with sea view.', 'Объекты с видом на море.', 'Об\'єкти з видом на море.')},
    {slugBase: 'city-center', title: L('Qendra e qytetit', 'City Center', 'Центр города', 'Центр міста'), description: L('Vendndodhje qendrore.', 'Central location.', 'Центральное расположение.', 'Центральне розташування.')},
    {slugBase: 'new-building', title: L('Ndërtesë e re', 'New Building', 'Новостройка', 'Новобудова'), description: L('Ndërtesa të reja.', 'New constructions.', 'Новые здания.', 'Нові будівлі.')},
    {slugBase: 'investment', title: L('Investim', 'Investment', 'Инвестиции', 'Інвестиції'), description: L('Përshtatshëm për investim.', 'Suitable for investment.', 'Подходит для инвестиций.', 'Підходить для інвестицій.')},
    {slugBase: 'beachfront', title: L('Bregdetar', 'Beachfront', 'У моря', 'Біля моря'), description: L('Direkt në bregdet.', 'Directly on the beach.', 'Прямо на пляже.', 'Прямо на пляжі.')},
    {slugBase: 'luxury', title: L('Luks', 'Luxury', 'Люкс', 'Люкс'), description: L('Prona luksoze.', 'Luxury properties.', 'Элитная недвижимость.', 'Елітна нерухомість.')},
    {slugBase: 'near-park', title: L('Afër parkut', 'Near Park', 'У парка', 'Біля парку'), description: L('Afër zonave të gjelbra.', 'Near green areas.', 'Рядом с парками.', 'Поруч з парками.')},
    {slugBase: 'tourist-area', title: L('Zonë turistike', 'Tourist Area', 'Туристический район', 'Туристичний район'), description: L('Zona me kërkesë turistike.', 'High tourist demand area.', 'Район с туристическим спросом.', 'Район з туристичним попитом.')},
  ]
  const locationTagIds: Record<string, string> = {}
  for (const lt of locationTags) {
    const doc = await client.createOrReplace({
      _id: `locationTag-${lt.slugBase}`,
      _type: 'locationTag',
      title: lt.title,
      slug: {current: lt.slugBase},
      description: lt.description,
      active: true,
    })
    locationTagIds[lt.slugBase] = doc._id
  }
  console.log('Location tags:', locationTags.length)

  // --- 2b. Amenities (for property filtering) ---
  const amenities = [
    {id: 'pool', title: L('Pishinë', 'Pool', 'Бассейн', 'Басейн')},
    {id: 'parking', title: L('Parkim', 'Parking', 'Парковка', 'Парківка')},
    {id: 'sea-view', title: L('Pamje deti', 'Sea View', 'Вид на море', 'Вид на море')},
    {id: 'elevator', title: L('Ashensor', 'Elevator', 'Лифт', 'Ліфт')},
    {id: 'furnished', title: L('E mobiluar', 'Furnished', 'Меблирована', 'Мебльована')},
    {id: 'balcony', title: L('Ballkon', 'Balcony', 'Балкон', 'Балкон')},
    {id: 'garden', title: L('Kopsht', 'Garden', 'Сад', 'Сад')},
    {id: 'terrace', title: L('Tarracë', 'Terrace', 'Терраса', 'Тераса')},
    {id: 'ac', title: L('Kondicioner', 'Air Conditioning', 'Кондиционер', 'Кондиціонер')},
    {id: 'wifi', title: L('WiFi', 'WiFi', 'WiFi', 'WiFi')},
  ]
  const amenityIds: Record<string, string> = {}
  for (let i = 0; i < amenities.length; i++) {
    const a = amenities[i]
    const doc = await client.createOrReplace({
      _id: `amenity-${a.id}`,
      _type: 'amenity',
      title: a.title,
      order: i + 1,
      active: true,
    })
    amenityIds[a.id] = doc._id
  }
  console.log('Amenities:', amenities.length)

  // --- 3. Agents ---
  const agents = [
    {name: 'Elena Krasniqi', email: 'elena@domlivo.com', phone: '+355 69 123 4567'},
    {name: 'Arben Shala', email: 'arben@domlivo.com', phone: '+355 68 234 5678'},
    {name: 'Olga Dervishi', email: 'olga@domlivo.com', phone: '+355 67 345 6789'},
  ]
  const agentIds: string[] = []
  for (let i = 0; i < agents.length; i++) {
    const a = agents[i]
    const doc = await client.createOrReplace({
      _id: `agent-${i + 1}`,
      _type: 'agent',
      name: a.name,
      email: a.email,
      phone: a.phone,
      photo: imgRef(),
    })
    agentIds.push(doc._id)
  }
  console.log('Agents:', agents.length)

  // --- 4. Cities (ONE doc per city, field-level i18n) ---
  const cityData: Array<{
    id: string
    slugBase: string
    title: L
    heroTitle: L
    heroSubtitle: L
    heroShortLine: L
    shortDescription: L
    description: L
    investmentText: L
    featuredPropertiesTitle: L
    featuredPropertiesSubtitle: L
    districtsTitle: L
    districtsIntro: L
    galleryTitle: L
    gallerySubtitle: L
    faqTitle: L
    seoText: L
    order: number
  }> = [
    {
      id: 'city-tirana',
      slugBase: 'tirana',
      order: 1,
      title: L('Tirana', 'Tirana', 'Тирана', 'Тірана'),
      heroTitle: L('Zbuloni Tiranën', 'Discover Tirana', 'Откройте Тирану', 'Відкрийте Тірану'),
      heroSubtitle: L(
        'Kryeqyteti i shndritshëm me mundësi në pasuri të paluajtshme',
        'The vibrant capital with growing real estate opportunities',
        'Столица Албании с растущими возможностями на рынке недвижимости',
        'Столиця Албанії з ринком нерухомості'
      ),
      heroShortLine: L('Kryeqyteti', 'Capital', 'Столица', 'Столиця'),
      shortDescription: L(
        'Tirana ofron mënyrë jetese urbane dhe potencial investimi.',
        'Tirana offers urban lifestyle and investment potential.',
        'Тирана сочетает городской образ жизни и инвестиционный потенциал.',
        'Тірана пропонує міський спосіб життя та інвестиційний потенціал.'
      ),
      description: L(
        'Tirana është kryeqyteti i Shqipërisë. Tregu i pasurive ka rritur ndjeshëm.',
        'Tirana is Albania\'s capital. The real estate market has grown significantly.',
        'Тирана — столица Албании. Рынок недвижимости значительно вырос.',
        'Тірана — столиця Албанії. Ринок нерухомості значно зріс.'
      ),
      investmentText: L(
        'Investimi në Tiranë ofron kthime të mira.',
        'Investment in Tirana offers solid returns.',
        'Инвестиции в Тиранe предлагают стабильную доходность.',
        'Інвестиції в Тірані пропонують стабільну доходність.'
      ),
      featuredPropertiesTitle: L('Prona të Zgjedhura', 'Featured Properties', 'Избранные объекты', 'Обрані об\'єкти'),
      featuredPropertiesSubtitle: L('Prona në Tiranë', 'Properties in Tirana', 'Объекты в Тиранe', 'Об\'єкти в Тірані'),
      districtsTitle: L('Lagjet', 'Districts', 'Районы', 'Райони'),
      districtsIntro: L(
        'Tirana ka lagje të dallueshme.',
        'Tirana has distinct districts.',
        'В Тиранe есть несколько заметных районов.',
        'У Тірані є кілька помітних районів.'
      ),
      galleryTitle: L('Galeria', 'Gallery', 'Галерея', 'Галерея'),
      gallerySubtitle: L('Pamje nga Tirana', 'Views of Tirana', 'Виды Тираны', 'Види Тірани'),
      faqTitle: L('Pyetje', 'FAQ', 'Вопросы', 'Питання'),
      seoText: L(
        'Bli pronë në Tiranë. Apartamente dhe shtëpi.',
        'Buy property in Tirana. Apartments and houses.',
        'Купить недвижимость в Тиранe. Квартиры и дома.',
        'Купити нерухомість у Тірані. Квартири та будинки.'
      ),
    },
    {
      id: 'city-durres',
      slugBase: 'durres',
      order: 2,
      title: L('Durrësi', 'Durres', 'Дуррес', 'Дуррес'),
      heroTitle: L('Durrësi — Jeta Bregdetare', 'Durres — Coastal Living', 'Дуррес — прибрежная жизнь', 'Дуррес — прибережне життя'),
      heroSubtitle: L(
        'Qyteti kryesor portor me plazhe dhe potencial investimi',
        'Albania\'s main port city with beaches and investment potential',
        'Главный портовый город Албании с пляжами',
        'Головне портове місто Албанії з пляжами'
      ),
      heroShortLine: L('Porti', 'Port City', 'Портовый город', 'Портове місто'),
      shortDescription: L(
        'Durrësi kombinon detin, historinë dhe çmime të arritshme.',
        'Durres combines sea, history and affordable prices.',
        'Дуррес сочетает море, историю и доступные цены.',
        'Дуррес поєднує море, історію та доступні ціни.'
      ),
      description: L(
        'Durrësi është porti kryesor. Qytet bregdetar popular.',
        'Durres is the main port. A popular coastal city.',
        'Дуррес — главный порт. Популярный прибрежный город.',
        'Дуррес — головний порт. Популярне прибережне місто.'
      ),
      investmentText: L(
        'Kërkesa për qira nga turistët është e lartë.',
        'Rental demand from tourists is high.',
        'Спрос на аренду от туристов высокий.',
        'Попит на оренду від туристів високий.'
      ),
      featuredPropertiesTitle: L('Prona në Durrës', 'Properties in Durres', 'Объекты в Дурресе', 'Об\'єкти в Дурресі'),
      featuredPropertiesSubtitle: L('Bregdeti', 'Coast', 'Побережье', 'Узбережжя'),
      districtsTitle: L('Lagjet e Durrësit', 'Districts of Durres', 'Районы Дурреса', 'Райони Дурреса'),
      districtsIntro: L('Plazhi dhe Qendra.', 'Plazh and City Center.', 'Плаж и центр.', 'Пляж та центр.'),
      galleryTitle: L('Galeria', 'Gallery', 'Галерея', 'Галерея'),
      gallerySubtitle: L('Durrësi', 'Durres', 'Дуррес', 'Дуррес'),
      faqTitle: L('Pyetje', 'FAQ', 'Вопросы', 'Питання'),
      seoText: L(
        'Pronë në Durrës. Apartamente bregdetare.',
        'Property in Durres. Beachfront apartments.',
        'Недвижимость в Дурресе. Квартиры у моря.',
        'Нерухомість у Дурресі. Квартири біля моря.'
      ),
    },
    {
      id: 'city-vlore',
      slugBase: 'vlore',
      order: 3,
      title: L('Vlora', 'Vlore', 'Влёра', 'Вльора'),
      heroTitle: L('Vlora — Porta e Rivierës', 'Vlore — Riviera Gateway', 'Влёра — врата Ривьеры', 'Вльора — брама Рів\'єри'),
      heroSubtitle: L(
        'Hyrja në Rivierën Shqiptare',
        'Gateway to the Albanian Riviera',
        'Вход на албанскую Ривьеру',
        'Вхід на албанську Рів\'єру'
      ),
      heroShortLine: L('Riviera', 'Riviera', 'Ривьера', 'Рів\'єра'),
      shortDescription: L(
        'Vlora ofron plazhe dhe një mënyrë jetese relaksuese.',
        'Vlore offers beaches and a relaxed coastal lifestyle.',
        'Влёра предлагает пляжи и расслабленный образ жизни.',
        'Вльора пропонує пляжі та розслаблений спосіб життя.'
      ),
      description: L(
        'Vlora është hyrja në Rivierën Shqiptare.',
        'Vlore is the gateway to the Albanian Riviera.',
        'Влёра — вход на албанскую Ривьеру.',
        'Вльора — вхід на албанську Рів\'єру.'
      ),
      investmentText: L(
        'Tregu tërheq blerës dhe qiramarrës.',
        'The market attracts buyers and renters.',
        'Рынок привлекает покупателей и арендаторов.',
        'Ринок приваблює покупців та орендарів.'
      ),
      featuredPropertiesTitle: L('Prona në Vlorë', 'Properties in Vlore', 'Объекты во Влёре', 'Об\'єкти у Вльорі'),
      featuredPropertiesSubtitle: L('Bregdeti', 'Coast', 'Побережье', 'Узбережжя'),
      districtsTitle: L('Lagjet', 'Districts', 'Районы', 'Райони'),
      districtsIntro: L('Lungomare dhe Uji i Ftohtë.', 'Lungomare and Uji i Ftohte.', 'Лунгомарe и Уйи и Фтохте.', 'Лунгомарe та Уйи і Фтохте.'),
      galleryTitle: L('Galeria', 'Gallery', 'Галерея', 'Галерея'),
      gallerySubtitle: L('Vlora', 'Vlore', 'Влёра', 'Вльора'),
      faqTitle: L('Pyetje', 'FAQ', 'Вопросы', 'Питання'),
      seoText: L(
        'Pronë në Vlorë. Vila dhe apartamente.',
        'Property in Vlore. Villas and apartments.',
        'Недвижимость во Влёре. Виллы и квартиры.',
        'Нерухомість у Вльорі. Вілли та квартири.'
      ),
    },
    {
      id: 'city-sarande',
      slugBase: 'sarande',
      order: 4,
      title: L('Saranda', 'Sarande', 'Саранда', 'Саранда'),
      heroTitle: L('Saranda — Guri i Jugut', 'Sarande — Southern Gem', 'Саранда — жемчужина юга', 'Саранда — перлина півдня'),
      heroSubtitle: L(
        'Dielli, deti dhe pasuri në bregun jugor',
        'Sun, sea and property on Albania\'s southern coast',
        'Солнце, море и недвижимость на южном побережье',
        'Сонце, море та нерухомість на південному узбережжі'
      ),
      heroShortLine: L('Jugu', 'South', 'Юг', 'Південь'),
      shortDescription: L(
        'Saranda është destinacion turistik i popullarizuar.',
        'Sarande is a popular tourist destination.',
        'Саранда — популярный туристический курорт.',
        'Саранда — популярний туристичний курорт.'
      ),
      description: L(
        'Saranda shtrihet në bregun Jonian afër Greqisë.',
        'Sarande lies on the Ionian coast near Greece.',
        'Саранда расположена на Ионическом побережье.',
        'Саранда розташована на Іонічному узбережжі.'
      ),
      investmentText: L(
        'Kërkesa për qira është e lartë në sezon.',
        'Rental demand is high in season.',
        'Спрос на аренду высокий в сезон.',
        'Попит на оренду високий в сезон.'
      ),
      featuredPropertiesTitle: L('Prona në Sarandë', 'Properties in Sarande', 'Объекты в Саранде', 'Об\'єкти в Саранді'),
      featuredPropertiesSubtitle: L('Ksamili', 'Ksamil', 'Ксамил', 'Ксаміл'),
      districtsTitle: L('Lagjet', 'Districts', 'Районы', 'Райони'),
      districtsIntro: L('Qendra dhe Ksamili.', 'City Center and Ksamil.', 'Центр и Ксамил.', 'Центр та Ксаміл.'),
      galleryTitle: L('Galeria', 'Gallery', 'Галерея', 'Галерея'),
      gallerySubtitle: L('Saranda', 'Sarande', 'Саранда', 'Саранда'),
      faqTitle: L('Pyetje', 'FAQ', 'Вопросы', 'Питання'),
      seoText: L(
        'Pronë në Sarandë. Apartamente dhe vila afër Ksamilit.',
        'Property in Sarande. Apartments and villas near Ksamil.',
        'Недвижимость в Саранде. Квартиры и виллы у Ксамила.',
        'Нерухомість у Саранді. Квартири та вілли біля Ксаміла.'
      ),
    },
  ]

  for (const c of cityData) {
    await client.createOrReplace({
      _id: c.id,
      _type: 'city',
      title: c.title,
      slug: {current: c.slugBase},
      popular: true,
      order: c.order,
      isPublished: true,
      heroTitle: c.heroTitle,
      heroSubtitle: c.heroSubtitle,
      heroShortLine: c.heroShortLine,
      heroImage: imgRef(),
      heroCta: {href: '/properties', label: L('Shiko pronat', 'View properties', 'Смотреть объекты', 'Дивитися об\'єкти')},
      shortDescription: c.shortDescription,
      description: c.description,
      investmentText: c.investmentText,
      featuredPropertiesTitle: c.featuredPropertiesTitle,
      featuredPropertiesSubtitle: c.featuredPropertiesSubtitle,
      allPropertiesCta: {href: '/properties', label: L('Shiko pronat', 'View properties', 'Смотреть объекты', 'Дивитися об\'єкти')},
      districtsTitle: c.districtsTitle,
      districtsIntro: c.districtsIntro,
      districtStats: addKeysToArrayItems([
        {districtName: 'Center', averagePricePerM2: 1200, averageArea: 75, popularity: 'High'},
      ]),
      cityVideoUrl: '',
      galleryTitle: c.galleryTitle,
      gallerySubtitle: c.gallerySubtitle,
      gallery: addKeysToArrayItems([imgRef(), imgRef()]),
      faqTitle: c.faqTitle,
      faqItems: addKeysToArrayItems([
        {question: L('Pyetje?', 'Question?', 'Вопрос?', 'Питання?'), answer: L('Përgjigje.', 'Answer.', 'Ответ.', 'Відповідь.')},
      ]),
      seoText: c.seoText,
      seo: {
        metaTitle: c.title,
        metaDescription: c.shortDescription,
        ogTitle: c.title,
        ogDescription: c.shortDescription,
        noIndex: false,
      },
    })
  }
  console.log('Cities:', cityData.length)

  // --- 5. Districts (ONE doc per district) ---
  const districtData: Array<{
    id: string
    cityId: string
    slugBase: string
    title: L
    heroTitle: L
    heroSubtitle: L
    shortDescription: L
    description: L
    order: number
  }> = [
    {id: 'district-blloku', cityId: 'city-tirana', slugBase: 'blloku', order: 1, title: L('Blloku', 'Blloku', 'Блоку', 'Блоку'), heroTitle: L('Lagjia e Bllokut', 'Blloku District', 'Район Блоку', 'Район Блоку'), heroSubtitle: L('Zona më e modës', 'Trendiest area', 'Самый трендовый район', 'Найтрендовіший район'), shortDescription: L('Lagjia më e gjallë', 'Most vibrant district', 'Самый оживленный район', 'Найяскравіший район'), description: L('Blloku është zona më e gjallë e Tiranës.', 'Blloku is Tirana\'s most vibrant district.', 'Блоку — самый оживленный район Тираны.', 'Блоку — найяскравіший район Тірани.')},
    {id: 'district-qender', cityId: 'city-tirana', slugBase: 'qender', order: 2, title: L('Qender', 'Qender', 'Кендер', 'Кендер'), heroTitle: L('Qendra', 'Qender', 'Кендер', 'Кендер'), heroSubtitle: L('Lagjia qendrore', 'City center', 'Центральный район', 'Центральний район'), shortDescription: L('Zemra e Tiranës', 'Heart of Tirana', 'Сердце Тираны', 'Серце Тірани'), description: L('Qendra është zemra e Tiranës.', 'Qender is the heart of Tirana.', 'Кендер — сердце Тираны.', 'Кендер — серце Тірани.')},
    {id: 'district-komuna-parisit', cityId: 'city-tirana', slugBase: 'komuna-e-parisit', order: 3, title: L('Komuna e Parisit', 'Komuna e Parisit', 'Коммуна Паризит', 'Комуна Паризит'), heroTitle: L('Komuna e Parisit', 'Komuna e Parisit', 'Коммуна Паризит', 'Комуна Паризит'), heroSubtitle: L('Zonë banimi', 'Residential area', 'Жилой район', 'Житловий район'), shortDescription: L('Lagji i qetë', 'Quiet district', 'Тихий район', 'Тихій район'), description: L('Lagji banimi i qetë në Tiranë.', 'Quiet residential district in Tirana.', 'Тихий жилой район в Тиранe.', 'Тихій житловий район у Тірані.')},
    {id: 'district-plazh', cityId: 'city-durres', slugBase: 'plazh', order: 4, title: L('Plazhi', 'Plazh', 'Плаж', 'Пляж'), heroTitle: L('Plazhi', 'Plazh', 'Плаж', 'Пляж'), heroSubtitle: L('Lagjia bregdetare', 'Beach district', 'Пляжный район', 'Пляжний район'), shortDescription: L('Akses direkt në plazh', 'Direct beach access', 'Прямой доступ к пляжу', 'Прямий доступ до пляжу'), description: L('Plazhi ofron akses të drejtë në plazh.', 'Plazh offers direct beach access.', 'Плаж предлагает прямой доступ к пляжу.', 'Пляж пропонує прямий доступ до пляжу.')},
    {id: 'district-durres-city-center', cityId: 'city-durres', slugBase: 'city-center', order: 5, title: L('Qendra', 'City Center', 'Центр', 'Центр'), heroTitle: L('Qendra e Qytetit', 'City Center', 'Центр города', 'Центр міста'), heroSubtitle: L('Zemra e Durrësit', 'Heart of Durres', 'Сердце Дурреса', 'Серце Дурреса'), shortDescription: L('Qendra e Durrësit', 'Downtown Durres', 'Центр Дурреса', 'Центр Дурреса'), description: L('Qendra me dyqane dhe restorante.', 'Downtown with shops and restaurants.', 'Центр с магазинами и ресторанами.', 'Центр з магазинами та ресторанами.')},
    {id: 'district-lungomare', cityId: 'city-vlore', slugBase: 'lungomare', order: 6, title: L('Lungomare', 'Lungomare', 'Лунгомарe', 'Лунгомарe'), heroTitle: L('Lungomare', 'Lungomare', 'Лунгомарe', 'Лунгомарe'), heroSubtitle: L('Lagjia bregdetare', 'Waterfront', 'Прибрежный район', 'Прибережний район'), shortDescription: L('Promenada e famshme', 'Famous seafront', 'Знаменитая набережная', 'Знаменита набережна'), description: L('Lungomare është promenada e Vlorës.', 'Lungomare is Vlore\'s famous seafront.', 'Лунгомарe — знаменитая набережная Влёры.', 'Лунгомарe — знаменита набережна Вльори.')},
    {id: 'district-uji-i-ftohte', cityId: 'city-vlore', slugBase: 'uji-i-ftohte', order: 7, title: L('Uji i Ftohtë', 'Uji i Ftohte', 'Уйи и Фтохте', 'Уйи і Фтохте'), heroTitle: L('Uji i Ftohtë', 'Uji i Ftohte', 'Уйи и Фтохте', 'Уйи і Фтохте'), heroSubtitle: L('Plazh dhe natyrë', 'Beach and nature', 'Пляж и природа', 'Пляж та природа'), shortDescription: L('Plazhe dhe burime', 'Beaches and springs', 'Пляжи и источники', 'Пляжі та джерела'), description: L('Uji i Ftohtë ofron plazhe dhe natyrë.', 'Uji i Ftohte offers beaches and nature.', 'Уйи и Фтохте — пляжи и природа.', 'Уйи і Фтохте — пляжі та природа.')},
    {id: 'district-sarande-city-center', cityId: 'city-sarande', slugBase: 'city-center', order: 8, title: L('Qendra', 'City Center', 'Центр', 'Центр'), heroTitle: L('Qendra e Sarandës', 'Sarande City Center', 'Центр Саранды', 'Центр Саранди'), heroSubtitle: L('Qendra e qytetit', 'Downtown', 'Центр города', 'Центр міста'), shortDescription: L('Qendra me dyqane', 'Central with shops', 'Центр с магазинами', 'Центр з магазинами'), description: L('Qendra e Sarandës me pamje të detit.', 'Central Sarande with sea views.', 'Центр Саранды с видом на море.', 'Центр Саранди з видом на море.')},
    {id: 'district-ksamil', cityId: 'city-sarande', slugBase: 'ksamil', order: 9, title: L('Ksamil', 'Ksamil', 'Ксамил', 'Ксаміл'), heroTitle: L('Ksamil', 'Ksamil', 'Ксамил', 'Ксаміл'), heroSubtitle: L('Plazhet parajsore', 'Paradise beaches', 'Райские пляжи', 'Райські пляжі'), shortDescription: L('Ujërat e blerta', 'Turquoise waters', 'Бирюзовые воды', 'Бірюзові води'), description: L('Ksamili është i famshëm për plazhet e tij.', 'Ksamil is famous for its beaches.', 'Ксамил славится бирюзовой водой.', 'Ксаміл славиться бірюзовими водами.')},
  ]

  for (const d of districtData) {
    await client.createOrReplace({
      _id: d.id,
      _type: 'district',
      title: d.title,
      slug: {current: d.slugBase},
      city: {_type: 'reference', _ref: d.cityId},
      isPublished: true,
      order: d.order,
      heroTitle: d.heroTitle,
      heroSubtitle: d.description,
      heroShortLine: d.title,
      heroImage: imgRef(),
      heroCta: {href: '/properties', label: L('Shiko', 'View', 'Смотреть', 'Дивитися')},
      shortDescription: d.shortDescription,
      description: d.description,
      metricsTitle: L('Metrikat', 'Metrics', 'Метрики', 'Метрики'),
      metrics: addKeysToArrayItems([{label: 'Price', value: '€1,200/m²'}]),
      allPropertiesCta: {href: '/properties', label: L('Prona', 'Properties', 'Объекты', 'Об\'єкти')},
      galleryTitle: L('Galeria', 'Gallery', 'Галерея', 'Галерея'),
      gallerySubtitle: d.title,
      gallery: addKeysToArrayItems([imgRef()]),
      faqTitle: L('Pyetje', 'FAQ', 'Вопросы', 'Питання'),
      faqItems: addKeysToArrayItems([
        {question: L('Pyetje?', 'Question?', 'Вопрос?', 'Питання?'), answer: L('Përgjigje.', 'Answer.', 'Ответ.', 'Відповідь.')},
      ]),
      seoText: d.description,
      seo: {metaTitle: d.title, metaDescription: d.shortDescription, ogTitle: d.title, ogDescription: d.shortDescription, noIndex: false},
    })
  }
  console.log('Districts:', districtData.length)

  // --- 6. HomePage (ONE singleton) ---
  await client.createOrReplace({
    _id: 'homePage',
    _type: 'homePage',
    heroTitle: L('Gjeni Pronën Tuaj', 'Find Your Dream Property', 'Найдите недвижимость мечты', 'Знайдіть нерухомість мрії'),
    heroSubtitle: L(
      'Apartamente, shtëpi dhe vila në Shqipëri.',
      'Apartments, houses and villas in Albania.',
      'Квартиры, дома и виллы в Албании.',
      'Квартири, будинки та вілли в Албанії.'
    ),
    heroShortLine: L('Partneri juaj i besuar', 'Your trusted partner', 'Ваш надёжный партнёр', 'Ваш надійний партнер'),
    heroBackgroundImage: imgRef(),
    heroCta: {href: '/properties', label: L('Shiko pronat', 'Browse Properties', 'Смотреть объекты', 'Дивитися об\'єкти')},
    featuredEnabled: true,
    featuredTitle: L('Prona të Zgjedhura', 'Featured Properties', 'Избранные объекты', 'Обрані об\'єкти'),
    featuredSubtitle: L('Prona të përzgjedhura për ju.', 'Handpicked for you.', 'Подборка для вас.', 'Підбірка для вас.'),
    featuredCta: {href: '/properties', label: L('Shiko të gjitha', 'View All', 'Смотреть все', 'Дивитися всі')},
    citiesTitle: L('Eksploroni Qytetet', 'Explore Cities', 'Города', 'Міста'),
    citiesSubtitle: L('Tirana, Durrës, Vlorë, Sarandë.', 'Tirana, Durres, Vlore, Sarande.', 'Тирана, Дуррес, Влёра, Саранда.', 'Тірана, Дуррес, Вльора, Саранда.'),
    citiesCta: {href: '/cities', label: L('Eksploro', 'Explore', 'Исследовать', 'Дослідити')},
    propertyTypesTitle: L('Llojet e Pasurive', 'Property Types', 'Типы недвижимости', 'Типи нерухомості'),
    propertyTypesSubtitle: L('Apartamente, shtëpi, vila.', 'Apartments, houses, villas.', 'Квартиры, дома, виллы.', 'Квартири, будинки, вілли.'),
    propertyTypesCta: {href: '/property-types', label: L('Shiko llojet', 'View Types', 'Типы', 'Типи')},
    investmentTitle: L('Investoni në Shqipëri', 'Invest in Albania', 'Инвестируйте в Албанию', 'Інвестуйте в Албанію'),
    investmentSubtitle: L(
      'Të ardhura të mira nga qira.',
      'Attractive returns from rentals.',
      'Привлекательная доходность от аренды.',
      'Приваблива доходність від оренди.'
    ),
    investmentBenefits: ['6-8% rental yields', 'No restrictions for foreign buyers', 'Low transaction costs'],
    investmentPrimaryImage: imgRef(),
    investmentSecondaryImage: imgRef(),
    investmentCta: {href: '/properties?investment=true', label: L('Prona investimi', 'Investment', 'Инвестиции', 'Інвестиції')},
    aboutTitle: L('Rreth Domlivo', 'About Domlivo', 'О Domlivo', 'Про Domlivo'),
    aboutText: L(
      'Domlivo ndihmon blerësit të gjejnë pronën e duhur.',
      'Domlivo helps buyers find the right property.',
      'Domlivo помогает покупателям найти недвижимость.',
      'Domlivo допомагає покупцям знайти нерухомість.'
    ),
    aboutBenefits: ['Local expertise', 'Multilingual support', 'Transparent process'],
    agentsEnabled: true,
    agentsTitle: L('Agjentët Tanë', 'Our Agents', 'Наши агенты', 'Наші агенти'),
    agentsSubtitle: L('Ekipi ynë është gati.', 'Our team is ready.', 'Наша команда готова.', 'Наша команда готова.'),
    agentsText: L('Na kontaktoni.', 'Contact us.', 'Свяжитесь с нами.', 'Зв\'яжіться з нами.'),
    agentsBenefits: ['Expertise', 'Support', 'Process'],
    agentsCta: {href: '/agents', label: L('Kontakto', 'Contact', 'Контакты', 'Контакти')},
    blogEnabled: true,
    blogTitle: L('Blog', 'Blog', 'Блог', 'Блог'),
    blogSubtitle: L('Udhëzues dhe këshilla.', 'Guides and tips.', 'Гайды и советы.', 'Гайди та поради.'),
    blogCta: {href: '/blog', label: L('Lexo', 'Read', 'Читать', 'Читати')},
    seoText: L(
      'Domlivo — tregu i pasurive të paluajtshme në Shqipëri.',
      'Domlivo is your real estate marketplace in Albania.',
      'Domlivo — рынок недвижимости в Албании.',
      'Domlivo — ринок нерухомості в Албанії.'
    ),
    seo: {metaTitle: L('Domlivo', 'Domlivo', 'Domlivo', 'Domlivo'), metaDescription: L('Pasuri në Shqipëri', 'Property in Albania', 'Недвижимость в Албании', 'Нерухомість в Албанії'), ogTitle: L('Domlivo', 'Domlivo', 'Domlivo', 'Domlivo'), ogDescription: L('Pasuri në Shqipëri', 'Property in Albania', 'Недвижимость', 'Нерухомість'), noIndex: false},
    faqEnabled: true,
    faqTitle: L('Pyetje të Shpeshta', 'FAQ', 'Часто задаваемые вопросы', 'Поширені питання'),
    faqItems: addKeysToArrayItems([
      {question: L('A mund të blejnë të huajt?', 'Can foreigners buy?', 'Могут ли иностранцы купить?', 'Чи можуть іноземці купити?'), answer: L('Po. Ju nevojitet NIPT dhe llogari bankare.', 'Yes. You need NIPT and a bank account.', 'Да. Нужен ИНН и банковский счёт.', 'Так. Потрібен ІПН та банківський рахунок.')},
      {question: L('Cilat qytete janë më të mira?', 'Best cities?', 'Какие города лучше?', 'Які міста кращі?'), answer: L('Tirana, Durrës, Sarandë.', 'Tirana, Durres, Sarande.', 'Тирана, Дуррес, Саранда.', 'Тірана, Дуррес, Саранда.')},
    ]),
  })
  console.log('HomePage: 1')

  // --- 7. SiteSettings (ONE singleton) ---
  await client.createOrReplace({
    _id: 'siteSettings',
    _type: 'siteSettings',
    siteName: L('Domlivo', 'Domlivo', 'Domlivo', 'Domlivo'),
    siteTagline: L('Pasuri në Shqipëri', 'Real Estate in Albania', 'Недвижимость в Албании', 'Нерухомість в Албанії'),
    logo: imgRef(),
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
    defaultSeo: {metaTitle: L('Domlivo', 'Domlivo', 'Domlivo', 'Domlivo'), metaDescription: L('Pasuri në Shqipëri', 'Property in Albania', 'Недвижимость', 'Нерухомість'), noIndex: false},
  })
  console.log('SiteSettings: 1')

  // --- 8. Properties (10 demo) ---
  const props = [
    {slug: 'modern-apartment-blloku', cityId: 'city-tirana', districtId: 'district-blloku', typeSlug: 'apartment', agentIdx: 0, status: 'sale' as const, price: 125000, bedrooms: 2, bathrooms: 1, area: 75, tags: ['city-center', 'new-building'], amenitySlugs: ['elevator', 'balcony', 'parking'] as const, title: L('Apartament modern në Blloku', 'Modern Apartment in Blloku', 'Современная квартира в Блоку', 'Сучасна квартира в Блоку'), shortDesc: L('2 dhoma në Tiranë', '2-bed in Tirana', '2-комн. в Тиранe', '2-кімн. в Тірані'), desc: L('Apartament i gjerë.', 'Spacious apartment.', 'Просторная квартира.', 'Просторна квартира.'), featured: true},
    {slug: 'sea-view-durres', cityId: 'city-durres', districtId: 'district-plazh', typeSlug: 'apartment', agentIdx: 1, status: 'sale' as const, price: 95000, bedrooms: 2, bathrooms: 2, area: 65, tags: ['sea-view', 'beachfront'], amenitySlugs: ['sea-view', 'balcony', 'ac'] as const, title: L('Apartament me pamje deti', 'Sea View Apartment', 'Квартира с видом на море', 'Квартира з видом на море'), shortDesc: L('Bregdeti i Durrësit', 'Beachfront Durres', 'У моря в Дурресе', 'Біля моря в Дурресі'), desc: L('Ideal për qira.', 'Ideal for rental.', 'Идеально для аренды.', 'Ідеально для оренди.'), featured: true},
    {slug: 'villa-ksamil', cityId: 'city-sarande', districtId: 'district-ksamil', typeSlug: 'villa', agentIdx: 2, status: 'sale' as const, price: 450000, bedrooms: 4, bathrooms: 4, area: 220, tags: ['beachfront', 'luxury'], amenitySlugs: ['pool', 'garden', 'terrace', 'parking', 'ac', 'wifi'] as const, title: L('Vilë në Ksamil', 'Villa in Ksamil', 'Вилла в Ксамиле', 'Вілла в Ксамілі'), shortDesc: L('4 dhoma me pishinë', '4-bed with pool', '4 спальни с бассейном', '4 спальні з басейном'), desc: L('Vilë premium.', 'Premium villa.', 'Премиум вилла.', 'Преміум вілла.'), featured: true},
    {slug: 'apartment-qender', cityId: 'city-tirana', districtId: 'district-qender', typeSlug: 'apartment', agentIdx: 0, status: 'sale' as const, price: 78000, bedrooms: 1, bathrooms: 1, area: 45, tags: ['city-center'], amenitySlugs: ['elevator', 'wifi'] as const, title: L('Apartament qendror', 'Central Apartment', 'Центральная квартира', 'Центральна квартира'), shortDesc: L('1 dhomë', '1-bed', '1-комн.', '1-кімн.'), desc: L('Afër Sheshit.', 'Near Skanderbeg Square.', 'У площади Скандербега.', 'Біля площі Скандербега.'), featured: false},
    {slug: 'house-komuna-parisit', cityId: 'city-tirana', districtId: 'district-komuna-parisit', typeSlug: 'house', agentIdx: 1, status: 'sale' as const, price: 185000, bedrooms: 3, bathrooms: 2, area: 140, tags: ['near-park'], amenitySlugs: ['garden', 'parking'] as const, title: L('Shtëpi familjare', 'Family House', 'Семейный дом', 'Сімейний будинок'), shortDesc: L('3 dhoma me kopsht', '3-bed with garden', '3-комн. с садом', '3-кімн. з садом'), desc: L('Lagje e qetë.', 'Quiet neighborhood.', 'Тихий район.', 'Тихій район.'), featured: false},
    {slug: 'short-term-lungomare', cityId: 'city-vlore', districtId: 'district-lungomare', typeSlug: 'apartment', agentIdx: 2, status: 'short-term' as const, price: 650, bedrooms: 2, bathrooms: 1, area: 70, tags: ['sea-view', 'tourist-area'], amenitySlugs: ['sea-view', 'ac', 'wifi', 'furnished'] as const, title: L('Qira pushimi', 'Holiday Rental', 'Аренда для отдыха', 'Оренда для відпочинку'), shortDesc: L('2 dhoma në bregdet', '2-bed waterfront', '2-комн. на набережной', '2-кімн. на набережній'), desc: L('Pamje e detit.', 'Sea views.', 'Вид на море.', 'Вид на море.'), featured: true},
    {slug: 'commercial-durres', cityId: 'city-durres', districtId: 'district-durres-city-center', typeSlug: 'commercial', agentIdx: 1, status: 'sale' as const, price: 180000, bedrooms: 0, bathrooms: 2, area: 100, tags: ['city-center', 'investment'], amenitySlugs: ['parking', 'elevator'] as const, title: L('Hapësirë tregtare', 'Commercial Space', 'Коммерческая площадь', 'Комерційна площа'), shortDesc: L('100m²', '100m²', '100м²', '100м²'), desc: L('Vendndodhje kryesore.', 'Prime location.', 'Выгодное расположение.', 'Вигідна локація.'), featured: false},
    {slug: 'apartment-sarande-center', cityId: 'city-sarande', districtId: 'district-sarande-city-center', typeSlug: 'apartment', agentIdx: 0, status: 'sale' as const, price: 85000, bedrooms: 2, bathrooms: 1, area: 58, tags: ['city-center', 'tourist-area'], amenitySlugs: ['balcony', 'wifi', 'ac'] as const, title: L('Apartament në Sarandë', 'Apartment in Sarande', 'Квартира в Саранде', 'Квартира в Саранді'), shortDesc: L('2 dhoma qendër', '2-bed center', '2-комн. центр', '2-кімн. центр'), desc: L('Qira gjatë gjithë vitit.', 'Year-round rental.', 'Круглогодичная аренда.', 'Оренда цілий рік.'), featured: false},
    {slug: 'villa-uji-i-ftohte', cityId: 'city-vlore', districtId: 'district-uji-i-ftohte', typeSlug: 'villa', agentIdx: 2, status: 'sale' as const, price: 320000, bedrooms: 3, bathrooms: 3, area: 180, tags: ['sea-view', 'luxury'], amenitySlugs: ['pool', 'terrace', 'sea-view', 'parking'] as const, title: L('Vilë afër plazhit', 'Villa near Beach', 'Вилла у пляжа', 'Вілла біля пляжу'), shortDesc: L('3 dhoma me pishinë', '3-bed with pool', '3 спальни с бассейном', '3 спальні з басейном'), desc: L('Vend i qetë.', 'Peaceful location.', 'Спокойное место.', 'Спокійне місце.'), featured: true},
    {slug: 'studio-blloku-rent', cityId: 'city-tirana', districtId: 'district-blloku', typeSlug: 'apartment', agentIdx: 0, status: 'rent' as const, price: 450, bedrooms: 1, bathrooms: 1, area: 35, tags: ['city-center'], amenitySlugs: ['furnished', 'wifi', 'ac'] as const, title: L('Studio për qira', 'Studio for Rent', 'Студия в аренду', 'Студія в оренду'), shortDesc: L('Studio në Blloku', 'Studio in Blloku', 'Студия в Блоку', 'Студія в Блоку'), desc: L('E mobiluar.', 'Fully furnished.', 'Меблирована.', 'Мебльована.'), featured: false},
  ]

  for (const p of props) {
    await client.createOrReplace({
      _id: `property-${p.slug}`,
      _type: 'property',
      title: p.title,
      slug: {current: p.slug},
      shortDescription: p.shortDesc,
      description: p.desc,
      agent: {_type: 'reference', _ref: agentIds[p.agentIdx]},
      type: {_type: 'reference', _ref: propertyTypeIds[p.typeSlug]},
      status: p.status,
      isPublished: true,
      price: p.price,
      currency: 'EUR',
      featured: p.featured,
      investment: p.featured,
      city: {_type: 'reference', _ref: p.cityId},
      district: {_type: 'reference', _ref: p.districtId},
      area: p.area,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      gallery: addKeysToArrayItems([imgRef()]),
      coordinatesLat: 41.3275,
      coordinatesLng: 19.8187,
      locationTags: addKeysToArrayItems(p.tags.map((t) => ({_type: 'reference', _ref: locationTagIds[t]}))),
      amenitiesRefs: addKeysToArrayItems((p.amenitySlugs ?? []).map((s) => ({_type: 'reference', _ref: amenityIds[s]}))),
      lifecycleStatus: 'active',
      ownerUserId: 'seed-script',
    })
  }
  console.log('Properties:', props.length)

  // --- 9. Blog: categories (field-level i18n), then posts (one doc per article) ---
  const blogCategories = [
    {id: 'blogCategory-guides', slugBase: 'guides', title: L('Udhëzues', 'Guides', 'Гайды', 'Гайди'), description: L('Udhëzues blerje dhe investimi.', 'Buying and investment guides.', 'Гайды по покупке и инвестициям.', 'Гайди з купівлі та інвестицій.')},
    {id: 'blogCategory-market', slugBase: 'market', title: L('Tregu', 'Market', 'Рынок', 'Ринок'), description: L('Lajme të tregut.', 'Market news.', 'Новости рынка.', 'Новини ринку.')},
  ]
  for (let i = 0; i < blogCategories.length; i++) {
    const c = blogCategories[i]
    await client.createOrReplace({
      _id: c.id,
      _type: 'blogCategory',
      title: c.title,
      slug: {current: c.slugBase},
      description: c.description,
      order: i + 1,
    })
  }
  const blogCategoryIds = blogCategories.map((c) => c.id)

  const blogPosts = [
    {
      slugBase: 'buying-property-albania',
      title: L('Blerja e pasurive në Shqipëri', 'Buying Property in Albania', 'Покупка недвижимости в Албании', 'Купівля нерухомості в Албанії'),
      excerpt: L('Udhëzues për blerës të huaj.', 'Guide for foreign buyers.', 'Гайд для иностранцев.', 'Гайд для іноземців.'),
      categoryIdx: 0,
    },
    {
      slugBase: 'best-districts-tirana',
      title: L('Lagjet më të mira në Tiranë', 'Best Districts in Tirana', 'Лучшие районы Тираны', 'Найкращі райони Тірани'),
      excerpt: L('Blloku, Qendra, Komuna e Parisit.', 'Blloku, Qender, Komuna e Parisit.', 'Блоку, Кендер, Коммуна Паризит.', 'Блоку, Кендер, Комуна Паризит.'),
      categoryIdx: 0,
    },
    {
      slugBase: 'investment-albania',
      title: L('Investimi në Shqipëri', 'Investing in Albania', 'Инвестиции в Албанию', 'Інвестиції в Албанію'),
      excerpt: L('Kthime dhe mundësi.', 'Returns and opportunities.', 'Доходность и возможности.', 'Доходність та можливості.'),
      categoryIdx: 0,
    },
    {
      slugBase: 'market-outlook-2025',
      title: L('Tregu në 2025', 'Market Outlook 2025', 'Рынок в 2025', 'Ринок у 2025'),
      excerpt: L('Parashikime të tregut.', 'Market predictions.', 'Прогнозы рынка.', 'Прогнози ринку.'),
      categoryIdx: 1,
    },
  ]
  for (let i = 0; i < blogPosts.length; i++) {
    const p = blogPosts[i]
    const blockEn = block(p.excerpt.en || p.excerpt.sq, `bp-${i}-en`)
    const blockSq = block(p.excerpt.sq || p.excerpt.en, `bp-${i}-sq`)
    const blockRu = block(p.excerpt.ru || p.excerpt.en, `bp-${i}-ru`)
    const blockUk = block(p.excerpt.uk || p.excerpt.en, `bp-${i}-uk`)
    await client.createOrReplace({
      _id: `blogPost-${p.slugBase}`,
      _type: 'blogPost',
      title: p.title,
      slug: {current: p.slugBase},
      excerpt: p.excerpt,
      content: {
        en: [blockEn],
        sq: [blockSq],
        ru: [blockRu],
        uk: [blockUk],
      },
      publishedAt: new Date().toISOString(),
      categories: [{_type: 'reference', _ref: blogCategoryIds[p.categoryIdx]}],
      seo: {
        metaTitle: p.title,
        metaDescription: p.excerpt,
        ogTitle: p.title,
        ogDescription: p.excerpt,
        noIndex: false,
      },
    })
  }
  console.log('Blog categories:', blogCategories.length)
  console.log('Blog posts:', blogPosts.length)
  console.log('\nSeed completed.')
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
