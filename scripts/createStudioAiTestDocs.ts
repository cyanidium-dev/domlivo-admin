/**
 * Fixtures for hand-testing the two Studio AI actions — see
 * docs/engineering/TEST-studio-ai-2026-08-22.md for the click-through script
 * and the listing texts that go with the property drafts.
 *
 * Creates, as DRAFTS ONLY (never published, `isPublished: false`, ids prefixed
 * `*-test-ai-`), so nothing can reach the site and one flag removes them all:
 *
 * - three `district` drafts for 🌐 Translate — one filled in EN only, one in UK
 *   only (a non-English base), and one deliberately patchy so overwrite-off vs
 *   overwrite-on is observable field by field;
 * - five empty `property` drafts for ✨ Parse from text, one per listing text.
 *
 * Run:
 * - npm run seed:studio-ai-tests -- --dry
 * - npm run seed:studio-ai-tests -- --execute
 * - npm run seed:studio-ai-tests -- --delete --execute
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const apiVersion = (process.env.SANITY_API_VERSION || '2024-01-01').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const args = process.argv.slice(2)
const execute = args.includes('--execute')
const remove = args.includes('--delete')
/**
 * `--only parse` / `--only translate` limits the run to one action's fixtures,
 * so re-seeding the property drafts for a fresh parse does not wipe the
 * translations someone just produced in the district ones.
 */
const only =
  args.find((a) => a.startsWith('--only='))?.split('=')[1] ??
  (args.includes('--only') ? args[args.indexOf('--only') + 1] : '')

if (only && only !== 'parse' && only !== 'translate') {
  console.error(`--only takes "parse" or "translate", got "${only}"`)
  process.exit(1)
}

if (!projectId || !token) {
  console.error('Missing SANITY_PROJECT_ID / SANITY_API_TOKEN in cms/.env')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion, token, useCdn: false})

/** The parent city the test districts hang off — a real one, so the reference resolves. */
const TEST_CITY = 'city-durres'

const lstr = (v: Record<string, string>) => ({_type: 'localizedString', ...v})
const ltext = (v: Record<string, string>) => ({_type: 'localizedText', ...v})

// ---------------------------------------------------------------------------
// Translate fixtures

const EN_ONLY = {
  _id: 'drafts.district-test-ai-en-only',
  _type: 'district',
  title: lstr({en: 'AI TEST — English only'}),
  slug: {_type: 'slug', current: 'test-ai-en-only'},
  city: {_type: 'reference', _ref: TEST_CITY},
  isPublished: false,
  heroTitle: lstr({en: 'Live by the water in a neighbourhood that still feels local'}),
  heroShortLine: lstr({en: 'Ten minutes from the port, one street from the sand'}),
  heroSubtitle: ltext({
    en: 'A low-rise district where the morning traffic is people walking to the market, not commuters. Most buildings went up after 2015, so lifts and parking are the norm rather than the exception.',
  }),
  shortDescription: ltext({
    en: 'A quiet coastal pocket of Durrës, popular with families who want the beach without the summer crowds.',
  }),
  description: ltext({
    en: 'The district runs from the coastal road up a gentle slope, which means a good share of the flats keep a sea view above the third floor.\n\nPrices sit below the city centre for comparable square metres, and the rental season is short but strong — July and August carry most of the year. Schools, a health centre and a daily market are all inside a fifteen-minute walk, and the bus to the centre runs every twenty minutes until late evening.',
  }),
  galleryTitle: lstr({en: 'The district in pictures'}),
  gallerySubtitle: ltext({en: 'Streets, seafront and the market square, photographed in late spring.'}),
  faqTitle: lstr({en: 'Questions buyers ask about this district'}),
  seoText: ltext({
    en: 'Apartments for sale in this district of Durrës, with sea views, new construction and prices below the city centre.',
  }),
  seo: {
    _type: 'localizedSeo',
    metaTitle: lstr({en: 'Apartments for sale — AI test district, Durrës'}),
    metaDescription: ltext({
      en: 'Browse apartments and houses for sale in a quiet coastal district of Durrës. New builds, sea views, family-friendly streets.',
    }),
  },
  // Deliberate: localized fields inside an array are v1-out-of-scope and the
  // dialog must say so rather than silently skipping them.
  faqItems: [
    {
      _type: 'localizedFaqItem',
      _key: 'faq-test-1',
      question: lstr({en: 'Is the beach walkable from every street?'}),
      answer: ltext({en: 'From most of them — the furthest streets are about a fifteen-minute walk from the sand.'}),
    },
  ],
}

const UK_ONLY = {
  _id: 'drafts.district-test-ai-uk-only',
  _type: 'district',
  title: lstr({uk: 'AI ТЕСТ — тільки українська'}),
  slug: {_type: 'slug', current: 'test-ai-uk-only'},
  city: {_type: 'reference', _ref: TEST_CITY},
  isPublished: false,
  heroTitle: lstr({uk: 'Район, де море починається за два квартали від дому'}),
  heroShortLine: lstr({uk: 'Десять хвилин до порту, одна вулиця до пляжу'}),
  heroSubtitle: ltext({
    uk: 'Малоповерхова забудова, більшість будинків зведені після 2015 року — з ліфтами та паркінгом. Уранці тут ідуть на ринок, а не стоять у заторах до центру.',
  }),
  shortDescription: ltext({
    uk: 'Тихий приморський куточок Дурреса, який обирають родини — море поруч, натовпу немає навіть у липні.',
  }),
  description: ltext({
    uk: 'Район піднімається від приморської дороги вгору схилом, тому вище третього поверху майже скрізь видно море.\n\nЦіни за квадратний метр нижчі, ніж у центрі міста, а орендний сезон короткий, але щільний — липень і серпень дають більшу частину річного доходу. Школа, амбулаторія та щоденний ринок — у межах чверті години пішки.',
  }),
  galleryTitle: lstr({uk: 'Район у фотографіях'}),
  gallerySubtitle: ltext({uk: 'Вулиці, набережна та ринкова площа — зйомка наприкінці весни.'}),
  faqTitle: lstr({uk: 'Що запитують покупці про цей район'}),
  seoText: ltext({
    uk: 'Квартири на продаж у цьому районі Дурреса: новобудови, вид на море та ціни нижчі, ніж у центрі.',
  }),
  seo: {
    _type: 'localizedSeo',
    metaTitle: lstr({uk: 'Квартири на продаж — тестовий район, Дуррес'}),
    metaDescription: ltext({
      uk: 'Квартири та будинки на продаж у тихому приморському районі Дурреса. Новобудови, вид на море, зручно для родин.',
    }),
  },
}

const PARTIAL = {
  _id: 'drafts.district-test-ai-partial',
  _type: 'district',
  title: lstr({
    en: 'AI TEST — partly translated',
    ru: 'AI ТЕСТ — переведён частично',
  }),
  slug: {_type: 'slug', current: 'test-ai-partial'},
  city: {_type: 'reference', _ref: TEST_CITY},
  isPublished: false,
  // Every locale already filled — overwrite OFF must write nothing here.
  shortDescription: ltext({
    en: 'A hillside district above the bay, five minutes from the coastal road.',
    uk: 'Район на схилі над затокою, за кілька хвилин від приморської дороги.',
    ru: 'Район на склоне над заливом, в пяти минутах от приморской дороги.',
    sq: 'Një lagje në kodër mbi gji, pesë minuta nga rruga bregdetare.',
    it: 'Un quartiere collinare sopra la baia, a cinque minuti dalla strada costiera.',
  }),
  // EN only — overwrite OFF fills the other four.
  description: ltext({
    en: 'Building here started late, so the streets are wider than in the old town and nearly every block has off-street parking.\n\nThe trade-off is distance: the beach is a ten-minute drive rather than a walk, which keeps prices roughly a fifth below the seafront.',
  }),
  // No EN at all — with base EN this field must be skipped and reported.
  heroSubtitle: ltext({
    it: 'Solo in italiano: questo campo deve essere saltato quando la lingua di base è EN.',
  }),
  seo: {
    _type: 'localizedSeo',
    // Nested under an object — proves discovery is not limited to top-level fields.
    metaTitle: lstr({en: 'Hillside apartments above the bay — AI test district'}),
  },
}

// ---------------------------------------------------------------------------
// Parse fixtures — empty on purpose; the listing texts live in the TEST- doc.

const PARSE_CASES = [
  {n: 1, code: 'AI-TEST-P1', note: 'Albanian, complete sale listing'},
  {n: 2, code: 'AI-TEST-P2', note: 'Albanian, price in lek'},
  {n: 3, code: 'AI-TEST-P3', note: 'Russian, monthly rent'},
  {n: 4, code: 'AI-TEST-P4', note: 'English, Google Maps link'},
  {n: 5, code: 'AI-TEST-P5', note: 'Sparse and ambiguous'},
]

const parseDocs = PARSE_CASES.map((c) => ({
  _id: `drafts.property-test-ai-parse-${c.n}`,
  _type: 'property',
  // propertyCode is Studio-only and is never written by the parse action, so it
  // survives as the label that tells the five empty drafts apart.
  propertyCode: c.code,
  isPublished: false,
  lifecycleStatus: 'draft',
}))

const translateDocs = [EN_ONLY, UK_ONLY, PARTIAL]

const docs: Array<Record<string, unknown> & {_id: string; _type: string}> =
  only === 'parse' ? parseDocs : only === 'translate' ? translateDocs : [...translateDocs, ...parseDocs]

async function main(): Promise<void> {
  const ids = docs.map((d) => d._id)

  if (remove) {
    if (!execute) {
      console.log(`[dry] would delete ${ids.length} test draft(s):`)
      for (const id of ids) console.log(`  - ${id}`)
      console.log('\nRe-run with --delete --execute to apply.')
      return
    }
    const tx = ids.reduce((t, id) => t.delete(id), client.transaction())
    await tx.commit()
    console.log(`Deleted ${ids.length} test draft(s).`)
    return
  }

  if (!execute) {
    console.log(`[dry] would create/replace ${docs.length} draft(s):`)
    for (const d of docs) console.log(`  - ${d._id} (${d._type})`)
    console.log('\nRe-run with --execute to apply.')
    return
  }

  const tx = docs.reduce((t, d) => t.createOrReplace(d), client.transaction())
  await tx.commit()
  console.log(`Created/replaced ${docs.length} draft(s):`)
  for (const d of docs) console.log(`  - ${d._id}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
