import {describe, expect, it} from 'vitest'
import {insideAlbania, isPointLocation, isShortMapsLink, parseMapsLink} from '../parseMapsLink'

describe('parseMapsLink', () => {
  it('prefers the place over the viewport in a Google place link', () => {
    const url =
      'https://www.google.com/maps/place/Liburna+Residence/@41.2401,19.5150,16z/data=!3m1!4b1!4m6!3m5!1s0x134fd!8m2!3d41.239941!4d19.520265!16s'
    expect(parseMapsLink(url)).toEqual({lat: 41.239941, lng: 19.520265, via: 'place'})
  })

  it('reads a dropped pin', () => {
    expect(parseMapsLink('https://www.google.com/maps/search/41.30975,+19.491479?entry=tts')).toEqual({
      lat: 41.30975,
      lng: 19.491479,
      via: 'pin',
    })
  })

  it('takes the directions destination, not the route view, and un-reverses it', () => {
    const url =
      'https://www.google.com/maps/dir/41.32,19.45/Golem/@41.29,19.49,12z/data=!3m1!4b1!4m9!4m8!1m1!4e1!1m5!1m1!1s0x0:0x0!2m2!1d19.5200158!2d41.2469593'
    expect(parseMapsLink(url)).toEqual({lat: 41.2469593, lng: 19.5200158, via: 'destination'})
  })

  it('reads q=, destination= and encoded commas, but treats ll= as the screen centre', () => {
    expect(parseMapsLink('https://maps.google.com/?q=41.3123%2C19.4512')).toMatchObject({lat: 41.3123, lng: 19.4512, via: 'query'})
    expect(parseMapsLink('https://www.google.com/maps/dir/?api=1&destination=41.31,19.45')).toMatchObject({via: 'query'})
    expect(parseMapsLink('https://maps.google.com/maps?ll=41.31,19.45&q=41.3201,19.4433')).toMatchObject({lat: 41.3201, lng: 19.4433, via: 'query'})
    expect(parseMapsLink('https://maps.google.com/maps?ll=41.31,19.45&z=15')).toMatchObject({via: 'viewport'})
  })

  it('reads OpenStreetMap markers and views', () => {
    expect(parseMapsLink('https://www.openstreetmap.org/?mlat=41.3101&mlon=19.4502#map=17/41.31/19.45')).toMatchObject({
      lat: 41.3101,
      lng: 19.4502,
      via: 'query',
    })
    expect(parseMapsLink('https://www.openstreetmap.org/#map=17/41.31/19.45')).toMatchObject({lat: 41.31, lng: 19.45, via: 'viewport'})
  })

  it('marks a bare map view as viewport, which is not a point', () => {
    const p = parseMapsLink('https://www.google.com/maps/@41.3201,19.4555,17z')
    expect(p).toEqual({lat: 41.3201, lng: 19.4555, via: 'viewport'})
    expect(isPointLocation(p)).toBe(false)
    expect(isPointLocation(parseMapsLink('41.3, 19.4'))).toBe(true)
  })

  it('reads plain pairs and degrees-minutes-seconds', () => {
    expect(parseMapsLink(' 41.3123, 19.4512 ')).toEqual({lat: 41.3123, lng: 19.4512, via: 'plain'})
    expect(parseMapsLink('41.3123 19.4512')).toEqual({lat: 41.3123, lng: 19.4512, via: 'plain'})
    const dms = parseMapsLink(`41°18'44.3"N 19°27'04.3"E`)
    expect(dms?.via).toBe('dms')
    expect(dms?.lat).toBeCloseTo(41.312306, 5)
    expect(dms?.lng).toBeCloseTo(19.451194, 5)
  })

  it('returns null for links without coordinates', () => {
    expect(parseMapsLink('https://maps.app.goo.gl/AbCdEf123')).toBeNull()
    expect(parseMapsLink('https://www.google.com/maps/place/Hotel+Adriatik')).toBeNull()
    expect(parseMapsLink('')).toBeNull()
  })

  it('spots short links and pins outside Albania', () => {
    expect(isShortMapsLink('https://maps.app.goo.gl/AbCdEf123')).toBe(true)
    expect(isShortMapsLink('https://www.google.com/maps/@41,19,3z')).toBe(false)
    expect(insideAlbania(41.31, 19.45)).toBe(true)
    expect(insideAlbania(19.45, 41.31)).toBe(false)
  })
})
