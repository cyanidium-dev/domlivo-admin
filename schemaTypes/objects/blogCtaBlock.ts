import {defineType, defineField} from 'sanity'

/**
 * Button / CTA block for blog article content.
 * Uses localizedCtaLink: href (relative path or full URL) + label (per locale).
 */
export const blogCtaBlock = defineType({
  name: 'blogCtaBlock',
  title: 'CTA button block',
  type: 'object',

  fields: [
    defineField({
      name: 'variant',
      title: 'Button style',
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
      description: 'Visual style of the button on the page.',
    }),
    defineField({
      name: 'cta',
      title: 'Link destination & button text',
      type: 'localizedCtaLink',
      validation: (Rule: any) => Rule.required(),
      description:
        'Set the link URL (e.g. /catalog or https://...) and the button text per language. English text is required.',
    }),
  ],

  preview: {
    select: {
      variant: 'variant',
      labelEn: 'cta.label.en',
      href: 'cta.href',
    },
    prepare({variant, labelEn, href}: {variant?: string; labelEn?: string; href?: string}) {
      const variantLabel =
        variant === 'primary' ? 'Primary' : variant === 'secondary' ? 'Secondary' : variant === 'link' ? 'Link' : ''
      const buttonText = labelEn || href || 'CTA'
      const buttonVariant = variantLabel || variant || 'Primary'
      return {
        title: buttonText,
        subtitle: buttonVariant,
      }
    },
  },
})

