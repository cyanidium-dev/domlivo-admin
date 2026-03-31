import {defineType, defineField} from 'sanity'

export const ctaSection = defineType({
  name: 'ctaSection',
  title: 'CTA',
  type: 'object',
  description: 'Standalone call-to-action block with headline, supporting text, and one button/link.',

  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'action', title: 'Action'},
  ],

  fields: [
    defineField({
      name: 'enabled',
      title: 'Enabled / Visible',
      type: 'boolean',
      group: 'content',
      initialValue: true,
      description: 'If disabled, the frontend should hide this section.',
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
      title: 'Link / button',
      type: 'localizedCtaLink',
      group: 'action',
      validation: (Rule) => Rule.required(),
    }),
  ],

  preview: {
    select: {title: 'title.en', enabled: 'enabled'},
    prepare({title, enabled}: {title?: string; enabled?: boolean}) {
      const status = enabled === false ? ' (hidden)' : ''
      return {
        title: (title || 'CTA') + status,
        subtitle: 'CTA section',
      }
    },
  },
})
