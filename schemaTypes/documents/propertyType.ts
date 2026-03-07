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
      name: 'image',
      type: 'image',
      options: {hotspot: true},
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
