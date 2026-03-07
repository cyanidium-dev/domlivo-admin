import {defineType, defineField} from 'sanity'

export const localizedSlug = defineType({
  name: 'localizedSlug',
  title: 'Localized Slug',
  type: 'object',

  fields: [
    defineField({name: 'sq', title: 'Albanian', type: 'string'}),
    defineField({name: 'en', title: 'English', type: 'string'}),
    defineField({name: 'ru', title: 'Russian', type: 'string'}),
    defineField({name: 'uk', title: 'Ukrainian', type: 'string'}),
  ],

  preview: {
    select: {en: 'en', sq: 'sq', ru: 'ru', uk: 'uk'},
    prepare({en, sq, ru, uk}: {en?: string; sq?: string; ru?: string; uk?: string}) {
      const title = en || sq || ru || uk || 'No slug'
      return {title}
    },
  },
})
