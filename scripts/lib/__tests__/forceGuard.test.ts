import {describe, expect, it, vi} from 'vitest'
import {droppedSections, forceMayProceed, formatDrops} from '../forceGuard'

const live = [
  {_type: 'heroSection', _key: 'hero'},
  {_type: 'seoTextSection', _key: 'seo-text'},
  {_type: 'relatedPagesAutoSection', _key: 'related-a'},
  {_type: 'faqSection', _key: 'faq-blloku'},
]
const built = [
  {_type: 'heroSection', _key: 'hero'},
  {_type: 'seoTextSection', _key: 'seo-text'},
]

describe('droppedSections', () => {
  it('names live sections whose _key the built document lacks', () => {
    expect(droppedSections('landing-x', live, built)).toEqual([
      {id: 'landing-x', type: 'relatedPagesAutoSection', key: 'related-a'},
      {id: 'landing-x', type: 'faqSection', key: 'faq-blloku'},
    ])
  })
  it('falls back to type matching for keyless live sections', () => {
    expect(droppedSections('l', [{_type: 'ctaSection'}], [{_type: 'ctaSection', _key: 'cta'}])).toEqual([])
    expect(droppedSections('l', [{_type: 'faqSection'}], built)).toEqual([{id: 'l', type: 'faqSection', key: ''}])
  })
  it('is empty when the built document carries everything live has', () => {
    expect(droppedSections('l', built, live)).toEqual([])
    expect(droppedSections('l', undefined, built)).toEqual([])
  })
})

describe('forceMayProceed', () => {
  it('proceeds silently with nothing to drop', () => {
    expect(forceMayProceed([], ['--force'])).toBe(true)
  })
  it('refuses drops without --accept-drops and lists them', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const drops = droppedSections('landing-x', live, built)
    expect(forceMayProceed(drops, ['--force'])).toBe(false)
    expect(log.mock.calls.flat().join('\n')).toContain('landing-x: would drop relatedPagesAutoSection[related-a], faqSection[faq-blloku]')
    log.mockRestore()
  })
  it('proceeds with --accept-drops', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    expect(forceMayProceed(droppedSections('l', live, built), ['--force', '--accept-drops'])).toBe(true)
    log.mockRestore()
  })
  it('formatDrops groups by document', () => {
    expect(formatDrops([{id: 'a', type: 'x', key: 'k'}, {id: 'a', type: 'y', key: ''}])).toBe('  a: would drop x[k], y')
  })
})
