import {defineType, defineField} from 'sanity'

export const homeSeoTextSection = defineType({
  name: 'homeSeoTextSection',
  title: 'SEO Text',
  type: 'object',
  fields: [
    defineField({
      name: 'content',
      title: 'SEO Content',
      type: 'localizedText',
      description: 'Long-form SEO text, typically displayed at bottom of page',
    }),
  ],
  preview: {
    select: {contentEn: 'content.en'},
    prepare({contentEn}: {contentEn?: string}) {
      const snippet = contentEn ? contentEn.slice(0, 50).replace(/\n/g, ' ') + (contentEn.length > 50 ? '…' : '') : ''
      return {title: 'SEO Text', subtitle: snippet || 'Long-form SEO content'}
    },
  },
})
