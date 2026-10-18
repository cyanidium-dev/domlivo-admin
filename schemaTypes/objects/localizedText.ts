import type {ComponentType} from 'react'
import {defineType, defineField, type ObjectInputProps} from 'sanity'
import {LocalizedPasteTranslationsInput} from '../../components/sanity/LocalizedPasteTranslationsInput'

export const localizedText = defineType({
  name: 'localizedText',
  title: 'Localized Text',
  type: 'object',

  components: {
    input: LocalizedPasteTranslationsInput as unknown as ComponentType<ObjectInputProps>,
  },

  fields: [
    defineField({name: 'en', title: 'English', type: 'text'}),
    defineField({name: 'uk', title: 'Ukrainian', type: 'text'}),
    defineField({name: 'ru', title: 'Russian', type: 'text'}),
    defineField({name: 'sq', title: 'Albanian', type: 'text'}),
    defineField({name: 'it', title: 'Italian', type: 'text'}),
    defineField({name: 'pl', title: 'Polish', type: 'text'}),
    defineField({name: 'de', title: 'German', type: 'text'}),
  ],

  preview: {
    select: {
      en: 'en',
      uk: 'uk',
      ru: 'ru',
      sq: 'sq',
      it: 'it',
      pl: 'pl',
      de: 'de',
    },
    prepare(selection) {
      const {en, uk, ru, sq, it, pl, de} = selection
      const title = en || uk || ru || sq || it || pl || de || 'No translation'
      return {title}
    },
  },
})
