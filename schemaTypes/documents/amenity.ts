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
