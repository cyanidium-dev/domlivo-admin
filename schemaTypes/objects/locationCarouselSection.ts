import {defineType, defineField, defineArrayMember} from 'sanity'
import {PAGE_BUILDER_GROUPS} from '../constants/pageBuilderGroups'

export const locationCarouselSection = defineType({
  name: 'locationCarouselSection',
  title: 'Locations carousel',
  type: 'object',
  groups: [...PAGE_BUILDER_GROUPS],
  fields: [
    defineField({
      name: 'enabled',
      title: 'Enabled / Visible',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
      description: 'If disabled, this block is hidden on the site.',
    }),
    defineField({name: 'title', title: 'Section title', type: 'localizedString', group: 'content'}),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'localizedText', group: 'content'}),
    defineField({
      name: 'cta',
      title: 'Call to action (optional)',
      type: 'localizedCtaLink',
      group: 'content',
    }),
    defineField({
      name: 'linkTargetType',
      title: 'Link target',
      type: 'string',
      group: 'layout',
      initialValue: 'landing',
      options: {
        list: [
          {title: 'Catalog', value: 'catalog'},
          {title: 'Landing', value: 'landing'},
        ],
        layout: 'radio',
      },
      description: 'Whether cards link to catalog or landing routes.',
    }),
    defineField({
      name: 'mode',
      title: 'Content mode',
      type: 'string',
      group: 'data',
      options: {
        list: [
          {title: 'Auto (from city/district flags)', value: 'auto'},
          {title: 'Manual selection', value: 'manual'},
        ],
        layout: 'radio',
      },
      initialValue: 'auto',
      description:
        'Auto: cities and districts from catalog flags. Manual: use the ordered list below.',
    }),
    defineField({
      name: 'auto',
      title: 'Auto settings',
      type: 'object',
      group: 'data',
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
          description: 'Optional limit for city cards.',
          validation: (Rule) => Rule.min(1).max(50),
        }),
        defineField({
          name: 'maxDistricts',
          title: 'Max districts',
          type: 'number',
          description: 'Optional limit for district cards.',
          validation: (Rule) => Rule.min(1).max(100),
        }),
      ],
    }),
    defineField({
      name: 'manualItems',
      title: 'Manual items (ordered)',
      type: 'array',
      group: 'data',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'city'}, {type: 'district'}],
        }),
      ],
      hidden: ({parent}) => parent?.mode !== 'manual',
      description: 'Ordered cities and districts.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {mode?: string} | undefined
          if (parent?.mode !== 'manual') return true
          const items = Array.isArray(value) ? value : []
          if (items.length === 0) {
            return 'In manual mode, add at least one city or district.'
          }
          return true
        }),
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled', mode: 'mode', manualItems: 'manualItems'},
    prepare({
      title,
      enabled,
      mode,
      manualItems,
    }: {
      title?: string
      enabled?: boolean
      mode?: string
      manualItems?: unknown[]
    }) {
      const status = enabled === false ? ' (hidden)' : ''
      const n = Array.isArray(manualItems) ? manualItems.length : 0
      const sub = mode === 'manual' ? `Manual · ${n} items` : 'Auto'
      return {title: (title || 'Locations') + status, subtitle: sub}
    },
  },
})
