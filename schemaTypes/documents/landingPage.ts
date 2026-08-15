import {defineType, defineField, defineArrayMember} from 'sanity'
import {docOwnerIds} from '../utils/docOwnerIds'
import {
  entityOwnsSlugMessage,
  findTopLevelEntityOwningSlug,
  isReservedForCustomLanding,
  reservedSlugMessage,
} from '../constants/reservedRouteSlugs'

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
      title: 'Route family',
      type: 'string',
      group: 'basic',
      options: {
        list: [
          // Editorial families (pick these when creating content):
          {title: 'Guide — renders at /guides/<slug>', value: 'custom'},
          {title: 'City landing — renders at /<country>/<city>/info (link a city)', value: 'city'},
          {title: 'District landing — overlays /…/districts/<district> (link a district)', value: 'district'},
          {title: 'Unique landing — renders at top-level /<slug> (no index page — add navigation manually)', value: 'unique'},
          // System families (singletons / slug-addressed, do not create ad hoc):
          {title: 'Home (singleton landing-home)', value: 'home'},
          {title: 'City Index (singleton landing-cities → /cities)', value: 'cityIndex'},
          {title: 'Investment / deal landing (slug-addressed: sale, long-term-rent, short-term-rent)', value: 'investment'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
      description:
        'The route family decides where this landing renders (see domlivo-workspace docs/engineering/ROUTING.md). Guides are listed under /guides; unique landings have NO index page — wire them into header/footer/siteSettings navigation yourself. Do not use landing pages to model shorthand catalog/filter URL combinations.',
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
        Rule.custom(async (value, context) => {
          const parent = context.parent as {pageType?: string} | undefined
          if (parent?.pageType === 'home') return true
          if (!value?.current) return 'Slug is required for non-home landing pages.'
          // Guides surface at /guides/<slug>; unique landings at top-level
          // /<slug> — both may shadow static routes (the 2026-08 "for-realtors"
          // duplicate). Deal-type landings (pageType "investment") legitimately
          // use deal slugs like "sale".
          if (
            (parent?.pageType === 'custom' || parent?.pageType === 'unique') &&
            isReservedForCustomLanding(value.current)
          ) {
            return reservedSlugMessage(value.current)
          }
          // Unique landings render LAST in the top-level resolver — an existing
          // country/city/propertyType slug would eclipse this landing forever.
          if (parent?.pageType === 'unique') {
            const client = context.getClient({apiVersion: '2024-06-01'})
            const owner = await findTopLevelEntityOwningSlug(client, value.current)
            if (owner) return entityOwnsSlugMessage(value.current, owner)
          }
          return true
        }),
      description:
        'URL path segment for this editorial landing (non-home). For linked entity pages, keep it aligned with the linked entity slug. Country-level editorial pages can use pageType "custom" with a country slug segment. Reserved route segments (see ROUTING.md) are rejected for custom landings.',
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
        // Reusable page sections (same blocks for home and other landings).
        defineArrayMember({type: 'heroSection'}),
        defineArrayMember({type: 'propertyCarouselSection'}),
        defineArrayMember({type: 'locationCarouselSection'}),
        defineArrayMember({type: 'propertyTypesSection'}),
        defineArrayMember({type: 'marketingContentSection'}),
        defineArrayMember({type: 'articlesSection'}),
        defineArrayMember({type: 'seoTextSection'}),
        defineArrayMember({type: 'ctaSection'}),
        defineArrayMember({type: 'faqSection'}),
        defineArrayMember({type: 'districtsComparisonSection'}),
        defineArrayMember({type: 'linkedGallerySection'}),
        defineArrayMember({type: 'landingCollectionSection'}),
        defineArrayMember({type: 'investorLogosSection'}),
        defineArrayMember({type: 'priceTableSection'}),
        defineArrayMember({type: 'statsBandSection'}),
        defineArrayMember({type: 'sourcesSection'}),
        defineArrayMember({type: 'zoneStatsAutoSection'}),
        defineArrayMember({type: 'zonePriceTableAutoSection'}),
        defineArrayMember({type: 'mortgageCalcSection'}),
        defineArrayMember({type: 'roiCalcSection'}),
        defineArrayMember({type: 'purchaseCostCalcSection'}),
        defineArrayMember({type: 'trackerSection'}),
        defineArrayMember({type: 'developersRatingSection'}),
        defineArrayMember({type: 'developerCardSection'}),
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
      description:
        'Must reference the same canonical city document used for properties, districts, and catalog SEO for this place. One enabled city landing per city.',
      validation: (Rule) =>
        Rule.custom(async (value, context) => {
          const parent = context.parent as {pageType?: string; enabled?: boolean} | undefined
          if (parent?.pageType !== 'city') return true
          if (!value || typeof value !== 'object' || !('_ref' in value) || !(value as {_ref?: string})._ref) {
            return 'Linked City is required when Page Type is City.'
          }
          const ref = (value as {_ref: string})._ref
          const enabled = (context.document as {enabled?: boolean} | undefined)?.enabled
          if (enabled === false) return true

          const client = context.getClient?.({apiVersion: '2024-01-01'})
          if (!client) return true
          const ids = docOwnerIds(context.document as {_id?: string})
          if (ids.length === 0) return true

          const count = await client.fetch<number>(
            `count(*[_type == "landingPage" && pageType == "city" && linkedCity._ref == $ref && enabled != false && !(_id in $ids)])`,
            {ref, ids},
          )
          return count === 0
            ? true
            : 'Another enabled city landing already references this city. Disable or delete the other landing, or disable this one.'
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
      name: 'contentUpdatedAt',
      title: 'Content updated at',
      type: 'date',
      group: 'basic',
      description:
        'Optional editorial freshness date. When set, the frontend shows an "Updated: {date}" badge and emits article:modified_time metadata.',
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

