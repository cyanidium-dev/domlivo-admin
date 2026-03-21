/**
 * Seed canonical /cities landing page using landingPage + pageSections[].
 *
 * Creates/updates:
 * - landing-cities (pageType=cityIndex, slug=cities)
 *
 * Run:
 * - npm run seed:cities-landing -- --dry
 * - npm run seed:cities-landing -- --execute
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

async function run() {
  console.log('--- Seed /cities landing ---')
  console.log(`Project: ${projectId}`)
  console.log(`Dataset: ${dataset}`)
  console.log(`Mode: ${isDry ? 'DRY' : 'EXECUTE'}`)
  console.log('')

  const doc = {
    _id: 'landing-cities',
    _type: 'landingPage',
    pageType: 'cityIndex',
    enabled: true,
    title: Li('Cities', 'Города', 'Міста', 'Qytetet', 'Città'),
    slug: {current: 'cities'},
    seo: {
      metaTitle: Li('Cities | Domlivo', 'Города | Domlivo', 'Міста | Domlivo', 'Qytetet | Domlivo', 'Città | Domlivo'),
      metaDescription: Li(
        'Explore city landing pages in Albania: prices, areas, FAQs, and curated listings.',
        'Смотрите городские страницы в Албании: районы, FAQ и подборки объектов.',
        'Переглядайте сторінки міст в Албанії: райони, FAQ та добірки об’єктів.',
        'Shikoni faqet e qyteteve në Shqipëri: zona, FAQ dhe oferta të përzgjedhura.',
        'Esplora le pagine delle città in Albania: zone, FAQ e offerte selezionate.',
      ),
      ogTitle: Li('Cities | Domlivo', 'Города | Domlivo', 'Міста | Domlivo', 'Qytetet | Domlivo', 'Città | Domlivo'),
      ogDescription: Li(
        'Browse city landings and discover the best areas to buy property.',
        'Выберите город и районы для покупки недвижимости.',
        'Оберіть місто та райони для купівлі нерухомості.',
        'Zgjidhni qytetin dhe zonat për blerje prone.',
        'Scegli la città e le zone per acquistare.',
      ),
      noIndex: false,
      noFollow: false,
    },
    pageSections: [
      {
        _type: 'heroSection',
        enabled: true,
        title: Li(
          'Explore cities in Albania',
          'Города Албании: обзор и подборки',
          'Міста Албанії: огляд та добірки',
          'Eksploroni qytetet në Shqipëri',
          'Esplora le città in Albania',
        ),
        subtitle: Li(
          'Choose a city landing page to compare areas, read FAQs, and browse verified listings.',
          'Выберите город: районы, FAQ и проверенные предложения.',
          'Оберіть місто: райони, FAQ та перевірені пропозиції.',
          'Zgjidhni një qytet: zona, FAQ dhe oferta të verifikuara.',
          'Scegli una città: zone, FAQ e offerte verificate.',
        ),
        cta: {
          href: '/properties',
          label: Li('Browse properties', 'Смотреть объекты', 'Переглянути об’єкти', 'Shiko pronat', 'Sfoglia proprietà'),
        },
        search: {
          enabled: false,
          tabs: [],
        },
      },
      {
        _type: 'landingGridSection',
        enabled: true,
        title: Li(
          'City landing pages',
          'Городские страницы',
          'Сторінки міст',
          'Faqet e qyteteve',
          'Pagine delle città',
        ),
        subtitle: Li(
          'Open a city page to see popular properties, district comparison, gallery and FAQs.',
          'Откройте городскую страницу: подборки, сравнение районов, галерея и FAQ.',
          'Відкрийте сторінку міста: добірки, порівняння районів, галерея та FAQ.',
          'Hapni një faqe qyteti: përzgjedhje, krahasim zonash, galeri dhe FAQ.',
          'Apri una pagina città: selezioni, confronto zone, galleria e FAQ.',
        ),
        sourceMode: 'auto',
        auto: {
          pageTypes: ['city'],
          enabledOnly: true,
          sort: 'titleAsc',
          limit: 200,
        },
      },
      {
        _type: 'seoTextSection',
        enabled: true,
        content: {
          en: blocksFromText(
            'Domlivo city landing pages help you explore local markets across Albania. Open a city page to compare districts, see curated listings, and use filters to find properties that match your budget and goals.',
          ),
          ru: blocksFromText(
            'Городские страницы Domlivo помогают ориентироваться в рынке недвижимости Албании. Откройте страницу города, чтобы сравнить районы, посмотреть подборки и быстро найти варианты по бюджету и целям.',
          ),
          uk: blocksFromText(
            'Міські сторінки Domlivo допомагають орієнтуватися на ринку нерухомості Албанії. Відкрийте сторінку міста, щоб порівняти райони, переглянути добірки та швидко знайти варіанти за бюджетом і цілями.',
          ),
          sq: blocksFromText(
            'Faqet e qyteteve në Domlivo ju ndihmojnë të kuptoni tregun lokal në Shqipëri. Hapni një qytet për të krahasuar zonat, për të parë përzgjedhje ofertash dhe për të gjetur prona sipas buxhetit dhe qëllimeve.',
          ),
          it: blocksFromText(
            "Le pagine città di Domlivo ti aiutano a capire i mercati locali in Albania. Apri una città per confrontare le zone, vedere selezioni di annunci e trovare immobili in base a budget e obiettivi.",
          ),
        },
      },
      {
        _type: 'articlesSection',
        title: Li(
          'Useful articles',
          'Полезные статьи',
          'Корисні статті',
          'Artikuj të dobishëm',
          'Articoli utili',
        ),
        subtitle: Li(
          'Guides and market insights for buying property in Albania.',
          'Гайды и обзоры рынка недвижимости Албании.',
          'Гайди та огляди ринку нерухомості Албанії.',
          'Udhëzues dhe analiza për blerje prone në Shqipëri.',
          'Guide e approfondimenti per acquistare in Albania.',
        ),
        cta: {href: '/blog', label: Li('Read all', 'Читать все', 'Читати всі', 'Lexo të gjitha', 'Leggi tutti')},
        mode: 'latest',
      },
      {
        _type: 'faqSection',
        enabled: true,
        title: Li('FAQ', 'FAQ', 'FAQ', 'FAQ', 'FAQ'),
        items: [
          {
            _type: 'localizedFaqItem',
            question: Li(
              'How do I choose the right city to buy property?',
              'Как выбрать город для покупки недвижимости?',
              'Як обрати місто для покупки нерухомості?',
              'Si të zgjedh qytetin e duhur për të blerë pronë?',
              'Come scegliere la città giusta per acquistare?',
            ),
            answer: Li(
              'Start with your goal (living vs investment), then compare districts, prices, and listing availability on each city landing page.',
              'Сначала определите цель (жить или инвестировать), затем сравните районы, цены и количество предложений на страницах городов.',
              'Спершу визначте мету (житло чи інвестиції), потім порівняйте райони, ціни та кількість пропозицій на сторінках міст.',
              'Filloni nga qëllimi (banim apo investim), pastaj krahasoni zonat, çmimet dhe ofertat në faqet e qyteteve.',
              'Parti dall’obiettivo (vivere o investimento), poi confronta zone, prezzi e disponibilità sulle pagine città.',
            ),
          },
          {
            _type: 'localizedFaqItem',
            question: Li(
              'What is a city landing page?',
              'Что такое городская страница?',
              'Що таке сторінка міста?',
              'Çfarë është një faqe qyteti?',
              'Cos’è una pagina città?',
            ),
            answer: Li(
              'It’s an editorial page built from sections: hero, popular properties, district comparison, gallery, FAQs, and SEO text.',
              'Это редакционная страница из блоков: hero, подборки объектов, сравнение районов, галерея, FAQ и SEO-текст.',
              'Це редакційна сторінка з блоків: hero, добірки об’єктів, порівняння районів, галерея, FAQ та SEO-текст.',
              'Është një faqe editoriale me blloqe: hero, përzgjedhje pronash, krahasim zonash, galeri, FAQ dhe SEO-tekst.',
              'È una pagina editoriale con sezioni: hero, selezioni immobili, confronto zone, galleria, FAQ e testo SEO.',
            ),
          },
        ],
      },
    ],
  }

  console.log('Will upsert:', doc._id)
  if (isDry) {
    console.log('DRY: no changes written.')
    return
  }
  await client.createOrReplace(doc)
  console.log('Seeded successfully. ✅')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})

