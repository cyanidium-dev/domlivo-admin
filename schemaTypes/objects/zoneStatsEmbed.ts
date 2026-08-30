import {defineType, defineField} from 'sanity'

/**
 * Inline article block: drops a zone's price band and yield into the body.
 *
 * It stores a reference, never numbers. The figures come from whatever
 * `zoneMetrics` holds for the referenced city or district at render time, so an
 * article can never quietly contradict the zone page it links to — which is
 * exactly what happened to the hand-typed comparison tables on the city
 * landings in August.
 */
export const zoneStatsEmbed = defineType({
  name: 'zoneStatsEmbed',
  title: 'Zone stats',
  type: 'object',
  fields: [
    defineField({
      name: 'zone',
      title: 'City or district',
      type: 'reference',
      to: [{type: 'city'}, {type: 'district'}],
      validation: (Rule) => Rule.required(),
      description: 'The card renders nothing if this zone is unpublished or has no metrics.',
    }),
  ],
  preview: {
    select: {title: 'zone.title.en', slug: 'zone.slug.current'},
    prepare({title, slug}: {title?: string; slug?: string}) {
      return {title: `Zone stats: ${title || slug || '(none selected)'}`}
    },
  },
})
