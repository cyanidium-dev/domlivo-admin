import {defineType, defineField, defineArrayMember} from 'sanity'

export const propertyCarouselSection = defineType({
  name: 'propertyCarouselSection',
  title: 'Property Carousel',
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
    defineField({name: 'shortLine', title: 'Short line (optional)', type: 'localizedString'}),
    defineField({name: 'cta', title: 'CTA', type: 'localizedCtaLink'}),
    defineField({
      name: 'tabs',
      title: 'Tabs / Groups',
      type: 'array',
      of: [defineArrayMember({type: 'homePropertyCarouselTab'})],
      description:
        'Configure which tabs are enabled and their order. If empty, the frontend may use its default tabs (popular/new/highDemand).',
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
      title: 'Content Mode',
      type: 'string',
      options: {
        list: [
          {title: 'Auto (featured/popular)', value: 'auto'},
          {title: 'Selected properties', value: 'selected'},
        ],
        layout: 'radio',
      },
      initialValue: 'auto',
      description:
        'Auto: frontend fetches featured/popular properties from API. Selected: use the list below.',
    }),
    defineField({
      name: 'properties',
      title: 'Selected Properties',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'property'}]})],
      hidden: ({parent}) => parent?.mode !== 'selected',
      description: 'When mode is Selected, add at least one property. Frontend will show this exact list.',
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
    select: {title: 'title.en', mode: 'mode', enabled: 'enabled'},
    prepare({title, mode, enabled}: {title?: string; mode?: string; enabled?: boolean}) {
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'Properties') + status, subtitle: mode === 'selected' ? 'Selected' : 'Auto'}
    },
  },
})

