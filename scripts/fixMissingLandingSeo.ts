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

async function run() {
  const docs = await client.fetch<any[]>(
    `*[_type=="landingPage" && enabled==true]{
      _id,
      pageType,
      slug,
      seo
    } | order(_id asc)`,
  )

  const touched: string[] = []
  for (const d of docs) {
    if (d?.seo && (d.seo.metaTitle || d.seo.metaDescription)) continue

    // Minimal safe defaults (editors can replace later)
    const fallbackTitle =
      d?.pageType === 'home'
        ? Li('Domlivo', 'Domlivo', 'Domlivo', 'Domlivo', 'Domlivo')
        : Li('Domlivo', 'Domlivo', 'Domlivo', 'Domlivo', 'Domlivo')

    const fallbackDesc =
      d?.pageType === 'home'
        ? Li('Property in Albania', 'Недвижимость в Албании', 'Нерухомість в Албанії', 'Pasuri në Shqipëri', 'Immobiliare in Albania')
        : Li('Property in Albania', 'Недвижимость в Албании', 'Нерухомість в Албанії', 'Pasuri në Shqipëri', 'Immobiliare in Albania')

    const seo = {
      metaTitle: fallbackTitle,
      metaDescription: fallbackDesc,
      ogTitle: fallbackTitle,
      ogDescription: fallbackDesc,
      noIndex: false,
      noFollow: false,
    }

    touched.push(d._id)
    if (isDry) continue
    await client.patch(d._id).set({seo}).commit()
  }

  console.log(JSON.stringify({projectId, dataset, mode: isDry ? 'DRY' : 'EXECUTE', touched}, null, 2))
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})

