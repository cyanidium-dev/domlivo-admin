/**
 * Pull the partner's listings from findall.al.
 *
 * Reads the same public API the partner's own site reads
 * (`api.findall.al/api/listing`), once per deal type, then one detail call
 * per listing for the photographs. Writes one JSON file per deal type into
 * the workspace folder, in the shape `importFindallListings.ts` consumes:
 *
 *   ../domlivo-workspace/findall/findall-sale.json
 *   ../domlivo-workspace/findall/findall-rent.json
 *
 * The previous file, if any, is kept next to it with a timestamp, so a
 * scrape that goes wrong costs nothing.
 *
 * Price flags, decided here rather than in the import, because they are a
 * property of the source text:
 *  - `per-sqm`: a for-sale price at or under €2,500 is a rate, not a total —
 *    the partner writes "Çmimi: 1300 €/m²" for new builds and land.
 *  - `implausible`: over €50m, a typo in the partner's CMS.
 *  - rent prices are monthly or daily and never flagged.
 *
 * Run:
 * - npm run scrape:findall
 * - npm run scrape:findall -- --out <folder>
 */
import fs from 'node:fs'
import path from 'node:path'

const API = 'https://api.findall.al/api/listing'
const SITE = 'https://findall.al/listings/details'
const PAGE_SIZE = 50
const PACE_MS = 150
const HEADERS = {'User-Agent': 'DomLivoImportBot/1.0 (+https://domlivo.com)', Accept: 'application/json'}

const args = process.argv.slice(2)
const outArg = args.includes('--out') ? args[args.indexOf('--out') + 1] : ''
const OUT_DIR = outArg || path.resolve(process.cwd(), '../domlivo-workspace/findall')

type Photo = {id: number; url: string; publicId: string}
type ApiUser = {
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  description?: string
}
type ApiListing = {
  id: number
  title: string
  description: string
  isPublished: boolean
  publishedFor: 'sale' | 'rent'
  rentPeriod?: string | null
  address: string | null
  city: string | null
  bedrooms: number
  baths: number
  floor: number
  price: number
  currency: string
  area: number
  interiorArea: number
  category: string | null
  status: string | null
  availability: string | null
  documentation: string | null
  createdAt: string
  updatedAt: string
  mainPhoto: Photo | null
  photos?: Photo[]
  user: ApiUser | null
}
type Page = {data: ApiListing[]; pagination: {currentPage: number; totalPages: number; totalCount: number}}

/** The shape the import reads. Keep in step with `Scraped` there. */
export type Scraped = {
  id: number
  sourceUrl: string
  title: string
  publishedFor: 'sale' | 'rent'
  rentPeriod: string | null
  isPublished: boolean
  price: number
  currency: string
  priceFlag: '' | 'per-sqm' | 'implausible'
  category: string | null
  status: string | null
  availability: string | null
  documentation: string | null
  address: string
  city: string
  bedrooms: number
  baths: number
  floor: number
  area: number
  interiorArea: number
  createdAt: string
  updatedAt: string
  descriptionText: string
  descriptionHtml: string
  mainPhoto: string | null
  photos: string[]
  agent: {name: string; email: string; phone: string; description: string}
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function getJson<T>(url: string): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, {headers: HEADERS})
    if (res.ok) return (await res.json()) as T
    if (attempt === 3) throw new Error(`${res.status} ${url}`)
    await sleep(1000 * attempt)
  }
  throw new Error('unreachable')
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(n) ? String.fromCodePoint(n) : m
    }
    return ENTITIES[code.toLowerCase()] ?? m
  })
}

/** One line per block element, entities decoded, blank lines dropped. */
export function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<br\b[^>]*>/gi, '\n')
    .replace(/<\/\s*(p|div|li|h[1-6]|tr|blockquote)\s*>/gi, '\n')
    .replace(/<\s*(p|div|li|h[1-6]|tr)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
  return decodeEntities(withBreaks)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
}

function priceFlag(row: ApiListing): Scraped['priceFlag'] {
  if (row.price >= 50_000_000) return 'implausible'
  if (row.publishedFor === 'sale' && row.price <= 2500) return 'per-sqm'
  return ''
}

const https = (url: string) => url.replace(/^http:/, 'https:')

function toScraped(row: ApiListing, detail: ApiListing): Scraped {
  const photos = (detail.photos ?? []).map((p) => https(p.url))
  const user = row.user ?? detail.user ?? {}
  return {
    id: row.id,
    sourceUrl: `${SITE}/${row.id}`,
    title: (row.title || '').replace(/\s+/g, ' ').trim(),
    publishedFor: row.publishedFor,
    rentPeriod: row.rentPeriod ?? null,
    isPublished: row.isPublished,
    price: row.price,
    currency: row.currency || 'EUR',
    priceFlag: priceFlag(row),
    category: row.category,
    status: row.status,
    availability: row.availability,
    documentation: row.documentation,
    address: (row.address || '').trim(),
    city: (row.city || '').trim(),
    bedrooms: row.bedrooms ?? 0,
    baths: row.baths ?? 0,
    floor: row.floor ?? 0,
    area: row.area ?? 0,
    interiorArea: row.interiorArea ?? 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    descriptionText: htmlToText(detail.description || row.description || ''),
    descriptionHtml: detail.description || row.description || '',
    mainPhoto: row.mainPhoto ? https(row.mainPhoto.url) : null,
    photos,
    agent: {
      name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'FIND ALL PROPERTIES',
      email: user.email || '',
      phone: user.phoneNumber || '',
      description: user.description || '',
    },
  }
}

async function scrape(publishedFor: 'sale' | 'rent'): Promise<Scraped[]> {
  const first = await getJson<Page>(`${API}?publishedFor=${publishedFor}&pageNumber=1&pageSize=${PAGE_SIZE}`)
  const rows = [...first.data]
  for (let page = 2; page <= first.pagination.totalPages; page++) {
    await sleep(PACE_MS)
    const next = await getJson<Page>(`${API}?publishedFor=${publishedFor}&pageNumber=${page}&pageSize=${PAGE_SIZE}`)
    rows.push(...next.data)
  }
  const byId = new Map(rows.map((r) => [r.id, r]))
  if (byId.size !== first.pagination.totalCount) {
    console.log(`  ${publishedFor}: API promised ${first.pagination.totalCount}, paging returned ${byId.size} distinct`)
  }

  const out: Scraped[] = []
  for (const row of byId.values()) {
    await sleep(PACE_MS)
    const detail = await getJson<ApiListing>(`${API}/${row.id}`)
    out.push(toScraped(row, detail))
  }
  return out.sort((a, b) => a.id - b.id)
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
  for (const kind of ['sale', 'rent'] as const) {
    console.log(`${kind}…`)
    const rows = await scrape(kind)
    const photos = rows.reduce((n, r) => n + r.photos.length, 0)
    const flagged = rows.filter((r) => r.priceFlag).length
    const file = path.join(OUT_DIR, `findall-${kind}.json`)
    writeWithBackup(file, rows)
    console.log(`  ${rows.length} listings, ${photos} photographs, ${flagged} price flags → ${file}`)
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
