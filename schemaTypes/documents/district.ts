import {defineType, defineField} from 'sanity'
import {languageField} from '../objects'

export const district = defineType({
  name: 'district',
  title: 'District',
  type: 'document',

  fields: [
    languageField,

    defineField({
      name: 'title',
      title: 'District name',
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
      name: 'city',
      type: 'reference',
      to: [{type: 'city'}],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
    }),
  ],
})
