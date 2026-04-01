import {defineType, defineField, defineArrayMember} from 'sanity'

export const landingCarouselSection = defineType({
  name: 'landingCarouselSection',
  title: 'Landing Pages Carousel',
  type: 'object',
  fields: [
    defineField({
      name: 'enabled',
      title: 'Enabled / Visible',
      type: 'boolean',
      initialValue: true,
      description: 'If disabled, the frontend should hide this section.',
    }),
    defineField({name: 'title', title: 'Section Title', type: 'localizedString'}),
    defineField({name: 'subtitle', title: 'Subtitle / Description', type: 'localizedText'}),
    defineField({name: 'cta', title: 'CTA', type: 'localizedCtaLink'}),
    defineField({
      name: 'mode',
      title: 'Content Mode',
      type: 'string',
      options: {
        list: [{title: 'Manual', value: 'manual'}],
        layout: 'radio',
      },
      initialValue: 'manual',
      description: 'Manual: editors select specific landing pages and their order.',
    }),
    defineField({
      name: 'items',
      title: 'Landing Pages',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'landingPage'}]})],
      description: 'Frontend should render this exact order.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {mode?: string} | undefined
          if (parent?.mode !== 'manual') return true
          const items = Array.isArray(value) ? value : []
          if (items.length === 0) return 'Add at least one landing page.'
          return true
        }),
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled', count: 'items.length'},
    prepare({title, enabled, count}: {title?: string; enabled?: boolean; count?: number}) {
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'Landing carousel') + status, subtitle: `${count || 0} items`}
    },
  },
})

