import {defineType, defineField} from 'sanity'

export const seoTextSection = defineType({
  name: 'seoTextSection',
  title: 'SEO Text (Rich)',
  type: 'object',
  fields: [
    defineField({name: 'enabled', title: 'Enabled / Visible', type: 'boolean', initialValue: true}),
    defineField({
      name: 'content',
      title: 'SEO Content',
      type: 'localizedBlockContent',
      description: 'Long-form SEO text. Supports internal links and rich blocks per locale.',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {enabled: 'enabled'},
    prepare({enabled}: {enabled?: boolean}) {
      const status = enabled === false ? ' (hidden)' : ''
      return {title: `SEO Text${status}`}
    },
  },
})

