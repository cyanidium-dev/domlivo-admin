import {describe, expect, it} from 'vitest'
import {documents} from '../../schemaTypes/documents'
import {LEAD_STATUSES, LEAD_TYPES, lead} from '../../schemaTypes/documents/lead'

type FieldLike = {name?: string; type?: string; readOnly?: boolean; weak?: boolean; to?: Array<{type?: string}>}

const fields = lead.fields as FieldLike[]
const field = (name: string) => fields.find((f) => f.name === name)

describe('lead schema', () => {
  it('is registered as a document type', () => {
    expect(documents.some((d) => (d as {name?: string}).name === 'lead')).toBe(true)
  })

  // Must match `src/lib/leads/types.ts` in the frontend, which writes these values.
  it('lists the frontend lead types and statuses', () => {
    expect(LEAD_TYPES.map((t) => t.value)).toEqual([
      'contact_form',
      'property_inquiry',
      'agent_contact',
      'registration',
      'click_whatsapp',
      'click_phone',
      'click_email',
    ])
    expect(LEAD_STATUSES.map((s) => s.value)).toEqual([
      'new',
      'contacted',
      'qualified',
      'viewing',
      'negotiation',
      'won',
      'lost',
      'spam',
    ])
  })

  it('leaves only status and notes editable', () => {
    const editable = fields.filter((f) => !f.readOnly).map((f) => f.name)
    expect(editable).toEqual(['status', 'notes'])
  })

  it('references property and agent weakly', () => {
    expect(field('property')).toMatchObject({type: 'reference', weak: true, to: [{type: 'property'}]})
    expect(field('agent')).toMatchObject({type: 'reference', weak: true, to: [{type: 'agent'}]})
  })

  // Every top-level field the frontend's buildLeadDocument can write.
  it('has a field for everything the website writes', () => {
    const written = [
      'type', 'status', 'internal', 'createdAt', 'placement', 'locale', 'property', 'propertySlug',
      'propertyTitle', 'agent', 'agentSlug', 'source', 'medium', 'channel', 'campaign', 'utm', 'hasGclid',
      'referrerHost', 'landingPage', 'firstTouch', 'currentPage', 'pagesViewed', 'pagesViewedCount',
      'propertySlugsViewed', 'timeOnSiteSec', 'country', 'device', 'browserLanguage', 'name', 'phone',
      'email', 'message', 'interest', 'formLabel',
    ]
    const names = new Set(fields.map((f) => f.name))
    expect(written.filter((n) => !names.has(n))).toEqual([])
  })
})
