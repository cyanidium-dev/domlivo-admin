import {defineType, defineField, defineArrayMember} from 'sanity'
import {PAGE_BUILDER_GROUPS} from '../constants/pageBuilderGroups'
import {requireLocalizedEn} from './mortgageCalcSection'

/**
 * Full purchase cost calculator: editor-maintained list of transaction cost
 * items (percent-of-price with optional EUR cap, or fixed EUR).
 * Structural initial items mirror the legal guide (notary ~0.35% capped,
 * ASHK registration, agent ~1%, legal check) — the editor rewrites them.
 */
export const purchaseCostCalcSection = defineType({
  name: 'purchaseCostCalcSection',
  title: 'Purchase cost calculator',
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
      name: 'items',
      title: 'Cost items',
      type: 'array',
      group: 'data',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'localizedString',
              validation: (Rule) =>
                Rule.required().custom(requireLocalizedEn('Item label is required (at least English).')),
            }),
            defineField({
              name: 'kind',
              title: 'Kind',
              type: 'string',
              options: {
                list: [
                  {title: '% of price', value: 'percent'},
                  {title: 'Fixed EUR', value: 'fixed'},
                ],
                layout: 'radio',
                direction: 'horizontal',
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'value',
              title: 'Value (% or EUR)',
              type: 'number',
              description: 'For "% of price" — percent (e.g. 0.35); for "Fixed EUR" — amount in EUR.',
              validation: (Rule) => Rule.required().min(0),
            }),
            defineField({
              name: 'capEur',
              title: 'Cap, EUR (optional, percent items only)',
              type: 'number',
              hidden: ({parent}) => parent?.kind !== 'percent',
              description: 'Ceiling for percent items, e.g. notary fee capped at ~€1,500 (150,000 lek).',
              validation: (Rule) => Rule.min(0),
            }),
            defineField({
              name: 'note',
              title: 'Note (optional)',
              type: 'localizedString',
              description: 'E.g. "paid by buyer by agreement". Shown as a hint on the item.',
            }),
          ],
          preview: {
            select: {labelEn: 'label.en', kind: 'kind', value: 'value'},
            prepare({labelEn, kind, value}: {labelEn?: string; kind?: string; value?: number}) {
              const v = kind === 'percent' ? `${value ?? '—'}%` : `€${value ?? '—'}`
              return {title: labelEn || 'Cost item', subtitle: v}
            },
          },
        }),
      ],
      initialValue: [
        {_type: 'object', label: {en: 'Notary (~0.35%)'}, kind: 'percent', value: 0.35, capEur: 1500},
        {_type: 'object', label: {en: 'Registration fees (ASHK)'}, kind: 'fixed', value: 60},
        {_type: 'object', label: {en: 'Agent fee (~1%)'}, kind: 'percent', value: 1},
        {_type: 'object', label: {en: 'Legal check'}, kind: 'fixed', value: 800},
      ],
      validation: (Rule) => Rule.required().min(1).max(15),
    }),
    defineField({
      name: 'disclaimer',
      title: 'Disclaimer (required)',
      type: 'localizedText',
      group: 'content',
      description:
        'Mandatory: actual costs depend on the deal; verify with a lawyer/notary. The block must not be published without it.',
      validation: (Rule) =>
        Rule.required().custom(requireLocalizedEn('Disclaimer is required (at least English).')),
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled', items: 'items'},
    prepare({title, enabled, items}: {title?: string; enabled?: boolean; items?: unknown[]}) {
      const n = Array.isArray(items) ? items.length : 0
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'Purchase cost calculator') + status, subtitle: `${n} item(s)`}
    },
  },
})
