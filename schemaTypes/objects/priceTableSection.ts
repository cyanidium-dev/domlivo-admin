import {defineType, defineField, defineArrayMember} from 'sanity'
import {PAGE_BUILDER_GROUPS} from '../constants/pageBuilderGroups'

export const CONFIDENCE_LEVELS = [
  {title: 'High', value: 'high'},
  {title: 'Medium', value: 'medium'},
  {title: 'Low', value: 'low'},
] as const

/**
 * Data table with sources: price/indicator tables from the research knowledge
 * base (columns + labeled rows, optional per-row confidence and link).
 * Primary AEO block — AI assistants quote tables.
 */
export const priceTableSection = defineType({
  name: 'priceTableSection',
  title: 'Data table (prices)',
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
    defineField({name: 'subtitle', title: 'Subtitle', type: 'localizedText', group: 'content'}),
    defineField({
      name: 'columns',
      title: 'Column headings',
      group: 'data',
      description:
        'Value column headers (the row label column is separate and comes first). Each row must have the same number of cells.',
      type: 'array',
      of: [defineArrayMember({type: 'localizedString'})],
      validation: (Rule) => Rule.required().min(2).max(8),
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
              name: 'label',
              title: 'Row label',
              description: 'First cell of the row (e.g. district name).',
              type: 'localizedString',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'cells',
              title: 'Cells',
              description: 'Values for each column. Count must match the column headings count.',
              type: 'array',
              of: [defineArrayMember({type: 'localizedString'})],
            }),
            defineField({
              name: 'confidence',
              title: 'Confidence',
              type: 'string',
              options: {list: [...CONFIDENCE_LEVELS], layout: 'radio', direction: 'horizontal'},
              description: 'Optional confidence level for this row (🟢/🟡/🔴 convention).',
            }),
            defineField({
              name: 'href',
              title: 'Row link (optional)',
              type: 'string',
              description:
                'Optional URL — the whole row becomes a link (e.g. to a district page). Relative path (/albania/tirana/districts/blloku) or full URL.',
            }),
          ],
          preview: {
            select: {
              labelEn: 'label.en',
              labelSq: 'label.sq',
              labelRu: 'label.ru',
              confidence: 'confidence',
            },
            prepare({labelEn, labelSq, labelRu, confidence}: {
              labelEn?: string
              labelSq?: string
              labelRu?: string
              confidence?: string
            }) {
              const dot =
                confidence === 'high' ? '🟢 ' : confidence === 'medium' ? '🟡 ' : confidence === 'low' ? '🔴 ' : ''
              return {title: `${dot}${labelEn || labelSq || labelRu || 'Row'}`}
            },
          },
        }),
      ],
      validation: (Rule) =>
        Rule.max(40).custom((rows, context) => {
          const parent = context.parent as {columns?: unknown[]}
          const columnCount = Array.isArray(parent?.columns) ? parent.columns.length : 0
          if (columnCount === 0) return true
          if (!Array.isArray(rows)) return true
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i] as {cells?: unknown[]} | undefined
            const cellCount = Array.isArray(row?.cells) ? row.cells.length : 0
            if (cellCount !== columnCount) {
              return `Row ${i + 1}: expected ${columnCount} cell(s), got ${cellCount}`
            }
          }
          return true
        }),
    }),
    defineField({
      name: 'confidenceEnabled',
      title: 'Show confidence column',
      type: 'boolean',
      group: 'layout',
      initialValue: false,
      description: 'When enabled, per-row confidence dots are shown in a dedicated column.',
    }),
    defineField({
      name: 'sourceNote',
      title: 'Source note',
      type: 'localizedString',
      group: 'content',
      description: 'Short attribution shown under the table, e.g. "Bank of Albania / Deloitte data".',
    }),
    defineField({
      name: 'lastUpdated',
      title: 'Last updated',
      type: 'date',
      group: 'content',
      description: 'Shown as "Updated: {date}" near the table.',
    }),
    defineField({
      name: 'cta',
      title: 'Call to action',
      type: 'localizedCtaLink',
      group: 'content',
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled', rows: 'rows', columns: 'columns'},
    prepare({title, enabled, rows, columns}: {
      title?: string
      enabled?: boolean
      rows?: unknown[]
      columns?: unknown[]
    }) {
      const r = Array.isArray(rows) ? rows.length : 0
      const c = Array.isArray(columns) ? columns.length : 0
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'Data table') + status, subtitle: `${r} row(s) × ${c} column(s)`}
    },
  },
})
