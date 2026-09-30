/**
 * Finds primary-source material for the monthly article and says what is new.
 *
 * Sources watched:
 * - Monitor (monitor.al) RSS: items whose title mentions housing, prices,
 *   construction, rents, the Bank of Albania survey, property tax or the
 *   foreigners law. Monitor is a secondary source that reports primary ones
 *   (Bank of Albania, INSTAT, ministries) within days; the article must cite
 *   the primary document where it exists.
 * - Bank of Albania real-estate survey page: the newest survey PDF linked.
 * - The public consultation register for draft laws on property tax.
 *
 * State: scripts/autopilot/state.json keeps the URLs already used, so the run
 * sees only what appeared since. Read-only unless --mark is passed with the
 * URLs that were used in a published article.
 *
 * Run:
 *   npx tsx scripts/autopilot/collectSources.ts                 (prints JSON of new items)
 *   npx tsx scripts/autopilot/collectSources.ts --mark URL...   (records used URLs)
 */
import fs from 'node:fs'
import path from 'node:path'

const STATE = path.resolve(process.cwd(), 'scripts/autopilot/state.json')
// A housing word must be present; price/tax/foreigner words alone match
// groceries and government bonds (seen on the first run, 30.09.2026).
const KEYWORDS = /banes|apartament|pron[aëe]|pronav|pasuri|qira|ndërtim|ndertim|hipotek|leje ndërtimi|referenc|kadastr|ashk/i

type Item = {source: string; title: string; url: string; date?: string}
type State = {used: string[]; lastRun?: string}

function loadState(): State {
  try {
    return JSON.parse(fs.readFileSync(STATE, 'utf8')) as State
  } catch {
    return {used: []}
  }
}

async function text(url: string): Promise<string> {
  const res = await fetch(url, {headers: {'User-Agent': 'Mozilla/5.0 (Domlivo research)'}, signal: AbortSignal.timeout(30_000)})
  if (!res.ok) throw new Error(`${url}: ${res.status}`)
  return res.text()
}

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim()
}

async function monitor(): Promise<Item[]> {
  const items: Item[] = []
  for (const feed of ['https://monitor.al/feed/', 'https://monitor.al/category/nga-vendi/feed/', 'https://monitor.al/?s=banesave&feed=rss2']) {
    try {
      const xml = await text(feed)
      for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
        const block = m[1]
        const title = decode(/<title>([\s\S]*?)<\/title>/.exec(block)?.[1] ?? '')
        const url = decode(/<link>([\s\S]*?)<\/link>/.exec(block)?.[1] ?? '')
        const date = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(block)?.[1]?.trim()
        if (title && url && KEYWORDS.test(title)) items.push({source: 'monitor.al', title, url, date})
      }
    } catch (e) {
      console.error(`monitor feed failed: ${(e as Error).message}`)
    }
  }
  return items
}

async function bankOfAlbania(): Promise<Item[]> {
  const page = 'https://www.bankofalbania.org/Stabiliteti_Financiar/Analiza_dhe_studime/Vrojtime/Vrojtim_mbi_Ecuria_e_Tregut_te_Pasurive_te_Paluajtshme_ne_Shqiperi.html'
  try {
    const html = await text(page)
    const pdfs = [...html.matchAll(/href="([^"]*Vrojtim[^"]*\.pdf)"/gi)].map((m) => m[1])
    return pdfs.slice(0, 3).map((href) => ({
      source: 'bankofalbania.org',
      title: `Bank of Albania real-estate survey: ${decodeURIComponent(path.basename(href))}`,
      url: href.startsWith('http') ? href : `https://www.bankofalbania.org${href}`,
    }))
  } catch (e) {
    console.error(`bank of albania page failed: ${(e as Error).message}`)
    return []
  }
}

async function consultations(): Promise<Item[]> {
  const page = 'https://www.konsultimipublik.gov.al/Konsultime/Detaje/995'
  try {
    const html = await text(page)
    const title = decode(/<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? 'Public consultation 995 (property tax)')
    const status = /(mbyllur|hapur|përfunduar)/i.exec(html)?.[1]
    return [{source: 'konsultimipublik.gov.al', title: `${title}${status ? ` [${status}]` : ''}`, url: page}]
  } catch (e) {
    console.error(`consultation page failed: ${(e as Error).message}`)
    return []
  }
}

async function main() {
  const args = process.argv.slice(2)
  const state = loadState()
  if (args[0] === '--mark') {
    const urls = args.slice(1)
    state.used = [...new Set([...state.used, ...urls])]
    state.lastRun = new Date().toISOString()
    fs.writeFileSync(STATE, JSON.stringify(state, null, 2) + '\n')
    console.log(`marked ${urls.length} urls, ${state.used.length} total`)
    return
  }
  const all = [...(await monitor()), ...(await bankOfAlbania()), ...(await consultations())]
  const seen = new Set<string>()
  const fresh = all.filter((i) => {
    if (seen.has(i.url)) return false
    seen.add(i.url)
    return !state.used.includes(i.url)
  })
  console.log(JSON.stringify({lastRun: state.lastRun ?? null, newItems: fresh, alreadyUsed: state.used.length}, null, 2))
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
