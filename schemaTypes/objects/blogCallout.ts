import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * Callout / info block for blog posts.
 * Important notes, tips, warnings, summaries.
 */
export const blogCallout = defineType({
  name: 'blogCallout',
  title: 'Callout / Info box',
  type: 'object',

  fields: [
    defineField({
      name: 'variant',
      title: 'Style',
      type: 'string',
      options: {
        list: [
          {title: 'Info', value: 'info'},
          {title: 'Investment tip', value: 'tip'},
          {title: 'Important', value: 'important'},
          {title: 'Warning', value: 'warning'},
          {title: 'Summary', value: 'summary'},
        ],
        layout: 'radio',
      },
      initialValue: 'info',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      description: 'Optional heading for the callout.',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [{type: 'block'}],
      validation: (Rule) => Rule.required(),
      description: 'Callout body text.',
    }),
  ],

  preview: {
    select: {variant: 'variant', title: 'title.en'},
    prepare({variant, title}: {variant?: string; title?: string}) {
      const labels: Record<string, string> = {
        info: 'Info',
        tip: 'Investment tip',
        important: 'Important',
        warning: 'Warning',
        summary: 'Summary',
      }
      return {
        title: title || labels[variant || 'info'] || 'Callout',
        subtitle: `Callout (${labels[variant || 'info'] || variant})`,
      }
    },
  },
})
