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
      validation: (Rule: any) => Rule.required(),
      description: 'URL path. Generated from English title.',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      group: 'basic',
      validation: (Rule: any) => Rule.required(),
      description: 'Publication date. Used for sorting and display.',
    }),

    // --- Content (localized) ---
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      group: 'content',
      validation: (Rule: any) =>
        Rule.required().custom((value: any) => {
          const en = (value as {en?: string} | undefined)?.en
          return String(en || '').trim() ? true : 'English title is required.'
        }),
      description: 'Article headline per language.',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'localizedString',
      group: 'content',
      description: 'Optional secondary heading shown under the article title.',
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
      validation: (Rule: any) =>
        Rule.required().custom((value: any) => {
          const en = (value as {en?: unknown[]} | undefined)?.en
          return Array.isArray(en) && en.length > 0 ? true : 'English article body is required.'
        }),
      description:
        'Main article content per language. Add paragraphs, headings, lists, images, tables, FAQ blocks, callouts, buttons, recommended-articles blocks, and real-estate embeds for each locale.',
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
      validation: (Rule: any) =>
        Rule.custom((value: any) => {
          if (!value || typeof value !== 'object') return true
          const hasAsset = Boolean((value as {asset?: unknown}).asset)
          const alt = (value as {alt?: string}).alt
          if (!hasAsset) return true
          return String(alt || '').trim() ? true : 'Add alternative text for the cover image.'
        }),
      description: 'Main image for the article. Used in cards and Open Graph.',
    }),

    // --- Categorization ---
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      group: 'categorization',
      of: [{type: 'reference', to: [{type: 'blogCategory'}]}],
      validation: (Rule: any) => Rule.required().min(1).max(3).error('Select 1 to 3 categories.'),
      description: 'Assign one or more categories.',
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      group: 'categorization',
      to: [{type: 'blogAuthor'}],
      validation: (Rule: any) => Rule.required(),
      description: 'Primary author profile for byline and author pages.',
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
      description: 'Legacy fallback author name. Prefer Author reference field.',
    }),
    defineField({
      name: 'authorRole',
      title: 'Author role',
      type: 'string',
      group: 'categorization',
      description: 'Legacy fallback author role. Prefer Author reference field.',
    }),
    defineField({
      name: 'authorImage',
      title: 'Author photo',
      type: 'image',
      group: 'categorization',
      options: {hotspot: true},
      description: 'Legacy fallback author image. Prefer Author reference field.',
    }),
    defineField({
      name: 'relatedPosts',
      title: 'Related posts',
      type: 'array',
      group: 'categorization',
      of: [{type: 'reference', to: [{type: 'blogPost'}]}],
      description: 'Suggest related articles.',
      validation: (Rule: any) =>
        Rule.max(6).custom((value: any, context: any) => {
          if (!Array.isArray(value)) return true
          const currentId = context.document?._id
          const hasSelfReference = value.some((item) => {
            const ref = (item as {_ref?: string} | undefined)?._ref
            if (!ref || !currentId) return false
            const publishedId = currentId.replace(/^drafts\./, '')
            const draftId = `drafts.${publishedId}`
            return ref === currentId || ref === publishedId || ref === draftId
          })
          return hasSelfReference ? 'A post cannot reference itself as related.' : true
        }),
    }),
    defineField({
      name: 'relatedProperties',
      title: 'Related properties',
      type: 'array',
      group: 'categorization',
      of: [{type: 'reference', to: [{type: 'property'}]}],
      validation: (Rule: any) => Rule.max(3),
      description: 'Optional recommended properties shown under the article.',
    }),

    // --- SEO ---
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'localizedSeo',
      group: 'seo',
      validation: (Rule: any) =>
        Rule.custom((value: any, context: any) => {
          const doc = context.document as {publishedAt?: string} | undefined
          if (!doc?.publishedAt) return true
          const seo = (value as {metaTitle?: {en?: string}; metaDescription?: {en?: string}} | undefined) || {}
          const hasTitle = String(seo.metaTitle?.en || '').trim().length > 0
          const hasDescription = String(seo.metaDescription?.en || '').trim().length > 0
          if (!hasTitle || !hasDescription) {
            return 'For published posts, SEO requires English meta title and meta description.'
          }
          return true
        }),
      description: 'Meta title, description, Open Graph per language.',
    }),
  ],

  preview: {
    select: {
      titleEn: 'title.en',
      titleSq: 'title.sq',
      subtitleEn: 'subtitle.en',
      slug: 'slug.current',
      publishedAt: 'publishedAt',
      featured: 'featured',
      categoryTitle: 'categories.0->title.en',
      authorName: 'author.name',
      legacyAuthorName: 'authorName',
      media: 'coverImage',
    },
    prepare(selection: any) {
      const {
        titleEn,
        titleSq,
        subtitleEn,
        slug,
        publishedAt,
        featured,
        categoryTitle,
        authorName,
        legacyAuthorName,
        media,
      } = selection
      const title = titleEn || titleSq || 'Untitled'
      const parts = [slug || 'no-slug']
      if (categoryTitle) parts.push(categoryTitle)
      if (authorName || legacyAuthorName) parts.push(authorName || legacyAuthorName)
      if (featured) parts.push('★ Featured')
      if (publishedAt) {
        const d = new Date(publishedAt)
        parts.push(d.toLocaleDateString())
      }
      return {
        title: subtitleEn ? `${title}: ${subtitleEn}` : title,
        subtitle: parts.join(' · '),
        media,
      }
    },
  },
})
