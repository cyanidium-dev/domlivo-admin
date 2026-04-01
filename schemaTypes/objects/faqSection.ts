import {defineType, defineField, defineArrayMember} from 'sanity'
import {PAGE_BUILDER_GROUPS} from '../constants/pageBuilderGroups'

/** FAQ section: simple or rich Q&A items per locale. */
export const faqSection = defineType({
  name: 'faqSection',
  title: 'FAQ',
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
    defineField({name: 'title', title: 'Section title', type: 'localizedString', group: 'content'}),
    defineField({
      name: 'imageMode',
      title: 'Image',
      type: 'string',
      group: 'layout',
      options: {
        layout: 'radio',
        list: [
          {value: 'withImage', title: 'With image'},
          {value: 'withoutImage', title: 'Without image'},
        ],
      },
      initialValue: 'withoutImage',
    }),
    defineField({
      name: 'image',
      title: 'Section image',
      type: 'image',
      group: 'media',
      hidden: ({parent}) => parent?.imageMode !== 'withImage',
    }),
    defineField({
      name: 'items',
      title: 'Questions & answers',
      type: 'array',
      group: 'data',
      of: [defineArrayMember({type: 'localizedFaqItem'}), defineArrayMember({type: 'localizedFaqItemRich'})],
      validation: (Rule) => Rule.min(1).max(50),
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled', count: 'items'},
    prepare({title, enabled, count}: {title?: string; enabled?: boolean; count?: unknown[]}) {
      const n = Array.isArray(count) ? count.length : 0
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'FAQ') + status, subtitle: `${n} item${n === 1 ? '' : 's'}`}
    },
  },
})
