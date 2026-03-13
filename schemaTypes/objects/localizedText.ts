import {defineType, defineField} from 'sanity'

export const localizedText = defineType({
  name: 'localizedText',
  title: 'Localized Text',
  type: 'object',

  fields: [
    defineField({name: 'en', title: 'English', type: 'text'}),
    defineField({name: 'uk', title: 'Ukrainian', type: 'text'}),
    defineField({name: 'ru', title: 'Russian', type: 'text'}),
    defineField({name: 'sq', title: 'Albanian', type: 'text'}),
    defineField({name: 'it', title: 'Italian', type: 'text'}),
  ],

  preview: {
    select: {
      en: 'en',
      uk: 'uk',
      ru: 'ru',
      sq: 'sq',
      it: 'it',
    },
    prepare(selection) {
      const {en, uk, ru, sq, it} = selection
      const title = en || uk || ru || sq || it || 'No translation'
      return {title}
    },
  },
})
