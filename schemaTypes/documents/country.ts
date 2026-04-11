import {defineType, defineField} from 'sanity'

/**
 * Country: canonical geo route segment for city-aware URLs.
 * Cities reference exactly one country.
 */
export const country = defineType({
  name: 'country',
  title: 'Country',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'Display name (e.g. Albania).',
    }),

    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
      description: 'Kebab-case segment for routes (e.g. albania).',
    }),

    defineField({
      name: 'code',
      title: 'Code (optional)',
      type: 'string',
      description: 'ISO or internal code for future use (e.g. AL).',
    }),
  ],

  preview: {
    select: {title: 'title', slug: 'slug.current'},
    prepare({title, slug}: {title?: string; slug?: string}) {
      return {title: title || 'Country', subtitle: slug || ''}
    },
  },
})
