import {defineType, defineField} from 'sanity'

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',

  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      description: 'Recommended: up to 60 characters. Shown in search results.',
      validation: (Rule) => Rule.max(60).warning('Meta title is best kept under 60 characters'),
    }),

    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      description: 'Recommended: up to 160 characters. Shown in search results.',
      validation: (Rule) => Rule.max(160).warning('Meta description is best kept under 160 characters'),
    }),

    defineField({
      name: 'ogTitle',
      title: 'Open Graph Title',
      type: 'string',
      description: 'Title when shared on social media (e.g. Facebook, LinkedIn).',
    }),

    defineField({
      name: 'ogDescription',
      title: 'Open Graph Description',
      type: 'text',
      rows: 3,
      description: 'Description when shared on social media.',
    }),

    defineField({
      name: 'ogImage',
      title: 'Open Graph Image',
      type: 'image',
      options: {hotspot: true},
      description: 'Image shown when shared on social media. Recommended: 1200×630 px.',
    }),

    defineField({
      name: 'noIndex',
      title: 'No Index',
      type: 'boolean',
      initialValue: false,
      description: 'When enabled, search engines will be asked not to index this page.',
    }),
  ],
})
