import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * FAQ block for blog posts.
 * Embeddable FAQ section within article content.
 */
export const blogFaqBlock = defineType({
  name: 'blogFaqBlock',
  title: 'FAQ block',
  type: 'object',

  fields: [
    defineField({
      name: 'title',
      title: 'Section title',
      type: 'localizedString',
      description: 'Optional heading for the FAQ section (e.g. "Frequently Asked Questions").',
    }),
    defineField({
      name: 'items',
      title: 'FAQ items',
      type: 'array',
      of: [defineArrayMember({type: 'localizedFaqItem'})],
      validation: (Rule) => Rule.required().min(1).max(20),
    }),
  ],

  preview: {
    select: {title: 'title.en', count: 'items'},
    prepare({title, count}: {title?: string; count?: unknown[]}) {
      const n = Array.isArray(count) ? count.length : 0
      return {
        title: title || 'FAQ block',
        subtitle: `${n} question(s)`,
      }
    },
  },
})
