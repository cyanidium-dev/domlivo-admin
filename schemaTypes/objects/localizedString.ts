import {defineType, defineField} from 'sanity'

export const localizedString = defineType({
  name: 'localizedString',
  title: 'Localized String',
  type: 'object',

  fields: [
    defineField({name: 'en', title: 'English', type: 'string'}),
    defineField({name: 'ru', title: 'Russian', type: 'string'}),
    defineField({name: 'uk', title: 'Ukrainian', type: 'string'}),
    defineField({name: 'sq', title: 'Albanian', type: 'string'}),
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
