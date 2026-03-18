import {defineType, defineField} from 'sanity'

export const cityRichDescriptionSection = defineType({
  name: 'cityRichDescriptionSection',
  title: 'City Description (with video)',
  type: 'object',
  fields: [
    defineField({name: 'enabled', title: 'Enabled / Visible', type: 'boolean', initialValue: true}),
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'string',
      description: 'Optional YouTube/Vimeo URL for the city/district video.',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'localizedText',
      description: 'Main city description text per locale.',
    }),
    defineField({name: 'cta', title: 'CTA', type: 'localizedCtaLink'}),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled'},
    prepare({title, enabled}: {title?: string; enabled?: boolean}) {
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'City description') + status}
    },
  },
})

