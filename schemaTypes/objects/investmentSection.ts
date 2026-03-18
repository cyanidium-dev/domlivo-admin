import {defineType, defineField, defineArrayMember} from 'sanity'

export const investmentSection = defineType({
  name: 'investmentSection',
  title: 'Investment Section',
  type: 'object',
  fields: [
    defineField({name: 'enabled', title: 'Enabled / Visible', type: 'boolean', initialValue: true}),
    defineField({name: 'title', title: 'Section Title', type: 'localizedString'}),
    defineField({name: 'description', title: 'Description', type: 'localizedText'}),
    defineField({
      name: 'benefits',
      title: 'Benefits (up to 3)',
      type: 'array',
      of: [defineArrayMember({type: 'localizedString'})],
      validation: (Rule) => Rule.max(3),
    }),
    defineField({name: 'cta', title: 'CTA', type: 'localizedCtaLink'}),
    defineField({
      name: 'primaryImage',
      title: 'Primary Image',
      type: 'image',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alternative text', description: 'For accessibility'}],
    }),
    defineField({
      name: 'secondaryImage',
      title: 'Secondary Image',
      type: 'image',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alternative text', description: 'For accessibility'}],
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled'},
    prepare({title, enabled}: {title?: string; enabled?: boolean}) {
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'Investment') + status, subtitle: 'Investment section'}
    },
  },
})

