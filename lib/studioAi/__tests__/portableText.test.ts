import {describe, it, expect} from 'vitest'
import {discoverPortableText} from '../discoverLocalized'

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
    expect(r.entries).toEqual([{path: 'content.en[_key=="a"]', text: 'Hello there', key: 'a', runs: []}])
    expect(r.markedBlocks).toBe(0)
  })

  // Marked runs are delimited inline rather than skipped, so the model gets a
  // whole sentence and the markers travel with the words.
  it('delimits a marked run instead of skipping the block', () => {
    const r = discoverPortableText({en: [block('a', 'Bold bit', ['strong'])]}, 'content')
    expect(r.entries).toHaveLength(1)
    expect(r.entries[0].text).toBe('[[1]]Bold bit[[/1]]')
    expect(r.entries[0].runs).toEqual([['strong']])
    expect(r.markedBlocks).toBe(1)
  })

  it('skips non-text blocks entirely', () => {
    const r = discoverPortableText({en: [{_type: 'image', _key: 'i1'}]}, 'content')
    expect(r.entries).toEqual([])
    expect(r.markedBlocks).toBe(0)
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
