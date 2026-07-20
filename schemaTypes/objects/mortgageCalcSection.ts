import {defineType, defineField} from 'sanity'
import {PAGE_BUILDER_GROUPS} from '../constants/pageBuilderGroups'

/** Requires at least the English text of a localized field (pattern of localizedCtaLink). */
export const requireLocalizedEn =
  (message: string) =>
  (value: unknown): true | string => {
    const en = (value as {en?: string} | undefined)?.en
    return String(en || '').trim() ? true : message
  }

/**
 * Mortgage calculator (annuity). Interactive client block; all defaults and
 * slider bounds come from this schema, not from frontend code.
 */
export const mortgageCalcSection = defineType({
  name: 'mortgageCalcSection',
  title: 'Mortgage calculator',
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
      name: 'defaultRatePct',
      title: 'Default annual rate, %',
      type: 'number',
      group: 'data',
      initialValue: 5.5,
      description: 'Albania 2026: EUR mortgages 3.5–5.5%, ALL 5–7%, non-residents 4.5–7.5%.',
      validation: (Rule) => Rule.min(0).max(30),
    }),
    defineField({
      name: 'minRatePct',
      title: 'Rate slider minimum, %',
      type: 'number',
      group: 'data',
      initialValue: 2,
      validation: (Rule) => Rule.min(0).max(30),
    }),
    defineField({
      name: 'maxRatePct',
      title: 'Rate slider maximum, %',
      type: 'number',
      group: 'data',
      initialValue: 12,
      validation: (Rule) => Rule.min(0).max(30),
    }),
    defineField({
      name: 'maxLtvPct',
      title: 'Max LTV, %',
      type: 'number',
      group: 'data',
      initialValue: 85,
      description:
        'Bank of Albania macroprudential caps (from 01.07.2025): 85% first home, 80% second home, 70–75% FX loans to non-residents.',
      validation: (Rule) => Rule.min(10).max(100),
    }),
    defineField({
      name: 'defaultTermYears',
      title: 'Default term, years',
      type: 'number',
      group: 'data',
      initialValue: 20,
      validation: (Rule) => Rule.min(1).max(40),
    }),
    defineField({
      name: 'maxTermYears',
      title: 'Max term, years',
      type: 'number',
      group: 'data',
      initialValue: 30,
      validation: (Rule) => Rule.min(5).max(40),
    }),
    defineField({
      name: 'disclaimer',
      title: 'Disclaimer (required)',
      type: 'localizedText',
      group: 'content',
      description:
        'Mandatory: rates are indicative, the bank decides individually. The block must not be published without it.',
      validation: (Rule) =>
        Rule.required().custom(requireLocalizedEn('Disclaimer is required (at least English).')),
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled', rate: 'defaultRatePct'},
    prepare({title, enabled, rate}: {title?: string; enabled?: boolean; rate?: number}) {
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'Mortgage calculator') + status, subtitle: `default rate ${rate ?? '—'}%`}
    },
  },
})
