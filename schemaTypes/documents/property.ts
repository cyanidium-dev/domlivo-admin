import React from 'react'
import {defineType, defineField, defineArrayMember} from 'sanity'
import {CoordinatesLatInput} from '../../components/sanity/coordinates/CoordinatesLatInput'
import {CoordinatesLngInput} from '../../components/sanity/coordinates/CoordinatesLngInput'
import {SeoWithCopyButtonInput} from '../../components/sanity/SeoWithCopyButtonInput'
import {DescriptionWithAppendFactsInput} from '../../components/sanity/DescriptionWithAppendFactsInput'
import {GalleryWithCopyAltInput} from '../../components/sanity/GalleryWithCopyAltInput'

export const property = defineType({
  name: 'property',
  title: 'Property',
  type: 'document',

  groups: [
    {name: 'basic', title: 'Basic', default: true},
    {name: 'pricing', title: 'Pricing'},
    {name: 'location', title: 'Location'},
    {name: 'details', title: 'Details'},
    {name: 'media', title: 'Media'},
    {name: 'seo', title: 'SEO'},
    {name: 'analytics', title: 'Analytics'},
  ],

  fields: [
    // BASIC
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      group: 'basic',
      description: 'Property title per language. Used on multilingual frontend pages.',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      type: 'slug',
      title: 'URL slug',
      description: 'Used in the property URL. Generated from title.',
      group: 'basic',
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
      name: 'shortDescription',
      title: 'Short Description',
      type: 'localizedText',
      group: 'basic',
      description: 'Brief summary per language for cards and listings.',
    }),

    defineField({
      name: 'description',
      title: 'Description',
      type: 'localizedText',
      group: 'basic',
      description: 'Full description per language for the property detail page.',
      components: {input: DescriptionWithAppendFactsInput},
    }),

    defineField({
      name: 'agent',
      type: 'reference',
      to: [{type: 'agent'}],
      group: 'basic',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'type',
      title: 'Property Type',
      type: 'reference',
      to: [{type: 'propertyType'}],
      group: 'basic',
      description: 'e.g. Apartment, House, Land',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'basic',
      options: {
        list: [
          {title: 'Sale', value: 'sale'},
          {title: 'Rent', value: 'rent'},
          {title: 'Short-term', value: 'short-term'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'isPublished',
      title: 'Published',
      type: 'boolean',
      group: 'basic',
      initialValue: true,
      description: 'Show this property on the website.',
    }),

    defineField({
      name: 'lifecycleStatus',
      title: 'Lifecycle Status',
      type: 'string',
      group: 'basic',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Active', value: 'active'},
          {title: 'Reserved', value: 'reserved'},
          {title: 'Sold', value: 'sold'},
          {title: 'Rented', value: 'rented'},
          {title: 'Archived', value: 'archived'},
        ],
      },
      initialValue: 'active',
      description: 'Property listing lifecycle. Active = visible for deal; Archived = hidden from listings.',
    }),

    // PRICING
    defineField({
      name: 'price',
      title: 'Price (EUR)',
      type: 'number',
      group: 'pricing',
      description: 'Listing price in EUR (base currency). All property prices are stored in EUR.',
      validation: (Rule) =>
        Rule.required().min(0).error('Price must be a positive value'),
    }),

    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      group: 'pricing',
      initialValue: false,
    }),

    defineField({
      name: 'investment',
      title: 'Investment',
      type: 'boolean',
      group: 'pricing',
      initialValue: false,
    }),

    // LOCATION
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
      name: 'address',
      title: 'Address',
      type: 'localizedString',
      group: 'location',
      description: 'Street address per language.',
    }),

    defineField({
      name: 'coordinatesLat',
      title: 'Latitude',
      type: 'number',
      group: 'location',
      components: {input: CoordinatesLatInput},
      validation: (Rule) =>
        Rule.min(-90).max(90).error('Latitude must be between -90 and 90'),
    }),

    defineField({
      name: 'coordinatesLng',
      title: 'Longitude',
      type: 'number',
      group: 'location',
      components: {input: CoordinatesLngInput},
      validation: (Rule) =>
        Rule.min(-180).max(180).error('Longitude must be between -180 and 180'),
    }),

    defineField({
      name: 'locationTags',
      title: 'Location Tags',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'locationTag'}]})],
      group: 'location',
      description: 'Tags for filtering and discovery (e.g. near beach, central).',
    }),

    // DETAILS
    defineField({
      name: 'area',
      title: 'Area (m²)',
      type: 'number',
      group: 'details',
      validation: (Rule) => Rule.min(0),
    }),

    defineField({
      name: 'bedrooms',
      title: 'Bedrooms',
      type: 'number',
      group: 'details',
      validation: (Rule) => Rule.min(0),
    }),

    defineField({
      name: 'bathrooms',
      title: 'Bathrooms',
      type: 'number',
      group: 'details',
      validation: (Rule) => Rule.min(0),
    }),

    defineField({
      name: 'yearBuilt',
      title: 'Year Built',
      type: 'number',
      group: 'details',
      validation: (Rule) =>
        Rule.min(1800).max(2100).error('Year must be between 1800 and 2100'),
    }),

    defineField({
      name: 'amenities',
      title: 'Amenities',
      type: 'array',
      of: [defineArrayMember({type: 'propertyAmenity'})],
      group: 'details',
      description:
        'Used for property filtering and the Property details block. Each item has title, short description, icon picker, and optional custom icon upload.',
    }),

    defineField({
      name: 'propertyOffers',
      title: 'Property Offers',
      type: 'array',
      of: [defineArrayMember({type: 'propertyOffer'})],
      group: 'details',
      description:
        'Shown in the What this property offers block on the frontend. Each item has title, icon picker, and optional custom icon upload.',
    }),

    defineField({
      name: 'propertyCode',
      title: 'Property Code',
      type: 'string',
      group: 'details',
      description: 'Internal reference code for this property.',
    }),

    // MEDIA
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      group: 'media',
      description:
        'Tip: you can drag and drop multiple images onto this gallery block to upload them at once. Drop them on the array block, not inside a single image item.',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            {name: 'alt', type: 'string', title: 'Alternative text', description: 'For accessibility and card display'},
            {name: 'label', type: 'string', title: 'Label', description: 'Editorial label / caption'},
          ],
        }),
      ],
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .error('Add at least one image')
          .max(30)
          .error('Maximum 30 images allowed'),
      components: {input: GalleryWithCopyAltInput},
    }),

    // SEO
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'localizedSeo',
      group: 'seo',
      components: {
        input: (props: Record<string, unknown>) =>
          React.createElement(SeoWithCopyButtonInput, {...props, sourceType: 'property'}),
      },
    }),

    // ANALYTICS
    defineField({
      name: 'createdAt',
      type: 'datetime',
      title: 'Created at',
      group: 'analytics',
      initialValue: () => new Date().toISOString(),
    }),

    defineField({
      name: 'viewCount',
      title: 'View Count',
      type: 'number',
      group: 'analytics',
      initialValue: 0,
      readOnly: true,
    }),

    defineField({
      name: 'saveCount',
      title: 'Save Count',
      type: 'number',
      group: 'analytics',
      initialValue: 0,
      readOnly: true,
    }),

    defineField({
      name: 'contactCount',
      title: 'Contact Count',
      type: 'number',
      group: 'analytics',
      initialValue: 0,
      readOnly: true,
    }),

    // TODO: migrate existing properties to populate ownerUserId
    defineField({
      name: 'ownerUserId',
      title: 'Owner User ID',
      type: 'string',
      readOnly: true,
      hidden: true,
      group: 'analytics',
      initialValue: (_, context) =>
        (context as {currentUser?: {id?: string}}).currentUser?.id ?? '',
    }),
  ],

  preview: {
    select: {
      titleEn: 'title.en',
      titleRu: 'title.ru',
      titleUk: 'title.uk',
      titleSq: 'title.sq',
      status: 'status',
      price: 'price',
      cityTitle: 'city.title',
      media: 'gallery.0',
    },
    prepare(selection) {
      const {
        titleEn,
        titleRu,
        titleUk,
        titleSq,
        status,
        price,
        cityTitle,
        media,
      } = selection
      const title = titleEn || titleRu || titleUk || titleSq || 'Untitled'
      const priceStr =
        price != null ? `€${Number(price).toLocaleString()}` : null
      const parts = [status, priceStr, cityTitle].filter(Boolean)
      const subtitle = parts.join(' • ') || 'No price set'
      return {title, subtitle, media}
    },
  },
})
