import {describe, it, expect} from 'vitest'
import {normalizeDescription} from '../normalize'
import {scrubContacts} from '../scrubContacts'
import {
  BEACHFRONT_EN,
  BEACHFRONT_SQ,
  CLEAN_EN,
  HARD_WRAPPED_RU,
  PROSE_RU,
} from './fixtures'

const ALL = [
  {name: 'HARD_WRAPPED_RU', text: HARD_WRAPPED_RU, locale: 'ru'},
  {name: 'PROSE_RU', text: PROSE_RU, locale: 'ru'},
  {name: 'CLEAN_EN', text: CLEAN_EN, locale: 'en'},
  {name: 'BEACHFRONT_EN', text: BEACHFRONT_EN, locale: 'en'},
  {name: 'BEACHFRONT_SQ', text: BEACHFRONT_SQ, locale: 'sq'},
]

describe('production fixtures', () => {
  // The guarantee that fails first if a rule gets greedy. If this breaks, fix
  // the rule — never the fixture.
  it('leaves already-clean copy byte-identical', () => {
    const r = normalizeDescription(CLEAN_EN, 'en')
    expect(r.text).toBe(CLEAN_EN)
    expect(r.changed).toBe(false)
  })

  it('leaves no contact detail anywhere', () => {
    for (const {name, text, locale} of ALL) {
      const out = normalizeDescription(text, locale).text
      expect(scrubContacts(out).removed, name).toBe(false)
    }
  })

  it('leaves no invisible padding anywhere', () => {
    for (const {name, text, locale} of ALL) {
      expect(normalizeDescription(text, locale).text, name).not.toMatch(/[​‌‍⁠⠀﻿]/)
    }
  })

  it('keeps the price line and the emoji headers on the hard-wrapped ad', () => {
    const out = normalizeDescription(HARD_WRAPPED_RU, 'ru').text
    expect(out).toContain('💶 Цена: 1300 € / м²')
    expect(out).toContain('🏢 6-этажный новый дом')
    expect(out).toContain('🌟 Район хороший для проживания и инвестиций')
  })

  it('drops the contact invitation from the hard-wrapped ad', () => {
    const out = normalizeDescription(HARD_WRAPPED_RU, 'ru').text
    expect(out).not.toContain('Пишите прямо сейчас')
    expect(out).not.toContain('real_estate_al')
    expect(out).not.toContain('Telegram')
    expect(out).not.toContain('WhatsApp')
  })

  it('unwraps the hard-wrapped ad into paragraphs', () => {
    const out = normalizeDescription(HARD_WRAPPED_RU, 'ru').text
    expect(out).toContain('ПРОДАЖА КВАРТИР В НОВОМ ДОМЕ — ГОЛЕМ, ДУРРЕС (АЛБАНИЯ)')
    expect(out).toContain('Новый жилой дом в тихом и зелёном районе Голем, всего 200–250 м до моря.')
  })

  it('keeps the prose ad readable and drops its contact block', () => {
    const out = normalizeDescription(PROSE_RU, 'ru').text
    expect(out).toContain('Цена: 250 евро в месяц')
    expect(out).not.toContain('позвоните или напишите нам')
    expect(out).not.toMatch(/\+\d/)
  })

  it('renames the district in both composed locales', () => {
    expect(normalizeDescription(BEACHFRONT_EN, 'en').text).toContain('in Plazh, Durres')
    expect(normalizeDescription(BEACHFRONT_SQ, 'sq').text).toContain('në Plazhi, Durrësi')
  })

  it('is idempotent', () => {
    for (const {name, text, locale} of ALL) {
      const once = normalizeDescription(text, locale).text
      expect(normalizeDescription(once, locale).text, name).toBe(once)
    }
  })
})
