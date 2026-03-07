import {defineType, defineField} from 'sanity'

export const districtStat = defineType({
  name: 'districtStat',
  title: 'District Stat',
  type: 'object',

  fields: [
    defineField({
      name: 'districtName',
      title: 'District Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'averagePricePerM2',
      title: 'Average Price per m²',
      type: 'number',
    }),

    defineField({
      name: 'averageArea',
      title: 'Average Area (m²)',
      type: 'number',
    }),

    defineField({
      name: 'popularity',
      title: 'Popularity',
      type: 'string',
    }),
  ],

  preview: {
    select: {
      title: 'districtName',
      subtitle: 'averagePricePerM2',
    },
    prepare(selection) {
      const {title, subtitle} = selection
      const subtitleStr =
        subtitle != null ? `€${Number(subtitle).toLocaleString()}/m²` : undefined
      return {title, subtitle: subtitleStr}
    },
  },
})
