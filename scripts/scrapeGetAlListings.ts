/**
 * Pull the partner's listings from get.al (Get Real Estate, Durrës).
 *
 * There is no public API — the site is a BSP Real Estate CRM front end — so
 * the listings are read from the two things it does publish cleanly:
 *
 *  - `sitemap.xml`, which lists every property URL (nothing is paginated away);
 *  - the `application/ld+json` graph on each property page, which carries the
 *    title, the full description, every photograph at original size, the
 *    locality and the room counts as structured data.
 *
 * The facts the graph omits — the deal type, the reference code, the district
 * label, the price, the build status, the floor and the areas — are read from
 * the page's own markup.
 *
 * Two blocks are read with regular expressions rather than through the DOM.
 * The template closes an `<h4>` with `</h3>` in the price header, and a parser
 * that meets that reparents everything after it: `node-html-parser` drops both
 * the header and the title out of the tree entirely. The flat markup is the
 * more reliable reading for those two, and the DOM is used for the rest.
 *
 * Prices are the awkward part and are deliberately not converted here; the
 * scrape records what the page said and how it said it, and the import
 * decides. Four shapes occur:
 *  - "75,000 €"             → a euro total.
 *  - "1400€/ m²"            → a rate per square metre, not a total. New builds
 *    and land are quoted this way, and the superscript sits in its own tag.
 *  - "550 € /Muaj"          → a monthly rent.
 *  - "Çmimi sipas kërkesës" → on request, with no figure in the header. The
 *    description's own "Çmimi:" bullet is then read, and it is usually written
 *    in lekë të vjetra — the old lek Albanians still quote in conversation,
 *    ten to the new one. "98 Milion Lekë" is 9.8 m new lek, about €98 000.
 *
 * Output, in the shape `importGetAlListings.ts` consumes:
 *
 *   ../domlivo-workspace/getal/getal-listings.json
 *
 * The previous file, if any, is kept next to it with a timestamp.
 *
 * Run:
 * - npm run scrape:getal
 * - npm run scrape:getal -- --limit 20        (a slice, to look before committing)
 * - npm run scrape:getal -- --out <folder>
 */
import fs from 'node:fs'
import path from 'node:path'
import {parse, type HTMLElement} from 'node-html-parser'

const SITEMAP = 'https://get.al/sitemap.xml'
const HEADERS = {
  'User-Agent': 'DomLivoImportBot/1.0 (+https://domlivo.com)',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

/**
 * The site rate-limits, and answers a burst with a 429 page rather than the
 * listing. Pacing therefore adapts: it starts civil, backs well off whenever a
 * 429 arrives, and eases down again after a run of clean responses. A scrape
 * that takes ten minutes and gets every listing beats a fast one full of holes.
 */
const PACE_START_MS = 900
const PACE_MIN_MS = 600
const PACE_MAX_MS = 8000
const EASE_AFTER = 20

const args = process.argv.slice(2)
const outArg = args.includes('--out') ? args[args.indexOf('--out') + 1] : ''
const limitArg = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : 0
const noCache = args.includes('--no-cache')
const OUT_DIR = outArg || path.resolve(process.cwd(), '../domlivo-workspace/getal')

/** The shape the import reads. Keep in step with `Scraped` there. */
export type Scraped = {
  id: number
  sourceUrl: string
  reference: string
  title: string
  dealType: 'sale' | 'rent'
  rentPeriod: 'month' | 'day' | ''
  /** What the price line meant, decided from the page, not from the number. */
  priceKind: 'eur' | 'old-lek' | 'on-request'
  /** True when the figure is a rate per m² rather than a total. */
  pricePerSqm: boolean
  priceRaw: string
  /** The figure as written, in the unit `priceKind` names. 0 when on request. */
  priceValue: number
  city: string
  districtLabel: string
  typeLabel: string
  statusLabel: string
  bedrooms: number
  bathrooms: number
  livingRooms: number
  rooms: number
  floor: number
  floorRaw: string
  area: number
  interiorArea: number
  plotArea: number
  views: number
  datePosted: string
  descriptionText: string
  photos: string[]
  agentName: string
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const log = (line: string) => process.stdout.write(`${line}\n`)

let pace = PACE_START_MS
let clean = 0

/** Widen the gap between requests after a 429, narrow it after a clean run. */
function easeOff(retryAfter: number) {
  clean = 0
  pace = Math.min(PACE_MAX_MS, Math.max(pace * 2, retryAfter * 1000))
}
function easeOn() {
  if (++clean < EASE_AFTER) return
  clean = 0
  pace = Math.max(PACE_MIN_MS, Math.round(pace * 0.75))
}

async function getText(url: string): Promise<string> {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url, {headers: HEADERS})
      if (res.ok) {
        const body = await res.text()
        // The rate limiter answers 200 with an interstitial on some paths.
        if (/Too Many Requests/i.test(body) && body.length < 4000) {
          easeOff(attempt * 5)
          await sleep(pace * attempt)
          continue
        }
        easeOn()
        return body
      }
      if (res.status === 404) throw new Error(`404 ${url}`)
      if (res.status === 429 || res.status >= 500) {
        easeOff(Number(res.headers.get('retry-after')) || attempt * 5)
        if (attempt === 5) throw new Error(`${res.status} after 5 tries ${url}`)
        await sleep(pace * attempt)
        continue
      }
      throw new Error(`${res.status} ${url}`)
    } catch (err) {
      if (err instanceof Error && /^(404|\d{3} )/.test(err.message)) throw err
      if (attempt === 5) throw err
      await sleep(pace * attempt)
    }
  }
  throw new Error('unreachable')
}

const ENTITIES: Record<string, string> = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' '}

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(n) ? String.fromCodePoint(n) : m
    }
    return ENTITIES[code.toLowerCase()] ?? m
  })
}

/** Collapse whitespace, including the non-breaking spaces the template uses. */
function tidy(s: string): string {
  return s.replace(/ /g, ' ').replace(/\s+/g, ' ').trim()
}

function fold(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

type LdNode = Record<string, unknown>

/**
 * The listing's own node out of the page's JSON-LD `@graph`, plus the
 * RealEstateListing wrapper that carries the publication date. The graph also
 * holds a RealEstateAgent node for the agency, which is not the listing.
 */
function readJsonLd(root: HTMLElement): {property: LdNode; listing: LdNode} {
  let property: LdNode = {}
  let listing: LdNode = {}
  for (const script of root.querySelectorAll('script[type="application/ld+json"]')) {
    let parsed: unknown
    try {
      parsed = JSON.parse(script.rawText)
    } catch {
      continue
    }
    const graph = (parsed as {['@graph']?: LdNode[]})?.['@graph'] ?? [parsed as LdNode]
    for (const node of graph) {
      const type = String(node?.['@type'] ?? '')
      if (type === 'RealEstateListing') listing = node
      else if (type !== 'RealEstateAgent' && node?.['description'] !== undefined) property = node
    }
  }
  return {property, listing}
}

/**
 * The labels "Detajet e Pronës" prints, longest first so "Dhomat e gjumit" is
 * never shortened to "Dhomat". Taken from the site's own translation
 * dictionary rather than guessed; a row matching none of them is collected and
 * reported at the end of the run instead of being silently mis-split.
 */
const DETAIL_LABELS = [
  'Referenca',
  'Lloji',
  'Statusi',
  'Dhomat e gjumit',
  'Dhomen e ndenjes',
  'Dhomën e ndenjes',
  'Tualetet',
  'Website Views',
  'Sip. Totale',
  'Sip. e brendshme',
  'Sip. Toke',
  'Sip. Tokë',
  'Kati',
  'Garazh',
  'Viti',
].sort((a, b) => b.length - a.length)

/**
 * One `<span class="detail">` per fact. Some rows separate label from value
 * with a colon ("Referenca: PROGET1587"), most do not ("Statusi New",
 * "Sip. Totale 80 m²"), so the label list does the splitting.
 */
function readDetails(root: HTMLElement, unknown: Set<string>): Map<string, string> {
  const out = new Map<string, string>()
  for (const span of root.querySelectorAll('.amenities-box span.detail')) {
    const text = tidy(span.text)
    if (!text) continue
    const label = DETAIL_LABELS.find((l) => fold(text).startsWith(fold(l)))
    if (!label) {
      unknown.add(text.replace(/\d+/g, '#'))
      continue
    }
    out.set(fold(label), tidy(text.slice(label.length)).replace(/^:\s*/, ''))
  }
  return out
}

/**
 * A number as the site prints it. "75,000" and "1.250" are both thousands
 * separators here — the fields never carry a decimal fraction.
 */
function num(s: string | undefined): number {
  if (!s) return 0
  const m = /\d[\d.,]*/.exec(s.replace(/\s/g, ''))
  if (!m) return 0
  const n = Number(m[0].replace(/[.,](?=\d{3}(?:\D|$))/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

type Price = {kind: Scraped['priceKind']; value: number; perSqm: boolean}
const NO_PRICE: Price = {kind: 'on-request', value: 0, perSqm: false}

/** A price as the page writes it — from the header or the "Çmimi:" bullet. */
export function readPrice(raw: string): Price {
  const text = tidy(raw)
  if (!text || /sipas k[ëe]rkes|on request|me marr[ëe]veshje|negociuesh/i.test(text)) return NO_PRICE
  const base = num(text)
  if (!base) return NO_PRICE
  const scale = /milion[ëe]?/i.test(text) ? 1_000_000 : /mij[ëe]/i.test(text) ? 1_000 : 1
  // "1400€/ m²" — the superscript sits in its own tag, so once the markup is
  // flattened the line reads "1400€/ m 2".
  const perSqm = /\/\s*m\s*2?\b|\bper\s*m2?\b|m²/i.test(text)
  return {kind: /lek/i.test(text) ? 'old-lek' : 'eur', value: base * scale, perSqm}
}

/** The "Çmimi: …" bullet the agency writes into the description. */
function priceFromDescription(text: string): Price {
  for (const line of text.split('\n')) {
    if (!/[çc]mimi\s*[:：]/i.test(line)) continue
    const read = readPrice(line.replace(/^.*?[çc]mimi\s*[:：]\s*/i, ''))
    if (read.kind !== 'on-request') return read
  }
  return NO_PRICE
}

const FLOOR_WORDS: Array<[string, number]> = [
  ['par', 1], ['dyt', 2], ['tret', 3], ['katert', 4], ['kart', 4], ['pest', 5],
  ['gjasht', 6], ['shtat', 7], ['tet', 8], ['nent', 9], ['dhjet', 10],
]

/** "Kati 3", "Kati 2-3", "Kati 5 kati i fundit", or the description's prose. */
function floorFrom(detail: string, text: string): number {
  const fromDetail = /\d{1,2}/.exec(detail)
  if (fromDetail) return Number(fromDetail[0])
  const digit = /\bkati\s*:?\s*(\d{1,2})\b/i.exec(text)
  if (digit) return Number(digit[1])
  const word = /\bkatin?\s+(?:e\s+)?([a-z]+)/.exec(fold(text))
  if (word) for (const [stem, n] of FLOOR_WORDS) if (word[1].startsWith(stem)) return n
  return 0
}

/** "Sipërfaqe: 80 m²" — the fallback when the details box omits the area. */
function areaFromDescription(text: string): number {
  const m = /sip[ëe]rfaqe(?:\s+totale)?\s*:?\s*([\d.,]+)\s*m/i.exec(text)
  return m ? num(m[1]) : 0
}

/**
 * The price header and the title block, read off the flat markup. Returns the
 * text of each child element in order: the header gives
 * ["Per Shitje", "550 €", "/Muaj"], the title ["◆ Shitet …", "Plazh"].
 */
function blockParts(html: string, re: RegExp): string[] {
  const m = re.exec(html)
  if (!m) return []
  return m[1]
    .split(/<[^>]+>/)
    .map((part) => tidy(decodeEntities(part)))
    .filter(Boolean)
}

const HEADER_RE = /<div class="[^"]*price-reference[^"]*"[^>]*>([\s\S]*?)<\/div>/
const TITLE_RE = /<div class="pull-left">([\s\S]*?)<\/div>/

function parseListing(url: string, html: string, unknownLabels: Set<string>): Scraped {
  const root = parse(html)
  const {property, listing} = readJsonLd(root)
  const details = readDetails(root, unknownLabels)

  const id = Number(/\/property\/(\d+)\//.exec(url)?.[1] ?? 0)

  // Header: ["Per Shitje", "80,000 €"] / ["Per Qira", "550 €", "/Muaj"] /
  // ["Per Shitje", "1400€/ m", "2"] — the last is the split superscript, so
  // the parts after the deal type are rejoined before the price is read.
  const header = blockParts(html, HEADER_RE)
  const dealText = header[0] ?? ''
  const priceRaw = header.slice(1).join(' ')
  const dealType: 'sale' | 'rent' =
    /qira/i.test(dealText) || (!dealText && /jepet\s+me\s+qira|me\s+qira/i.test(html.slice(0, 4000)))
      ? 'rent'
      : 'sale'

  const titleParts = blockParts(html, TITLE_RE)
  const title = titleParts[0] || tidy(String(listing['name'] ?? property['name'] ?? ''))
  const districtLabel = titleParts.slice(1).join(' ')

  const rawDescription = String(property['description'] ?? '')
  const descriptionText = rawDescription
    ? rawDescription.split('\n').map(tidy).filter(Boolean).join('\n')
    : ''

  let price = readPrice(priceRaw)
  if (price.kind === 'on-request') price = priceFromDescription(descriptionText)

  const address = (property['address'] ?? {}) as Record<string, unknown>
  const floorSize = (property['floorSize'] ?? {}) as Record<string, unknown>

  const bedrooms = Number(property['numberOfBedrooms'] ?? 0) || num(details.get('dhomat e gjumit'))
  const livingRooms = num(details.get('dhomen e ndenjes'))

  return {
    id,
    sourceUrl: url,
    reference: details.get('referenca') ?? '',
    title,
    dealType,
    rentPeriod: dealType !== 'rent' ? '' : /dit[ëe]/i.test(priceRaw) ? 'day' : 'month',
    priceKind: price.kind,
    pricePerSqm: price.perSqm,
    priceRaw: priceRaw || (price.value ? 'from description' : ''),
    priceValue: price.value,
    city: tidy(String(address['addressLocality'] ?? '')),
    districtLabel,
    typeLabel: details.get('lloji') ?? '',
    statusLabel: details.get('statusi') ?? '',
    bedrooms,
    bathrooms: Number(property['numberOfBathroomsTotal'] ?? 0) || num(details.get('tualetet')),
    livingRooms,
    // Our schema counts bedrooms plus living rooms — the number behind "2+1".
    // The source's own numberOfRooms is the fallback when the box is empty.
    rooms: bedrooms + livingRooms || Number(property['numberOfRooms'] ?? 0),
    floor: floorFrom(details.get('kati') ?? '', descriptionText),
    floorRaw: details.get('kati') ?? '',
    area: num(details.get('sip. totale')) || num(String(floorSize['value'] ?? '')) || areaFromDescription(descriptionText),
    interiorArea: num(details.get('sip. e brendshme')),
    plotArea: num(details.get('sip. toke') ?? details.get('sip. tokë')),
    views: num(details.get('website views')),
    datePosted: String(listing['datePosted'] ?? ''),
    descriptionText,
    photos: (Array.isArray(property['image']) ? (property['image'] as string[]) : []).map((u) =>
      String(u).replace(/^http:/, 'https:'),
    ),
    agentName: tidy(String((property['provider'] as Record<string, unknown>)?.['name'] ?? '')),
  }
}

async function propertyUrls(): Promise<string[]> {
  const xml = await getText(SITEMAP)
  const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => decodeEntities(m[1]))
  return [...new Set(locs.filter((u) => /\/property\/\d+\//.test(u)))]
}

function writeWithBackup(file: string, rows: Scraped[]) {
  if (fs.existsSync(file)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    fs.copyFileSync(file, file.replace(/\.json$/, `.backup-${stamp}.json`))
  }
  fs.writeFileSync(file, JSON.stringify(rows, null, 2))
}

async function main() {
  fs.mkdirSync(OUT_DIR, {recursive: true})
  let urls = await propertyUrls()
  log(`sitemap: ${urls.length} property URLs`)
  if (limitArg > 0) urls = urls.slice(0, limitArg)

  // A listing already read stays read. The site rate-limits hard enough that a
  // run can be interrupted, and re-fetching 300 pages to recover the last ten
  // is both slow and rude; the cache makes a re-run resume instead.
  const cacheFile = path.join(OUT_DIR, 'getal-cache.jsonl')
  const cache = new Map<string, Scraped>()
  if (!noCache && fs.existsSync(cacheFile)) {
    for (const line of fs.readFileSync(cacheFile, 'utf8').split('\n')) {
      if (!line.trim()) continue
      try {
        const row = JSON.parse(line) as Scraped
        cache.set(row.sourceUrl, row)
      } catch {
        // a half-written last line from an interrupted run
      }
    }
    log(`cache: ${cache.size} listings already read (--no-cache to ignore)`)
  }

  const rows: Scraped[] = []
  const failures: string[] = []
  const unknownLabels = new Set<string>()
  let fetched = 0
  for (const [i, url] of urls.entries()) {
    const hit = cache.get(url)
    if (hit) {
      rows.push(hit)
      continue
    }
    try {
      const row = parseListing(url, await getText(url), unknownLabels)
      rows.push(row)
      fs.appendFileSync(cacheFile, `${JSON.stringify(row)}\n`)
      fetched += 1
    } catch (err) {
      failures.push(`${url} — ${err instanceof Error ? err.message : err}`)
    }
    if (fetched % 10 === 0 || i + 1 === urls.length) log(`  ${i + 1}/${urls.length} (${fetched} fetched, pace ${pace}ms)`)
    await sleep(pace)
  }

  rows.sort((a, b) => a.id - b.id)
  const file = path.join(OUT_DIR, 'getal-listings.json')
  writeWithBackup(file, rows)

  const tally = (pick: (r: Scraped) => string) =>
    Object.entries(
      rows.reduce<Record<string, number>>((acc, r) => {
        const k = pick(r)
        return k ? {...acc, [k]: (acc[k] || 0) + 1} : acc
      }, {}),
    )
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ${v}`)
      .join(', ')

  console.log(`\n${rows.length} listings, ${rows.reduce((n, r) => n + r.photos.length, 0)} photographs → ${file}`)
  console.log(`  deal:      ${tally((r) => r.dealType)}`)
  console.log(`  price:     ${tally((r) => r.priceKind)}; per-m² rates ${rows.filter((r) => r.pricePerSqm).length}`)
  console.log(`  type:      ${tally((r) => r.typeLabel)}`)
  console.log(`  status:    ${tally((r) => r.statusLabel)}`)
  console.log(`  no photos: ${rows.filter((r) => !r.photos.length).length}`)
  console.log(`  no area:   ${rows.filter((r) => !r.area).length}`)
  console.log(`  districts: ${new Set(rows.map((r) => r.districtLabel).filter(Boolean)).size} distinct labels`)
  if (unknownLabels.size) {
    console.log(`\nUnrecognised detail rows (add to DETAIL_LABELS):`)
    for (const l of unknownLabels) console.log(`  ${l}`)
  }
  if (failures.length) {
    console.log(`\n${failures.length} failed:`)
    for (const f of failures.slice(0, 10)) console.log(`  ${f}`)
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
