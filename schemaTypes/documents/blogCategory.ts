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
      title: 'Category name',
      type: 'localizedString',
      group: 'basic',
      validation: (Rule: any) =>
        Rule.required().custom((value: any) => {
          const en = (value as {en?: string} | undefined)?.en
          return String(en || '').trim() ? true : 'English title is required.'
        }),
      description: 'Name editors use in the blog category list (e.g. Guides, Market News).',
    }),
    defineField({
      name: 'slug',
      title: 'Category URL slug',
      type: 'slug',
      group: 'basic',
      options: {
        source: (doc: Record<string, unknown>) => {
          const t = doc?.title as {en?: string} | undefined
          return t?.en ?? ''
        },
        maxLength: 96,
      },
      validation: (Rule: any) => Rule.required(),
      description: 'Used in the category page URL.',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'localizedText',
      group: 'basic',
      description: 'Short category text shown on category pages and used for meta.',
      rows: 3,
    }),
    defineField({
      name: 'order',
      title: 'Sort order',
      type: 'number',
      group: 'basic',
      description: 'Controls where this category appears (lower numbers first).',
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      group: 'basic',
      initialValue: true,
      description: 'When disabled, this category is hidden from blog filters and listings.',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'localizedSeo',
      group: 'seo',
      description: 'Optional meta and Open Graph (Google search + social sharing) per language.',
    }),
  ],

  preview: {
    select: {
      titleEn: 'title.en',
      titleSq: 'title.sq',
      active: 'active',
      order: 'order',
    },
    prepare(selection: any) {
      const title = selection.titleEn || selection.titleSq || 'Untitled'
      const status = selection.active === false ? 'Inactive' : 'Active'
      const orderPart = selection.order != null ? `Order ${selection.order}` : ''
      return {title, subtitle: [status, orderPart].filter(Boolean).join(' · ')}
    },
  },
})
