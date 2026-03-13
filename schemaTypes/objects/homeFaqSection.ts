import {defineType, defineField, defineArrayMember} from 'sanity'

export const homeFaqSection = defineType({
  name: 'homeFaqSection',
  title: 'FAQ',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Section Title', type: 'localizedString'}),
    defineField({
      name: 'items',
      title: 'FAQ Items',
      type: 'array',
      of: [defineArrayMember({type: 'localizedFaqItem'})],
      validation: (Rule) => Rule.min(1).max(20),
    }),
  ],
  preview: {
    select: {title: 'title.en', count: 'items'},
    prepare({title, count}: {title?: string; count?: unknown[]}) {
      const n = Array.isArray(count) ? count.length : 0
      return {title: title || 'FAQ', subtitle: `${n} item(s)`}
    },
  },
})
