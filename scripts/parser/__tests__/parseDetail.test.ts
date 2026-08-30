import {describe, it, expect} from 'vitest'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {parseDetail} from '../parseDetail'

const html = readFileSync(join(__dirname, 'fixtures/detail-19644148.html'), 'utf8')

describe('parseDetail', () => {
  it('extracts area, condition, address and rooms', () => {
    const d = parseDetail(html, '19644148')
    expect(d.advertId).toBe('19644148')
    expect(d.areaM2).toBe(100)
    expect(d.condition).toMatch(/i ri/i)
    expect(d.address).toMatch(/parruce/i)
    expect(d.rooms).toBe(3)
  })

  it('reads the listing type so rentals can be excluded', () => {
    expect(parseDetail(html, '19644148').listingType).toMatch(/shitet/i)
  })

  it('handles the entity-encoded label and the <sup> in "100 m<sup>2</sup>"', () => {
    // The label is "Sip&#235;rfaqe" and the unit is marked up, so neither a
    // naive string match on "Sipërfaqe:" nor one on "m2" works on raw HTML.
    expect(html.includes('Sip&#235;rfaqe')).toBe(true)
    expect(parseDetail(html, '19644148').areaM2).toBe(100)
  })

  it('never returns a price — detail pages render it client-side', () => {
    const d = parseDetail(html, '19644148') as Record<string, unknown>
    expect('priceEur' in d).toBe(false)
    expect('priceLek' in d).toBe(false)
  })

  it('returns null area rather than guessing when the field is absent', () => {
    expect(parseDetail('<html><body>nothing</body></html>', '1').areaM2).toBeNull()
  })
})
