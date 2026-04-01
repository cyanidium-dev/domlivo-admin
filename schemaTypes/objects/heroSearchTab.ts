import {defineType, defineField} from 'sanity'

export const heroSearchTab = defineType({
  name: 'heroSearchTab',
  title: 'Hero Search Tab',
  type: 'object',
  fields: [
    defineField({
      name: 'key',
      title: 'Key',
      type: 'string',
      options: {
        list: [
          {title: 'Sale', value: 'sale'},
          {title: 'Rent', value: 'rent'},
          {title: 'Short-term', value: 'shortTerm'},
        ],
      },
      validation: (Rule) => Rule.required(),
      description: 'Search category key (sale, rent, etc.). Maps to how this tab filters listings.',
    }),
    defineField({
      name: 'label',
      title: 'Label (optional override)',
      type: 'localizedString',
      description: 'Optional label per language. If empty, default labels are used.',
    }),
    defineField({
      name: 'enabled',
      title: 'Enabled',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {key: 'key', enabled: 'enabled', label: 'label.en'},
    prepare({key, enabled, label}: {key?: string; enabled?: boolean; label?: string}) {
      const status = enabled === false ? ' (disabled)' : ''
      return {title: (label || key || 'Tab') + status}
    },
  },
})

