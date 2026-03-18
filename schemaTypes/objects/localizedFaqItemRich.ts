import {defineType, defineField} from 'sanity'

export const localizedFaqItemRich = defineType({
  name: 'localizedFaqItemRich',
  title: 'Localized FAQ Item (Rich Answer)',
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
      title: 'Answer (rich)',
      type: 'localizedBlockContent',
      validation: (Rule) => Rule.required(),
      description: 'Supports inline links and rich blocks.',
    }),
    defineField({
      name: 'cta',
      title: 'Optional CTA',
      type: 'localizedCtaLink',
      description: 'Optional button/link shown under the answer.',
    }),
  ],
  preview: {
    select: {qEn: 'question.en', qSq: 'question.sq', qUk: 'question.uk', qRu: 'question.ru', qIt: 'question.it'},
    prepare({qEn, qSq, qUk, qRu, qIt}: {qEn?: string; qSq?: string; qUk?: string; qRu?: string; qIt?: string}) {
      return {title: qEn || qSq || qUk || qRu || qIt || 'FAQ Item'}
    },
  },
})

