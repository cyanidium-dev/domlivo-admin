import {defineType, defineField, defineArrayMember} from 'sanity'
import {ZONE_METRIC_OPTIONS} from './zoneStatsAutoSection'

/**
 * Price table built from `zoneMetrics` records: either every district of a
 * city, or a chosen set of zones side by side. Rendered through the same UI as
 * the hand-filled `priceTableSection`.
 *
 * Zones with no record are left out of the table rather than shown empty.
 */
export const zonePriceTableAutoSection = defineType({
  name: 'zonePriceTableAutoSection',
  title: 'Zone price table (automatic)',
  type: 'object',
  groups: [
    {name: 'content', title: 'Content', default: true},
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
    defineField({name: 'title', title: 'Section title', type: 'localizedString', group: 'content'}),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'localizedText', group: 'content'}),
    defineField({
      name: 'mode',
      title: 'What to list',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'All districts of a city', value: 'cityDistricts'},
          {title: 'Compare chosen zones', value: 'compare'},
        ],
        layout: 'radio',
      },
      initialValue: 'cityDistricts',
    }),
    defineField({
      name: 'city',
      title: 'City',
      type: 'reference',
      to: [{type: 'city'}],
      group: 'settings',
      hidden: ({parent}) => parent?.mode === 'compare',
      description: "Leave empty on a city landing to use that page's own city.",
    }),
    defineField({
      name: 'zones',
      title: 'Zones to compare',
      type: 'array',
      group: 'settings',
      of: [defineArrayMember({type: 'reference', to: [{type: 'district'}, {type: 'city'}]})],
      hidden: ({parent}) => parent?.mode !== 'compare',
      validation: (Rule) =>
        Rule.max(6).custom((value, context) => {
          const parent = context.parent as {mode?: string} | undefined
          if (parent?.mode !== 'compare') return true
          const list = Array.isArray(value) ? value : []
          return list.length >= 2 ? true : 'Pick at least two zones to compare.'
        }),
    }),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'array',
      group: 'content',
      of: [{type: 'string'}],
      options: {list: [...ZONE_METRIC_OPTIONS]},
      description:
        'Leave empty for new build, resale, all stock and the state reference price. A column no zone has data for is dropped.',
      validation: (Rule) => Rule.max(5),
    }),
    defineField({
      name: 'sortBy',
      title: 'Sort rows by',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'Price, highest first', value: 'price'},
          {title: 'Rating, highest first', value: 'rating'},
          {title: 'Order chosen above', value: 'manual'},
        ],
        layout: 'radio',
      },
      initialValue: 'price',
    }),
    defineField({
      name: 'linkRows',
      title: 'Link rows to their zone pages',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
    }),
    defineField({
      name: 'showSources',
      title: 'Show sources under the table',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
    }),
  ],
  preview: {
    select: {title: 'title.en', mode: 'mode', cityEn: 'city.title.en', enabled: 'enabled'},
    prepare({
      title,
      mode,
      cityEn,
      enabled,
    }: {
      title?: string
      mode?: string
      cityEn?: string
      enabled?: boolean
    }) {
      const subtitle =
        mode === 'compare' ? 'chosen zones' : cityEn ? `districts of ${cityEn}` : "this page's city"
      return {
        title: `${enabled === false ? '(off) ' : ''}${title || 'Zone price table (automatic)'}`,
        subtitle,
      }
    },
  },
})
