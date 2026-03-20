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
