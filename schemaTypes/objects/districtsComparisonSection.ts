import {defineType, defineField, defineArrayMember} from 'sanity'

export const districtsComparisonSection = defineType({
  name: 'districtsComparisonSection',
  title: 'Comparison Table',
  type: 'object',
  fields: [
    defineField({name: 'enabled', title: 'Enabled / Visible', type: 'boolean', initialValue: true}),
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({name: 'description', title: 'Description', type: 'localizedText'}),
    defineField({
      name: 'headings',
      title: 'Table Headings',
      description: 'Column headers. Each row must have the same number of cells as headings.',
      type: 'array',
      of: [defineArrayMember({type: 'localizedString'})],
      validation: (Rule) => Rule.required().min(1).max(12),
    }),
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'cells',
              title: 'Cells',
              description: 'Number of cells must match the number of headings. First cell can act as a row label when needed.',
              type: 'array',
              of: [defineArrayMember({type: 'localizedString'})],
            }),
          ],
          preview: {
            select: {
              firstCellEn: 'cells.0.en',
              firstCellUk: 'cells.0.uk',
              firstCellRu: 'cells.0.ru',
              firstCellSq: 'cells.0.sq',
              firstCellIt: 'cells.0.it',
            },
            prepare({firstCellEn, firstCellUk, firstCellRu, firstCellSq, firstCellIt}: {
              firstCellEn?: string
              firstCellUk?: string
              firstCellRu?: string
              firstCellSq?: string
              firstCellIt?: string
            }) {
              const title = firstCellEn || firstCellUk || firstCellRu || firstCellSq || firstCellIt || 'Row'
              return {title}
            },
          },
        }),
      ],
      validation: (Rule) =>
        Rule.custom((rows, context) => {
          const parent = context.parent as {headings?: unknown[]}
          const headingCount = Array.isArray(parent?.headings) ? parent.headings.length : 0
          if (headingCount === 0) return true
          if (!Array.isArray(rows)) return true
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i] as {cells?: unknown[]} | undefined
            const cellCount = Array.isArray(row?.cells) ? row.cells.length : 0
            if (cellCount !== headingCount) {
              return `Row ${i + 1}: expected ${headingCount} cell(s) to match headings, got ${cellCount}`
            }
          }
          return true
        }),
    }),
    defineField({name: 'closingText', title: 'Closing Text', type: 'localizedText'}),
    defineField({name: 'cta', title: 'Primary CTA', type: 'localizedCtaLink'}),
    defineField({
      name: 'secondaryCta',
      title: 'Secondary CTA',
      type: 'localizedCtaLink',
      description: 'Optional secondary button displayed next to the primary CTA.',
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled', count: 'rows'},
    prepare({title, enabled, count}: {title?: string; enabled?: boolean; count?: unknown[]}) {
      const n = Array.isArray(count) ? count.length : 0
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'Comparison table') + status, subtitle: `${n} row(s)`}
    },
  },
})
