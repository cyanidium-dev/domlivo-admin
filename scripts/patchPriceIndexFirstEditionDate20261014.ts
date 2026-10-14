/**
 * One-shot, 2026-10-14. The October price index FAQ "How often is it updated?"
 * said the first edition was taken on 1 October 2026 — the date of the second.
 * The first (blogPost-durres-asking-price-index-2026-09) was taken on
 * 20 September, as the article body says. Found before pitching the index to
 * media (docs/seo/FREE-LINKS-PLAN-2026-10-14.md, frontend repo).
 *
 *   npx tsx scripts/patchPriceIndexFirstEditionDate20261014.ts [--execute]
 */
import path from 'node:path'
import {config} from 'dotenv'
import {createClient} from '@sanity/client'

config({path: path.resolve(process.cwd(), '.env')})
const execute = process.argv.includes('--execute')
const c = createClient({projectId: process.env.SANITY_PROJECT_ID!, dataset: process.env.SANITY_DATASET || 'production', apiVersion: '2025-01-01', token: process.env.SANITY_API_TOKEN, useCdn: false})
const ID = 'blogPost-durres-asking-price-index-2026-10'
const KEY = 'faq-durres-asking-price-index-2026-10-4'
const FIX: Record<string, [string, string]> = {
  en: ['taken on 1 October 2026', 'taken on 20 September 2026'],
  de: ['erhoben am 1. Oktober 2026', 'erhoben am 20. September 2026'],
  it: ['rilevata il 1° ottobre 2026', 'rilevata il 20 settembre 2026'],
  pl: ['sporządzonym 1 października 2026 roku', 'sporządzonym 20 września 2026 roku'],
  ru: ['снятым 1 октября 2026 года', 'снятым 20 сентября 2026 года'],
  uk: ['знятим 1 жовтня 2026 року', 'знятим 20 вересня 2026 року'],
  sq: ['të marrë më 1 tetor 2026', 'të marrë më 20 shtator 2026'],
}
async function main() {
  const doc = await c.getDocument(ID)
  const item = (doc?.faq as Array<{_key: string; answer: Record<string, string>}>)?.find((f) => f._key === KEY)
  if (!item) throw new Error('faq item not found')
  const set: Record<string, string> = {}
  for (const [l, [from, to]] of Object.entries(FIX)) {
    const a = item.answer[l]
    if (typeof a === 'string' && a.includes(from)) set[`faq[_key=="${KEY}"].answer.${l}`] = a.replace(from, to)
    else console.log('skip', l, '(phrase not found)')
  }
  console.log(execute ? 'EXECUTE' : 'DRY', Object.keys(set))
  if (execute && Object.keys(set).length) console.log('rev', (await c.patch(ID).set(set).commit())._rev)
}
main().catch((e) => { console.error(e.message); process.exit(1) })
