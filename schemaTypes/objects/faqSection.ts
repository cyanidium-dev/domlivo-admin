import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * Canonical FAQ section for all landings.
 * Supports both legacy/simple FAQ items and rich FAQ items.
 */
export const faqSection = defineType({
  name: 'faqSection',
  title: 'FAQ',
  type: 'object',
  fields: [
    defineField({name: 'enabled', title: 'Enabled / Visible', type: 'boolean', initialValue: true}),
    defineField({name: 'title', title: 'Section Title', type: 'localizedString'}),
    defineField({
      name: 'items',
      title: 'FAQ Items',
      type: 'array',
      of: [defineArrayMember({type: 'localizedFaqItem'}), defineArrayMember({type: 'localizedFaqItemRich'})],
      validation: (Rule) => Rule.min(1).max(50),
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled', count: 'items'},
    prepare({title, enabled, count}: {title?: string; enabled?: boolean; count?: unknown[]}) {
      const n = Array.isArray(count) ? count.length : 0
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'FAQ') + status, subtitle: `${n} item(s)`}
    },
  },
})

