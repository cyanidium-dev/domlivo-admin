import {defineType, defineField, defineArrayMember} from 'sanity'
import {PAGE_BUILDER_GROUPS} from '../constants/pageBuilderGroups'

/**
 * "Sources & methodology" footer block: numbered list of external references
 * ("label — publisher, date") plus an optional collapsible methodology note.
 */
export const sourcesSection = defineType({
  name: 'sourcesSection',
  title: 'Sources & methodology',
  type: 'object',
  groups: [...PAGE_BUILDER_GROUPS],
  fields: [
    defineField({
      name: 'enabled',
      title: 'Enabled / Visible',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
      description: 'If disabled, this section is hidden on the site.',
    }),
    defineField({name: 'title', title: 'Title', type: 'localizedString', group: 'content'}),
    defineField({
      name: 'intro',
      title: 'Intro (optional)',
      type: 'localizedText',
      group: 'content',
    }),
    defineField({
      name: 'sources',
      title: 'Sources',
      type: 'array',
      group: 'data',
      of: [
        defineArrayMember({
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
              title: 'URL',
              type: 'url',
              validation: (Rule) =>
                Rule.required().uri({scheme: ['http', 'https']}),
            }),
            defineField({
              name: 'publisher',
              title: 'Publisher (optional)',
              type: 'string',
            }),
            defineField({
              name: 'date',
              title: 'Date (optional)',
              type: 'date',
            }),
          ],
          preview: {
            select: {label: 'label', publisher: 'publisher'},
            prepare({label, publisher}: {label?: string; publisher?: string}) {
              return {title: label || 'Source', subtitle: publisher || ''}
            },
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(1).max(30),
    }),
    defineField({
      name: 'methodologyNote',
      title: 'Methodology note (optional)',
      type: 'localizedText',
      group: 'content',
      description: 'Shown in a collapsible "Methodology" block under the source list.',
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled', sources: 'sources'},
    prepare({title, enabled, sources}: {title?: string; enabled?: boolean; sources?: unknown[]}) {
      const n = Array.isArray(sources) ? sources.length : 0
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'Sources') + status, subtitle: `${n} source(s)`}
    },
  },
})
