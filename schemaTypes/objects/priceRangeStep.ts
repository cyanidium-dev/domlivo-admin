import {defineType, defineField} from 'sanity'

/**
 * Price range step for hero and catalog filters.
 * Values are in EUR. Used by siteSettings.priceRangeSteps.
 */
export const priceRangeStep = defineType({
  name: 'priceRangeStep',
  title: 'Price Range Step',
  type: 'object',

  fields: [
    defineField({
      name: 'min',
      title: 'Min (EUR)',
      type: 'number',
      validation: (Rule) => Rule.required().min(0).error('Min must be 0 or greater'),
      description: 'Lower bound of this price range (inclusive).',
    }),
    defineField({
      name: 'max',
      title: 'Max (EUR)',
      type: 'number',
      validation: (Rule) =>
        Rule.required().custom((max, context) => {
          const parent = context.parent as {min?: number} | undefined
          const min = parent?.min
          if (min == null || typeof min !== 'number') return true
          if (max == null || typeof max !== 'number') return true
          return max >= min ? true : 'Max must be greater than or equal to min.'
        }),
      description: 'Upper bound of this price range (inclusive).',
    }),
  ],

  preview: {
    select: {min: 'min', max: 'max'},
    prepare({min, max}: {min?: number; max?: number}) {
      const minStr = min != null ? min.toLocaleString() : '?'
      const maxStr = max != null ? max.toLocaleString() : '?'
      return {title: `€${minStr} – €${maxStr}`}
    },
  },
})
