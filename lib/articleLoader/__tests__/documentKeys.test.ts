import {describe, it, expect} from 'vitest'

/**
 * Every array item in a Sanity document needs a `_key`. Without one,
 * `discoverLocalized` refuses to patch it — an item that cannot be addressed
 * safely is counted and skipped — so a keyless array is silently never
 * translated while everything around it is.
 *
 * That is exactly what happened on the first load: all five key facts on both
 * legal articles stayed English and nothing errored. This pins the shape the
 * loader must produce.
 */
type Item = Record<string, unknown>

function keyedArrayItems(doc: Record<string, unknown>): {total: number; missing: string[]} {
  const missing: string[] = []
  let total = 0
  const walk = (node: unknown, path: string) => {
    if (Array.isArray(node)) {
      node.forEach((item, i) => {
        if (item && typeof item === 'object') {
          total += 1
          if (typeof (item as Item)._key !== 'string' || !(item as Item)._key) missing.push(`${path}[${i}]`)
          walk(item, `${path}[${i}]`)
        }
      })
      return
    }
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        if (!k.startsWith('_')) walk(v, path ? `${path}.${k}` : k)
      }
    }
  }
  walk(doc, '')
  return {total, missing}
}

describe('loader document shape', () => {
  it('flags an array item with no _key', () => {
    const bad = {keyFacts: [{_type: 'localizedString', en: 'x'}]}
    expect(keyedArrayItems(bad).missing).toEqual(['keyFacts[0]'])
  })

  it('passes a document whose array items are all keyed', () => {
    const good = {
      keyFacts: [{_type: 'localizedString', _key: 'kf-0', en: 'x'}],
      faq: [{_type: 'localizedFaqItem', _key: 'faq-0', question: {en: 'q'}}],
      sources: [{_type: 'sourceItem', _key: 'src-0', label: {en: 's'}}],
      content: {
        en: [
          {
            _type: 'block',
            _key: 'b1',
            children: [{_type: 'span', _key: 'b1-0', marks: [], text: 'hi'}],
          },
        ],
      },
    }
    const r = keyedArrayItems(good)
    expect(r.missing).toEqual([])
    expect(r.total).toBeGreaterThan(4)
  })

  it('reaches items nested inside other array items', () => {
    const nested = {
      content: {en: [{_type: 'block', _key: 'b1', children: [{_type: 'span', text: 'no key'}]}]},
    }
    expect(keyedArrayItems(nested).missing).toEqual(['content.en[0].children[0]'])
  })
})

export {keyedArrayItems}
