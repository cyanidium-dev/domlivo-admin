import {defineType, defineField} from 'sanity'

export const districtMetric = defineType({
  name: 'districtMetric',
  title: 'District Metric',
  type: 'object',

  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'value',
      title: 'Value',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
  ],

  preview: {
    select: {
      title: 'label',
      subtitle: 'value',
    },
    prepare(selection) {
      const {title, subtitle} = selection
      return {title, subtitle}
    },
  },
})
