import {describe, it, expect} from 'vitest'
import {joinRows, aggregate, normaliseLek} from '../aggregate'
import type {SearchRow} from '../parseSearch'
import type {DetailRow} from '../parseDetail'

const s = (
  advertId: string,
  priceEur: number | null,
  priceLek: number | null,
  isRent = false,
): SearchRow => ({advertId, priceEur, priceLek, isRent, title: `listing ${advertId}`})

const d = (
  advertId: string,
  areaM2: number | null,
  condition: string,
  address = 'Parruce',
): DetailRow => ({advertId, areaM2, condition, address, rooms: 2, listingType: 'Shitet'})

describe('normaliseLek', () => {
  it('leaves a plausible new-lek price alone', () => {
    expect(normaliseLek(5_800_000)).toBe(5_800_000)
  })

  it('divides an old-lek quote by ten', () => {
    // "30 000 000 LEK" for a 57 m2 Shkoder flat is old lek: 3,000,000 new lek.
    expect(normaliseLek(30_000_000)).toBe(3_000_000)
  })
})

describe('joinRows', () => {
  const search = [s('1', 59184, null), s('2', null, 5_800_000), s('3', 450, null, true), s('9', 100000, null)]
  const detail = [d('1', 76, 'I perdorur'), d('2', 80, 'I ri'), d('3', 55, 'I ri'), d('77', 60, 'I ri')]

  it('joins strictly on advert id', () => {
    expect(joinRows(search, detail).map((j) => j.advertId).sort()).toEqual(['1', '2', '3'])
  })

  it('drops rows with no partner instead of pairing them by position', () => {
    // Regression: the browser-era join paired a 57 m2 flat with a EUR 306,000
    // price and produced EUR 5,371/m2 in Shkoder. Orphans must vanish.
    const joined = joinRows(search, detail)
    expect(joined.find((j) => j.advertId === '9')).toBeUndefined()
    expect(joined.find((j) => j.advertId === '77')).toBeUndefined()
  })

  it('converts lek to eur at the supplied rate', () => {
    expect(joinRows(search, detail, 98).find((j) => j.advertId === '2')!.priceEur).toBe(59184)
  })
})

describe('aggregate', () => {
  const search = [s('1', 59184, null), s('2', null, 5_800_000), s('3', 450, null, true)]
  const detail = [d('1', 76, 'I perdorur'), d('2', 80, 'I ri'), d('3', 55, 'I ri')]

  it('splits new from resale and reports sample sizes', () => {
    const out = aggregate(joinRows(search, detail, 98), 'parruce')
    expect(out.zone).toBe('parruce')
    expect(out.basis).toBe('asking')
    expect(out.sale.new.n).toBe(1)
    expect(out.sale.resale.n).toBe(1)
    expect(out.sale.resale.median).toBe(779)
    expect(out.rent.n).toBe(1)
  })

  it('marks a band red when the sample is under five', () => {
    expect(aggregate(joinRows(search, detail, 98), 'parruce').sale.new.confidence).toBe('red')
  })

  it('never marks an asking-price band green', () => {
    const many = Array.from({length: 20}, (_, i) => s(String(100 + i), 80000, null))
    const md = Array.from({length: 20}, (_, i) => d(String(100 + i), 80, 'I ri'))
    expect(aggregate(joinRows(many, md), 'z').sale.new.confidence).toBe('yellow')
  })

  it('discards impossible price-per-m2 values and counts them', () => {
    // EUR 306,000 over 20 m2 = EUR 15,300/m2, above anything in Albania.
    // Note EUR 306,000 over 57 m2 (EUR 5,368/m2) is deliberately NOT filtered —
    // that is plausible Tirana prime, and the bound is national. Zone-level
    // plausibility is a human check, see the plan's Task 5 Step 5.
    const out = aggregate(joinRows([s('5', 306000, null)], [d('5', 20, 'I ri')]), 'z')
    expect(out.sale.new.n).toBe(0)
    expect(out.dropped.outOfRange).toBe(1)
  })

  it('keeps prime-priced but plausible listings', () => {
    const out = aggregate(joinRows([s('7', 306000, null)], [d('7', 57, 'I ri')]), 'z')
    expect(out.sale.new.n).toBe(1)
    expect(out.sale.new.median).toBe(5368)
  })

  it('rescues an old-lek listing that would otherwise be dropped', () => {
    // 30,000,000 old lek / 57 m2 -> EUR 537/m2, inside range, not EUR 5,371.
    const out = aggregate(joinRows([s('6', null, 30_000_000)], [d('6', 57, 'I perdorur')], 98), 'z')
    expect(out.sale.resale.n).toBe(1)
    expect(out.sale.resale.median).toBeGreaterThan(400)
    expect(out.sale.resale.median).toBeLessThan(700)
  })
})
