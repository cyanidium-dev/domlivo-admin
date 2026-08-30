/**
 * Patch decisions for the Translate action — pure, testable.
 * Overwrite OFF: fill only empty locales. Overwrite ON: replace every locale
 * except the base. The base locale itself is never written.
 */
import {PROJECT_LOCALE_IDS, type ProjectLocaleId} from '../sanity/localizedPaste/projectLocales'
import {discoverLocalized, filledLocale, type LocalizedEntry} from './discoverLocalized'

export type TranslateRequestItem = {key: string; kind: 'string' | 'text'; text: string}
export type TranslatedLocales = Record<ProjectLocaleId, string>

export function buildTranslateItems(
  entries: LocalizedEntry[],
  base: ProjectLocaleId,
): {items: TranslateRequestItem[]; skippedNoBase: string[]} {
  const items: TranslateRequestItem[] = []
  const skippedNoBase: string[] = []
  for (const e of entries) {
    const text = filledLocale(e.value, base)
    if (text) items.push({key: e.path, kind: e.kind, text})
    else skippedNoBase.push(e.path)
  }
  return {items, skippedNoBase}
}

/**
 * One request cannot carry a whole document once array items are in scope —
 * the endpoint caps a call at 40 items / 20 000 characters. Items are packed
 * into batches inside both caps; an item larger than the character cap can
 * never be sent at all and is reported rather than dropped in silence.
 */
export function chunkTranslateItems(
  items: TranslateRequestItem[],
  caps: {maxItems: number; maxChars: number},
): {batches: TranslateRequestItem[][]; oversized: string[]} {
  const batches: TranslateRequestItem[][] = []
  const oversized: string[] = []
  let batch: TranslateRequestItem[] = []
  let chars = 0

  for (const item of items) {
    const len = item.text.length
    if (len > caps.maxChars) {
      oversized.push(item.key)
      continue
    }
    if (batch.length > 0 && (batch.length >= caps.maxItems || chars + len > caps.maxChars)) {
      batches.push(batch)
      batch = []
      chars = 0
    }
    batch.push(item)
    chars += len
  }
  if (batch.length > 0) batches.push(batch)

  return {batches, oversized}
}

export function decideTranslationSets(
  entries: LocalizedEntry[],
  translated: Map<string, TranslatedLocales>,
  opts: {base: ProjectLocaleId; overwrite: boolean},
): {setOps: Record<string, string>; written: number} {
  const setOps: Record<string, string> = {}
  let written = 0
  for (const e of entries) {
    const locales = translated.get(e.path)
    if (!locales) continue
    for (const locale of PROJECT_LOCALE_IDS) {
      if (locale === opts.base) continue
      const next = (locales[locale] ?? '').trim()
      if (!next) continue
      if (!opts.overwrite && filledLocale(e.value, locale)) continue
      setOps[`${e.path}.${locale}`] = next
      written += 1
    }
  }
  return {setOps, written}
}

export {discoverLocalized}
