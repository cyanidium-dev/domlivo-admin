import {defineType, defineField} from 'sanity'
import {LocalizedPasteTranslationsInput} from '../../components/sanity/LocalizedPasteTranslationsInput'

export const localizedString = defineType({
  name: 'localizedString',
  title: 'Localized String',
  type: 'object',

  components: {
    input: LocalizedPasteTranslationsInput,
  },

  fields: [
    defineField({name: 'en', title: 'English', type: 'string'}),
    defineField({name: 'uk', title: 'Ukrainian', type: 'string'}),
    defineField({name: 'ru', title: 'Russian', type: 'string'}),
    defineField({name: 'sq', title: 'Albanian', type: 'string'}),
    defineField({name: 'it', title: 'Italian', type: 'string'}),
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
