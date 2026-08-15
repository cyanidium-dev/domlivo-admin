import {defineType, defineField, defineArrayMember} from 'sanity'
import {docOwnerIds} from '../utils/docOwnerIds'
import {CONFIDENCE_LEVELS} from '../objects/priceTableSection'

export const METRIC_BASIS = [
  {title: 'Asking prices (listings)', value: 'asking'},
  {title: 'Transactions', value: 'transaction'},
  {title: 'Official (state schedule)', value: 'official'},
  {title: 'Calculated (derived from other figures)', value: 'calculated'},
  {title: 'Mixed', value: 'mixed'},
] as const

const CONFIDENCE_DOT: Record<string, string> = {high: '🟢', medium: '🟡', low: '🔴'}

/**
 * Market figures for one zone (`district` or `city`) over one period.
 *
 * One record = one zone × one period; history accrues as more records rather
 * than as edits. Consumed by `zoneStatsAutoSection` / `zonePriceTableAutoSection`
 * — never by the `district` document itself, which stays an editorial template
 * (see docs/engineering/PAGE-STRUCTURE-REVIEW-2026-08-15.md §2).
 *
 * `confidence` describes the market metrics; the state reference price is
 * official by definition and instead carries its own edition label, because
 * Tirana stays on Udhëzim 34/2023 while other cities move to the edition
 * effective 01.01.2026.
 */
export const zoneMetrics = defineType({
  name: 'zoneMetrics',
  title: 'Zone Metrics',
  type: 'document',
  groups: [
    {name: 'zone', title: 'Zone & period', default: true},
    {name: 'prices', title: 'Prices'},
    {name: 'rent', title: 'Rent & yield'},
    {name: 'reference', title: 'Reference price'},
    {name: 'quality', title: 'Quality & sources'},
  ],
  fields: [
    defineField({
      name: 'zone',
      title: 'Zone',
      type: 'reference',
      to: [{type: 'district'}, {type: 'city'}],
      group: 'zone',
      description: 'The district or city these figures describe.',
      validation: (Rule) =>
        Rule.required().custom(async (value, context) => {
          const ref = (value as {_ref?: string} | undefined)?._ref
          if (!ref) return true
          const period = (context.document as {periodLabel?: string} | undefined)?.periodLabel
          if (!period) return true

          const client = context.getClient?.({apiVersion: '2024-01-01'})
          if (!client) return true
          const ids = docOwnerIds(context.document as {_id?: string})
          if (ids.length === 0) return true

          const count = await client.fetch<number>(
            `count(*[_type == "zoneMetrics" && zone._ref == $ref && periodLabel == $period && !(_id in $ids)])`,
            {ref, period, ids},
          )
          return count === 0
            ? true
            : `A ${period} record already exists for this zone. Edit that record, or use a different period.`
        }),
    }),
    defineField({
      name: 'periodLabel',
      title: 'Period label',
      type: 'string',
      group: 'zone',
      description:
        'Vintage of the data, not the date it was entered — e.g. "2026-H1". Two records for the same zone must not share a label.',
      validation: (Rule) => Rule.required().max(20),
    }),
    defineField({
      name: 'periodDate',
      title: 'Period date',
      type: 'date',
      group: 'zone',
      description: 'Sort key: the date the period is anchored to (e.g. 2026-01-01 for 2026-H1).',
      validation: (Rule) => Rule.required(),
    }),

    // --- Prices, €/m² -------------------------------------------------------
    defineField({
      name: 'priceNewMin',
      title: 'New build, min (€/m²)',
      type: 'number',
      group: 'prices',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'priceNewMax',
      title: 'New build, max (€/m²)',
      type: 'number',
      group: 'prices',
      validation: (Rule) =>
        Rule.min(0).custom((value, context) => {
          const min = (context.document as {priceNewMin?: number} | undefined)?.priceNewMin
          if (typeof value !== 'number' || typeof min !== 'number') return true
          return value >= min ? true : 'Max must be greater than or equal to min.'
        }),
    }),
    defineField({
      name: 'priceNewMedian',
      title: 'New build, median (€/m²)',
      type: 'number',
      group: 'prices',
      description: 'Use when the source publishes a median (e.g. the listing parser) rather than a band.',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'priceResaleMin',
      title: 'Resale, min (€/m²)',
      type: 'number',
      group: 'prices',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'priceResaleMax',
      title: 'Resale, max (€/m²)',
      type: 'number',
      group: 'prices',
      validation: (Rule) =>
        Rule.min(0).custom((value, context) => {
          const min = (context.document as {priceResaleMin?: number} | undefined)?.priceResaleMin
          if (typeof value !== 'number' || typeof min !== 'number') return true
          return value >= min ? true : 'Max must be greater than or equal to min.'
        }),
    }),
    defineField({
      name: 'priceResaleMedian',
      title: 'Resale, median (€/m²)',
      type: 'number',
      group: 'prices',
      validation: (Rule) => Rule.min(0),
    }),

    defineField({
      name: 'priceAllMin',
      title: 'All stock, min (€/m²)',
      type: 'number',
      group: 'prices',
      description:
        'Whole market, new and resale together. Several sources publish only this — a city average, or a median across all listings of a zone.',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'priceAllMax',
      title: 'All stock, max (€/m²)',
      type: 'number',
      group: 'prices',
      validation: (Rule) =>
        Rule.min(0).custom((value, context) => {
          const min = (context.document as {priceAllMin?: number} | undefined)?.priceAllMin
          if (typeof value !== 'number' || typeof min !== 'number') return true
          return value >= min ? true : 'Max must be greater than or equal to min.'
        }),
    }),
    defineField({
      name: 'priceAllMedian',
      title: 'All stock, median (€/m²)',
      type: 'number',
      group: 'prices',
      validation: (Rule) => Rule.min(0),
    }),

    // --- Rent & yield -------------------------------------------------------
    defineField({
      name: 'rentLtr1brMin',
      title: 'Long-term rent 1+1, min (€/month)',
      type: 'number',
      group: 'rent',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'rentLtr1brMax',
      title: 'Long-term rent 1+1, max (€/month)',
      type: 'number',
      group: 'rent',
      validation: (Rule) =>
        Rule.min(0).custom((value, context) => {
          const min = (context.document as {rentLtr1brMin?: number} | undefined)?.rentLtr1brMin
          if (typeof value !== 'number' || typeof min !== 'number') return true
          return value >= min ? true : 'Max must be greater than or equal to min.'
        }),
    }),
    defineField({
      name: 'rentLtr2brMin',
      title: 'Long-term rent 2+1, min (€/month)',
      type: 'number',
      group: 'rent',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'rentLtr2brMax',
      title: 'Long-term rent 2+1, max (€/month)',
      type: 'number',
      group: 'rent',
      validation: (Rule) =>
        Rule.min(0).custom((value, context) => {
          const min = (context.document as {rentLtr2brMin?: number} | undefined)?.rentLtr2brMin
          if (typeof value !== 'number' || typeof min !== 'number') return true
          return value >= min ? true : 'Max must be greater than or equal to min.'
        }),
    }),
    defineField({
      name: 'strAdr',
      title: 'Short-term ADR (€/night)',
      type: 'number',
      group: 'rent',
      description: 'City level only. District-level STR is left empty on purpose — city figures pushed down would be false precision.',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'strOccupancyPct',
      title: 'Short-term occupancy (%)',
      type: 'number',
      group: 'rent',
      validation: (Rule) => Rule.min(0).max(100),
    }),
    defineField({
      name: 'grossYieldLtrPct',
      title: 'Gross yield, long-term (%)',
      type: 'number',
      group: 'rent',
      validation: (Rule) => Rule.min(0).max(100),
    }),
    defineField({
      name: 'grossYieldStrPct',
      title: 'Gross yield, short-term (%)',
      type: 'number',
      group: 'rent',
      validation: (Rule) => Rule.min(0).max(100),
    }),

    // --- State reference price ---------------------------------------------
    defineField({
      name: 'referencePrice',
      title: 'Reference price (lek/m²)',
      type: 'number',
      group: 'reference',
      description: 'Official cadastral rate used for tax. Not a market price.',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'referencePriceMin',
      title: 'Reference price, min (lek/m²)',
      type: 'number',
      group: 'reference',
      description: 'Use when the zone spans several cadastral zones with different rates.',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'referencePriceMax',
      title: 'Reference price, max (lek/m²)',
      type: 'number',
      group: 'reference',
      validation: (Rule) =>
        Rule.min(0).custom((value, context) => {
          const min = (context.document as {referencePriceMin?: number} | undefined)?.referencePriceMin
          if (typeof value !== 'number' || typeof min !== 'number') return true
          return value >= min ? true : 'Max must be greater than or equal to min.'
        }),
    }),
    defineField({
      name: 'referencePriceEdition',
      title: 'Reference price edition',
      type: 'string',
      group: 'reference',
      description:
        'Which schedule the figure comes from, e.g. "Udhëzim 34/2023" (Tirana) or "Edition effective 01.01.2026" (other cities). Two editions coexist — an unlabelled figure silently diverges in January.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const doc = context.document as
            | {referencePrice?: number; referencePriceMin?: number; referencePriceMax?: number}
            | undefined
          const hasReference =
            typeof doc?.referencePrice === 'number' ||
            typeof doc?.referencePriceMin === 'number' ||
            typeof doc?.referencePriceMax === 'number'
          if (!hasReference) return true
          return typeof value === 'string' && value.trim().length > 0
            ? true
            : 'Required whenever a reference price is set.'
        }),
    }),

    // --- Quality & provenance ----------------------------------------------
    defineField({
      name: 'basis',
      title: 'Basis',
      type: 'string',
      group: 'quality',
      options: {list: [...METRIC_BASIS], layout: 'radio'},
      description: 'Where the market figures come from. Asking prices are not transactions and must not be presented as such.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'confidence',
      title: 'Confidence',
      type: 'string',
      group: 'quality',
      options: {list: [...CONFIDENCE_LEVELS], layout: 'radio', direction: 'horizontal'},
      description: 'Applies to the market metrics. The reference price is official regardless.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sampleSize',
      title: 'Sample size (n)',
      type: 'number',
      group: 'quality',
      description: 'Listings behind the figures, where the source states one.',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'ratingOverall',
      title: 'DomLivo rating (1–10)',
      type: 'number',
      group: 'quality',
      description: 'Composite of investment appeal and quality of life. Publish only alongside its methodology note.',
      validation: (Rule) => Rule.min(1).max(10),
    }),
    defineField({
      name: 'sources',
      title: 'Sources',
      type: 'array',
      group: 'quality',
      of: [defineArrayMember({type: 'sourceItem'})],
      validation: (Rule) => Rule.max(30),
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'localizedText',
      group: 'quality',
      description: 'Caveats the numbers cannot carry themselves.',
    }),
  ],
  orderings: [
    {
      title: 'Period, newest first',
      name: 'periodDateDesc',
      by: [{field: 'periodDate', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      zoneEn: 'zone.title.en',
      zoneSq: 'zone.title.sq',
      period: 'periodLabel',
      basis: 'basis',
      confidence: 'confidence',
      n: 'sampleSize',
    },
    prepare({
      zoneEn,
      zoneSq,
      period,
      basis,
      confidence,
      n,
    }: {
      zoneEn?: string
      zoneSq?: string
      period?: string
      basis?: string
      confidence?: string
      n?: number
    }) {
      const dot = CONFIDENCE_DOT[confidence ?? ''] ?? '⚪'
      const parts = [period || 'no period', basis || 'no basis']
      if (typeof n === 'number') parts.push(`n=${n}`)
      return {
        title: `${dot} ${zoneEn || zoneSq || 'Zone'}`,
        subtitle: parts.join(' · '),
      }
    },
  },
})
