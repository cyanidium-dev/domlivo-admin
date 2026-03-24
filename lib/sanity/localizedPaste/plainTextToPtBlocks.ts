/**
 * Minimal Portable Text blocks compatible with localizedBlockContent (normal paragraphs only).
 * @see schemaTypes/objects/localizedBlockContent.ts — block style "normal", span children, markDefs.
 */

export type SanityPtBlock = {
  _type: 'block'
  _key: string
  style: 'normal'
  markDefs: []
  children: Array<{
    _type: 'span'
    _key: string
    text: string
    marks: []
  }>
}

function randomKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '')
  }
  return `k${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 12)}`
}

function makeBlock(text: string): SanityPtBlock {
  return {
    _type: 'block',
    _key: randomKey(),
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: randomKey(),
        text,
        marks: [],
      },
    ],
  }
}

/**
 * Split plain text on blank lines → one normal PT block per paragraph.
 * Preserves single newlines inside a paragraph as literal \n in span text.
 * Never emits empty blocks.
 */
export function plainTextToPortableTextBlocks(text: string): SanityPtBlock[] {
  const trimmed = text.replace(/^\s+|\s+$/g, '')
  if (!trimmed) return []

  const parts = trimmed.split(/\n\s*\n/)
  const paragraphs = parts
    .map((p) => p.replace(/^\s*\n?|\n?\s*$/g, ''))
    .filter((p) => p.length > 0)

  if (paragraphs.length === 0) return []

  return paragraphs.map((p) => makeBlock(p))
}
