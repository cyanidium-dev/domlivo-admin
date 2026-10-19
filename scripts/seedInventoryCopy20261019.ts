/**
 * Own copy for the thin listing pages that the SEO registry indexes
 * (growth plan B4, 2026-10-19).
 *
 * Why: the frontend audit (your-house-albania scripts/audit-thin-pages.ts)
 * found 9 indexable listing pages with nothing of their own to say. Four city
 * pages — Vlorë, Sarandë, Shëngjin, Tirana — carried the 2026 seed stub
 * ("Property catalog in Tirana. Domlivo aggregates up-to-date listings…", 18
 * words), and the five Durrës facets the registry indexes (1-1, 2-1,
 * near-the-sea, new-builds, under-100k) had no CMS copy at all, only the
 * generated sentence every facet page shares. The Durrës catalogue pages
 * (scripts/applyDurresCatalogCopy.ts) are the template: zone prices, what the
 * catalogue holds, what to check.
 *
 * Every figure is either a token filled from the live Domlivo Price Index at
 * render time ({{median:vlore}}, {{listings:durres/1-1}} — see the frontend's
 * src/lib/priceIndex/tokens.ts) or a sourced figure already on the site: the
 * city /info pages and zoneMetrics (Deloitte 2025 via Monitor.al, Monitor.al
 * agency survey, Globihome, Homezone, Bank of Albania). Nothing about the
 * company is claimed.
 *
 * Pages under the inventory minimum (Himarë 1 listing, Shkodër 1, the Tirana
 * and Vlorë districts, Ksamil with none) get no copy: they stay noindex until
 * stock arrives (frontend src/lib/seo/pages/eligibility.ts). Spille is noindex
 * on demand and already has its own text.
 *
 * What it writes (English only; the other locales are emptied so
 * scripts/translateLocaleGaps.ts fills them from this text — the old ones were
 * the seed stub in every language):
 * - catalogSeoPage-city-city-{vlore,sarande,shengjin,tirana}: intro, bottomText
 * - catalogSeoPage-facet-durres-{1-1,2-1,near-the-sea,new-builds,under-100k}:
 *   new documents, pageScope "facet" (schema field added in this PR)
 *
 * Safety: dry run by default; backups of the city documents in
 * scripts/data/inventory-copy-2026-10-19/; ifRevisionID on every patch; one
 * transaction.
 *
 * Run:
 *   npx tsx scripts/seedInventoryCopy20261019.ts
 *   npx tsx scripts/seedInventoryCopy20261019.ts --execute
 *   npx tsx scripts/seedInventoryCopy20261019.ts --execute --facets-only
 *
 * The city copy uses tokens the frontend renders only from your-house-albania
 * PR #74 on: write it after that deploy, or the live city pages print
 * "{{listings:vlore}}". `--facets-only` is safe before it (facet documents
 * are new and nothing reads them yet).
 * then:
 *   npx tsx scripts/translateLocaleGaps.ts --execute --types catalogSeoPage
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.includes('--execute')
const facetsOnly = process.argv.includes('--facets-only')
const token = process.env.SANITY_API_TOKEN?.trim()
if (!token) {
  console.error('SANITY_API_TOKEN required in .env')
  process.exit(1)
}
const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token,
  useCdn: false,
})

type Copy = {intro: string; bottom: string[]}

const CITY_COPY: Record<string, Copy> = {
  'catalogSeoPage-city-city-vlore': {
    intro:
      'Flats, houses and villas for sale in Vlorë, from the Lungomare seafront to the streets behind the centre. {{listings:vlore}} homes are listed today, each with its price, floor area and photos.',
    bottom: [
      'Vlorë is two markets in one city. Published research put the average asking price at about €2,400/m² in 2025, up 25% in a year, which placed it beside Tirana at the top of Europe for growth. That average hides the spread. Lungomare, the seafront promenade, asks €2,500–3,500/m² and has doubled since 2022. Uji i Ftohtë, the coast just south of it, runs 20–25% below. The centre and the boulevard serve local buyers from about €800/m², and Orikum, at the far end of the bay, sits at €1,300–1,500.',
      'On Domlivo the city is still a small catalogue: {{flats:vlore}} of the {{listings:vlore}} listings are flats, starting at €{{from:vlore}}, and the {{count:vlore}} that state their area ask a median of €{{median:vlore}}/m². That is too few flats for a city figure, so judge each listing against the band of its own zone rather than against the median.',
      'One thing the prices already assume: Vlorë airport still had no scheduled flights in summer 2026. Before you buy, ask for the ownership extract from the cadastre (ASHK) and, for a finished building, the occupancy permit. Notary fees and taxes are calculated on the higher of the contract price and the state reference price.',
    ],
  },
  'catalogSeoPage-city-city-sarande': {
    intro:
      'Apartments for sale in Sarandë, from the promenade to the streets above the bay. {{listings:sarande}} homes are listed today, each with its price, floor area and photos.',
    bottom: [
      'Sarandë asks €2,000–2,500/m² for new build within a kilometre of the sea, and inside that figure the strip matters more than the town. Buzë Shëtitores, the first line along the promenade, runs €3,000–3,500/m², with resort apartments reaching €4,000. The centre is €1,600–1,800 for turnkey stock, up from about €1,200 in 2022–23. Ksamil, 15 km south, asks €1,800–3,000, more per square metre than Sarandë itself.',
      'Rental income decides most purchases here. About 430 short-term listings in Sarandë run at roughly 41% occupancy and Ksamil’s at about 38%, so a flat earns for part of the year and sits for the rest. Foreign demand fell by half in 2024 and by a further 30% in 2025 while prices kept rising, a gap worth understanding before you buy on this coast.',
      'On Domlivo the town is a small catalogue: {{flats:sarande}} flats from €{{from:sarande}}, with a median of €{{median:sarande}}/m² over the {{count:sarande}} that state their area. That is too few to stand for the whole town, so compare a listing with its zone’s band. Ask for the ownership extract from the cadastre (ASHK) and, for a finished building, the occupancy permit.',
    ],
  },
  'catalogSeoPage-city-city-shengjin': {
    intro:
      'Apartments for sale in Shëngjin, the resort town on the northern coast. {{listings:shengjin}} homes are listed today, each with its price, floor area and photos.',
    bottom: [
      'Shëngjin is one market: the seaside zone is effectively the whole town. Agency listings put asking prices at €1,100–2,000/m², with the mass segment at €1,100–1,500 and the top of the band made up of premium residences. Buyers are largely from Kosovo and the Albanian diaspora, and a flat typically takes three to three and a half months to sell.',
      'On Domlivo the {{count:shengjin}} flats that state their area ask a median of €{{median:shengjin}}/m², and the middle 60% of them sit between €{{p20:shengjin}} and €{{p80:shengjin}}. Flats start at €{{from:shengjin}} and the median flat asks €{{price:shengjin}} in total. It is a small sample, so read it as a description of what is listed here, not as an index for the town.',
      'The coast road to Velipojë opened in 2025 and cut the drive from 66 km to under 15, which puts a second long beach within reach. Before you buy, ask for the ownership extract from the cadastre (ASHK) and, for a finished building, the occupancy permit. Notary fees and taxes are calculated on the higher of the contract price and the state reference price.',
    ],
  },
  'catalogSeoPage-city-city-tirana': {
    intro:
      'Apartments, houses and villas for sale in Tirana. {{listings:tirana}} homes are listed today, each with its price, floor area and photos.',
    bottom: [
      'In Tirana, distance from the centre sets the price. Blloku is the top, at €3,000–5,500/m² for new build and €2,500–3,500 for resale. The centre and Pazari i Ri ask €2,300–3,500 new, Komuna e Parisit and the Artificial Lake €2,000–3,000. Past the ring the numbers roughly halve: Astir €1,200–1,500, Kashar €1,000–1,400, Paskuqan €800–1,200. Recorded sales draw the same line, €2,054/m² inside the Small Ring and €1,768 outside it in the second quarter of 2025.',
      'The market is flat after the boom. The Bank of Albania index showed no change in the second half of 2025 after a 56% rise the year before, the time to sell grew from 7.1 to 8.1 months, and sales close 3–5% below the asking price. A flat priced well under its district’s band needs an explanation, usually in its documents.',
      'On Domlivo the capital is still a small catalogue: {{flats:tirana}} flats from €{{from:tirana}}, and a median of €{{median:tirana}}/m² over the {{count:tirana}} that state their area, too few to stand for the city. Judge a listing by its district’s band, and ask for the ownership extract from the cadastre (ASHK) and the occupancy permit of a finished building.',
    ],
  },
}

const FACET_COPY: Record<string, Copy> = {
  '1-1': {
    intro:
      '1+1 apartments for sale in Durrës: one bedroom and a separate living room with the kitchen. {{listings:durres/1-1}} are listed today, from €{{from:durres/1-1}}.',
    bottom: [
      'In Albania 1+1 means one bedroom plus a living room, usually with an open kitchen. {{listings:durres/1-1}} of the {{flats:durres}} flats listed in the city are 1+1s. The median 1+1 here asks €{{price:durres/1-1}}, and the {{count:durres/1-1}} that state their area ask a median of €{{median:durres/1-1}}/m².',
      'Where the flat is matters more than its layout. The centre and the Currila–Vollga seafront ask €1,900–2,800/m², Plazh €1,200–1,700, Golem €1,100–1,500 and Mali i Robit €950–1,200, so the same 1+1 can cost twice as much a few kilometres north. Most flats on the beach strip are over 30 years old, and the 2019 earthquake hit that strip hardest: ask for the construction year and any post-earthquake assessment.',
      'If you plan to let it, mind the season. Short-let occupancy in Golem peaks at about 55% in August and falls to about 13% in January, so plan for a summer let and a winter tenancy rather than year-round short stays. For a building under construction, the listing states the price per m² and the handover date.',
    ],
  },
  '2-1': {
    intro:
      '2+1 apartments for sale in Durrës: two bedrooms and a living room with the kitchen. {{listings:durres/2-1}} are listed today, from €{{from:durres/2-1}}.',
    bottom: [
      'A 2+1 is the family layout in Albania: two bedrooms plus a living room with the kitchen. The median 2+1 in Durrës asks €{{price:durres/2-1}}, and the {{count:durres/2-1}} that state their area ask a median of €{{median:durres/2-1}}/m², against €{{median:durres}}/m² for every flat in the city.',
      'Choose the zone by how you will use the flat. To live in all year, the centre and Plazh are part of the city; the centre lets all year to local families and Tirana commuters and holds its price out of season, at €1,900–2,800/m² on the Currila–Vollga seafront and €1,200–1,700 in Plazh. Golem’s second line at €1,100–1,500 and Mali i Robit at €950–1,200 cost less and earn their money in summer.',
      'Check the building before the flat: its construction year, the occupancy permit (leje përdorimi) of a finished building, and whether the floors built match the permit. Budget roughly 3–4% of the price on top for the notary, the transfer tax and registration with the cadastre.',
    ],
  },
  'near-the-sea': {
    intro:
      'Homes for sale in Durrës within 300 metres of the sea or on the first line. {{listings:durres/near-the-sea}} are listed today, each with its stated distance to the beach.',
    bottom: [
      'This page lists homes whose listing states a walk of 300 metres or less to the beach, or a first-line position: a few minutes on foot. Along Durrës that covers the Currila–Vollga–Taulantia seafront by the centre, the long beach strip of Plazh and Shkëmbi i Kavajës, and Golem, Mali i Robit and Qerret further south.',
      'The distance to the sea is priced in, and so is the zone. The centre’s seafront asks €1,900–2,800/m², Plazh €1,200–1,700, Golem €1,100–1,500 on its second and third line, and old stock in Shkëmbi i Kavajës €450–800. The {{count:durres/near-the-sea}} flats here that state their area ask a median of €{{median:durres/near-the-sea}}/m², with flats from €{{from:durres/near-the-sea}}.',
      'Most flats on the beach strip are over 30 years old, and the 2019 earthquake did its worst damage there. Ask for the construction year, any post-earthquake assessment and an independent engineer’s opinion. A flat by the sea lets well in summer: our sources put gross short-let yield in Plazh at 7–11%, the best in Durrës, but occupancy in the beach zones falls to about 13% in January.',
    ],
  },
  'new-builds': {
    intro:
      'New-build apartments for sale in Durrës, off-plan or under construction. {{listings:durres/new-builds}} are listed today, each with the price per m² and the handover date where the developer gives one.',
    bottom: [
      'Buying off-plan means paying for a flat in a building that is not finished, so the checks are about the developer and the permit as much as the flat. The {{count:durres/new-builds}} flats here that state their area ask a median of €{{median:durres/new-builds}}/m², against €{{median:durres}}/m² for every flat in the city, and start at €{{from:durres/new-builds}}.',
      'Check the building permit (leje ndërtimi) and that the floors being built match it, the developer’s finished projects, and what the contract says about the handover date and about a delay. The cautionary case is in Durrës itself: in May 2026 the construction inspectorate confirmed that two built towers of the marina project had settled by 28 and 18 cm, and sales there began before the permits.',
      'Prices still follow the zone: €1,900–2,800/m² in the centre and on the Currila–Vollga seafront, €1,200–1,700 in Plazh, €1,100–1,500 in Golem. Qerret, at €1,100–2,500, has been the fastest-appreciating zone, up 21–43% in a year. Once the flat is handed over, ask for the occupancy permit (leje përdorimi) before the final contract at the notary.',
    ],
  },
  'under-100k': {
    intro:
      'Flats and studios for sale in Durrës at €100,000 or less. {{listings:durres/under-100k}} are listed today, from €{{from:durres/under-100k}}.',
    bottom: [
      'In Durrës €100,000 still buys a flat by the sea, and the zone decides how much flat. On the centre’s seafront at €1,900–2,800/m² it is a studio or a small 1+1; in Plazh at €1,200–1,700 a 1+1 of 60–80 m²; in Golem or Mali i Robit, at €950–1,500, 70–100 m². Entry prices in Vlorë and Sarandë are one and a half to two times higher.',
      'The median flat on this page asks €{{price:durres/under-100k}}, and the {{count:durres/under-100k}} that state their area ask a median of €{{median:durres/under-100k}}/m², against €{{median:durres}}/m² for every flat in the city. A price well below its zone’s band usually has a reason, most often the building’s age or its papers.',
      'On the beach strip a low price often means an older building: most flats there are over 30 years old, and the 2019 earthquake hit the strip hardest. Get the construction year and the ownership extract from the cadastre (ASHK), and budget roughly 3–4% on top of the price for the notary, the transfer tax and registration.',
    ],
  },
}

const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl', 'de'] as const

function words(text: string): number {
  return (text.match(/\S+/g) ?? []).length
}

async function main() {
  const backupDir = path.resolve(process.cwd(), 'scripts/data/inventory-copy-2026-10-19')
  const cityIds = facetsOnly ? [] : Object.keys(CITY_COPY)
  const existing = await client.fetch<Array<{_id: string; _rev: string; intro?: unknown; bottomText?: unknown}>>(
    `*[_id in $ids]{_id, _rev, intro, bottomText}`,
    {ids: cityIds.length ? cityIds : ['-']},
  )
  const tx = client.transaction()
  for (const id of cityIds) {
    const doc = existing.find((d) => d._id === id)
    if (!doc) throw new Error(`missing ${id}`)
    const copy = CITY_COPY[id]
    const total = words(copy.intro) + copy.bottom.reduce((n, p) => n + words(p), 0)
    console.log(`${id}: ${total} words (en); replaces ${LOCALES.length} locales of the stub`)
    tx.patch(id, (p) =>
      p.ifRevisionId(doc._rev).set({intro: {en: copy.intro}, bottomText: {en: copy.bottom.join('\n\n')}}),
    )
  }
  for (const [facet, copy] of Object.entries(FACET_COPY)) {
    const id = `catalogSeoPage-facet-durres-${facet}`
    const total = words(copy.intro) + copy.bottom.reduce((n, p) => n + words(p), 0)
    console.log(`${id}: ${total} words (en), new document`)
    tx.createOrReplace({
      _id: id,
      _type: 'catalogSeoPage',
      pageScope: 'facet',
      city: {_type: 'reference', _ref: 'city-durres'},
      facet,
      active: true,
      intro: {en: copy.intro},
      bottomText: {en: copy.bottom.join('\n\n')},
    })
  }
  if (!execute) {
    console.log('\nDry run. Pass --execute to write.')
    return
  }
  fs.mkdirSync(backupDir, {recursive: true})
  fs.writeFileSync(path.join(backupDir, 'city-docs-before.json'), JSON.stringify(existing, null, 2))
  const res = await tx.commit()
  console.log(`committed ${res.results.length} mutations, transaction ${res.transactionId}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
