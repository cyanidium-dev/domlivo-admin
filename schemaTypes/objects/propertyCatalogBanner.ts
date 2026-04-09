import {defineType, defineField} from 'sanity'
import {BannerImageBigInput} from '../../components/sanity/BannerImageBigInput'

function hasImageAsset(value: unknown): boolean {
  const img = value as {asset?: {_ref?: string}} | undefined
  return Boolean(img?.asset?._ref)
}

function hasImageAlt(value: unknown): boolean {
  const img = value as {alt?: string} | undefined
  return Boolean(img?.alt?.trim())
}

export const propertyCatalogBanner = defineType({
  name: 'propertyCatalogBanner',
  title: 'Property Catalog Banner',
  type: 'object',
  description:
    'Note: Currently only BIG banner is used on frontend. Small banner is reserved for a future map layout and is not displayed yet.',
  fields: [
    defineField({
      name: 'label',
      title: 'Internal Label',
      type: 'string',
      description: 'Editor-facing name used to identify this banner item in the list.',
      validation: (Rule) => Rule.required().min(2).max(120),
    }),
    defineField({
      name: 'enabled',
      title: 'Enabled',
      type: 'boolean',
      initialValue: true,
      description: 'Disable to keep this banner in CMS without showing it on /catalog.',
    }),
    defineField({
      name: 'order',
      title: 'Order (optional)',
      type: 'number',
      description:
        'Optional manual ordering hint for banner selection. Lower numbers are prioritized first.',
      validation: (Rule) => Rule.integer().min(0).max(9999),
    }),
    defineField({
      name: 'property',
      title: 'Linked Property',
      type: 'reference',
      to: [{type: 'property'}],
      weak: true,
      description: 'Property shown by this banner. Required when banner is enabled.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {enabled?: boolean} | undefined
          if (parent?.enabled === false) return true
          const ref = value as {_ref?: string} | undefined
          if (ref?._ref) return true
          return 'Select a linked property when this banner is enabled.'
        }),
    }),
    defineField({
      name: 'imageSmall',
      title: 'Small banner image (compact placements)',
      type: 'image',
      hidden: true,
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alternative text'}],
      description:
        'Not currently used on frontend.\n\nReserved for future layouts (map integration).\n\nIf provided:\n- Use similar composition as big banner\n- Wide landscape image recommended (~3:1)',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          // Keep schema key for future use, but do not require while field is hidden.
          if (!value) return true
          if (!hasImageAsset(value)) return 'Small image must include an uploaded asset.'
          if (!hasImageAlt(value)) return 'Add alternative text to the Small image.'
          return true
        }),
    }),
    defineField({
      name: 'imageBig',
      title: 'Large banner image (wide placements)',
      type: 'image',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alternative text'}],
      description:
        'Required. Wide landscape banner image.\n\nRecommended:\n- Aspect ratio: ~4:1 (e.g. 1600x400, 2000x500)\n- Safe range: 3:1 – 4:1\n\nImportant:\n- Image is cropped to fit banner (object-cover)\n- Top and bottom may be cut off\n- Keep important content centered\n- Avoid placing text near edges',
      components: {input: BannerImageBigInput as any},
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {enabled?: boolean} | undefined
          if (parent?.enabled === false) return true
          if (!hasImageAsset(value)) return 'Upload a Big image when this banner is enabled.'
          if (!hasImageAlt(value)) return 'Add alternative text to the Big image when this banner is enabled.'
          return true
        }),
    }),
  ],
  preview: {
    select: {
      label: 'label',
      enabled: 'enabled',
      order: 'order',
      propertyTitleEn: 'property.title.en',
      propertyTitleSq: 'property.title.sq',
      propertyRef: 'property._ref',
      imageSmallAssetRef: 'imageSmall.asset._ref',
      imageBigAssetRef: 'imageBig.asset._ref',
    },
    prepare({
      label,
      enabled,
      order,
      propertyTitleEn,
      propertyTitleSq,
      propertyRef,
      imageSmallAssetRef,
      imageBigAssetRef,
    }: {
      label?: string
      enabled?: boolean
      order?: number
      propertyTitleEn?: string
      propertyTitleSq?: string
      propertyRef?: string
      imageSmallAssetRef?: string
      imageBigAssetRef?: string
    }) {
      const title =
        label?.trim() ||
        propertyTitleEn ||
        propertyTitleSq ||
        (propertyRef ? `Property ${propertyRef}` : 'Catalog banner')

      const hasBothImages = Boolean(imageSmallAssetRef && imageBigAssetRef)
      const bits = [
        enabled === false ? 'disabled' : 'enabled',
        typeof order === 'number' ? `order ${order}` : null,
        hasBothImages ? 'small+big images' : 'missing image',
      ].filter(Boolean)
      return {
        title,
        subtitle: bits.join(' • '),
      }
    },
  },
})

