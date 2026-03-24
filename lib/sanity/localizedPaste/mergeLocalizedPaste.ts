import {PROJECT_LOCALE_IDS} from './projectLocales'
import type {ParsedLocalizedStrings} from './parseLocalizedPaste'
import {plainTextToPortableTextBlocks, type SanityPtBlock} from './plainTextToPtBlocks'

function baseObject(existing: Record<string, unknown> | undefined): Record<string, unknown> {
  return existing && typeof existing === 'object' && !Array.isArray(existing) ? {...existing} : {}
}

/** Outer trim only; preserves inner newlines for localizedText. */
function trimOuter(s: string): string {
  return s.replace(/^\s+|\s+$/g, '')
}

export function mergeLocalizedScalar(
  existing: Record<string, unknown> | undefined,
  parsed: ParsedLocalizedStrings,
  kind: 'string' | 'text',
): Record<string, unknown> {
  const next = baseObject(existing)
  for (const id of PROJECT_LOCALE_IDS) {
    const v = parsed[id]
    if (v === undefined) continue
    const t = trimOuter(v)
    if (!t) continue
    next[id] = t
  }
  return next
}

export function mergeLocalizedBlockContent(
  existing: Record<string, unknown> | undefined,
  parsed: ParsedLocalizedStrings,
): Record<string, unknown> {
  const next = baseObject(existing)
  for (const id of PROJECT_LOCALE_IDS) {
    const v = parsed[id]
    if (v === undefined) continue
    const t = trimOuter(v)
    if (!t) continue
    const blocks: SanityPtBlock[] = plainTextToPortableTextBlocks(v)
    if (blocks.length === 0) continue
    next[id] = blocks
  }
  return next
}

export type {ParsedLocalizedStrings}
