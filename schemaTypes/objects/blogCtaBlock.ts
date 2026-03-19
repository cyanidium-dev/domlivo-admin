import {defineType, defineField} from 'sanity'

/**
 * Button / CTA block for blog article content.
 * Uses existing `localizedCtaLink` for label+href per locale.
 */
export const blogCtaBlock = defineType({
  name: 'blogCtaBlock',
  title: 'Button block',
  type: 'object',

  fields: [
    defineField({
      name: 'variant',
      title: 'Style variant',
      type: 'string',
      options: {
        list: [
          {title: 'Primary', value: 'primary'},
          {title: 'Secondary', value: 'secondary'},
          {title: 'Link', value: 'link'},
        ],
        layout: 'radio',
      },
      initialValue: 'primary',
      validation: (Rule: any) => Rule.required(),
      description: 'Visual style hint for the frontend.',
    }),
    defineField({
      name: 'cta',
      title: 'Button',
      type: 'localizedCtaLink',
      validation: (Rule: any) => Rule.required(),
      description: 'Button label and destination URL (localized label).',
    }),
  ],

  preview: {
    select: {
      variant: 'variant',
      labelEn: 'cta.label.en',
      href: 'cta.href',
    },
    prepare({variant, labelEn, href}: {variant?: string; labelEn?: string; href?: string}) {
      return {
        title: labelEn || href || 'CTA',
        subtitle: variant ? `Button (${variant})` : 'Button',
      }
    },
  },
})

