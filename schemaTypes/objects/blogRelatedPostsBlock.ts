import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * Recommended articles block for blog post content.
 * References only `blogPost` documents.
 */
export const blogRelatedPostsBlock = defineType({
  name: 'blogRelatedPostsBlock',
  title: 'Recommended articles',
  type: 'object',

  fields: [
    defineField({
      name: 'title',
      title: 'Heading',
      type: 'localizedString',
      description: 'Optional heading shown above the recommended posts.',
    }),
    defineField({
      name: 'posts',
      title: 'Recommended posts',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'blogPost'}]})],
      validation: (Rule: any) =>
        Rule.required()
          .min(1)
          .max(6)
          .error('Choose between 1 and 6 recommended posts.'),
      description: 'Manually curated list of posts shown under “Read next”.',
    }),
  ],

  preview: {
    select: {
      title: 'title.en',
      count: 'posts',
      firstTitle: 'posts.0->title.en',
    },
    prepare({title, count, firstTitle}: {title?: string; count?: unknown[]; firstTitle?: string}) {
      const n = Array.isArray(count) ? count.length : 0
      const heading = title || 'Recommended articles'
      const detail = n > 0 && firstTitle ? `${n} posts · ${firstTitle}` : `${n} post(s)`
      return {title: heading, subtitle: detail}
    },
  },
})

