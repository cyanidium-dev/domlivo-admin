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
      description: 'Stable identifier used by the frontend to fetch the corresponding group.',
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'localizedString',
      description:
        'Optional override for the tab label. If empty, the frontend may fall back to default translations.',
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

