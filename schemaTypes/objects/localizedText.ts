import {defineType, defineField} from 'sanity'

export const localizedText = defineType({
  name: 'localizedText',
  title: 'Localized Text',
  type: 'object',

  fields: [
    defineField({name: 'en', title: 'English', type: 'text'}),
    defineField({name: 'ru', title: 'Russian', type: 'text'}),
    defineField({name: 'uk', title: 'Ukrainian', type: 'text'}),
    defineField({name: 'sq', title: 'Albanian', type: 'text'}),
  ],

  preview: {
    select: {
      en: 'en',
      ru: 'ru',
      uk: 'uk',
      sq: 'sq',
    },
    prepare(selection) {
      const {en, ru, uk, sq} = selection
      const title = en || ru || uk || sq || 'No translation'
      return {title}
    },
  },
})
