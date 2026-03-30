import {defineType, defineField, defineArrayMember} from 'sanity'

export const landingPage = defineType({
  name: 'landingPage',
  title: 'Landing Page',
  type: 'document',

  groups: [
    {name: 'basic', title: 'Basic', default: true},
    {name: 'builder', title: 'Page Builder'},
    {name: 'card', title: 'Card (for linking)'},
    {name: 'relations', title: 'Linked Entity'},
    {name: 'seo', title: 'SEO'},
  ],

  fields: [
    defineField({
      name: 'enabled',
      title: 'Enabled / Visible',
      type: 'boolean',
      group: 'basic',
      initialValue: true,
      description: 'If disabled, the frontend should not render this landing page.',
    }),

    defineField({
      name: 'pageType',
      title: 'Page Type',
      type: 'string',
      group: 'basic',
      options: {
        list: [
          {title: 'Home', value: 'home'},
          {title: 'City', value: 'city'},
          {title: 'City Index', value: 'cityIndex'},
          {title: 'District', value: 'district'},
          {title: 'Property type', value: 'propertyType'},
          {title: 'Investment', value: 'investment'},
          {title: 'Custom', value: 'custom'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
      description: 'Determines how this landing is routed and what it is linked to.',
    }),

    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'Internal/editorial title. Can also be used as page heading if needed.',
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'basic',
      hidden: ({parent}) => parent?.pageType === 'home',
      options: {
        source: (doc: Record<string, unknown>) => {
          const t = doc?.title as {en?: string} | undefined
          return t?.en ?? ''
        },
        maxLength: 96,
      },
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {pageType?: string} | undefined
          if (parent?.pageType === 'home') return true
          return value?.current ? true : 'Slug is required for non-home landing pages.'
        }),
      description:
        'URL path segment for this landing (non-home). For linked entity pages, keep it aligned with the linked entity slug.',
    }),

    defineField({
      name: 'pageSections',
      title: 'Page Sections',
      type: 'array',
      group: 'builder',
      description: 'Add, remove, and reorder sections. Drag to reorder.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const doc = context.document as {enabled?: boolean} | undefined
          if (doc?.enabled === false) return true
          const arr = Array.isArray(value) ? value : []
          if (arr.length === 0) return 'Add at least one section (or disable this landing).'
          return true
        }),
      of: [
        // Canonical reusable sections (generic names; not homepage-specific).
        defineArrayMember({type: 'heroSection'}),
        defineArrayMember({type: 'propertyCarouselSection'}),
        defineArrayMember({type: 'locationCarouselSection'}),
        defineArrayMember({type: 'landingCarouselSection'}),
        defineArrayMember({type: 'propertyTypesSection'}),
        defineArrayMember({type: 'marketingContentSection'}),
        defineArrayMember({type: 'articlesSection'}),
        defineArrayMember({type: 'seoTextSection'}),
        defineArrayMember({type: 'faqSection'}),
        // Canonical landing blocks for SEO/editorial pages (still generic enough)
        defineArrayMember({type: 'cityRichDescriptionSection'}),
        defineArrayMember({type: 'districtsComparisonSection'}),
        defineArrayMember({type: 'linkedGallerySection'}),
        defineArrayMember({type: 'landingGridSection'}),
        defineArrayMember({type: 'investorLogosSection'}),
      ],
    }),

    defineField({
      name: 'cardTitle',
      title: 'Card Title',
      type: 'localizedString',
      group: 'card',
      description:
        'Optional override used when this landing is shown inside landing carousels. Falls back to Title when empty.',
    }),
    defineField({
      name: 'cardDescription',
      title: 'Card Description',
      type: 'localizedText',
      group: 'card',
      description:
        'Optional short description for cards. Falls back to linked entity shortDescription (if any) when empty.',
    }),
    defineField({
      name: 'cardImage',
      title: 'Card Image',
      type: 'image',
      group: 'card',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alternative text'}],
      description:
        'Optional image for cards. If empty, frontend may fall back to linked entity hero image (if any).',
    }),

    defineField({
      name: 'linkedCity',
      title: 'Linked City',
      type: 'reference',
      to: [{type: 'city'}],
      group: 'relations',
      hidden: ({parent}) => parent?.pageType !== 'city',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {pageType?: string} | undefined
          if (parent?.pageType !== 'city') return true
          return value ? true : 'linkedCity is required when pageType = city.'
        }),
    }),
    defineField({
      name: 'linkedDistrict',
      title: 'Linked District',
      type: 'reference',
      to: [{type: 'district'}],
      group: 'relations',
      hidden: ({parent}) => parent?.pageType !== 'district',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {pageType?: string} | undefined
          if (parent?.pageType !== 'district') return true
          return value ? true : 'linkedDistrict is required when pageType = district.'
        }),
    }),
    defineField({
      name: 'linkedPropertyType',
      title: 'Linked Property Type',
      type: 'reference',
      to: [{type: 'propertyType'}],
      group: 'relations',
      hidden: ({parent}) => parent?.pageType !== 'propertyType',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {pageType?: string} | undefined
          if (parent?.pageType !== 'propertyType') return true
          return value ? true : 'linkedPropertyType is required when pageType = propertyType.'
        }),
    }),

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'localizedSeo',
      group: 'seo',
      description: 'Localized meta title, description and Open Graph for this landing.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const doc = context.document as {enabled?: boolean} | undefined
          if (doc?.enabled === false) return true

          const requiredLocales = ['en', 'ru', 'uk', 'sq', 'it'] as const
          const metaTitle = (value as any)?.metaTitle || {}
          const metaDescription = (value as any)?.metaDescription || {}

          const missingTitle = requiredLocales.filter((l) => !String(metaTitle?.[l] || '').trim())
          const missingDesc = requiredLocales.filter((l) => !String(metaDescription?.[l] || '').trim())

          if (missingTitle.length || missingDesc.length) {
            const parts: string[] = []
            if (missingTitle.length) parts.push(`metaTitle missing: ${missingTitle.join(', ')}`)
            if (missingDesc.length) parts.push(`metaDescription missing: ${missingDesc.join(', ')}`)
            return parts.join(' | ')
          }
          return true
        }),
    }),
  ],

  preview: {
    select: {title: 'title.en', pageType: 'pageType', enabled: 'enabled'},
    prepare({title, pageType, enabled}: {title?: string; pageType?: string; enabled?: boolean}) {
      const status = enabled === false ? ' (disabled)' : ''
      return {title: (title || 'Landing') + status, subtitle: pageType || 'landingPage'}
    },
  },
})

