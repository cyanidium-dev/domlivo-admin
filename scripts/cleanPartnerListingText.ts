/**
 * Strip the partner agencies' ad furniture from listing descriptions.
 *
 * The findall.al text came through translation with its social-media dress
 * still on: emoji bullets ("🏢 Floor: 4"), a price line that goes stale the day
 * the price field changes ("💰 Price: 68,000 €"), and a sign-off block —
 * "📞 For more information:", "Call | What's app | Viber | DM", "Your trusted
 * partner for properties on the Albanian coast", the agency's name. On our
 * page that block tells a buyer to phone somebody else.
 *
 * Rules, per locale:
 *  - price lines (💰, or "Price:" in any locale) are dropped: the page shows
 *    the price field, and a price in prose goes stale the day it changes;
 *  - everything from the first contact or sign-off line to the end is dropped.
 *    English is where the sign-off is recognisable ("trusted partner", "look
 *    forward", "Call |", 📞); the other locales are line-for-line translations,
 *    so they are cut at the same line when their line count matches, and
 *    otherwise at their own first contact marker;
 *  - remaining emoji are removed, the words they decorated are kept.
 *
 * Run:
 * - npx tsx scripts/cleanPartnerListingText.ts            (dry run, prints samples)
 * - npx tsx scripts/cleanPartnerListingText.ts --execute  (writes; backup first)
 */
import fs from 'node:fs'
import path from 'node:path'
import {getSanityClientForScripts} from './lib/sanityEnvClient'

const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl', 'de'] as const
const FIELDS = ['description', 'shortDescription'] as const

const CONTACT = /📞|📲|☎|call\s*\||whats\s*app|what's app|viber|\+355|^\s*(phone|tel|телефон|telefon|telefono)\s*:/i
const SIGNOFF_EN = /trusted partner|look forward|real estate agency in albania|find the property you/i
// "💰 Price: …" or a bare "Price: 900.000€" line, in any of the site's languages.
const PRICE = /💰|^\s*[-–•]?\s*(price|цена|ціна|cena|preis|kaufpreis|prezzo|çmimi)\s*:/i
const EMOJI = /[\u{1F100}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{2B50}\u{2B06}\u{2194}-\u{21FF}]/gu

type Localized = Partial<Record<string, string>>

export function cutIndex(lines: string[], locale: string, enCut: number | null, enLineCount: number): number | null {
  if (locale !== 'en' && enCut !== null && lines.length === enLineCount) return enCut
  const i = lines.findIndex((l) => CONTACT.test(l) || (locale === 'en' && SIGNOFF_EN.test(l)))
  return i >= 0 ? i : null
}

export function cleanText(text: string, cut: number | null): string {
  const lines = text.split('\n')
  const kept = (cut === null ? lines : lines.slice(0, cut))
    .filter((l) => !PRICE.test(l))
    .map((l) => l.replace(EMOJI, '').replace(/[ \t]{2,}/g, ' ').replace(/^\s*[-–]\s*$/, '').trimEnd())
    .map((l) => l.replace(/^(\s*[-–•]?\s*)\s+/, '$1'))
  return kept
    .join('\n')
    .replace(/_{3,}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function cleanLocalized(value: Localized | undefined): Localized | undefined {
  if (!value) return undefined
  const en = value.en ?? ''
  const enLines = en.split('\n')
  const enCut = cutIndex(enLines, 'en', null, enLines.length)
  const out: Localized = {}
  let changed = false
  for (const locale of LOCALES) {
    const v = value[locale]
    if (typeof v !== 'string') continue
    const lines = v.split('\n')
    const next = cleanText(v, cutIndex(lines, locale, enCut, enLines.length))
    out[locale] = next
    if (next !== v) changed = true
  }
  return changed ? out : undefined
}

async function main() {
  const execute = process.argv.includes('--execute')
  const client = getSanityClientForScripts()
  const rows: Array<{_id: string} & Record<(typeof FIELDS)[number], Localized | undefined>> = await client.fetch(
    `*[_type == "property" && (_id match "property-findall-*" || _id match "property-getal-*")]{_id, description, shortDescription}`,
  )

  const patches: Array<{id: string; set: Record<string, string>}> = []
  for (const row of rows) {
    const set: Record<string, string> = {}
    for (const field of FIELDS) {
      const cleaned = cleanLocalized(row[field])
      if (!cleaned) continue
      for (const [l, v] of Object.entries(cleaned)) if (v !== row[field]?.[l]) set[`${field}.${l}`] = v as string
    }
    if (Object.keys(set).length) patches.push({id: row._id, set})
  }

  console.log(`${rows.length} partner listings, ${patches.length} to clean, ${patches.reduce((n, p) => n + Object.keys(p.set).length, 0)} values`)
  if (process.argv.includes("--keys")) for (const p of patches) console.log(p.id, Object.keys(p.set).join(" "), JSON.stringify(Object.values(p.set)[0]).slice(0, 160))
  for (const p of patches.slice(0, 3)) {
    const row = rows.find((r) => r._id === p.id)!
    console.log(`\n=== ${p.id}\n--- before (en)\n${row.description?.en?.slice(-600)}\n--- after (en)\n${(p.set['description.en'] ?? '(unchanged)').slice(-600)}\n--- after (ru)\n${(p.set['description.ru'] ?? '(unchanged)').slice(-400)}`)
  }
  if (!execute) {
    console.log('\nDry run. Pass --execute to write.')
    return
  }

  const backupDir = path.resolve(process.cwd(), '..', 'domlivo-workspace', 'backups')
  fs.mkdirSync(backupDir, {recursive: true})
  const file = path.join(backupDir, `partner-text-before-clean-${Date.now()}.json`)
  fs.writeFileSync(file, JSON.stringify(rows.filter((r) => patches.some((p) => p.id === r._id)), null, 1))
  console.log(`Backup: ${file}`)

  const drafts: string[] = await client.fetch(`*[_id in $ids]._id`, {ids: patches.map((p) => `drafts.${p.id}`)})
  const tx = client.transaction()
  for (const p of patches) {
    tx.patch(p.id, (q) => q.set(p.set))
    if (drafts.includes(`drafts.${p.id}`)) tx.patch(`drafts.${p.id}`, (q) => q.set(p.set))
  }
  const res = await tx.commit()
  console.log(`Patched ${patches.length} listings (${drafts.length} drafts), transaction ${res.transactionId}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
