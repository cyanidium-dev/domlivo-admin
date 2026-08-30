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
    'Both images are required. BIG is used by the full-width catalog placement, SMALL by the half-width placement. A banner only becomes eligible once both images and both alt texts are filled and the linked property is published.',
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
      title: 'Small banner image (half-width placement)',
      type: 'image',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alternative text'}],
      description:
        'Required, and required for the banner to appear at all — the catalog query filters on it.\n\nUsed by the half-width placement.\n\n- Same composition as the big banner\n- Wide landscape image recommended (~3:1)',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          // Same gate as imageBig below: skipped only for explicitly disabled
          // banners, so a banner cannot be enabled without its half-width image.
          const parent = context.parent as {enabled?: boolean} | undefined
          if (parent?.enabled === false) return true
          if (!hasImageAsset(value)) return 'Upload a Small image when this banner is enabled.'
          if (!hasImageAlt(value)) return 'Add alternative text to the Small image when this banner is enabled.'
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

