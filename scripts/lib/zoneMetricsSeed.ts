/**
 * Pure transform for the `zoneMetrics` seed — see
 * docs/engineering/PLAN-zone-metrics-2026-08-15.md Task 4.
 *
 * Kept separate from the script so it can be unit-tested: the seed writes
 * published market figures, and a silent mistake here becomes a wrong number on
 * a public page.
 */

export type SeedSource = {
  label: string
  url: string
  publisher?: string
  date?: string
}

export type SeedRecord = {
  zone: string
  zoneType?: 'district' | 'city'
  periodLabel: string
  periodDate: string
  basis: string
  confidence: string
  sources?: string[]
  notes?: Record<string, string>
  kbSource?: string
  [metric: string]: unknown
}

export type SeedFile = {
  sourceLibrary: Record<string, SeedSource>
  editions: Record<string, string>
  records: SeedRecord[]
}

/** Numeric metric fields copied straight through when present. */
export const METRIC_FIELDS = [
  'priceNewMin',
  'priceNewMax',
  'priceNewMedian',
  'priceResaleMin',
  'priceResaleMax',
  'priceResaleMedian',
  'priceAllMin',
  'priceAllMax',
  'priceAllMedian',
  'rentLtr1brMin',
  'rentLtr1brMax',
  'rentLtr2brMin',
  'rentLtr2brMax',
  'strAdr',
  'strOccupancyPct',
  'grossYieldLtrPct',
  'grossYieldStrPct',
  'referencePrice',
  'referencePriceMin',
  'referencePriceMax',
  'ratingOverall',
  'sampleSize',
] as const

const REFERENCE_FIELDS = ['referencePrice', 'referencePriceMin', 'referencePriceMax'] as const

export function zoneMetricsDocId(zoneSlug: string, periodLabel: string): string {
  return `zoneMetrics-${zoneSlug}-${periodLabel}`
}

export function expandSources(
  keys: string[] | undefined,
  library: Record<string, SeedSource>,
  zoneSlug: string,
): Array<SeedSource & {_key: string; _type: 'sourceItem'}> {
  if (!keys?.length) return []
  return keys.map((key, i) => {
    const src = library[key]
    if (!src) throw new Error(`${zoneSlug}: unknown source key "${key}"`)
    return {...src, _key: `${zoneSlug}-src-${i}`, _type: 'sourceItem' as const}
  })
}

/**
 * Build one Sanity document. Throws rather than writing a half-correct record:
 * a reference price without its edition label is the failure mode that makes
 * two coexisting schedules silently diverge in January.
 */
export function buildZoneMetricsDoc(
  record: SeedRecord,
  zoneId: string,
  file: Pick<SeedFile, 'sourceLibrary' | 'editions'>,
): Record<string, unknown> {
  const doc: Record<string, unknown> = {
    _id: zoneMetricsDocId(record.zone, record.periodLabel),
    _type: 'zoneMetrics',
    zone: {_type: 'reference', _ref: zoneId},
    periodLabel: record.periodLabel,
    periodDate: record.periodDate,
    basis: record.basis,
    confidence: record.confidence,
  }

  for (const field of METRIC_FIELDS) {
    const value = record[field]
    if (value === undefined || value === null) continue
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new Error(`${record.zone}: ${field} must be a number, got ${JSON.stringify(value)}`)
    }
    doc[field] = value
  }

  const hasReference = REFERENCE_FIELDS.some((f) => typeof record[f] === 'number')
  if (hasReference) {
    const editionKey = record.referencePriceEdition
    if (typeof editionKey !== 'string' || !editionKey) {
      throw new Error(`${record.zone}: referencePriceEdition is required when a reference price is set`)
    }
    const edition = file.editions[editionKey]
    if (!edition) throw new Error(`${record.zone}: unknown edition key "${editionKey}"`)
    doc.referencePriceEdition = edition
  } else if (record.referencePriceEdition) {
    throw new Error(`${record.zone}: referencePriceEdition set without any reference price`)
  }

  const sources = expandSources(record.sources, file.sourceLibrary, record.zone)
  if (sources.length) doc.sources = sources
  if (record.notes) doc.notes = record.notes

  return doc
}

/** Min must not exceed max — the same rule the schema enforces in Studio. */
export function assertRangesOrdered(record: SeedRecord): void {
  const pairs: Array<[string, string]> = [
    ['priceNewMin', 'priceNewMax'],
    ['priceResaleMin', 'priceResaleMax'],
    ['priceAllMin', 'priceAllMax'],
    ['rentLtr1brMin', 'rentLtr1brMax'],
    ['rentLtr2brMin', 'rentLtr2brMax'],
    ['referencePriceMin', 'referencePriceMax'],
  ]
  for (const [minKey, maxKey] of pairs) {
    const min = record[minKey]
    const max = record[maxKey]
    if (typeof min === 'number' && typeof max === 'number' && min > max) {
      throw new Error(`${record.zone}: ${minKey} (${min}) is greater than ${maxKey} (${max})`)
    }
  }
}
