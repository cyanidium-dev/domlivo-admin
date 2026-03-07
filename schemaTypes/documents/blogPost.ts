import {defineType, defineField} from 'sanity'

/**
 * Blog post: one document per article, field-level i18n.
 * No document-level language field; no duplicate docs per language.
 */
export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',

  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'categorization', title: 'Categorization'},
    {name: 'seo', title: 'SEO'},
  ],

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'localizedSlug',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'localizedText',
      group: 'content',
      rows: 3,
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      group: 'content',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      group: 'content',
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      group: 'categorization',
      of: [{type: 'reference', to: [{type: 'blogCategory'}]}],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'localizedSeo',
      group: 'seo',
    }),
  ],

  preview: {
    select: {
      titleEn: 'title.en',
      titleSq: 'title.sq',
      slugEn: 'slug.en',
      slugSq: 'slug.sq',
      media: 'seo.ogImage',
    },
    prepare(selection) {
      const title = selection.titleEn || selection.titleSq || 'Untitled'
      const slug = selection.slugEn || selection.slugSq || 'no-slug'
      return {title, subtitle: slug, media: selection.media}
    },
  },
})
