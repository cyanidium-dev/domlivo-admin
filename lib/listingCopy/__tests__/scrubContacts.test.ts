import {describe, it, expect} from 'vitest'
import {scrubContacts} from '../scrubContacts'

/**
 * These are the cases from bot/src/__tests__/scrubContacts.test.ts, verbatim.
 * The file under test is a copy; this suite is what stops the two drifting.
 */
describe('scrubContacts (pinned to bot/src/scrubContacts.ts)', () => {
  it('removes an Albanian phone number and the label left dangling', () => {
    const r = scrubContacts('Asking price is negotiable. Kontakt: 069 45 67 890.')
    expect(r.text).toBe('Asking price is negotiable.')
    expect(r.removed).toBe(true)
  })

  it('removes international, dashed and parenthesised numbers', () => {
    expect(scrubContacts('Call +355 69 234 5678 today').text).toBe('Call today')
    expect(scrubContacts('Sea view flat. Tel 069-45-67-890').text).toBe('Sea view flat.')
    expect(scrubContacts('Sea view flat. Phone: (069) 4567890').text).toBe('Sea view flat.')
  })

  it('removes e-mails, links and handles', () => {
    expect(scrubContacts('Write to agjenti@domlivo.al for a viewing').text).toBe('Write to for a viewing')
    expect(scrubContacts('More at https://example.com/listing/1 now').text).toBe('More at now')
    expect(scrubContacts('Ask @domlivo_agent about it').text).toBe('Ask about it')
  })

  it('leaves prices alone, whatever separator they use', () => {
    for (const s of [
      'Çmimi 10.500.000 lekë.',
      'Çmimi 10 500 000 lekë.',
      'Price 420,000 EUR.',
      'The asking price is 92.000 euro, negotiable.',
      '€10 500 000 for the whole building.',
    ]) {
      expect(scrubContacts(s).text).toBe(s)
      expect(scrubContacts(s).removed).toBe(false)
    }
  })

  it('leaves a price alone when the currency word is not Latin', () => {
    for (const s of [
      'Цена составляет 10 500 000 лек.',
      'Ціна становить 10 500 000 лекі.',
      'Цена 92 000 евро, торг уместен.',
      'Ціна 92 000 євро, торг доречний.',
    ]) {
      expect(scrubContacts(s).text).toBe(s)
      expect(scrubContacts(s).removed).toBe(false)
    }
  })

  it('clears the dangling label in every locale, not just English', () => {
    expect(scrubContacts('Prezzo trattabile. Contatto: 069 45 67 890.').text).toBe('Prezzo trattabile.')
    expect(scrubContacts('Торг уместен. Контакт: 069 45 67 890.').text).toBe('Торг уместен.')
    expect(scrubContacts('Торг доречний. Контакти: 069 45 67 890.').text).toBe('Торг доречний.')
    expect(scrubContacts('Çmimi i diskutueshëm. Kontakt: 069 45 67 890.').text).toBe('Çmimi i diskutueshëm.')
  })

  it('leaves ordinary listing prose byte-identical', () => {
    const s =
      'A 78 m² apartment on the 4th floor of a 2019 building, with a balcony facing the sea.\n\nThe bus runs every 20 minutes.'
    const r = scrubContacts(s)
    expect(r.text).toBe(s)
    expect(r.removed).toBe(false)
  })

  it('keeps coordinates and years intact', () => {
    expect(scrubContacts('Pin at 41.4830, 19.4600 on the map.').text).toBe('Pin at 41.4830, 19.4600 on the map.')
    expect(scrubContacts('Built in 2022, sold furnished.').text).toBe('Built in 2022, sold furnished.')
  })
})
