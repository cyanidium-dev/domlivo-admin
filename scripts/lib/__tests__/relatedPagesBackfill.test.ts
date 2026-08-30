import {describe, expect, it} from 'vitest'
import {
  insertSections,
  isGeneratorSiblingBlock,
  relatedSection,
  sameTags,
} from '../relatedPagesBackfill'

describe('isGeneratorSiblingBlock — replace vs leave-alone (audit F-2)', () => {
  const generatorBlock = {
    _key: 'related',
    _type: 'landingCollectionSection',
    mode: 'manual',
    manualItems: [{_ref: 'landing-comparison-a'}, {_ref: 'landing-comparison-b'}],
  }
  it('matches the pristine generator fingerprint', () => {
    expect(isGeneratorSiblingBlock(generatorBlock)).toBe(true)
  })
  it('leaves auto-mode collection blocks alone', () => {
    expect(isGeneratorSiblingBlock({...generatorBlock, mode: 'auto'})).toBe(false)
  })
  it('leaves blocks with any non-comparison ref alone', () => {
    expect(
      isGeneratorSiblingBlock({
        ...generatorBlock,
        manualItems: [{_ref: 'landing-comparison-a'}, {_ref: 'landing-tirana'}],
      }),
    ).toBe(false)
  })
  it('leaves empty or ref-less manualItems alone', () => {
    expect(isGeneratorSiblingBlock({...generatorBlock, manualItems: []})).toBe(false)
    expect(isGeneratorSiblingBlock({...generatorBlock, manualItems: [{}]})).toBe(false)
  })
  it('leaves every other section type alone', () => {
    expect(isGeneratorSiblingBlock({_key: 'cta', _type: 'ctaSection'})).toBe(false)
    expect(isGeneratorSiblingBlock({_key: 'x', _type: 'relatedPagesAutoSection'})).toBe(false)
  })
})

describe('insertSections — position before a trailing CTA', () => {
  const cta = {_key: 'cta', _type: 'ctaSection'}
  const hero = {_key: 'hero', _type: 'heroSection'}
  const toInsert = [relatedSection('x', 'cityDistricts')]
  it('inserts before a trailing ctaSection', () => {
    expect(insertSections([hero, cta], toInsert).map((s) => s._key)).toEqual(['hero', 'x', 'cta'])
  })
  it('appends when the last section is not a cta', () => {
    expect(insertSections([cta, hero], toInsert).map((s) => s._key)).toEqual(['cta', 'hero', 'x'])
  })
  it('appends to an empty array', () => {
    expect(insertSections([], toInsert).map((s) => s._key)).toEqual(['x'])
  })
  it('does not mutate the input', () => {
    const input = [hero, cta]
    insertSections(input, toInsert)
    expect(input.map((s) => s._key)).toEqual(['hero', 'cta'])
  })
})

describe('sameTags — idempotency comparison', () => {
  it('is order-insensitive', () => {
    expect(sameTags(['a', 'b'], ['b', 'a'])).toBe(true)
  })
  it('rejects length mismatches and undefined', () => {
    expect(sameTags(['a'], ['a', 'b'])).toBe(false)
    expect(sameTags(undefined, [])).toBe(false)
    expect(sameTags([], [])).toBe(true)
  })
})

describe('relatedSection — defaults', () => {
  it('carries the section type, enabled flag and clamped default limit', () => {
    expect(relatedSection('k', 'zoneComparisons')).toMatchObject({
      _key: 'k',
      _type: 'relatedPagesAutoSection',
      enabled: true,
      mode: 'zoneComparisons',
      limit: 6,
    })
  })
})
