/**
 * Seed canonical city landing pages using landingPage + pageSections[].
 *
 * Creates/updates:
 * - landing-tirana (pageType=city, linkedCity=Tirana)
 * - landing-durres (pageType=city, linkedCity=Durres)
 *
 * Also creates (if missing) 4 blog posts for Tirana landing "Useful articles" section,
 * then references them in the section.
 *
 * Run:
 * - npm run seed:city-landings -- --dry
 * - npm run seed:city-landings -- --execute
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const apiVersion = (process.env.SANITY_API_VERSION || '2024-01-01').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const isDry = process.argv.includes('--dry')
const isExecute = process.argv.includes('--execute')

if (!token) {
  console.error('Error: SANITY_API_TOKEN required. Add to .env')
  process.exit(1)
}

if (!isDry && !isExecute) {
  console.error('Use --dry to preview or --execute to write.')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion, useCdn: false, token})

type Li = {en: string; ru: string; uk: string; sq: string; it: string}
const Li = (en: string, ru: string, uk: string, sq: string, it: string): Li => ({en, ru, uk, sq, it})

async function uploadPlaceholderImage(seed: string): Promise<string> {
  const res = await fetch(`https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/800`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const asset = await client.assets.upload('image', buffer, {filename: `seed-${seed}.jpg`})
  return asset._id
}

function img(assetId: string, alt: string) {
  return {
    _type: 'image',
    asset: {_type: 'reference', _ref: assetId},
    alt,
  }
}

function blocksFromText(text: string): any[] {
  const paras = text
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean)
  return paras.map((p, idx) => ({
    _type: 'block',
    _key: `p${idx}-${Math.random().toString(16).slice(2, 8)}`,
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: `s${idx}-${Math.random().toString(16).slice(2, 8)}`, text: p, marks: []}],
  }))
}

async function ensureCityBySlug(citySlug: string) {
  const city = await client.fetch<{_id: string; title: any; slug: {current: string}} | null>(
    `*[_type=="city" && slug.current == $slug][0]{_id, title, slug}`,
    {slug: citySlug},
  )
  if (!city) throw new Error(`City not found by slug: ${citySlug}`)
  return city
}

async function ensureBlogPost(id: string, title: Li) {
  const existing = await client.fetch<{_id: string} | null>(`*[_type=="blogPost" && _id==$id][0]{_id}`, {id})
  if (existing) return id
  if (isDry) return id
  await client.create({
    _id: id,
    _type: 'blogPost',
    slug: {current: id.replace(/^blog-/, '')},
    title,
    excerpt: Li(
      title.en,
      title.ru,
      title.uk,
      title.sq,
      title.it,
    ),
    content: {
      en: blocksFromText(title.en),
      ru: blocksFromText(title.ru),
      uk: blocksFromText(title.uk),
      sq: blocksFromText(title.sq),
      it: blocksFromText(title.it),
    },
  })
  return id
}

async function fetchDistrictSlugsForCity(cityId: string): Promise<string[]> {
  const rows = await client.fetch<Array<{slug: string}>>(
    `*[_type=="district" && city._ref == $cityId]{ "slug": slug.current } | order(order asc)`,
    {cityId},
  )
  return rows.map((r) => r.slug).filter(Boolean)
}

function heroSearchTabsSaleOnly(): any {
  return {
    enabled: true,
    tabs: [
      {
        _type: 'heroSearchTab',
        key: 'sale',
        enabled: true,
      },
      {
        _type: 'heroSearchTab',
        key: 'rent',
        enabled: false,
      },
      {
        _type: 'heroSearchTab',
        key: 'shortTerm',
        enabled: false,
      },
    ],
  }
}

function buildTiranaSections(): any[] {
  const tiranaH1 = Li(
    'Buy property in Tirana — apartments, houses and villas',
    'Покупка недвижимости в Тиране — квартиры, дома и виллы',
    'Купівля нерухомості в Тирані — Квартири, будинки та вілли',
    'Blerje prona në Tiranë — Apartamente, shtëpi dhe vila',
    'Acquistare immobili a Tirana — appartamenti, case e ville',
  )
  const tiranaH2 = Li(
    'Choose the best sale offers with real, verified prices',
    'Выберите лучшие предложения продажи с реальными и проверенными ценами',
    'Оберіть найкращі пропозиції продажу з реальними та перевіреними цінами',
    'Zgjidhni ofertat më të mira të shitjes me çmime reale dhe të verifikuara',
    'Scegli le migliori offerte in vendita con prezzi reali e verificati',
  )
  const heroCtaLabel = Li(
    'Find the best property in Tirana',
    'Найти лучший объект в Тиране',
    'Знайти найкращий об’єкт у Тирані',
    'Gjej pronën më të mirë në Tiranë',
    'Trova il miglior immobile a Tirana',
  )
  const heroSeoLine = Li(
    'Most popular offers, updated daily',
    'Самые популярные предложения, обновляются ежедневно',
    'Найпопулярніші та щодня оновлювані пропозиції',
    'Ofertat më të njohura dhe të azhurnuara çdo ditë',
    'Le offerte più popolari, aggiornate ogni giorno',
  )

  const cityDescTitle = Li(
    'Tirana description',
    'Описание Тираны',
    'Опис міста',
    'Përshkrimi i Tiranës',
    'Descrizione di Tirana',
  )

  const cityDescContentSq = `Tirana është qyteti më i madh dhe ekonomikisht më aktiv në Shqipëri, me një treg të zhvilluar pronash dhe interes të lartë nga blerësit vendas dhe të huaj.

Në vitin 2026, çmimet e pronave në Tiranë vazhdojnë të rriten, duke reflektuar kërkesën e qëndrueshme për apartamente për banim dhe investim.

Tirana ofron infrastrukturë moderne, akses të mirë në shërbime, transport urban dhe zona të preferuara si Blloku dhe Liqeni i Tiranës.

Kjo e bën Tiranën një zgjedhje tërheqëse për familjet, profesionistët dhe investitorët që kërkojnë prona me potencial të lartë kthimi.`
  const cityDescContentUk = `Тирана — найбільше місто та економічно найактивніше в Албанії, зі сформованим ринком нерухомості та високим попитом від місцевих і іноземних покупців.

У 2026 році ціни на нерухомість у Тирані продовжують зростати, що відображає стабільний попит на квартири як для проживання, так і для інвестицій.

Тирана пропонує сучасну інфраструктуру, зручний доступ до послуг, міський транспорт і популярні райони, такі як Блок та Лікені Тирани.

Це робить Тирану привабливим вибором для сімей, професіоналів і інвесторів, що шукають об’єкти з високим потенціалом прибутку.`

  const cityDescContent = Li(
    'Tirana is Albania’s largest and most economically active city, with a mature real estate market and strong demand from local and international buyers.',
    'Тирана — крупнейший и экономически самый активный город Албании с развитым рынком недвижимости и высоким спросом.',
    cityDescContentUk,
    cityDescContentSq,
    'Tirana è la città più grande e più attiva economicamente in Albania, con un mercato immobiliare sviluppato e una domanda elevata.',
  )

  return [
    {
      _type: 'heroSection',
      enabled: true,
      title: tiranaH1,
      subtitle: tiranaH2,
      search: heroSearchTabsSaleOnly(),
      cta: {href: '/catalog?city=tirana', label: heroCtaLabel},
      seoTextUnderCta: heroSeoLine,
    },
    {
      _type: 'propertyCarouselSection',
      enabled: true,
      title: Li(
        'Top properties for sale in Tirana',
        'Самые популярные объекты для покупки в Тиране',
        'Найпопулярніші об’єкти для купівлі в Тирані',
        'Objektet më të njohura për blerje në Tiranë',
        'Immobili più popolari da acquistare a Tirana',
      ),
      shortLine: Li(
        'Verified apartments, houses and villas with real prices',
        'Квартиры, дома и виллы, которые выбирают чаще всего — проверенные и с актуальными ценами',
        'Квартири, будинки та вілли, що найчастіше обирають, перевірені та з актуальними цінами',
        'Apartamente, shtëpi dhe vila të rezervuara shpesh, të verifikuara dhe me çmime reale',
        'Appartamenti, case e ville più richiesti, verificati e con prezzi reali',
      ),
      cta: {href: '/catalog?city=tirana', label: Li('Buy property in Tirana', 'Купить в Тиране', 'Купити нерухомість в Тирані', 'Bleni pronë në Tiranë', 'Acquista a Tirana')},
      mode: 'auto',
      tabs: [{_type: 'homePropertyCarouselTab', key: 'popular', enabled: true}],
    },
    {
      _type: 'cityRichDescriptionSection',
      enabled: true,
      title: cityDescTitle,
      content: cityDescContent,
      cta: {href: '/catalog?city=tirana', label: Li('View all properties in Tirana', 'Смотреть все в Тиране', 'Переглянути всі об’єкти в Тирані', 'Shikoni të gjitha pronat në Tiranë', 'Vedi tutti a Tirana')},
    },
    {
      _type: 'districtsComparisonSection',
      enabled: true,
      title: Li(
        'Main Tirana districts for buying property',
        'Основные районы Тираны для покупки недвижимости',
        'Основні райони Тирани для купівлі нерухомості',
        'Zonat kryesore të Tiranës për blerje prona',
        'Principali zone di Tirana per acquistare',
      ),
      description: Li(
        'Tirana offers districts with different characteristics for buyers and investors.',
        'Тирана предлагает районы с разными характеристиками для покупателей и инвесторов.',
        'Тирана пропонує райони з різними унікальними характеристиками для покупців та інвесторів. Центральні райони ідеальні для тих, хто хоче швидкий доступ до роботи, магазинів та сервісів, тоді як периферійні райони забезпечують спокій і більше простору для будинків та приватних вілл.',
        'Tirana ofron zona të ndryshme me karakteristika unike për blerësit dhe investitorët. Rajonet qendrore janë ideale për ata që duan qasje të shpejtë në punë, dyqane dhe shërbime, ndërsa zonat periferike ofrojnë qetësi dhe hapësira më të mëdha për vila dhe shtëpi familjare.',
        'Tirana offre zone con caratteristiche diverse per acquirenti e investitori.',
      ),
      columns: {
        colRegion: Li('District', 'Район', 'Район', 'Rajoni', 'Zona'),
        colAvgPrice: Li('Avg price €/m²', 'Ср. цена €/м²', 'Середня ціна €/м²', 'Çmimi mesatar €/m²', 'Prezzo medio €/m²'),
        colAvgArea: Li('Avg area m²', 'Ср. площадь м²', 'Середня площа м²', 'Sipërfaqja mesatare m²', 'Superficie media m²'),
        colPopularity: Li('Popularity', 'Популярность', 'Популярність', 'Popullariteti', 'Popolarità'),
      },
      rows: [
        {region: Li('Center', 'Центр', 'Центр', 'Qendër', 'Centro'), avgPriceEurM2: '2,200 €', avgAreaM2: '80 m²', popularity: Li('Very high', 'Очень высокая', 'Дуже висока', 'Shumë e lartë', 'Molto alta')},
        {region: Li('Blloku', 'Блоку', 'Блок', 'Blloku', 'Blloku'), avgPriceEurM2: '2,500 €', avgAreaM2: '75 m²', popularity: Li('Very high', 'Очень высокая', 'Дуже висока', 'Shumë e lartë', 'Molto alta')},
        {region: Li('New Tirana', 'Новая Тирана', 'Нова Тирана', 'Tirana e Re', 'Nuova Tirana'), avgPriceEurM2: '1,700 €', avgAreaM2: '85 m²', popularity: Li('High', 'Высокая', 'Висока', 'E lartë', 'Alta')},
        {region: Li('Laprakë', 'Лапраке', 'Лапрак', 'Laprakë', 'Laprakë'), avgPriceEurM2: '1,600 €', avgAreaM2: '90 m²', popularity: Li('Medium', 'Средняя', 'Середня', 'Mesatare', 'Media')},
        {region: Li('Kombinat', 'Комбинат', 'Комбінат', 'Kombinat', 'Kombinat'), avgPriceEurM2: '1,400 €', avgAreaM2: '95 m²', popularity: Li('Medium', 'Средняя', 'Середня', 'Mesatare', 'Media')},
        {region: Li('Yzberisht', 'Изберишт', 'Ізберішт', 'Yzberisht', 'Yzberisht'), avgPriceEurM2: '1,300 €', avgAreaM2: '100 m²', popularity: Li('Low', 'Низкая', 'Низька', 'E ulët', 'Bassa')},
      ],
      closingText: Li(
        'This overview shows that prices and sizes vary by district.',
        'Этот обзор показывает, что цены и площади отличаются по районам.',
        'Цей огляд показує, що ціни та площі відрізняються залежно від району, роблячи деякі райони більш придатними для довгострокових інвестицій, а інші — для щоденного життя.',
        'Ky përmbledhje tregon se çmimet dhe sipërfaqet ndryshojnë sipas rajoneve, duke i bërë disa zona më të përshtatshme për investime afatgjata dhe disa për jetesë të përditshme.',
        'Questa panoramica mostra che prezzi e metrature variano per zona.',
      ),
      cta: {href: '/catalog?city=tirana', label: Li('Tirana property catalog', 'Каталог Тираны', 'Каталог нерухомості в Тирані', 'Katalogu i pronave në Tiranë', 'Catalogo a Tirana')},
    },
    {
      _type: 'linkedGallerySection',
      enabled: true,
      title: Li(
        'Gallery of main Tirana districts',
        'Галерея основных районов Тираны',
        'Галерея основних районів Тирани',
        'Galeria e lagjeve kryesore të Tiranës',
        'Galleria dei quartieri principali di Tirana',
      ),
      description: Li(
        'Explore key areas visually.',
        'Посмотрите районы визуально.',
        'Перегляньте візуально основні райони та найпопулярніші об’єкти для інвестицій',
        'Shikoni vizualisht lagjet kryesore dhe prona më të kërkuara për investim',
        'Esplora visivamente le zone principali.',
      ),
      items: [],
    },
    {
      _type: 'articlesSection',
      title: Li(
        'Useful articles for buying property in Tirana',
        'Полезные статьи о покупке в Тиране',
        'Корисні статті про купівлю нерухомості в Тирані',
        'Artikuj të dobishëm për blerje pronash në Tiranë',
        'Articoli utili per acquistare a Tirana',
      ),
      subtitle: Li('', '', '', '', ''),
      cta: {href: '/blog', label: Li('View all articles', 'Все статьи', 'Усі статті', 'Shiko të gjithë artikujt', 'Tutti gli articoli')},
      cardCtaLabel: Li('Read more', 'Подробнее', 'Дізнатися більше', 'Lexo më shumë', 'Leggi di più'),
      mode: 'selected',
      posts: [],
    },
    {
      _type: 'faqSection',
      enabled: true,
      title: Li('Frequently asked questions', 'Частые вопросы', 'Питання та відповіді', 'Pyetje të shpeshta', 'Domande frequenti'),
      items: [], // filled in script below
    },
    {
      _type: 'seoTextSection',
      enabled: true,
      content: {
        en: blocksFromText(
          'In 2026, Tirana’s property market remains one of the most dynamic and competitive in the region for buying apartments, houses, and villas. Domlivo helps you explore verified offers with real, up-to-date prices using smart filters by price, size, and property type.',
        ),
        ru: blocksFromText(
          'В 2026 году рынок недвижимости Тираны остаётся одним из самых динамичных и конкурентных в регионе для покупки квартир, домов и вилл. Domlivo помогает быстро находить проверенные предложения с актуальными ценами с помощью фильтров по цене, площади и типу недвижимости.',
        ),
        uk: blocksFromText(`У 2026 році ринок нерухомості в Тирані залишається одним із найдинамічніших і конкурентоспроможних у регіоні для купівлі квартир, будинків і вілл. Тирана, як столиця та економічний центр, пропонує привабливий ринок для місцевих покупців і іноземних інвесторів. Ціни на нові й вторинні об’єкти залежать від району: преміальні райони, як Блок і Лікен Тирани, зазвичай дорожчі за м², тоді як активно розвиваючі райони пропонують доступніші варіанти.

Попит на купівлю нерухомості в Тирані тісно пов’язаний з доступом до сучасної інфраструктури, міським транспортом та широким спектром послуг: шкіл, лікарень і зон відпочинку. Купівля квартири в стратегічних районах може бути чудовою довгостроковою інвестицією як для проживання, так і для здачі в оренду.

Місцевий ринок відзначається стабільністю цін і стійким попитом: багато покупців бачать потенціал зростання вартості нерухомості в найближчі роки. Для інвесторів, які прагнуть отримувати дохід з оренди, найбільш затребувані райони — це центр міста і райони біля університетів.

Domlivo пропонує зручну та прозору платформу для перегляду найкращих пропозицій у Тирані. Усі об’єкти проходять перевірку перед публікацією, щоб гарантувати, що ціни реальні і актуальні. Завдяки розумним фільтрам за ціною, площею та типом нерухомості користувачі швидко знаходять ідеальний об’єкт, який відповідає їх бюджету та цілям.`),
        sq: blocksFromText(`Në vitin 2026, tregu i pronave në Tiranë mbetet një nga më dinamikët dhe konkurruesit në rajon për blerje apartamentesh, shtëpish dhe vilash. Tirana, si kryeqytet dhe qendër ekonomike, ka një treg joshës për blerësit vendas dhe investitorët e huaj. Çmimet për pronat e reja dhe të përdorura ndryshojnë sipas zonës: zonat premium si Blloku dhe Liqeni zakonisht kushtojnë më shumë për m², ndërsa lagjet me zhvillim të shpejtë ofrojnë mundësi më të arsyeshme për blerje.

Kërkesa për blerje pronash në Tiranë lidhet ngushtë me aksesin në infrastrukturë moderne, transport urban dhe shërbime të bollshme si shkolla, spitale dhe zona rekreative. Blerja e një apartamenti në një zonë strategjike mund të jetë një investim i shkëlqyer afatgjatë, si për banim, ashtu edhe për qira afatgjata.

Tregu lokal është karakterizuar nga stabilitet i çmimeve dhe kërkesë e qëndrueshme, me shumë blerës që shohin potencial për rritje të vlerës së pronës në vitet e ardhshme. Për investitorët që synojnë të maksimizojnë të ardhurat nga qiraja, zonat me popullaritet të lartë si qendra e qytetit dhe lagjet pranë universiteteve janë shumë të kërkuara.

Domlivo ofron një platformë të thjeshtë dhe transparente për të eksploruar ofertat më të mira në Tiranë. Të gjitha pronat kontrollohen para publikimit për të siguruar që çmimet janë reale dhe të azhurnuara. Me filtrat inteligjentë sipas çmimit, sipërfaqes, dhe tipit të pronës, përdoruesit mund të gjenden shpejt pronën ideale që i përshtatet buxhetit dhe qëllimeve të tyre.`),
        it: blocksFromText('Nel 2026, il mercato immobiliare di Tirana rimane tra i più dinamici della regione.'),
      },
    },
  ]
}

function buildDurresSections(): any[] {
  // SEO-adapted copy (coherent for Durres), same section structure.
  return [
    {
      _type: 'heroSection',
      enabled: true,
      title: Li(
        'Buy property in Durres — apartments, houses and villas by the sea',
        'Покупка недвижимости в Дурресе — квартиры, дома и виллы у моря',
        'Купівля нерухомості в Дурресі — Квартири, будинки та вілли біля моря',
        'Blerje prona në Durrës — Apartamente, shtëpi dhe vila pranë detit',
        'Acquistare immobili a Durazzo — appartamenti, case e ville vicino al mare',
      ),
      subtitle: Li(
        'Choose verified sale offers with clear pricing and coastal districts',
        'Выбирайте проверенные предложения продажи с понятными ценами и прибрежными районами',
        'Оберіть перевірені пропозиції продажу з прозорими цінами та прибережними районами',
        'Zgjidhni oferta të verifikuara për shitje me çmime të qarta dhe lagje bregdetare',
        'Scegli offerte verificate in vendita con prezzi chiari e zone costiere',
      ),
      search: heroSearchTabsSaleOnly(),
      cta: {href: '/catalog?city=durres', label: Li('Find the best property in Durres', 'Найти лучший объект в Дурресе', 'Знайти найкращий об’єкт у Дурресі', 'Gjej pronën më të mirë në Durrës', 'Trova il miglior immobile a Durazzo')},
      seoTextUnderCta: Li(
        'Popular beachfront offers, updated daily',
        'Популярные предложения у моря — обновляются ежедневно',
        'Популярні пропозиції біля моря — оновлюються щодня',
        'Ofertat më të njohura pranë detit, të azhurnuara çdo ditë',
        'Offerte popolari vicino al mare, aggiornate ogni giorno',
      ),
    },
    {
      _type: 'propertyCarouselSection',
      enabled: true,
      title: Li(
        'Top properties for sale in Durres',
        'Найпопулярніші об’єкти для купівлі в Дурресі',
        'Найпопулярніші об’єкти для купівлі в Дурресі',
        'Objektet më të njohura për blerje në Durrës',
        'Immobili più popolari da acquistare a Durazzo',
      ),
      shortLine: Li(
        'Verified apartments, houses and villas near the coast with real prices',
        'Проверенные предложения у побережья с реальными ценами',
        'Перевірені пропозиції біля узбережжя з реальними цінами',
        'Oferta të verifikuara pranë bregdetit me çmime reale',
        'Offerte verificate vicino alla costa con prezzi reali',
      ),
      cta: {href: '/catalog?city=durres', label: Li('Buy property in Durres', 'Купить в Дурресе', 'Купити нерухомість в Дурресі', 'Bleni pronë në Durrës', 'Acquista a Durazzo')},
      mode: 'auto',
      tabs: [{_type: 'homePropertyCarouselTab', key: 'popular', enabled: true}],
    },
    {
      _type: 'cityRichDescriptionSection',
      enabled: true,
      title: Li('Durres description', 'Описание Дурреса', 'Опис міста', 'Përshkrimi i Durrësit', 'Descrizione di Durazzo'),
      content: Li(
        'Durres is one of Albania’s key coastal cities, combining seaside lifestyle with strong demand for housing and investment property.',
        'Дуррес — один из ключевых прибрежных городов Албании с высоким спросом на жильё и инвестиционные объекты.',
        'Дуррес — один із ключових прибережних міст Албанії з високим попитом на житло та інвестиційну нерухомість.',
        'Durrësi është një nga qytetet kryesore bregdetare në Shqipëri, me kërkesë të lartë për banim dhe investim.',
        'Durazzo è una delle principali città costiere dell’Albania, con forte domanda di immobili residenziali e da investimento.',
      ),
      cta: {href: '/catalog?city=durres', label: Li('View all properties in Durres', 'Смотреть все в Дурресе', 'Переглянути всі об’єкти в Дурресі', 'Shikoni të gjitha pronat në Durrës', 'Vedi tutti a Durazzo')},
    },
    {
      _type: 'districtsComparisonSection',
      enabled: true,
      title: Li(
        'Main Durres areas for buying property',
        'Основные районы Дурреса для покупки недвижимости',
        'Основні райони Дурреса для купівлі нерухомості',
        'Zonat kryesore të Durrësit për blerje prona',
        'Principali zone di Durazzo per acquistare',
      ),
      description: Li(
        'Compare central and seaside areas to match your lifestyle and investment goals.',
        'Сравните центральные и прибрежные районы под ваши цели.',
        'Порівняйте центральні та прибережні райони відповідно до ваших цілей.',
        'Krahasoni zonat qendrore dhe bregdetare sipas qëllimeve tuaja.',
        'Confronta zone centrali e costiere in base ai tuoi obiettivi.',
      ),
      columns: {
        colRegion: Li('Area', 'Район', 'Район', 'Zona', 'Zona'),
        colAvgPrice: Li('Avg price €/m²', 'Ср. цена €/м²', 'Середня ціна €/м²', 'Çmimi mesatar €/m²', 'Prezzo medio €/m²'),
        colAvgArea: Li('Avg area m²', 'Ср. площадь м²', 'Середня площа м²', 'Sipërfaqja mesatare m²', 'Superficie media m²'),
        colPopularity: Li('Popularity', 'Популярность', 'Популярність', 'Popullariteti', 'Popolarità'),
      },
      rows: [
        {region: Li('City center', 'Центр', 'Центр', 'Qendër', 'Centro'), avgPriceEurM2: '1,700 €', avgAreaM2: '80 m²', popularity: Li('High', 'Высокая', 'Висока', 'E lartë', 'Alta')},
        {region: Li('Beachfront', 'Пляж', 'Пляж', 'Plazh', 'Spiaggia'), avgPriceEurM2: '1,900 €', avgAreaM2: '75 m²', popularity: Li('Very high', 'Очень высокая', 'Дуже висока', 'Shumë e lartë', 'Molto alta')},
      ],
      closingText: Li(
        'Durres prices vary by distance to the sea and new-build availability.',
        'Цены в Дурресе зависят от близости к морю и новостроек.',
        'Ціни в Дурресі залежать від близькості до моря та новобудов.',
        'Çmimet në Durrës ndryshojnë sipas afërsisë me detin dhe ndërtimeve të reja.',
        'I prezzi variano in base alla distanza dal mare e alla disponibilità del nuovo.',
      ),
      cta: {href: '/catalog?city=durres', label: Li('Durres property catalog', 'Каталог Дурреса', 'Каталог нерухомості в Дурресі', 'Katalogu i pronave në Durrës', 'Catalogo a Durazzo')},
    },
    {
      _type: 'linkedGallerySection',
      enabled: true,
      title: Li(
        'Gallery of Durres areas',
        'Галерея районов Дурреса',
        'Галерея районів Дурреса',
        'Galeria e zonave të Durrësit',
        'Galleria delle zone di Durazzo',
      ),
      description: Li(
        'Explore popular coastal areas visually.',
        'Посмотрите популярные прибрежные районы.',
        'Перегляньте популярні прибережні райони.',
        'Shikoni zonat bregdetare më të kërkuara.',
        'Esplora visivamente le zone costiere più richieste.',
      ),
      items: [],
    },
    {
      _type: 'articlesSection',
      title: Li(
        'Useful articles for buying property in Durres',
        'Полезные статьи о покупке в Дурресе',
        'Корисні статті про купівлю нерухомості в Дурресі',
        'Artikuj të dobishëm për blerje pronash në Durrës',
        'Articoli utili per acquistare a Durazzo',
      ),
      subtitle: Li('', '', '', '', ''),
      cta: {href: '/blog', label: Li('View all articles', 'Все статьи', 'Усі статті', 'Shiko të gjithë artikujt', 'Tutti gli articoli')},
      cardCtaLabel: Li('Read more', 'Подробнее', 'Дізнатися більше', 'Lexo më shumë', 'Leggi di più'),
      mode: 'selected',
      posts: [],
    },
    {
      _type: 'faqSection',
      enabled: true,
      title: Li('Frequently asked questions', 'Частые вопросы', 'Питання та відповіді', 'Pyetje të shpeshta', 'Domande frequenti'),
      items: [],
    },
    {
      _type: 'seoTextSection',
      enabled: true,
      content: {
        en: blocksFromText(`In 2026, Durres remains one of Albania’s key coastal markets for buying apartments, houses, and villas. Buyers often choose between central neighborhoods for year‑round living and seaside areas for lifestyle and rental potential.

Prices and demand can vary by proximity to the beach, building quality, and access to services. When comparing listings, focus on the exact location, floor plan, view, building maintenance, and legal readiness of the property.

Domlivo helps you explore verified offers in Durres with transparent pricing. Use filters by budget, size, and property type to narrow down options and open the details page to compare photos, area, and location before contacting the seller.`),
        ru: blocksFromText(`В 2026 году Дуррес остаётся одним из ключевых прибрежных рынков Албании для покупки квартир, домов и вилл. Покупатели обычно выбирают между центральными районами для круглогодичного проживания и прибрежными локациями для отдыха и потенциальной аренды.

Цены и спрос зависят от близости к пляжу, качества дома и инфраструктуры. При выборе сравнивайте точную локацию, планировку, вид, состояние здания и юридическую готовность объекта.

Domlivo помогает находить проверенные предложения в Дурресе с прозрачными ценами. Используйте фильтры по бюджету, площади и типу недвижимости, а затем сравнивайте фото, метраж и район в карточке объекта.`),
        uk: blocksFromText(`У 2026 році Дуррес залишається одним із ключових прибережних ринків Албанії для купівлі квартир, будинків і вілл. Покупці часто обирають між центральними районами для життя протягом року та прибережними зонами для відпочинку і потенціалу оренди.

Ціни й попит змінюються залежно від близькості до пляжу, якості будівлі та доступу до сервісів. Порівнюйте точну локацію, планування, вид, стан будинку та юридичну готовність об’єкта.

Domlivo допомагає знаходити перевірені пропозиції в Дурресі з прозорими цінами. Використовуйте фільтри за бюджетом, площею та типом нерухомості, а потім порівнюйте фото, метраж і район у деталях об’єкта.`),
        sq: blocksFromText(`Në vitin 2026, Durrësi mbetet një nga tregjet kryesore bregdetare në Shqipëri për blerje apartamentesh, shtëpish dhe vilash. Blerësit shpesh zgjedhin mes zonave qendrore për jetesë gjatë gjithë vitit dhe zonave pranë plazhit për stil jetese dhe potencial qiraje.

Çmimet dhe kërkesa ndryshojnë sipas afërsisë me detin, cilësisë së ndërtesës dhe aksesit në shërbime. Kur krahasoni oferta, shikoni lokacionin e saktë, planimetrinë, pamjen, mirëmbajtjen e godinës dhe dokumentacionin.

Domlivo ju ndihmon të eksploroni oferta të verifikuara në Durrës me çmime transparente. Përdorni filtrat sipas buxhetit, sipërfaqes dhe tipit të pronës dhe krahasoni fotot, m² dhe zonën në faqen e objektit.`),
        it: blocksFromText(`Nel 2026 Durazzo resta uno dei mercati costieri principali in Albania per acquistare appartamenti, case e ville. Gli acquirenti scelgono spesso tra zone centrali per vivere tutto l’anno e aree sul mare per stile di vita e potenziale di affitto.

Prezzi e domanda variano in base alla distanza dalla spiaggia, alla qualità dell’edificio e ai servizi. Confronta posizione precisa, planimetria, vista, manutenzione e documentazione.

Domlivo ti aiuta a esplorare offerte verificate a Durazzo con prezzi trasparenti. Usa i filtri per budget, metratura e tipologia per trovare e confrontare rapidamente gli immobili.`),
      },
    },
  ]
}

function faqItemsTirana(): any[] {
  const items: Array<{
    qSq: string
    qUk: string
    aSq: string
    aUk: string
    qEn: string
    aEn: string
    qRu: string
    aRu: string
    qIt: string
    aIt: string
  }> = [
    {
      qSq: 'Si të gjej ofertën më të mirë për apartamente në Tiranë në 2026?',
      qUk: 'Як знайти найвигідніші пропозиції квартир у Тирані у 2026 році?',
      aSq: 'Për të gjetur ofertat më të mira, krahasoni çmimet, sipërfaqen dhe rajonet si Qendra, Blloku dhe Tirana e Re duke përdorur filtrat në Domlivo.',
      aUk: 'Щоб знайти найвигідніші пропозиції, порівнюйте ціни, площу та райони, такі як Центр, Блок і Нова Тирана, використовуючи фільтри на Domlivo.',
      qEn: 'How do I find the best apartment deals in Tirana in 2026?',
      aEn: 'Compare prices, size and areas like Center, Blloku and New Tirana using Domlivo filters.',
      qRu: 'Как найти лучшие предложения квартир в Тиране в 2026 году?',
      aRu: 'Сравнивайте цены, площадь и районы (Центр, Блоку, Новая Тирана) с помощью фильтров Domlivo.',
      qIt: 'Come trovare le migliori offerte di appartamenti a Tirana nel 2026?',
      aIt: 'Confronta prezzi, metratura e zone come Centro, Blloku e Nuova Tirana usando i filtri Domlivo.',
    },
    {
      qSq: 'Cilat janë rajonet më të shtrenjta të Tiranës?',
      qUk: 'Які райони Тирани найдорожчі?',
      aSq: 'Rajonet më të shtrenjta janë Qendra dhe Blloku, ku çmimet arrijnë deri në 2,500 €/m² dhe kërkesa mbetet shumë e lartë.',
      aUk: 'Найдорожчі райони — Центр і Блок, де ціни досягають до 2 500 €/м², а попит залишається дуже високим.',
      qEn: 'Which areas of Tirana are the most expensive?',
      aEn: 'Center and Blloku are typically the most expensive areas, reaching up to 2,500 €/m² with very high demand.',
      qRu: 'Какие районы Тираны самые дорогие?',
      aRu: 'Обычно самые дорогие — Центр и Блоку: до 2 500 €/м² при очень высоком спросе.',
      qIt: 'Quali sono le zone più costose di Tirana?',
      aIt: 'Di solito Centro e Blloku sono le zone più costose, fino a 2.500 €/m² con domanda molto alta.',
    },
    {
      qSq: 'A është e favorshme blerja e pronës në Tiranë për investim në 2026?',
      qUk: 'Чи вигідно купувати нерухомість у Тирані для інвестицій у 2026 році?',
      aSq: 'Po, tregu i Tiranës tregon rritje të qëndrueshme dhe kërkesa për qira dhe rivendosje të objekteve mbetet e lartë.',
      aUk: 'Так, ринок Тирани демонструє стабільне зростання, а попит на оренду та перепродаж об’єктів залишається високим.',
      qEn: 'Is buying property in Tirana for investment favorable in 2026?',
      aEn: 'Yes—Tirana shows steady growth and demand for rentals and resales remains high.',
      qRu: 'Выгодно ли покупать недвижимость в Тиране для инвестиций в 2026 году?',
      aRu: 'Да: рынок Тираны стабильно растёт, спрос на аренду и перепродажу остаётся высоким.',
      qIt: 'Conviene acquistare a Tirana per investimento nel 2026?',
      aIt: 'Sì: il mercato mostra crescita stabile e la domanda di affitto e rivendita resta alta.',
    },
    {
      qSq: 'Cilat rajone të Tiranës janë më të përshtatshme për jetesë familjare?',
      qUk: 'Які райони Тирани найбільш підходять для життя сім’єю?',
      aSq: 'Rajonet si Tirana e Re dhe Laprakë ofrojnë shkolla, kopshte dhe akses të mirë në transportin publik.',
      aUk: 'Райони, такі як Нова Тирана та Лапрак, пропонують школи, дитячі садки та хороший доступ до громадського транспорту.',
      qEn: 'Which areas of Tirana are best for family living?',
      aEn: 'Areas like New Tirana and Laprakë offer schools, kindergartens and good public transport access.',
      qRu: 'Какие районы Тираны лучше для семейной жизни?',
      aRu: 'Районы вроде Новой Тираны и Лапраке предлагают школы, детсады и хороший общественный транспорт.',
      qIt: 'Quali zone di Tirana sono più adatte alle famiglie?',
      aIt: 'Zone come Nuova Tirana e Laprakë offrono scuole, asili e buon accesso al trasporto pubblico.',
    },
    {
      qSq: 'Si ndikon afërsia me qendrën dhe detin në çmimin e pronës?',
      qUk: 'Як близькість до центру та моря впливає на ціну об’єкта?',
      aSq: 'Afërsia me qendrën rrit çmimin për shkak të aksesit të lehtë, ndërsa afërsia me detin, sidomos në Bllok dhe Qendër, e bën çmimin më të lartë.',
      aUk: 'Близькість до центру підвищує ціну через легкий доступ, а близькість до моря, особливо в районах Блок і Центр, робить ціни вищими.',
      qEn: 'How does proximity to the center and the sea affect prices?',
      aEn: 'Closer to the center usually means higher prices due to convenience; proximity to the sea can also increase prices in premium areas.',
      qRu: 'Как близость к центру и морю влияет на цену?',
      aRu: 'Близость к центру повышает цену из‑за удобства; близость к морю также может увеличивать стоимость в премиальных районах.',
      qIt: 'Come influisce la vicinanza al centro e al mare sui prezzi?',
      aIt: 'La vicinanza al centro aumenta il prezzo per comodità; anche la vicinanza al mare può far salire i prezzi nelle zone premium.',
    },
    {
      qSq: 'Cilat janë trendet e çmimeve në Tiranë në 2026?',
      qUk: 'Які тенденції цін у Тирані у 2026 році?',
      aSq: 'Pritet që çmimet të rriten 3–5% çdo vit në rajonet kyçe si Qendra, Blloku dhe Tirana e Re.',
      aUk: 'Очікується, що ціни зростатимуть на 3–5% щороку у ключових районах, таких як Центр, Блок і Нова Тирана.',
      qEn: 'What are price trends in Tirana in 2026?',
      aEn: 'Prices are expected to grow about 3–5% per year in key areas like Center, Blloku and New Tirana.',
      qRu: 'Какие ценовые тренды в Тиране в 2026 году?',
      aRu: 'Ожидается рост примерно на 3–5% в год в ключевых районах (Центр, Блоку, Новая Тирана).',
      qIt: 'Quali sono i trend dei prezzi a Tirana nel 2026?',
      aIt: 'Si prevede una crescita del 3–5% annuo nelle zone chiave come Centro, Blloku e Nuova Tirana.',
    },
    {
      qSq: 'Si të kontrolloj nëse çmimi i pronës është real?',
      qUk: 'Як перевірити, чи ціна квартири відповідає ринку?',
      aSq: 'Krahaso ofertat e ngjashme në të njëjtin rajon dhe kontrollo historikun e çmimeve në Domlivo për vlerësim të saktë.',
      aUk: 'Порівняйте схожі пропозиції в тому ж районі та перевірте історію цін на Domlivo для точної оцінки.',
      qEn: 'How can I check if a property price is realistic?',
      aEn: 'Compare similar listings in the same area and review price history on Domlivo for a clearer estimate.',
      qRu: 'Как проверить, что цена соответствует рынку?',
      aRu: 'Сравните похожие предложения в том же районе и проверьте историю цен на Domlivo.',
      qIt: 'Come verificare se il prezzo è realistico?',
      aIt: 'Confronta annunci simili nella stessa zona e controlla lo storico prezzi su Domlivo.',
    },
    {
      qSq: 'A mund të blej pronë në Tiranë pa ndërmjetës?',
      qUk: 'Чи можна купити нерухомість у Тирані без посередників?',
      aSq: 'Po, shumë oferta ofrojnë kontakt direkt me pronarin duke shmangur komisionin e agjentëve.',
      aUk: 'Так, багато пропозицій дозволяють зв’язок безпосередньо з власником, уникаючи комісії агенцій.',
      qEn: 'Can I buy property in Tirana without intermediaries?',
      aEn: 'Yes—many listings allow direct contact with the owner, avoiding agency commission.',
      qRu: 'Можно ли купить в Тиране без посредников?',
      aRu: 'Да, многие объявления дают прямой контакт с владельцем, без комиссии агентств.',
      qIt: 'Posso acquistare a Tirana senza intermediari?',
      aIt: 'Sì: molti annunci permettono il contatto diretto con il proprietario, evitando commissioni.',
    },
    {
      qSq: 'Çfarë dokumentesh nevojiten për blerjen e pronës në Tiranë?',
      qUk: 'Які документи потрібні для купівлі нерухомості у Тирані?',
      aSq: 'Kontratat noteriale, certifikatat e pronësisë dhe dokumentet e verifikuara nga autoritetet shqiptare.',
      aUk: 'Нотаріальні договори, сертифікати власності та перевірені документи від албанських органів влади.',
      qEn: 'What documents are needed to buy property in Tirana?',
      aEn: 'Notarial contracts, ownership certificates, and documents verified by Albanian authorities.',
      qRu: 'Какие документы нужны для покупки в Тиране?',
      aRu: 'Нотариальные договоры, свидетельства собственности и документы, проверенные албанскими органами.',
      qIt: 'Quali documenti servono per acquistare a Tirana?',
      aIt: 'Contratti notarili, certificati di proprietà e documenti verificati dalle autorità albanesi.',
    },
    {
      qSq: 'Cilat apartamente janë më të kërkuara në Tiranë?',
      qUk: 'Які квартири найбільш популярні у Тирані?',
      aSq: 'Më të kërkuarat janë apartamentet 2–3 dhomëshe në Bllok dhe Qendër, me sipërfaqe 75–85 m², të pëlqyera nga blerës vendas dhe të huaj.',
      aUk: 'Найпопулярніші — 2–3-кімнатні квартири в районах Блок і Центр, площею 75–85 м², серед місцевих та іноземних покупців.',
      qEn: 'Which apartments are most in demand in Tirana?',
      aEn: '2–3 bedroom apartments in Blloku and Center, around 75–85 m², are among the most sought-after.',
      qRu: 'Какие квартиры наиболее востребованы в Тиране?',
      aRu: 'Чаще всего ищут 2–3‑комнатные в Блоку и Центре, 75–85 м².',
      qIt: 'Quali appartamenti sono più richiesti a Tirana?',
      aIt: 'I più richiesti sono i 2–3 locali in Blloku e Centro, circa 75–85 m².',
    },
    {
      qSq: 'A mund të marr fitim nga qiraja e pronës në Tiranë?',
      qUk: 'Чи можна отримати дохід від оренди нерухомості у Тирані?',
      aSq: 'Po, rajonet Tirana e Re dhe Laprakë ofrojnë fitim të mirë nga qiraja, me rentabilitet mesatar 5–7% në vit.',
      aUk: 'Так, райони Нова Тирана та Лапрак забезпечують хороший дохід від оренди, середня рентабельність 5–7% на рік.',
      qEn: 'Can I earn income from renting out property in Tirana?',
      aEn: 'Yes—areas like New Tirana and Laprakë can offer solid rental returns, often around 5–7% per year.',
      qRu: 'Можно ли получать доход от аренды в Тиране?',
      aRu: 'Да, районы Новая Тирана и Лапраке часто дают хорошую доходность, в среднем 5–7% в год.',
      qIt: 'Si può guadagnare dall’affitto a Tirana?',
      aIt: 'Sì: zone come Nuova Tirana e Laprakë possono offrire buoni rendimenti, circa 5–7% annui.',
    },
    {
      qSq: 'Si të zgjedh një rajon me infrastrukturë të mirë?',
      qUk: 'Як обрати район з кращою інфраструктурою?',
      aSq: 'Vlerësoni transportin publik, shkollat, qendrat tregtare dhe parkun pranë pronës për një zgjedhje të mençur.',
      aUk: 'Оцінюйте громадський транспорт, школи, торгові центри та парки поруч з об’єктом для розумного вибору.',
      qEn: 'How do I choose an area with good infrastructure?',
      aEn: 'Check public transport, schools, shopping centers, and parks near the property.',
      qRu: 'Как выбрать район с хорошей инфраструктурой?',
      aRu: 'Оцените транспорт, школы, ТЦ и парки рядом с объектом.',
      qIt: 'Come scegliere una zona con buona infrastruttura?',
      aIt: 'Valuta trasporti, scuole, centri commerciali e parchi vicino all’immobile.',
    },
    {
      qSq: 'Cilat janë përfitimet e blerjes së një shtëpie në Tiranë në 2026?',
      qUk: 'Які переваги купівлі будинку в Тирані у 2026 році?',
      aSq: 'Investimi në Tiranë garanton likuiditet të lartë, mundësi qiraje dhe rritje të çmimit të pronës.',
      aUk: 'Інвестування у Тирану гарантує високу ліквідність, можливість здачі в оренду та зростання цін на ринку нерухомості.',
      qEn: 'What are the benefits of buying a house in Tirana in 2026?',
      aEn: 'High liquidity, rental potential, and the possibility of property value growth.',
      qRu: 'Какие преимущества покупки дома в Тиране в 2026?',
      aRu: 'Высокая ликвидность, потенциал аренды и рост стоимости.',
      qIt: 'Quali vantaggi ha acquistare una casa a Tirana nel 2026?',
      aIt: 'Alta liquidità, possibilità di affitto e crescita del valore dell’immobile.',
    },
    {
      qSq: 'A ka ndryshime të mëdha midis rajoneve sipas çmimit dhe popullaritetit?',
      qUk: 'Чи є великі відмінності між районами за ціною та популярністю?',
      aSq: 'Po, Qendra dhe Blloku janë shumë të shtrenjta dhe të popullarizuara, ndërsa Yzberisht dhe Kombinat kanë çmime më të ulëta dhe kërkesë më të vogël.',
      aUk: 'Так, Центр і Блок дуже дорогі та популярні, а Ізберішт і Комбінат мають нижчі ціни та менший попит.',
      qEn: 'Are there big differences between areas in price and popularity?',
      aEn: 'Yes—Center and Blloku are expensive and very popular, while Yzberisht and Kombinat are cheaper with lower demand.',
      qRu: 'Есть ли большие различия между районами по цене и популярности?',
      aRu: 'Да: Центр и Блоку дороже и популярнее, а Изберишт и Комбинат дешевле и менее востребованы.',
      qIt: 'Ci sono grandi differenze tra le zone per prezzo e popolarità?',
      aIt: 'Sì: Centro e Blloku sono più cari e richiesti; Yzberisht e Kombinat sono più economici e meno richiesti.',
    },
    {
      qSq: 'Si ndikon zhvillimi i qytetit në çmimin e pronës?',
      qUk: 'Як розвиток міста впливає на ціну нерухомості?',
      aSq: 'Projektet e reja infrastrukturore dhe ndërtesat moderne rrisin çmimin dhe popullaritetin e rajoneve si Tirana e Re dhe Laprakë.',
      aUk: 'Нові інфраструктурні проекти та сучасні будівлі підвищують ціну та популярність районів, таких як Нова Тирана і Лапрак.',
      qEn: 'How does city development affect property prices?',
      aEn: 'New infrastructure projects and modern buildings can increase prices and popularity in areas like New Tirana and Laprakë.',
      qRu: 'Как развитие города влияет на цены?',
      aRu: 'Новые инфраструктурные проекты и современные здания повышают цены и популярность районов, таких как Новая Тирана и Лапраке.',
      qIt: 'Come influisce lo sviluppo della città sui prezzi?',
      aIt: 'Nuovi progetti infrastrutturali e edifici moderni aumentano prezzo e popolarità di zone come Nuova Tirana e Laprakë.',
    },
    {
      qSq: 'Cilat vila janë më të kërkuara në Tiranë?',
      qUk: 'Які вілли найбільш популярні у Тирані?',
      aSq: 'Vilat private në rajonet qendrore dhe periferike, shpesh me oborr dhe pishinë, tërheqin blerës vendas dhe të huaj.',
      aUk: 'Приватні вілли в центральних та периферійних районах, часто з подвір’ям і басейном, приваблюють місцевих та іноземних покупців.',
      qEn: 'Which villas are most in demand in Tirana?',
      aEn: 'Private villas in central and suburban areas, often with a yard and pool, attract both local and international buyers.',
      qRu: 'Какие виллы наиболее востребованы в Тиране?',
      aRu: 'Частные виллы в центральных и пригородных районах, часто с двором и бассейном, популярны у местных и иностранных покупателей.',
      qIt: 'Quali ville sono più richieste a Tirana?',
      aIt: 'Le ville private in zone centrali e periferiche, spesso con giardino e piscina, sono molto richieste.',
    },
    {
      qSq: 'A mund të marr këshilla profesionale për blerjen e pronës?',
      qUk: 'Чи можна отримати професійну консультацію для купівлі нерухомості?',
      aSq: 'Po, Domlivo ofron qasje te agjentë ekspertë për këshilla mbi blerjen e apartamenteve, shtëpive dhe vilave në Tiranë.',
      aUk: 'Так, Domlivo надає доступ до експертних агентів для консультацій щодо купівлі квартир, будинків та вілл у Тирані.',
      qEn: 'Can I get professional advice for buying property?',
      aEn: 'Yes—Domlivo provides access to expert agents for guidance on buying in Tirana.',
      qRu: 'Можно ли получить профессиональную консультацию?',
      aRu: 'Да, Domlivo даёт доступ к экспертным агентам по покупке в Тиране.',
      qIt: 'Posso ricevere una consulenza professionale?',
      aIt: 'Sì: Domlivo offre accesso ad agenti esperti per consigli sull’acquisto a Tirana.',
    },
    {
      qSq: 'Si të krahasoj çmimet për të zgjedhur ofertën më të mirë?',
      qUk: 'Як можна порівняти ціни, щоб вибрати найкращу пропозицію?',
      aSq: 'Përdorni filtrat në Domlivo sipas çmimit, sipërfaqes dhe rajonit dhe kontrolloni historikun e shitjeve për zgjedhje të sigurt.',
      aUk: 'Використовуйте фільтри на Domlivo за ціною, площею та районом, а також перевіряйте історію продажів для безпечного вибору.',
      qEn: 'How can I compare prices to choose the best offer?',
      aEn: 'Use Domlivo filters by price, size and area, and review sales history for a safer choice.',
      qRu: 'Как сравнить цены, чтобы выбрать лучшее предложение?',
      aRu: 'Используйте фильтры Domlivo по цене, площади и району и проверяйте историю продаж.',
      qIt: 'Come confrontare i prezzi per scegliere l’offerta migliore?',
      aIt: 'Usa i filtri Domlivo per prezzo, metratura e zona e controlla lo storico vendite.',
    },
  ]
  return items.map((it, idx) => ({
    _type: 'localizedFaqItemRich',
    _key: `faq-${idx}-${Math.random().toString(16).slice(2, 8)}`,
    question: Li(it.qEn, it.qRu, it.qUk, it.qSq, it.qIt),
    answer: {
      en: blocksFromText(it.aEn),
      ru: blocksFromText(it.aRu),
      uk: blocksFromText(it.aUk),
      sq: blocksFromText(it.aSq),
      it: blocksFromText(it.aIt),
    },
  }))
}

function faqItemsDurres(): any[] {
  const items: Array<{
    qSq: string
    qUk: string
    aSq: string
    aUk: string
    qEn: string
    aEn: string
    qRu: string
    aRu: string
    qIt: string
    aIt: string
  }> = [
    {
      qSq: 'Si të zgjedh një zonë në Durrës për blerje në 2026?',
      qUk: 'Як обрати район у Дурресі для покупки у 2026 році?',
      aSq: 'Krahasoni zonat qendrore me ato pranë plazhit sipas qëllimit: jetesë gjatë gjithë vitit ose investim për qira. Përdorni filtrat në Domlivo për çmim, sipërfaqe dhe tip prone.',
      aUk: 'Порівняйте центральні райони та прибережні зони залежно від мети: проживання протягом року чи інвестиції під оренду. Використовуйте фільтри Domlivo за ціною, площею та типом нерухомості.',
      qEn: 'How do I choose an area in Durres to buy in 2026?',
      aEn: 'Compare central neighborhoods vs seaside areas based on your goal—year‑round living or rental investment. Use Domlivo filters for price, size, and property type.',
      qRu: 'Как выбрать район в Дурресе для покупки в 2026?',
      aRu: 'Сравните центр и прибрежные зоны под цель: проживание круглый год или инвестиции под аренду. Используйте фильтры Domlivo по цене, площади и типу жилья.',
      qIt: 'Come scegliere una zona a Durazzo per acquistare nel 2026?',
      aIt: 'Confronta quartieri centrali e aree sul mare in base all’obiettivo: vivere tutto l’anno o investire per affitto. Usa i filtri Domlivo per prezzo, metratura e tipologia.',
    },
    {
      qSq: 'A është më mirë të blej afër plazhit apo në qendër të Durrësit?',
      qUk: 'Краще купувати біля пляжу чи в центрі Дурреса?',
      aSq: 'Afër plazhit kërkesa për sezonin është më e lartë, ndërsa qendra është më praktike për jetesë të përditshme. Zgjidhni sipas stilit të jetës dhe planit të përdorimit.',
      aUk: 'Біля пляжу сезонний попит зазвичай вищий, тоді як центр зручніший для щоденного життя. Обирайте відповідно до стилю життя та плану використання.',
      qEn: 'Is it better to buy near the beach or in Durres city center?',
      aEn: 'Beach areas can have stronger seasonal demand, while the center is often more practical for everyday living. Choose based on lifestyle and usage plan.',
      qRu: 'Что лучше: купить у пляжа или в центре Дурреса?',
      aRu: 'У моря часто сильнее сезонный спрос, а центр удобнее для повседневной жизни. Выбирайте под ваш сценарий использования.',
      qIt: 'È meglio acquistare vicino alla spiaggia o in centro a Durazzo?',
      aIt: 'Le zone sul mare possono avere domanda stagionale più alta, mentre il centro è più pratico per la vita quotidiana. Scegli in base alle tue esigenze.',
    },
    {
      qSq: 'Si të kontrolloj dokumentet për një pronë në Durrës?',
      qUk: 'Як перевірити документи на нерухомість у Дурресі?',
      aSq: 'Sigurohuni për certifikatën e pronësisë, statusin e legalizimit dhe përputhjen e planimetrisë. Nëse keni dyshime, kërkoni ndihmë profesionale para nënshkrimit.',
      aUk: 'Перевірте сертифікат власності, статус легалізації та відповідність планування. За потреби залучіть фахівця перед підписанням.',
      qEn: 'How do I verify property documents in Durres?',
      aEn: 'Confirm ownership certificate, legalization status, and that the floor plan matches the actual unit. If unsure, get professional help before signing.',
      qRu: 'Как проверить документы на недвижимость в Дурресе?',
      aRu: 'Проверьте свидетельство собственности, статус легализации и соответствие планировки. При сомнениях привлеките специалиста до сделки.',
      qIt: 'Come verificare i documenti di un immobile a Durazzo?',
      aIt: 'Verifica certificato di proprietà, stato di legalizzazione e corrispondenza della planimetria. Se hai dubbi, chiedi supporto professionale.',
    },
    {
      qSq: 'Cilat lloje pronash kërkohen më shumë në Durrës?',
      qUk: 'Які типи нерухомості найпопулярніші в Дурресі?',
      aSq: 'Apartamentet 1–2 dhomëshe pranë plazhit dhe banesat praktike në zonat qendrore janë ndër më të kërkuarat, sepse përshtaten si për jetesë ashtu edhe për qira.',
      aUk: '1–2-кімнатні квартири біля пляжу та практичне житло в центральних районах часто найзатребуваніші, бо підходять і для життя, і для оренди.',
      qEn: 'Which property types are most in demand in Durres?',
      aEn: 'Compact 1–2 bedroom apartments near the beach and practical central units are often in demand for both living and rentals.',
      qRu: 'Какие типы недвижимости наиболее востребованы в Дурресе?',
      aRu: 'Часто востребованы компактные 1–2‑спальные у моря и практичные варианты в центре — под проживание и аренду.',
      qIt: 'Quali tipologie sono più richieste a Durazzo?',
      aIt: 'Spesso sono richiesti appartamenti compatti 1–2 camere vicino al mare e unità pratiche in centro, adatte a vivere e affittare.',
    },
    {
      qSq: 'A ka kuptim investimi për qira në Durrës në 2026?',
      qUk: 'Чи має сенс інвестувати під оренду в Дурресі у 2026 році?',
      aSq: 'Po, sidomos për prona pranë detit dhe me akses të mirë. Vlerësoni sezonalitetin dhe kostot e mirëmbajtjes para se të vendosni.',
      aUk: 'Так, особливо для об’єктів біля моря та з хорошим доступом. Враховуйте сезонність і витрати на утримання.',
      qEn: 'Does rental investment in Durres make sense in 2026?',
      aEn: 'Yes—especially for properties near the sea with good access. Consider seasonality and maintenance costs before deciding.',
      qRu: 'Есть ли смысл инвестировать под аренду в Дурресе в 2026?',
      aRu: 'Да, особенно у моря и с хорошей доступностью. Учитывайте сезонность и расходы на обслуживание.',
      qIt: 'Ha senso investire per affitto a Durazzo nel 2026?',
      aIt: 'Sì, soprattutto vicino al mare e con buon accesso. Considera stagionalità e costi di manutenzione.',
    },
    {
      qSq: 'Si të gjej ofertat më të mira të shitjes në Durrës?',
      qUk: 'Як знайти найкращі пропозиції продажу в Дурресі?',
      aSq: 'Përdorni filtrat për zonë, buxhet dhe tip prone dhe krahasoni oferta të ngjashme. Shikoni fotot, m² dhe lokacionin e saktë në faqen e objektit.',
      aUk: 'Використовуйте фільтри за районом, бюджетом і типом, та порівнюйте схожі пропозиції. Перевіряйте фото, м² і точну локацію в деталях об’єкта.',
      qEn: 'How do I find the best sale offers in Durres?',
      aEn: 'Use filters for area, budget and type, then compare similar listings. Check photos, m², and exact location in the property details.',
      qRu: 'Как найти лучшие предложения продажи в Дурресе?',
      aRu: 'Фильтруйте по району, бюджету и типу, затем сравнивайте похожие объекты. Смотрите фото, метраж и локацию в карточке.',
      qIt: 'Come trovare le migliori offerte in vendita a Durazzo?',
      aIt: 'Usa filtri per zona, budget e tipologia e confronta annunci simili. Controlla foto, m² e posizione nella scheda immobile.',
    },
    {
      qSq: 'Cilat faktorë ndikojnë më shumë në çmimet pranë plazhit?',
      qUk: 'Які фактори найбільше впливають на ціни біля пляжу?',
      aSq: 'Distanca nga deti, pamja, cilësia e ndërtesës, parkimi dhe shërbimet përreth. Edhe sezoni mund të ndikojë në kërkesë.',
      aUk: 'Відстань до моря, вид, якість будинку, паркування та сервіси поруч. Сезонність також впливає на попит.',
      qEn: 'What affects prices near the beach the most?',
      aEn: 'Distance to the sea, view, building quality, parking, and nearby services. Seasonality can also influence demand.',
      qRu: 'Что сильнее всего влияет на цены у моря?',
      aRu: 'Расстояние до моря, вид, качество дома, парковка и инфраструктура. Также влияет сезонность спроса.',
      qIt: 'Cosa incide di più sui prezzi vicino alla spiaggia?',
      aIt: 'Distanza dal mare, vista, qualità dell’edificio, parcheggio e servizi. Anche la stagionalità influisce sulla domanda.',
    },
    {
      qSq: 'A është e mundur të blej pronë pa ndërmjetës në Durrës?',
      qUk: 'Чи можна купити нерухомість у Дурресі без посередників?',
      aSq: 'Po, disa oferta lejojnë kontakt direkt me pronarin. Gjithsesi, kontrolloni dokumentacionin me kujdes para marrëveshjes.',
      aUk: 'Так, деякі пропозиції дозволяють прямий контакт із власником. Водночас уважно перевіряйте документи перед угодою.',
      qEn: 'Can I buy property in Durres without intermediaries?',
      aEn: 'Yes—some listings allow direct owner contact. Still, verify documents carefully before the deal.',
      qRu: 'Можно ли купить в Дурресе без посредников?',
      aRu: 'Да, некоторые предложения дают прямой контакт с владельцем. Но документы всё равно нужно тщательно проверить.',
      qIt: 'Posso acquistare a Durazzo senza intermediari?',
      aIt: 'Sì: alcuni annunci permettono contatto diretto con il proprietario. Verifica comunque i documenti con attenzione.',
    },
    {
      qSq: 'Si të vlerësoj nëse çmimi është i arsyeshëm?',
      qUk: 'Як оцінити, чи ціна є справедливою?',
      aSq: 'Krahasoni prona të ngjashme në të njëjtën zonë dhe me të njëjtat parametra (m², kat, pamje). Kontrolloni edhe gjendjen e ndërtesës.',
      aUk: 'Порівняйте схожі об’єкти в тому ж районі з такими ж параметрами (м², поверх, вид). Враховуйте стан будинку.',
      qEn: 'How do I assess if the price is fair?',
      aEn: 'Compare similar homes in the same area with the same parameters (m², floor, view) and consider building condition.',
      qRu: 'Как понять, справедлива ли цена?',
      aRu: 'Сравните похожие объекты в том же районе с теми же параметрами (м², этаж, вид) и учтите состояние дома.',
      qIt: 'Come valutare se il prezzo è corretto?',
      aIt: 'Confronta immobili simili nella stessa zona con parametri uguali (m², piano, vista) e considera lo stato dell’edificio.',
    },
    {
      qSq: 'Çfarë duhet të shikoj në një apartament për investim?',
      qUk: 'На що звернути увагу в квартирі для інвестицій?',
      aSq: 'Lokacioni, aksesueshmëria, planimetria, kostot e mirëmbajtjes dhe potenciali për qira. Për Durrës, konsideroni edhe sezonalitetin pranë detit.',
      aUk: 'Локацію, доступність, планування, витрати на утримання та потенціал оренди. У Дурресі враховуйте сезонність біля моря.',
      qEn: 'What should I check in an apartment for investment?',
      aEn: 'Location, access, layout, maintenance costs, and rental potential. In Durres, consider seaside seasonality.',
      qRu: 'Что важно для инвестиционной квартиры?',
      aRu: 'Локация, доступность, планировка, расходы на обслуживание и потенциал аренды. В Дурресе важна сезонность у моря.',
      qIt: 'Cosa controllare per un appartamento da investimento?',
      aIt: 'Posizione, accesso, layout, costi di gestione e potenziale d’affitto. A Durazzo considera anche la stagionalità sul mare.',
    },
    {
      qSq: 'A ka dallim të madh mes ndërtimeve të reja dhe të përdorura?',
      qUk: 'Чи є велика різниця між новобудовами та вторинним житлом?',
      aSq: 'Ndërtimet e reja shpesh ofrojnë standarde më të larta dhe eficiencë, ndërsa të përdorurat mund të kenë çmime më fleksibile. Varet nga lokacioni dhe gjendja.',
      aUk: 'Новобудови часто мають вищі стандарти та енергоефективність, а вторинне житло може бути гнучкішим за ціною. Все залежить від району та стану.',
      qEn: 'Is there a big difference between new builds and resale homes?',
      aEn: 'New builds can offer higher standards and efficiency, while resale homes may have more flexible pricing. It depends on area and condition.',
      qRu: 'Есть ли большая разница между новостройками и вторичкой?',
      aRu: 'Новостройки часто дают более высокий стандарт и эффективность, а вторичка может быть гибче по цене. Всё зависит от района и состояния.',
      qIt: 'C’è una grande differenza tra nuovo e usato?',
      aIt: 'Il nuovo può offrire standard più alti, mentre l’usato può avere prezzi più flessibili. Dipende da zona e stato.',
    },
    {
      qSq: 'Si të filloj kërkimin e pronës në Durrës me Domlivo?',
      qUk: 'Як почати пошук нерухомості в Дурресі на Domlivo?',
      aSq: 'Zgjidhni kategorinë (p.sh. shitje), vendosni qytetin Durrës dhe përdorni filtrat për buxhet, m² dhe tip prone. Ruani ofertat dhe krahasoni detajet.',
      aUk: 'Оберіть категорію (наприклад, продаж), вкажіть місто Дуррес і використовуйте фільтри за бюджетом, м² та типом. Зберігайте й порівнюйте пропозиції.',
      qEn: 'How do I start searching for property in Durres on Domlivo?',
      aEn: 'Choose a category (e.g., sale), set city to Durres, and use filters for budget, m² and type. Save listings and compare details.',
      qRu: 'Как начать поиск в Дурресе на Domlivo?',
      aRu: 'Выберите категорию (например, продажа), укажите город Дуррес и примените фильтры по бюджету, м² и типу. Сохраняйте и сравнивайте предложения.',
      qIt: 'Come iniziare la ricerca a Durazzo su Domlivo?',
      aIt: 'Scegli una categoria (es. vendita), imposta la città su Durazzo e usa filtri per budget, m² e tipologia. Salva e confronta gli annunci.',
    },
  ]

  return items.map((it, idx) => ({
    _type: 'localizedFaqItemRich',
    _key: `durres-faq-${idx}-${Math.random().toString(16).slice(2, 8)}`,
    question: Li(it.qEn, it.qRu, it.qUk, it.qSq, it.qIt),
    answer: {
      en: blocksFromText(it.aEn),
      ru: blocksFromText(it.aRu),
      uk: blocksFromText(it.aUk),
      sq: blocksFromText(it.aSq),
      it: blocksFromText(it.aIt),
    },
  }))
}

async function run() {
  console.log('--- Seed city landings (Tirana, Durres) ---\n')
  console.log(`Project: ${projectId}`)
  console.log(`Dataset: ${dataset}`)
  console.log(`Mode: ${isDry ? 'DRY' : 'EXECUTE'}\n`)

  const tirana = await ensureCityBySlug('tirana')
  const durres = await ensureCityBySlug('durres')

  // Ensure blog posts for Tirana useful articles
  const postIds = [
    await ensureBlogPost(
      'blog-tirana-investment-area-2026',
      Li(
        'How to choose a district in Tirana for investment in 2026',
        'Как выбрать район Тираны для инвестиций в 2026',
        'Як обрати район у Тирані для інвестицій 2026',
        'Si të zgjidhni rajonin në Tiranë për investim në 2026',
        'Come scegliere la zona di Tirana per investire nel 2026',
      ),
    ),
    await ensureBlogPost(
      'blog-tirana-apartment-prices-2026',
      Li(
        'Apartment prices in Tirana 2026: comparing areas',
        'Цены на квартиры в Тиране 2026: сравнение районов',
        'Ціни на квартири у Тирані 2026: порівняння районів',
        'Çmimet e apartamenteve në Tiranë 2026: krahasimi i rajoneve',
        'Prezzi degli appartamenti a Tirana 2026: confronto delle zone',
      ),
    ),
    await ensureBlogPost(
      'blog-tirana-buy-without-agent',
      Li(
        'Tips for buying property in Tirana without intermediaries',
        'Советы по покупке недвижимости в Тиране без посредников',
        'Поради для покупки нерухомості в Тирані без посередників',
        'Këshilla për blerjen e pronës në Tiranë pa ndërmjetës',
        'Consigli per acquistare a Tirana senza intermediari',
      ),
    ),
    await ensureBlogPost(
      'blog-tirana-popular-apartments-villas',
      Li(
        'Popular apartments and villas in Tirana',
        'Популярные квартиры и виллы в Тиране',
        'Топ популярних квартир та вілл у Тирані',
        'Apartamentet dhe vilat më të njohura në Tiranë',
        'Appartamenti e ville più richiesti a Tirana',
      ),
    ),
  ]

  const tiranaSections = buildTiranaSections()
  const faq = faqItemsTirana()
  // inject FAQ + posts
  const faqIdx = tiranaSections.findIndex((s) => s._type === 'faqSection')
  if (faqIdx >= 0) tiranaSections[faqIdx].items = faq
  const blogIdx = tiranaSections.findIndex((s) => s._type === 'articlesSection')
  if (blogIdx >= 0) tiranaSections[blogIdx].posts = postIds.map((id) => ({_type: 'reference', _ref: id}))

  // Gallery items (execute only): use real district slugs when available, else fall back to city catalog.
  if (isExecute) {
    const tiranaDistrictSlugs = await fetchDistrictSlugsForCity(tirana._id)
    const durresDistrictSlugs = await fetchDistrictSlugsForCity(durres._id)

    const makeGalleryItems = async (citySlug: string, districtSlugs: string[], seedPrefix: string) => {
      const base = (districtSlugs.length ? districtSlugs : []).slice(0, 10)
      const targets =
        base.length >= 10
          ? base
          : [...base, ...Array.from({length: 10 - base.length}).map((_, i) => `area-${i + 1}`)]

      const assets = await Promise.all(targets.map((t, i) => uploadPlaceholderImage(`${seedPrefix}-${t}-${i}`)))
      return targets.map((t, i) => ({
        _type: 'object',
        image: img(assets[i], `${citySlug} ${t}`),
        href: districtSlugs.length ? `/catalog?city=${citySlug}&district=${t}` : `/catalog?city=${citySlug}`,
      }))
    }

    const tiranaGalleryIdx = tiranaSections.findIndex((s) => s._type === 'linkedGallerySection')
    if (tiranaGalleryIdx >= 0) {
      tiranaSections[tiranaGalleryIdx].items = await makeGalleryItems('tirana', tiranaDistrictSlugs, 'tirana')
    }
  }

  const durresSections = buildDurresSections()
  // Ensure blog posts for Durres useful articles (parity with Tirana)
  const durresPostIds = [
    await ensureBlogPost(
      'blog-durres-choose-area-2026',
      Li(
        'How to choose an area in Durres to buy in 2026',
        'Как выбрать район в Дурресе для покупки в 2026',
        'Як обрати район у Дурресі для покупки у 2026',
        'Si të zgjidhni zonën në Durrës për blerje në 2026',
        'Come scegliere una zona a Durazzo per acquistare nel 2026',
      ),
    ),
    await ensureBlogPost(
      'blog-durres-beach-vs-center',
      Li(
        'Durres: beach area vs city center — what to choose',
        'Дуррес: у моря или в центре — что выбрать',
        'Дуррес: біля моря чи в центрі — що обрати',
        'Durrës: pranë plazhit apo në qendër — çfarë të zgjidhni',
        'Durazzo: mare o centro — cosa scegliere',
      ),
    ),
    await ensureBlogPost(
      'blog-durres-rental-investment-2026',
      Li(
        'Rental investment in Durres in 2026: key checks',
        'Инвестиции под аренду в Дурресе в 2026: что проверить',
        'Інвестиції під оренду в Дурресі у 2026: що перевірити',
        'Investim për qira në Durrës në 2026: çfarë të kontrolloni',
        'Investimento in affitto a Durazzo nel 2026: cosa controllare',
      ),
    ),
    await ensureBlogPost(
      'blog-durres-documents-checklist',
      Li(
        'Documents checklist for buying property in Durres',
        'Чек-лист документов для покупки в Дурресе',
        'Чек-лист документів для покупки в Дурресі',
        'Lista e dokumenteve për blerje prone në Durrës',
        'Checklist documenti per acquistare a Durazzo',
      ),
    ),
  ]

  // inject Durres FAQ + posts
  const durresFaqIdx = durresSections.findIndex((s) => s._type === 'faqSection')
  if (durresFaqIdx >= 0) durresSections[durresFaqIdx].items = faqItemsDurres()
  const durresBlogIdx = durresSections.findIndex((s) => s._type === 'articlesSection')
  if (durresBlogIdx >= 0) {
    durresSections[durresBlogIdx].posts = durresPostIds.map((id) => ({_type: 'reference', _ref: id}))
  }

  if (isExecute) {
    const durresDistrictSlugs = await fetchDistrictSlugsForCity(durres._id)
    const durresGalleryIdx = durresSections.findIndex((s) => s._type === 'linkedGallerySection')
    if (durresGalleryIdx >= 0) {
      const base = (durresDistrictSlugs.length ? durresDistrictSlugs.slice(0, 10) : [])
      const targets =
        base.length >= 10 ? base : [...base, ...Array.from({length: 10 - base.length}).map((_, i) => `area-${i + 1}`)]
      const assets = await Promise.all(targets.map((t, i) => uploadPlaceholderImage(`durres-${t}-${i}`)))
      durresSections[durresGalleryIdx].items = targets.map((t, i) => ({
        _type: 'object',
        image: img(assets[i], `durres ${t}`),
        href: durresDistrictSlugs.length ? `/catalog?city=durres&district=${t}` : `/catalog?city=durres`,
      }))
    }
  }

  const tiranaDoc = {
    _id: 'landing-tirana',
    _type: 'landingPage',
    pageType: 'city',
    enabled: true,
    title: Li('Tirana', 'Тирана', 'Тирана', 'Tiranë', 'Tirana'),
    slug: {current: 'tirana'},
    linkedCity: {_type: 'reference', _ref: tirana._id},
    pageSections: tiranaSections,
    seo: {
      metaTitle: Li('Buy property in Tirana | Domlivo', 'Купить в Тиране | Domlivo', 'Купівля в Тирані | Domlivo', 'Blerje prona në Tiranë | Domlivo', 'Acquisto a Tirana | Domlivo'),
      metaDescription: Li('Verified apartments, houses and villas for sale in Tirana.', 'Проверенные квартиры, дома и виллы в Тиране.', 'Перевірені квартири, будинки та вілли в Тирані.', 'Apartamente, shtëpi dhe vila të verifikuara në Tiranë.', 'Appartamenti, case e ville verificati a Tirana.'),
      ogTitle: Li('Buy property in Tirana | Domlivo', 'Купить в Тиране | Domlivo', 'Купівля в Тирані | Domlivo', 'Blerje prona në Tiranë | Domlivo', 'Acquisto a Tirana | Domlivo'),
      ogDescription: Li('Top offers updated daily.', 'Топ предложения каждый день.', 'Топ пропозиції щодня.', 'Ofertat më të mira çdo ditë.', 'Migliori offerte ogni giorno.'),
      noIndex: false,
    },
  }

  const durresDoc = {
    _id: 'landing-durres',
    _type: 'landingPage',
    pageType: 'city',
    enabled: true,
    title: Li('Durres', 'Дуррес', 'Дуррес', 'Durrës', 'Durazzo'),
    slug: {current: 'durres'},
    linkedCity: {_type: 'reference', _ref: durres._id},
    pageSections: durresSections,
    seo: {
      metaTitle: Li('Buy property in Durres | Domlivo', 'Купить в Дурресе | Domlivo', 'Купівля в Дурресі | Domlivo', 'Blerje prona në Durrës | Domlivo', 'Acquisto a Durazzo | Domlivo'),
      metaDescription: Li('Verified seaside apartments, houses and villas for sale in Durres.', 'Проверенная недвижимость у моря в Дурресе.', 'Перевірена нерухомість біля моря в Дурресі.', 'Prona të verifikuara pranë detit në Durrës.', 'Immobili verificati vicino al mare a Durazzo.'),
      ogTitle: Li('Buy property in Durres | Domlivo', 'Купить в Дурресе | Domlivo', 'Купівля в Дурресі | Domlivo', 'Blerje prona në Durrës | Domlivo', 'Acquisto a Durazzo | Domlivo'),
      ogDescription: Li('Popular coastal offers updated daily.', 'Популярные предложения у моря.', 'Популярні пропозиції біля моря.', 'Ofertat bregdetare më të njohura.', 'Offerte costiere più popolari.'),
      noIndex: false,
    },
  }

  console.log('Will upsert landing docs:')
  console.log('- landing-tirana')
  console.log('- landing-durres')
  console.log(`Will ensure blog posts: ${postIds.length}`)

  if (isDry) {
    console.log('\nDRY: no changes written.')
    return
  }

  await client.createOrReplace(tiranaDoc)
  await client.createOrReplace(durresDoc)

  console.log('\nSeeded successfully. ✅')
}

run().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})

