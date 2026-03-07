import {defineType, defineField} from 'sanity'
import {languageField} from '../objects'

export const city = defineType({
  name: 'city',
  title: 'City',
  type: 'document',

  fields: [
    languageField,

    defineField({
      name: 'title',
      title: 'City name',
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
      name: 'seo',
      title: 'SEO',
      type: 'seo',
    }),
  ],
})
