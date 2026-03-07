import {defineType, defineField} from 'sanity'

export const ctaLink = defineType({
  name: 'ctaLink',
  title: 'CTA Link',
  type: 'object',

  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'href',
      title: 'URL',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
  ],

  preview: {
    select: {
      title: 'label',
      subtitle: 'href',
    },
    prepare(selection) {
      const {title, subtitle} = selection
      return {title, subtitle}
    },
  },
})
