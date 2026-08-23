import {describe, it, expect} from 'vitest'
import {
  dropDeadLines,
  isAllCaps,
  normalizeDescription,
  renameRetiredZones,
  scrubLines,
  spaceBlocks,
  stripInvisible,
  tidy,
  unwrapHardBreaks,
} from '../normalize'

describe('stripInvisible', () => {
  it('removes each padding character from inside a line', () => {
    for (const ch of ['​', '‌', '‍', '⁠', '⠀', '﻿']) {
      expect(stripInvisible(`Sea${ch} view`)).toBe('Sea view')
    }
  })

  it('turns a line that held only padding into a real blank line', () => {
    expect(stripInvisible('One\n‍\nTwo')).toBe('One\n\nTwo')
    expect(stripInvisible('One\n⠀\nTwo')).toBe('One\n\nTwo')
  })

  it('leaves clean text byte-identical', () => {
    const s = 'Quiet street.\n\nTwo bedrooms.'
    expect(stripInvisible(s)).toBe(s)
  })
})

describe('isAllCaps', () => {
  it('is true for a Cyrillic heading and false for prose', () => {
    expect(isAllCaps('ГОЛЕМ, ДУРРЕС (АЛБАНИЯ)')).toBe(true)
    expect(isAllCaps('Новый жилой дом')).toBe(false)
  })

  it('is false for a line with no letters, so a bare number is not a heading', () => {
    expect(isAllCaps('200–250')).toBe(false)
  })
})

describe('unwrapHardBreaks', () => {
  it('joins a line that ends mid-sentence', () => {
    expect(unwrapHardBreaks('Новый жилой дом в тихом и\nзелёном районе Голем.')).toBe(
      'Новый жилой дом в тихом и зелёном районе Голем.',
    )
  })

  it('stops at sentence punctuation', () => {
    const s = '200–250 м до моря.\nСпокойная локация.'
    expect(unwrapHardBreaks(s)).toBe(s)
  })

  // These two are the reason the rule reads the last character instead of
  // counting them: both lines are emoji-led and both are 20 characters long.
  it('keeps a finished emoji header off the paragraph below it', () => {
    const s = '💶 Цена: 1300 € / м²\nДом построен с использованием бетона.'
    expect(unwrapHardBreaks(s)).toBe(s)
  })

  it('joins a wrapped emoji header, which is the same length', () => {
    expect(unwrapHardBreaks('🌟 Район хороший для\nпроживания и инвестиций')).toBe(
      '🌟 Район хороший для проживания и инвестиций',
    )
  })

  it('joins an ALL-CAPS heading only to another ALL-CAPS line', () => {
    expect(unwrapHardBreaks('ПРОДАЖА КВАРТИР В ДОМЕ —\nГОЛЕМ, ДУРРЕС\nНовый жилой дом')).toBe(
      'ПРОДАЖА КВАРТИР В ДОМЕ — ГОЛЕМ, ДУРРЕС\nНовый жилой дом',
    )
  })

  it('never joins across a bullet boundary', () => {
    const s = '🏢 6-этажный новый дом\n• Современное строительство\n• Сдача весной'
    expect(unwrapHardBreaks(s)).toBe(s)
  })

  it('never joins into a blank line', () => {
    const s = 'Просторная студия и\n\nбалкон'
    expect(unwrapHardBreaks(s)).toBe(s)
  })

  it('leaves prose that already ends its lines properly alone', () => {
    const s = 'Красивая студия на 8-ом этаже.\n\nВо дворе есть места для автомобиля.'
    expect(unwrapHardBreaks(s)).toBe(s)
  })
})

describe('scrubLines', () => {
  it('scrubs each line and reports which ones changed', () => {
    const r = scrubLines(['Тихая улица.', 'WhatsApp: +38 093 512 8547', 'Балкон.'])
    expect(r.lines).toEqual(['Тихая улица.', '', 'Балкон.'])
    expect(r.removed).toEqual([false, true, false])
  })

  it('leaves a price line untouched and unflagged', () => {
    const r = scrubLines(['💶 Цена: 10 500 000 лек'])
    expect(r.lines).toEqual(['💶 Цена: 10 500 000 лек'])
    expect(r.removed).toEqual([false])
  })
})

describe('dropDeadLines', () => {
  it('drops the invitation when the scrub emptied the lines below it', () => {
    const lines = ['Балкон.', '📞 Пишите прямо сейчас и бронируйте просмотр:', '', '']
    const removed = [false, false, true, true]
    expect(dropDeadLines(lines, removed)).toEqual(['Балкон.'])
  })

  it('keeps a heading that introduces something still there', () => {
    const lines = ['Планировка:', '• отдельная спальня']
    const removed = [false, false]
    expect(dropDeadLines(lines, removed)).toEqual(lines)
  })

  it('keeps a contact-shaped line when nothing near it was removed', () => {
    const lines = ['Contact the agent through the form:', 'the button is below']
    const removed = [false, false]
    expect(dropDeadLines(lines, removed)).toEqual(lines)
  })

  it('drops the invitation when the removal was on the line itself', () => {
    const lines = ['Kontakt:', 'Balkon.']
    const removed = [true, false]
    expect(dropDeadLines(lines, removed)).toEqual(['Balkon.'])
  })

  // What is left of "+355 69 312 2813 (Telegram), +38 093 512 8547 (WhatsApp)."
  it('drops a line the scrub reduced to bare punctuation', () => {
    expect(dropDeadLines(['Балкон.', ', .', ':'], [false, true, true])).toEqual(['Балкон.'])
  })

  it('keeps a punctuation-only line the scrub never touched', () => {
    const lines = ['Балкон.', '—']
    expect(dropDeadLines(lines, [false, false])).toEqual(lines)
  })
})

describe('renameRetiredZones', () => {
  it('renames the district in the positional pattern', () => {
    const r = renameRetiredZones('Bright flat of 42 m² in Beachfront, Durres, Albania.', 'en')
    expect(r.text).toBe('Bright flat of 42 m² in Plazh, Durres, Albania.')
    expect(r.renamed).toBe(1)
    expect(r.skipped).toEqual([])
  })

  it('renames the Albanian and Italian forms', () => {
    expect(renameRetiredZones('me sipërfaqe 42 m² në Bregdeti, Durrësi, Shqipëri.', 'sq').text).toBe(
      'me sipërfaqe 42 m² në Plazhi, Durrësi, Shqipëri.',
    )
    expect(renameRetiredZones('di 42 m² in Beachfront, Durazzo, Albania.', 'it').text).toBe(
      'di 42 m² in Plazh, Durazzo, Albania.',
    )
  })

  // Italian writes it both ways: `a` on ten listings, `in` on three.
  it('renames after the Italian "a" as well as "in"', () => {
    const r = renameRetiredZones('di 138 m² a Beachfront, Durazzo, Albania.', 'it')
    expect(r.text).toBe('di 138 m² a Plazh, Durazzo, Albania.')
    expect(r.skipped).toEqual([])
  })

  // `a` is a common word, so the lookahead has to carry the weight here.
  it('does not fire on a bare "a Beachfront" with no city after it', () => {
    const s = 'Vicino a Beachfront si trova il mare.'
    expect(renameRetiredZones(s, 'it').text).toBe(s)
  })

  // `bregdeti` is the ordinary Albanian noun for "the coast". Rewriting it
  // would be a lie about the listing, so the match is positional.
  it('leaves the ordinary Albanian noun for "the coast" alone', () => {
    const s = 'Apartamenti ndodhet 200 m nga bregdeti dhe plazhi.'
    const r = renameRetiredZones(s, 'sq')
    expect(r.text).toBe(s)
    expect(r.renamed).toBe(0)
  })

  it('reports a capitalised mention outside the pattern instead of rewriting it', () => {
    const s = 'Bregdeti është shumë i bukur.'
    const r = renameRetiredZones(s, 'sq')
    expect(r.text).toBe(s)
    expect(r.skipped).toEqual(['Bregdeti'])
  })

  it('does nothing for a locale with no retirement', () => {
    const s = 'Квартира у моря.'
    expect(renameRetiredZones(s, 'ru').text).toBe(s)
  })
})

describe('spaceBlocks', () => {
  it('opens a gap before an emoji header', () => {
    expect(spaceBlocks('Тихая улица.\n🏢 6-этажный дом')).toBe('Тихая улица.\n\n🏢 6-этажный дом')
  })

  it('keeps a header tight to the bullets under it', () => {
    const s = '🏢 6-этажный дом\n• Современное строительство\n• Сдача весной'
    expect(spaceBlocks(s)).toBe(s)
  })

  it('closes a bullet run with one gap', () => {
    expect(spaceBlocks('• Сдача весной\n💶 Цена: 1300 €')).toBe('• Сдача весной\n\n💶 Цена: 1300 €')
  })

  it('opens a gap after an ALL-CAPS heading', () => {
    expect(spaceBlocks('ПРОДАЖА КВАРТИР\nНовый жилой дом')).toBe('ПРОДАЖА КВАРТИР\n\nНовый жилой дом')
  })

  it('opens a gap after an emoji header when prose follows', () => {
    expect(spaceBlocks('💶 Цена: 1300 €\nДом построен из бетона.')).toBe(
      '💶 Цена: 1300 €\n\nДом построен из бетона.',
    )
  })

  it('never doubles an existing gap', () => {
    const s = 'Тихая улица.\n\n🏢 6-этажный дом'
    expect(spaceBlocks(s)).toBe(s)
  })
})

describe('tidy', () => {
  it('collapses long blank runs, strips trailing space, trims the document', () => {
    expect(tidy('  Один  \n\n\n\nДва\n\n')).toBe('Один\n\nДва')
  })

  it('strips the trailing space that a scrub leaves mid-document', () => {
    expect(tidy('Один\nДва   \nТри')).toBe('Один\nДва\nТри')
  })
})

describe('normalizeDescription', () => {
  it('returns empty input untouched', () => {
    expect(normalizeDescription('', 'en')).toEqual({
      text: '',
      changed: false,
      renamed: 0,
      skippedZoneMentions: [],
    })
  })

  it('reports changed:false for copy that needs nothing', () => {
    const s = 'A 78 m² apartment on the 4th floor, with a balcony facing the sea.'
    const r = normalizeDescription(s, 'en')
    expect(r.text).toBe(s)
    expect(r.changed).toBe(false)
  })

  it('runs the rename and reports the count', () => {
    const r = normalizeDescription('Bright flat of 42 m² in Beachfront, Durres, Albania.', 'en')
    expect(r.text).toBe('Bright flat of 42 m² in Plazh, Durres, Albania.')
    expect(r.renamed).toBe(1)
    expect(r.changed).toBe(true)
  })
})
