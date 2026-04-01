import {defineType, defineField} from 'sanity'
import {PAGE_BUILDER_GROUPS} from '../constants/pageBuilderGroups'

export const ctaSection = defineType({
  name: 'ctaSection',
  title: 'Call to action',
  type: 'object',
  description: 'Headline, supporting text, and one or two buttons or links.',

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
      name: 'eyebrow',
      title: 'Eyebrow (optional)',
      type: 'localizedString',
      group: 'content',
      description: 'Small line above the title.',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description (optional)',
      type: 'localizedText',
      group: 'content',
      description: 'Supporting copy under the title.',
    }),
    defineField({
      name: 'cta',
      title: 'Call to action (primary)',
      type: 'localizedCtaLink',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'secondaryCta',
      title: 'Call to action (secondary)',
      type: 'localizedCtaLink',
      group: 'content',
      description: 'Optional second button next to the primary.',
    }),
  ],

  preview: {
    select: {title: 'title.en', enabled: 'enabled'},
    prepare({title, enabled}: {title?: string; enabled?: boolean}) {
      const status = enabled === false ? ' (hidden)' : ''
      return {
        title: (title || 'CTA') + status,
        subtitle: 'Call to action',
      }
    },
  },
})
