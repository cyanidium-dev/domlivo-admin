import {defineType, defineField} from 'sanity'

/**
 * Single currency rate (to EUR). Written by cron; editors cannot edit.
 * EUR base = 1.
 */
export const currencyRate = defineType({
  name: 'currencyRate',
  title: 'Currency Rate',
  type: 'object',

  fields: [
    defineField({
      name: 'code',
      title: 'Code',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'ISO 4217 currency code (e.g. USD, GBP)',
    }),
    defineField({
      name: 'rate',
      title: 'Rate (to EUR)',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
      description: 'Exchange rate relative to EUR. EUR = 1.',
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Full currency name if available from API',
    }),
    defineField({
      name: 'symbol',
      title: 'Symbol',
      type: 'string',
      description: 'Currency symbol if available (e.g. $, £)',
    }),
  ],

  preview: {
    select: {code: 'code', rate: 'rate', name: 'name'},
    prepare({code, rate, name}: {code?: string; rate?: number; name?: string}) {
      const r = rate != null ? rate.toFixed(4) : '?'
      const label = name ? `${code} — ${name}` : code || 'Currency'
      return {title: label, subtitle: `1 EUR = ${r}`}
    },
  },
})
