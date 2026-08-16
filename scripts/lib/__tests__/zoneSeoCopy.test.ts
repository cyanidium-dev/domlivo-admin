import {describe, it, expect} from 'vitest'
import {buildZoneSeo, buildZoneMetaDescription, formatBand} from '../zoneSeoCopy'

const tirana = {en: 'Tirana', uk: 'Тирана', ru: 'Тирана', sq: 'Tirana', it: 'Tirana'}

describe('formatBand', () => {
  it('prefers a median over a range', () => {
    expect(formatBand('en', 800, 1200, 1000)).toBe('1,000')
  })
  it('renders a range when there is no median', () => {
    expect(formatBand('en', 3000, 5500)).toBe('3,000–5,500')
  })
  it('collapses a range whose ends match', () => {
    expect(formatBand('en', 1400, 1400)).toBe('1,400')
  })
  it('is null when the metric is absent', () => {
    expect(formatBand('en')).toBeNull()
  })
})

describe('buildZoneMetaDescription', () => {
  const zone = {
    kind: 'district' as const,
    slug: 'blloku',
    title: {en: 'Blloku'},
    cityTitle: tirana,
    metrics: {
      priceNewMin: 3000, priceNewMax: 5500,
      priceResaleMin: 2500, priceResaleMax: 3500,
      rentLtr1brMin: 500, rentLtr1brMax: 700,
      periodLabel: '2026-H1',
    },
  }

  it('leads with the figures and names the period', () => {
    expect(buildZoneMetaDescription(zone, 'en', '2026')).toBe(
      'New builds €3,000–5,500/m², resale €2,500–3,500/m², a 1+1 rents for €500–700/month. Sourced asking prices, 2026-H1.',
    )
  })

  it('starts as a sentence even when the leading fragment is lowercase', () => {
    const allOnly = {...zone, metrics: {priceAllMedian: 1450, periodLabel: '2026-H1'}}
    const out = buildZoneMetaDescription(allOnly, 'en', '2026')!
    expect(out.startsWith('Asking €1,450/m²')).toBe(true)
  })

  it('falls back to the first sentence when a zone has no metrics', () => {
    const noMetrics = {
      kind: 'district' as const,
      slug: 'livadh',
      title: {en: 'Livadh'},
      description: {en: 'Livadh has amazing beaches. A second sentence follows.'},
      metrics: null,
    }
    expect(buildZoneMetaDescription(noMetrics, 'en', '2026')).toBe('Livadh has amazing beaches.')
  })

  it('is null with neither metrics nor description', () => {
    expect(
      buildZoneMetaDescription({kind: 'district', slug: 'x', metrics: null}, 'en', '2026'),
    ).toBeNull()
  })
})

describe('buildZoneSeo', () => {
  it('titles a district with its city and the year', () => {
    const seo = buildZoneSeo(
      {
        kind: 'district',
        slug: 'blloku',
        title: {en: 'Blloku'},
        cityTitle: tirana,
        metrics: {priceNewMin: 3000, priceNewMax: 5500},
      },
      '2026',
    )!
    expect(seo.metaTitle.en).toBe('Blloku, Tirana: property prices 2026')
    expect(seo.metaTitle.ru).toBe('Blloku, Тирана: цены на недвижимость 2026')
  })

  it('titles a city without a parent', () => {
    const seo = buildZoneSeo(
      {kind: 'city', slug: 'tirana', title: tirana, metrics: {priceAllMedian: 1863}},
      '2026',
    )!
    expect(seo.metaTitle.en).toBe('Property in Tirana: prices 2026')
  })

  it('covers all five locales', () => {
    const seo = buildZoneSeo(
      {
        kind: 'district',
        slug: 'blloku',
        title: {en: 'Blloku'},
        cityTitle: tirana,
        metrics: {priceNewMin: 3000, priceNewMax: 5500},
      },
      '2026',
    )!
    for (const locale of ['en', 'uk', 'ru', 'sq', 'it'] as const) {
      expect(seo.metaTitle[locale], `metaTitle.${locale}`).toBeTruthy()
      expect(seo.metaDescription[locale], `metaDescription.${locale}`).toBeTruthy()
    }
  })

  it('returns null when there is nothing to say', () => {
    expect(buildZoneSeo({kind: 'district', slug: 'x', metrics: null}, '2026')).toBeNull()
  })
})
