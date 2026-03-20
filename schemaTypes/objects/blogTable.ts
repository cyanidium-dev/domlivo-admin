import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * Table block for blog posts.
 * Structured data for comparison tables, price lists, etc.
 */
export const blogTable = defineType({
  name: 'blogTable',
  title: 'Table',
  type: 'object',

  fields: [
    defineField({
      name: 'title',
      title: 'Table title',
      type: 'localizedString',
      description: 'Optional heading above the table.',
    }),
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'tableRow',
          type: 'object',
          fields: [
            defineField({
              name: 'cells',
              title: 'Cells',
              type: 'array',
              of: [{type: 'string'}],
              validation: (Rule) => Rule.required().min(1),
            }),
          ],
          preview: {
            select: {cells: 'cells'},
            prepare({cells}: {cells?: string[]}) {
              return {title: (cells || []).join(' | ') || 'Empty row'}
            },
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'caption',
      title: 'Caption / note',
      type: 'localizedString',
      description: 'Optional caption or footnote below the table.',
    }),
  ],

  preview: {
    select: {title: 'title.en', rowCount: 'rows'},
    prepare({title, rowCount}: {title?: string; rowCount?: unknown[]}) {
      const n = Array.isArray(rowCount) ? rowCount.length : 0
      return {title: title || 'Table', subtitle: n > 0 ? `${n} row(s)` : 'Table block'}
    },
  },
})
