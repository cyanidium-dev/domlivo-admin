import {defineType, defineField} from 'sanity'
import {PROPERTY_ICON_KEYS, PROPERTY_ICON_OPTIONS} from '../constants/iconOptions'

/**
 * Amenity item stored directly on the property.
 * Used for both property filtering and the Property details block.
 */
export const propertyAmenity = defineType({
  name: 'propertyAmenity',
  title: 'Amenity',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
      description: 'Display label per language. Used for filtering and shown in Property details block.',
    }),
    defineField({
      name: 'description',
      title: 'Short description',
      type: 'localizedText',
      description:
        'Brief description per language shown under the title in the Property details block on the frontend.',
    }),
    defineField({
      name: 'iconKey',
      title: 'Icon',
      type: 'string',
      options: {
        list: [...PROPERTY_ICON_OPTIONS],
      },
      validation: (Rule) =>
        Rule.custom((val) =>
          !val || (typeof val === 'string' && (PROPERTY_ICON_KEYS as readonly string[]).includes(val))
            ? true
            : 'Icon must be from the list. Use custom icon upload for other options.',
        ),
      description: 'Choose an icon from the list. Shown in the Property details block.',
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
  ],
  preview: {
    select: {
      titleEn: 'title.en',
      titleUk: 'title.uk',
      titleRu: 'title.ru',
      titleSq: 'title.sq',
      titleIt: 'title.it',
      iconKey: 'iconKey',
      hasCustomIcon: 'customIcon',
    },
    prepare({
      titleEn,
      titleUk,
      titleRu,
      titleSq,
      titleIt,
      iconKey,
      hasCustomIcon,
    }: {
      titleEn?: string
      titleUk?: string
      titleRu?: string
      titleSq?: string
      titleIt?: string
      iconKey?: string
      hasCustomIcon?: unknown
    }) {
      const resolvedTitle = titleEn ?? titleUk ?? titleRu ?? titleSq ?? titleIt ?? 'Untitled amenity'
      const iconLabel = hasCustomIcon
        ? 'Custom icon'
        : iconKey
          ? PROPERTY_ICON_OPTIONS.find((o) => o.value === iconKey)?.title ?? iconKey
          : undefined
      return {
        title: resolvedTitle,
        subtitle: iconLabel ?? 'No icon',
      }
    },
  },
})
