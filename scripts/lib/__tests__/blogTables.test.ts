import {describe, expect, it} from 'vitest'
import {applyTableTranslations, collectTableItems, isTranslatableCell, type BlogTable} from '../blogTables'

describe('isTranslatableCell', () => {
  it.each([
    ['Low end', true],
    ['33% (bottom of the range)', true],
    ['Vërtetim pronësie (ownership confirmation)', true],
    ['~€4,700', false],
    ['~€1,000/m²', false],
    ['2020', false],
    ['—', false],
    ['', false],
    ['H2 2025', false],
    ['+21–43% y/y', false],
    ['1,100 lek', false],
  ])('%s → %s', (cell, want) => {
    expect(isTranslatableCell(cell)).toBe(want)
  })
})

const table: BlogTable = {
  _key: 't1',
  _type: 'blogTable',
  title: {_type: 'localizedString', en: 'Scenarios'},
  rows: [
    {_key: 'r0', _type: 'tableRow', cells: ['Scenario', 'Gross income']},
    {_key: 'r1', _type: 'tableRow', cells: ['Low end', '~€4,700']},
  ],
}

describe('collectTableItems', () => {
  it('emits title and letter-bearing cells with addressable keys', () => {
    const items = collectTableItems([table])
    expect(items.map((i) => i.key)).toEqual(['t1|title', 't1|r0|c0', 't1|r0|c1', 't1|r1|c0'])
    expect(items[0]).toEqual({key: 't1|title', kind: 'string', text: 'Scenarios'})
    expect(items[3].text).toBe('Low end')
  })
})

describe('applyTableTranslations', () => {
  it('rebuilds the locale table from the English one with translated text', () => {
    const t = new Map([
      ['t1|title', 'Сценарии'],
      ['t1|r0|c0', 'Сценарий'],
      ['t1|r0|c1', 'Валовый доход'],
      ['t1|r1|c0', 'Нижняя граница'],
    ])
    const out = applyTableTranslations(table, t, 'ru')
    expect(out.title).toEqual({_type: 'localizedString', en: 'Scenarios', ru: 'Сценарии'})
    expect(out.rows[0].cells).toEqual(['Сценарий', 'Валовый доход'])
    expect(out.rows[1].cells).toEqual(['Нижняя граница', '~€4,700'])
    expect(out.rows[1]._key).toBe('r1')
  })
  it('leaves a cell as English when its translation is missing', () => {
    const out = applyTableTranslations(table, new Map(), 'pl')
    expect(out.rows[1].cells).toEqual(['Low end', '~€4,700'])
  })
})
