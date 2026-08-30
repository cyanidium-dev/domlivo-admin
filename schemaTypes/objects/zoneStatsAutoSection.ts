import {defineType, defineField} from 'sanity'

/** Metric keys the frontend knows how to format. Keep in sync with `lib/zoneMetrics/metrics.ts`. */
export const ZONE_METRIC_OPTIONS = [
  {title: 'New build, €/m²', value: 'priceNew'},
  {title: 'Resale, €/m²', value: 'priceResale'},
  {title: 'All stock, €/m²', value: 'priceAll'},
  {title: 'Rent 1+1, €/month', value: 'rent1br'},
  {title: 'Rent 2+1, €/month', value: 'rent2br'},
  {title: 'Nightly rate, €', value: 'strAdr'},
  {title: 'Occupancy, %', value: 'strOccupancy'},
  {title: 'Gross yield, long-term', value: 'yieldLtr'},
  {title: 'Gross yield, short-term', value: 'yieldStr'},
  {title: 'State reference, lek/m²', value: 'referencePrice'},
  {title: 'DomLivo rating', value: 'rating'},
] as const

/**
 * Key figures pulled from the newest `zoneMetrics` record for a zone, rendered
 * through the same UI as the hand-filled `statsBandSection`.
 *
 * The numbers are not editable here on purpose: a figure edited on the page
 * would drift from the record every other page reads.
 */
export const zoneStatsAutoSection = defineType({
  name: 'zoneStatsAutoSection',
  title: 'Zone stats (automatic)',
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
    defineField({
      name: 'title',
      title: 'Section title',
      type: 'localizedString',
      group: 'content',
      description: 'Optional. The figures and their labels come from the record.',
    }),
    defineField({
      name: 'zoneMode',
      title: 'Zone',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: "This page's zone (automatic)", value: 'auto'},
          {title: 'Pick a zone', value: 'manual'},
        ],
        layout: 'radio',
      },
      initialValue: 'auto',
      description:
        'Automatic uses the landing\'s linked district, or its linked city when there is no district.',
    }),
    defineField({
      name: 'zone',
      title: 'Zone',
      type: 'reference',
      to: [{type: 'district'}, {type: 'city'}],
      group: 'settings',
      hidden: ({parent}) => parent?.zoneMode !== 'manual',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {zoneMode?: string} | undefined
          if (parent?.zoneMode !== 'manual') return true
          return value ? true : 'Pick a zone, or switch back to automatic.'
        }),
    }),
    defineField({
      name: 'metrics',
      title: 'Figures to show',
      type: 'array',
      group: 'content',
      of: [{type: 'string'}],
      options: {list: [...ZONE_METRIC_OPTIONS]},
      description:
        'Leave empty to show everything the record holds. Metrics the record has no data for are skipped either way.',
      validation: (Rule) => Rule.max(6),
    }),
    defineField({
      name: 'showSources',
      title: 'Show sources under the figures',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
    }),
  ],
  preview: {
    select: {title: 'title.en', zoneMode: 'zoneMode', zoneEn: 'zone.title.en', enabled: 'enabled'},
    prepare({
      title,
      zoneMode,
      zoneEn,
      enabled,
    }: {
      title?: string
      zoneMode?: string
      zoneEn?: string
      enabled?: boolean
    }) {
      const zone = zoneMode === 'manual' ? zoneEn || 'no zone picked' : "this page's zone"
      return {
        title: `${enabled === false ? '(off) ' : ''}${title || 'Zone stats (automatic)'}`,
        subtitle: zone,
      }
    },
  },
})
