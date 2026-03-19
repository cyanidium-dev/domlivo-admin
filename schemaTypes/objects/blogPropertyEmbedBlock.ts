import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * Real-estate/property embed block for blog article content.
 * References only `property` documents.
 */
export const blogPropertyEmbedBlock = defineType({
  name: 'blogPropertyEmbedBlock',
  title: 'Real estate block',
  type: 'object',

  fields: [
    defineField({
      name: 'title',
      title: 'Section title',
      type: 'localizedString',
      description: 'Optional heading shown above the property recommendations.',
    }),
    defineField({
      name: 'mode',
      title: 'Display mode',
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
      description: 'Frontend can use this to choose a rendering style.',
    }),
    defineField({
      name: 'properties',
      title: 'Properties',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'property'}]})],
      validation: (Rule: any) => Rule.required().min(1).max(3),
      description: 'Manually curated list of recommended properties.',
    }),
  ],

  preview: {
    select: {title: 'title.en', mode: 'mode', count: 'properties'},
    prepare({title, mode, count}: {title?: string; mode?: string; count?: unknown[]}) {
      const n = Array.isArray(count) ? count.length : 0
      const m = mode ? ` · ${mode}` : ''
      return {title: title || 'Real estate', subtitle: `${n} propert${n === 1 ? 'y' : 'ies'}` + m}
    },
  },
})

