import {describe, it, expect} from 'vitest'
import {serializeBlockText, deserializeBlockText} from '../discoverLocalized'

const block = (children: Array<{text: string; marks?: string[]; _key?: string}>, extra = {}) => ({
  _type: 'block',
  _key: 'b1',
  style: 'normal',
  markDefs: [],
  children: children.map((c, i) => ({
    _type: 'span',
    _key: c._key ?? `s${i}`,
    text: c.text,
    marks: c.marks ?? [],
  })),
  ...extra,
})

describe('serializeBlockText', () => {
  it('leaves an unmarked block as plain text', () => {
    const r = serializeBlockText(block([{text: 'Plain sentence.'}]))
    expect(r.text).toBe('Plain sentence.')
    expect(r.runs).toEqual([])
  })

  it('wraps a marked run in numbered markers', () => {
    const r = serializeBlockText(
      block([{text: 'as '}, {text: 'kaparë', marks: ['em']}, {text: ' on a resale.'}]),
    )
    expect(r.text).toBe('as [[1]]kaparë[[/1]] on a resale.')
    expect(r.runs).toEqual([['em']])
  })

  it('numbers several runs in document order', () => {
    const r = serializeBlockText(
      block([
        {text: 'The '},
        {text: 'kartela', marks: ['em']},
        {text: ' and the '},
        {text: 'harta', marks: ['em', 'strong']},
        {text: '.'},
      ]),
    )
    expect(r.text).toBe('The [[1]]kartela[[/1]] and the [[2]]harta[[/2]].')
    expect(r.runs).toEqual([['em'], ['em', 'strong']])
  })
})

describe('deserializeBlockText', () => {
  const source = block([{text: 'as '}, {text: 'kaparë', marks: ['em']}, {text: ' on a resale.'}])

  it('restores the marks around the translated words', () => {
    const out = deserializeBlockText(source, 'si [[1]]kaparë[[/1]] në rishitje.', [['em']])
    expect(out.children).toEqual([
      {_type: 'span', _key: 'b1-0', marks: [], text: 'si '},
      {_type: 'span', _key: 'b1-1', marks: ['em'], text: 'kaparë'},
      {_type: 'span', _key: 'b1-2', marks: [], text: ' në rishitje.'},
    ])
    expect(out.lostMarks).toBe(0)
  })

  // Word order moving is the whole point; the marker travels with the words.
  it('accepts markers in a different position', () => {
    const out = deserializeBlockText(source, '[[1]]kaparë[[/1]] paguhet në fillim.', [['em']])
    expect(out.children[0]).toMatchObject({marks: ['em'], text: 'kaparë'})
  })

  it('preserves the block metadata and markDefs', () => {
    const withDefs = block([{text: 'see '}, {text: 'here', marks: ['lnk1']}], {
      style: 'h2',
      markDefs: [{_key: 'lnk1', _type: 'link', href: 'https://example.com'}],
    })
    const out = deserializeBlockText(withDefs, 'shih [[1]]këtu[[/1]]', [['lnk1']])
    expect(out.block.style).toBe('h2')
    expect(out.block.markDefs).toEqual([{_key: 'lnk1', _type: 'link', href: 'https://example.com'}])
    expect(out.block._key).toBe('b1')
  })

  // Degradation: the sentence must survive even when the formatting does not.
  it('keeps every word when the model drops a marker', () => {
    const out = deserializeBlockText(source, 'si kaparë në rishitje.', [['em']])
    expect(out.children.map((c) => c.text).join('')).toBe('si kaparë në rishitje.')
    expect(out.children.every((c) => c.marks.length === 0)).toBe(true)
    expect(out.lostMarks).toBe(1)
  })

  it('falls back to one plain span on an unbalanced marker', () => {
    const out = deserializeBlockText(source, 'si [[1]]kaparë në rishitje.', [['em']])
    expect(out.children).toHaveLength(1)
    expect(out.children[0].text).toBe('si kaparë në rishitje.')
    expect(out.lostMarks).toBe(1)
  })

  it('ignores a marker number the source never had', () => {
    const out = deserializeBlockText(source, 'si [[7]]kaparë[[/7]] në rishitje.', [['em']])
    expect(out.children.map((c) => c.text).join('')).toBe('si kaparë në rishitje.')
    expect(out.lostMarks).toBe(1)
  })

  it('handles a block that had no marks at all', () => {
    const plain = block([{text: 'Plain.'}])
    const out = deserializeBlockText(plain, 'E thjeshtë.', [])
    expect(out.children).toEqual([{_type: 'span', _key: 'b1-0', marks: [], text: 'E thjeshtë.'}])
    expect(out.lostMarks).toBe(0)
  })

  it('drops an empty run rather than emitting an empty span', () => {
    const out = deserializeBlockText(source, '[[1]]kaparë[[/1]]', [['em']])
    expect(out.children).toHaveLength(1)
    expect(out.children[0]).toMatchObject({marks: ['em'], text: 'kaparë'})
  })
})
