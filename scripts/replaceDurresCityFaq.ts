/**
 * Replaces the FAQ on the Durrës city landing (`/albania/durres/info`) —
 * 2026-09-16.
 *
 * The twelve questions there were seed copy that answered nothing ("Yes —
 * especially for properties near the sea with good access"), on the page that
 * carries the FAQPage markup for the site's largest market. The new eleven
 * answer with the figures the rest of the site already publishes (zoneMetrics,
 * knowledge-base/02-cities/durres.md, 05-legal) and link the comparisons and
 * research posts that go deeper.
 *
 * Source: `scripts/data/durresCityFaq-2026-09-16/faq.<locale>.md`. Checked
 * before writing: six locales, same number of pairs, questions ending in "?",
 * the same links per answer, and every internal link answering 200.
 *
 * The section's _key, title and settings are kept; only `items` is replaced.
 * Backup, ifRevisionID.
 *
 * Run:
 *   npx tsx scripts/replaceDurresCityFaq.ts
 *   npx tsx scripts/replaceDurresCityFaq.ts --execute
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

const DOC_ID = 'landing-durres'
const DIR = path.resolve(process.cwd(), 'scripts/data/durresCityFaq-2026-09-16')
const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl'] as const
type Pair = {q: string; a: string}

function parse(locale: string): Pair[] {
  const text = fs.readFileSync(path.join(DIR, `faq.${locale}.md`), 'utf8').replace(/\r\n/g, '\n')
  return text
    .split(/\n\s*\n/)
    .map((chunk) => /^\*\*(.+?)\*\*\s*\n([\s\S]+)$/.exec(chunk.trim()))
    .filter((m): m is RegExpExecArray => Boolean(m))
    .map((m) => ({q: plainTextFromInline(m[1].trim()), a: m[2].trim().replace(/\s*\n+\s*/g, ' ')}))
}

const links = (s: string) => [...s.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]).sort().join(' ')

async function main(): Promise<void> {
  const byLocale = Object.fromEntries(LOCALES.map((l) => [l, parse(l)])) as Record<(typeof LOCALES)[number], Pair[]>
  const problems: string[] = []
  const en = byLocale.en
  for (const l of LOCALES) {
    if (byLocale[l].length !== en.length) problems.push(`${l}: ${byLocale[l].length} pairs, en has ${en.length}`)
    byLocale[l].forEach((p, i) => {
      if (!p.q.endsWith('?')) problems.push(`${l} #${i}: question without "?"`)
      if (en[i] && links(p.a) !== links(en[i].a)) problems.push(`${l} #${i}: links differ from en`)
    })
  }
  const internal = [...new Set(en.flatMap((p) => [...p.a.matchAll(/\]\((\/[^)]+)\)/g)].map((m) => m[1])))]
  for (const href of internal) {
    const res = await fetch(`https://www.domlivo.com/en${href}`, {redirect: 'manual', signal: AbortSignal.timeout(60_000)})
    if (res.status !== 200) problems.push(`link ${href} answers ${res.status}`)
  }
  if (problems.length) {
    console.error(problems.join('\n'))
    process.exit(1)
  }

  const doc = await client.fetch<{_id: string; _rev: string; pageSections: Array<{_key: string; _type: string}>}>(
    `*[_id==$id][0]`,
    {id: DOC_ID},
  )
  if (await client.fetch(`count(*[_id==$id])`, {id: `drafts.${DOC_ID}`})) throw new Error('a draft exists')
  const faq = doc.pageSections.find((s) => s._type === 'faqSection')
  if (!faq) throw new Error('no faqSection on the Durrës landing')

  const items = en.map((_, i) => ({
    _key: `durres-faq-2026-09-16-${i}`,
    _type: 'localizedFaqItemRich',
    question: {_type: 'localizedString', ...Object.fromEntries(LOCALES.map((l) => [l, byLocale[l][i].q]))},
    answer: Object.fromEntries(LOCALES.map((l) => [l, markdownToPortableText(byLocale[l][i].a)])),
  }))
  for (const [i, p] of en.entries()) console.log(`${i + 1}. ${p.q} (${p.a.split(/\s+/).length} words)`)

  if (!execute) {
    console.log(`\nDry run: ${items.length} items would replace the current FAQ.`)
    return
  }
  const dir = path.resolve(process.cwd(), 'scripts/data/backups')
  fs.mkdirSync(dir, {recursive: true})
  fs.writeFileSync(path.join(dir, `landing-durres-faq-${Date.now()}.json`), JSON.stringify(doc, null, 2))
  const res = await client
    .patch(DOC_ID)
    .ifRevisionId(doc._rev)
    .set({[`pageSections[_key=="${faq._key}"].items`]: items})
    .commit()
  console.log(`Written, revision ${res._rev}.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
