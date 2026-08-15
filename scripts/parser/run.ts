/**
 * Listing parser CLI — see docs/engineering/PLAN-listing-parser-2026-08-15.md.
 * Fetches search pages for price, detail pages for area, joins on advert id.
 * Usage: npx tsx scripts/parser/run.ts [--zone <name>] [--max-requests 400]
 */
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {join, dirname} from 'node:path'
import {fetchPage, RateLimiter} from './fetchPage'
import {parseSearch, type SearchRow} from './parseSearch'
import {parseDetail, type DetailRow} from './parseDetail'
import {joinRows, aggregate, type ZoneResult} from './aggregate'

type ZoneConfig = {
  zone: string
  citySlug: string
  query: string
  pages: number
  expectLabel: string
}

const args = process.argv.slice(2)
const argOf = (flag: string) => {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : undefined
}
const onlyZone = argOf('--zone')
const maxRequests = Number.parseInt(argOf('--max-requests') ?? '400', 10)
const detailCap = Number.parseInt(argOf('--detail-cap') ?? '60', 10)

async function main() {
  const configs: ZoneConfig[] = JSON.parse(readFileSync(join(__dirname, 'zones.json'), 'utf8'))
  const limiter = new RateLimiter(1200, maxRequests)
  const results: ZoneResult[] = []

  for (const cfg of configs) {
    if (onlyZone && cfg.zone !== onlyZone) continue
    console.log(`\n=== ${cfg.zone} (${cfg.citySlug}) ===`)

    const search: SearchRow[] = []
    for (let p = 1; p <= cfg.pages; p++) {
      const sep = cfg.query.includes('?') ? '&' : '?'
      const html = await fetchPage(`${cfg.query}${sep}Page=${p}`, limiter)
      search.push(...parseSearch(html))
    }
    const unique = [...new Map(search.map((r) => [r.advertId, r])).values()]
    console.log(`search rows: ${unique.length} (${search.length} before dedupe)`)

    const details: DetailRow[] = []
    for (const row of unique.slice(0, detailCap)) {
      const html = await fetchPage(`https://merrjep.al/njoftim/x/${row.advertId}`, limiter).catch(
        () => null,
      )
      if (html) details.push(parseDetail(html, row.advertId))
    }
    console.log(`detail rows: ${details.length}`)

    const joinedAll = joinRows(unique, details)
    // Guard against lookalike toponyms (Spile vs Spille) and cross-city bleed.
    const joined = joinedAll.filter((r) => {
      const hay = (r.address ?? '').toLowerCase()
      return hay === '' || hay.includes(cfg.expectLabel.toLowerCase())
    })
    const rejectedByLabel = joinedAll.length - joined.length
    const unjoined = Math.min(unique.length, detailCap) - joinedAll.length

    const result = aggregate(joined, cfg.zone, unjoined)
    console.log(`label-rejected: ${rejectedByLabel} | unjoined: ${unjoined}`)
    console.log(JSON.stringify(result, null, 2))
    results.push(result)
  }

  const stamp = new Date().toISOString().slice(0, 10)
  const out = join(__dirname, '..', 'data', `listing-scan-${stamp}.json`)
  mkdirSync(dirname(out), {recursive: true})
  writeFileSync(out, JSON.stringify(results, null, 2))
  console.log(`\nrequests used: ${limiter.requests}`)
  console.log(`written: ${out}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
