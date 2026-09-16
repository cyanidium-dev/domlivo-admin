/**
 * Titles and meta titles of the Durrës catalog pages and the catalog root,
 * rewritten around the queries Google Keyword Planner confirmed on 2026-09-16
 * (report: "Durrës Buyer Demand Atlas").
 *
 * What the study found, per locale, and what each title now leads with:
 * - en: "apartment(s) for sale durres" and "durres beach apartments for sale"
 *   are the Durrës long tail in UK/US/CA/DE/PL/CZ…; "property for sale albania"
 *   is the volume term (1K–10K).
 * - de: "durres wohnung kaufen", "immobilien durres", "albanien immobilien",
 *   "immobilien am meer albanien" — confirmed in DE, AT and CH.
 * - it: "appartamento durazzo" (100–1K, rising), "casa al mare albania" (100–1K).
 *   Italians search Durazzo, not Durrës.
 * - pl: "apartament durres", "mieszkanie durres", "mieszkanie w albanii".
 * - sq: "apartamente ne shitje durres", "banesa ne durres" (Kosovo, North
 *   Macedonia, the diaspora in Italy and Germany).
 * - uk/ru: "купити / купить квартиру в Албанії / Албании" (100–1K in Ukraine).
 *
 * Only the fields listed are written; intro and bottom text stay as they are.
 * Backups first, one transaction, ifRevisionID so a concurrent edit aborts it.
 *
 * Run:
 *   npx tsx scripts/applyKeywordStudyTitles.ts           (dry run: prints before → after)
 *   npx tsx scripts/applyKeywordStudyTitles.ts --execute
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.includes('--execute')
const token = process.env.SANITY_API_TOKEN?.trim()
if (!token) {
  console.error('SANITY_API_TOKEN required in .env')
  process.exit(1)
}
const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

type Loc = 'en' | 'uk' | 'ru' | 'sq' | 'it' | 'pl' | 'de'
type Change = {title?: Partial<Record<Loc, string>>; metaTitle?: Partial<Record<Loc, string>>; metaDescription?: Partial<Record<Loc, string>>}

const CHANGES: Record<string, Change> = {
  'catalogSeoPage-city-city-durres': {
    title: {
      en: 'Apartments & Property for Sale in Durrës, Albania',
      it: 'Appartamenti e case in vendita a Durazzo, Albania',
      pl: 'Durrës: apartamenty i mieszkania na sprzedaż',
      sq: 'Apartamente dhe shtëpi në shitje në Durrës',
      de: 'Wohnung kaufen in Durrës — Immobilien in Albanien',
    },
    metaTitle: {
      en: 'Apartments for Sale in Durrës, Albania — Beach & Sea-View Property',
      it: 'Appartamenti in vendita a Durazzo — case al mare, prezzi 2026',
      pl: 'Apartamenty i mieszkania na sprzedaż w Durrës — ceny 2026',
      sq: 'Apartamente në shitje në Durrës — banesa 1+1, 2+1, çmime 2026',
      de: 'Wohnung kaufen in Durrës, Albanien — Immobilien am Meer',
    },
    metaDescription: {
      de: 'Wohnungen, Studios und Villen in Durrës kaufen: vom Zentrum und Plazh bis Golem und Qerret. Reale Preise, Fotos und direkter Kontakt, provisionsfrei.',
    },
  },
  'catalogSeoPage-district-district-golem-durres': {
    title: {
      en: 'Apartments for Sale in Golem, Durrës',
      it: 'Appartamenti al mare in vendita a Golem, Durazzo',
      pl: 'Golem, Durrës: apartamenty nad morzem na sprzedaż',
      de: 'Wohnungen am Meer kaufen in Golem, Durrës',
    },
    metaTitle: {
      en: 'Apartments for Sale in Golem, Durrës — Beach Apartments & New Builds',
      it: 'Appartamenti al mare in vendita a Golem, Durazzo — prezzi 2026',
      pl: 'Golem, Durrës: apartamenty nad morzem na sprzedaż — ceny 2026',
      de: 'Wohnung am Meer kaufen in Golem, Durrës — Neubauten & Preise',
    },
  },
  'catalogSeoPage-district-district-durres-center': {
    title: {
      en: 'Apartments for Sale in Durrës City Centre',
      it: 'Appartamenti in vendita nel centro di Durazzo',
      pl: 'Centrum Durrës: mieszkania na sprzedaż',
      de: 'Wohnungen kaufen im Zentrum von Durrës',
    },
    metaTitle: {
      en: 'Apartments for Sale in Durrës City Centre — Currila & Vollga Seafront',
      it: 'Appartamenti in vendita nel centro di Durazzo — lungomare Currila',
      pl: 'Centrum Durrës: mieszkania na sprzedaż — nadmorska Currila i Vollga',
      de: 'Wohnung kaufen im Zentrum von Durrës — Promenade Currila & Vollga',
    },
  },
  'catalogSeoPage-district-district-plazh': {
    title: {
      en: 'Beach Apartments for Sale in Plazh, Durrës',
      it: 'Appartamenti al mare in vendita a Plazh, Durazzo',
      pl: 'Plazh, Durrës: mieszkania przy plaży na sprzedaż',
      sq: 'Apartamente në shitje në Plazh, Durrës',
      de: 'Wohnungen am Strand kaufen in Plazh, Durrës',
    },
    metaTitle: {
      en: 'Beach Apartments for Sale in Plazh, Durrës — Prices 2026',
      it: 'Appartamenti al mare in vendita a Plazh, Durazzo — prezzi 2026',
      pl: 'Plazh, Durrës: mieszkania przy plaży na sprzedaż — ceny 2026',
      sq: 'Apartamente në shitje në Plazh, Durrës — buzë detit, çmime 2026',
      de: 'Wohnung am Strand kaufen in Plazh, Durrës — Preise 2026',
    },
  },
  'catalogSeoPage-district-district-shkembi-durres': {
    title: {
      en: 'Apartments for Sale in Shkëmbi i Kavajës, Durrës',
      it: 'Appartamenti in vendita a Shkëmbi i Kavajës, Durazzo',
      pl: 'Shkëmbi i Kavajës, Durrës: mieszkania na sprzedaż',
      de: 'Wohnungen kaufen in Shkëmbi i Kavajës, Durrës',
    },
    metaTitle: {
      en: 'Apartments for Sale in Shkëmbi i Kavajës, Durrës — Prices 2026',
      it: 'Appartamenti in vendita a Shkëmbi i Kavajës, Durazzo — prezzi 2026',
      pl: 'Shkëmbi i Kavajës, Durrës: mieszkania na sprzedaż — ceny 2026',
      de: 'Wohnung kaufen in Shkëmbi i Kavajës, Durrës — Preise 2026',
    },
  },
  'catalogSeoPage-propertiesRoot': {
    title: {
      en: 'Property for Sale in Albania — Apartments, Houses & Beach Homes',
      it: 'Case in vendita in Albania — comprare casa al mare',
      pl: 'Mieszkanie w Albanii — nieruchomości na sprzedaż',
      de: 'Immobilien in Albanien kaufen — Wohnungen & Häuser am Meer',
    },
    metaTitle: {
      en: 'Property for Sale in Albania — Apartments, Houses & Beach Homes',
      it: 'Case in vendita in Albania — comprare casa al mare, prezzi reali',
      pl: 'Mieszkanie w Albanii — nieruchomości na sprzedaż, realne ceny',
      uk: 'Купити квартиру в Албанії — нерухомість на продаж',
      ru: 'Купить квартиру в Албании — недвижимость у моря',
      de: 'Immobilien in Albanien kaufen — Wohnungen & Häuser am Meer',
    },
  },
}

/** German name of the city itself: the fallback copy of "Durres" has no ë. */
const CITY_TITLES: Record<string, Partial<Record<Loc, string>>> = {
  durres: {de: 'Durrës'},
}

async function main() {
  const ids = Object.keys(CHANGES)
  const docs = await client.fetch<Array<Record<string, any>>>(`*[_id in $ids]`, {ids})
  const cities = await client.fetch<Array<Record<string, any>>>(`*[_type == "city" && slug.current in $slugs && !(_id in path("drafts.**"))]`, {
    slugs: Object.keys(CITY_TITLES),
  })
  if (docs.length !== ids.length) {
    console.error('missing documents:', ids.filter((id) => !docs.some((d) => d._id === id)))
    process.exit(1)
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.resolve(process.cwd(), 'scripts/data/backups')
  fs.mkdirSync(backupDir, {recursive: true})
  const backupPath = path.join(backupDir, `keywordStudyTitles-${stamp}.json`)
  fs.writeFileSync(backupPath, JSON.stringify({docs, cities}, null, 2))

  const tx = client.transaction()
  let n = 0
  for (const doc of docs) {
    const change = CHANGES[doc._id]
    const set: Record<string, string> = {}
    for (const [loc, text] of Object.entries(change.title ?? {})) {
      if (doc.title?.[loc] !== text) set[`title.${loc}`] = text
    }
    for (const [loc, text] of Object.entries(change.metaTitle ?? {})) {
      if (doc.seo?.metaTitle?.[loc] !== text) set[`seo.metaTitle.${loc}`] = text
    }
    for (const [loc, text] of Object.entries(change.metaDescription ?? {})) {
      if (doc.seo?.metaDescription?.[loc] !== text) set[`seo.metaDescription.${loc}`] = text
    }
    for (const [key, text] of Object.entries(set)) {
      const [field, ...rest] = key.split('.')
      const before = rest.reduce((cur: any, k) => cur?.[k], doc[field])
      console.log(`${doc._id} ${key}\n   ${before ?? '∅'}\n → ${text}`)
    }
    if (Object.keys(set).length) {
      tx.patch(doc._id, (p) => p.ifRevisionId(doc._rev).setIfMissing({seo: {}}).set(set))
      n += Object.keys(set).length
    }
  }
  for (const city of cities) {
    const set: Record<string, string> = {}
    for (const [loc, text] of Object.entries(CITY_TITLES[city.slug.current] ?? {})) {
      if (city.title?.[loc] !== text) set[`title.${loc}`] = text
    }
    if (Object.keys(set).length) {
      console.log(`${city._id} ${JSON.stringify(set)} (was ${JSON.stringify(city.title?.de ?? null)})`)
      tx.patch(city._id, (p) => p.ifRevisionId(city._rev).set(set))
      n += Object.keys(set).length
    }
  }
  console.log(`\n${n} values; backup ${backupPath}`)
  if (!execute) {
    console.log('Dry run — pass --execute to write.')
    return
  }
  if (!n) return
  const res = await tx.commit()
  console.log(`committed transaction ${res.transactionId}`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
