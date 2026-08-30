import fs from 'node:fs'
import path from 'node:path'
import {describe, it, expect} from 'vitest'
import {
  parseRegistry,
  flattenCities,
  flattenDistricts,
  roleOf,
  crossCheckMetricsZones,
  LOCALES,
  type ZoneRegistry,
} from '../zoneRegistry'

const FIVE = {en: 'A', uk: 'А', ru: 'А', sq: 'A', it: 'A'}

function registry(overrides: Record<string, unknown> = {}): unknown {
  return {
    countries: {
      albania: {
        cities: {
          durres: {
            title: FIVE,
            districts: [{slug: 'qerret', title: FIVE}],
            ...overrides,
          },
        },
      },
    },
  }
}

describe('parseRegistry', () => {
  it('accepts a well-formed registry', () => {
    expect(() => parseRegistry(registry())).not.toThrow()
  })

  it('rejects a title missing a locale', () => {
    const {it: _dropped, ...fourLocales} = FIVE
    expect(() =>
      parseRegistry(registry({districts: [{slug: 'qerret', title: fourLocales}]})),
    ).toThrow(/missing locale\(s\) it/)
  })

  it('names the zone whose title is incomplete', () => {
    const {ru: _dropped, ...four} = FIVE
    expect(() =>
      parseRegistry(registry({districts: [{slug: 'mali-i-robit', title: four}]})),
    ).toThrow(/albania\/durres\/mali-i-robit/)
  })

  it('rejects an invalid slug', () => {
    expect(() => parseRegistry(registry({districts: [{slug: 'Mali Robit', title: FIVE}]}))).toThrow(
      /not a valid slug/,
    )
  })

  it('rejects a district slug declared twice', () => {
    const dup = {
      countries: {
        albania: {
          cities: {
            durres: {title: FIVE, districts: [{slug: 'qerret', title: FIVE}]},
            vlore: {title: FIVE, districts: [{slug: 'qerret', title: FIVE}]},
          },
        },
      },
    }
    expect(() => parseRegistry(dup)).toThrow(/declared twice/)
  })

  it('rejects an unknown role', () => {
    expect(() =>
      parseRegistry(registry({districts: [{slug: 'qerret', title: FIVE, role: 'draft'}]})),
    ).toThrow(/role must be/)
  })

  it('rejects a missing districts array', () => {
    expect(() => parseRegistry(registry({districts: undefined}))).toThrow(/"districts" must be an array/)
  })
})

describe('flatten', () => {
  it('carries the country down to the city', () => {
    const cities = flattenCities(parseRegistry(registry()) as ZoneRegistry)
    expect(cities).toHaveLength(1)
    expect(cities[0]).toMatchObject({slug: 'durres', countrySlug: 'albania'})
  })

  it('carries country and city down to the district', () => {
    const districts = flattenDistricts(parseRegistry(registry()) as ZoneRegistry)
    expect(districts[0]).toMatchObject({slug: 'qerret', citySlug: 'durres', countrySlug: 'albania'})
  })
})

describe('roleOf', () => {
  it('defaults to page', () => {
    expect(roleOf({slug: 'qerret', title: FIVE})).toBe('page')
  })
  it('honours metric-only', () => {
    expect(roleOf({slug: 'golem-1st-line', title: FIVE, role: 'metric-only'})).toBe('metric-only')
  })
})

describe('crossCheckMetricsZones', () => {
  const parsed = parseRegistry(registry()) as ZoneRegistry

  it('is empty when every metrics zone is declared', () => {
    expect(crossCheckMetricsZones(parsed, ['qerret', 'durres'])).toEqual([])
  })

  it('reports a metrics zone nobody declared', () => {
    expect(crossCheckMetricsZones(parsed, ['qerret', 'ghost-zone'])).toEqual(['ghost-zone'])
  })

  it('accepts a zone that already exists in the dataset', () => {
    expect(crossCheckMetricsZones(parsed, ['blloku'], ['blloku'])).toEqual([])
  })

  it('deduplicates and sorts what it reports', () => {
    expect(crossCheckMetricsZones(parsed, ['b-zone', 'a-zone', 'b-zone'])).toEqual(['a-zone', 'b-zone'])
  })
})

/**
 * The real files, not fixtures. This is the assertion the spec promises: a
 * metrics record for an undeclared zone fails in `npm test`, before anyone
 * connects to Sanity.
 */
describe('the shipped data files', () => {
  const dataDir = path.resolve(__dirname, '../../data')
  const zones = JSON.parse(fs.readFileSync(path.join(dataDir, 'zones.json'), 'utf8'))
  const metrics = JSON.parse(fs.readFileSync(path.join(dataDir, 'zone-metrics-seed.json'), 'utf8'))

  it('zones.json parses and validates', () => {
    expect(() => parseRegistry(zones)).not.toThrow()
  })

  it('every district title covers all five locales', () => {
    const districts = flattenDistricts(parseRegistry(zones) as ZoneRegistry)
    for (const d of districts) {
      for (const locale of LOCALES) {
        expect(d.title[locale], `${d.slug}.title.${locale}`).toBeTruthy()
      }
    }
  })

  it('every zone in the metrics seed is declared in zones.json', () => {
    const parsed = parseRegistry(zones) as ZoneRegistry
    const zoneSlugs = metrics.records.map((r: {zone: string}) => r.zone)
    expect(crossCheckMetricsZones(parsed, zoneSlugs)).toEqual([])
  })

  it('keeps the two price-line zones out of the page set', () => {
    const districts = flattenDistricts(parseRegistry(zones) as ZoneRegistry)
    const byslug = new Map(districts.map((d) => [d.slug, d]))
    for (const slug of ['golem-1st-line', 'lungomare-2nd-line']) {
      expect(byslug.get(slug), slug).toBeDefined()
      expect(roleOf(byslug.get(slug)!), slug).toBe('metric-only')
    }
  })
})
