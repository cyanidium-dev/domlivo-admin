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
  ],

  preview: {
    select: {
      qEn: 'question.en',
      qSq: 'question.sq',
      qRu: 'question.ru',
      qUk: 'question.uk',
    },
    prepare({qEn, qSq, qRu, qUk}: {qEn?: string; qSq?: string; qRu?: string; qUk?: string}) {
      const title = qEn || qSq || qRu || qUk || 'FAQ Item'
      return {title}
    },
  },
})
