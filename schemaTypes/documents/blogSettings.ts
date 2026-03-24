import {defineType, defineField} from 'sanity'

/**
 * Blog index page configuration.
 * Singleton for /blog listing page hero and SEO.
 */
export const blogSettings = defineType({
  name: 'blogSettings',
  title: 'Blog Settings',
  type: 'document',

  groups: [
    {name: 'hero', title: 'Hero', default: true},
    {name: 'sidebar', title: 'Article sidebar'},
    {name: 'seo', title: 'SEO'},
  ],

  fields: [
    defineField({
      name: 'heroTitle',
      title: 'Hero title',
      type: 'localizedString',
      group: 'hero',
      description: 'Main heading on the blog index page.',
    }),
    defineField({
      name: 'heroDescription',
      title: 'Hero description',
      type: 'localizedText',
      group: 'hero',
      rows: 3,
      description: 'Intro text shown below the hero title on the blog index page.',
    }),
    defineField({
      name: 'relatedPostsSidebarCount',
      title: 'Related posts sidebar count',
      type: 'number',
      group: 'sidebar',
      initialValue: 5,
      validation: (Rule) =>
        Rule.required()
          .integer()
          .min(0)
          .max(50)
          .error('Enter a whole number from 0 to 50.'),
      description:
        'Controls how many related articles appear in the blog article sidebar.\n\nSet to 0 to use the default (5).\n\nRecommended range: 3–5 for standard layouts. Higher values (up to 50) are supported for future layouts but may impact design and performance.\n\nIf fewer manual related posts are selected, the site fills remaining slots from featured posts first, then from the latest posts.',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'localizedSeo',
      group: 'seo',
      description: 'Meta title, description and Open Graph for the /blog index page.',
    }),
  ],

  preview: {
    select: {heroTitle: 'heroTitle.en'},
    prepare({heroTitle}: {heroTitle?: string}) {
      return {
        title: 'Blog Settings',
        subtitle: heroTitle ? `Hero: ${heroTitle}` : 'Blog index page configuration',
      }
    },
  },
})
