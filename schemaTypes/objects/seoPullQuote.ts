import {defineType, defineField} from 'sanity'

/**
 * Pull-quote block shown inside the SEO editorial layout.
 */
export const seoPullQuote = defineType({
  name: 'seoPullQuote',
  title: 'SEO pull quote',
  type: 'object',
  fields: [
    defineField({
      name: 'text',
      title: 'Quote text',
      type: 'localizedText',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Quote attribution (optional)',
      type: 'localizedString',
    }),
  ],
  preview: {
    select: {text: 'text.en', author: 'author.en'},
    prepare({text, author}: {text?: string; author?: string}) {
      const t = String(text || '').trim()
      const truncated = t.length > 60 ? `${t.slice(0, 59)}…` : t
      return {title: truncated || 'Quote', subtitle: author || ''}
    },
  },
})
