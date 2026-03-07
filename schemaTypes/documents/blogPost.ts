import {defineType, defineField} from 'sanity'
import {languageField} from '../objects'

export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',

  fields: [
    languageField,

    defineField({
      name: 'title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      type: 'slug',
      options: {
        source: 'title',
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'excerpt',
      type: 'text',
      rows: 3,
    }),

    defineField({
      name: 'content',
      type: 'array',
      of: [{type: 'block'}],
    }),

    defineField({
      name: 'publishedAt',
      type: 'datetime',
    }),

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
    }),
  ],
})
