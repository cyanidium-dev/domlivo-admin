import {defineType, defineField, defineArrayMember} from 'sanity'

export const locationCarouselSection = defineType({
  name: 'locationCarouselSection',
  title: 'Locations Carousel (Cities & Districts)',
  type: 'object',
  fields: [
    defineField({
      name: 'enabled',
      title: 'Enabled / Visible',
      type: 'boolean',
      initialValue: true,
      description: 'If disabled, the frontend should hide this block.',
    }),
    defineField({name: 'title', title: 'Section Title', type: 'localizedString'}),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'localizedText'}),
    defineField({name: 'cta', title: 'CTA', type: 'localizedCtaLink'}),
    defineField({
      name: 'mode',
      title: 'Cards Source Mode',
      type: 'string',
      options: {
        list: [
          {title: 'Auto (from city/district flags)', value: 'auto'},
          {title: 'Manual selection', value: 'manual'},
        ],
        layout: 'radio',
      },
      initialValue: 'auto',
      description:
        'Auto: frontend selects cities/districts based on their own fields (e.g. popular/published and order). Manual: use the selected list below.',
    }),
    defineField({
      name: 'auto',
      title: 'Auto Settings',
      type: 'object',
      hidden: ({parent}) => parent?.mode !== 'auto',
      fields: [
        defineField({name: 'includeCities', title: 'Include cities', type: 'boolean', initialValue: true}),
        defineField({name: 'includeDistricts', title: 'Include districts', type: 'boolean', initialValue: true}),
        defineField({
          name: 'citiesPopularOnly',
          title: 'Cities: popular only',
          type: 'boolean',
          initialValue: true,
          description: 'When enabled, only cities with Popular=true are included.',
        }),
        defineField({
          name: 'districtsPublishedOnly',
          title: 'Districts: published only',
          type: 'boolean',
          initialValue: true,
          description: 'When enabled, only districts with Published=true are included.',
        }),
        defineField({
          name: 'districtsPopularOnly',
          title: 'Districts: popular only',
          type: 'boolean',
          initialValue: true,
          description: 'When enabled, only districts with Popular=true are included.',
        }),
        defineField({
          name: 'maxCities',
          title: 'Max cities',
          type: 'number',
          description: 'Optional limit for number of city cards.',
          validation: (Rule) => Rule.min(1).max(50),
        }),
        defineField({
          name: 'maxDistricts',
          title: 'Max districts',
          type: 'number',
          description: 'Optional limit for number of district cards.',
          validation: (Rule) => Rule.min(1).max(100),
        }),
      ],
    }),
    defineField({
      name: 'manualItems',
      title: 'Manual Items (Ordered)',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'city'}, {type: 'district'}],
        }),
      ],
      hidden: ({parent}) => parent?.mode !== 'manual',
      description:
        'Manual mode only. Single ordered list that can mix cities and districts. Frontend should render this exact order.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {mode?: string} | undefined
          if (parent?.mode !== 'manual') return true
          const items = Array.isArray(value) ? value : []
          if (items.length === 0) {
            return 'In Manual mode, add at least one item (city or district).'
          }
          return true
        }),
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled', mode: 'mode'},
    prepare({title, enabled, mode}: {title?: string; enabled?: boolean; mode?: string}) {
      const status = enabled === false ? ' (hidden)' : ''
      const source = mode === 'manual' ? 'Manual' : 'Auto'
      return {title: (title || 'Locations') + status, subtitle: `Location carousel • ${source}`}
    },
  },
})

