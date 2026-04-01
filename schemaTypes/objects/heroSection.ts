import {defineType, defineField} from 'sanity'
import {PAGE_BUILDER_GROUPS} from '../constants/pageBuilderGroups'

export const heroSection = defineType({
  name: 'heroSection',
  title: 'Hero',
  type: 'object',
  groups: [...PAGE_BUILDER_GROUPS],
  fields: [
    defineField({
      name: 'enabled',
      title: 'Enabled / Visible',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
      description: 'If disabled, this section is hidden on the site.',
    }),
    defineField({
      name: 'title',
      title: 'H1 / Title',
      type: 'localizedString',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'localizedText', group: 'content'}),
    defineField({name: 'shortLine', title: 'Short trust line', type: 'localizedString', group: 'content'}),
    defineField({
      name: 'cta',
      title: 'Call to action (primary)',
      type: 'localizedCtaLink',
      group: 'content',
      description: 'Optional main button or link.',
    }),
    defineField({
      name: 'secondaryCta',
      title: 'Call to action (secondary)',
      type: 'localizedCtaLink',
      group: 'content',
      description: 'Optional second button next to the primary.',
    }),
    defineField({
      name: 'seoTextUnderCta',
      title: 'Line under CTAs (optional)',
      type: 'localizedString',
      group: 'content',
      description: 'Small line under the buttons (e.g. for SEO).',
    }),
    defineField({
      name: 'search',
      title: 'Hero search',
      type: 'object',
      group: 'layout',
      description: 'Which search categories appear in the hero and in what order.',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Enabled',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'tabs',
          title: 'Tabs / categories',
          type: 'array',
          of: [{type: 'heroSearchTab'}],
          description: 'If empty, site defaults may apply.',
        }),
      ],
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Background image',
      type: 'image',
      group: 'media',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alternative text', description: 'For accessibility'}],
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled'},
    prepare({title, enabled}: {title?: string; enabled?: boolean}) {
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'Hero') + status, subtitle: 'Hero'}
    },
  },
})
