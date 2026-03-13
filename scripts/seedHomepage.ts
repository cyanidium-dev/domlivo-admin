/**
 * Domlivo CMS — Homepage-only Seed Script
 *
 * Creates or replaces ONLY the homePage document.
 * Does NOT touch cities, properties, blog posts, or any other content types.
 *
 * This version is aligned as close as possible to:
 * "Главная страница Недвижка _ 16.02.26.pdf"
 *
 * Run: npm run seed:homepage
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

type Li = {
  uk: string
  ru: string
  sq: string
  en: string
  it: string
}

function Li(uk: string, ru: string, sq: string, en: string, it: string): Li {
  return {uk, ru, sq, en, it}
}

function ctaLi(href: string, label: Li) {
  return {href, label}
}

function faqItemLi(question: Li, answer: Li) {
  return {question, answer}
}

function img(assetId: string) {
  return {
    _type: 'image' as const,
    asset: {
      _type: 'reference' as const,
      _ref: assetId,
    },
  }
}

function svgPlaceholder(label: string, sublabel?: string): Buffer {
  const safeLabel = escapeXml(label)
  const safeSublabel = escapeXml(sublabel || '')

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="50%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#334155" />
      </linearGradient>
    </defs>
    <rect width="1600" height="1000" fill="url(#g)" />
    <rect x="80" y="80" width="1440" height="840" rx="28" fill="none" stroke="#94a3b8" stroke-width="3" opacity="0.35" />
    <text x="800" y="450" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="700">${safeLabel}</text>
    ${
      safeSublabel
        ? `<text x="800" y="525" text-anchor="middle" fill="#cbd5e1" font-family="Arial, Helvetica, sans-serif" font-size="28">${safeSublabel}</text>`
        : ''
    }
  </svg>
  `.trim()

  return Buffer.from(svg)
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

async function uploadPlaceholderImage(
  filename: string,
  label: string,
  sublabel?: string,
): Promise<string> {
  const asset = await client.assets.upload('image', svgPlaceholder(label, sublabel), {
    filename,
    contentType: 'image/svg+xml',
  })
  return asset._id
}

type RefDoc = {
  _id: string
  title?: Record<string, string> | string
  name?: Record<string, string> | string
  slug?: {current?: string}
}

function normalizeText(value: unknown): string {
  if (!value) return ''

  if (typeof value === 'string') return value.toLowerCase().trim()

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const candidate = obj.uk || obj.ru || obj.sq || obj.en || obj.it || ''

    return String(candidate).toLowerCase().trim()
  }

  return String(value).toLowerCase().trim()
}

/**
 * Fetches target cities in the exact PDF order:
 * Tirana, Durrës, Vlorë, Sarandë
 */
async function fetchTargetCityRefs(): Promise<Array<{_type: 'reference'; _ref: string}>> {
  const cities = await client.fetch<RefDoc[]>(
    `*[_type == "city"]{
      _id,
      title,
      name,
      slug
    }`,
  )

  const wantedMatchers = [
    ['tirana', 'tiranë', 'tirane'],
    ['durres', 'durrës', 'durres'],
    ['vlore', 'vlora', 'vlorë'],
    ['sarande', 'saranda', 'sarandë'],
  ]

  const picked: string[] = []

  for (const variants of wantedMatchers) {
    const found = cities.find((city) => {
      const raw = [
        normalizeText(city.title),
        normalizeText(city.name),
        normalizeText(city.slug?.current),
      ].join(' | ')

      return variants.some((v) => raw.includes(v))
    })

    if (found?._id) picked.push(found._id)
  }

  return picked.map((id) => ({_type: 'reference' as const, _ref: id}))
}

/**
 * Fetches property types in the exact PDF order:
 * apartment, house, villa, commercial, short-term
 */
async function fetchTargetPropertyTypeRefs(): Promise<Array<{_type: 'reference'; _ref: string}>> {
  const propertyTypes = await client.fetch<RefDoc[]>(
    `*[_type == "propertyType"]{
      _id,
      title,
      name,
      slug
    }`,
  )

  const wantedMatchers = [
    ['apartment', 'apartament', 'apartamente', 'квартира', 'квартири'],
    ['house', 'shtëpi', 'shtepi', 'дом', 'будинок'],
    ['villa', 'vilë', 'vile', 'вилла', 'вілла'],
    ['commercial', 'komerciale', 'commerciale', 'коммер', 'комерц'],
    ['short-term', 'short term', 'afatshkurtër', 'afatshkurter', 'краткоср', 'короткострок'],
  ]

  const picked: string[] = []

  for (const variants of wantedMatchers) {
    const found = propertyTypes.find((typeDoc) => {
      const raw = [
        normalizeText(typeDoc.title),
        normalizeText(typeDoc.name),
        normalizeText(typeDoc.slug?.current),
      ].join(' | ')

      return variants.some((v) => raw.includes(v))
    })

    if (found?._id) picked.push(found._id)
  }

  return picked.map((id) => ({_type: 'reference' as const, _ref: id}))
}

/**
 * Attempts to fetch the 3 exact blog posts from the PDF.
 * If they do not exist, section still contains manual fallback titles.
 */
async function fetchTargetBlogPostRefs(): Promise<Array<{_type: 'reference'; _ref: string}>> {
  const posts = await client.fetch<RefDoc[]>(
    `*[_type == "post" || _type == "blogPost"]{
      _id,
      title,
      name,
      slug
    }`,
  )

  const wantedMatchers = [
    [
      'merrni me qira apartament në tiranë pa ndërmjetës',
      'орендувати квартиру в тирані без посередників',
    ],
    ['dokumentet për blerjen e pronës në shqipëri', 'документи для купівлі нерухомості в албанії'],
    ['zona më të mira për të jetuar në shqipëri', 'найкращі райони для життя в албанії'],
  ]

  const picked: string[] = []

  for (const variants of wantedMatchers) {
    const found = posts.find((post) => {
      const raw = [
        normalizeText(post.title),
        normalizeText(post.name),
        normalizeText(post.slug?.current),
      ].join(' | ')

      return variants.some((v) => raw.includes(v))
    })

    if (found?._id) picked.push(found._id)
  }

  return picked.map((id) => ({_type: 'reference' as const, _ref: id}))
}

async function main() {
  validateEnv()

  console.log(`Seeding homepage only: ${ENV.projectId} / ${ENV.dataset}`)

  const [heroImgId, invImg1, invImg2] = await Promise.all([
    uploadPlaceholderImage('homepage-hero.svg', 'Domlivo Homepage Hero', 'Real estate in Albania'),
    uploadPlaceholderImage(
      'homepage-investment-1.svg',
      'Investment Apartments',
      'Modern apartments for investment',
    ),
    uploadPlaceholderImage(
      'homepage-investment-2.svg',
      'Sea View Villas',
      'Villas and houses by the sea',
    ),
  ])

  const [cityRefs, propertyTypeRefs, blogPostRefs] = await Promise.all([
    fetchTargetCityRefs(),
    fetchTargetPropertyTypeRefs(),
    fetchTargetBlogPostRefs(),
  ])

  console.log(`Matched cities: ${cityRefs.length}/4`)
  console.log(`Matched property types: ${propertyTypeRefs.length}/5`)
  console.log(`Matched blog posts: ${blogPostRefs.length}/3`)

  const homeSections = addKeysToArrayItems([
    {
      _type: 'homeHeroSection',
      title: Li(
        'Нерухомість в Албанії — купівля, оренда та короткострокова оренда',
        'Недвижимость в Албании — покупка, аренда и краткосрочная аренда',
        'Pasuri të paluajtshme në Shqipëri – Blerje, Qira dhe Qira Afatshkurtër',
        'Real estate in Albania — Buy, Rent and Short-term Rental',
        'Immobiliare in Albania — Acquisto, affitto e affitto a breve termine',
      ),
      subtitle: Li(
        'Квартири, будинки та апартаменти в Дурресі, Тирані та на узбережжі',
        'Квартиры, дома и апартаменты в Дурресе, Тиране и на побережье',
        'Apartamente, shtëpi dhe vila në Durrës, Tiranë dhe bregdet',
        'Apartments, houses and villas in Durres, Tirana and on the coast',
        'Appartamenti, case e ville a Durazzo, Tirana e sulla costa',
      ),
      shortLine: Li(
        'Перевірені об’єкти • Актуальні ціни • Без комісії',
        'Проверенные объекты • Актуальные цены • Без комиссии',
        'Objekte të verifikuara • Çmime aktuale • Pa komisione',
        'Verified listings • Current prices • No commission',
        'Immobili verificati • Prezzi aggiornati • Nessuna commissione',
      ),
      backgroundImage: img(heroImgId),
      cta: ctaLi(
        '/properties',
        Li(
          'Переглянути об’єкти',
          'Смотреть объекты',
          'Shiko pronat',
          'View properties',
          'Visualizza immobili',
        ),
      ),
    },

    {
      _type: 'homePropertyCarouselSection',
      title: Li(
        'Популярні об’єкти нерухомості в Албанії',
        'Популярные объекты недвижимости в Албании',
        'Objekte të njohura të pasurive të paluajtshme në Shqipëri',
        'Popular real estate listings in Albania',
        'Annunci immobiliari popolari in Albania',
      ),
      subtitle: Li(
        'Перевірені об’єкти з високим попитом • У популярних містах • Без комісії',
        'Проверенные объекты с высоким спросом • В популярных городах • Без комиссии',
        'Objekte të verifikuara me kërkesë të lartë • Në qytetet kryesore • Pa komisione',
        'Verified listings with high demand • In popular cities • No commission',
        'Immobili verificati con alta domanda • Nelle città principali • Nessuna commissione',
      ),
      cta: ctaLi(
        '/properties',
        Li(
          'Переглянути всі об’єкти',
          'Смотреть все объекты',
          'Shiko të gjitha pronat',
          'View all properties',
          'Visualizza tutti gli immobili',
        ),
      ),
      mode: 'auto',

      /**
       * Supplemental spec from PDF.
       * These fields are harmless if your frontend/schema ignores them.
       */
      maxItems: 20,
      minItems: 10,
      rankingStrategy: 'most-viewed-bookmarked-booked',
      allowedPropertyKinds: ['apartment', 'house', 'apartment-rental'],
      cardFields: ['image', 'price', 'cityOrDistrict', 'areaM2', 'detailsCta'],
      detailsCtaLabel: Li('Переглянути', 'Подробнее', 'Shiko', 'View', 'Vedi'),
    },

    {
      _type: 'homeLocationCarouselSection',
      title: Li(
        'Найпопулярніші міста для нерухомості в Албанії',
        'Самые популярные города для недвижимости в Албании',
        'Qytetet më të kërkuara për pasuri të paluajtshme në Shqipëri',
        'Most popular cities for real estate in Albania',
        'Le città più richieste per immobili in Albania',
      ),
      subtitle: Li(
        'Перегляньте найкращі об’єкти в Тирані, Дурресі, Вльорі та Саранді — завжди перевірені та з актуальними цінами',
        'Просматривайте лучшие объекты в Тиране, Дурресе, Влёре и Саранде — всегда проверенные и с актуальными ценами',
        'Shfletoni pronat më të mira në Tiranë, Durrës, Vlorë dhe Sarandë — gjithmonë të verifikuara dhe me çmime aktuale',
        'Browse the best properties in Tirana, Durres, Vlore and Sarande — always verified and with current prices',
        'Sfoglia i migliori immobili a Tirana, Durazzo, Valona e Saranda — sempre verificati e con prezzi aggiornati',
      ),
      cta: ctaLi(
        '/cities',
        Li(
          'Переглянути всі міста',
          'Смотреть все города',
          'Shiko të gjitha qytetet',
          'View all cities',
          'Visualizza tutte le città',
        ),
      ),
      cities: cityRefs,
      districts: [],

      /**
       * Manual spec from PDF, preserved in data.
       * Frontend may ignore these if not implemented.
       */
      manualCityCards: addKeysToArrayItems([
        {
          title: Li(
            'Тирана – Центр',
            'Тирана – Центр',
            'Tiranë – Qendër',
            'Tirana – Center',
            'Tirana – Centro',
          ),
          href: '/cities/tirana',
        },
        {
          title: Li(
            'Дуррес – Море',
            'Дуррес – Море',
            'Durrës – Deti',
            'Durres – Sea',
            'Durazzo – Mare',
          ),
          href: '/cities/durres',
        },
        {
          title: Li(
            'Вльора / Шомфлюра',
            'Влёра / Шомфлюра',
            'Vlorë / Uji i Ftohtë',
            'Vlore / Seafront',
            'Valona / Lungomare',
          ),
          href: '/cities/vlore',
        },
        {
          title: Li('Саранда', 'Саранда', 'Sarandë', 'Sarande', 'Saranda'),
          href: '/cities/sarande',
        },
      ]),
    },

    {
      _type: 'homePropertyTypesSection',
      title: Li(
        'Виберіть нерухомість для покупки або оренди',
        'Выберите недвижимость для покупки или аренды',
        'Zgjidhni pronën që dëshironi të blini ose merrni me qira',
        'Choose the property you want to buy or rent',
        'Scegli l’immobile che desideri acquistare o affittare',
      ),
      subtitle: Li(
        'Квартири, будинки, вілли, комерційна нерухомість та короткострокова оренда — всі перевірені та з актуальними цінами',
        'Квартиры, дома, виллы, коммерческая недвижимость и краткосрочная аренда — всё проверено и с актуальными ценами',
        'Apartamente, shtëpi, vila, prona komerciale dhe qira afatshkurtër — të gjitha të verifikuara dhe me çmime aktuale',
        'Apartments, houses, villas, commercial property and short-term rentals — all verified and with current prices',
        'Appartamenti, case, ville, immobili commerciali e affitti a breve termine — tutti verificati e con prezzi aggiornati',
      ),
      cta: ctaLi(
        '/property-types',
        Li(
          'Переглянути всі об’єкти за типом',
          'Смотреть все объекты по типу',
          'Shiko të gjitha pronat sipas llojit',
          'View all properties by type',
          'Visualizza tutti gli immobili per tipo',
        ),
      ),
      propertyTypes: propertyTypeRefs,

      /**
       * Manual fallback spec from PDF for exact homepage intent.
       */
      manualPropertyTypeCards: addKeysToArrayItems([
        {
          slug: 'apartment',
          title: Li('Квартири', 'Квартиры', 'Apartamente', 'Apartments', 'Appartamenti'),
          shortLine: Li(
            'Перевірені та з актуальними цінами',
            'Проверенные и с актуальными ценами',
            'Të verifikuara dhe me çmime aktuale',
            'Verified and with current prices',
            'Verificati e con prezzi aggiornati',
          ),
          href: '/catalog?type=apartment',
        },
        {
          slug: 'house',
          title: Li('Будинки', 'Дома', 'Shtëpi', 'Houses', 'Case'),
          shortLine: Li(
            'Перевірені та з актуальними цінами',
            'Проверенные и с актуальными ценами',
            'Të verifikuara dhe me çmime aktuale',
            'Verified and with current prices',
            'Verificate e con prezzi aggiornati',
          ),
          href: '/catalog?type=house',
        },
        {
          slug: 'villa',
          title: Li('Вілли', 'Виллы', 'Vila', 'Villas', 'Ville'),
          shortLine: Li(
            'Перевірені та з актуальними цінами',
            'Проверенные и с актуальными ценами',
            'Të verifikuara dhe me çmime aktuale',
            'Verified and with current prices',
            'Verificate e con prezzi aggiornati',
          ),
          href: '/catalog?type=villa',
        },
        {
          slug: 'commercial',
          title: Li(
            'Комерційна нерухомість',
            'Коммерческая недвижимость',
            'Prona komerciale',
            'Commercial property',
            'Immobili commerciali',
          ),
          shortLine: Li(
            'Перевірені та з актуальними цінами',
            'Проверенные и с актуальными ценами',
            'Të verifikuara dhe me çmime aktuale',
            'Verified and with current prices',
            'Verificati e con prezzi aggiornati',
          ),
          href: '/catalog?type=commercial',
        },
        {
          slug: 'short-term',
          title: Li(
            'Короткострокова оренда',
            'Краткосрочная аренда',
            'Qira afatshkurtër',
            'Short-term rental',
            'Affitto a breve termine',
          ),
          shortLine: Li(
            'Перевірені та з актуальними цінами',
            'Проверенные и с актуальными ценами',
            'Të verifikuara dhe me çmime aktuale',
            'Verified and with current prices',
            'Verificati e con prezzi aggiornati',
          ),
          href: '/catalog?type=short-term',
        },
      ]),
      autoShowNewTypes: true,
    },

    {
      _type: 'homeInvestmentSection',
      title: Li(
        'Нерухомість для інвестицій в Албанії — стабільний дохід',
        'Недвижимость для инвестиций в Албании — стабильный доход',
        'Prona për investim në Shqipëri — fitim i qëndrueshëm',
        'Investment property in Albania — stable returns',
        'Immobili per investimento in Albania — rendimento stabile',
      ),
      description: Li(
        'Обирайте апартаменти, вілли та нерухомість біля моря для коротко- та довгострокової оренди. Інвестуйте в райони з високим попитом та зростанням цін.',
        'Выбирайте апартаменты, виллы и недвижимость у моря для краткосрочной и долгосрочной аренды. Инвестируйте в районы с высоким спросом и ростом цен.',
        'Zgjidhni apartamente, vila dhe prona pranë detit për qira afatshkurtër dhe afatgjatë. Investoni në zona me rritje të lartë dhe kërkesë të vazhdueshme.',
        'Choose apartments, villas and property near the sea for short-term and long-term rentals. Invest in areas with high demand and price growth.',
        'Scegli appartamenti, ville e immobili vicino al mare per affitti a breve e lungo termine. Investi in aree con alta domanda e crescita dei prezzi.',
      ),
      benefits: [
        Li(
          'Високий дохід з оренди',
          'Высокий доход от аренды',
          'Rendiment i lartë nga qiraja',
          'High rental income',
          'Alto reddito da locazione',
        ),
        Li(
          'Попит від туристів та експатів',
          'Спрос от туристов и экспатов',
          'Kërkesë nga turistë dhe emigrantë',
          'Demand from tourists and expats',
          'Domanda da turisti ed expat',
        ),
        Li(
          'Зростання вартості об’єктів',
          'Рост стоимости объектов',
          'Rritje e vlerës së pronës',
          'Property value growth',
          'Crescita del valore degli immobili',
        ),
      ],
      cta: ctaLi(
        '/properties?investment=true',
        Li(
          'Переглянути всі об’єкти для інвестицій',
          'Смотреть все объекты для инвестиций',
          'Shiko të gjitha pronat për investim',
          'View all investment properties',
          'Visualizza tutti gli immobili per investimento',
        ),
      ),
      primaryImage: img(invImg1),
      secondaryImage: img(invImg2),
    },

    {
      _type: 'homeAboutSection',
      title: Li(
        'Чому обирають Domlivo',
        'Почему выбирают Domlivo',
        'Pse të zgjidhni Domlivo',
        'Why choose Domlivo',
        'Perché scegliere Domlivo',
      ),
      description: Li(
        'Domlivo — сучасна платформа для купівлі, продажу та оренди нерухомості в Албанії. Ми об’єднуємо покупців, орендарів і агентів у безпечній та прозорій системі.',
        'Domlivo — современная платформа для покупки, продажи и аренды недвижимости в Албании. Мы объединяем покупателей, арендаторов и агентов в безопасной и прозрачной системе.',
        'Domlivo është platformë moderne për blerje, shitje dhe qira të pronave në Shqipëri. Ne bashkojmë blerës, qiramarrës dhe agjentë në një sistem të sigurt dhe transparent.',
        'Domlivo is a modern platform for buying, selling and renting property in Albania. We bring together buyers, tenants and agents in a secure and transparent system.',
        'Domlivo è una piattaforma moderna per l’acquisto, la vendita e l’affitto di immobili in Albania. Riuniamo acquirenti, affittuari e agenti in un sistema sicuro e trasparente.',
      ),
      benefits: [
        Li(
          'Перевірені об’єкти та реальні ціни',
          'Проверенные объекты и реальные цены',
          'Objekte të verifikuara dhe çmime reale',
          'Verified listings and real prices',
          'Immobili verificati e prezzi reali',
        ),
        Li(
          'Багатомовна платформа для міжнародних клієнтів',
          'Многоязычная платформа для международных клиентов',
          'Platformë shumëgjuhëshe për klientë ndërkombëtarë',
          'Multilingual platform for international clients',
          'Piattaforma multilingue per clienti internazionali',
        ),
        Li(
          'Розумний пошук і розширені фільтри',
          'Умный поиск и расширенные фильтры',
          'Kërkim inteligjent dhe filtra të avancuar',
          'Smart search and advanced filters',
          'Ricerca intelligente e filtri avanzati',
        ),
      ],
    },

    {
      _type: 'homeAgentsPromoSection',
      title: Li(
        'Domlivo — Платформа для ріелторів та агентств нерухомості в Албанії',
        'Domlivo — Платформа для риелторов и агентств недвижимости в Албании',
        'Domlivo — Platformë për agjentë dhe agjenci imobiliare në Shqipëri',
        'Domlivo — Platform for agents and real estate agencies in Albania',
        'Domlivo — Piattaforma per agenti e agenzie immobiliari in Albania',
      ),
      subtitle: Li(
        'Публікуйте свої об’єкти та отримуйте клієнтів напряму — без посередників і втрати комісій',
        'Публикуйте свои объекты и получайте клиентов напрямую — без посредников и потерь комиссий',
        'Publikoni pronat tuaja dhe merrni klientë direkt — pa ndërmjetës dhe pa humbje komisionesh',
        'Publish your properties and get clients directly — with no intermediaries and no commission losses',
        'Pubblica i tuoi immobili e ottieni clienti direttamente — senza intermediari e senza perdere commissioni',
      ),
      description: Li(
        'З Domlivo агенти та агентства просувають свої об’єкти для купівлі та оренди в Албанії й отримують прямі заявки від місцевих та міжнародних клієнтів.',
        'С Domlivo агенты и агентства продвигают свои объекты для покупки и аренды в Албании и получают прямые заявки от местных и международных клиентов.',
        'Me Domlivo, agjentët dhe agjencitë promovojnë pronat e tyre për blerje dhe qira në Shqipëri dhe marrin kërkesa direkte nga klientë vendas dhe ndërkombëtarë.',
        'With Domlivo, agents and agencies promote their properties for sale and rent in Albania and receive direct enquiries from local and international clients.',
        'Con Domlivo, agenti e agenzie promuovono i loro immobili per vendita e affitto in Albania e ricevono richieste dirette da clienti locali e internazionali.',
      ),
      benefits: [
        Li(
          'Постійний потік клієнтів з Албанії та Європи',
          'Постоянный поток клиентов из Албании и Европы',
          'Fluks i vazhdueshëm klientësh nga Shqipëria dhe Europa',
          'Steady flow of clients from Albania and Europe',
          'Flusso costante di clienti da Albania ed Europa',
        ),
        Li(
          'Прямі заявки без комісій та посередників',
          'Прямые заявки без комиссий и посредников',
          'Kërkesa direkte pa komisione dhe ndërmjetës',
          'Direct enquiries without commission or intermediaries',
          'Richieste dirette senza commissioni né intermediari',
        ),
        Li(
          'Професійне просування об’єктів у Google та соцмережах',
          'Профессиональное продвижение объектов в Google и соцсетях',
          'Promovim profesional i pronave në Google dhe rrjete sociale',
          'Professional promotion of properties on Google and social media',
          'Promozione professionale degli immobili su Google e social media',
        ),
      ],
      cta: ctaLi(
        '/agents',
        Li(
          'Зареєструватися як агент у Domlivo',
          'Зарегистрироваться как агент на Domlivo',
          'Regjistrohu si agjent në Domlivo',
          'Register as an agent on Domlivo',
          'Registrati come agente su Domlivo',
        ),
      ),
      targetSubpageLabel: Li(
        'Як розмістити свої об’єкти',
        'Как разместить свои объекты',
        'Si të publikoni pronat tuaja',
        'How to publish your properties',
        'Come pubblicare i tuoi immobili',
      ),
    },

    {
      _type: 'homeBlogSection',
      title: Li(
        'Блог про нерухомість в Албанії',
        'Блог о недвижимости в Албании',
        'Blog për pasuri të paluajtshme në Shqipëri',
        'Blog about real estate in Albania',
        'Blog immobiliare sull’Albania',
      ),
      subtitle: Li(
        'Гайди, поради та корисна інформація про купівлю, оренду та інвестиції в Албанії.',
        'Гайды, советы и полезная информация о покупке, аренде и инвестициях в Албании.',
        'Udhëzime, këshilla dhe informacione për blerje, qira dhe investim në Shqipëri.',
        'Guides, tips and useful information about buying, renting and investing in Albania.',
        'Guide, consigli e informazioni utili su acquisto, affitto e investimenti in Albania.',
      ),
      cta: ctaLi(
        '/blog',
        Li(
          'Читати всі статті',
          'Читать все статьи',
          'Lexo të gjitha artikujt',
          'Read all articles',
          'Leggi tutti gli articoli',
        ),
      ),
      mode: blogPostRefs.length === 3 ? 'manual' : 'latest',
      posts: blogPostRefs,

      /**
       * Manual titles from PDF, preserved even if posts were not found.
       */
      manualArticleTitles: addKeysToArrayItems([
        {
          title: Li(
            'Як орендувати квартиру в Тирані без посередників',
            'Как арендовать квартиру в Тиране без посредников',
            'Si të merrni me qira apartament në Tiranë pa ndërmjetës',
            'How to rent an apartment in Tirana without intermediaries',
            'Come affittare un appartamento a Tirana senza intermediari',
          ),
        },
        {
          title: Li(
            'Документи для купівлі нерухомості в Албанії',
            'Документы для покупки недвижимости в Албании',
            'Dokumentet për blerjen e pronës në Shqipëri',
            'Documents for buying property in Albania',
            'Documenti per acquistare immobili in Albania',
          ),
        },
        {
          title: Li(
            'Найкращі райони для життя в Албанії',
            'Лучшие районы для жизни в Албании',
            'Zona më të mira për të jetuar në Shqipëri',
            'Best areas to live in Albania',
            'Le migliori zone in cui vivere in Albania',
          ),
        },
      ]),
    },

    {
      _type: 'homeSeoTextSection',
      content: Li(
        'Domlivo — сучасна онлайн-платформа нерухомості в Албанії для купівлі, оренди та короткострокового проживання. На сайті ви знайдете квартири, апартаменти, будинки, вілли та комерційну нерухомість у Тирані, Дурресі, Вльорі, Саранді та інших популярних містах. Ми допомагаємо швидко знайти житло в Албанії для життя, відпочинку або інвестицій. Завдяки зручному пошуку та розширеним фільтрам за ціною, районом, площею та типом нерухомості, користувачі легко підбирають оптимальні варіанти. Domlivo об’єднує перевірених агентів, власників і покупців в одній системі. Ми публікуємо лише актуальні оголошення з реальними цінами та детальними описами. Кожен об’єкт проходить попередню перевірку, що гарантує безпеку та прозорість угод. Наша платформа підходить для іноземців, туристів, інвесторів і місцевих жителів, які шукають надійну нерухомість в Албанії. Багатомовна підтримка дозволяє клієнтам з Європи та інших країн комфортно користуватися сервісом. Якщо ви шукаєте квартиру в Тирані, будинок біля моря в Дурресі, апартаменти у Вльорі або віллу в Саранді — Domlivo допоможе знайти найкращу пропозицію. Наша мета — зробити ринок нерухомості в Албанії максимально відкритим, зручним і доступним для кожного.',
        'Domlivo — современная онлайн-платформа недвижимости в Албании для покупки, аренды и краткосрочного проживания. На сайте вы найдёте квартиры, апартаменты, дома, виллы и коммерческую недвижимость в Тиране, Дурресе, Влёре, Саранде и других популярных городах. Мы помогаем быстро найти жильё в Албании для жизни, отдыха или инвестиций. Благодаря удобному поиску и расширенным фильтрам по цене, району, площади и типу недвижимости пользователи легко подбирают оптимальные варианты. Domlivo объединяет проверенных агентов, владельцев и покупателей в одной системе. Мы публикуем только актуальные объявления с реальными ценами и подробными описаниями. Каждый объект проходит предварительную проверку, что гарантирует безопасность и прозрачность сделок. Наша платформа подходит для иностранцев, туристов, инвесторов и местных жителей, которые ищут надёжную недвижимость в Албании. Многоязычная поддержка позволяет клиентам из Европы и других стран комфортно пользоваться сервисом. Если вы ищете квартиру в Тиране, дом у моря в Дурресе, апартаменты во Влёре или виллу в Саранде, Domlivo поможет найти лучшее предложение. Наша цель — сделать рынок недвижимости в Албании максимально открытым, удобным и доступным для каждого.',
        'Domlivo është një platformë moderne online për pasuri të paluajtshme në Shqipëri për blerje, qira dhe qira afatshkurtër. Në faqen tonë mund të gjeni apartamente, shtëpi, vila dhe prona komerciale në Tiranë, Durrës, Vlorë, Sarandë dhe qytete të tjera të njohura. Ne ju ndihmojmë të gjeni shpejt banesën e duhur për jetesë, pushime ose investim. Falë kërkimit inteligjent dhe filtrave sipas çmimit, zonës, sipërfaqes dhe tipit të pronës, përdoruesit zgjedhin lehtësisht ofertat më të mira. Domlivo bashkon agjentë të verifikuar, pronarë dhe blerës në një sistem të vetëm. Ne publikojmë vetëm shpallje aktuale me çmime reale dhe përshkrime të detajuara. Çdo pronë kontrollohet para publikimit për të garantuar siguri dhe transparencë. Platforma jonë është e përshtatshme për të huaj, turistë, investitorë dhe banorë vendas që kërkojnë pasuri të paluajtshme të besueshme në Shqipëri. Mbështetja shumëgjuhëshe lejon klientët nga Europa dhe vende të tjera të përdorin shërbimin në mënyrë komode. Nëse kërkoni një apartament në Tiranë, një shtëpi pranë detit në Durrës, një apartament në Vlorë apo një vilë në Sarandë, Domlivo ju ndihmon të gjeni ofertën më të mirë. Qëllimi ynë është ta bëjmë tregun e pasurive të paluajtshme në Shqipëri të hapur, të besueshëm dhe të aksesueshëm për të gjithë.',
        'Domlivo is a modern online real estate platform in Albania for buying, renting and short-term stays. On the site you can find apartments, houses, villas and commercial property in Tirana, Durres, Vlore, Sarande and other popular cities. We help you quickly find property in Albania for living, holidays or investment. Thanks to convenient search and advanced filters by price, district, size and property type, users can easily choose the best options. Domlivo brings together verified agents, owners and buyers in one system. We publish only current listings with real prices and detailed descriptions. Every property goes through preliminary verification, which guarantees safety and transparency. Our platform suits foreigners, tourists, investors and local residents looking for reliable real estate in Albania. Multilingual support allows clients from Europe and other countries to use the service comfortably. If you are looking for an apartment in Tirana, a house by the sea in Durres, an apartment in Vlore or a villa in Sarande, Domlivo helps you find the best offer. Our goal is to make the real estate market in Albania максимально open, convenient and accessible to everyone.'.replace(
          'максимально',
          'as open as possible and',
        ),
        'Domlivo è una moderna piattaforma online immobiliare in Albania per acquisto, affitto e soggiorni a breve termine. Sul sito puoi trovare appartamenti, case, ville e immobili commerciali a Tirana, Durazzo, Valona, Saranda e in altre città popolari. Ti aiutiamo a trovare rapidamente un immobile in Albania per vivere, per le vacanze o per investimento. Grazie a una ricerca comoda e a filtri avanzati per prezzo, zona, superficie e tipo di immobile, gli utenti scelgono facilmente le opzioni migliori. Domlivo riunisce agenti verificati, proprietari e acquirenti in un unico sistema. Pubblichiamo solo annunci aggiornati con prezzi reali e descrizioni dettagliate. Ogni immobile проходит una verifica preliminare, che garantisce sicurezza e trasparenza.'.replace(
          'проходит',
          'passa',
        ) +
          ' La nostra piattaforma è adatta a stranieri, turisti, investitori e residenti locali che cercano immobili affidabili in Albania. Il supporto multilingue consente ai clienti europei e di altri Paesi di usare il servizio comodamente. Se cerchi un appartamento a Tirana, una casa vicino al mare a Durazzo, un appartamento a Valona o una villa a Saranda, Domlivo ti aiuta a trovare l’offerta migliore. Il nostro obiettivo è rendere il mercato immobiliare in Albania il più aperto, comodo e accessibile possibile per tutti.',
      ),
    },

    {
      _type: 'homeFaqSection',
      title: Li(
        'Поширені питання',
        'Часто задаваемые вопросы',
        'Pyetje të shpeshta',
        'Frequently asked questions',
        'Domande frequenti',
      ),
      items: addKeysToArrayItems([
        faqItemLi(
          Li(
            'Як знайти квартиру для оренди в Тирані з актуальними цінами та без комісії?',
            'Как найти квартиру для аренды в Тиране с актуальными ценами и без комиссии?',
            'Si të gjej një apartament për qira në Tiranë me çmime reale dhe pa komision?',
            'How do I find an apartment to rent in Tirana with real prices and no commission?',
            'Come trovare un appartamento in affitto a Tirana con prezzi reali e senza commissione?',
          ),
          Li(
            'Використовуйте фільтри на Domlivo за районом, ціною та типом нерухомості. Усі об’єкти перевірені та без комісії від власника.',
            'Используйте фильтры на Domlivo по району, цене и типу недвижимости. Все объекты проверены и без комиссии от владельца.',
            'Përdorni filtërat në Domlivo sipas zonës, çmimit dhe tipit të pronës. Të gjitha objektet janë të verifikuara dhe pa komision nga pronari.',
            'Use the filters on Domlivo by district, price and property type. All listings are verified and commission-free from the owner.',
            'Usa i filtri su Domlivo per zona, prezzo e tipo di immobile. Tutti gli annunci sono verificati e senza commissione da parte del proprietario.',
          ),
        ),

        faqItemLi(
          Li(
            'Де можна знайти будинок або віллу біля моря в Дурресі чи Саранді?',
            'Где можно найти дом или виллу у моря в Дурресе или Саранде?',
            'Ku mund të gjej shtëpi ose vilë pranë detit në Durrës ose Sarandë?',
            'Where can I find a house or villa by the sea in Durres or Sarande?',
            'Dove posso trovare una casa o una villa vicino al mare a Durazzo o Saranda?',
          ),
          Li(
            'Оберіть місто Дуррес або Саранда на Domlivo та використовуйте фільтри за площею, ціною та типом нерухомості.',
            'Выберите город Дуррес или Саранда на Domlivo и используйте фильтры по площади, цене и типу недвижимости.',
            'Zgjidhni qytetin Durrës ose Sarandë në Domlivo dhe përdorni filtërat për sipërfaqe, çmim dhe lloj prone.',
            'Select the city Durres or Sarande on Domlivo and use the filters for size, price and property type.',
            'Seleziona la città Durazzo o Saranda su Domlivo e usa i filtri per superficie, prezzo e tipo di immobile.',
          ),
        ),

        faqItemLi(
          Li(
            'Чи можуть іноземці купувати квартири або будинки в Албанії?',
            'Могут ли иностранцы покупать квартиры или дома в Албании?',
            'A mund të blejnë të huajt apartamente apo shtëpi në Shqipëri?',
            'Can foreigners buy apartments or houses in Albania?',
            'Gli stranieri possono acquistare appartamenti o case in Albania?',
          ),
          Li(
            'Так, іноземці можуть купувати нерухомість. Domlivo допомагає з інформацією та контактами перевірених агентів.',
            'Да, иностранцы могут покупать недвижимость. Domlivo помогает с информацией и контактами проверенных агентов.',
            'Po, të huajt mund të blejnë pronë. Domlivo ndihmon me informacione dhe kontakte me agjentë të verifikuar.',
            'Yes, foreigners can buy property. Domlivo helps with information and contacts of verified agents.',
            'Sì, gli stranieri possono acquistare immobili. Domlivo aiuta con informazioni e contatti di agenti verificati.',
          ),
        ),

        faqItemLi(
          Li(
            'Які середні ціни на оренду квартир у Тирані та Дурресі?',
            'Каковы средние цены на аренду квартир в Тиране и Дурресе?',
            'Cilat janë çmimet mesatare për qira të apartamenteve në Tiranë dhe Durrës?',
            'What are the average rental prices for apartments in Tirana and Durres?',
            'Quali sono i prezzi medi di affitto per appartamenti a Tirana e Durazzo?',
          ),
          Li(
            'Залежить від району та площі, зазвичай від 400€ до 800€ на місяць. Всі об’єкти на Domlivo показують актуальні ціни.',
            'Зависит от района и площади, обычно от 400€ до 800€ в месяц. Все объекты на Domlivo показывают актуальные цены.',
            'Varet nga zona dhe sipërfaqja, zakonisht nga 400€ deri 800€ për muaj. Të gjitha objektet në Domlivo tregojnë çmimet aktuale.',
            'It depends on the area and size, usually from €400 to €800 per month. All listings on Domlivo show current prices.',
            'Dipende dalla zona e dalla superficie, di solito da 400€ a 800€ al mese. Tutti gli annunci su Domlivo mostrano prezzi aggiornati.',
          ),
        ),

        faqItemLi(
          Li(
            'Як знайти апартаменти для короткострокової оренди в Албанії?',
            'Как найти апартаменты для краткосрочной аренды в Албании?',
            'Si të gjej apartamente për qira afatshkurtër në Shqipëri?',
            'How do I find short-term rental apartments in Albania?',
            'Come trovare appartamenti per affitto a breve termine in Albania?',
          ),
          Li(
            'Використовуйте вкладку “Короткострокова оренда” та фільтри за містом, районом і ціною.',
            'Используйте вкладку “Краткосрочная аренда” и фильтры по городу, району и цене.',
            'Shfrytëzoni seksionin “Qira afatshkurtër” dhe filtërat sipas qytetit, zonës dhe çmimit.',
            'Use the “Short-term rental” section and filters by city, district and price.',
            'Usa la sezione “Affitto a breve termine” e i filtri per città, zona e prezzo.',
          ),
        ),

        faqItemLi(
          Li(
            'Чи є комісія при оренді або купівлі через Domlivo?',
            'Есть ли комиссия при аренде или покупке через Domlivo?',
            'A ka komision kur marr me qira ose blej pronë në Domlivo?',
            'Is there a commission when renting or buying through Domlivo?',
            'C’è una commissione quando si affitta o si acquista tramite Domlivo?',
          ),
          Li(
            'Більшість об’єктів без комісії. Ви контактуєте напряму з власником або агентом.',
            'Большинство объектов без комиссии. Вы связываетесь напрямую с владельцем или агентом.',
            'Shumica e pronave janë pa komision. Ju kontaktoni pronarin ose agjentin drejtpërdrejt.',
            'Most listings are commission-free. You contact the owner or agent directly.',
            'La maggior parte degli immobili è senza commissione. Contatti direttamente il proprietario o l’agente.',
          ),
        ),

        faqItemLi(
          Li(
            'Як знайти нерухомість для інвестицій з високим попитом у Тирані чи Дурресі?',
            'Как найти недвижимость для инвестиций с высоким спросом в Тиране или Дурресе?',
            'Si të gjej prona për investim me kërkesë të lartë në Tiranë ose Durrës?',
            'How do I find investment property with high demand in Tirana or Durres?',
            'Come trovare immobili da investimento con alta domanda a Tirana o Durazzo?',
          ),
          Li(
            'Обирайте категорію “Для інвестицій” та використовуйте фільтри за ціною, містом і типом нерухомості.',
            'Выбирайте категорию “Для инвестиций” и используйте фильтры по цене, городу и типу недвижимости.',
            'Zgjidhni kategorinë “Për investim” dhe përdorni filtërat sipas çmimit, qytetit dhe llojit të pronës.',
            'Choose the “For investment” category and use filters by price, city and property type.',
            'Seleziona la categoria “Per investimento” e usa i filtri per prezzo, città e tipo di immobile.',
          ),
        ),

        faqItemLi(
          Li(
            'Як зв’язатися з власником або агентом для будь-якого об’єкта?',
            'Как связаться с владельцем или агентом по любому объекту?',
            'Si të kontaktoj pronarin ose agjentin për çdo pronë?',
            'How do I contact the owner or agent for any property?',
            'Come contattare il proprietario o l’agente per qualsiasi immobile?',
          ),
          Li(
            'У картці об’єкта натисніть кнопку “Зв’язатися” або скористайтеся зазначеним телефоном.',
            'В карточке объекта нажмите кнопку “Связаться” или используйте указанный телефон.',
            'Në kartelën e pronës klikoni butonin “Kontakto” ose përdorni numrin e telefonit të dhënë.',
            'On the property card click the “Contact” button or use the provided phone number.',
            'Nella scheda dell’immobile clicca il pulsante “Contatta” oppure usa il numero di telefono indicato.',
          ),
        ),

        faqItemLi(
          Li(
            'Чи перевірені об’єкти на Domlivo і безпечні для купівлі чи оренди?',
            'Проверены ли объекты на Domlivo и безопасны ли они для покупки или аренды?',
            'A janë pronat në Domlivo të verifikuara dhe të sigurta për blerje ose qira?',
            'Are properties on Domlivo verified and safe for purchase or rent?',
            'Gli immobili su Domlivo sono verificati e sicuri per acquisto o affitto?',
          ),
          Li(
            'Так, усі об’єкти перевіряються Domlivo, а ціни актуальні.',
            'Да, все объекты проверяются Domlivo, а цены актуальны.',
            'Po, të gjitha pronat kontrollohen nga Domlivo dhe çmimet janë të përditësuara.',
            'Yes, all properties are checked by Domlivo and prices are up to date.',
            'Sì, tutti gli immobili vengono controllati da Domlivo e i prezzi sono aggiornati.',
          ),
        ),

        faqItemLi(
          Li(
            'Чи допомагає Domlivo з оформленням документів та угод?',
            'Помогает ли Domlivo с оформлением документов и сделок?',
            'A mund Domlivo të ndihmojë me dokumentacionin dhe marrëveshjet ligjore?',
            'Can Domlivo help with documentation and legal agreements?',
            'Domlivo può aiutare con la documentazione e gli accordi legali?',
          ),
          Li(
            'Так, через перевірених агентів і партнерів.',
            'Да, через проверенных агентов и партнёров.',
            'Po, nëpërmjet agjentëve dhe partnerëve të verifikuar.',
            'Yes, through verified agents and partners.',
            'Sì, tramite agenti e partner verificati.',
          ),
        ),
      ]),
    },
  ])

  const doc: Record<string, unknown> = {
    _id: 'homePage',
    _type: 'homePage',
    homepageSections: homeSections,

    seo: {
      metaTitle: Li(
        'Domlivo — Нерухомість в Албанії',
        'Domlivo — Недвижимость в Албании',
        'Domlivo — Pasuri në Shqipëri',
        'Domlivo — Real Estate in Albania',
        'Domlivo — Immobiliare in Albania',
      ),
      metaDescription: Li(
        'Квартири, будинки та вілли для купівлі, оренди та короткострокового проживання в Тирані, Дурресі, Вльорі та Саранді.',
        'Квартиры, дома и виллы для покупки, аренды и краткосрочного проживания в Тиране, Дурресе, Влёре и Саранде.',
        'Apartamente, shtëpi dhe vila për blerje, qira dhe qira afatshkurtër në Tiranë, Durrës, Vlorë, Sarandë.',
        'Apartments, houses and villas for sale, rent and short-term stay in Tirana, Durres, Vlore and Sarande.',
        'Appartamenti, case e ville per acquisto, affitto e soggiorni a breve termine a Tirana, Durazzo, Valona e Saranda.',
      ),
      ogTitle: Li(
        'Domlivo — Нерухомість в Албанії',
        'Domlivo — Недвижимость в Албании',
        'Domlivo — Pasuri në Shqipëri',
        'Domlivo — Real Estate in Albania',
        'Domlivo — Immobiliare in Albania',
      ),
      ogDescription: Li(
        'Перевірені об’єкти • Актуальні ціни • Без комісії',
        'Проверенные объекты • Актуальные цены • Без комиссии',
        'Objekte të verifikuara • Çmime aktuale • Pa komisione',
        'Verified listings • Current prices • No commission',
        'Immobili verificati • Prezzi aggiornati • Nessuna commissione',
      ),
      ogImage: img(heroImgId),
      noIndex: false,
    },
  }

  await client.createOrReplace(doc)

  console.log('homePage created/updated successfully.')
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
