import {PROJECT_LOCALE_IDS, type ProjectLocaleId, normalizeLocaleToken} from './projectLocales'

export type ParsedLocalizedStrings = Partial<Record<ProjectLocaleId, string>>

export type ParseLocalizedPasteSuccess = {
  ok: true
  format: 'json' | 'separator' | 'label'
  values: ParsedLocalizedStrings
  warnings: string[]
  unknownJsonKeys: string[]
}

export type ParseLocalizedPasteFailure = {
  ok: false
  error: string
}

export type ParseLocalizedPasteResult = ParseLocalizedPasteSuccess | ParseLocalizedPasteFailure

function trimLocaleBody(s: string): string {
  return s.replace(/^\s*\n+|\n+\s*$/g, '').replace(/^\s+|\s+$/g, '')
}

function detectFormat(trimmed: string): 'json' | 'separator' | 'label' | null {
  if (trimmed.startsWith('{')) return 'json'
  const sepLine = /^\s*---\s*.+?\s*---\s*$/m
  if (sepLine.test(trimmed)) return 'separator'
  const labelLine = /^\s*(EN|UK|UA|RU|AL|SQ|IT)\s*:/im
  if (labelLine.test(trimmed)) return 'label'
  return null
}

function parseJson(raw: string): ParseLocalizedPasteResult {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return {ok: false, error: `Invalid JSON: ${msg}`}
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {ok: false, error: 'JSON must be an object with locale keys, e.g. {"en":"..."}.'}
  }
  const values: ParsedLocalizedStrings = {}
  const unknownJsonKeys: string[] = []
  const warnings: string[] = []

  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    if (typeof val !== 'string') {
      warnings.push(`Ignored key "${key}": value must be a string.`)
      continue
    }
    const canon = normalizeLocaleToken(key)
    if (!canon) {
      unknownJsonKeys.push(key)
      continue
    }
    const body = trimLocaleBody(val)
    if (body) values[canon] = body
  }

  if (Object.keys(values).length === 0) {
    return {
      ok: false,
      error:
        unknownJsonKeys.length > 0
          ? `No recognized locale keys. Unknown keys: ${unknownJsonKeys.join(', ')}. Use en, uk, ru, sq, it (aliases: ua→uk, al→sq).`
          : 'No non-empty locale values found in JSON.',
    }
  }

  if (unknownJsonKeys.length > 0) {
    warnings.push(`Ignored unknown JSON keys: ${unknownJsonKeys.join(', ')}`)
  }

  return {ok: true, format: 'json', values, warnings, unknownJsonKeys}
}

const SEPARATOR_LINE = /^---\s*(.+?)\s*---\s*$/

function parseSeparator(raw: string): ParseLocalizedPasteResult {
  const lines = raw.split(/\r?\n/)
  const values: ParsedLocalizedStrings = {}
  const warnings: string[] = []
  let current: ProjectLocaleId | undefined
  const buf: string[] = []
  let ignoredBeforeFirstMarker = false

  const flush = () => {
    if (!current) return
    const body = trimLocaleBody(buf.join('\n'))
    buf.length = 0
    if (body) values[current] = body
    current = undefined
  }

  for (const line of lines) {
    const m = line.match(SEPARATOR_LINE)
    if (m) {
      flush()
      const label = m[1].trim()
      const key = normalizeLocaleToken(label)
      if (!key) {
        warnings.push(`Unknown locale section: ---${label}---`)
        continue
      }
      current = key
    } else if (current !== undefined) {
      buf.push(line)
    } else if (line.trim()) {
      ignoredBeforeFirstMarker = true
    }
  }
  flush()

  if (ignoredBeforeFirstMarker) {
    warnings.push('Lines before the first valid ---locale--- marker were ignored.')
  }

  if (Object.keys(values).length === 0) {
    return {ok: false, error: 'Separator format found no locale sections with content. Use ---EN---, ---UK---, etc.'}
  }

  return {ok: true, format: 'separator', values, warnings, unknownJsonKeys: []}
}

/** EN: or EN: text on same line */
const LABEL_START = /^\s*(EN|UK|UA|RU|AL|SQ|IT)\s*:\s*(.*)$/i

function parseLabel(raw: string): ParseLocalizedPasteResult {
  const lines = raw.split(/\r?\n/)
  const values: ParsedLocalizedStrings = {}
  const warnings: string[] = []
  let current: ProjectLocaleId | undefined
  const buf: string[] = []
  let seenLabel = false
  let ignoredPreamble = false

  const flush = () => {
    if (!current) return
    const body = trimLocaleBody(buf.join('\n'))
    buf.length = 0
    if (body) values[current] = body
    current = undefined
  }

  for (const line of lines) {
    const m = line.match(LABEL_START)
    if (m) {
      flush()
      seenLabel = true
      const token = m[1]
      const rest = m[2] ?? ''
      const key = normalizeLocaleToken(token)
      if (!key) {
        warnings.push(`Unknown locale label: ${token}:`)
        continue
      }
      current = key
      if (rest.trim()) buf.push(rest)
    } else {
      if (!seenLabel && line.trim()) ignoredPreamble = true
      if (current !== undefined) buf.push(line)
    }
  }
  flush()

  if (ignoredPreamble) {
    warnings.push('Some lines before the first locale label were ignored.')
  }

  if (Object.keys(values).length === 0) {
    return {
      ok: false,
      error: 'Label format found no blocks. Start with lines like EN: or UK: (see examples in the dialog).',
    }
  }

  return {ok: true, format: 'label', values, warnings, unknownJsonKeys: []}
}

/**
 * Auto-detect JSON vs ---EN--- vs EN: formats and return normalized per-locale strings.
 */
export function parseLocalizedPaste(rawInput: string): ParseLocalizedPasteResult {
  const trimmed = rawInput.replace(/^\uFEFF?/, '').trim()
  if (!trimmed) {
    return {ok: false, error: 'Paste is empty.'}
  }

  const fmt = detectFormat(trimmed)
  if (!fmt) {
    return {
      ok: false,
      error:
        'Could not detect format. Use JSON ({ "en": "..." }), separator lines (---EN---), or labels (EN:).',
    }
  }

  if (fmt === 'json') return parseJson(trimmed)
  if (fmt === 'separator') return parseSeparator(trimmed)
  return parseLabel(trimmed)
}

export function previewParsedValues(values: ParsedLocalizedStrings): string {
  return PROJECT_LOCALE_IDS.filter((id) => values[id])
    .map((id) => `${id}: ${(values[id] as string).length} chars`)
    .join(' · ')
}

export {PROJECT_LOCALE_IDS}
