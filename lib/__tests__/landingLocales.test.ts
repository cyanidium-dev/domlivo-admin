import {describe, expect, it} from 'vitest'
import {landingPage, requiredSeoLocales} from '../../schemaTypes/documents/landingPage'

type FieldLike = {name?: string; of?: Array<{type?: string}>; options?: {list?: Array<{value: string}>}}

describe('landingPage.locales (SEO-04)', () => {
  it('is an array of strings with the six project locales as options', () => {
    const f = (landingPage.fields as FieldLike[]).find((x) => x.name === 'locales')
    expect(f?.of?.[0]?.type).toBe('string')
    expect(f?.options?.list?.map((o) => o.value)).toEqual(['en', 'uk', 'ru', 'sq', 'it', 'pl'])
  })
  it('scopes the required SEO locales to the listed ones', () => {
    expect(requiredSeoLocales(undefined)).toEqual(['en', 'ru', 'uk', 'sq', 'it'])
    expect(requiredSeoLocales([])).toEqual(['en', 'ru', 'uk', 'sq', 'it'])
    expect(requiredSeoLocales(['pl'])).toEqual(['pl'])
    expect(requiredSeoLocales(['pl', 'en'])).toEqual(['pl', 'en'])
  })
})
