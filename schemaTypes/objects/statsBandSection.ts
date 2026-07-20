import {defineType, defineField, defineArrayMember} from 'sanity'
import {PAGE_BUILDER_GROUPS} from '../constants/pageBuilderGroups'
import {CONFIDENCE_LEVELS} from './priceTableSection'

/**
 * Key figures band: 2–6 large numbers with labels, optional trend arrows and
 * confidence dots. Mirrors the "executive summary" format of the research base.
 */
export const statsBandSection = defineType({
  name: 'statsBandSection',
  title: 'Key figures band',
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
    defineField({
      name: 'title',
      title: 'Title (optional)',
      type: 'localizedString',
      group: 'content',
    }),
    defineField({
      name: 'items',
      title: 'Figures',
      type: 'array',
      group: 'data',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'value',
              title: 'Value',
              type: 'string',
              description: 'The figure as displayed, e.g. "€1,863/м²" or "+28%". Same for all languages.',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'label',
              title: 'Label',
              type: 'localizedString',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'sublabel',
              title: 'Sublabel (optional)',
              type: 'localizedString',
            }),
            defineField({
              name: 'trend',
              title: 'Trend (optional)',
              type: 'string',
              options: {
                list: [
                  {title: 'Up', value: 'up'},
                  {title: 'Down', value: 'down'},
                  {title: 'Flat', value: 'flat'},
                ],
                layout: 'radio',
                direction: 'horizontal',
              },
            }),
            defineField({
              name: 'confidence',
              title: 'Confidence (optional)',
              type: 'string',
              options: {list: [...CONFIDENCE_LEVELS], layout: 'radio', direction: 'horizontal'},
            }),
          ],
          preview: {
            select: {value: 'value', labelEn: 'label.en', labelSq: 'label.sq'},
            prepare({value, labelEn, labelSq}: {value?: string; labelEn?: string; labelSq?: string}) {
              return {title: value || 'Figure', subtitle: labelEn || labelSq || ''}
            },
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(2).max(6),
    }),
    defineField({
      name: 'sourceNote',
      title: 'Source note',
      type: 'localizedString',
      group: 'content',
      description: 'Short attribution shown under the band.',
    }),
    defineField({
      name: 'lastUpdated',
      title: 'Last updated',
      type: 'date',
      group: 'content',
      description: 'Shown as "Updated: {date}" under the band.',
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled', items: 'items'},
    prepare({title, enabled, items}: {title?: string; enabled?: boolean; items?: unknown[]}) {
      const n = Array.isArray(items) ? items.length : 0
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'Key figures') + status, subtitle: `${n} figure(s)`}
    },
  },
})
