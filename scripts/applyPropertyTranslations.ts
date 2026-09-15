/**
 * Write listing copy that was produced outside the API into Sanity.
 *
 * `translateProperties.ts` calls Claude over the Anthropic API and stopped
 * halfway through the get.al import when that account ran out of credit. This
 * script takes the same result from a JSON file instead, so the copy can be
 * written by hand (or by the assistant in the session) and pushed without an
 * API key.
 *
 * Input: a JSON array, one entry per listing.
 *
 *   [
 *     {
 *       "id": "property-getal-1036",
 *       "title":            {"en": "…", "sq": "…", "ru": "…", "uk": "…", "it": "…", "pl": "…"},
 *       "shortDescription": {"en": "…", …},
 *       "description":      {"en": "…", …}
 *     }
 *   ]
 *
 * Every locale of every field must be present and non-empty: a half-written
 * listing renders as Albanian on the Russian page, which is the problem this
 * is meant to end. Entries that fail the check are reported and skipped, and
 * the rest are still written.
 *
 * Run:
 * - npx tsx scripts/applyPropertyTranslations.ts --file <path> --dry
 * - npx tsx scripts/applyPropertyTranslations.ts --file <path> --execute
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN?.trim(),
})

const args = process.argv.slice(2)
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')
const fileArg = args.includes('--file') ? args[args.indexOf('--file') + 1] : ''
if (!isDry && !isExecute) {
  console.error('Use --dry or --execute.')
  process.exit(1)
}
if (!fileArg) {
  console.error('Pass --file <path to the translations JSON>.')
  process.exit(1)
}

const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl'] as const
const FIELDS = ['title', 'shortDescription', 'description'] as const
type Locale = (typeof LOCALES)[number]
type Field = (typeof FIELDS)[number]
type Entry = {id: string} & Partial<Record<Field, Partial<Record<Locale, string>>>>

/** Cyrillic where Cyrillic belongs, Latin where it does not. */
const SCRIPT_CHECK: Partial<Record<Locale, RegExp>> = {
  ru: /[А-Яа-яЁё]/,
  uk: /[А-Яа-яІіЇїЄєҐґ]/,
}

function problemsWith(entry: Entry): string[] {
  const out: string[] = []
  if (!entry.id || !/^property-/.test(entry.id)) out.push('missing or malformed id')
  for (const f of FIELDS) {
    const map = entry[f]
    if (!map) {
      out.push(`${f}: missing`)
      continue
    }
    for (const l of LOCALES) {
      const v = (map[l] ?? '').trim()
      if (!v) {
        out.push(`${f}.${l}: empty`)
        continue
      }
      const script = SCRIPT_CHECK[l]
      if (script && !script.test(v)) out.push(`${f}.${l}: not in the expected script`)
    }
  }
  // Russian and Ukrainian are different languages; identical strings mean one
  // was pasted into the other.
  for (const f of FIELDS) {
    const ru = (entry[f]?.ru ?? '').trim()
    const uk = (entry[f]?.uk ?? '').trim()
    if (ru && uk && ru === uk) out.push(`${f}: ru and uk are identical`)
  }
  return out
}

async function main() {
  const file = path.resolve(fileArg)
  if (!fs.existsSync(file)) {
    console.error(`No such file: ${file}`)
    process.exit(1)
  }
  const entries: Entry[] = JSON.parse(fs.readFileSync(file, 'utf8'))
  console.log(`${entries.length} entries in ${path.basename(file)}\n`)

  const ids = entries.map((e) => e.id)
  const existing = await client.fetch<string[]>(`*[_id in $ids]._id`, {ids})
  const known = new Set(existing)

  const good: Entry[] = []
  const bad: Array<{id: string; problems: string[]}> = []
  for (const e of entries) {
    const problems = problemsWith(e)
    if (!known.has(e.id)) problems.push('no such document in Sanity')
    if (problems.length) bad.push({id: e.id, problems})
    else good.push(e)
  }

  console.log(`  ready to write: ${good.length}`)
  if (bad.length) {
    console.log(`  rejected:       ${bad.length}`)
    for (const b of bad.slice(0, 12)) console.log(`    ${b.id}: ${b.problems.slice(0, 4).join('; ')}`)
    if (bad.length > 12) console.log(`    … and ${bad.length - 12} more`)
  }

  if (isDry) {
    for (const e of good.slice(0, 3)) {
      console.log(`\n  ${e.id}`)
      for (const l of LOCALES) console.log(`    ${l}: ${(e.title?.[l] ?? '').slice(0, 70)}`)
    }
    console.log('\nDry run — nothing written.')
    return
  }

  let written = 0
  for (const e of good) {
    const set: Record<string, string> = {}
    for (const f of FIELDS) for (const l of LOCALES) set[`${f}.${l}`] = (e[f]![l] ?? '').trim()
    await client.patch(e.id).set(set).commit()
    written += 1
    if (written % 10 === 0 || written === good.length) console.log(`  ${written}/${good.length}`)
  }
  console.log(`\nWrote ${written} listings × ${LOCALES.length} locales × ${FIELDS.length} fields.`)
  if (bad.length) console.log(`${bad.length} were rejected and left untouched.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
