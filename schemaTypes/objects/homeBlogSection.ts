import {defineType, defineField, defineArrayMember} from 'sanity'

export const homeBlogSection = defineType({
  name: 'homeBlogSection',
  title: 'Blog Preview',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Section Title', type: 'localizedString'}),
    defineField({name: 'subtitle', title: 'Subtitle / Description', type: 'localizedText'}),
    defineField({name: 'cta', title: 'CTA', type: 'localizedCtaLink'}),
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
      description:
        'Latest: frontend fetches newest posts by publishedAt. Selected: use the list below.',
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
    select: {title: 'title.en', mode: 'mode'},
    prepare({title, mode}: {title?: string; mode?: string}) {
      return {title: title || 'Blog', subtitle: mode === 'selected' ? 'Selected' : 'Latest'}
    },
  },
})
