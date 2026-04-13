import {defineType, defineField} from 'sanity'
import {languages} from '../../lib/languages'

const STATUS_VALUES = [
  {title: 'Pending', value: 'pending'},
  {title: 'Approved', value: 'approved'},
  {title: 'Rejected', value: 'rejected'},
] as const

const ALLOWED_STATUS = new Set(STATUS_VALUES.map((s) => s.value))

const REALTOR_OR_AGENCY_OPTIONS = [
  {title: 'Realtor', value: 'realtor'},
  {title: 'Agency', value: 'agency'},
]

const ALLOWED_REALTOR_OR_AGENCY = new Set(REALTOR_OR_AGENCY_OPTIONS.map((o) => o.value))

const LANGUAGE_OPTIONS = languages.map((l) => ({title: l.title, value: l.id}))
const ALLOWED_LANGUAGE_IDS = new Set(languages.map((l) => l.id))

function statusLabel(value: string | undefined): string {
  const row = STATUS_VALUES.find((s) => s.value === value)
  return row?.title ?? String(value ?? '—')
}

function realtorOrAgencyLabel(value: string | undefined): string {
  if (!value) return ''
  const row = REALTOR_OR_AGENCY_OPTIONS.find((o) => o.value === value)
  return row?.title ?? value
}

function languageLabel(id: string | undefined): string {
  if (!id) return ''
  return languages.find((l) => l.id === id)?.title ?? id
}

/**
 * Manual registration request from the website (operational inbox; not public page content).
 * Programmatic create contract: `docs/registration-request-sanity-frontend-contract.md`
 */
export const registrationRequest = defineType({
  name: 'registrationRequest',
  title: 'Registration Request',
  type: 'document',
  description: 'Inbound registration requests from the website. Review and status are managed here.',

  /** Defaults for new documents created in Studio. */
  initialValue: () => ({
    status: 'pending',
  }),

  groups: [
    {name: 'submission', title: 'Submitted data', default: true},
    {name: 'review', title: 'Review'},
  ],

  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'submission',
      readOnly: true,
      description: 'Submitted from the website. Read-only; copy as needed.',
      validation: (Rule) =>
        Rule.custom((value) => {
          const s = typeof value === 'string' ? value.trim() : ''
          return s.length > 0 ? true : 'Required'
        }),
    }),

    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
      group: 'submission',
      readOnly: true,
      description: 'Submitted from the website. Read-only; copy as needed.',
      validation: (Rule) =>
        Rule.custom((value) => {
          const s = typeof value === 'string' ? value.trim() : ''
          return s.length > 0 ? true : 'Required'
        }),
    }),

    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      group: 'submission',
      readOnly: true,
      description: 'Submitted from the website. Read-only; copy as needed.',
      validation: (Rule) =>
        Rule.custom((value) => {
          const s = value != null ? String(value).trim() : ''
          if (!s) return true
          const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
          return ok || 'Must be a valid email address'
        }),
    }),

    defineField({
      name: 'realtorOrAgency',
      title: 'Realtor or agency',
      type: 'string',
      group: 'submission',
      readOnly: true,
      description: 'Submitted from the website. Read-only; copy as needed.',
      options: {
        list: REALTOR_OR_AGENCY_OPTIONS,
        layout: 'radio',
      },
      validation: (Rule) =>
        Rule.custom((value) => {
          if (value === undefined || value === null) return true
          const s = String(value).trim()
          if (s === '') return true
          return ALLOWED_REALTOR_OR_AGENCY.has(s) ? true : 'Must be realtor or agency'
        }),
    }),

    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      group: 'submission',
      readOnly: true,
      description: 'Submitted from the website. Read-only; copy as needed.',
      options: {
        list: LANGUAGE_OPTIONS,
        layout: 'dropdown',
      },
      validation: (Rule) =>
        Rule.custom((value) => {
          const id = typeof value === 'string' ? value.trim() : ''
          if (!id) return 'Required'
          return ALLOWED_LANGUAGE_IDS.has(id) ? true : 'Must be a supported site language'
        }),
    }),

    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'review',
      description: 'Where this request is in your review workflow. Update as you process it.',
      options: {
        list: [...STATUS_VALUES],
        layout: 'radio',
      },
      initialValue: 'pending',
      validation: (Rule) =>
        Rule.custom((value) => {
          if (value === undefined || value === null) return 'Required'
          const v = typeof value === 'string' ? value.trim() : ''
          if (!v) return 'Required'
          return ALLOWED_STATUS.has(v) ? true : 'Invalid status'
        }),
    }),

    defineField({
      name: 'internalComment',
      title: 'Internal comment',
      type: 'text',
      group: 'review',
      rows: 5,
      description: 'For internal use only. Not shown on the website.',
    }),
  ],

  preview: {
    select: {
      name: 'name',
      phone: 'phone',
      email: 'email',
      language: 'language',
      realtorOrAgency: 'realtorOrAgency',
      status: 'status',
    },
    prepare({name, phone, email, language, realtorOrAgency, status}) {
      const title = (name && String(name).trim()) || 'Unnamed request'
      const statusPart = statusLabel(status)
      const contactParts = [phone, email].filter(Boolean)
      const contact = contactParts.length ? contactParts.join(' · ') : ''
      const extra = [languageLabel(language), realtorOrAgencyLabel(realtorOrAgency)].filter(Boolean).join(' · ')
      const subtitle = [statusPart, contact || null, extra || null].filter(Boolean).join(' · ')
      return {
        title,
        subtitle: subtitle || statusPart,
      }
    },
  },
})
