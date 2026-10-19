import {defineType, defineField} from 'sanity'

/**
 * Inline article block: the "get the buying guide (PDF)" card.
 *
 * The frontend renders the same lead-magnet card the Durrës listing pages
 * carry (title, edition date, e-mail form). Nothing is stored but which guide
 * to offer; the copy and the PDF live with the site.
 */
export const guideDownloadEmbed = defineType({
  name: 'guideDownloadEmbed',
  title: 'Guide download (PDF)',
  type: 'object',
  fields: [
    defineField({
      name: 'guide',
      title: 'Guide',
      type: 'string',
      options: {list: [{title: 'Durrës buying guide', value: 'durres-buying-guide'}]},
      initialValue: 'durres-buying-guide',
      validation: (Rule) => Rule.required(),
      description: 'The card renders nothing in a locale that has no PDF.',
    }),
  ],
  preview: {
    select: {guide: 'guide'},
    prepare({guide}: {guide?: string}) {
      return {title: `Guide download: ${guide || 'durres-buying-guide'}`}
    },
  },
})
