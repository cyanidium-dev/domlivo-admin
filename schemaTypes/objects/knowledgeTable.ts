import {defineType, defineField, defineArrayMember} from 'sanity'
import {KNOWLEDGE_CONFIDENCE} from '../constants/knowledge'

/**
 * A table inside a knowledge article. Unlike `blogTable`, every row carries a
 * `rowId` and the facts it was built from, so the assistant can cite one line
 * ("Durrës, household, 70 lek/m³") rather than a whole page, and the site can
 * render a source popover on that line.
 */
export const knowledgeTable = defineType({
  name: 'knowledgeTable',
  title: 'Knowledge table',
  type: 'object',
  fields: [
    defineField({
      name: 'tableId',
      title: 'Table ID',
      type: 'string',
      description: 'Citation key, unique within the article: ELEC_TARIFF_2026, DURRES_PRICE_BANDS.',
      validation: (Rule) =>
        Rule.required().custom((value) =>
          typeof value === 'string' && /^[A-Z][A-Z0-9_]*$/.test(value)
            ? true
            : 'Capitals, digits and underscores only, e.g. WATER_BILL_BY_CITY',
        ),
    }),
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({
      name: 'columns',
      title: 'Column headings',
      type: 'array',
      of: [defineArrayMember({type: 'localizedString'})],
      validation: (Rule) => Rule.required().min(2).max(14),
    }),
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'knowledgeRow',
          type: 'object',
          fields: [
            defineField({
              name: 'rowId',
              title: 'Row ID',
              type: 'string',
              description: 'Two digits, stable across edits: 01, 02, 03…',
              validation: (Rule) => Rule.required().max(8),
            }),
            defineField({
              name: 'cells',
              title: 'Cells',
              type: 'array',
              of: [{type: 'string'}],
              description: 'Plain values. Must match the column count.',
              validation: (Rule) => Rule.required().min(1),
            }),
            defineField({
              name: 'facts',
              title: 'Facts behind this row',
              type: 'array',
              of: [{type: 'reference', to: [{type: 'knowledgeFact'}]}],
              description: 'What the numbers came from. The row renders a source popover from these.',
            }),
            defineField({
              name: 'note',
              title: 'Row note',
              type: 'string',
            }),
          ],
          preview: {
            select: {rowId: 'rowId', cells: 'cells', facts: 'facts'},
            prepare({rowId, cells, facts}: {rowId?: string; cells?: string[]; facts?: unknown[]}) {
              const n = Array.isArray(facts) ? facts.length : 0
              return {
                title: `${rowId || '—'} · ${(cells || []).join(' | ')}`,
                subtitle: n > 0 ? `${n} fact(s)` : 'no facts linked',
              }
            },
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'methodology',
      title: 'Methodology',
      type: 'localizedText',
      description: 'How the table was built: sample, formula, what the ranges mean.',
    }),
    defineField({
      name: 'confidence',
      title: 'Table confidence',
      type: 'string',
      options: {list: [...KNOWLEDGE_CONFIDENCE]},
      description: 'The weakest level among its rows, unless stated otherwise.',
    }),
  ],
  preview: {
    select: {tableId: 'tableId', title: 'title.en', rows: 'rows'},
    prepare({tableId, title, rows}: {tableId?: string; title?: string; rows?: unknown[]}) {
      const n = Array.isArray(rows) ? rows.length : 0
      return {title: `${tableId || 'table'} · ${title || ''}`.trim(), subtitle: `${n} row(s)`}
    },
  },
})
