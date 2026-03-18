import {defineType, defineField, defineArrayMember} from 'sanity'

export const aboutSection = defineType({
  name: 'aboutSection',
  title: 'About / Why Choose Us',
  type: 'object',
  fields: [
    defineField({name: 'enabled', title: 'Enabled / Visible', type: 'boolean', initialValue: true}),
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
    select: {title: 'title.en', enabled: 'enabled'},
    prepare({title, enabled}: {title?: string; enabled?: boolean}) {
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'About') + status, subtitle: 'About / Why choose us'}
    },
  },
})

