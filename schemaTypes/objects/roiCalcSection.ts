import {defineType, defineField, defineArrayMember} from 'sanity'
import {PAGE_BUILDER_GROUPS} from '../constants/pageBuilderGroups'
import {CONFIDENCE_LEVELS} from './priceTableSection'
import {requireLocalizedEn} from './mortgageCalcSection'

/**
 * Rental ROI calculator (LTR / STR). Zone presets are editor-maintained data —
 * never hardcoded on the frontend; the knowledge base only defines the shape
 * (ADR, occupancy, seasonal nights cap).
 */
export const roiCalcSection = defineType({
  name: 'roiCalcSection',
  title: 'Rental ROI calculator',
  type: 'object',
  groups: [...PAGE_BUILDER_GROUPS],
  fields: [
    defineField({
      name: 'enabled',
      title: 'Enabled / Visible',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
      description: 'If disabled, this section is hidden on the site.',
    }),
    defineField({name: 'title', title: 'Title', type: 'localizedString', group: 'content'}),
    defineField({name: 'subtitle', title: 'Subtitle (optional)', type: 'localizedText', group: 'content'}),
    defineField({
      name: 'presets',
      title: 'Zone presets',
      type: 'array',
      group: 'data',
      description:
        'Optional editor-curated presets (e.g. "Tirana center, LTR", "Saranda seafront, STR"). With no presets the calculator opens in manual mode.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'localizedString',
              validation: (Rule) =>
                Rule.required().custom(requireLocalizedEn('Preset label is required (at least English).')),
            }),
            defineField({
              name: 'rentalType',
              title: 'Rental type',
              type: 'string',
              options: {
                list: [
                  {title: 'Long-term (LTR)', value: 'ltr'},
                  {title: 'Short-term (STR)', value: 'str'},
                ],
                layout: 'radio',
                direction: 'horizontal',
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'monthlyRentEur',
              title: 'Monthly rent, EUR (LTR)',
              type: 'number',
              hidden: ({parent}) => parent?.rentalType !== 'ltr',
              validation: (Rule) => Rule.min(0),
            }),
            defineField({
              name: 'adrEur',
              title: 'ADR (average daily rate), EUR (STR)',
              type: 'number',
              hidden: ({parent}) => parent?.rentalType !== 'str',
              validation: (Rule) => Rule.min(0),
            }),
            defineField({
              name: 'occupancyPct',
              title: 'Occupancy, % (STR)',
              type: 'number',
              hidden: ({parent}) => parent?.rentalType !== 'str',
              validation: (Rule) => Rule.min(0).max(100),
            }),
            defineField({
              name: 'seasonNightsCap',
              title: 'Seasonal nights cap per year (STR, optional)',
              type: 'number',
              hidden: ({parent}) => parent?.rentalType !== 'str',
              description: 'For seasonal coastal markets: max rentable nights per year.',
              validation: (Rule) => Rule.min(1).max(365),
            }),
            defineField({
              name: 'mgmtFeePct',
              title: 'Management fee, % (optional)',
              type: 'number',
              initialValue: 20,
              validation: (Rule) => Rule.min(0).max(100),
            }),
            defineField({
              name: 'confidence',
              title: 'Confidence (optional)',
              type: 'string',
              options: {list: [...CONFIDENCE_LEVELS], layout: 'radio', direction: 'horizontal'},
            }),
          ],
          preview: {
            select: {labelEn: 'label.en', type: 'rentalType'},
            prepare({labelEn, type}: {labelEn?: string; type?: string}) {
              return {title: labelEn || 'Preset', subtitle: (type || '').toUpperCase()}
            },
          },
        }),
      ],
      validation: (Rule) => Rule.max(12),
    }),
    defineField({
      name: 'taxRatePct',
      title: 'Rental income tax, %',
      type: 'number',
      group: 'data',
      initialValue: 15,
      description: 'Albania: 15% rental income tax — both LTR and STR from 2026.',
      validation: (Rule) => Rule.min(0).max(100),
    }),
    defineField({
      name: 'disclaimer',
      title: 'Disclaimer (required)',
      type: 'localizedText',
      group: 'content',
      description:
        'Mandatory: conservative estimates, actual income varies. The block must not be published without it.',
      validation: (Rule) =>
        Rule.required().custom(requireLocalizedEn('Disclaimer is required (at least English).')),
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled', presets: 'presets'},
    prepare({title, enabled, presets}: {title?: string; enabled?: boolean; presets?: unknown[]}) {
      const n = Array.isArray(presets) ? presets.length : 0
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'ROI calculator') + status, subtitle: `${n} preset(s)`}
    },
  },
})
