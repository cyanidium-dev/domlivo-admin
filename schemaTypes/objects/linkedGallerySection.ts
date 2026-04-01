import {defineType, defineField, defineArrayMember} from 'sanity'
import {PAGE_BUILDER_GROUPS} from '../constants/pageBuilderGroups'

export const linkedGallerySection = defineType({
  name: 'linkedGallerySection',
  title: 'Linked gallery',
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
    defineField({name: 'title', title: 'Title', type: 'localizedString', group: 'content'}),
    defineField({name: 'description', title: 'Description', type: 'localizedText', group: 'content'}),
    defineField({
      name: 'items',
      title: 'Slides',
      type: 'array',
      group: 'data',
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
              description: 'Destination when the slide is clicked.',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {title: 'title.en', media: 'image'},
            prepare({title, media}: {title?: string; media?: unknown}) {
              return {title: title || 'Slide', media}
            },
          },
        }),
      ],
      validation: (Rule) => Rule.min(1).max(50),
      description: 'Slides in display order.',
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled', count: 'items'},
    prepare({title, enabled, count}: {title?: string; enabled?: boolean; count?: unknown[]}) {
      const n = Array.isArray(count) ? count.length : 0
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'Linked gallery') + status, subtitle: `${n} slide${n === 1 ? '' : 's'}`}
    },
  },
})
