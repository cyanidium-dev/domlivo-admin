import {defineType, defineField} from 'sanity'

/**
 * Single numeric/string stat shown in the SEO editorial stat-strip.
 * Used as array member in seoTextSection.stats.
 */
export const seoStat = defineType({
  name: 'seoStat',
  title: 'SEO stat',
  type: 'object',
  fields: [
    defineField({
      name: 'value',
      title: 'Value',
      type: 'string',
      description: 'Display value, e.g. "+73%", "6.8%", "8,200".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'localizedString',
      description: 'Short caption shown under the value.',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {value: 'value', label: 'label.en'},
    prepare({value, label}: {value?: string; label?: string}) {
      return {title: value || 'Stat', subtitle: label || ''}
    },
  },
})
