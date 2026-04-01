import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * Property detail page: related blog posts (manual selection only).
 * Simpler than `articlesSection` on landing pages (no mode/titles/CTA).
 */
export const propertyArticlesSection = defineType({
  name: 'propertyArticlesSection',
  title: 'Related articles',
  type: 'object',
  description: 'Pick blog posts to show on this property page. Section labels come from the site.',

  groups: [
    {name: 'settings', title: 'Settings'},
    {name: 'data', title: 'Data', default: true},
  ],

  fields: [
    defineField({
      name: 'enabled',
      title: 'Enabled / Visible',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
      description: 'If disabled, this block is hidden on the site.',
    }),
    defineField({
      name: 'posts',
      title: 'Posts',
      type: 'array',
      group: 'data',
      of: [defineArrayMember({type: 'reference', to: [{type: 'blogPost'}]})],
      description: 'Ordered list of blog posts. Add at least one to show the section.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {enabled?: boolean} | undefined
          if (parent?.enabled === false) return true
          if (!value || !Array.isArray(value) || value.length === 0) {
            return 'Add at least one post when this block is enabled.'
          }
          return true
        }),
    }),
  ],

  preview: {
    select: {enabled: 'enabled', posts: 'posts'},
    prepare({enabled, posts}: {enabled?: boolean; posts?: unknown[]}) {
      const n = Array.isArray(posts) ? posts.length : 0
      const status = enabled === false ? ' (hidden)' : ''
      return {
        title: `Related articles${status}`,
        subtitle: `${n} post${n === 1 ? '' : 's'}`,
      }
    },
  },
})
