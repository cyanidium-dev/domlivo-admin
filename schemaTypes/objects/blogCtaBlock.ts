import {defineType, defineField} from 'sanity'

/**
 * Button / CTA block for blog article content.
 * Uses existing `localizedCtaLink` for label+href per locale.
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
      description: 'Select how this CTA should look on the page.',
    }),
    defineField({
      name: 'cta',
      title: 'Button text & link',
      type: 'localizedCtaLink',
      validation: (Rule: any) => Rule.required(),
      description: 'Localized label and destination URL.',
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

