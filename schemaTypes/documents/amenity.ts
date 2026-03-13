import {defineType, defineField} from 'sanity'

/**
 * Amenity (pool, parking, sea view, etc.).
 * Internal taxonomy for property filtering. Not a routed/SEO entity.
 */
export const amenity = defineType({
  name: 'amenity',
  title: 'Amenity',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      options: {
        source: (doc: Record<string, unknown>) => {
          const t = doc?.title as {en?: string} | undefined
          return t?.en ?? ''
        },
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
      description: 'Stable key for filters and URLs. Non-localized.',
    }),

    defineField({
      name: 'order',
      type: 'number',
      title: 'Order',
      description: 'Display order in filters (lower first).',
    }),

    defineField({
      name: 'active',
      type: 'boolean',
      title: 'Active',
      initialValue: true,
    }),
  ],

  preview: {
    select: {
      titleEn: 'title.en',
      titleSq: 'title.sq',
    },
    prepare(selection) {
      const title = selection.titleEn || selection.titleSq || 'Untitled'
      return {title}
    },
  },
})
