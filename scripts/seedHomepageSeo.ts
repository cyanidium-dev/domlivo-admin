/**
 * Seed proper localized SEO on the homepage landing + global siteSettings.
 *
 * Replaces leftover/test values (e.g. "Domlivo" / "Property in Albania" /
 * "En OG Title") with full localized meta+OG copy for all 5 locales and
 * sets the OG image to the homepage hero image (2073x848 PNG already in
 * the dataset).
 *
 *   npx tsx scripts/seedHomepageSeo.ts --dry-run
 *   npx tsx scripts/seedHomepageSeo.ts --execute
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
const c = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
})

const META_TITLE = {
  en: 'Domlivo — Real estate in Albania',
  uk: 'Domlivo — Нерухомість в Албанії',
  ru: 'Domlivo — Недвижимость в Албании',
  sq: 'Domlivo — Pasuri të paluajtshme në Shqipëri',
  it: 'Domlivo — Immobili in Albania',
}

const META_DESCRIPTION = {
  en: 'Verified apartments, villas and commercial property in Tirana, Durrës, Vlorë and Sarandë. Direct from owners and trusted agencies — no commission.',
  uk: 'Перевірені квартири, вілли та комерційна нерухомість у Тирані, Дурресі, Влері та Саранді. Напряму від власників і перевірених агентств — без комісії.',
  ru: 'Проверенные квартиры, виллы и коммерческая недвижимость в Тиране, Дурресе, Влере и Саранде. Напрямую от собственников и проверенных агентств — без комиссии.',
  sq: 'Apartamente, vila dhe pasuri komerciale të verifikuara në Tiranë, Durrës, Vlorë dhe Sarandë. Drejtpërdrejt nga pronarët dhe agjencitë e besueshme — pa komision.',
  it: 'Appartamenti, ville e proprietà commerciali verificate a Tirana, Durazzo, Valona e Saranda. Direttamente dai proprietari e dalle agenzie di fiducia — senza commissioni.',
}

// 1200×630 OG image. The homepage hero image (2073×848) is closest to the
// 1.91:1 ratio we have in the dataset right now — reuse it as the default.
const OG_IMAGE_ASSET_REF = 'image-02ecbf9c2f4e1f43ae3da9fdfc64fcd0076f2b4a-2073x848-png'

const SEO_PAYLOAD = {
  _type: 'localizedSeo' as const,
  metaTitle: {_type: 'localizedString', ...META_TITLE},
  metaDescription: {_type: 'localizedText', ...META_DESCRIPTION},
  ogTitle: {_type: 'localizedString', ...META_TITLE},
  ogDescription: {_type: 'localizedText', ...META_DESCRIPTION},
  ogImage: {
    _type: 'image',
    alt: 'Domlivo — Real estate in Albania',
    asset: {_type: 'reference', _ref: OG_IMAGE_ASSET_REF},
  },
  keywords: {
    _type: 'localizedString',
    en: 'real estate Albania, apartments Albania, villas Albania, property Albania, Tirana, Durres, Vlore, Sarande',
    uk: 'нерухомість Албанія, квартири Албанія, вілли Албанія, Тирана, Дуррес, Вльора, Саранда',
    ru: 'недвижимость Албания, квартиры Албания, виллы Албания, Тирана, Дуррес, Влера, Саранда',
    sq: 'pasuri të paluajtshme Shqipëri, apartamente Shqipëri, vila Shqipëri, Tiranë, Durrës, Vlorë, Sarandë',
    it: 'immobili Albania, appartamenti Albania, ville Albania, Tirana, Durazzo, Valona, Saranda',
  },
  noIndex: false,
  noFollow: false,
}

// siteSettings.defaultSeo schema is a subset — no `keywords`, no `canonicalUrl`.
const SITE_SETTINGS_DEFAULT_SEO = {
  _type: 'localizedSeo' as const,
  metaTitle: SEO_PAYLOAD.metaTitle,
  metaDescription: SEO_PAYLOAD.metaDescription,
  ogTitle: SEO_PAYLOAD.ogTitle,
  ogDescription: SEO_PAYLOAD.ogDescription,
  ogImage: SEO_PAYLOAD.ogImage,
  noIndex: false,
}

async function main() {
  const [home, settings] = await Promise.all([
    c.fetch<{_id: string} | null>(`*[_type=="landingPage" && pageType=="home"][0]{_id}`),
    c.fetch<{_id: string} | null>(`*[_type=="siteSettings"][0]{_id}`),
  ])
  if (!home) {
    console.error('No home landing found.')
    process.exit(1)
  }
  console.log(`Homepage landing: ${home._id}`)
  console.log(`siteSettings:     ${settings?._id ?? '(none — will skip)'}`)
  console.log('\nWill write:')
  console.log('  metaTitle      :', JSON.stringify(SEO_PAYLOAD.metaTitle))
  console.log('  metaDescription:', JSON.stringify(SEO_PAYLOAD.metaDescription))
  console.log('  ogTitle        :', JSON.stringify(SEO_PAYLOAD.ogTitle))
  console.log('  ogImage asset  :', OG_IMAGE_ASSET_REF)
  console.log()

  if (isDry) {
    console.log('Dry run. Re-run with --execute.')
    return
  }

  const tx = c.transaction()
  tx.patch(home._id, (p) => p.set({seo: SEO_PAYLOAD}))
  if (settings) {
    tx.patch(settings._id, (p) => p.set({defaultSeo: SITE_SETTINGS_DEFAULT_SEO}))
  }
  await tx.commit()
  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
