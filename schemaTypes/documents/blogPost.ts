import {defineType, defineField} from 'sanity'

/**
 * Blog post: full-featured SEO article.
 * All content fields (title, excerpt, body) are localized (en, sq, ru, uk).
 */
export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',

  groups: [
    {name: 'basic', title: 'Basic', default: true},
    {name: 'content', title: 'Content'},
    {name: 'media', title: 'Media'},
    {name: 'categorization', title: 'Categorization'},
    {name: 'seo', title: 'SEO'},
  ],

  fields: [
    // --- Basic ---
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
      description: 'URL path. Generated from English title.',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      group: 'basic',
      description: 'Publication date. Used for sorting and display.',
    }),

    // --- Content (localized) ---
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      group: 'content',
      validation: (Rule) => Rule.required(),
      description: 'Article headline per language.',
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'localizedText',
      group: 'content',
      rows: 3,
      description: 'Short summary per language for cards and meta descriptions.',
    }),
    defineField({
      name: 'content',
      title: 'Article body',
      type: 'localizedBlockContent',
      group: 'content',
      description: 'Main article content per language. Add paragraphs, headings, lists, images, tables, FAQ blocks, and callouts for each locale.',
    }),

    // --- Media ---
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      group: 'media',
      options: {hotspot: true},
      fields: [
        {name: 'alt', type: 'string', title: 'Alternative text'},
        {name: 'caption', type: 'string', title: 'Caption'},
      ],
      description: 'Main image for the article. Used in cards and Open Graph.',
    }),

    // --- Categorization ---
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      group: 'categorization',
      of: [{type: 'reference', to: [{type: 'blogCategory'}]}],
      description: 'Assign one or more categories.',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      group: 'categorization',
      initialValue: false,
      description: 'Highlight this post on the blog homepage.',
    }),
    defineField({
      name: 'authorName',
      title: 'Author name',
      type: 'string',
      group: 'categorization',
      description: 'Display name for byline and SEO.',
    }),
    defineField({
      name: 'authorRole',
      title: 'Author role',
      type: 'string',
      group: 'categorization',
      description: 'Optional title (e.g. "Real Estate Advisor").',
    }),
    defineField({
      name: 'authorImage',
      title: 'Author photo',
      type: 'image',
      group: 'categorization',
      options: {hotspot: true},
      description: 'Optional author image.',
    }),
    defineField({
      name: 'relatedPosts',
      title: 'Related posts',
      type: 'array',
      group: 'categorization',
      of: [{type: 'reference', to: [{type: 'blogPost'}]}],
      description: 'Suggest related articles.',
      validation: (Rule) => Rule.max(6),
    }),

    // --- SEO ---
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'localizedSeo',
      group: 'seo',
      description: 'Meta title, description, Open Graph per language.',
    }),
  ],

  preview: {
    select: {
      titleEn: 'title.en',
      titleSq: 'title.sq',
      slug: 'slug.current',
      publishedAt: 'publishedAt',
      featured: 'featured',
      categoryTitle: 'categories.0->title.en',
    },
    prepare(selection) {
      const {titleEn, titleSq, slug, publishedAt, featured, categoryTitle} = selection
      const title = titleEn || titleSq || 'Untitled'
      const parts = [slug || 'no-slug']
      if (categoryTitle) parts.push(categoryTitle)
      if (featured) parts.push('★ Featured')
      if (publishedAt) {
        const d = new Date(publishedAt)
        parts.push(d.toLocaleDateString())
      }
      return {
        title,
        subtitle: parts.join(' · '),
      }
    },
  },
})
