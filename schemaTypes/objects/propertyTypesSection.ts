import {defineType, defineField, defineArrayMember} from 'sanity'
import {PAGE_BUILDER_GROUPS} from '../constants/pageBuilderGroups'

export const propertyTypesSection = defineType({
  name: 'propertyTypesSection',
  title: 'Property types',
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
    }),
    defineField({
      name: 'propertyTypes',
      title: 'Property types',
      type: 'array',
      group: 'data',
      of: [defineArrayMember({type: 'reference', to: [{type: 'propertyType'}]})],
      description:
        'Leave empty to show all active types. Otherwise only these types appear, in this order.',
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled', propertyTypes: 'propertyTypes'},
    prepare({
      title,
      enabled,
      propertyTypes,
    }: {
      title?: string
      enabled?: boolean
      propertyTypes?: unknown[]
    }) {
      const status = enabled === false ? ' (hidden)' : ''
      const n = Array.isArray(propertyTypes) ? propertyTypes.length : 0
      const sub = n > 0 ? `${n} selected` : 'All active'
      return {title: (title || 'Property types') + status, subtitle: sub}
    },
  },
})
