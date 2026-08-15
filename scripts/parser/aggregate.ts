import type {SearchRow} from './parseSearch'
import type {DetailRow} from './parseDetail'

export type JoinedRow = {
  advertId: string
  priceEur: number
  areaM2: number
  perM2: number
  isRent: boolean
  isNew: boolean
  address: string | null
  rooms: number | null
}

/** Sanity bounds for Albanian residential asking prices, EUR per m2. */
const MIN_PER_M2 = 300
const MAX_PER_M2 = 7000

/**
 * Sanity bounds for monthly rent in EUR. Without these a sale price that the
 * title heuristic misreads as a rental lands in the band: the first full scan
 * produced a "EUR 122,449/month" for Shkoder centre, which is 12M lek.
 */
const MIN_RENT = 50
const MAX_RENT = 3000

/**
 * Albanian sellers routinely quote "old lek" — ten times the official
 * denomination. A 57 m2 Shkoder flat listed at 30,000,000 LEK is 3,000,000 new
 * lek (~EUR 30.6k, ~EUR 537/m2), not EUR 306k. Left unhandled this inflates a
 * listing tenfold and was one cause of the EUR 5,371/m2 nonsense seen when this
 * data was first gathered by hand.
 *
 * Threshold: no residential apartment in our markets reaches 25M new lek
 * (~EUR 255k) at the volumes we parse, so anything above is treated as old lek.
 */
const OLD_LEK_THRESHOLD = 25_000_000

export function normaliseLek(lek: number): number {
  return lek >= OLD_LEK_THRESHOLD ? Math.round(lek / 10) : lek
}

export function joinRows(search: SearchRow[], detail: DetailRow[], lekPerEur = 98): JoinedRow[] {
  const details = new Map(detail.map((d) => [d.advertId, d]))
  const out: JoinedRow[] = []

  for (const s of search) {
    const d = details.get(s.advertId)
    if (!d || d.areaM2 === null || d.areaM2 <= 0) continue
    const eur =
      s.priceEur ?? (s.priceLek !== null ? Math.round(normaliseLek(s.priceLek) / lekPerEur) : null)
    if (eur === null) continue
    out.push({
      advertId: s.advertId,
      priceEur: eur,
      areaM2: d.areaM2,
      perM2: Math.round(eur / d.areaM2),
      isRent: s.isRent,
      isNew: /i\s*ri/i.test(d.condition ?? ''),
      address: d.address,
      rooms: d.rooms,
    })
  }
  return out
}

export type Band = {
  n: number
  min: number | null
  median: number | null
  max: number | null
  confidence: 'green' | 'yellow' | 'red'
}

function band(values: number[]): Band {
  if (values.length === 0) return {n: 0, min: null, median: null, max: null, confidence: 'red'}
  const s = [...values].sort((a, b) => a - b)
  return {
    n: s.length,
    min: s[0],
    median: s[Math.floor(s.length / 2)],
    max: s[s.length - 1],
    // Asking-price listings never earn green; under five samples is always red.
    confidence: s.length < 5 ? 'red' : 'yellow',
  }
}

export type ZoneResult = {
  zone: string
  basis: 'asking'
  sale: {new: Band; resale: Band; all: Band}
  rent: Band
  dropped: {outOfRange: number; rentOutOfRange: number; unjoined: number}
}

export function aggregate(rows: JoinedRow[], zone: string, unjoined = 0): ZoneResult {
  const sales = rows.filter((r) => !r.isRent)
  const inRange = sales.filter((r) => r.perM2 >= MIN_PER_M2 && r.perM2 <= MAX_PER_M2)

  const rents = rows.filter((r) => r.isRent)
  const rentsInRange = rents.filter((r) => r.priceEur >= MIN_RENT && r.priceEur <= MAX_RENT)

  return {
    zone,
    basis: 'asking',
    sale: {
      new: band(inRange.filter((r) => r.isNew).map((r) => r.perM2)),
      resale: band(inRange.filter((r) => !r.isNew).map((r) => r.perM2)),
      all: band(inRange.map((r) => r.perM2)),
    },
    rent: band(rentsInRange.map((r) => r.priceEur)),
    dropped: {
      outOfRange: sales.length - inRange.length,
      rentOutOfRange: rents.length - rentsInRange.length,
      unjoined,
    },
  }
}
