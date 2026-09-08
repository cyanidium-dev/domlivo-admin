import {describe, expect, it} from 'vitest'
import {checkLeadStructure, leadBlock, type PtBlock} from '../blogLead'

const en: PtBlock[] = [
  {
    _key: 'k0',
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{_key: 's0', _type: 'span', marks: [], text: 'Old lead'}],
  },
  {_key: 'k1', _type: 'block', style: 'h2', children: [{_key: 's1', _type: 'span', marks: [], text: 'Heading'}]},
]

describe('leadBlock', () => {
  it('keeps the source _key and writes one plain span', () => {
    const b = leadBlock(en[0], 'New lead.')
    expect(b._key).toBe('k0')
    expect(b.style).toBe('normal')
    expect(b.markDefs).toEqual([])
    expect(b.children).toEqual([{_key: 'k0-lead', _type: 'span', marks: [], text: 'New lead.'}])
  })
})

describe('checkLeadStructure', () => {
  it('accepts a locale whose block 0 shares the English _key and block count', () => {
    const ru = en.map((b) => ({...b}))
    expect(checkLeadStructure(en, ru, 'ru')).toBeNull()
  })
  it('refuses when block 0 _key differs', () => {
    const ru = [{...en[0], _key: 'other'}, en[1]]
    expect(checkLeadStructure(en, ru, 'ru')).toMatch(/ru.*block 0/)
  })
  it('refuses when the block count differs', () => {
    expect(checkLeadStructure(en, [en[0]], 'pl')).toMatch(/pl.*2 blocks.*1/)
  })
  it('refuses an empty locale body', () => {
    expect(checkLeadStructure(en, [], 'sq')).toMatch(/sq.*empty/)
  })
})
