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

  it('marks a link run using the onLink handler', () => {
    const hrefs: string[] = []
    const out = spansFromInline('see [the guide](/en/blog/x) for more', 'k', (href) => {
      hrefs.push(href)
      return 'linkKey1'
    })
    expect(hrefs).toEqual(['/en/blog/x'])
    expect(out.find((s) => s.text === 'the guide')).toEqual({
      _type: 'span',
      _key: 'k-1',
      marks: ['linkKey1'],
      text: 'the guide',
    })
  })

  it('throws on a link with no onLink handler', () => {
    expect(() => spansFromInline('[text](/x)', 'k')).toThrow(/no link handler/)
  })

  it('handles a bold run and a link in the same sentence', () => {
    const out = spansFromInline('the **total** cost, see [details](/x)', 'k', () => 'lk')
    expect(out.filter((s) => s.marks.length > 0).map((s) => s.marks)).toEqual([['strong'], ['lk']])
  })

  // A link written *inside* **bold** is not a nested mark here — the whole
  // **...** span matches as one flat token first, so the link syntax inside
  // it never gets re-parsed and would otherwise leak out as literal text.
  it('throws rather than silently flattening a link nested inside bold', () => {
    expect(() => spansFromInline('**see [details](/x) now**', 'k', () => 'lk')).toThrow(/not supported/)
  })

  it('throws rather than silently flattening a link nested inside italic', () => {
    expect(() => spansFromInline('*see [details](/x) now*', 'k', () => 'lk')).toThrow(/not supported/)
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

  it('strips markdown link and emphasis syntax from table cells (cells are plain strings in the schema)', () => {
    const md = [
      '| District | Growth |',
      '|---|---|',
      '| [Blloku](/en/albania/tirana/districts/blloku) | **+4.4%** |',
    ].join('\n')
    const [t] = markdownToPortableText(md)
    expect(t.rows[1].cells).toEqual(['Blloku', '+4.4%'])
  })

  it('keeps blocks in source order', () => {
    const blocks = markdownToPortableText('#### Head\n\nBody text.')
    expect(blocks.map((b) => b.style ?? b._type)).toEqual(['h2', 'normal'])
  })

  // A loader that silently drops a construct is worse than one that refuses.
  it('throws on an unsupported construct, naming the line', () => {
    expect(() => markdownToPortableText('Fine.\n\n> a quote')).toThrow(/line 3/)
    expect(() => markdownToPortableText('# h1 is not used')).toThrow(/line 1/)
    expect(() => markdownToPortableText('![img](x.png)')).toThrow(/line 1/)
  })

  it('converts a bullet list into blocks with listItem "bullet"', () => {
    const blocks = markdownToPortableText('- First point.\n- Second point.')
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toMatchObject({listItem: 'bullet', level: 1, style: 'normal'})
    expect((blocks[0].children as Array<{text: string}>)[0].text).toBe('First point.')
    expect(blocks[1]).toMatchObject({listItem: 'bullet', level: 1})
  })

  it('converts a numbered list into blocks with listItem "number"', () => {
    const blocks = markdownToPortableText('1. Step one.\n2. Step two.\n3. Step three.')
    expect(blocks.every((b) => b.listItem === 'number')).toBe(true)
    expect((blocks[2].children as Array<{text: string}>)[0].text).toBe('Step three.')
  })

  it('keeps a bullet list and a following paragraph separate, in order', () => {
    const blocks = markdownToPortableText('- One.\n- Two.\n\nAfter the list.')
    expect(blocks.map((b) => b.listItem ?? b._type)).toEqual(['bullet', 'bullet', 'block'])
    expect(blocks[2].listItem).toBeUndefined()
  })

  it('supports bold, italic and links inside a list item', () => {
    const [item] = markdownToPortableText('- **Ksamil** — see [the data](/en/blog/x) for more.')
    const marks = (item.children as Array<{marks: string[]}>).map((s) => s.marks)
    expect(marks).toContainEqual(['strong'])
    expect((item.markDefs as Array<{href: string}>)[0].href).toBe('/en/blog/x')
  })

  it('ignores blank runs between blocks', () => {
    expect(markdownToPortableText('One.\n\n\n\nTwo.')).toHaveLength(2)
  })

  it('builds a markDef and matching span mark for an inline link', () => {
    const [b] = markdownToPortableText('Read [the guide](/en/blog/x) first.')
    expect(b.markDefs).toEqual([{_type: 'link', _key: expect.any(String), href: '/en/blog/x'}])
    const linkKey = (b.markDefs as Array<{_key: string}>)[0]._key
    const linkSpan = (b.children as Array<{text: string; marks: string[]}>).find((s) => s.text === 'the guide')
    expect(linkSpan?.marks).toEqual([linkKey])
  })

  it('never throws on a bare link — markdownToPortableText always wires its own onLink', () => {
    expect(() => markdownToPortableText('[text](/x)')).not.toThrow()
  })

  it('places a zoneStatsEmbed block between surrounding paragraphs', () => {
    const blocks = markdownToPortableText('Intro.\n\n{{zoneStatsEmbed:blloku}}\n\nMore.', {
      resolveZoneEmbed: (slug) => `district-${slug}`,
    })
    expect(blocks.map((b) => b._type)).toEqual(['block', 'zoneStatsEmbed', 'block'])
    expect(blocks[1]).toEqual({
      _type: 'zoneStatsEmbed',
      _key: expect.any(String),
      zone: {_type: 'reference', _ref: 'district-blloku'},
    })
  })

  it('throws on a zoneStatsEmbed marker with no resolver provided', () => {
    expect(() => markdownToPortableText('{{zoneStatsEmbed:blloku}}')).toThrow(/no zone resolver/)
  })
})
