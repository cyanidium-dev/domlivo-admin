import {defineType, defineField} from 'sanity'

export const heroSection = defineType({
  name: 'heroSection',
  title: 'Hero',
  type: 'object',
  fields: [
    defineField({
      name: 'enabled',
      title: 'Enabled / Visible',
      type: 'boolean',
      initialValue: true,
      description: 'If disabled, the frontend should hide this section.',
    }),
    defineField({name: 'title', title: 'H1 / Title', type: 'localizedString', validation: (Rule) => Rule.required()}),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'localizedText'}),
    defineField({name: 'shortLine', title: 'Short Trust Line', type: 'localizedString'}),
    defineField({
      name: 'search',
      title: 'Hero Search',
      type: 'object',
      description:
        'Admin-driven configuration for hero search tabs/categories. Frontend must render only enabled tabs.',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Enabled',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'tabs',
          title: 'Tabs / Categories',
          type: 'array',
          of: [{type: 'heroSearchTab'}],
          description:
            'Defines which categories appear in hero search and their order. If empty, frontend may use its defaults.',
        }),
      ],
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'image',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alternative text', description: 'For accessibility'}],
    }),
    defineField({name: 'cta', title: 'CTA', type: 'localizedCtaLink'}),
    defineField({
      name: 'seoTextUnderCta',
      title: 'SEO Text Under CTA (optional)',
      type: 'localizedString',
      description: 'Small SEO-oriented line under the CTA button.',
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled'},
    prepare({title, enabled}: {title?: string; enabled?: boolean}) {
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'Hero') + status, subtitle: 'Hero section'}
    },
  },
})

