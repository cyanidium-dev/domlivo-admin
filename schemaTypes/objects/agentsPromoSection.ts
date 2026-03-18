import {defineType, defineField, defineArrayMember} from 'sanity'

export const agentsPromoSection = defineType({
  name: 'agentsPromoSection',
  title: 'Agents / Platform Advantages',
  type: 'object',
  fields: [
    defineField({name: 'enabled', title: 'Enabled / Visible', type: 'boolean', initialValue: true}),
    defineField({name: 'title', title: 'Section Title', type: 'localizedString'}),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'localizedText'}),
    defineField({name: 'description', title: 'Description', type: 'localizedText'}),
    defineField({
      name: 'benefits',
      title: 'Benefits (up to 3)',
      type: 'array',
      of: [defineArrayMember({type: 'localizedString'})],
      validation: (Rule) => Rule.max(3),
    }),
    defineField({name: 'cta', title: 'CTA', type: 'localizedCtaLink'}),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled'},
    prepare({title, enabled}: {title?: string; enabled?: boolean}) {
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'Agents') + status, subtitle: 'Platform advantages'}
    },
  },
})

