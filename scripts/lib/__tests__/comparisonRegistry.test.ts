import fs from 'node:fs'
import path from 'node:path'
import {describe, it, expect} from 'vitest'
import {
  parseComparisons,
  referencedZoneSlugs,
  comparisonTitle,
  LOCALES,
  type Comparison,
} from '../comparisonRegistry'

const FIVE = {en: 'A', uk: 'А', ru: 'А', sq: 'A', it: 'A'}

function comparison(overrides: Partial<Comparison> = {}): unknown {
  return {
    comparisons: [
      {
        slug: 'x-vs-y',
        kind: 'zones',
        left: {slug: 'tirana', type: 'city', title: FIVE},
        right: {slug: 'durres', type: 'city', title: FIVE},
        angle: FIVE,
        scenarios: [{audience: FIVE, verdict: FIVE}],
        criteria: [{label: FIVE, left: FIVE, right: FIVE}],
        related: [],
        ...overrides,
      },
    ],
  }
}

describe('parseComparisons', () => {
  it('accepts a well-formed comparison', () => {
    expect(() => parseComparisons(comparison())).not.toThrow()
  })

  it('requires at least one scenario — the verdict is the page', () => {
    expect(() => parseComparisons(comparison({scenarios: []}))).toThrow(/at least one scenario/)
  })

  it('rejects a missing locale on the angle', () => {
    const {it: _dropped, ...four} = FIVE
    expect(() => parseComparisons(comparison({angle: four as never}))).toThrow(/missing locale\(s\) it/)
  })

  it('rejects comparing a place with itself', () => {
    expect(() =>
      parseComparisons(comparison({right: {slug: 'tirana', type: 'city', title: FIVE}})),
    ).toThrow(/cannot be compared with itself/)
  })

  it('rejects an external side on a zones comparison', () => {
    expect(() =>
      parseComparisons(comparison({right: {slug: 'montenegro', type: 'external', title: FIVE}})),
    ).toThrow(/cannot have an external side/)
  })

  it('rejects a related slug that is not a comparison', () => {
    expect(() => parseComparisons(comparison({related: ['ghost']}))).toThrow(/related "ghost" is not a comparison/)
  })

  it('rejects a self-reference in related', () => {
    expect(() => parseComparisons(comparison({related: ['x-vs-y']}))).toThrow(/cannot relate to itself/)
  })

  it('rejects duplicate slugs', () => {
    const dup: any = comparison()
    dup.comparisons.push({...dup.comparisons[0]})
    expect(() => parseComparisons(dup)).toThrow(/duplicate comparison slug/)
  })
})

describe('referencedZoneSlugs', () => {
  it('collects both sides of every zones comparison, sorted and deduped', () => {
    const file = parseComparisons(comparison())
    expect(referencedZoneSlugs(file)).toEqual(['durres', 'tirana'])
  })

  it('ignores external comparisons', () => {
    const external = {
      comparisons: [
        {
          slug: 'a-vs-b',
          kind: 'external',
          left: {slug: 'tirana', type: 'city', title: FIVE},
          right: {slug: 'montenegro', type: 'external', title: FIVE},
          angle: FIVE,
          scenarios: [{audience: FIVE, verdict: FIVE}],
          criteria: [],
          related: [],
        },
      ],
    }
    expect(referencedZoneSlugs(parseComparisons(external))).toEqual([])
  })
})

describe('comparisonTitle', () => {
  it('renders the headline in every locale', () => {
    const file = parseComparisons(
      comparison({
        left: {slug: 'sarande', type: 'city', title: {...FIVE, en: 'Sarandë', ru: 'Саранда'}},
        right: {slug: 'ksamil', type: 'district', title: {...FIVE, en: 'Ksamil', ru: 'Ксамиль'}},
      }),
    )
    const title = comparisonTitle(file.comparisons[0], '2026')
    expect(title.en).toBe('Sarandë or Ksamil: which to choose in 2026')
    expect(title.ru).toBe('Саранда или Ксамиль: что выбрать в 2026')
    for (const l of LOCALES) expect(title[l], l).toBeTruthy()
  })
})

/** The shipped file, so a broken cross-link fails in `npm test`. */
describe('the shipped comparisons.json', () => {
  const file = parseComparisons(
    JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../data/comparisons.json'), 'utf8')),
  )

  it('parses and validates', () => {
    expect(file.comparisons.length).toBeGreaterThanOrEqual(8)
  })

  it('carries every locale on every scenario verdict', () => {
    for (const c of file.comparisons) {
      for (const [i, s] of c.scenarios.entries()) {
        for (const l of LOCALES) {
          expect(s.verdict[l], `${c.slug}/scenario[${i}].verdict.${l}`).toBeTruthy()
        }
      }
    }
  })

  it('never stores a price — figures come from zoneMetrics at build time', () => {
    // A euro-per-square-metre figure in the config is a number that goes stale
    // silently, which is exactly what the hand-typed city comparison tables did.
    const raw = fs.readFileSync(path.resolve(__dirname, '../../data/comparisons.json'), 'utf8')
    const perSquareMetre = raw.match(/€[\d,. ]+\s*\/\s*m²/g) ?? []
    expect(perSquareMetre, `found hardcoded €/m²: ${perSquareMetre.join(', ')}`).toEqual([])
  })

  it('cross-links form a connected set — every comparison is reachable', () => {
    const all = new Set(file.comparisons.map((c) => c.slug))
    const linked = new Set(file.comparisons.flatMap((c) => c.related))
    const orphans = [...all].filter((s) => !linked.has(s))
    expect(orphans, `not linked from any other comparison: ${orphans.join(', ')}`).toEqual([])
  })
})
