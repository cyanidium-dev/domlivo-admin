import {defineType, defineField, defineArrayMember} from 'sanity'
import {PAGE_BUILDER_GROUPS} from '../constants/pageBuilderGroups'

/** Landing page cards: grid or carousel; grid can be auto-filtered or manual; carousel is manual only. */
export const landingCollectionSection = defineType({
  name: 'landingCollectionSection',
  title: 'Landing collection',
  type: 'object',
  description:
    'Show landing pages as a grid or carousel. Grid supports auto filters or a manual list; carousel uses a manual list only.',

  groups: [...PAGE_BUILDER_GROUPS],

  fields: [
    defineField({
      name: 'enabled',
      title: 'Enabled / Visible',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
      description: 'If disabled, this section is hidden on the site.',
    }),
    defineField({
      name: 'presentation',
      title: 'Presentation',
      type: 'string',
      group: 'layout',
      initialValue: 'grid',
      options: {
        list: [
          {title: 'Grid', value: 'grid'},
          {title: 'Carousel', value: 'carousel'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
      description: 'Grid: responsive cards. Carousel: horizontal scrolling cards.',
    }),
    defineField({name: 'title', title: 'Section title', type: 'localizedString', group: 'content'}),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'localizedText', group: 'content'}),
    defineField({
      name: 'cta',
      title: 'Call to action (optional)',
      type: 'localizedCtaLink',
      group: 'content',
      description: 'Optional button or link below the section header.',
    }),
    defineField({
      name: 'mode',
      title: 'Content mode',
      type: 'string',
      group: 'data',
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
      description: 'Grid only: auto uses filters below; manual uses the ordered list.',
    }),
    defineField({
      name: 'manualItems',
      title: 'Manual landings (ordered)',
      type: 'array',
      group: 'data',
      hidden: ({parent}) => {
        const p = parent as {presentation?: string; mode?: string} | undefined
        if (p?.presentation === 'carousel') return false
        return p?.mode !== 'manual'
      },
      of: [defineArrayMember({type: 'reference', to: [{type: 'landingPage'}]})],
      description: 'Pick landing pages in display order.',
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
      group: 'data',
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
          description: 'Which landing page types to include.',
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
          ? `${pres} · ${count ?? 0} card${(count ?? 0) === 1 ? '' : 's'}`
          : `${pres} · ${mode === 'manual' ? 'Manual' : 'Auto'}`
      return {title: truncated + status, subtitle: sub}
    },
  },
})
