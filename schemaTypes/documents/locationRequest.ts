import {defineType, defineField} from 'sanity'

/**
 * A city or district a listing named that the catalogue does not have.
 *
 * Unlike an amenity, a zone cannot be stubbed by intake: it carries a country
 * reference, a slug that becomes a public route, SEO copy and metrics, and it
 * only goes live through the readiness gate in
 * SPEC-zone-generation-2026-08-16.md. So intake leaves the field empty — the
 * listing cannot be published without a city anyway — and records this, with
 * the listings that asked for it, for staff to act on with the zone tooling
 * (`npm run create:zone-shells`).
 *
 * The id is derived from kind + folded name, so the same place asked for twice
 * is one row with a count.
 */
export const locationRequest = defineType({
  name: 'locationRequest',
  title: 'Location request',
  type: 'document',

  fields: [
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      readOnly: true,
      options: {list: [{title: 'City', value: 'city'}, {title: 'District', value: 'district'}]},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Name as parsed',
      type: 'string',
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'normalized',
      title: 'Match key',
      type: 'string',
      readOnly: true,
      description: 'Case- and separator-blind form of the name. Identity for de-duplication.',
    }),
    defineField({
      name: 'count',
      title: 'Times requested',
      type: 'number',
      readOnly: true,
      description: 'How many listings have named this place. Ranks the queue; it decides nothing on its own.',
    }),
    defineField({name: 'firstSeen', title: 'First seen', type: 'datetime', readOnly: true}),
    defineField({name: 'lastSeen', title: 'Last seen', type: 'datetime', readOnly: true}),
    defineField({
      name: 'examples',
      title: 'Asked for by',
      type: 'array',
      of: [{type: 'string'}],
      readOnly: true,
      description: 'Listing titles that named this place, for context while deciding.',
    }),
    defineField({
      name: 'source',
      title: 'Came from',
      type: 'string',
      readOnly: true,
      options: {list: [{title: 'Telegram intake', value: 'telegram'}, {title: 'Studio parse', value: 'studio'}]},
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'new',
      options: {
        list: [
          {title: 'Needs a decision', value: 'new'},
          {title: 'Zone created', value: 'created'},
          {title: 'Not a real place / rejected', value: 'rejected'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 3,
      description: 'Why it was rejected, or which zone was created for it.',
    }),
  ],

  orderings: [{title: 'Most requested first', name: 'countDesc', by: [{field: 'count', direction: 'desc'}]}],

  preview: {
    select: {name: 'name', kind: 'kind', count: 'count', status: 'status'},
    prepare({name, kind, count, status}) {
      const label: Record<string, string> = {
        new: 'needs a decision',
        created: 'zone created',
        rejected: 'rejected',
      }
      return {
        title: `${name || 'Unnamed'} (${kind ?? 'location'})`,
        subtitle: `asked ${count ?? 1}× · ${label[status as string] ?? status}`,
      }
    },
  },
})
