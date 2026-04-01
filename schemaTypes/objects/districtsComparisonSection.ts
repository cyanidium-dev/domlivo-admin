import {defineType, defineField, defineArrayMember} from 'sanity'
import {PAGE_BUILDER_GROUPS} from '../constants/pageBuilderGroups'

export const districtsComparisonSection = defineType({
  name: 'districtsComparisonSection',
  title: 'Comparison table',
  type: 'object',
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
    defineField({name: 'title', title: 'Title', type: 'localizedString', group: 'content'}),
    defineField({name: 'description', title: 'Description', type: 'localizedText', group: 'content'}),
    defineField({
      name: 'headings',
      title: 'Column headings',
      group: 'data',
      description: 'Column headers. Each row must have the same number of cells.',
      type: 'array',
      of: [defineArrayMember({type: 'localizedString'})],
      validation: (Rule) => Rule.required().min(1).max(12),
    }),
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      group: 'data',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'cells',
              title: 'Cells',
              description: 'Must match headings count. First cell can be a row label.',
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
              const t = firstCellEn || firstCellUk || firstCellRu || firstCellSq || firstCellIt || 'Row'
              return {title: t}
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
              return `Row ${i + 1}: expected ${headingCount} cell(s), got ${cellCount}`
            }
          }
          return true
        }),
    }),
    defineField({name: 'closingText', title: 'Closing text', type: 'localizedText', group: 'content'}),
    defineField({
      name: 'cta',
      title: 'Call to action (primary)',
      type: 'localizedCtaLink',
      group: 'content',
    }),
    defineField({
      name: 'secondaryCta',
      title: 'Call to action (secondary)',
      type: 'localizedCtaLink',
      group: 'content',
      description: 'Optional second button.',
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled', count: 'rows'},
    prepare({title, enabled, count}: {title?: string; enabled?: boolean; count?: unknown[]}) {
      const n = Array.isArray(count) ? count.length : 0
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'Comparison') + status, subtitle: `${n} row${n === 1 ? '' : 's'}`}
    },
  },
})
