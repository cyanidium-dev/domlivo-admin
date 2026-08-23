/**
 * Seeds the three documents ТЗ-13's features need something to point at.
 *
 * 1. `blogAuthor` — an EDITORIAL author, deliberately not an invented person.
 *    Fabricating a named expert with a biography and a photograph, on a page
 *    whose entire purpose is E-E-A-T, would present a fiction as a credential
 *    to readers. Inactive, so it renders for testing but stays out of the
 *    sitemap and carries noindex. Replace it when a real author exists.
 *
 * 2. `tracker` — Vlora airport, the subject the roadmap names for sprint-1 #7,
 *    built from 08-infrastructure/infrastructure.md §1 with its own sources.
 *    Unpublished: the KB figures date to 2026-07-18 and a tracker's whole
 *    promise is freshness. It exists so trackerEmbed can be built and tested;
 *    publishing it belongs to the content step, after the KB refresh.
 *
 * 3. Fixture fields on the one genuine article — keyFacts, faq, sources and
 *    both embeds. ТЗ-13's own acceptance criterion is that a test article
 *    exercises every new capability; this is that article.
 *
 * Everything is createIfNotExists / a merge patch, so a re-run is a no-op.
 *
 * Run:
 * - npm run seed:tz13            (dry)
 * - npm run seed:tz13 -- --execute
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.slice(2).includes('--execute')
const KB_DATE = '2026-07-18'
const FIXTURE_SLUG = 'rental-investment-in-durres-in-2026-key-checks'

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

const L = (en: string, sq: string, ru: string, uk: string, it: string) => ({
  _type: 'localizedString',
  en,
  sq,
  ru,
  uk,
  it,
})
const T = (en: string, sq: string, ru: string, uk: string, it: string) => ({
  _type: 'localizedText',
  en,
  sq,
  ru,
  uk,
  it,
})

const author = {
  _id: 'blogAuthor-domlivo-editorial',
  _type: 'blogAuthor',
  name: 'Domlivo Editorial',
  slug: {_type: 'slug', current: 'domlivo-editorial'},
  active: false,
  role: L(
    'Editorial team',
    'Ekipi editorial',
    'Редакция',
    'Редакція',
    'Redazione',
  ),
  bio: T(
    'Articles published under this byline are written and reviewed by the Domlivo team from our own market research. Where a figure comes from an outside source, that source is listed at the end of the article.',
    'Artikujt e publikuar me këtë emër shkruhen dhe rishikohen nga ekipi i Domlivo mbi bazën e kërkimit tonë të tregut. Kur një shifër vjen nga një burim i jashtëm, ai burim renditet në fund të artikullit.',
    'Статьи под этой подписью пишет и проверяет команда Domlivo на основе собственного анализа рынка. Если цифра взята из внешнего источника, он указан в конце статьи.',
    'Статті під цим підписом пише і перевіряє команда Domlivo на основі власного аналізу ринку. Якщо цифра взята із зовнішнього джерела, воно вказане в кінці статті.',
    'Gli articoli pubblicati con questa firma sono scritti e verificati dal team Domlivo sulla base della nostra ricerca di mercato. Quando un dato proviene da una fonte esterna, tale fonte è indicata in fondo all’articolo.',
  ),
}

const tracker = {
  _id: 'tracker-vlora-airport',
  _type: 'tracker',
  isPublished: false,
  title: L(
    'Vlora airport: status tracker',
    'Aeroporti i Vlorës: gjurmuesi i statusit',
    'Аэропорт Влёры: трекер статуса',
    'Аеропорт Вльори: трекер статусу',
    'Aeroporto di Valona: stato dei lavori',
  ),
  slug: {_type: 'slug', current: 'vlora-airport'},
  subject: L(
    'Vlora International Airport construction and opening',
    'Ndërtimi dhe hapja e Aeroportit Ndërkombëtar të Vlorës',
    'Строительство и открытие международного аэропорта Влёры',
    'Будівництво і відкриття міжнародного аеропорту Вльори',
    'Costruzione e apertura dell’Aeroporto Internazionale di Valona',
  ),
  currentStatus: 'blocked',
  statusSummary: T(
    'The airport is not flying. Charter flights announced for 2026 were cancelled and the project is subject to a SPAK investigation. Prices in Vlora, the Riviera and Saranda already carry an "airport premium" for an opening that has not happened, which makes every further delay a downside rather than a neutral event.',
    'Aeroporti nuk operon. Fluturimet çarter të njoftuara për 2026 u anuluan dhe projekti është nën hetim nga SPAK. Çmimet në Vlorë, Riviera dhe Sarandë përmbajnë tashmë një "prim aeroporti" për një hapje që nuk ka ndodhur.',
    'Аэропорт не летает. Объявленные на 2026 год чартеры отменены, проект находится под расследованием SPAK. Цены во Влёре, на Ривьере и в Саранде уже содержат «аэропортную премию» за открытие, которого не было, поэтому каждая новая задержка — это риск снижения, а не нейтральное событие.',
    'Аеропорт не літає. Оголошені на 2026 рік чартери скасовано, проєкт перебуває під розслідуванням SPAK. Ціни у Вльорі, на Рив’єрі та в Саранді вже містять «аеропортну премію» за відкриття, якого не сталося.',
    'L’aeroporto non è operativo. I voli charter annunciati per il 2026 sono stati cancellati e il progetto è oggetto di un’indagine SPAK. I prezzi a Valona, sulla Riviera e a Saranda incorporano già un "premio aeroporto" per un’apertura che non è avvenuta.',
  ),
  lastCheckedAt: KB_DATE,
  timeline: [
    {
      _type: 'object',
      _key: 'tl-charters',
      date: '2026-01-01',
      event: L(
        'Charter flights announced for the 2026 season are cancelled',
        'Anulohen fluturimet çarter të sezonit 2026',
        'Чартеры сезона 2026 отменены',
        'Чартери сезону 2026 скасовано',
        'Cancellati i voli charter della stagione 2026',
      ),
    },
    {
      _type: 'object',
      _key: 'tl-spak',
      date: KB_DATE,
      event: L(
        'Project under SPAK investigation; no operating date announced',
        'Projekti nën hetim nga SPAK; pa datë operimi',
        'Проект под расследованием SPAK; дата начала работы не объявлена',
        'Проєкт під розслідуванням SPAK; дата початку роботи не оголошена',
        'Progetto sotto indagine SPAK; nessuna data di apertura',
      ),
    },
  ],
  sources: [
    {
      _type: 'sourceItem',
      _key: 'src-kb',
      label: L(
        'DomLivo infrastructure research, §1 status map',
        'Kërkimi i infrastrukturës DomLivo, §1',
        'Исследование инфраструктуры DomLivo, §1',
        'Дослідження інфраструктури DomLivo, §1',
        'Ricerca infrastrutture DomLivo, §1',
      ),
      publisher: 'DomLivo',
      date: KB_DATE,
    },
  ],
}

const keyFacts = [
  L(
    'Durres is Albania’s most practical rental market for mid-term and seasonal demand.',
    'Durrësi është tregu më praktik i qirasë në Shqipëri për kërkesën afatmesme dhe sezonale.',
    'Дуррес — самый практичный в Албании рынок аренды для среднесрочного и сезонного спроса.',
    'Дуррес — найпрактичніший в Албанії ринок оренди для середньострокового і сезонного попиту.',
    'Durazzo è il mercato degli affitti più pratico dell’Albania per la domanda a medio termine e stagionale.',
  ),
  L(
    'The beach zone earns more in summer; the city centre holds occupancy year-round.',
    'Zona e plazhit fiton më shumë në verë; qendra e qytetit mban qiramarrës gjatë gjithë vitit.',
    'Пляжная зона зарабатывает больше летом; центр города держит занятость круглый год.',
    'Пляжна зона заробляє більше влітку; центр міста тримає зайнятість цілий рік.',
    'La zona balneare rende di più d’estate; il centro mantiene l’occupazione tutto l’anno.',
  ),
  L(
    'Check the title and any legalisation history before agreeing a price.',
    'Kontrolloni titullin dhe historinë e legalizimit para se të bini dakord për çmimin.',
    'Проверьте титул и историю легализации до согласования цены.',
    'Перевірте титул та історію легалізації до узгодження ціни.',
    'Verificate il titolo e l’eventuale storia di legalizzazione prima di concordare il prezzo.',
  ),
]

const faq = [
  {
    _type: 'localizedFaqItem',
    _key: 'faq-zone',
    question: L(
      'Beach area or city centre for rental income in Durres?',
      'Zona e plazhit apo qendra e qytetit për të ardhura nga qiraja në Durrës?',
      'Пляж или центр Дурреса для дохода от аренды?',
      'Пляж чи центр Дурреса для доходу від оренди?',
      'Zona balneare o centro città per il reddito da affitto a Durazzo?',
    ),
    answer: T(
      'The beach zone gives stronger short-term demand across the summer, while the city centre provides steadier year-round occupancy. Which wins depends on whether you want a seasonal peak or a flatter twelve-month return.',
      'Zona e plazhit jep kërkesë më të fortë afatshkurtër gjatë verës, ndërsa qendra siguron qiramarrës më të qëndrueshëm gjatë gjithë vitit.',
      'Пляжная зона даёт более сильный краткосрочный спрос летом, центр — более ровную занятость весь год. Выбор зависит от того, нужен ли сезонный пик или ровный доход за двенадцать месяцев.',
      'Пляжна зона дає сильніший короткостроковий попит улітку, центр — рівнішу зайнятість цілий рік.',
      'La zona balneare offre una domanda a breve termine più forte d’estate, mentre il centro garantisce un’occupazione più costante tutto l’anno.',
    ),
  },
  {
    _type: 'localizedFaqItem',
    _key: 'faq-checks',
    question: L(
      'What should I check before buying to rent out?',
      'Çfarë duhet të kontrolloj para se të blej për ta dhënë me qira?',
      'Что проверить перед покупкой под сдачу?',
      'Що перевірити перед купівлею під оренду?',
      'Cosa devo verificare prima di comprare per affittare?',
    ),
    answer: T(
      'District quality, legal clarity of the title, the realistic renovation budget, and occupancy assumptions you can defend rather than the ones an agent quotes.',
      'Cilësia e zonës, qartësia ligjore e titullit, buxheti realist i rinovimit dhe supozimet e qiradhënies që mund t’i mbroni.',
      'Качество района, юридическую чистоту титула, реальный бюджет ремонта и такие допущения по загрузке, которые вы сможете обосновать сами.',
      'Якість району, юридичну чистоту титулу, реальний бюджет ремонту і такі припущення щодо завантаження, які ви зможете обґрунтувати.',
      'La qualità della zona, la chiarezza legale del titolo, il budget realistico di ristrutturazione e ipotesi di occupazione difendibili.',
    ),
  },
]

const sources = [
  {
    _type: 'sourceItem',
    _key: 'src-durres',
    label: L(
      'DomLivo city research: Durres',
      'Kërkimi i qytetit DomLivo: Durrës',
      'Исследование города DomLivo: Дуррес',
      'Дослідження міста DomLivo: Дуррес',
      'Ricerca città DomLivo: Durazzo',
    ),
    publisher: 'DomLivo',
    date: KB_DATE,
  },
  {
    _type: 'sourceItem',
    _key: 'src-legal',
    label: L(
      'DomLivo legal guide, §1 purchase process',
      'Udhëzuesi ligjor DomLivo, §1',
      'Юридический гид DomLivo, §1',
      'Юридичний гід DomLivo, §1',
      'Guida legale DomLivo, §1',
    ),
    publisher: 'DomLivo',
    date: KB_DATE,
  },
]

async function main(): Promise<void> {
  const post = await client.fetch(
    `*[_type=="blogPost" && slug.current==$s][0]{_id, content, keyFacts, faq, sources, author}`,
    {s: FIXTURE_SLUG},
  )
  if (!post) throw new Error(`fixture article ${FIXTURE_SLUG} not found`)

  const plazh = await client.fetch(`*[_type=="district" && slug.current=="plazh"][0]._id`)
  if (!plazh) throw new Error('district plazh not found')

  const blocks = Array.isArray(post.content?.en) ? [...post.content.en] : []
  const hasZone = blocks.some((b: Record<string, unknown>) => b?._type === 'zoneStatsEmbed')
  const hasTracker = blocks.some((b: Record<string, unknown>) => b?._type === 'trackerEmbed')
  if (!hasZone) blocks.push({_type: 'zoneStatsEmbed', _key: 'embed-zone-plazh', zone: {_type: 'reference', _ref: plazh}})
  if (!hasTracker) {
    blocks.push({_type: 'trackerEmbed', _key: 'embed-tracker-vlora', tracker: {_type: 'reference', _ref: tracker._id}})
  }

  console.log(`author  : ${author._id} (active: false — editorial, not an invented person)`)
  console.log(`tracker : ${tracker._id} (isPublished: false — KB figures date to ${KB_DATE})`)
  console.log(`fixture : ${post._id}`)
  console.log(`  keyFacts ${post.keyFacts?.length ?? 0} → ${keyFacts.length}`)
  console.log(`  faq      ${post.faq?.length ?? 0} → ${faq.length}`)
  console.log(`  sources  ${post.sources?.length ?? 0} → ${sources.length}`)
  console.log(`  content.en blocks ${(post.content?.en ?? []).length} → ${blocks.length}`)
  // Never replace an author somebody chose. The seed only fills a gap.
  const setAuthor = !post.author
  console.log(`  author ref: ${post.author ? 'already set — left alone' : `→ ${author._id}`}`)

  if (!execute) {
    console.log('\nDry run. Re-run with --execute to write.')
    return
  }

  await client.createIfNotExists(author)
  await client.createIfNotExists(tracker)
  await client
    .patch(post._id)
    .set({
      keyFacts,
      faq,
      sources,
      content: {...(post.content ?? {}), en: blocks},
      ...(setAuthor ? {author: {_type: 'reference', _ref: author._id}} : {}),
    })
    .commit()
  console.log('written')
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
