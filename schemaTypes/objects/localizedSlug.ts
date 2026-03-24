import {defineType, defineField} from 'sanity'

/**
 * Legacy type: kept for dataset compatibility. No current document fields use this type
 * (URLs use single `slug`). No bulk paste helper — slugs need per-locale URL safety rules.
 */
export const localizedSlug = defineType({
  name: 'localizedSlug',
  title: 'Localized Slug',
  type: 'object',

  fields: [
    defineField({name: 'en', title: 'English', type: 'string'}),
    defineField({name: 'uk', title: 'Ukrainian', type: 'string'}),
    defineField({name: 'ru', title: 'Russian', type: 'string'}),
    defineField({name: 'sq', title: 'Albanian', type: 'string'}),
    defineField({name: 'it', title: 'Italian', type: 'string'}),
  ],

  preview: {
    select: {en: 'en', uk: 'uk', ru: 'ru', sq: 'sq', it: 'it'},
    prepare({en, uk, ru, sq, it}: {en?: string; uk?: string; ru?: string; sq?: string; it?: string}) {
      const title = en || uk || ru || sq || it || 'No slug'
      return {title}
    },
  },
})
