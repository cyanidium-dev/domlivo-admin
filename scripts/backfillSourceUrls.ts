/**
 * Backfills real, verified URLs onto a handful of `sources[]` entries across
 * the six 2026-08-24 blog post drafts — the institutional/official
 * citations that map to one stable page, found via web search and checked
 * by hand (not guessed): Bank of Albania, INSTAT, Deloitte, the EU Rule of
 * Law Report, PwC Albania, HLB Albania, ASHK.
 *
 * Deliberately NOT exhaustive. Left without a URL: the four internal KB
 * citations (no page exists to link), and citations describing a
 * methodology across several local outlets (e.g. "AirROI, AirBtics, AirDNA
 * — Durrës market data") or a single local news article this script can't
 * verify is the exact one originally read during KB research — attaching a
 * plausible-looking but unverified link would be worse than no link.
 * `sourceItem.url` is optional now (see sourceItem.ts), so those entries
 * are valid as-is.
 *
 * Matches by exact label text, one draft/label pair per entry below, so a
 * label that doesn't match anything is silently skipped rather than
 * guessed at.
 *
 * Run:
 *   npm run backfill:source-urls
 *   npm run backfill:source-urls -- --execute
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.slice(2).includes('--execute')

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

const BOA_HPI = 'https://www.bankofalbania.org/Financial_Stability/Analysis_and_studies/Surveys/Survey_on_the_developments_in_the_real_estate_market_in_Albania.html'
const DELOITTE = 'https://www.deloitte.com/cz-sk/en/Industries/real-estate/research/property-index.html'
const INSTAT_CONSTRUCTION = 'https://www.instat.gov.al/en/themes/industry-trade-and-services/construction/'
const EU_ROL_ALBANIA = 'https://commission.europa.eu/document/download/3732ae59-5ab4-48a6-a3e6-0ef9aa593863_en?filename=2025+Rule+of+Law+Report+-+Country+Chapter+Albania.pdf'
const PWC_OTHER_TAXES = 'https://taxsummaries.pwc.com/albania/individual/other-taxes'
const PWC_INCOME_DETERMINATION = 'https://taxsummaries.pwc.com/albania/individual/income-determination'
const HLB_STR = 'https://www.hlb.al/short-term-rentals-in-albania-new-tax-reporting-obligations-from-2026/'
const ASHK_1557 = 'https://www.ashk.gov.al/wp-content/uploads/2024/10/udhezim-2024-09-18-1557.pdf'

const BACKFILL: Array<{slug: string; label: string; url: string}> = [
  {slug: 'best-areas-to-buy-property-in-tirana', label: 'Bank of Albania Housing Price Index, H2 2025 release', url: BOA_HPI},
  {slug: 'best-areas-to-buy-property-in-tirana', label: 'Deloitte Property Index 2025', url: DELOITTE},
  {slug: 'market-outlook-2025', label: 'Bank of Albania Housing Price Index, H1 and H2 2025 releases', url: BOA_HPI},
  {slug: 'market-outlook-2025', label: 'Deloitte Property Index 2025', url: DELOITTE},
  {slug: 'market-outlook-2025', label: 'INSTAT building permits report, 2025', url: INSTAT_CONSTRUCTION},
  {slug: 'buying-property-albania', label: 'EU Rule of Law Report 2025, Albania country chapter', url: EU_ROL_ALBANIA},
  {slug: 'buying-property-albania', label: 'PwC Albania tax summaries, other taxes', url: PWC_OTHER_TAXES},
  {slug: 'legal-guide-buyers', label: 'PwC Albania tax summaries, individual income determination', url: PWC_INCOME_DETERMINATION},
  {slug: 'legal-guide-buyers', label: 'HLB Albania, short-term rental reporting obligations from 2026', url: HLB_STR},
  {slug: 'buying-property-albania', label: 'ASHK Udhëzim 1557, 18.09.2024', url: ASHK_1557},
  {slug: 'short-term-rental-albanian-riviera', label: 'HLB Albania, short-term rental tax reporting obligations from 2026', url: HLB_STR},
]

async function main(): Promise<void> {
  const bySlug = new Map<string, typeof BACKFILL>()
  for (const b of BACKFILL) {
    if (!bySlug.has(b.slug)) bySlug.set(b.slug, [])
    bySlug.get(b.slug)!.push(b)
  }

  for (const [slug, entries] of bySlug) {
    const id = `drafts.blogPost-${slug}`
    const doc = await client.fetch(`*[_id==$id][0]{_id, sources}`, {id})
    if (!doc) {
      console.log(`${slug}: DRAFT NOT FOUND`)
      continue
    }
    const sources = (doc.sources ?? []) as Array<{_key: string; label: string; url?: string}>
    const patch: Record<string, string> = {}
    for (const {label, url} of entries) {
      const match = sources.find((s) => s.label === label)
      if (!match) {
        console.log(`${slug}: NO MATCH for label "${label}"`)
        continue
      }
      patch[`sources[_key=="${match._key}"].url`] = url
      console.log(`${slug}: ${match._key} → ${url}`)
    }
    if (Object.keys(patch).length === 0) continue
    if (!execute) continue
    await client.patch(id).set(patch).commit()
    console.log(`  written to ${id}`)
  }

  if (!execute) console.log('\nDry run. Re-run with --execute to write.')
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
