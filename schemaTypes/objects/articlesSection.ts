import {defineType, defineField, defineArrayMember} from 'sanity'

export const articlesSection = defineType({
  name: 'articlesSection',
  title: 'Articles / Blog Preview',
  type: 'object',
  fields: [
    defineField({
      name: 'enabled',
      title: 'Enabled / Visible',
      type: 'boolean',
      initialValue: true,
      description: 'If disabled, the frontend should hide this section.',
    }),
    defineField({name: 'title', title: 'Section Title', type: 'localizedString'}),
    defineField({name: 'subtitle', title: 'Subtitle / Description', type: 'localizedText'}),
    defineField({name: 'cta', title: 'CTA', type: 'localizedCtaLink'}),
    defineField({
      name: 'cardCtaLabel',
      title: 'Card CTA label (optional)',
      type: 'localizedString',
      description:
        'Optional per-card CTA label override (e.g. “Read more”). If empty, frontend may use defaults.',
    }),
    defineField({
      name: 'mode',
      title: 'Content Mode',
      type: 'string',
      options: {
        list: [
          {title: 'Latest posts', value: 'latest'},
          {title: 'Selected posts', value: 'selected'},
        ],
        layout: 'radio',
      },
      initialValue: 'latest',
      description: 'Latest: frontend fetches newest posts by publishedAt. Selected: use the list below.',
    }),
    defineField({
      name: 'posts',
      title: 'Selected Posts',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'blogPost'}]})],
      hidden: ({parent}) => parent?.mode !== 'selected',
      description: 'When mode is Selected, add at least one post. Frontend will show this exact order.',
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
    select: {title: 'title.en', mode: 'mode', enabled: 'enabled'},
    prepare({title, mode, enabled}: {title?: string; mode?: string; enabled?: boolean}) {
      const status = enabled === false ? ' (hidden)' : ''
      return {
        title: (title || 'Articles') + status,
        subtitle: mode === 'selected' ? 'Selected posts' : 'Latest posts',
      }
    },
  },
})

