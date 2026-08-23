/**
 * Normalizes listing copy without rewriting it. See
 * docs/engineering/SPEC-normalize-listing-copy-2026-08-23.md in the workspace.
 *
 * Most of the catalogue was imported with `description.ru` / `.uk` holding the
 * raw source ad: emoji headers, `•` bullets, hard line wraps at roughly thirty
 * characters, invisible padding glyphs, and a contact block. The property page
 * renders the field with `whitespace-pre-line`, so those wraps reach the reader
 * as a narrow ragged column.
 *
 * Every function here is pure and total: same input, same output, no throw.
 * Wording, emoji headers, bullets and the in-copy price line all survive.
 */

import {scrubContacts} from './scrubContacts'

/** Zero-width and blank glyphs used as Telegram/Instagram layout padding. */
const INVISIBLE = /[​‌‍⁠⠀﻿]/g

const BULLET = /^\s*[•·‣▪]\s+/
const EMOJI_LED = /^\s*\p{Extended_Pictographic}/u

/**
 * A line whose last character is a lowercase letter, comma or dash was cut
 * mid-sentence by the source's fixed-column wrap. `м²` and `(АЛБАНИЯ)` were
 * not.
 *
 * Length cannot make this call: `💶 Цена: 1300 € / м²` is a finished header and
 * `🌟 Район хороший для` is a fragment, and both are emoji-led and twenty
 * characters long.
 */
const CONTINUES = /[\p{Ll},\-–—]\s*$/u

/**
 * A line holding nothing but padding was standing in for a blank line, so it
 * collapses to one rather than vanishing — otherwise the paragraphs it
 * separated merge into each other.
 */
export function stripInvisible(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      const stripped = line.replace(INVISIBLE, '')
      return stripped.trim() === '' ? '' : stripped
    })
    .join('\n')
}

export function isAllCaps(line: string): boolean {
  const letters = line.replace(/[^\p{L}]/gu, '')
  return letters.length > 1 && letters === letters.toLocaleUpperCase()
}

function opensBlock(line: string): boolean {
  return line.trim() === '' || BULLET.test(line) || EMOJI_LED.test(line)
}

export function unwrapHardBreaks(text: string): string {
  const out: string[] = []
  let prevRaw = ''
  for (const raw of text.split('\n')) {
    const joinable =
      out.length > 0 &&
      prevRaw.trim() !== '' &&
      CONTINUES.test(prevRaw) &&
      !opensBlock(raw) &&
      isAllCaps(prevRaw) === isAllCaps(raw)
    if (joinable) {
      out[out.length - 1] = `${out[out.length - 1].trimEnd()} ${raw.trim()}`
    } else {
      out.push(raw)
    }
    prevRaw = raw
  }
  return out.join('\n')
}

/**
 * The scrub runs per line so the caller learns *which* line it edited.
 * `scrubContacts` on the whole document cannot say — its own tidy collapses
 * blank runs and shifts every index below the edit.
 */
export function scrubLines(lines: string[]): {lines: string[]; removed: boolean[]} {
  const out: string[] = []
  const removed: boolean[] = []
  for (const line of lines) {
    const r = scrubContacts(line)
    out.push(r.text)
    removed.push(r.removed)
  }
  return {lines: out, removed}
}

/** Contact and booking words across the five stored locales. */
const CONTACT_WORD =
  /(?:пишите|пишіть|позвоните|звоните|напишите|телефонуйте|бронируйте|бронюйте|contacts?|contatt|call|write|book|kontakt|telefon|shkruani|scrivi|chiama)/iu

const CTA_LOOKAHEAD = 3

function isOrphanedCta(line: string, i: number, removed: boolean[]): boolean {
  if (!/:\s*$/.test(line)) return false
  if (!CONTACT_WORD.test(line)) return false
  for (let j = i; j <= i + CTA_LOOKAHEAD && j < removed.length; j += 1) {
    if (removed[j]) return true
  }
  return false
}

/**
 * Removes the two kinds of line the scrub leaves behind.
 *
 * The **orphaned call to action** — "Если остались вопросы, позвоните или
 * напишите нам:" pointing at nothing. The removal map is what keeps this off a
 * legitimate "Планировка:" heading: a line that introduces nothing removed is
 * left alone.
 *
 * The **punctuation husk** — what is left of "+355 69 312 2813 (Telegram),
 * +38 093 512 8547 (WhatsApp)." once the numbers and their labels are gone is
 * ", .". A line is only dropped on this rule if the scrub actually edited it,
 * which is what keeps the no-op guarantee on clean copy exact.
 */
export function dropDeadLines(lines: string[], removed: boolean[]): string[] {
  return lines.filter((line, i) => {
    if (isOrphanedCta(line, i, removed)) return false
    if (removed[i] && !/[\p{L}\p{N}]/u.test(line)) return false
    return true
  })
}

type Retirement = {locale: string; from: string; to: string; preposition: string}

/**
 * `beachfront-durres` was renamed `plazh` on 2026-08-15. The composed copy on
 * thirteen listings still names the old zone in three locales.
 *
 * The match is positional, not lexical: `bregdeti` is also the ordinary
 * Albanian noun for "the coast", and rewriting "200 m nga bregdeti" to
 * "200 m nga Plazhi" would be a lie about the listing. Only the name sitting
 * between the locale's preposition and the city title is a district.
 */
const RETIRED: Retirement[] = [
  {locale: 'en', from: 'Beachfront', to: 'Plazh', preposition: 'in'},
  {locale: 'it', from: 'Beachfront', to: 'Plazh', preposition: 'in'},
  {locale: 'sq', from: 'Bregdeti', to: 'Plazhi', preposition: 'në'},
]

export function renameRetiredZones(
  text: string,
  locale: string,
): {text: string; renamed: number; skipped: string[]} {
  let renamed = 0
  const skipped: string[] = []
  let out = text
  for (const r of RETIRED.filter((x) => x.locale === locale)) {
    // \p{L} lookarounds, never \b — \b is ASCII-only in JavaScript and misses
    // Cyrillic and Albanian diacritics. That mistake deleted a Russian price
    // during the F7 work; it does not get made twice.
    const positional = new RegExp(
      `(?<=(?<!\\p{L})${r.preposition}\\s)${r.from}(?=,\\s*\\p{Lu})`,
      'gu',
    )
    out = out.replace(positional, () => {
      renamed += 1
      return r.to
    })
    const leftovers = out.match(new RegExp(`(?<!\\p{L})${r.from}(?!\\p{L})`, 'gu'))
    if (leftovers) skipped.push(...leftovers)
  }
  return {text: out, renamed, skipped}
}

function opensNewBlock(line: string): boolean {
  if (BULLET.test(line)) return false
  return EMOJI_LED.test(line) || isAllCaps(line)
}

/**
 * Unwrapping produces correct paragraphs with nothing between them — the
 * source ad separated its sections by wrapping, not by blank lines. This puts
 * the separation back, one blank per boundary and never inside a bullet run.
 */
export function spaceBlocks(text: string): string {
  const out: string[] = []
  for (const line of text.split('\n')) {
    const prev = out[out.length - 1]
    const gap =
      prev !== undefined &&
      prev.trim() !== '' &&
      line.trim() !== '' &&
      (opensNewBlock(line) ||
        (BULLET.test(prev) && !BULLET.test(line)) ||
        (isAllCaps(prev) && !isAllCaps(line)) ||
        (EMOJI_LED.test(prev) && !BULLET.test(line)))
    if (gap) out.push('')
    out.push(line)
  }
  return out.join('\n')
}

export function tidy(text: string): string {
  return text
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export type NormalizeResult = {
  text: string
  changed: boolean
  renamed: number
  skippedZoneMentions: string[]
}

export function normalizeDescription(text: string, locale: string): NormalizeResult {
  if (!text) return {text, changed: false, renamed: 0, skippedZoneMentions: []}
  const unwrapped = unwrapHardBreaks(stripInvisible(text))
  const scrubbed = scrubLines(unwrapped.split('\n'))
  const alive = dropDeadLines(scrubbed.lines, scrubbed.removed)
  const renamed = renameRetiredZones(alive.join('\n'), locale)
  const out = tidy(spaceBlocks(renamed.text))
  return {
    text: out,
    changed: out !== text,
    renamed: renamed.renamed,
    skippedZoneMentions: renamed.skipped,
  }
}
