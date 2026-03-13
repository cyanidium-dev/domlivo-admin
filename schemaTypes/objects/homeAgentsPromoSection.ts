import {defineType, defineField, defineArrayMember} from 'sanity'

export const homeAgentsPromoSection = defineType({
  name: 'homeAgentsPromoSection',
  title: 'Agent / Agency Advantages',
  type: 'object',
  fields: [
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
    select: {title: 'title.en'},
    prepare({title}: {title?: string}) {
      return {title: title || 'Agents', subtitle: 'Agent platform advantages'}
    },
  },
})
