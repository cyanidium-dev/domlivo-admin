import {defineType, defineField} from 'sanity'

/**
 * Single shared price range for hero and catalog filters.
 * Values are in EUR. Used by siteSettings.priceRange.
 */
export const priceRange = defineType({
  name: 'priceRange',
  title: 'Price Range',
  type: 'object',

  fields: [
    defineField({
      name: 'from',
      title: 'From (EUR)',
      type: 'number',
      validation: (Rule) => Rule.required().min(0).error('From must be 0 or greater'),
      description: 'Lower bound of the filter range (inclusive).',
    }),
    defineField({
      name: 'to',
      title: 'To (EUR)',
      type: 'number',
      validation: (Rule) =>
        Rule.required().custom((to, context) => {
          const parent = context.parent as {from?: number} | undefined
          const from = parent?.from
          if (from == null || typeof from !== 'number') return true
          if (to == null || typeof to !== 'number') return true
          return to >= from ? true : 'To must be greater than or equal to From.'
        }),
      description: 'Upper bound of the filter range (inclusive).',
    }),
  ],

  preview: {
    select: {from: 'from', to: 'to'},
    prepare({from, to}: {from?: number; to?: number}) {
      const fromStr = from != null ? from.toLocaleString() : '?'
      const toStr = to != null ? to.toLocaleString() : '?'
      return {title: `€${fromStr} – €${toStr}`}
    },
  },
})
