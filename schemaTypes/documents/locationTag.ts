import {defineType, defineField} from 'sanity'

export const locationTag = defineType({
  name: 'locationTag',
  title: 'Location Tag',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'description',
      type: 'text',
    }),

    defineField({
      name: 'active',
      type: 'boolean',
      title: 'Active',
      initialValue: true,
    }),
  ],

  preview: {
    select: {
      title: 'title',
    },
    prepare(selection) {
      return {title: selection.title}
    },
  },
})
