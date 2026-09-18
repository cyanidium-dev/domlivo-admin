import {describe, expect, it} from 'vitest'
import {assignUrlSlugs, baseUrlSlug, slugifyWords, type UrlSlugInput} from '../propertyUrlSlug'

const durres = {en: 'Durres', ru: 'Дуррес', uk: 'Дуррес', sq: 'Durrësi', it: 'Durazzo', pl: 'Durrës', de: 'Durrës'}
const plazh = {en: 'Plazh', ru: 'Плаж', uk: 'Плаж', sq: 'Plazhi', it: 'Plazh', pl: 'Plazh', de: 'Plazh'}
const apartment = {en: 'Apartment', ru: 'Квартира', uk: 'Квартира', sq: 'Apartament', it: 'Appartamento', pl: 'Mieszkanie', de: 'Wohnung'}

const flat: UrlSlugInput = {
  typeSlug: 'apartment',
  typeTitle: apartment,
  cityTitle: durres,
  districtTitle: plazh,
  bedrooms: 2,
  area: 85,
}

describe('baseUrlSlug', () => {
  it('builds type, layout, district, city and area in the locale', () => {
    expect(baseUrlSlug(flat, 'en')).toBe('apartment-2-1-plazh-durres-85m2')
    expect(baseUrlSlug(flat, 'ru')).toBe('kvartira-2-1-plazh-durres-85m2')
    expect(baseUrlSlug(flat, 'uk')).toBe('kvartyra-2-1-plazh-durres-85m2')
    expect(baseUrlSlug(flat, 'it')).toBe('appartamento-2-1-plazh-durazzo-85m2')
    expect(baseUrlSlug(flat, 'de')).toBe('wohnung-2-1-plazh-durres-85m2')
  })

  it('keeps the g of an Albanian place name in Ukrainian', () => {
    expect(baseUrlSlug({...flat, districtTitle: {uk: 'Голем'}}, 'uk')).toBe('kvartyra-2-1-golem-durres-85m2')
  })

  it('uses the indefinite place name in Albanian', () => {
    expect(baseUrlSlug(flat, 'sq')).toBe('apartament-2-1-plazh-durres-85m2')
  })

  it('reads the layout from rooms when bedrooms are missing', () => {
    expect(baseUrlSlug({...flat, bedrooms: null, rooms: 3}, 'en')).toBe('apartment-2-1-plazh-durres-85m2')
  })

  it('gives land its plot size and no layout', () => {
    const land = {typeSlug: 'land', typeTitle: {en: 'Land'}, cityTitle: durres, plotArea: 756, area: 0}
    expect(baseUrlSlug(land, 'en')).toBe('land-durres-756m2')
  })

  it('drops a district that only repeats the city', () => {
    expect(baseUrlSlug({...flat, districtTitle: {en: 'Durres'}}, 'en')).toBe('apartment-2-1-durres-85m2')
  })
})

describe('slugifyWords', () => {
  it('strips Albanian, Polish and German letters', () => {
    expect(slugifyWords('Shkëmbi i Kavajës', 'sq')).toBe('shkembi-i-kavajes')
    expect(slugifyWords('Działka', 'pl')).toBe('dzialka')
    expect(slugifyWords('Grundstück', 'de')).toBe('grundstuck')
  })
})

describe('assignUrlSlugs', () => {
  it('numbers twins and keeps a slug one listing owns in every locale', () => {
    const out = assignUrlSlugs([
      {id: 'a', input: flat},
      {id: 'b', input: flat},
    ])
    expect(out.get('a')!.en).toBe('apartment-2-1-plazh-durres-85m2')
    expect(out.get('b')!.en).toBe('apartment-2-1-plazh-durres-85m2-2')
  })

  it('never renames an existing slug', () => {
    const out = assignUrlSlugs([
      {id: 'b', input: flat},
      {id: 'a', input: flat, existing: {en: 'apartment-2-1-plazh-durres-85m2'}},
    ])
    expect(out.get('a')!.en).toBe('apartment-2-1-plazh-durres-85m2')
    expect(out.get('b')!.en).toBe('apartment-2-1-plazh-durres-85m2-2')
  })

  it('does not reuse another listing\'s legacy slug', () => {
    const out = assignUrlSlugs([{id: 'a', input: flat}], [['apartment-2-1-plazh-durres-85m2', 'z']])
    expect(out.get('a')!.en).toBe('apartment-2-1-plazh-durres-85m2-2')
  })

  it('lets one listing share a slug across locales', () => {
    const studio = {typeSlug: 'studio', typeTitle: {en: 'Studio', de: 'Studio', pl: 'Studio'}, cityTitle: {en: 'Durres', de: 'Durrës', pl: 'Durrës'}, area: 42}
    const out = assignUrlSlugs([{id: 'a', input: studio}])
    expect(out.get('a')!.en).toBe('studio-durres-42m2')
    expect(out.get('a')!.de).toBe('studio-durres-42m2')
  })
})
