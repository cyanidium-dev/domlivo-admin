import {describe, it, expect} from 'vitest'
import {discoverLocalized, filledLocale} from '../discoverLocalized'
import {buildTranslateItems, chunkTranslateItems, decideTranslationSets} from '../applyTranslations'
import {applySetOps, decideParseSets, missingForPublish, type ParseResponse} from '../applyParse'
import {pickFreeSlug, slugify} from '../slug'

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
  it('finds nested localized objects, and skips array items that carry no _key', () => {
    const {entries, skippedNoKey} = discoverLocalized(doc)
    expect(entries.map((e) => e.path).sort()).toEqual(['description', 'heroSubtitle', 'seo.metaTitle', 'title'])
    expect(entries.find((e) => e.path === 'description')?.kind).toBe('text')
    expect(skippedNoKey).toBe(1) // the faq item in the fixture has no _key
  })

  it('addresses array items by _key, which is what makes them patchable', () => {
    const {entries, skippedNoKey} = discoverLocalized({
      _type: 'property',
      propertyOffers: [
        {_key: 'a1', _type: 'propertyOffer', title: {_type: 'localizedString', en: 'Sea view'}},
        {_key: 'b2', _type: 'propertyOffer', title: {_type: 'localizedString', en: 'Parking'}},
      ],
    })
    expect(entries.map((e) => e.path)).toEqual([
      'propertyOffers[_key=="a1"].title',
      'propertyOffers[_key=="b2"].title',
    ])
    expect(skippedNoKey).toBe(0)
  })

  it('reaches localized fields nested deeper inside a keyed item', () => {
    const {entries} = discoverLocalized({
      _type: 'district',
      faqItems: [{_key: 'f1', question: {_type: 'localizedString', en: 'Q?'}, meta: {tag: {_type: 'localizedString', en: 'Tax'}}}],
    })
    expect(entries.map((e) => e.path).sort()).toEqual([
      'faqItems[_key=="f1"].meta.tag',
      'faqItems[_key=="f1"].question',
    ])
  })

  it('counts a keyless item once per localized field it hides, and writes nothing for it', () => {
    const {entries, skippedNoKey} = discoverLocalized({
      _type: 'district',
      faqItems: [{question: {_type: 'localizedString', en: 'Q?'}, answer: {_type: 'localizedText', en: 'A.'}}],
    })
    expect(entries).toEqual([])
    expect(skippedNoKey).toBe(2)
  })

  it('recognizes _type-less locale-shaped objects (bot-written drafts)', () => {
    const botDoc = {
      _id: 'drafts.property-tg-1',
      _type: 'property',
      title: {en: '1-bedroom apartment in Orikum', uk: 'Квартира з 1 спальнею', ru: '', sq: '', it: ''},
      description: {
        en: 'This 1-bedroom apartment (52.5 m² total) is located on the 3rd floor of a modern building with an elevator in Orikum, Albania. Fully furnished, sea view.',
        uk: '', ru: '', sq: '', it: '',
      },
      address: {_type: 'localizedString', en: 'Rruga X'},
      price: 100000,
      slug: {_type: 'slug', current: 'x'},
      agent: {_type: 'reference', _ref: 'a1'},
    }
    const {entries} = discoverLocalized(botDoc)
    expect(entries.map((e) => e.path).sort()).toEqual(['address', 'description', 'title'])
    expect(entries.find((e) => e.path === 'title')?.kind).toBe('string')
    expect(entries.find((e) => e.path === 'description')?.kind).toBe('text')
  })

  it('does not misread non-localized objects or all-empty locale shapes', () => {
    const {entries} = discoverLocalized({
      _type: 'property',
      slug: {current: 'x'},
      empty: {en: '', uk: ''},
      coords: {lat: 1, lng: 2},
    })
    expect(entries).toEqual([])
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

describe('chunkTranslateItems', () => {
  const item = (key: string, len: number) => ({key, kind: 'text' as const, text: 'x'.repeat(len)})

  it('packs items within both the item and the character cap', () => {
    const items = Array.from({length: 9}, (_, i) => item(`f${i}`, 100))
    const {batches, oversized} = chunkTranslateItems(items, {maxItems: 4, maxChars: 1000})
    expect(batches.map((b) => b.length)).toEqual([4, 4, 1])
    expect(oversized).toEqual([])
  })

  it('starts a new batch when the character cap would be exceeded', () => {
    const items = [item('a', 600), item('b', 600), item('c', 100)]
    const {batches} = chunkTranslateItems(items, {maxItems: 40, maxChars: 1000})
    expect(batches.map((b) => b.map((i) => i.key))).toEqual([['a'], ['b', 'c']])
  })

  it('drops an item that cannot fit in any request and reports it', () => {
    const {batches, oversized} = chunkTranslateItems([item('huge', 2000), item('ok', 10)], {maxItems: 40, maxChars: 1000})
    expect(oversized).toEqual(['huge'])
    expect(batches.map((b) => b.map((i) => i.key))).toEqual([['ok']])
  })

  it('returns no batches for no items', () => {
    expect(chunkTranslateItems([], {maxItems: 40, maxChars: 1000}).batches).toEqual([])
  })
})

describe('slug', () => {
  it('matches the bot slugify on the inputs both repos see', () => {
    expect(slugify('2-bedroom apartment in Currila, Durrës')).toBe('2-bedroom-apartment-in-currila-durres')
    expect(slugify('Vilë me 4 dhoma gjumi në Gjirin e Lalzit')).toBe('vile-me-4-dhoma-gjumi-ne-gjirin-e-lalzit')
    expect(slugify('  Trailing --- dashes --- ')).toBe('trailing-dashes')
  })

  it('picks the first free suffix and leaves an uncontested slug alone', () => {
    expect(pickFreeSlug('flat-in-durres', [])).toBe('flat-in-durres')
    expect(pickFreeSlug('flat-in-durres', ['flat-in-durres'])).toBe('flat-in-durres-2')
    expect(pickFreeSlug('flat-in-durres', ['flat-in-durres', 'flat-in-durres-2'])).toBe('flat-in-durres-3')
  })
})

describe('applySetOps', () => {
  it('merges a locale path into the field it belongs to and replaces whole fields', () => {
    const after = applySetOps({title: {en: 'Old', ru: 'Старое'}, price: 1}, {'title.en': 'New', price: 2})
    expect(after.title).toEqual({en: 'New', ru: 'Старое'})
    expect(after.price).toBe(2)
  })

  it('creates the parent when the field was absent', () => {
    expect(applySetOps({}, {'title.en': 'New'}).title).toEqual({en: 'New'})
  })
})

describe('missingForPublish', () => {
  it('names every required field still empty, by its Studio label', () => {
    expect(missingForPublish({title: {en: 'T'}, status: 'sale', price: 1, city: {_ref: 'c'}, type: {_ref: 't'}})).toEqual([
      'URL slug',
      'Agent',
      'Photos',
    ])
  })

  it('is empty when the draft is complete', () => {
    expect(
      missingForPublish({
        title: {en: 'T'},
        slug: {current: 's'},
        agent: {_ref: 'a'},
        type: {_ref: 't'},
        status: 'sale',
        price: 1,
        city: {_ref: 'c'},
        gallery: [{_key: 'g'}],
      }),
    ).toEqual([])
  })

  it('treats an all-empty locale object as missing', () => {
    expect(missingForPublish({title: {en: '', ru: ''}})).toContain('Title')
  })
})

describe('decideParseSets', () => {
  const resp: ParseResponse = {
    parsed: {
      facts: {dealType: 'sale', areaM2: 76, bedrooms: 2, rooms: 3, bathrooms: null, yearBuilt: 2019, address: 'Rruga X'},
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

  it('derives a slug when the document has none, from the English title', () => {
    const {setOps} = decideParseSets({}, resp, false)
    expect(setOps['slug']).toEqual({_type: 'slug', current: 't-en'})
  })

  it('never touches an existing slug, overwrite or not — a published URL is not editorial', () => {
    const current = {slug: {_type: 'slug', current: 'keep-me'}}
    expect('slug' in decideParseSets(current, resp, false).setOps).toBe(false)
    expect('slug' in decideParseSets(current, resp, true).setOps).toBe(false)
  })

  it('overwrite ON replaces parsed fields but never invents empty values', () => {
    const current = {price: 61000, status: 'rent'}
    const {setOps} = decideParseSets(current, resp, true)
    expect(setOps['price']).toBe(59000)
    expect(setOps['status']).toBe('sale')
    expect('bathrooms' in setOps).toBe(false) // parsed null -> not written even with overwrite
  })
})

describe('rooms', () => {
  const withRooms: ParseResponse = {
    parsed: {
      facts: {dealType: 'sale', areaM2: 60, bedrooms: 1, rooms: 2, bathrooms: 1, yearBuilt: null, address: null},
      editorial: {
        title: {en: 'T', uk: 'T', ru: 'T', sq: 'T', it: 'T'},
        shortDescription: {en: 's', uk: 's', ru: 's', sq: 's', it: 's'},
        description: {en: 'd', uk: 'd', ru: 'd', sq: 'd', it: 'd'},
      },
      parserNotes: '',
    },
    refs: {propertyTypeId: null, cityId: null, districtId: null, amenityIds: [], unmatched: []},
    validation: {priceEur: null, warnings: []},
    coords: null,
  }

  it('writes the room count alongside the bedroom count', () => {
    const {setOps} = decideParseSets({}, withRooms, false)
    expect(setOps.rooms).toBe(2)
    expect(setOps.bedrooms).toBe(1)
  })

  it('keeps an editor’s own figure when overwrite is off', () => {
    const {setOps, skipped} = decideParseSets({rooms: 4}, withRooms, false)
    expect('rooms' in setOps).toBe(false)
    expect(skipped).toContain('rooms')
  })

  it('writes nothing when the listing did not state a room count', () => {
    const noRooms = {...withRooms, parsed: {...withRooms.parsed, facts: {...withRooms.parsed.facts, rooms: null}}}
    expect('rooms' in decideParseSets({}, noRooms, true).setOps).toBe(false)
  })
})
