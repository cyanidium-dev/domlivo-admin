import {defineType, defineField, defineArrayMember} from 'sanity'

export const homePropertyCarouselSection = defineType({
  name: 'homePropertyCarouselSection',
  title: 'Top / Featured Properties',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Section Title', type: 'localizedString'}),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'localizedText'}),
    defineField({name: 'cta', title: 'CTA', type: 'localizedCtaLink'}),
    defineField({
      name: 'mode',
      title: 'Content Mode',
      type: 'string',
      options: {
        list: [
          {title: 'Auto (featured/popular)', value: 'auto'},
          {title: 'Selected properties', value: 'selected'},
        ],
        layout: 'radio',
      },
      initialValue: 'auto',
      description:
        'Auto: frontend fetches featured/popular properties from API. Selected: use the list below.',
    }),
    defineField({
      name: 'properties',
      title: 'Selected Properties',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'property'}]})],
      hidden: ({parent}) => parent?.mode !== 'selected',
      description: 'When mode is Selected, add at least one property. Frontend will show this exact list.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {mode?: string} | undefined
          if (parent?.mode !== 'selected') return true
          if (!value || !Array.isArray(value) || value.length === 0) {
            return 'Add at least one property when mode is Selected.'
          }
          return true
        }),
    }),
  ],
  preview: {
    select: {title: 'title.en', mode: 'mode'},
    prepare({title, mode}: {title?: string; mode?: string}) {
      return {title: title || 'Properties', subtitle: mode === 'selected' ? 'Selected' : 'Auto'}
    },
  },
})
