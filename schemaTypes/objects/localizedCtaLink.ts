import {defineType, defineField} from 'sanity'

export const localizedCtaLink = defineType({
  name: 'localizedCtaLink',
  title: 'Call to action',
  type: 'object',

  fields: [
    defineField({
      name: 'href',
      title: 'Link destination',
      type: 'string',
      validation: (Rule) =>
        Rule.required().custom((value: string) => {
          if (!value || typeof value !== 'string') return true
          const v = value.trim()
          if (!v) return 'Link destination is required.'
          if (
            v.startsWith('/') ||
            v.startsWith('http://') ||
            v.startsWith('https://') ||
            v.startsWith('mailto:') ||
            v.startsWith('tel:')
          )
            return true
          return 'Use a relative path (e.g. /properties), full URL (https://...), mailto:, or tel:.'
        }),
      description:
        'Relative path (e.g. /properties), full URL (https://...), mailto:, or tel:. Must start with /, http, https, mailto:, or tel:.',
    }),
    defineField({
      name: 'label',
      title: 'Button text',
      type: 'localizedString',
      validation: (Rule) =>
        Rule.required().custom((value: any) => {
          const en = (value as {en?: string} | undefined)?.en
          return String(en || '').trim() ? true : 'Add at least the English button text.'
        }),
      description: 'Button or link label per language. English is required.',
    }),
  ],

  preview: {
    select: {href: 'href', lEn: 'label.en', lSq: 'label.sq'},
    prepare({href, lEn, lSq}: {href?: string; lEn?: string; lSq?: string}) {
      return {title: lEn || lSq || href || 'CTA', subtitle: href}
    },
  },
})
