import {defineType, defineField, defineArrayMember} from 'sanity'

export const linkedGallerySection = defineType({
  name: 'linkedGallerySection',
  title: 'Linked Gallery (Slider)',
  type: 'object',
  fields: [
    defineField({name: 'enabled', title: 'Enabled / Visible', type: 'boolean', initialValue: true}),
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({name: 'description', title: 'Description', type: 'localizedText'}),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'title', title: 'Title (optional)', type: 'localizedString'}),
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: {hotspot: true},
              fields: [{name: 'alt', type: 'string', title: 'Alternative text'}],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'href',
              title: 'Link URL',
              type: 'string',
              description: 'Where this slide goes when clicked (district catalog, property page, etc.).',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {title: 'title.en', media: 'image'},
            prepare({title, media}: {title?: string; media?: unknown}) {
              return {title: title || 'Gallery item', media}
            },
          },
        }),
      ],
      validation: (Rule) => Rule.min(1).max(50),
      description: 'Slider items. Frontend should render in this exact order.',
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled', count: 'items'},
    prepare({title, enabled, count}: {title?: string; enabled?: boolean; count?: unknown[]}) {
      const n = Array.isArray(count) ? count.length : 0
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'Linked gallery') + status, subtitle: `${n} item(s)`}
    },
  },
})

