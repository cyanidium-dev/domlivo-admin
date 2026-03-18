import {defineType, defineField, defineArrayMember} from 'sanity'

export const propertyTypesSection = defineType({
  name: 'propertyTypesSection',
  title: 'Property Types',
  type: 'object',
  fields: [
    defineField({name: 'enabled', title: 'Enabled / Visible', type: 'boolean', initialValue: true}),
    defineField({name: 'title', title: 'Section Title', type: 'localizedString'}),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'localizedText'}),
    defineField({name: 'cta', title: 'CTA', type: 'localizedCtaLink'}),
    defineField({
      name: 'propertyTypes',
      title: 'Selected Property Types',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'propertyType'}]})],
      description:
        'Empty = show all active property types. Non-empty = show only these types in this order. Frontend fetches all active when empty.',
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled'},
    prepare({title, enabled}: {title?: string; enabled?: boolean}) {
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'Property Types') + status, subtitle: 'Property types grid'}
    },
  },
})

