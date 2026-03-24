/**
 * Canonical locale ids for field-level i18n (must match localizedString / localizedText / etc.).
 * Aliases in paste formats map onto these keys only.
 */
import {languages} from '../../languages'

export type ProjectLocaleId = 'en' | 'uk' | 'ru' | 'sq' | 'it'

export const PROJECT_LOCALE_IDS: readonly ProjectLocaleId[] = languages.map(
  (l) => l.id,
) as ProjectLocaleId[]

export function isProjectLocaleId(s: string): s is ProjectLocaleId {
  return (PROJECT_LOCALE_IDS as readonly string[]).includes(s)
}

/** Normalize paste labels / JSON keys to a project locale, or undefined if unknown. */
export function normalizeLocaleToken(raw: string): ProjectLocaleId | undefined {
  const t = raw.trim()
  if (!t) return undefined
  const lower = t.toLowerCase()
  const upper = t.toUpperCase()

  if (lower === 'en' || upper === 'EN' || upper === 'ENG') return 'en'
  if (lower === 'uk' || lower === 'ua' || upper === 'UK' || upper === 'UA' || upper === 'UKR') return 'uk'
  if (lower === 'ru' || upper === 'RU') return 'ru'
  if (lower === 'sq' || lower === 'al' || upper === 'SQ' || upper === 'AL' || upper === 'SQI') return 'sq'
  if (lower === 'it' || upper === 'IT' || upper === 'ITA') return 'it'

  return undefined
}
