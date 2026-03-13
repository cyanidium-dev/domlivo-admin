import {defineType, defineField, defineArrayMember} from 'sanity'

export const homeAboutSection = defineType({
  name: 'homeAboutSection',
  title: 'About / Why Choose Us',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Section Title', type: 'localizedString'}),
    defineField({name: 'description', title: 'Description', type: 'localizedText'}),
    defineField({
      name: 'benefits',
      title: 'Strength Points (up to 3)',
      type: 'array',
      of: [defineArrayMember({type: 'localizedString'})],
      validation: (Rule) => Rule.max(3),
    }),
  ],
  preview: {
    select: {title: 'title.en'},
    prepare({title}: {title?: string}) {
      return {title: title || 'About', subtitle: 'About / Why choose us'}
    },
  },
})
