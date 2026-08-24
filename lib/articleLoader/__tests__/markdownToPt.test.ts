import {describe, it, expect} from 'vitest'
import {markdownToPortableText, spansFromInline} from '../markdownToPt'

describe('spansFromInline', () => {
  it('returns one unmarked span for plain text', () => {
    expect(spansFromInline('Plain sentence.', 'k')).toEqual([
      {_type: 'span', _key: 'k-0', marks: [], text: 'Plain sentence.'},
    ])
  })

  it('marks an italic run', () => {
    expect(spansFromInline('as *kaparë* on a resale', 'k')).toEqual([
      {_type: 'span', _key: 'k-0', marks: [], text: 'as '},
      {_type: 'span', _key: 'k-1', marks: ['em'], text: 'kaparë'},
      {_type: 'span', _key: 'k-2', marks: [], text: ' on a resale'},
    ])
  })

  it('marks a bold run', () => {
    const out = spansFromInline('the **total** cost', 'k')
    expect(out[1]).toEqual({_type: 'span', _key: 'k-1', marks: ['strong'], text: 'total'})
  })

  // ** must win over * or "**x**" parses as an empty italic wrapping bold.
  it('prefers bold over italic when both could match', () => {
    const out = spansFromInline('**bold** and *italic*', 'k')
    expect(out.filter((s) => s.marks.length > 0).map((s) => s.marks)).toEqual([['strong'], ['em']])
  })

  it('handles several runs in one paragraph', () => {
    const out = spansFromInline('the *kartela* and the *harta*', 'k')
    expect(out.filter((s) => s.marks.includes('em')).map((s) => s.text)).toEqual(['kartela', 'harta'])
  })
})

describe('markdownToPortableText', () => {
  it('converts a paragraph', () => {
    const [b] = markdownToPortableText('Hello there.')
    expect(b._type).toBe('block')
    expect(b.style).toBe('normal')
    expect(b._key).toBeTruthy()
  })

  // h2 rather than h3: collectHeadings picks up PT h2/h3 for the table of
  // contents, and the renderer shifts everything down one level.
  it('converts a #### heading to a PT h2 so the TOC picks it up', () => {
    const [b] = markdownToPortableText('#### The five steps')
    expect(b.style).toBe('h2')
    expect((b.children as Array<{text: string}>)[0].text).toBe('The five steps')
  })

  it('gives every block a distinct _key', () => {
    const blocks = markdownToPortableText('One.\n\nTwo.\n\nThree.')
    const keys = blocks.map((b) => b._key)
    expect(new Set(keys).size).toBe(3)
  })

  it('converts a table to a blogTable with its header row', () => {
    const md = ['| Item | Amount |', '|---|---|', '| Notary | 0.35% |', '| ASHK | 5,000 lek |'].join('\n')
    const [t] = markdownToPortableText(md)
    expect(t._type).toBe('blogTable')
    expect(t.rows).toEqual([
      {_type: 'tableRow', _key: expect.any(String), cells: ['Item', 'Amount']},
      {_type: 'tableRow', _key: expect.any(String), cells: ['Notary', '0.35%']},
      {_type: 'tableRow', _key: expect.any(String), cells: ['ASHK', '5,000 lek']},
    ])
  })

  it('keeps blocks in source order', () => {
    const blocks = markdownToPortableText('#### Head\n\nBody text.')
    expect(blocks.map((b) => b.style ?? b._type)).toEqual(['h2', 'normal'])
  })

  // A loader that silently drops a construct is worse than one that refuses.
  it('throws on an unsupported construct, naming the line', () => {
    expect(() => markdownToPortableText('- a list item')).toThrow(/line 1/)
    expect(() => markdownToPortableText('Fine.\n\n> a quote')).toThrow(/line 3/)
    expect(() => markdownToPortableText('# h1 is not used')).toThrow(/line 1/)
    expect(() => markdownToPortableText('![img](x.png)')).toThrow(/line 1/)
  })

  it('ignores blank runs between blocks', () => {
    expect(markdownToPortableText('One.\n\n\n\nTwo.')).toHaveLength(2)
  })
})
