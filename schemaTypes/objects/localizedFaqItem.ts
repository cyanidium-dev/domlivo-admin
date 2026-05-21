import {defineType, defineField} from 'sanity'

export const localizedFaqItem = defineType({
  name: 'localizedFaqItem',
  title: 'Localized FAQ Item',
  type: 'object',

  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      type: 'localizedText',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tag',
      title: 'Tag',
      type: 'localizedString',
      description: 'Optional short category chip shown next to the open answer (e.g. "Taxes", "Residency").',
    }),
  ],

  preview: {
    select: {
      qEn: 'question.en',
      qSq: 'question.sq',
      qRu: 'question.ru',
      qUk: 'question.uk',
      qIt: 'question.it',
    },
    prepare({qEn, qSq, qRu, qUk, qIt}: {qEn?: string; qSq?: string; qRu?: string; qUk?: string; qIt?: string}) {
      const title = qEn || qSq || qRu || qUk || qIt || 'FAQ Item'
      return {title}
    },
  },
})
