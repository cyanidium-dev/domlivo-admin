import {describe, expect, it} from 'vitest'
import {parseTypeCityPairs} from '../typeCityRegistry'

const VALID = {
  pairs: [
    {type: 'apartment', city: 'tirana'},
    {type: 'villa', city: 'sarande'},
  ],
}

describe('parseTypeCityPairs', () => {
  it('accepts a valid registry and returns typed pairs', () => {
    expect(parseTypeCityPairs(VALID)).toEqual([
      {type: 'apartment', city: 'tirana'},
      {type: 'villa', city: 'sarande'},
    ])
  })
  it('throws naming the path on a missing field', () => {
    expect(() => parseTypeCityPairs({pairs: [{type: 'apartment'}]})).toThrow(/pairs\[0\]\.city/)
    expect(() => parseTypeCityPairs({pairs: [{city: 'tirana'}]})).toThrow(/pairs\[0\]\.type/)
  })
  it('throws on non-slug characters', () => {
    expect(() => parseTypeCityPairs({pairs: [{type: 'Apartment', city: 'tirana'}]})).toThrow(
      /pairs\[0\]\.type/,
    )
    expect(() => parseTypeCityPairs({pairs: [{type: 'villa', city: 'tirana!'}]})).toThrow(
      /pairs\[0\]\.city/,
    )
  })
  it('throws on a duplicate pair, naming the second occurrence', () => {
    expect(() =>
      parseTypeCityPairs({
        pairs: [
          {type: 'apartment', city: 'tirana'},
          {type: 'apartment', city: 'tirana'},
        ],
      }),
    ).toThrow(/pairs\[1\]/)
  })
  it('throws when pairs is missing or not an array', () => {
    expect(() => parseTypeCityPairs({})).toThrow(/pairs/)
    expect(() => parseTypeCityPairs({pairs: 'x'})).toThrow(/pairs/)
  })
})
