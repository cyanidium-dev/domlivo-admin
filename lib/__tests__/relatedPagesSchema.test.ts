import {describe, expect, it} from 'vitest'
import {relatedPagesAutoSection} from '../../schemaTypes/objects/relatedPagesAutoSection'
import {objects} from '../../schemaTypes/objects'
import {landingPage} from '../../schemaTypes/documents/landingPage'
import {siteSettings} from '../../schemaTypes/documents/siteSettings'

type FieldLike = {name?: string; of?: Array<{type?: string}>}

describe('ТЗ-16 schema registration (spec §11, audit F-2)', () => {
  it('relatedPagesAutoSection is registered in the objects array', () => {
    expect(objects.some((t) => (t as {name?: string}).name === 'relatedPagesAutoSection')).toBe(true)
  })
  it('relatedPagesAutoSection is allowed in landingPage.pageSections', () => {
    const sections = (landingPage.fields as FieldLike[]).find((f) => f.name === 'pageSections')
    expect(sections?.of?.some((m) => m.type === 'relatedPagesAutoSection')).toBe(true)
  })
  it('landingPage carries topicTags and siteSettings carries footerGuideLinks', () => {
    expect((landingPage.fields as FieldLike[]).some((f) => f.name === 'topicTags')).toBe(true)
    expect((siteSettings.fields as FieldLike[]).some((f) => f.name === 'footerGuideLinks')).toBe(true)
  })
  it('the section exposes the four modes with cityDistricts as the default', () => {
    const mode = (relatedPagesAutoSection.fields as Array<FieldLike & {options?: {list?: Array<{value?: string}>}; initialValue?: unknown}>).find(
      (f) => f.name === 'mode',
    )
    const values = (mode?.options?.list ?? []).map((o) => o.value)
    expect(values).toEqual(['cityDistricts', 'zoneComparisons', 'topicGuides', 'manual'])
    expect(mode?.initialValue).toBe('cityDistricts')
  })
})
