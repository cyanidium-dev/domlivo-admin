import {describe, it, expect} from 'vitest'
import {discoverLocalized, filledLocale} from '../discoverLocalized'
import {buildTranslateItems, decideTranslationSets} from '../applyTranslations'
import {decideParseSets, type ParseResponse} from '../applyParse'

const doc = {
  _id: 'district-x',
  _type: 'district',
  title: {_type: 'localizedString', en: 'Center', sq: 'Qendër'},
  heroSubtitle: {_type: 'localizedString', en: 'By the sea'},
  description: {_type: 'localizedText', en: 'Long text.', it: 'Testo lungo.'},
  seo: {metaTitle: {_type: 'localizedString', en: 'Center — buy'}},
  faq: [{question: {_type: 'localizedString', en: 'Q?'}}],
  order: 3,
}

describe('discoverLocalized', () => {
  it('finds nested localized objects, skips array-nested ones and counts them', () => {
    const {entries, skippedInArrays} = discoverLocalized(doc)
    expect(entries.map((e) => e.path).sort()).toEqual(['description', 'heroSubtitle', 'seo.metaTitle', 'title'])
    expect(entries.find((e) => e.path === 'description')?.kind).toBe('text')
    expect(skippedInArrays).toBe(1)
  })
})

describe('buildTranslateItems', () => {
  it('collects base-language texts and reports fields with an empty base', () => {
    const {entries} = discoverLocalized(doc)
    const {items, skippedNoBase} = buildTranslateItems(entries, 'sq')
    expect(items).toEqual([{key: 'title', kind: 'string', text: 'Qendër'}])
    expect(skippedNoBase.sort()).toEqual(['description', 'heroSubtitle', 'seo.metaTitle'])
  })
})

describe('decideTranslationSets', () => {
  const {entries} = discoverLocalized(doc)
  const translated = new Map([
    ['title', {en: 'Center!', uk: 'Центр', ru: 'Центр', sq: 'Qendër', it: 'Centro'}],
    ['description', {en: 'Long text.', uk: 'Довгий текст.', ru: 'Длинный текст.', sq: 'Tekst i gjatë.', it: 'X'}],
  ])

  it('overwrite OFF fills only empty locales and never the base', () => {
    const {setOps} = decideTranslationSets(entries, translated, {base: 'en', overwrite: false})
    expect(setOps['title.uk']).toBe('Центр')
    expect(setOps['title.ru']).toBe('Центр')
    expect(setOps['title.it']).toBe('Centro')
    expect('title.sq' in setOps).toBe(false) // already filled
    expect('title.en' in setOps).toBe(false) // base, never written
    expect('description.it' in setOps).toBe(false) // already filled
    expect(setOps['description.sq']).toBe('Tekst i gjatë.')
  })

  it('overwrite ON replaces filled locales but still never the base', () => {
    const {setOps} = decideTranslationSets(entries, translated, {base: 'en', overwrite: true})
    expect(setOps['title.sq']).toBe('Qendër')
    expect(setOps['description.it']).toBe('X')
    expect('title.en' in setOps).toBe(false)
  })
})

describe('decideParseSets', () => {
  const resp: ParseResponse = {
    parsed: {
      facts: {dealType: 'sale', areaM2: 76, bedrooms: 2, bathrooms: null, yearBuilt: 2019, address: 'Rruga X'},
      editorial: {
        title: {en: 'T-en', uk: 'T-uk', ru: 'T-ru', sq: 'T-sq', it: 'T-it'},
        shortDescription: {en: 's', uk: 's', ru: 's', sq: 's', it: 's'},
        description: {en: 'd', uk: 'd', ru: 'd', sq: 'd', it: 'd'},
      },
      parserNotes: '',
    },
    refs: {propertyTypeId: 'pt-1', cityId: 'c-1', districtId: null, amenityIds: ['am-1'], unmatched: []},
    validation: {priceEur: 59000, warnings: []},
    coords: {lat: 40.5, lng: 19.5},
  }

  it('fills empty fields, keeps filled ones when overwrite is off', () => {
    const current = {title: {en: 'Existing title'}, price: 61000, agent: {_ref: 'a'}, gallery: [{}]}
    const {setOps, skipped} = decideParseSets(current, resp, false)
    expect('title.en' in setOps).toBe(false)
    expect(setOps['title.uk']).toBe('T-uk')
    expect('price' in setOps).toBe(false)
    expect(skipped).toContain('price')
    expect(setOps['area']).toBe(76)
    expect(setOps['city']).toEqual({_type: 'reference', _ref: 'c-1'})
    expect(setOps['coordinatesLat']).toBe(40.5)
    expect('agent' in setOps).toBe(false)
    expect('gallery' in setOps).toBe(false)
  })

  it('overwrite ON replaces parsed fields but never invents empty values', () => {
    const current = {price: 61000, status: 'rent'}
    const {setOps} = decideParseSets(current, resp, true)
    expect(setOps['price']).toBe(59000)
    expect(setOps['status']).toBe('sale')
    expect('bathrooms' in setOps).toBe(false) // parsed null -> not written even with overwrite
  })
})
