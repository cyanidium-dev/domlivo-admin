import {describe, it, expect} from 'vitest'
import {locationRequestId, normalizeLocationName, planLocationRequests, unresolvedLocations} from '../locationRequests'

describe('unresolvedLocations', () => {
  it('picks cities and districts out of the unmatched list, ignoring amenities', () => {
    expect(unresolvedLocations(['city "Tiranë"', 'amenity "Sauna"', 'district "Bllok"'])).toEqual([
      {kind: 'city', name: 'Tiranë'},
      {kind: 'district', name: 'Bllok'},
    ])
  })
})

describe('planLocationRequests', () => {
  it('agrees with the bot on the id for a given place', () => {
    // Pinned against domlivo-bot/src/locationRequests.ts — one row per place,
    // whichever intake route asked for it.
    expect(planLocationRequests(['city "Tiranë"'])).toEqual([
      {id: 'location-request-city-tirane', kind: 'city', name: 'Tiranë', key: 'tirane'},
    ])
    expect(locationRequestId('district', 'kodraediellit')).toBe('location-request-district-kodraediellit')
  })

  it('keeps a city and a district of the same name apart', () => {
    expect(planLocationRequests(['city "Himarë"', 'district "Himarë"']).map((p) => p.id)).toEqual([
      'location-request-city-himare',
      'location-request-district-himare',
    ])
  })

  it('refuses names that are not places, and collapses repeats', () => {
    expect(planLocationRequests(['city "12345"'])).toEqual([])
    expect(normalizeLocationName('<b>Tirana</b>').ok).toBe(false)
    expect(planLocationRequests(['city "Tiranë"', 'city "tirane"'])).toHaveLength(1)
  })
})
