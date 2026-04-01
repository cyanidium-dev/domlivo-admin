import {defineType, defineField} from 'sanity'

export const localizedSeo = defineType({
  name: 'localizedSeo',
  title: 'Localized SEO',
  type: 'object',

  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'localizedString',
      description: 'Recommended: up to 60 characters per language.',
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'localizedText',
      description: 'Recommended: up to 160 characters per language.',
    }),
    defineField({
      name: 'keywords',
      title: 'Keywords (optional)',
      type: 'localizedString',
      description: 'Optional comma-separated keywords per language.',
    }),
    defineField({
      name: 'ogTitle',
      title: 'Open Graph Title',
      type: 'localizedString',
      description: 'Title when shared on social media.',
    }),
    defineField({
      name: 'ogDescription',
      title: 'Open Graph Description',
      type: 'localizedText',
      description: 'Description when shared on social media.',
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph Image',
      type: 'image',
      options: {hotspot: true},
      description: 'Shared image for all languages. Recommended: 1200×630 px.',
      fields: [
        {name: 'alt', type: 'string', title: 'Alternative text', description: 'For accessibility and SEO'},
      ],
    }),
    defineField({
      name: 'canonicalUrl',
      title: 'Canonical URL (optional)',
      type: 'url',
      description:
        'Optional canonical override. Usually frontend can compute canonical from route; use only when needed.',
    }),
    defineField({
      name: 'noIndex',
      title: 'No Index',
      type: 'boolean',
      initialValue: false,
      description: 'When enabled, search engines will be asked not to index this page.',
    }),
    defineField({
      name: 'noFollow',
      title: 'No Follow (optional)',
      type: 'boolean',
      initialValue: false,
      description: 'When enabled, search engines will be asked not to follow links on this page.',
    }),
  ],
})
