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

  it('names the place, then the figures, then the period', () => {
    // The place is what someone searched for. Without it fifty-four zones
    // shared one description shape and differed only by a number.
    expect(buildZoneMetaDescription(zone, 'en', '2026')).toBe(
      'Blloku, Tirana: New builds €3,000–5,500/m², resale €2,500–3,500/m², a 1+1 rents for €500–700/month. Sourced asking prices, 2026-H1.',
    )
  })

  it('names a city by itself, without repeating it', () => {
    const city = {kind: 'city' as const, slug: 'tirana', title: tirana,
      metrics: {priceAllMedian: 1450, periodLabel: '2026-H1'}}
    expect(buildZoneMetaDescription(city, 'en', '2026')!.startsWith('Tirana: asking €1,450/m²')).toBe(true)
  })

  it('pads a thin description with the zone’s own first sentence', () => {
    // "Asking €1,450/m². Sourced asking prices, 2026-H1." was 55 characters on
    // fifty-four zones; the sentence is what tells them apart.
    const thin = {
      ...zone,
      description: {en: 'The quietest stretch of the lake shore. A second sentence follows.'},
      metrics: {priceAllMedian: 1450, periodLabel: '2026-H1'},
    }
    const out = buildZoneMetaDescription(thin, 'en', '2026')!
    expect(out).toContain('The quietest stretch of the lake shore.')
    expect(out.length).toBeGreaterThan(100)
    expect(out.length).toBeLessThanOrEqual(158)
  })

  it('never cuts a sentence mid-word and then resumes with boilerplate', () => {
    // Keeping both the sentence and the provenance tail produced
    // "…prices inside Shëngjin'… Sourced asking prices, 2026-H1." — worse than
    // the short version it replaced.
    const longSentence = {
      ...zone,
      description: {en: 'Rana e Hedhur is the dune belt north of Shëngjin and prices inside it move with the road, the pines and how far the sand is.'},
      metrics: {priceAllMin: 1100, priceAllMax: 2000, periodLabel: '2026-H1'},
    }
    const out = buildZoneMetaDescription(longSentence, 'en', '2026')!
    expect(out.includes('… Sourced')).toBe(false)
    expect(out.length).toBeLessThanOrEqual(158)
    // Either the sentence fits whole, or it is cut at a word boundary.
    if (out.endsWith('…')) expect(out.at(-2)).not.toBe(' ')
  })

  it('skips a sentence that only restates the figures already shown', () => {
    // The editorial copy tends to open by repeating the band, which would spend
    // the description's best characters saying the same thing twice.
    const echoing = {
      ...zone,
      description: {en: 'Blloku is the priciest part of Tirana: new builds €3,000–5,500/m² and resale €2,500–3,500/m². It is also where the bars are.'},
      metrics: {priceAllMedian: 1450, periodLabel: '2026-H1'},
    }
    const out = buildZoneMetaDescription({...echoing, metrics: {priceNewMin: 3000, priceNewMax: 5500, priceResaleMin: 2500, priceResaleMax: 3500, periodLabel: '2026-H1'}}, 'en', '2026')!
    expect(out).not.toContain('is the priciest part of Tirana')
  })

  it('leaves an already-substantial description unpadded', () => {
    const out = buildZoneMetaDescription(
      {...zone, description: {en: 'Something long enough to be worth adding but not needed here.'}},
      'en',
      '2026',
    )!
    expect(out).not.toContain('Something long enough')
  })

  it('keeps every locale inside the length a result page shows', () => {
    const long = {
      ...zone,
      description: {en: 'A sentence that runs on and on and on and would overflow the cap if it were pasted in whole without being cut.'},
      metrics: {priceAllMedian: 1450, periodLabel: '2026-H1'},
    }
    for (const locale of ['en', 'uk', 'ru', 'sq', 'it', 'pl'] as const) {
      const out = buildZoneMetaDescription(long, locale, '2026')
      if (out) expect(out.length).toBeLessThanOrEqual(158)
    }
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
