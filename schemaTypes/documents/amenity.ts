import {defineType, defineField} from 'sanity'
import {PROPERTY_ICON_KEYS, PROPERTY_ICON_OPTIONS} from '../constants/iconOptions'

/**
 * Amenity (pool, parking, sea view, etc.).
 * Global taxonomy for catalog filters and property detail display (refs).
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
      name: 'description',
      title: 'Short description',
      type: 'localizedText',
      description:
        'Brief description per language shown under the title on property detail and in amenity-driven UI. Matches the inline property amenity description field.',
    }),

    defineField({
      name: 'iconKey',
      title: 'Icon',
      type: 'string',
      options: {
        list: [...PROPERTY_ICON_OPTIONS],
      },
      validation: (Rule) =>
        Rule.custom((val, context) => {
          const parent = context.parent as {customIcon?: unknown} | undefined
          if (!val || val === '') {
            if (parent?.customIcon) return true
            return true
          }
          return (PROPERTY_ICON_KEYS as readonly string[]).includes(String(val))
            ? true
            : 'Icon must be from the list. Use custom icon upload for other options.'
        }),
      description:
        'Preset icon for this amenity. Optional. If you upload a custom icon below, it overrides this when displaying.',
    }),

    defineField({
      name: 'customIcon',
      title: 'Custom icon (upload)',
      type: 'image',
      options: {
        hotspot: true,
      },
      description:
        'Optional. Upload your own icon if the preset list does not suit. If set, this overrides the selected icon above.',
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
