import {defineType, defineField} from 'sanity'

export const homePropertyCarouselTab = defineType({
  name: 'homePropertyCarouselTab',
  title: 'Property Carousel Tab',
  type: 'object',
  fields: [
    defineField({
      name: 'key',
      title: 'Key',
      type: 'string',
      options: {
        list: [
          {title: 'Popular', value: 'popular'},
          {title: 'New', value: 'new'},
          {title: 'High demand', value: 'highDemand'},
        ],
      },
      validation: (Rule) => Rule.required(),
      description: 'Tab key (popular, new, etc.). Determines which property group this tab loads.',
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'localizedString',
      description:
        'Optional tab label. If empty, default labels for each language are used.',
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

