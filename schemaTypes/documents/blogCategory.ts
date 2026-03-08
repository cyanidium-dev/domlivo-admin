import {defineType, defineField} from 'sanity'

/**
 * Blog category for organizing posts.
 * Used for filtering and SEO.
 */
export const blogCategory = defineType({
  name: 'blogCategory',
  title: 'Blog Category',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
      description: 'Category name (e.g. Guides, Market News).',
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
      description: 'URL path for category pages.',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'localizedText',
      description: 'Short description for category pages and meta.',
      rows: 3,
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Display order (lower numbers first).',
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
      description: 'When disabled, category is hidden from filters and listings.',
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
