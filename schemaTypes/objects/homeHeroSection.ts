import {defineType, defineField} from 'sanity'

export const homeHeroSection = defineType({
  name: 'homeHeroSection',
  title: 'Hero',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'H1 / Title', type: 'localizedString', validation: (Rule) => Rule.required()}),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'localizedText'}),
    defineField({name: 'shortLine', title: 'Short Trust Line', type: 'localizedString'}),
    defineField({
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'image',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alternative text', description: 'For accessibility'}],
    }),
    defineField({name: 'cta', title: 'CTA', type: 'localizedCtaLink'}),
  ],
  preview: {
    select: {title: 'title.en'},
    prepare({title}: {title?: string}) {
      return {title: title || 'Hero', subtitle: 'Hero section'}
    },
  },
})
