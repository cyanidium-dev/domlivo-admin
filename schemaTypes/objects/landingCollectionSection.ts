import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * Unified landing-page card section: grid or carousel presentation, manual or auto (grid only) sourcing.
 * Replaces `landingGridSection` and `landingCarouselSection`.
 */
export const landingCollectionSection = defineType({
  name: 'landingCollectionSection',
  title: 'Landing collection',
  type: 'object',
  description:
    'Show landing pages as a grid or carousel. Grid supports auto filters or a manual list; carousel uses a manual list only.',

  fields: [
    defineField({
      name: 'enabled',
      title: 'Enabled / Visible',
      type: 'boolean',
      initialValue: true,
      description: 'If disabled, the frontend should hide this section.',
    }),
    defineField({
      name: 'presentation',
      title: 'Presentation',
      type: 'string',
      initialValue: 'grid',
      options: {
        list: [
          {title: 'Grid', value: 'grid'},
          {title: 'Carousel', value: 'carousel'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
      description: 'Grid: responsive card layout. Carousel: horizontal scrolling cards.',
    }),
    defineField({name: 'title', title: 'Section Title', type: 'localizedString'}),
    defineField({name: 'subtitle', title: 'Subtitle / Description', type: 'localizedText'}),
    defineField({
      name: 'cta',
      title: 'CTA (optional)',
      type: 'localizedCtaLink',
      description: 'Optional button or link below the section header.',
    }),
    defineField({
      name: 'mode',
      title: 'Content mode',
      type: 'string',
      options: {
        list: [
          {title: 'Auto (by filters)', value: 'auto'},
          {title: 'Manual (selected landings)', value: 'manual'},
        ],
        layout: 'radio',
      },
      initialValue: 'auto',
      hidden: ({parent}) => (parent as {presentation?: string})?.presentation === 'carousel',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const p = context.parent as {presentation?: string} | undefined
          if (p?.presentation === 'carousel') return true
          return value ? true : 'Choose how landings are loaded.'
        }),
      description: 'Grid only: auto uses filters below; manual uses the ordered list. Carousel always uses the ordered list.',
    }),
    defineField({
      name: 'manualItems',
      title: 'Manual landings (ordered)',
      type: 'array',
      hidden: ({parent}) => {
        const p = parent as {presentation?: string; mode?: string} | undefined
        if (p?.presentation === 'carousel') return false
        return p?.mode !== 'manual'
      },
      of: [defineArrayMember({type: 'reference', to: [{type: 'landingPage'}]})],
      description: 'Pick landing pages in display order. Used for carousel, or for grid in manual mode.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const p = context.parent as {presentation?: string; mode?: string} | undefined
          const needManual =
            p?.presentation === 'carousel' || (p?.presentation === 'grid' && p?.mode === 'manual')
          if (!needManual) return true
          const arr = Array.isArray(value) ? value : []
          if (arr.length === 0) return 'Add at least one landing page.'
          return true
        }),
    }),
    defineField({
      name: 'auto',
      title: 'Auto filters',
      type: 'object',
      hidden: ({parent}) => {
        const p = parent as {presentation?: string; mode?: string} | undefined
        return p?.presentation !== 'grid' || p?.mode !== 'auto'
      },
      fields: [
        defineField({
          name: 'pageTypes',
          title: 'Page types',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'string',
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
              },
            }),
          ],
          validation: (Rule) => Rule.min(1),
          description: 'Select which landing page types to include.',
        }),
        defineField({
          name: 'enabledOnly',
          title: 'Enabled only',
          type: 'boolean',
          initialValue: true,
          description: 'When enabled, only enabled landing pages are included.',
        }),
        defineField({
          name: 'sort',
          title: 'Sort order',
          type: 'string',
          initialValue: 'titleAsc',
          options: {
            list: [
              {title: 'Title (EN) A→Z', value: 'titleAsc'},
              {title: 'Title (EN) Z→A', value: 'titleDesc'},
              {title: 'Created (newest first)', value: 'createdAtDesc'},
              {title: 'Created (oldest first)', value: 'createdAtAsc'},
            ],
          },
        }),
        defineField({
          name: 'limit',
          title: 'Limit (optional)',
          type: 'number',
          validation: (Rule) => Rule.min(1).max(200),
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title.en',
      enabled: 'enabled',
      presentation: 'presentation',
      mode: 'mode',
      count: 'manualItems.length',
    },
    prepare({
      title,
      enabled,
      presentation,
      mode,
      count,
    }: {
      title?: string
      enabled?: boolean
      presentation?: string
      mode?: string
      count?: number
    }) {
      const status = enabled === false ? ' (hidden)' : ''
      const raw = String(title || '').trim()
      const head = raw ? `Landing collection: ${raw}` : 'Landing collection'
      const truncated = head.length > 52 ? `${head.slice(0, 51)}…` : head
      const pres = presentation === 'carousel' ? 'Carousel' : 'Grid'
      const sub =
        presentation === 'carousel'
          ? `${pres} · ${count ?? 0} landing${(count ?? 0) === 1 ? '' : 's'}`
          : `${pres} · ${mode === 'manual' ? 'Manual' : 'Auto'}`
      return {title: truncated + status, subtitle: sub}
    },
  },
})
