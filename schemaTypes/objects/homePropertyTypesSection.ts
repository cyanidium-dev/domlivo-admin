import {defineType, defineField, defineArrayMember} from 'sanity'

export const homePropertyTypesSection = defineType({
  name: 'homePropertyTypesSection',
  title: 'Property Types',
  type: 'object',
  fields: [
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
    select: {title: 'title.en'},
    prepare({title}: {title?: string}) {
      return {title: title || 'Property Types', subtitle: 'Property types grid'}
    },
  },
})
