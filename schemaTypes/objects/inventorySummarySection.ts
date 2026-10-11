import {defineArrayMember, defineField, defineType} from 'sanity'
import {listingFilterFields} from './listingFilterFields'

/** Figures the frontend computes; keep in sync with `lib/catalog/inventorySummary.ts`. */
export const INVENTORY_METRIC_OPTIONS = [
  {title: 'Number of listings', value: 'count'},
  {title: 'Lowest price', value: 'fromPrice'},
  {title: 'Median price per m²', value: 'medianPricePerSqm'},
  {title: 'Share within 300 m of the sea', value: 'nearSeaShare'},
  {title: 'Share of new builds (off-plan / under construction)', value: 'newBuildShare'},
] as const

/**
 * Live inventory band: the numbers of a catalogue filter, computed by the site
 * when the page renders (hourly cache), never typed in. Rendered with the
 * key-figures band design. Give it the same filter as the feed below it.
 */
export const inventorySummarySection = defineType({
  name: 'inventorySummarySection',
  title: 'Inventory figures (automatic)',
  type: 'object',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'data', title: 'Data'},
    {name: 'settings', title: 'Settings'},
  ],
  fields: [
    defineField({
      name: 'enabled',
      title: 'Enabled',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
    }),
    defineField({
      name: 'title',
      title: 'Section title (optional)',
      type: 'localizedString',
      group: 'content',
    }),
    defineField({
      name: 'metrics',
      title: 'Figures to show',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'string'})],
      options: {list: [...INVENTORY_METRIC_OPTIONS], layout: 'grid'},
      description:
        'Empty: count, lowest price, median per m² and the near-sea share. A figure with no data (nothing matched) is left out.',
      validation: (Rule) => Rule.unique(),
    }),
    defineField({
      name: 'filters',
      title: 'Catalogue filter',
      type: 'object',
      group: 'data',
      description:
        'Same filter as the property carousel. Leave empty and the band follows the page: a district landing counts that district, a city landing that city.',
      options: {collapsible: true, collapsed: false},
      fields: listingFilterFields(),
    }),
  ],
  preview: {
    select: {title: 'title.en', titlePl: 'title.pl', enabled: 'enabled', metrics: 'metrics'},
    prepare({
      title,
      titlePl,
      enabled,
      metrics,
    }: {
      title?: string
      titlePl?: string
      enabled?: boolean
      metrics?: string[]
    }) {
      const n = Array.isArray(metrics) && metrics.length ? metrics.length : 4
      return {
        title: `${title || titlePl || 'Inventory figures'}${enabled === false ? ' (hidden)' : ''}`,
        subtitle: `Automatic · ${n} figure(s)`,
      }
    },
  },
})
