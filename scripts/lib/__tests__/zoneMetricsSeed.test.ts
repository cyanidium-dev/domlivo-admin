import {describe, it, expect} from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  buildZoneMetricsDoc,
  expandSources,
  zoneMetricsDocId,
  assertRangesOrdered,
  type SeedFile,
} from '../zoneMetricsSeed'

const file = {
  sourceLibrary: {
    troja: {label: 'Troja.al', url: 'https://troja.al', publisher: 'Troja.al'},
  },
  editions: {u34: 'Udhëzim 34/2023 (in force 01.01.2024)'},
}

const base = {
  zone: 'blloku',
  periodLabel: '2026-H1',
  periodDate: '2026-01-01',
  basis: 'asking',
  confidence: 'high',
}

describe('zoneMetricsDocId', () => {
  it('is deterministic so a re-run updates instead of duplicating', () => {
    expect(zoneMetricsDocId('blloku', '2026-H1')).toBe('zoneMetrics-blloku-2026-H1')
  })
})

describe('expandSources', () => {
  it('expands keys into sourceItem members with stable keys', () => {
    const out = expandSources(['troja'], file.sourceLibrary, 'blloku')
    expect(out).toEqual([
      {
        label: 'Troja.al',
        url: 'https://troja.al',
        publisher: 'Troja.al',
        _key: 'blloku-src-0',
        _type: 'sourceItem',
      },
    ])
  })

  it('throws on an unknown key rather than dropping the citation', () => {
    expect(() => expandSources(['nope'], file.sourceLibrary, 'blloku')).toThrow(/unknown source key/)
  })
})

describe('buildZoneMetricsDoc', () => {
  it('copies numeric metrics and skips absent ones', () => {
    const doc = buildZoneMetricsDoc({...base, priceNewMin: 3000, priceNewMax: 5500}, 'district-blloku', file)
    expect(doc.priceNewMin).toBe(3000)
    expect(doc.priceNewMax).toBe(5500)
    expect('priceResaleMin' in doc).toBe(false)
    expect(doc.zone).toEqual({_type: 'reference', _ref: 'district-blloku'})
  })

  it('resolves the edition key to its full label', () => {
    const doc = buildZoneMetricsDoc({...base, referencePrice: 228400, referencePriceEdition: 'u34'}, 'x', file)
    expect(doc.referencePriceEdition).toBe('Udhëzim 34/2023 (in force 01.01.2024)')
  })

  it('refuses a reference price with no edition', () => {
    expect(() => buildZoneMetricsDoc({...base, referencePrice: 228400}, 'x', file)).toThrow(
      /referencePriceEdition is required/,
    )
  })

  it('refuses an edition label with no reference price', () => {
    expect(() => buildZoneMetricsDoc({...base, referencePriceEdition: 'u34'}, 'x', file)).toThrow(
      /without any reference price/,
    )
  })

  it('refuses an unknown edition key', () => {
    expect(() =>
      buildZoneMetricsDoc({...base, referencePrice: 1, referencePriceEdition: 'made-up'}, 'x', file),
    ).toThrow(/unknown edition key/)
  })

  it('refuses a non-numeric metric', () => {
    expect(() => buildZoneMetricsDoc({...base, priceNewMin: '3000'}, 'x', file)).toThrow(/must be a number/)
  })
})

describe('assertRangesOrdered', () => {
  it('accepts an ordered range', () => {
    expect(() => assertRangesOrdered({...base, priceAllMin: 800, priceAllMax: 1900})).not.toThrow()
  })

  it('rejects an inverted range', () => {
    expect(() => assertRangesOrdered({...base, priceAllMin: 1900, priceAllMax: 800})).toThrow(/greater than/)
  })

  it('checks yield ranges too', () => {
    expect(() =>
      assertRangesOrdered({...base, grossYieldLtrPctMin: 4.7, grossYieldLtrPctMax: 3.2}),
    ).toThrow(/greater than/)
    expect(() =>
      assertRangesOrdered({...base, grossYieldLtrPctMin: 3.2, grossYieldLtrPctMax: 4.7}),
    ).not.toThrow()
  })
})

describe('yield ranges', () => {
  it('carries both ends through to the document', () => {
    const doc = buildZoneMetricsDoc(
      {...base, grossYieldLtrPctMin: 3.2, grossYieldLtrPctMax: 4.7},
      'district-parruce',
      file,
    )
    expect(doc.grossYieldLtrPctMin).toBe(3.2)
    expect(doc.grossYieldLtrPctMax).toBe(4.7)
  })
})

describe('the shipped seed file', () => {
  const seed = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../../data/zone-metrics-seed.json'), 'utf8'),
  ) as SeedFile

  it('builds every record without throwing', () => {
    for (const record of seed.records) {
      assertRangesOrdered(record)
      expect(() => buildZoneMetricsDoc(record, `zone-${record.zone}`, seed)).not.toThrow()
    }
  })

  it('has no duplicate zone + period pairs', () => {
    const ids = seed.records.map((r) => zoneMetricsDocId(r.zone, r.periodLabel))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every record a basis and a confidence', () => {
    const bad = seed.records.filter((r) => !r.basis || !r.confidence)
    expect(bad.map((r) => r.zone)).toEqual([])
  })

  it('carries at least one source per record', () => {
    const bare = seed.records.filter((r) => !r.sources?.length)
    expect(bare.map((r) => r.zone)).toEqual([])
  })
})
