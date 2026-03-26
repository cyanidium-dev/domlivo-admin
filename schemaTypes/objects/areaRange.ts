import {defineType, defineField} from 'sanity'

/**
 * Optional bounds for catalog area filter (e.g. m²).
 * Used by siteSettings.areaRange. When unset, frontend derives min/max from properties.
 */
export const areaRange = defineType({
  name: 'areaRange',
  title: 'Area Range',
  type: 'object',

  fields: [
    defineField({
      name: 'from',
      title: 'From',
      type: 'number',
      description: 'Lower bound of the filter range (inclusive).',
    }),
    defineField({
      name: 'to',
      title: 'To',
      type: 'number',
      description: 'Upper bound of the filter range (inclusive).',
    }),
  ],

  preview: {
    select: {from: 'from', to: 'to'},
    prepare({from, to}: {from?: number; to?: number}) {
      const fromStr = from != null ? String(from) : '?'
      const toStr = to != null ? String(to) : '?'
      return {title: `${fromStr} – ${toStr} m²`}
    },
  },
})
