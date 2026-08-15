/**
 * One-shot helper: save a live page as a test fixture.
 * Usage: npx tsx scripts/parser/_fetchFixture.ts <url> <outfile>
 */
import {fetchPage, RateLimiter} from './fetchPage'
import {writeFileSync, mkdirSync} from 'node:fs'
import {dirname} from 'node:path'

async function main() {
  const [url, out] = process.argv.slice(2)
  if (!url || !out) throw new Error('usage: _fetchFixture.ts <url> <outfile>')
  mkdirSync(dirname(out), {recursive: true})
  const limiter = new RateLimiter(500, 5)
  console.log('fetching', url)
  const html = await fetchPage(url, limiter)
  writeFileSync(out, html)
  console.log(
    'saved bytes:',
    html.length,
    '| search cards:',
    (html.match(/goodssearch-item-content/g) || []).length,
    '| has Siperfaqe:',
    /Sipërfaqe:/.test(html),
  )
}

main().catch((e) => {
  console.error('FAILED:', e.message)
  process.exit(1)
})
