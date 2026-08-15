import {describe, it, expect} from 'vitest'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {parseSearch, advertIdFromHref} from '../parseSearch'

const html = readFileSync(join(__dirname, 'fixtures/search-parruce.html'), 'utf8')

describe('advertIdFromHref', () => {
  it('takes the trailing numeric id', () => {
    expect(advertIdFromHref('/njoftim/shitet-pallat-i-ri-parruce/19644148')).toBe('19644148')
  })

  it('returns null for anything that is not an advert url', () => {
    expect(advertIdFromHref('/njoftime/imobiliare-vendbanime/apartamente/shkoder')).toBeNull()
    expect(advertIdFromHref('')).toBeNull()
  })
})

describe('parseSearch', () => {
  it('extracts rows with an advert id and a price', () => {
    const rows = parseSearch(html)
    expect(rows.length).toBeGreaterThan(10)
    for (const r of rows) {
      expect(r.advertId).toMatch(/^\d+$/)
      expect(r.priceEur ?? r.priceLek).toBeTruthy()
    }
  })

  it('flags rentals separately from sales', () => {
    const rows = parseSearch(html)
    for (const r of rows.filter((x) => x.isRent)) {
      expect(r.title).toMatch(/qir|qer|muaj/i)
    }
  })

  it('never returns duplicate advert ids', () => {
    const ids = parseSearch(html).map((r) => r.advertId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('parses space-separated thousands without truncating', () => {
    // "17 000 EUR" must become 17000, never 17 or 0. Likewise "30 000 000 LEK".
    const rows = parseSearch(html)
    const eur = rows.find((r) => r.title.includes('Shitet pallat i ri Parruce'))
    expect(eur?.priceEur).toBe(17000)
    const lek = rows.find((r) => r.title.includes('30 000 000'))
    expect(lek?.priceLek).toBe(30000000)
  })

  it('reports raw prices faithfully, leaving sanity checks to the aggregator', () => {
    // The fixture contains a genuine junk listing ("Apartament ... 60 EUR") and
    // an old-lek quote. parseSearch must not silently drop or "fix" either —
    // normalisation belongs in aggregate.ts where it is visible and testable.
    const rows = parseSearch(html)
    expect(rows.some((r) => r.priceEur === 60)).toBe(true)
  })
})
