import {defineType, defineField} from 'sanity'

export const localizedCtaLink = defineType({
  name: 'localizedCtaLink',
  title: 'Localized CTA Link',
  type: 'object',

  fields: [
    defineField({
      name: 'href',
      title: 'URL',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
  ],

  preview: {
    select: {href: 'href', lEn: 'label.en', lSq: 'label.sq'},
    prepare({href, lEn, lSq}: {href?: string; lEn?: string; lSq?: string}) {
      return {title: lEn || lSq || href || 'CTA', subtitle: href}
    },
  },
})
