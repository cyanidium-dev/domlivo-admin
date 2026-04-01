import {defineType, defineField, defineArrayMember} from 'sanity'
import {PAGE_BUILDER_GROUPS} from '../constants/pageBuilderGroups'

export const propertyCarouselSection = defineType({
  name: 'propertyCarouselSection',
  title: 'Property carousel',
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
    defineField({name: 'shortLine', title: 'Short line (optional)', type: 'localizedString', group: 'content'}),
    defineField({
      name: 'cta',
      title: 'Call to action (optional)',
      type: 'localizedCtaLink',
      group: 'content',
      description: 'Optional button or link below the header.',
    }),
    defineField({
      name: 'tabs',
      title: 'Tabs / groups',
      type: 'array',
      group: 'layout',
      of: [defineArrayMember({type: 'homePropertyCarouselTab'})],
      description:
        'Which tab groups are enabled and in what order. If empty, default groups (e.g. popular / new) may be used.',
      validation: (Rule) =>
        Rule.custom((value) => {
          if (!value || !Array.isArray(value) || value.length === 0) return true
          const enabledTabs = value.filter((t: {enabled?: boolean}) => t?.enabled !== false)
          if (enabledTabs.length === 0) return 'Enable at least one tab (or leave this list empty).'
          const keys = value.map((t: {key?: string}) => t?.key).filter(Boolean) as string[]
          const uniq = new Set(keys)
          if (uniq.size !== keys.length) return 'Tab keys must be unique.'
          return true
        }),
    }),
    defineField({
      name: 'mode',
      title: 'Content mode',
      type: 'string',
      group: 'data',
      options: {
        list: [
          {title: 'Auto (featured/popular)', value: 'auto'},
          {title: 'Selected properties', value: 'selected'},
        ],
        layout: 'radio',
      },
      initialValue: 'auto',
      description:
        'Auto: featured or popular properties from the catalog. Selected: pick properties in the list below.',
    }),
    defineField({
      name: 'limit',
      title: 'Limit',
      type: 'number',
      group: 'data',
      description: 'Optional maximum number of items for this section.',
      validation: (Rule) => Rule.min(1).max(100),
    }),
    defineField({
      name: 'sort',
      title: 'Sort',
      type: 'string',
      group: 'data',
      options: {
        list: [
          {title: 'Newest', value: 'newest'},
          {title: 'Price: Low to High', value: 'priceAsc'},
          {title: 'Price: High to Low', value: 'priceDesc'},
          {title: 'Popular', value: 'popular'},
        ],
      },
      description: 'Optional sort when using auto mode (top-level).',
    }),
    defineField({
      name: 'autoMode',
      title: 'Auto mode settings',
      type: 'object',
      group: 'data',
      hidden: ({parent}) => parent?.mode !== 'auto',
      description: 'Optional overrides when Content mode = Auto.',
      fields: [
        defineField({
          name: 'limit',
          title: 'Limit',
          type: 'number',
          description: 'Maximum properties to show in auto mode.',
          validation: (Rule) => Rule.min(1).max(100),
        }),
        defineField({
          name: 'sort',
          title: 'Sort',
          type: 'string',
          options: {
            list: [
              {title: 'Newest', value: 'newest'},
              {title: 'Price: Low to High', value: 'priceAsc'},
              {title: 'Price: High to Low', value: 'priceDesc'},
              {title: 'Popular', value: 'popular'},
            ],
          },
          description: 'Sort used in auto mode.',
        }),
      ],
    }),
    defineField({
      name: 'properties',
      title: 'Selected properties',
      type: 'array',
      group: 'data',
      of: [defineArrayMember({type: 'reference', to: [{type: 'property'}]})],
      hidden: ({parent}) => parent?.mode !== 'selected',
      description: 'When mode is Selected, add at least one property. Order here is the display order.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {mode?: string} | undefined
          if (parent?.mode !== 'selected') return true
          if (!value || !Array.isArray(value) || value.length === 0) {
            return 'Add at least one property when mode is Selected.'
          }
          return true
        }),
    }),
  ],
  preview: {
    select: {title: 'title.en', mode: 'mode', enabled: 'enabled', properties: 'properties'},
    prepare({
      title,
      mode,
      enabled,
      properties,
    }: {
      title?: string
      mode?: string
      enabled?: boolean
      properties?: unknown[]
    }) {
      const status = enabled === false ? ' (hidden)' : ''
      const n = Array.isArray(properties) ? properties.length : 0
      const modeLabel = mode === 'selected' ? `Selected · ${n} props` : 'Auto'
      return {title: (title || 'Properties') + status, subtitle: modeLabel}
    },
  },
})
