import {defineType, defineField} from 'sanity'

export const blogCategory = defineType({
  name: 'blogCategory',
  title: 'Blog Category',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'localizedSlug',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'localizedText',
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Display order (lower numbers first).',
    }),
  ],

  preview: {
    select: {
      titleEn: 'title.en',
      titleSq: 'title.sq',
      slugEn: 'slug.en',
      slugSq: 'slug.sq',
    },
    prepare(selection) {
      const title = selection.titleEn || selection.titleSq || 'Untitled'
      const slug = selection.slugEn || selection.slugSq || 'no-slug'
      return {title, subtitle: slug}
    },
  },
})
