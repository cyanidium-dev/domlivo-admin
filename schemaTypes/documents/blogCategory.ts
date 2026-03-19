import {defineType, defineField} from 'sanity'

/**
 * Blog category for organizing posts.
 * Used for filtering and SEO.
 */
export const blogCategory = defineType({
  name: 'blogCategory',
  title: 'Blog Category',
  type: 'document',
  groups: [
    {name: 'basic', title: 'Basic', default: true},
    {name: 'seo', title: 'SEO'},
  ],

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      group: 'basic',
      validation: (Rule) =>
        Rule.required().custom((value) => {
          const en = (value as {en?: string} | undefined)?.en
          return String(en || '').trim() ? true : 'English title is required.'
        }),
      description: 'Category name (e.g. Guides, Market News).',
    }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      group: 'basic',
      options: {
        source: (doc: Record<string, unknown>) => {
          const t = doc?.title as {en?: string} | undefined
          return t?.en ?? ''
        },
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
      description: 'URL path for category pages.',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'localizedText',
      group: 'basic',
      description: 'Short description for category pages and meta.',
      rows: 3,
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      group: 'basic',
      description: 'Display order (lower numbers first).',
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      group: 'basic',
      initialValue: true,
      description: 'When disabled, category is hidden from filters and listings.',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'localizedSeo',
      group: 'seo',
      description: 'Optional category SEO metadata for category landing pages.',
    }),
  ],

  preview: {
    select: {
      titleEn: 'title.en',
      titleSq: 'title.sq',
      slug: 'slug.current',
      active: 'active',
    },
    prepare(selection) {
      const title = selection.titleEn || selection.titleSq || 'Untitled'
      const sub = [selection.slug || 'no-slug']
      if (selection.active === false) sub.push('inactive')
      return {title, subtitle: sub.join(' · ')}
    },
  },
})
