import {defineType, defineField} from 'sanity'
import {PROPERTY_ICON_KEYS, PROPERTY_ICON_OPTIONS} from '../constants/iconOptions'

/**
 * Property offer item for the What this property offers block.
 * Shown on property detail page with icon and title only.
 */
export const propertyOffer = defineType({
  name: 'propertyOffer',
  title: 'Property Offer',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
      description: 'Display label per language. Shown in the What this property offers block on the frontend.',
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
      description: 'Choose an icon from the list. Shown in the What this property offers block.',
    }),
    defineField({
      name: 'customIcon',
      title: 'Custom icon (monochrome SVG)',
      type: 'image',
      options: {
        hotspot: true,
      },
      description:
        'Optional. Upload a black monochrome SVG with a transparent background. The frontend inverts icons in dark theme—avoid colored or multi-tone icons and solid white backgrounds. If set, this overrides the preset icon above.',
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
      const resolvedTitle = titleEn ?? titleUk ?? titleRu ?? titleSq ?? titleIt ?? 'Untitled offer'
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
