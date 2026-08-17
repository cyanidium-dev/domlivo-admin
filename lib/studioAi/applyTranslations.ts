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
