import {defineField, defineType} from 'sanity'

const STATUS_OPTIONS = [
  {title: 'New', value: 'new'},
  {title: 'Contacted', value: 'contacted'},
  {title: 'Closed', value: 'closed'},
] as const

const SOURCE_OPTIONS = [{title: 'Property contact form', value: 'property_contact_form'}] as const

const ALLOWED_STATUS = new Set(STATUS_OPTIONS.map((item) => item.value))
const ALLOWED_SOURCE = new Set(SOURCE_OPTIONS.map((item) => item.value))

const submissionReadOnly = ({document}: {document?: {_createdAt?: string}}) => Boolean(document?._createdAt)

export const propertyLead = defineType({
  name: 'propertyLead',
  title: 'Property Leads',
  type: 'document',
  description:
    'Inbound property contact submissions. Workflow containment only (Sanity free plan has no row-level security).',
  initialValue: () => ({
    status: 'new',
    source: 'property_contact_form',
    createdAt: new Date().toISOString(),
  }),
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      readOnly: submissionReadOnly,
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      readOnly: submissionReadOnly,
      validation: (Rule) =>
        Rule.custom((value) => {
          const raw = value != null ? String(value).trim() : ''
          if (!raw) return true
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? true : 'Must be a valid email address.'
        }),
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
      readOnly: submissionReadOnly,
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'text',
      rows: 5,
      readOnly: submissionReadOnly,
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [...STATUS_OPTIONS],
        layout: 'radio',
      },
      initialValue: 'new',
      validation: (Rule) =>
        Rule.required().custom((value) => {
          const raw = typeof value === 'string' ? value.trim() : ''
          if (!raw) return 'Status is required.'
          return ALLOWED_STATUS.has(raw as 'new' | 'contacted' | 'closed') ? true : 'Invalid status.'
        }),
    }),
    defineField({
      name: 'createdAt',
      title: 'Created at',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
    defineField({
      name: 'property',
      title: 'Property',
      type: 'reference',
      to: [{type: 'property'}],
      readOnly: submissionReadOnly,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'linkedAgent',
      title: 'Linked agent',
      type: 'reference',
      to: [{type: 'agent'}],
      readOnly: submissionReadOnly,
    }),
    defineField({
      name: 'propertyTitleSnapshot',
      title: 'Property title snapshot',
      type: 'string',
      readOnly: submissionReadOnly,
      description: 'Snapshot from property page at submission time.',
    }),
    defineField({
      name: 'propertyPriceSnapshot',
      title: 'Property price snapshot',
      type: 'number',
      readOnly: submissionReadOnly,
      description: 'Snapshot from property page at submission time.',
    }),
    defineField({
      name: 'locale',
      title: 'Locale',
      type: 'string',
      readOnly: submissionReadOnly,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sourcePageUrl',
      title: 'Source page URL',
      type: 'url',
      readOnly: submissionReadOnly,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      options: {
        list: [...SOURCE_OPTIONS],
      },
      readOnly: submissionReadOnly,
      initialValue: 'property_contact_form',
      validation: (Rule) =>
        Rule.required().custom((value) => {
          const raw = typeof value === 'string' ? value.trim() : ''
          if (!raw) return 'Source is required.'
          return ALLOWED_SOURCE.has(raw as 'property_contact_form') ? true : 'Invalid source.'
        }),
    }),
  ],
  preview: {
    select: {
      title: 'name',
      propertyTitle: 'propertyTitleSnapshot',
      status: 'status',
      source: 'source',
    },
    prepare({title, propertyTitle, status, source}) {
      const subtitleParts = [propertyTitle, status, source].filter(Boolean)
      return {
        title: title || 'Unnamed lead',
        subtitle: subtitleParts.join(' · ') || 'Property lead',
      }
    },
  },
})
