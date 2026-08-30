import {defineType, defineField} from 'sanity'

/**
 * Reusable external source reference: "label — publisher, date" + URL.
 * Used by `sourcesSection`, `tracker.sources[]` and `developer.sources[]`.
 */
export const sourceItem = defineType({
  name: 'sourceItem',
  title: 'Source',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'Source name as displayed, e.g. "Bank of Albania HPI H2 2025".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL (optional)',
      type: 'url',
      description:
        'Leave blank for an internal KB reference or a citation that synthesizes several outlets rather than one page — forcing a link in either case means guessing one, which is worse than no link.',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({name: 'publisher', title: 'Publisher (optional)', type: 'string'}),
    defineField({name: 'date', title: 'Date (optional)', type: 'date'}),
  ],
  preview: {
    select: {label: 'label', publisher: 'publisher'},
    prepare({label, publisher}: {label?: string; publisher?: string}) {
      return {title: label || 'Source', subtitle: publisher || ''}
    },
  },
})
