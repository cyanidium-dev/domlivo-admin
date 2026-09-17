/**
 * Sanity checks over the imported facts, mirroring the research audit
 * (12-ai-database/28-data-quality-audit.md §2): a stored value that is
 * implausible for its unit is a parsing error, not a market finding.
 *
 * Read-only. Run: npx tsx scripts/knowledge/auditKnowledgeFacts.ts
 */
import {getSanityClientForScripts} from '../lib/sanityEnvClient'

type Row = {
  dataId: string
  category: string
  value?: number
  unit: string
  valueText?: string
  confidence: string
}

/** [name, does this row look wrong] */
const CHECKS: Array<[string, (r: Row) => boolean]> = [
  [
    'monthly rent under 50 EUR',
    (r) =>
      /month/i.test(r.unit) &&
      !/%/.test(r.unit) &&
      /rental/i.test(r.category) &&
      (r.value ?? 99) < 50,
  ],
  [
    // Scoped to sale prices: renovation work and monthly rent per m² are
    // legitimately single-digit figures and flagging them is noise.
    'sale price per m² under 100 EUR',
    (r) =>
      r.category === 'property_prices' &&
      /m2|m²/i.test(r.unit) &&
      /EUR/i.test(r.unit) &&
      !/month/i.test(r.unit) &&
      (r.value ?? 999) < 100,
  ],
  ['electricity tariff outside 0.05–0.30 EUR/kWh', (r) => /kwh/i.test(r.unit) && /EUR/i.test(r.unit) && r.category === 'electricity' && (r.value ?? 0.1) > 0.3],
  ['percentage above 100', (r) => r.unit.trim() === '%' && (r.value ?? 0) > 100],
  ['value missing entirely', (r) => r.value === undefined && !r.valueText],
  ['unit still in lek while value is normalised', (r) => /\b(ALL|lek)\b/i.test(r.unit) && (r.value ?? 0) > 0 && (r.value ?? 0) < 5],
]

async function main() {
  const client = getSanityClientForScripts()
  const rows = await client.fetch<Row[]>(
    `*[_type == "knowledgeFact" && isCurrent == true]{dataId, category, value, unit, valueText, confidence}`,
  )
  console.log(`${rows.length} current facts\n`)
  let flagged = 0
  for (const [name, predicate] of CHECKS) {
    const hits = rows.filter(predicate)
    flagged += hits.length
    console.log(`${String(hits.length).padStart(4)}  ${name}`)
    hits.slice(0, 6).forEach((r) =>
      console.log(`        ${r.dataId}  ${r.value} ${r.unit}  — ${(r.valueText || '').slice(0, 70)}`),
    )
  }
  console.log(`\n${flagged} rows flagged.`)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
