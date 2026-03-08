import {defineType, defineField} from 'sanity'

/**
 * Location tag (e.g. near beach, city center).
 * Field-level i18n: title, slug, description are localized.
 * Frontend: resolve locationTag.title, locationTag.slug with getLocalizedValue(locale).
 */
export const locationTag = defineType({
  name: 'locationTag',
  title: 'Location Tag',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      options: {
        source: (doc: Record<string, unknown>) => {
          const t = doc?.title as {en?: string} | undefined
          return t?.en ?? ''
        },
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'description',
      title: 'Description',
      type: 'localizedText',
    }),

    defineField({
      name: 'active',
      type: 'boolean',
      title: 'Active',
      initialValue: true,
    }),
  ],

  preview: {
    select: {
      titleEn: 'title.en',
      titleSq: 'title.sq',
      slug: 'slug.current',
    },
    prepare(selection) {
      const title = selection.titleEn || selection.titleSq || 'Untitled'
      return {title, subtitle: selection.slug || 'no-slug'}
    },
  },
})
