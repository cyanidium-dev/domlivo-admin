import {defineType, defineField} from 'sanity'

/**
 * Blog post: full-featured SEO article.
 * All content fields (title, excerpt, body) are localized (en, uk, ru, sq, it).
 */
export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',

  groups: [
    {name: 'basic', title: 'Basic info', default: true},
    {name: 'content', title: 'Article content'},
    {name: 'media', title: 'Cover image'},
    {name: 'categorization', title: 'Categories & author'},
    {name: 'related', title: 'Related content'},
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
      description: 'Used in the article URL (generated from the English title).',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Publish date',
      type: 'datetime',
      group: 'basic',
      validation: (Rule: any) => Rule.required(),
      description: 'Date shown on the public site and used for sorting.',
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
          return String(en || '').trim()
            ? true
            : 'Please add the English title (required for URL generation).'
        }),
      description: 'Article headline per language.',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'localizedString',
      group: 'content',
      description: 'Optional secondary heading shown under the main title.',
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'localizedText',
      group: 'content',
      rows: 3,
      description: 'Short summary per language (used for cards and search snippets).',
    }),
    defineField({
      name: 'content',
      title: 'Article body',
      type: 'localizedBlockContent',
      group: 'content',
      validation: (Rule: any) =>
        Rule.required().custom((value: any) => {
          const en = (value as {en?: unknown[]} | undefined)?.en
          return Array.isArray(en) && en.length > 0
            ? true
            : 'Please add at least one content block in English.'
        }),
      description:
        'Article body per language. Add paragraphs, images, tables, FAQ blocks, callouts, CTAs, recommended articles, and property embeds.',
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
          return String(alt || '').trim()
            ? true
            : 'Please add alternative text for the cover image (accessibility/SEO).'
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
      options: {filter: 'active != false'},
      validation: (Rule: any) =>
        Rule.required().min(1).max(3).error('Choose 1 to 3 categories.'),
      description: 'Categories for this article. Used for filtering on the blog listing.',
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      group: 'categorization',
      to: [{type: 'blogAuthor'}],
      options: {filter: 'active != false'},
      validation: (Rule: any) => Rule.required(),
      description: 'Primary author shown in the byline.',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      group: 'categorization',
      initialValue: false,
      description: 'If enabled, this post will be highlighted on the blog homepage.',
    }),
    defineField({
      name: 'authorName',
      title: 'Author name (legacy fallback)',
      type: 'string',
      group: 'categorization',
      description:
        'Legacy fallback. Prefer using the Author reference field above for new posts.',
      hidden: ({document}: any) => Boolean(document?.author),
    }),
    defineField({
      name: 'authorRole',
      title: 'Author role (legacy fallback)',
      type: 'string',
      group: 'categorization',
      description:
        'Legacy fallback. Prefer using the Author reference field above for new posts.',
      hidden: ({document}: any) => Boolean(document?.author),
    }),
    defineField({
      name: 'authorImage',
      title: 'Author photo (legacy fallback)',
      type: 'image',
      group: 'categorization',
      options: {hotspot: true},
      description:
        'Legacy fallback. Prefer using the Author reference field above for new posts.',
      hidden: ({document}: any) => Boolean(document?.author),
    }),
    defineField({
      name: 'relatedPosts',
      title: 'Related posts',
      type: 'array',
      group: 'related',
      of: [{type: 'reference', to: [{type: 'blogPost'}]}],
      description: 'Posts shown in the “Read next” section under this article (max 6).',
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
          return hasSelfReference
            ? 'You can’t select the same post as a related post.'
            : true
        }),
    }),
    defineField({
      name: 'relatedProperties',
      title: 'Related properties',
      type: 'array',
      group: 'related',
      of: [{type: 'reference', to: [{type: 'property'}]}],
      options: {filter: 'isPublished == true'},
      validation: (Rule: any) => Rule.max(3).error('Choose up to 3 properties.'),
      description: 'Properties shown as recommendations under the article (max 3).',
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
            return 'Before publishing, add English meta title and meta description.'
          }
          return true
        }),
      description: 'Used for Google search results and social sharing (Open Graph) per language.',
    }),
  ],

  preview: {
    select: {
      titleEn: 'title.en',
      titleSq: 'title.sq',
      titleUk: 'title.uk',
      titleRu: 'title.ru',
      titleIt: 'title.it',
      slug: 'slug.current',
      publishedAt: 'publishedAt',
      featured: 'featured',
      categoryTitle: 'categories.0.title.en',
      authorName: 'author.name',
      legacyAuthorName: 'authorName',
      media: 'coverImage',
    },
    prepare(selection: any) {
      const s = selection || {}
      const title =
        s.titleEn || s.titleSq || s.titleUk || s.titleRu || s.titleIt || 'Untitled'
      const authorDisplayName = s.authorName || s.legacyAuthorName || ''
      const dateLabel = s.publishedAt ? new Date(s.publishedAt).toLocaleDateString() : ''
      const subtitleParts = [
        s.featured ? '★ Featured' : null,
        s.categoryTitle,
        dateLabel,
        authorDisplayName,
        s.slug ? `/${s.slug}` : null,
      ].filter(Boolean)
      return {
        title,
        subtitle: subtitleParts.join(' · ') || 'Blog post',
        media: s.media,
      }
    },
  },
})
