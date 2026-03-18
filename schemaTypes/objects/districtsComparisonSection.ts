import {defineType, defineField, defineArrayMember} from 'sanity'

export const districtsComparisonSection = defineType({
  name: 'districtsComparisonSection',
  title: 'Districts Comparison (Table)',
  type: 'object',
  fields: [
    defineField({name: 'enabled', title: 'Enabled / Visible', type: 'boolean', initialValue: true}),
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({name: 'description', title: 'Description', type: 'localizedText'}),
    defineField({
      name: 'columns',
      title: 'Table Columns',
      type: 'object',
      fields: [
        defineField({name: 'colRegion', title: 'Region column label', type: 'localizedString'}),
        defineField({name: 'colAvgPrice', title: 'Avg price column label', type: 'localizedString'}),
        defineField({name: 'colAvgArea', title: 'Avg area column label', type: 'localizedString'}),
        defineField({name: 'colPopularity', title: 'Popularity column label', type: 'localizedString'}),
      ],
    }),
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'region', title: 'Region', type: 'localizedString', validation: (Rule) => Rule.required()}),
            defineField({name: 'avgPriceEurM2', title: 'Avg price €/m²', type: 'string'}),
            defineField({name: 'avgAreaM2', title: 'Avg area m²', type: 'string'}),
            defineField({name: 'popularity', title: 'Popularity', type: 'localizedString'}),
          ],
          preview: {
            select: {region: 'region.en'},
            prepare({region}: {region?: string}) {
              return {title: region || 'Row'}
            },
          },
        }),
      ],
      validation: (Rule) => Rule.min(1).max(50),
    }),
    defineField({name: 'closingText', title: 'Closing Text', type: 'localizedText'}),
    defineField({name: 'cta', title: 'CTA', type: 'localizedCtaLink'}),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled', count: 'rows'},
    prepare({title, enabled, count}: {title?: string; enabled?: boolean; count?: unknown[]}) {
      const n = Array.isArray(count) ? count.length : 0
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'Districts comparison') + status, subtitle: `${n} row(s)`}
    },
  },
})

