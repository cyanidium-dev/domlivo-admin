/**
 * Domlivo CMS — Blog Seed Script
 *
 * Seeds blog settings, categories, author, and 2 published blog posts
 * using the current blog schema and content structure.
 *
 * Run: npm run seed:blog
 * Requires: SANITY_API_TOKEN in .env
 *
 * Idempotent: uses createOrReplace with deterministic _id.
 * Reuses existing properties for embed blocks if available; skips if none.
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

/** Localized content: en, uk, ru, sq, it */
type Li = {en: string; uk: string; ru: string; sq: string; it: string}

function Li(en: string, uk: string, ru: string, sq: string, it: string): Li {
  return {en, uk, ru, sq, it}
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

function heading(text: string, level: 'h2' | 'h3' | 'h4', key: string) {
  return {
    _type: 'block',
    _key: key,
    style: level,
    children: [{_type: 'span', _key: `${key}-s1`, text, marks: []}],
    markDefs: [],
  }
}

async function uploadPlaceholderImage(): Promise<string> {
  const res = await fetch('https://picsum.photos/800/600')
  const buffer = Buffer.from(await res.arrayBuffer())
  const asset = await client.assets.upload('image', buffer, {filename: 'placeholder.jpg'})
  return asset._id
}

async function findPublishedProperties(): Promise<string[]> {
  const result = await client.fetch<string[]>(
    `*[_type == "property" && isPublished == true][0...3]._id`
  )
  return Array.isArray(result) ? result : []
}

async function main() {
  validateEnv()
  console.log(`Seeding blog content in ${ENV.projectId} / ${ENV.dataset}...`)

  const coverAssetId = await uploadPlaceholderImage()
  const propertyIds = await findPublishedProperties()
  if (propertyIds.length === 0) {
    console.log('Note: No published properties found. Property embed blocks will be skipped.')
  } else {
    console.log(`Found ${propertyIds.length} published propert(ies) for embed blocks.`)
  }

  // --- 1. Blog Settings ---
  await client.createOrReplace({
    _id: 'blog-settings',
    _type: 'blogSettings',
    heroTitle: Li(
      'Real Estate Insights',
      'Інсайти з нерухомості',
      'Обзоры рынка недвижимости',
      'Njohuri për Pasuri',
      'Approfondimenti immobiliari'
    ),
    heroDescription: Li(
      'Guides, market news and investment tips for property in Albania.',
      'Гайди, новини ринку та поради з інвестицій в нерухомість Албанії.',
      'Гайды, новости рынка и советы по инвестициям в недвижимость Албании.',
      'Udhëzues, lajme të tregut dhe këshilla investimi për pasuri në Shqipëri.',
      'Guide, notizie di mercato e consigli per investimenti immobiliari in Albania.'
    ),
    seo: {
      metaTitle: Li(
        'Blog | Real Estate in Albania | Domlivo',
        'Блог | Нерухомість в Албанії | Domlivo',
        'Блог | Недвижимость в Албании | Domlivo',
        'Blog | Pasuri në Shqipëri | Domlivo',
        'Blog | Immobiliare in Albania | Domlivo'
      ),
      metaDescription: Li(
        'Expert guides and market insights for buying property in Albania. Tirana, Durres, Vlore, Sarande.',
        'Експертні гайди та огляди ринку для купівлі нерухомості в Албанії.',
        'Экспертные гайды и обзоры рынка для покупки недвижимости в Албании.',
        'Udhëzues ekspertësh dhe njohuri të tregut për blerjen e pasurive në Shqipëri.',
        'Guide esperte e approfondimenti sul mercato immobiliare in Albania.'
      ),
      ogTitle: Li('Blog | Domlivo', 'Блог | Domlivo', 'Блог | Domlivo', 'Blog | Domlivo', 'Blog | Domlivo'),
      ogDescription: Li(
        'Real estate insights for Albania.',
        'Інсайти з нерухомості для Албанії.',
        'Обзоры рынка недвижимости в Албании.',
        'Njohuri për pasuri në Shqipëri.',
        'Approfondimenti immobiliari in Albania.'
      ),
      noIndex: false,
    },
  })
  console.log('Blog settings: created/replaced')

  // --- 2. Blog Categories ---
  const catRealEstate = {
    _id: 'blogCategory-real-estate',
    _type: 'blogCategory',
    title: Li('Real Estate', 'Нерухомість', 'Недвижимость', 'Pasuri', 'Immobiliare'),
    slug: {current: 'real-estate'},
    description: Li(
      'Property buying guides, market analysis and investment tips.',
      'Гайди з купівлі, аналіз ринку та поради з інвестицій.',
      'Гайды по покупке, анализ рынка и советы по инвестициям.',
      'Udhëzues blerje, analiza e tregut dhe këshilla investimi.',
      'Guide all\'acquisto, analisi di mercato e consigli per investimenti.'
    ),
    order: 1,
    active: true,
  }
  const catRecreation = {
    _id: 'blogCategory-recreation',
    _type: 'blogCategory',
    title: Li('Lifestyle & Recreation', 'Стиль життя та відпочинок', 'Образ жизни и отдых', 'Jetesa dhe Rekreacioni', 'Stile di vita e tempo libero'),
    slug: {current: 'recreation'},
    description: Li(
      'Living in Albania, lifestyle, travel and recreation.',
      'Життя в Албанії, стиль життя, подорожі та відпочинок.',
      'Жизнь в Албании, образ жизни, путешествия и отдых.',
      'Jetesa në Shqipëri, stili i jetesës, udhëtime dhe rekreacion.',
      'Vita in Albania, stile di vita, viaggi e tempo libero.'
    ),
    order: 2,
    active: true,
  }
  await client.createOrReplace(catRealEstate)
  await client.createOrReplace(catRecreation)
  console.log('Blog categories: 2 (real-estate, recreation)')

  // --- 3. Blog Author ---
  await client.createOrReplace({
    _id: 'blogAuthor-domlivo',
    _type: 'blogAuthor',
    name: 'Domlivo Team',
    slug: {current: 'domlivo-team'},
    active: true,
    role: Li(
      'Real Estate Advisor',
      'Радник з нерухомості',
      'Консультант по недвижимости',
      'Këshilltar Pasurish',
      'Consulente immobiliare'
    ),
    bio: Li(
      'Our team shares expert insights on the Albanian property market, from buying guides to investment strategies.',
      'Наша команда ділиться експертними знаннями про ринок нерухомості Албанії.',
      'Наша команда делится экспертными знаниями об албанском рынке недвижимости.',
      'Ekipi ynë ndan njohuri ekspertësh për tregun shqiptar të pasurive.',
      'Il nostro team condivide approfondimenti sul mercato immobiliare albanese.'
    ),
    photo: {
      _type: 'image',
      asset: {_type: 'reference', _ref: coverAssetId},
      alt: 'Domlivo Team',
    },
  })
  console.log('Blog author: 1 (domlivo-team)')

  // --- 4. Content block helpers ---
  const blockContent = (blocks: unknown[]) => addKeysToArrayItems(blocks)

  const calloutBlock = (
    variant: 'info' | 'tip' | 'important' | 'warning' | 'summary',
    titleLi: Li,
    contentText: string,
    key: string
  ) => ({
    _type: 'blogCallout',
    _key: key,
    variant,
    title: titleLi,
    content: [block(contentText, `${key}-c`)],
  })

  const ctaBlock = (variant: 'primary' | 'secondary' | 'link', href: string, labelLi: Li, key: string) => ({
    _type: 'blogCtaBlock',
    _key: key,
    variant,
    cta: {href, label: labelLi},
  })

  const faqBlock = (titleLi: Li, items: Array<{question: Li; answer: Li}>, key: string) => ({
    _type: 'blogFaqBlock',
    _key: key,
    title: titleLi,
    items: addKeysToArrayItems(
      items.map((item) => ({
        _type: 'localizedFaqItem',
        question: item.question,
        answer: item.answer,
      }))
    ),
  })

  const tableBlock = (titleLi: Li, rows: string[][], captionLi: Li | null, key: string) => ({
    _type: 'blogTable',
    _key: key,
    title: titleLi,
    rows: addKeysToArrayItems(rows.map((cells) => ({_type: 'tableRow' as const, cells}))),
    caption: captionLi,
  })

  const relatedPostsBlock = (titleLi: Li, postIds: string[], key: string) => ({
    _type: 'blogRelatedPostsBlock',
    _key: key,
    title: titleLi,
    posts: addKeysToArrayItems(postIds.map((id) => ({_type: 'reference' as const, _ref: id}))),
  })

  const propertyEmbedBlock = (titleLi: Li, propIds: string[], key: string) => ({
    _type: 'blogPropertyEmbedBlock',
    _key: key,
    title: titleLi,
    mode: 'card',
    properties: addKeysToArrayItems(propIds.map((id) => ({_type: 'reference' as const, _ref: id}))),
  })

  // --- 5. Post 1: Real Estate in Durres ---
  const post1Id = 'blogPost-real-estate-durres'
  const post1ContentEn = [
    heading('Why Durres is a Top Choice for Property Buyers', 'h2', 'p1-h1'),
    block(
      'Durres, Albania\'s main port city, combines coastal living with strong investment potential. The real estate market has grown steadily, attracting both local buyers and international investors seeking affordable beachfront property.',
      'p1-b1'
    ),
    block(
      'Key areas like Plazh and the city center offer a range of options: from modern apartments with sea views to family homes near the beach. Rental demand from tourists remains high, making Durres an attractive market for buy-to-let investments.',
      'p1-b2'
    ),
    calloutBlock(
      'tip',
      Li('Investment tip', 'Порада з інвестицій', 'Совет по инвестициям', 'Këshillë investimi', 'Consiglio investimenti'),
      'Consider properties within walking distance of the beach. These tend to have the strongest rental yields during the summer season.',
      'p1-c1'
    ),
    heading('Average Prices and Market Trends', 'h2', 'p1-h2'),
    block(
      'Prices in Durres vary by location. Beachfront and central areas command premium prices, while neighborhoods slightly inland offer more affordable entry points.',
      'p1-b3'
    ),
    tableBlock(
      Li('Price overview (approx.)', 'Огляд цін', 'Обзор цен', 'Përmbledhje çmimesh', 'Panoramica prezzi'),
      [
        ['Area', 'Avg. €/m²', 'Notes'],
        ['Plazh (beach)', '1,200–1,800', 'High demand'],
        ['City center', '1,000–1,400', 'Good rental potential'],
        ['Inland', '700–1,000', 'More affordable'],
      ],
      Li('Prices may vary. Consult agents for current listings.', 'Ціни можуть змінюватися.', 'Цены могут меняться.', 'Çmimet mund të ndryshojnë.', 'I prezzi possono variare.'),
      'p1-t1'
    ),
    faqBlock(
      Li('Frequently Asked Questions', 'Поширені питання', 'Часто задаваемые вопросы', 'Pyetje të shpeshta', 'Domande frequenti'),
      [
        {
          question: Li('Is Durres good for investment?', 'Чи підходить Дуррес для інвестицій?', 'Подходит ли Дуррес для инвестиций?', 'A është Durrësi i mirë për investim?', 'Durres è adatto per investimenti?'),
          answer: Li(
            'Yes. Durres has strong rental demand, especially in summer. Beachfront and central properties tend to perform well.',
            'Так. Дуррес має високий попит на оренду, особливо влітку.',
            'Да. В Дурресе высокий спрос на аренду, особенно летом.',
            'Po. Durrësi ka kërkesë të lartë për qira, veçanërisht në verë.',
            'Sì. Durres ha forte domanda di affitti, soprattutto in estate.'
          ),
        },
        {
          question: Li('What documents do I need to buy property?', 'Які документи потрібні для купівлі?', 'Какие документы нужны для покупки?', 'Çfarë dokumentesh nevojiten për blerje?', 'Quali documenti servono per acquistare?'),
          answer: Li(
            'You typically need a valid ID, proof of funds, and a notarized sales contract. A local lawyer can guide you through the process.',
            'Зазвичай потрібне посвідчення особи, підтвердження коштів та нотаріально завірений договір.',
            'Обычно нужны удостоверение личности, подтверждение средств и нотариальный договор.',
            'Zakonisht nevojiten ID e vlefshme, provë e fondeve dhe kontratë shitjeje e noterizuar.',
            'Di solito servono un documento valido, prova dei fondi e un contratto di vendita notarile.'
          ),
        },
      ],
      'p1-f1'
    ),
    ctaBlock(
      'primary',
      '/properties?city=durres',
      Li('Browse properties in Durres', 'Переглянути об\'єкти в Дурресі', 'Смотреть объекты в Дурресе', 'Shiko pronat në Durrës', 'Sfoglia proprietà a Durazzo'),
      'p1-cta1'
    ),
    ...(propertyIds.length >= 1
      ? [
          propertyEmbedBlock(
            Li('Featured properties in the area', 'Обрані об\'єкти', 'Избранные объекты', 'Prona të zgjedhura', 'Proprietà in evidenza'),
            propertyIds.slice(0, 2),
            'p1-prop1'
          ),
        ]
      : []),
  ]

  const post1Content = {
    en: blockContent(post1ContentEn),
    uk: blockContent([
      heading('Чому Дуррес — топовий вибір для покупців нерухомості', 'h2', 'p1-h1'),
      block('Дуррес, головне портове місто Албанії, поєднує прибережне життя з сильним інвестиційним потенціалом.', 'p1-b1'),
      block('Ключові райони, такі як Пляж та центр міста, пропонують різноманітні варіанти.', 'p1-b2'),
      calloutBlock('tip', Li('Порада', 'Порада', 'Совет', 'Këshillë', 'Consiglio'), 'Розгляньте нерухомість у пішій доступності від пляжу.', 'p1-c1'),
      ctaBlock('primary', '/properties?city=durres', Li('Переглянути об\'єкти', 'Переглянути', 'Смотреть', 'Shiko', 'Sfoglia'), 'p1-cta1'),
    ]),
    ru: blockContent([
      heading('Почему Дуррес — топовый выбор для покупателей недвижимости', 'h2', 'p1-h1'),
      block('Дуррес, главный портовый город Албании, сочетает прибрежную жизнь с сильным инвестиционным потенциалом.', 'p1-b1'),
      block('Ключевые районы, такие как Плаж и центр города, предлагают разнообразные варианты.', 'p1-b2'),
      calloutBlock('tip', Li('Совет', 'Порада', 'Совет', 'Këshillë', 'Consiglio'), 'Рассмотрите недвижимость в пешей доступности от пляжа.', 'p1-c1'),
      ctaBlock('primary', '/properties?city=durres', Li('Смотреть объекты', 'Переглянути', 'Смотреть', 'Shiko', 'Sfoglia'), 'p1-cta1'),
    ]),
    sq: blockContent([
      heading('Pse Durrësi është zgjedhja kryesore për blerësit e pasurive', 'h2', 'p1-h1'),
      block('Durrësi, qyteti kryesor portor i Shqipërisë, kombinon jetën bregdetare me potencial të fortë investimi.', 'p1-b1'),
      block('Zonat kryesore si Plazhi dhe qendra e qytetit ofrojnë opsione të ndryshme.', 'p1-b2'),
      calloutBlock('tip', Li('Këshillë', 'Порада', 'Совет', 'Këshillë', 'Consiglio'), 'Konsideroni pronat brenda distancës këmbësore nga plazhi.', 'p1-c1'),
      ctaBlock('primary', '/properties?city=durres', Li('Shiko pronat', 'Переглянути', 'Смотреть', 'Shiko', 'Sfoglia'), 'p1-cta1'),
    ]),
    it: blockContent([
      heading('Perché Durazzo è una scelta top per chi compra immobili', 'h2', 'p1-h1'),
      block('Durazzo, la principale città portuale dell\'Albania, combina vita costiera e forte potenziale di investimento.', 'p1-b1'),
      block('Le aree chiave come Plazh e il centro offrono diverse opzioni.', 'p1-b2'),
      calloutBlock('tip', Li('Consiglio', 'Порада', 'Совет', 'Këshillë', 'Consiglio'), 'Considera immobili a pochi passi dalla spiaggia.', 'p1-c1'),
      ctaBlock('primary', '/properties?city=durres', Li('Sfoglia proprietà', 'Переглянути', 'Смотреть', 'Shiko', 'Sfoglia'), 'p1-cta1'),
    ]),
  }

  await client.createOrReplace({
    _id: post1Id,
    _type: 'blogPost',
    slug: {current: 'real-estate-durres'},
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    title: Li(
      'Real Estate in Durres: A Buyer\'s Guide',
      'Нерухомість в Дурресі: гайд для покупців',
      'Недвижимость в Дурресе: гайд для покупателей',
      'Pasuri në Durrës: Udhëzues për Blerës',
      'Immobiliare a Durazzo: guida per acquirenti'
    ),
    subtitle: Li(
      'Coastal living and investment potential in Albania\'s port city',
      'Прибережне життя та інвестиційний потенціал у портовому місті',
      'Прибрежная жизнь и инвестиционный потенциал портового города',
      'Jetesa bregdetare dhe potencial investimi në qytetin portor',
      'Vita costiera e potenziale di investimento nella città portuale'
    ),
    excerpt: Li(
      'Discover why Durres is a top choice for property buyers. Market trends, price overview and investment tips.',
      'Дізнайтеся, чому Дуррес — топовий вибір для покупців нерухомості.',
      'Узнайте, почему Дуррес — топовый выбор для покупателей недвижимости.',
      'Zbuloni pse Durrësi është zgjedhja kryesore për blerësit e pasurive.',
      'Scopri perché Durazzo è una scelta top per chi compra immobili.'
    ),
    content: post1Content,
    coverImage: {
      _type: 'image',
      asset: {_type: 'reference', _ref: coverAssetId},
      alt: 'Durres coastline and property',
    },
    categories: [
      {_type: 'reference', _ref: 'blogCategory-real-estate'},
    ],
    author: {_type: 'reference', _ref: 'blogAuthor-domlivo'},
    featured: true,
    seo: {
      metaTitle: Li(
        'Real Estate in Durres | Buyer\'s Guide | Domlivo',
        'Нерухомість в Дурресі | Domlivo',
        'Недвижимость в Дурресе | Domlivo',
        'Pasuri në Durrës | Domlivo',
        'Immobiliare a Durazzo | Domlivo'
      ),
      metaDescription: Li(
        'Guide to buying property in Durres. Market trends, prices and investment tips for Albania\'s port city.',
        'Гайд з купівлі нерухомості в Дурресі. Тренди ринку та поради з інвестицій.',
        'Гайд по покупке недвижимости в Дурресе. Тренды рынка и советы по инвестициям.',
        'Udhëzues për blerjen e pasurive në Durrës. Tregu dhe këshilla investimi.',
        'Guida all\'acquisto di immobili a Durazzo. Tendenze e consigli.'
      ),
      ogTitle: Li('Real Estate in Durres | Domlivo', 'Нерухомість в Дурресі | Domlivo', 'Недвижимость в Дурресе | Domlivo', 'Pasuri në Durrës | Domlivo', 'Immobiliare a Durazzo | Domlivo'),
      ogDescription: Li(
        'Coastal living and investment potential in Durres.',
        'Прибережне життя та інвестиційний потенціал у Дурресі.',
        'Прибрежная жизнь и инвестиционный потенциал в Дурресе.',
        'Jetesa bregdetare dhe potencial investimi në Durrës.',
        'Vita costiera e potenziale a Durazzo.'
      ),
      noIndex: false,
    },
  })
  console.log('Blog post 1: real-estate-durres')

  // --- 6. Post 2: Living in Albania (lifestyle/recreation) ---
  const post2Id = 'blogPost-living-albania'
  const relatedTitle = Li('Read next', 'Читати далі', 'Читать далее', 'Lexo më tej', 'Leggi anche')

  const post2ContentEn = [
    heading('Living in Albania: Lifestyle and Recreation', 'h2', 'p2-h1'),
    block(
      'Albania offers a unique blend of Mediterranean lifestyle, affordable living and stunning natural beauty. From the Adriatic coast to the Ionian beaches, the country has become an attractive destination for expats and investors alike.',
      'p2-b1'
    ),
    block(
      'Whether you\'re drawn to beach life, mountain hiking or vibrant city culture, Albania has something to offer. The cost of living remains lower than in most Western European countries, while quality of life continues to improve.',
      'p2-b2'
    ),
    calloutBlock(
      'summary',
      Li('Summary', 'Підсумок', 'Резюме', 'Përmbledhje', 'Riepilogo'),
      'Albania combines affordable property, strong rental demand and a growing tourism sector. It\'s an ideal base for both lifestyle and investment.',
      'p2-c1'
    ),
    heading('Recreation and Things to Do', 'h2', 'p2-h2'),
    block(
      'The coastline stretches for hundreds of kilometers, with popular spots like Ksamil, Vlore and Sarande. Inland, you\'ll find national parks, historic towns and a welcoming local culture. Tirana offers urban amenities, while coastal cities provide a more relaxed pace.',
      'p2-b3'
    ),
    faqBlock(
      Li('Living in Albania: FAQ', 'Життя в Албанії: питання', 'Жизнь в Албании: вопросы', 'Jetesa në Shqipëri: pyetje', 'Vita in Albania: domande'),
      [
        {
          question: Li('Is Albania safe for expats?', 'Чи безпечна Албанія для експатів?', 'Безопасна ли Албания для экспатов?', 'A është Shqipëria e sigurt për ekspatë?', 'L\'Albania è sicura per gli espatriati?'),
          answer: Li(
            'Yes. Albania is generally safe, with low crime rates in most areas. Expats report feeling welcome and secure.',
            'Так. Албанія загалом безпечна, з низьким рівнем злочинності в більшості регіонів.',
            'Да. Албания в целом безопасна, с низким уровнем преступности в большинстве регионов.',
            'Po. Shqipëria është përgjithësisht e sigurt, me norma të ulëta kriminaliteti.',
            'Sì. L\'Albania è generalmente sicura, con bassi tassi di criminalità.'
          ),
        },
        {
          question: Li('What is the cost of living like?', 'Який рівень життєвих витрат?', 'Какой уровень жизненных расходов?', 'Si është kostoja e jetesës?', 'Com\'è il costo della vita?'),
          answer: Li(
            'Living costs are lower than in Western Europe. Rent, food and utilities are affordable, especially outside Tirana.',
            'Вартість життя нижча, ніж у Західній Європі. Оренда, їжа та комунальні послуги доступні.',
            'Стоимость жизни ниже, чем в Западной Европе. Аренда, еда и коммунальные услуги доступны.',
            'Kostot e jetesës janë më të ulëta se në Evropën Perëndimore.',
            'Il costo della vita è inferiore rispetto all\'Europa occidentale.'
          ),
        },
      ],
      'p2-f1'
    ),
    relatedPostsBlock(relatedTitle, [post1Id], 'p2-rel1'),
    ctaBlock(
      'secondary',
      '/properties',
      Li('Explore properties', 'Переглянути об\'єкти', 'Смотреть объекты', 'Eksploro pronat', 'Esplora proprietà'),
      'p2-cta1'
    ),
    ...(propertyIds.length >= 1
      ? [
          propertyEmbedBlock(
            Li('Properties you might like', 'Об\'єкти, які можуть сподобатися', 'Объекты, которые могут понравиться', 'Prona që mund t\'ju pëlqejnë', 'Proprietà che potrebbero piacerti'),
            propertyIds.slice(0, 2),
            'p2-prop1'
          ),
        ]
      : []),
  ]

  const post2Content = {
    en: blockContent(post2ContentEn),
    uk: blockContent([
      heading('Життя в Албанії: стиль життя та відпочинок', 'h2', 'p2-h1'),
      block('Албанія пропонує унікальне поєднання середземноморського способу життя та доступного життя.', 'p2-b1'),
      calloutBlock('summary', Li('Підсумок', 'Підсумок', 'Резюме', 'Përmbledhje', 'Riepilogo'), 'Албанія поєднує доступну нерухомість та зростаючий туризм.', 'p2-c1'),
      relatedPostsBlock(relatedTitle, [post1Id], 'p2-rel1'),
      ctaBlock('secondary', '/properties', Li('Переглянути об\'єкти', 'Переглянути', 'Смотреть', 'Eksploro', 'Esplora'), 'p2-cta1'),
    ]),
    ru: blockContent([
      heading('Жизнь в Албании: образ жизни и отдых', 'h2', 'p2-h1'),
      block('Албания предлагает уникальное сочетание средиземноморского образа жизни и доступной жизни.', 'p2-b1'),
      calloutBlock('summary', Li('Резюме', 'Підсумок', 'Резюме', 'Përmbledhje', 'Riepilogo'), 'Албания сочетает доступную недвижимость и растущий туризм.', 'p2-c1'),
      relatedPostsBlock(relatedTitle, [post1Id], 'p2-rel1'),
      ctaBlock('secondary', '/properties', Li('Смотреть объекты', 'Переглянути', 'Смотреть', 'Eksploro', 'Esplora'), 'p2-cta1'),
    ]),
    sq: blockContent([
      heading('Jetesa në Shqipëri: stili i jetesës dhe rekreacioni', 'h2', 'p2-h1'),
      block('Shqipëria ofron një përzierje unike të stilit mesdhetar dhe jetesës së përballueshme.', 'p2-b1'),
      calloutBlock('summary', Li('Përmbledhje', 'Підсумок', 'Резюме', 'Përmbledhje', 'Riepilogo'), 'Shqipëria kombinon pasuri të përballueshme dhe turizëm në rritje.', 'p2-c1'),
      relatedPostsBlock(relatedTitle, [post1Id], 'p2-rel1'),
      ctaBlock('secondary', '/properties', Li('Eksploro pronat', 'Переглянути', 'Смотреть', 'Eksploro', 'Esplora'), 'p2-cta1'),
    ]),
    it: blockContent([
      heading('Vita in Albania: stile di vita e tempo libero', 'h2', 'p2-h1'),
      block('L\'Albania offre un mix unico di stile di vita mediterraneo e vita accessibile.', 'p2-b1'),
      calloutBlock('summary', Li('Riepilogo', 'Підсумок', 'Резюме', 'Përmbledhje', 'Riepilogo'), 'L\'Albania combina immobili accessibili e turismo in crescita.', 'p2-c1'),
      relatedPostsBlock(relatedTitle, [post1Id], 'p2-rel1'),
      ctaBlock('secondary', '/properties', Li('Esplora proprietà', 'Переглянути', 'Смотреть', 'Eksploro', 'Esplora'), 'p2-cta1'),
    ]),
  }

  await client.createOrReplace({
    _id: post2Id,
    _type: 'blogPost',
    slug: {current: 'living-albania'},
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    title: Li(
      'Living in Albania: Lifestyle, Recreation and Investment',
      'Життя в Албанії: стиль життя, відпочинок та інвестиції',
      'Жизнь в Албании: образ жизни, отдых и инвестиции',
      'Jetesa në Shqipëri: Stili i Jetesës, Rekreacioni dhe Investimi',
      'Vita in Albania: stile di vita, tempo libero e investimenti'
    ),
    subtitle: Li(
      'Discover what makes Albania an attractive place to live and invest',
      'Дізнайтеся, що робить Албанію привабливим місцем для життя та інвестицій',
      'Узнайте, что делает Албанию привлекательным местом для жизни и инвестиций',
      'Zbuloni çfarë e bën Shqipërinë vend tërheqës për të jetuar dhe investuar',
      'Scopri cosa rende l\'Albania un luogo attraente per vivere e investire'
    ),
    excerpt: Li(
      'A guide to lifestyle, recreation and living costs in Albania. From coastal living to city life, discover what the country has to offer.',
      'Гайд зі стилю життя, відпочинку та витрат на життя в Албанії.',
      'Гайд по образу жизни, отдыху и расходам на жизнь в Албании.',
      'Udhëzues për stilin e jetesës, rekreacionin dhe kostot e jetesës në Shqipëri.',
      'Guida a stile di vita, tempo libero e costo della vita in Albania.'
    ),
    content: post2Content,
    coverImage: {
      _type: 'image',
      asset: {_type: 'reference', _ref: coverAssetId},
      alt: 'Albanian coastline and lifestyle',
    },
    categories: [
      {_type: 'reference', _ref: 'blogCategory-recreation'},
      {_type: 'reference', _ref: 'blogCategory-real-estate'},
    ],
    author: {_type: 'reference', _ref: 'blogAuthor-domlivo'},
    featured: false,
    relatedPosts: [{_type: 'reference', _ref: post1Id}],
    relatedProperties: propertyIds.length >= 1
      ? propertyIds.slice(0, 2).map((id) => ({_type: 'reference', _ref: id}))
      : [],
    seo: {
      metaTitle: Li(
        'Living in Albania | Lifestyle & Investment | Domlivo',
        'Життя в Албанії | Domlivo',
        'Жизнь в Албании | Domlivo',
        'Jetesa në Shqipëri | Domlivo',
        'Vita in Albania | Domlivo'
      ),
      metaDescription: Li(
        'Guide to living in Albania. Lifestyle, recreation, cost of living and investment opportunities.',
        'Гайд з життя в Албанії. Стиль життя, відпочинок та інвестиційні можливості.',
        'Гайд по жизни в Албании. Образ жизни, отдых и инвестиционные возможности.',
        'Udhëzues për jetesën në Shqipëri. Stili, rekreacioni dhe mundësitë e investimit.',
        'Guida alla vita in Albania. Stile di vita, tempo libero e opportunità di investimento.'
      ),
      ogTitle: Li('Living in Albania | Domlivo', 'Життя в Албанії | Domlivo', 'Жизнь в Албании | Domlivo', 'Jetesa në Shqipëri | Domlivo', 'Vita in Albania | Domlivo'),
      ogDescription: Li(
        'Lifestyle, recreation and investment in Albania.',
        'Стиль життя, відпочинок та інвестиції в Албанії.',
        'Образ жизни, отдых и инвестиции в Албании.',
        'Stili i jetesës, rekreacioni dhe investimi në Shqipëri.',
        'Stile di vita, tempo libero e investimenti in Albania.'
      ),
      noIndex: false,
    },
  })
  console.log('Blog post 2: living-albania')

  // --- 7. Patch post 1 to add related posts block (references post 2) ---
  const post1ContentWithRelated = {
    ...post1Content,
    en: blockContent([
      ...post1ContentEn,
      relatedPostsBlock(relatedTitle, [post2Id], 'p1-rel1'),
    ]),
  }
  await client.createOrReplace({
    _id: post1Id,
    _type: 'blogPost',
    slug: {current: 'real-estate-durres'},
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    title: Li(
      'Real Estate in Durres: A Buyer\'s Guide',
      'Нерухомість в Дурресі: гайд для покупців',
      'Недвижимость в Дурресе: гайд для покупателей',
      'Pasuri në Durrës: Udhëzues për Blerës',
      'Immobiliare a Durazzo: guida per acquirenti'
    ),
    subtitle: Li(
      'Coastal living and investment potential in Albania\'s port city',
      'Прибережне життя та інвестиційний потенціал у портовому місті',
      'Прибрежная жизнь и инвестиционный потенциал портового города',
      'Jetesa bregdetare dhe potencial investimi në qytetin portor',
      'Vita costiera e potenziale di investimento nella città portuale'
    ),
    excerpt: Li(
      'Discover why Durres is a top choice for property buyers. Market trends, price overview and investment tips.',
      'Дізнайтеся, чому Дуррес — топовий вибір для покупців нерухомості.',
      'Узнайте, почему Дуррес — топовый выбор для покупателей недвижимости.',
      'Zbuloni pse Durrësi është zgjedhja kryesore për blerësit e pasurive.',
      'Scopri perché Durazzo è una scelta top per chi compra immobili.'
    ),
    content: post1ContentWithRelated,
    coverImage: {
      _type: 'image',
      asset: {_type: 'reference', _ref: coverAssetId},
      alt: 'Durres coastline and property',
    },
    categories: [{_type: 'reference', _ref: 'blogCategory-real-estate'}],
    author: {_type: 'reference', _ref: 'blogAuthor-domlivo'},
    featured: true,
    relatedPosts: [{_type: 'reference', _ref: post2Id}],
    relatedProperties: propertyIds.length >= 1
      ? propertyIds.slice(0, 2).map((id) => ({_type: 'reference', _ref: id}))
      : [],
    seo: {
      metaTitle: Li(
        'Real Estate in Durres | Buyer\'s Guide | Domlivo',
        'Нерухомість в Дурресі | Domlivo',
        'Недвижимость в Дурресе | Domlivo',
        'Pasuri në Durrës | Domlivo',
        'Immobiliare a Durazzo | Domlivo'
      ),
      metaDescription: Li(
        'Guide to buying property in Durres. Market trends, prices and investment tips for Albania\'s port city.',
        'Гайд з купівлі нерухомості в Дурресі. Тренди ринку та поради з інвестицій.',
        'Гайд по покупке недвижимости в Дурресе. Тренды рынка и советы по инвестициям.',
        'Udhëzues për blerjen e pasurive në Durrës. Tregu dhe këshilla investimi.',
        'Guida all\'acquisto di immobili a Durazzo. Tendenze e consigli.'
      ),
      ogTitle: Li('Real Estate in Durres | Domlivo', 'Нерухомість в Дурресі | Domlivo', 'Недвижимость в Дурресе | Domlivo', 'Pasuri në Durrës | Domlivo', 'Immobiliare a Durazzo | Domlivo'),
      ogDescription: Li(
        'Coastal living and investment potential in Durres.',
        'Прибережне життя та інвестиційний потенціал у Дурресі.',
        'Прибрежная жизнь и инвестиционный потенциал в Дурресе.',
        'Jetesa bregdetare dhe potencial investimi në Durrës.',
        'Vita costiera e potenziale a Durazzo.'
      ),
      noIndex: false,
    },
  })
  console.log('Blog post 1: updated with related posts block')

  console.log('\nBlog seed completed.')
}

main().catch((err) => {
  console.error('Blog seed failed:', err)
  process.exit(1)
})
