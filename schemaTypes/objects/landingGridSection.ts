import {defineType, defineField, defineArrayMember} from 'sanity'

export const landingGridSection = defineType({
  name: 'landingGridSection',
  title: 'Landing Grid (Cards)',
  type: 'object',
  fields: [
    defineField({name: 'enabled', title: 'Enabled / Visible', type: 'boolean', initialValue: true}),
    defineField({name: 'title', title: 'Section Title', type: 'localizedString'}),
    defineField({name: 'subtitle', title: 'Subtitle / Description', type: 'localizedText'}),
    defineField({name: 'cta', title: 'CTA (optional)', type: 'localizedCtaLink'}),
    defineField({
      name: 'sourceMode',
      title: 'Source Mode',
      type: 'string',
      options: {
        list: [
          {title: 'Auto (by filters)', value: 'auto'},
          {title: 'Manual (selected landings)', value: 'manual'},
        ],
        layout: 'radio',
      },
      initialValue: 'auto',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'manualItems',
      title: 'Manual Landings (Ordered)',
      type: 'array',
      hidden: ({parent}) => parent?.sourceMode !== 'manual',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'landingPage'}],
        }),
      ],
      description: 'Manual mode only. Frontend should render this exact order.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {sourceMode?: string} | undefined
          if (parent?.sourceMode !== 'manual') return true
          const arr = Array.isArray(value) ? value : []
          if (arr.length === 0) return 'Add at least one landing in Manual mode.'
          return true
        }),
    }),
    defineField({
      name: 'auto',
      title: 'Auto Filters',
      type: 'object',
      hidden: ({parent}) => parent?.sourceMode !== 'auto',
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
    select: {title: 'title.en', mode: 'sourceMode', enabled: 'enabled'},
    prepare({title, mode, enabled}: {title?: string; mode?: string; enabled?: boolean}) {
      const status = enabled === false ? ' (hidden)' : ''
      const m = mode === 'manual' ? 'Manual' : 'Auto'
      return {title: (title || 'Landing grid') + status, subtitle: `Landing cards • ${m}`}
    },
  },
})

