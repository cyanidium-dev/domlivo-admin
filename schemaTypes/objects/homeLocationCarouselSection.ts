import {defineType, defineField, defineArrayMember} from 'sanity'

export const homeLocationCarouselSection = defineType({
  name: 'homeLocationCarouselSection',
  title: 'Popular Cities & Districts',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Section Title', type: 'localizedString'}),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'localizedText'}),
    defineField({name: 'cta', title: 'CTA', type: 'localizedCtaLink'}),
    defineField({
      name: 'cities',
      title: 'Selected Cities',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'city'}]})],
    }),
    defineField({
      name: 'districts',
      title: 'Selected Districts',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'district'}]})],
    }),
  ],
  preview: {
    select: {title: 'title.en'},
    prepare({title}: {title?: string}) {
      return {title: title || 'Cities & Districts', subtitle: 'Location carousel'}
    },
  },
})
