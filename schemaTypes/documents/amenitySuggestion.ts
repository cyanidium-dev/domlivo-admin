import {defineType, defineField} from 'sanity'

/**
 * An amenity name a parsed listing used that the matcher could not place.
 *
 * Nothing here reaches the catalogue on its own: a reviewer either maps the
 * name onto an existing amenity (which appends it to that amenity's aliases,
 * so the next listing resolves) or creates a new amenity as a draft, or
 * rejects it. See SPEC-amenity-queue-and-slug-collisions-2026-08-22.md.
 *
 * The document id is derived from `normalized`, so recording a hit is
 * createIfNotExists + inc(count) — no read, no race, and the same name from two
 * editors lands on one row.
 */
export const amenitySuggestion = defineType({
  name: 'amenitySuggestion',
  title: 'Amenity suggestion',
  type: 'document',

  fields: [
    defineField({
      name: 'name',
      title: 'Name as parsed',
      type: 'string',
      readOnly: true,
      validation: (Rule) => Rule.required(),
      description: 'Exactly what the listing parser produced.',
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
      title: 'Times seen',
      type: 'number',
      readOnly: true,
      initialValue: 1,
      description: 'How many parsed listings have used this wording. Ranks the queue — it never approves anything.',
    }),

    defineField({name: 'firstSeen', title: 'First seen', type: 'datetime', readOnly: true}),
    defineField({name: 'lastSeen', title: 'Last seen', type: 'datetime', readOnly: true}),

    defineField({
      name: 'examples',
      title: 'Seen on',
      type: 'array',
      of: [{type: 'string'}],
      readOnly: true,
      description: 'Up to five listing titles this wording came from, for context while reviewing.',
    }),

    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'new',
      options: {
        list: [
          {title: 'Needs review', value: 'new'},
          {title: 'Mapped to an existing amenity', value: 'mapped'},
          {title: 'Created as a new amenity', value: 'created'},
          {title: 'Rejected', value: 'rejected'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'mapTo',
      title: 'Map to existing amenity',
      type: 'reference',
      to: [{type: 'amenity'}],
      description:
        'Pick the amenity this wording means, then press "Apply mapping" — it is added to that amenity\'s aliases and the intake resolves it from then on.',
    }),

    defineField({
      name: 'createdAmenity',
      title: 'Created amenity',
      type: 'reference',
      to: [{type: 'amenity'}],
      readOnly: true,
      weak: true,
      description: 'Set by the "Create amenity" action. The new amenity starts as a draft — translate it and pick an icon before publishing.',
    }),
  ],

  orderings: [
    {
      title: 'Most seen first',
      name: 'countDesc',
      by: [{field: 'count', direction: 'desc'}],
    },
  ],

  preview: {
    select: {name: 'name', count: 'count', status: 'status', mapped: 'mapTo.title.en'},
    prepare({name, count, status, mapped}) {
      const label: Record<string, string> = {
        new: 'needs review',
        mapped: `mapped → ${mapped ?? 'an amenity'}`,
        created: 'created',
        rejected: 'rejected',
      }
      return {
        title: name || 'Untitled suggestion',
        subtitle: `seen ${count ?? 1}× · ${label[status as string] ?? status}`,
      }
    },
  },
})
