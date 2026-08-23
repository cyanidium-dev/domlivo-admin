import {defineType, defineField} from 'sanity'

/**
 * Inline article block: drops an infrastructure tracker's current status into
 * the body — "Vlora airport: under construction, last checked 18.07.2026".
 *
 * Like `zoneStatsEmbed` it stores only a reference. A tracker's whole promise
 * is freshness, so an article must never carry its own copy of the status.
 */
export const trackerEmbed = defineType({
  name: 'trackerEmbed',
  title: 'Tracker',
  type: 'object',
  fields: [
    defineField({
      name: 'tracker',
      title: 'Tracker',
      type: 'reference',
      to: [{type: 'tracker'}],
      validation: (Rule) => Rule.required(),
      description: 'The card renders nothing if this tracker is unpublished.',
    }),
  ],
  preview: {
    select: {title: 'tracker.title.en', status: 'tracker.currentStatus'},
    prepare({title, status}: {title?: string; status?: string}) {
      return {
        title: `Tracker: ${title || '(none selected)'}`,
        subtitle: status || undefined,
      }
    },
  },
})
