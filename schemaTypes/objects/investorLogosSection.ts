import {defineType, defineField, defineArrayMember} from 'sanity'

export const investorLogosSection = defineType({
  name: 'investorLogosSection',
  title: 'Investor / Partner Logos (scrolling row)',
  type: 'object',
  fields: [
    defineField({
      name: 'enabled',
      title: 'Enabled / Visible',
      type: 'boolean',
      initialValue: true,
      description: 'If disabled, the frontend should hide this section.',
    }),
    defineField({
      name: 'title',
      title: 'Section title (optional)',
      type: 'localizedString',
      description: 'Optional heading above the row (e.g. “Our partners”).',
    }),
    defineField({
      name: 'description',
      title: 'Description (optional)',
      type: 'localizedText',
      description: 'Optional short text under the title.',
    }),
    defineField({
      name: 'agents',
      title: 'Agents',
      type: 'array',
      description:
        'Select agent profiles to show in this row. Order in this list is the display order — drag to reorder. Logo, photo, name, contact page slug, and social links come from each agent document (not entered manually here).',
      of: [defineArrayMember({type: 'reference', to: [{type: 'agent'}]})],
      validation: (Rule) => Rule.unique().min(1).max(50),
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled', count: 'agents'},
    prepare({title, enabled, count}: {title?: string; enabled?: boolean; count?: unknown[]}) {
      const n = Array.isArray(count) ? count.length : 0
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'Investor logos') + status, subtitle: `${n} agent(s)`}
    },
  },
})
