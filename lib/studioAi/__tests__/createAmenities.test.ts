import {describe, it, expect} from 'vitest'
import {MAX_NEW_AMENITIES_PER_LISTING, amenityDocFor, normalizeAmenityName, planNewAmenities} from '../createAmenities'

describe('normalizeAmenityName', () => {
  it('accepts a plausible name and collapses whitespace', () => {
    expect(normalizeAmenityName('  Sauna   room ')).toEqual({ok: true, name: 'Sauna room', key: 'saunaroom', slug: 'sauna-room'})
  })

  it('folds case, diacritics and separators into one key', () => {
    const a = normalizeAmenityName('Wi-Fi')
    const b = normalizeAmenityName('wifi')
    expect(a.ok && b.ok && a.key === b.key).toBe(true)
    const c = normalizeAmenityName('Pishinë')
    expect(c.ok && c.key).toBe('pishine')
  })

  it('refuses anything that is not an amenity name', () => {
    expect(normalizeAmenityName('a').ok).toBe(false)
    expect(normalizeAmenityName('x'.repeat(61)).ok).toBe(false)
    expect(normalizeAmenityName('12345').ok).toBe(false)
    expect(normalizeAmenityName('call 069 45 67 890').ok).toBe(false)
    expect(normalizeAmenityName('<script>alert(1)</script>').ok).toBe(false)
  })

  it('agrees with the bot implementation on the wordings both see', () => {
    // Pinned against domlivo-bot/src/createAmenities.ts — both intake routes
    // must mint the same id for the same wording.
    expect(normalizeAmenityName('Private pool')).toEqual({ok: true, name: 'Private pool', key: 'privatepool', slug: 'private-pool'})
    expect(normalizeAmenityName('Game room')).toEqual({ok: true, name: 'Game room', key: 'gameroom', slug: 'game-room'})
  })
})

describe('amenityDocFor', () => {
  it('is a published, flagged document identified by the fold key', () => {
    expect(amenityDocFor({name: 'Sauna', key: 'sauna', slug: 'sauna'})).toEqual({
      _id: 'amenity-sauna',
      _type: 'amenity',
      title: {_type: 'localizedString', en: 'Sauna'},
      slug: {_type: 'slug', current: 'sauna'},
      active: true,
      needsReview: true,
    })
  })

  it('never mints a draft id — a reference to a draft is broken in published content', () => {
    expect(amenityDocFor({name: 'Sauna', key: 'sauna', slug: 'sauna'})._id.startsWith('drafts.')).toBe(false)
  })
})

describe('planNewAmenities', () => {
  it('plans one document per unmatched amenity and leaves other kinds alone', () => {
    const {docs, stillUnmatched} = planNewAmenities(['amenity "Sauna"', 'city "Atlantis"', 'amenity "Game room"'])
    expect(docs.map((d) => d._id)).toEqual(['amenity-sauna', 'amenity-gameroom'])
    expect(stillUnmatched).toEqual(['city "Atlantis"'])
  })

  it('collapses repeats of one wording inside a single listing', () => {
    expect(planNewAmenities(['amenity "Sauna"', 'amenity "sauna"']).docs).toHaveLength(1)
  })

  it('refuses junk rather than creating it, and says so', () => {
    const {docs, stillUnmatched} = planNewAmenities(['amenity "12345"'])
    expect(docs).toEqual([])
    expect(stillUnmatched).toEqual(['amenity "12345"'])
  })

  it('caps what one listing can add to the catalogue', () => {
    const many = Array.from({length: MAX_NEW_AMENITIES_PER_LISTING + 4}, (_, i) => `amenity "Feature number ${i}"`)
    const {docs, stillUnmatched} = planNewAmenities(many)
    expect(docs).toHaveLength(MAX_NEW_AMENITIES_PER_LISTING)
    expect(stillUnmatched).toHaveLength(4)
  })
})

describe('identity vs URL', () => {
  it('keeps the id separator-blind but gives the slug real word breaks', () => {
    const {docs} = planNewAmenities(['amenity "Wood flooring"'])
    expect(docs[0]!._id).toBe('amenity-woodflooring')
    expect(docs[0]!.slug.current).toBe('wood-flooring')
  })

  it('still lands "Wi-Fi" and "wifi" on one document', () => {
    expect(planNewAmenities(['amenity "Wi-Fi"', 'amenity "wifi"']).docs).toHaveLength(1)
  })
})
