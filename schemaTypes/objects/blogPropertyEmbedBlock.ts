import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * Real-estate/property embed block for blog article content.
 * References only `property` documents.
 */
export const blogPropertyEmbedBlock = defineType({
  name: 'blogPropertyEmbedBlock',
  title: 'Property recommendations',
  type: 'object',

  fields: [
    defineField({
      name: 'title',
      title: 'Heading',
      type: 'localizedString',
      description: 'Optional heading shown above the property recommendations.',
    }),
    defineField({
      name: 'mode',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          {title: 'Card grid', value: 'card'},
          {title: 'List', value: 'list'},
          {title: 'Compact', value: 'compact'},
        ],
        layout: 'radio',
      },
      initialValue: 'card',
      validation: (Rule: any) => Rule.required(),
      description: 'Choose how property cards should be displayed.',
    }),
    defineField({
      name: 'properties',
      title: 'Recommended properties',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'property'}]})],
      validation: (Rule: any) =>
        Rule.required().min(1).max(3).error('Choose between 1 and 3 properties.'),
      description: 'Manually curated list of properties shown in this section.',
    }),
  ],

  preview: {
    select: {
      title: 'title.en',
      mode: 'mode',
      count: 'properties',
      firstTitle: 'properties.0->title.en',
    },
    prepare({title, mode, count, firstTitle}: {title?: string; mode?: string; count?: unknown[]; firstTitle?: string}) {
      const n = Array.isArray(count) ? count.length : 0
      const modeLabel =
        mode === 'card' ? 'Card grid' : mode === 'list' ? 'List' : mode === 'compact' ? 'Compact' : mode || ''
      const heading = title || 'Property recommendations'
      const detail = n > 0 && firstTitle ? `${n} · ${firstTitle}` : `${n} property(ies)`
      const modePart = modeLabel ? ` • ${modeLabel}` : ''
      return {title: heading, subtitle: detail + modePart}
    },
  },
})

