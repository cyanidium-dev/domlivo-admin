import {defineType, defineField} from 'sanity'

/**
 * Property type (Apartment, House, Villa, etc.).
 * Field-level i18n: title, shortDescription are localized.
 * Frontend: resolve propertyType.title with getLocalizedValue(locale).
 */
export const propertyType = defineType({
  name: 'propertyType',
  title: 'Property Type',
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
      type: 'slug',
      title: 'URL slug',
      description: 'Used in /property-types/[slug]. Same style as city/property.',
      options: {
        source: (doc: Record<string, unknown>) => {
          const t = doc?.title as {en?: string} | undefined
          return t?.en ?? ''
        },
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        {name: 'alt', type: 'string', title: 'Alternative text', description: 'For accessibility and card display'},
      ],
    }),

    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'localizedText',
    }),

    defineField({
      name: 'order',
      type: 'number',
      title: 'Order',
      description: 'Display order (lower numbers first)',
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
      media: 'image',
    },
    prepare(selection) {
      const title = selection.titleEn || selection.titleSq || 'Untitled'
      return {title, media: selection.media}
    },
  },
})
