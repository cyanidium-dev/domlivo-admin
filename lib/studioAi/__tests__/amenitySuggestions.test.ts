import {describe, it, expect} from 'vitest'
import {
  MAX_SUGGESTIONS_PER_PARSE,
  buildSuggestionDrafts,
  normalizeSuggestion,
  suggestionId,
  planSuggestionWrites,
  unmatchedAmenityNames,
} from '../amenitySuggestions'

describe('unmatchedAmenityNames', () => {
  it('reads amenity entries out of the endpoint\'s unmatched list and ignores the rest', () => {
    expect(
      unmatchedAmenityNames(['amenity "Private pool"', 'city "Tiranë"', 'amenity "Sauna"', 'district "Bllok"']),
    ).toEqual(['Private pool', 'Sauna'])
  })

  it('survives an unexpected shape', () => {
    expect(unmatchedAmenityNames(['amenity ""', 'amenity', ''])).toEqual([])
  })
})

describe('normalizeSuggestion', () => {
  it('accepts a plausible amenity name and collapses whitespace', () => {
    expect(normalizeSuggestion('  Private   pool ')).toEqual({ok: true, name: 'Private pool', normalized: 'privatepool'})
  })

  it('folds case, diacritics and separators into one key', () => {
    const a = normalizeSuggestion('Wi-Fi')
    const b = normalizeSuggestion('wifi')
    expect(a.ok && b.ok && a.normalized === b.normalized).toBe(true)
    const c = normalizeSuggestion('Pishinë')
    expect(c.ok && c.normalized).toBe('pishine')
  })

  it('refuses shapes that are not amenity names', () => {
    expect(normalizeSuggestion('a').ok).toBe(false) // too short
    expect(normalizeSuggestion('x'.repeat(61)).ok).toBe(false) // too long
    expect(normalizeSuggestion('12345').ok).toBe(false) // no letter
    expect(normalizeSuggestion('call 069 45 67 890').ok).toBe(false) // digits run — contact leakage
    expect(normalizeSuggestion('<script>alert(1)</script>').ok).toBe(false) // charset
    expect(normalizeSuggestion('   ').ok).toBe(false)
  })

  it('allows the punctuation real amenity names use', () => {
    expect(normalizeSuggestion('Kids & pets area').ok).toBe(true)
    expect(normalizeSuggestion('Washer / dryer').ok).toBe(true)
    expect(normalizeSuggestion('24h security').ok).toBe(true)
  })
})

describe('suggestionId', () => {
  it('is derived from the match key, so the same wording is always one document', () => {
    expect(suggestionId('privatepool')).toBe('amenity-suggestion-privatepool')
    expect(suggestionId('wifi')).toBe(suggestionId('wifi'))
  })
})

describe('buildSuggestionDrafts', () => {
  const known = ['Swimming Pool', 'swimming-pool', 'Sea View', 'Wi-Fi']
  const ctx = {now: '2026-08-22T10:00:00.000Z', example: '4-bedroom villa in Gjiri i Lalzit'}

  it('queues an unknown name with the context a reviewer needs', () => {
    const {drafts, dropped} = buildSuggestionDrafts(['Sauna'], known, ctx)
    expect(dropped).toEqual([])
    expect(drafts).toEqual([
      {
        _id: 'amenity-suggestion-sauna',
        _type: 'amenitySuggestion',
        // Zero, because the write incs unconditionally — the first hit lands on 1.
        count: 0,
        examples: [],
        firstSeen: ctx.now,
        lastSeen: ctx.now,
        name: 'Sauna',
        normalized: 'sauna',
        status: 'new',
      },
    ])
  })

  it('does not queue a name the matcher already knows, whatever its spelling', () => {
    const {drafts, dropped} = buildSuggestionDrafts(['wi fi', 'Swimming pool', 'SEA VIEW'], known, ctx)
    expect(drafts).toEqual([])
    expect(dropped).toEqual([])
  })

  it('reports names it refused on shape, so nothing disappears silently', () => {
    const {drafts, dropped} = buildSuggestionDrafts(['Sauna', '12345'], known, ctx)
    expect(drafts.map((d) => d.name)).toEqual(['Sauna'])
    expect(dropped).toEqual(['12345'])
  })

  it('collapses duplicates inside one parse', () => {
    const {drafts} = buildSuggestionDrafts(['Sauna', 'sauna', 'SAUNA'], known, ctx)
    expect(drafts).toHaveLength(1)
  })

  it('caps how much one listing can add to the queue', () => {
    const many = Array.from({length: MAX_SUGGESTIONS_PER_PARSE + 4}, (_, i) => `Amenity number ${i}`)
    expect(buildSuggestionDrafts(many, [], ctx).drafts).toHaveLength(MAX_SUGGESTIONS_PER_PARSE)
  })
})

describe('planSuggestionWrites', () => {
  const ctx = {now: '2026-08-22T10:00:00.000Z', example: '4-bedroom villa in Gjiri i Lalzit'}
  const draft = buildSuggestionDrafts(['Sauna'], [], ctx).drafts

  it('always bumps the count and the freshness', () => {
    const [w] = planSuggestionWrites(draft, new Map(), ctx)
    expect(w).toMatchObject({incCount: 1, lastSeen: ctx.now, appendExample: ctx.example})
    expect(w!.create.count).toBe(0)
  })

  it('does not repeat a listing title already on the row', () => {
    const existing = new Map([['amenity-suggestion-sauna', {examples: [ctx.example]}]])
    expect(planSuggestionWrites(draft, existing, ctx)[0]!.appendExample).toBeUndefined()
  })

  it('stops collecting examples at five', () => {
    const existing = new Map([['amenity-suggestion-sauna', {examples: ['a', 'b', 'c', 'd', 'e']}]])
    expect(planSuggestionWrites(draft, existing, ctx)[0]!.appendExample).toBeUndefined()
  })

  it('handles a row that has no examples field at all', () => {
    const existing = new Map([['amenity-suggestion-sauna', {}]])
    expect(planSuggestionWrites(draft, existing, ctx)[0]!.appendExample).toBe(ctx.example)
  })
})
