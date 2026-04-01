import {defineType, defineField, defineArrayMember} from 'sanity'
import {PAGE_BUILDER_GROUPS} from '../constants/pageBuilderGroups'

export const investorLogosSection = defineType({
  name: 'investorLogosSection',
  title: 'Investor / partner logos',
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
      title: 'Section title (optional)',
      type: 'localizedString',
      group: 'content',
      description: 'Optional heading above the row.',
    }),
    defineField({
      name: 'description',
      title: 'Description (optional)',
      type: 'localizedText',
      group: 'content',
      description: 'Optional short text under the title.',
    }),
    defineField({
      name: 'agents',
      title: 'Agents',
      type: 'array',
      group: 'data',
      description:
        'Agents to show in this row (order = display order). Details come from each agent document.',
      of: [defineArrayMember({type: 'reference', to: [{type: 'agent'}]})],
      validation: (Rule) => Rule.unique().min(1).max(50),
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled', count: 'agents'},
    prepare({title, enabled, count}: {title?: string; enabled?: boolean; count?: unknown[]}) {
      const n = Array.isArray(count) ? count.length : 0
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'Investor logos') + status, subtitle: `${n} agent${n === 1 ? '' : 's'}`}
    },
  },
})
