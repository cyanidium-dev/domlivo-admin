import {defineType, defineField, defineArrayMember} from 'sanity'

export const property = defineType({
  name: 'property',
  title: 'Property',
  type: 'document',

  groups: [
    {name: 'basic', title: 'Basic', default: true},
    {name: 'pricing', title: 'Pricing'},
    {name: 'location', title: 'Location'},
    {name: 'media', title: 'Media'},
    {name: 'analytics', title: 'Analytics'},
    {name: 'seo', title: 'SEO'},
  ],

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Main title of the property listing',
      group: 'basic',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      type: 'slug',
      title: 'URL slug',
      description: 'Used in the property URL; generated from title',
      group: 'basic',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'description',
      type: 'array',
      of: [{type: 'block'}],
      group: 'basic',
    }),

    defineField({
      name: 'agent',
      type: 'reference',
      to: [{type: 'agent'}],
      group: 'basic',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'price',
      title: 'Price in EUR',
      type: 'number',
      description: 'Listing price in euros (EUR)',
      group: 'pricing',
      validation: (Rule) => Rule.required().min(0).error('Price must be a positive value'),
    }),

    defineField({
      name: 'city',
      type: 'reference',
      to: [{type: 'city'}],
      group: 'location',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'district',
      type: 'reference',
      to: [{type: 'district'}],
      group: 'location',
      options: {
        filter: ({document}) => {
          const cityRef = (document?.city as {_ref?: string} | undefined)?._ref
          if (!cityRef) {
            return {filter: '_type == "district" && false', params: {}}
          }
          return {
            filter: '_type == "district" && city._ref == $cityId',
            params: {cityId: cityRef},
          }
        },
      },
    }),

    defineField({
      name: 'gallery',
      type: 'array',
      title: 'Gallery',
      group: 'media',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
        }),
      ],
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .error('Add at least one image')
          .max(20)
          .error('Maximum 20 images allowed'),
    }),

    defineField({
      name: 'createdAt',
      type: 'datetime',
      title: 'Created at',
      group: 'analytics',
      initialValue: () => new Date().toISOString(),
    }),

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),

    // TODO: migrate existing properties to populate ownerUserId
    defineField({
      name: 'ownerUserId',
      title: 'Owner User ID',
      type: 'string',
      readOnly: true,
      hidden: true,
      initialValue: (_, context) =>
        (context as {currentUser?: {id?: string}}).currentUser?.id ?? '',
    }),
  ],

  preview: {
    select: {
      title: 'title',
      price: 'price',
      cityTitle: 'city.title',
      media: 'gallery.0',
    },
    prepare(selection) {
      const {title, price, cityTitle, media} = selection
      const priceStr = price != null ? `€${Number(price).toLocaleString()}` : null
      const subtitle = [priceStr, cityTitle].filter(Boolean).join(' • ') || 'No price set'
      return {
        title,
        subtitle,
        media,
      }
    },
  },
})
