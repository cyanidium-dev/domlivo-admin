/**
 * Answer blocks on the city price pages (`/{country}/{city}/info`) — 2026-09-21.
 *
 * An FAQ answer that a search engine or an assistant can lift has to answer in
 * its first 40–80 words, number first. This script rewrites the answers that
 * did not, and nothing else: the questions (which may already rank), the
 * section title, the item keys and their order all stay as they are.
 *
 * What was found on the four pages:
 * - landing-durres: eleven answers written on 2026-09-16, already answer-first.
 *   No file, nothing patched.
 * - landing-tirana: eighteen seed answers of 11–17 words, some with figures no
 *   source supports ("3–5% per year", "5–7% rental returns"), and no Polish
 *   answers at all. Eleven are rewritten from the knowledge base (02-cities/
 *   tirana.md, 03-districts, 05-legal, 12-ai-database 19/20); the other seven
 *   are navigational ("use the filters") and have no figure to lead with.
 * - landing-vlore, landing-sarande: no faqSection. Nothing to rewrite, and
 *   adding a section is outside this script.
 *
 * Source: `scripts/data/cityFaqAnswerBlocks-2026-09-21/<docId>.<locale>.md`:
 *   ## <item _key>
 *   > the question, for the reader of the file (ignored)
 *   the answer, one paragraph, markdown links allowed
 *
 * Checked before writing: every locale has the same item keys; every key exists
 * on the document; answers are 35–80 words; every answer carries the same links
 * as the English one; every number above 12 in a locale answer is also in the
 * English answer; internal links answer 200 in every locale (one request a
 * second).
 *
 * Dry run prints the previous and the new text of every answer. With
 * --execute: snapshot of the document into scripts/data/backups/, then ONE
 * transaction per document, guarded by ifRevisionID.
 *
 * Run:
 *   npx tsx scripts/patchCityFaqAnswerBlocks.ts
 *   npx tsx scripts/patchCityFaqAnswerBlocks.ts --execute
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {markdownToPortableText, plainTextFromInline} from '../lib/articleLoader/markdownToPt'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const execute = process.argv.includes('--execute')
const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

const SITE = 'https://www.domlivo.com'
const DIR = path.resolve(process.cwd(), 'scripts/data/cityFaqAnswerBlocks-2026-09-21')
const DOCS = ['landing-tirana']
const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl', 'de'] as const
type Locale = (typeof LOCALES)[number]
const SMALL_FREE = 12

function parse(file: string): Map<string, string> {
  const out = new Map<string, string>()
  let key: string | null = null
  for (const line of fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n')) {
    const m = /^## (\S+)\s*$/.exec(line)
    if (m) {
      key = m[1]
      out.set(key, '')
    } else if (key && line.trim() && !line.startsWith('>')) {
      out.set(key, `${out.get(key)} ${line.trim()}`.trim())
    }
  }
  return out
}

const links = (s: string) => [...s.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1])
const numbersIn = (text: string) =>
  [...text.replace(/\]\([^)]+\)/g, ']').matchAll(/\d{1,3}(?:[.,   ]\d{3})+(?!\d)|\d+/g)].map((m) => Number(m[0].replace(/\D/g, '')))

type Block = {children?: Array<{text?: string}>}
const plain = (blocks: unknown): string =>
  Array.isArray(blocks) ? (blocks as Block[]).map((b) => (b.children ?? []).map((c) => c.text ?? '').join('')).join(' ') : String(blocks ?? '')

async function main(): Promise<void> {
  const problems: string[] = []
  const internal = new Set<string>()
  const plans: Array<{id: string; rev: string; doc: unknown; sets: Record<string, unknown>}> = []

  for (const id of DOCS) {
    const byLocale = {} as Record<Locale, Map<string, string>>
    for (const l of LOCALES) {
      const file = path.join(DIR, `${id}.${l}.md`)
      if (!fs.existsSync(file)) problems.push(`${id}: no ${l} file`)
      else byLocale[l] = parse(file)
    }
    if (LOCALES.some((l) => !byLocale[l])) continue
    const en = byLocale.en
    for (const l of LOCALES) {
      if ([...byLocale[l].keys()].join(' ') !== [...en.keys()].join(' ')) problems.push(`${id}.${l}: item keys differ from en`)
    }

    const doc = await client.fetch<{
      _id: string
      _rev: string
      pageSections: Array<{_key: string; _type: string; items?: Array<{_key: string; question: Record<string, string>; answer: Record<string, unknown>}>}>
    }>(`*[_id==$id][0]`, {id})
    if (!doc) {
      problems.push(`${id}: no such document`)
      continue
    }
    if (await client.fetch<number>(`count(*[_id==$id])`, {id: `drafts.${id}`})) problems.push(`${id}: a draft exists; publish or discard it first`)
    const faq = doc.pageSections.find((s) => s._type === 'faqSection')
    if (!faq?.items) {
      problems.push(`${id}: no faqSection`)
      continue
    }

    const sets: Record<string, unknown> = {}
    for (const [key, enAnswer] of en) {
      const item = faq.items.find((i) => i._key === key)
      if (!item) {
        problems.push(`${id}: no FAQ item ${key}`)
        continue
      }
      const enLinks = links(enAnswer).sort().join(' ')
      for (const href of links(enAnswer)) {
        if (href.startsWith('/api/')) problems.push(`${id} ${key}: an /api/ path is not a link target`)
        else if (href.startsWith('/')) internal.add(href)
      }
      const allowed = new Set(numbersIn(enAnswer))
      console.log(`\n=== ${id} · ${key} · ${item.question.en}`)
      for (const l of LOCALES) {
        const answer = byLocale[l].get(key) ?? ''
        const words = plainTextFromInline(answer).split(/\s+/).filter(Boolean).length
        if (words < 35 || words > 80) problems.push(`${id}.${l} ${key}: ${words} words, wants 35–80`)
        if (!/[.!?]$/.test(answer)) problems.push(`${id}.${l} ${key}: does not end with a full sentence`)
        if (links(answer).sort().join(' ') !== enLinks) problems.push(`${id}.${l} ${key}: links differ from en`)
        const stray = [...new Set(numbersIn(answer).filter((n) => n > SMALL_FREE && !allowed.has(n)))]
        if (stray.length) problems.push(`${id}.${l} ${key}: numbers the English answer does not have: ${stray.join(', ')}`)
        if (!item.question[l]) problems.push(`${id}.${l} ${key}: the question has no ${l} value`)
        console.log(`  [${l}] before: ${plain(item.answer?.[l]) || '(none)'}`)
        console.log(`  [${l}] after (${words}w): ${plainTextFromInline(answer)}`)
        sets[`pageSections[_key=="${faq._key}"].items[_key=="${key}"].answer.${l}`] = markdownToPortableText(answer)
      }
    }
    plans.push({id, rev: doc._rev, doc, sets})
  }

  if (problems.length === 0 || process.argv.includes('--check-links')) {
    for (const href of internal) {
      for (const l of LOCALES) {
        const res = await fetch(`${SITE}/${l}${href}`, {redirect: 'manual', signal: AbortSignal.timeout(60_000)})
        if (res.status !== 200) problems.push(`internal link /${l}${href} answers ${res.status}`)
        await new Promise((r) => setTimeout(r, 1000))
      }
    }
  }
  if (problems.length) {
    console.error(`\n${problems.length} problem(s):\n${problems.join('\n')}`)
    process.exit(1)
  }

  for (const p of plans) console.log(`\n${p.id}: ${Object.keys(p.sets).length} answer values to set, revision ${p.rev}`)
  if (!execute) {
    console.log('\nDry run. Re-run with --execute.')
    return
  }
  const dir = path.resolve(process.cwd(), 'scripts/data/backups')
  fs.mkdirSync(dir, {recursive: true})
  for (const p of plans) {
    fs.writeFileSync(path.join(dir, `${p.id}-faq-answers-${Date.now()}.json`), JSON.stringify(p.doc, null, 2))
    const res = await client.transaction().patch(p.id, (patch) => patch.ifRevisionId(p.rev).set(p.sets)).commit()
    console.log(`${p.id}: written in transaction ${res.transactionId}.`)
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
