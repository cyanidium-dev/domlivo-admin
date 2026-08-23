import {describe, it, expect} from 'vitest'
import {discoverPortableText, portableTextPatch} from '../discoverLocalized'

const block = (key: string, text: string, marks: string[] = []) => ({
  _type: 'block',
  _key: key,
  style: 'normal',
  markDefs: [],
  children: [{_type: 'span', _key: `${key}s`, text, marks}],
})

describe('discoverPortableText', () => {
  it('finds a plain block and reports its text', () => {
    const r = discoverPortableText({en: [block('a', 'Hello there')]}, 'content')
    expect(r.entries).toEqual([{path: 'content.en[_key=="a"]', text: 'Hello there', key: 'a'}])
    expect(r.skippedMarked).toBe(0)
  })

  // Splitting a sentence at a bold word gives a translator fragments, and
  // reassembling marks by offset does not survive word-order changes.
  it('refuses a block carrying a mark rather than splitting it', () => {
    const r = discoverPortableText({en: [block('a', 'Bold bit', ['strong'])]}, 'content')
    expect(r.entries).toEqual([])
    expect(r.skippedMarked).toBe(1)
  })

  it('skips non-text blocks entirely', () => {
    const r = discoverPortableText({en: [{_type: 'image', _key: 'i1'}]}, 'content')
    expect(r.entries).toEqual([])
    expect(r.skippedMarked).toBe(0)
  })

  it('joins multiple plain spans into one item', () => {
    const b = {
      _type: 'block',
      _key: 'a',
      style: 'h2',
      markDefs: [],
      children: [
        {_type: 'span', _key: 's1', text: 'One ', marks: []},
        {_type: 'span', _key: 's2', text: 'two', marks: []},
      ],
    }
    expect(discoverPortableText({en: [b]}, 'content').entries[0].text).toBe('One two')
  })

  it('reads only the base locale', () => {
    const r = discoverPortableText({en: [block('a', 'EN')], ru: [block('b', 'RU')]}, 'content')
    expect(r.entries.map((e) => e.text)).toEqual(['EN'])
  })

  it('ignores a block with no _key, which cannot be patched safely', () => {
    const r = discoverPortableText({en: [{_type: 'block', style: 'normal', children: [{_type: 'span', text: 'x', marks: []}]}]}, 'content')
    expect(r.entries).toEqual([])
  })

  it('returns nothing for a missing or non-array locale', () => {
    expect(discoverPortableText(undefined, 'content').entries).toEqual([])
    expect(discoverPortableText({en: 'not an array'}, 'content').entries).toEqual([])
  })
})

describe('portableTextPatch', () => {
  it('writes a translation back as a single span, preserving block metadata', () => {
    const source = {
      _type: 'block',
      _key: 'a',
      style: 'h2',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [{_type: 'span', _key: 's1', text: 'One', marks: []}],
    }
    const out = portableTextPatch([source], {a: 'Një'}) as Array<Record<string, unknown>>
    expect(out[0]._key).toBe('a')
    expect(out[0].style).toBe('h2')
    expect(out[0].listItem).toBe('bullet')
    expect(out[0].level).toBe(1)
    expect((out[0].children as Array<Record<string, unknown>>)[0]).toMatchObject({
      _type: 'span',
      marks: [],
      text: 'Një',
    })
  })

  it('leaves a block with no translation exactly as it was', () => {
    const img = {_type: 'image', _key: 'i1'}
    expect(portableTextPatch([img], {})[0]).toEqual(img)
  })

  it('keeps block order', () => {
    const out = portableTextPatch([block('a', 'A'), block('b', 'B')], {b: 'Bee'}) as Array<Record<string, unknown>>
    expect(out.map((b) => b._key)).toEqual(['a', 'b'])
  })
})
