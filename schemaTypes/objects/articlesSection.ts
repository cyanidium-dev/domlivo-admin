import {defineType, defineField, defineArrayMember} from 'sanity'
import {PAGE_BUILDER_GROUPS} from '../constants/pageBuilderGroups'

export const articlesSection = defineType({
  name: 'articlesSection',
  title: 'Articles / blog preview',
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
    defineField({name: 'subtitle', title: 'Subtitle', type: 'localizedText', group: 'content'}),
    defineField({
      name: 'cta',
      title: 'Call to action (optional)',
      type: 'localizedCtaLink',
      group: 'content',
      description: 'Optional link to the blog or a category.',
    }),
    defineField({
      name: 'cardCtaLabel',
      title: 'Card button label (optional)',
      type: 'localizedString',
      group: 'content',
      description:
        'Optional per-card button label (e.g. “Read more”). If empty, the site default is used.',
    }),
    defineField({
      name: 'mode',
      title: 'Content mode',
      type: 'string',
      group: 'data',
      options: {
        list: [
          {title: 'Latest posts', value: 'latest'},
          {title: 'Selected posts', value: 'selected'},
        ],
        layout: 'radio',
      },
      initialValue: 'latest',
      description: 'Latest: newest posts by date. Selected: use the ordered list below.',
    }),
    defineField({
      name: 'posts',
      title: 'Selected posts',
      type: 'array',
      group: 'data',
      of: [defineArrayMember({type: 'reference', to: [{type: 'blogPost'}]})],
      hidden: ({parent}) => parent?.mode !== 'selected',
      description: 'When mode is Selected, add at least one post. Order here is the display order.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {mode?: string} | undefined
          if (parent?.mode !== 'selected') return true
          if (!value || !Array.isArray(value) || value.length === 0) {
            return 'Add at least one post when mode is Selected.'
          }
          return true
        }),
    }),
  ],
  preview: {
    select: {title: 'title.en', mode: 'mode', enabled: 'enabled', posts: 'posts'},
    prepare({
      title,
      mode,
      enabled,
      posts,
    }: {
      title?: string
      mode?: string
      enabled?: boolean
      posts?: unknown[]
    }) {
      const status = enabled === false ? ' (hidden)' : ''
      const n = Array.isArray(posts) ? posts.length : 0
      const sub =
        mode === 'selected' ? `Selected · ${n} post${n === 1 ? '' : 's'}` : 'Latest'
      return {
        title: (title || 'Articles') + status,
        subtitle: sub,
      }
    },
  },
})
