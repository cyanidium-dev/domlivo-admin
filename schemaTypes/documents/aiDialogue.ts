import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * One conversation with the site assistant — search or a single listing.
 *
 * Written only by `/api/ai/chat` on the website (`src/lib/ai/dialogueLog.ts`),
 * a turn at a time, after the visitor's answer has already been delivered.
 * Everything here is read-only in the Studio: editing a transcript would make
 * it evidence of nothing.
 *
 * Retention: the website cron `/api/cron/prune-ai-dialogues` deletes documents
 * whose `updatedAt` is older than 90 days, which is the period the privacy
 * policy states. Do not keep a copy elsewhere without revisiting that.
 */
export const aiDialogue = defineType({
  name: 'aiDialogue',
  title: 'AI dialogue',
  type: 'document',
  description:
    'Transcript of one conversation with the assistant. Written by the website; read-only here. Deleted automatically after 90 days.',

  fields: [
    defineField({
      name: 'sessionId',
      title: 'Session id',
      type: 'string',
      readOnly: true,
      description: 'Identifies one browser tab conversation. Not a person and not stable across visits.',
    }),
    defineField({
      name: 'surface',
      title: 'Where',
      type: 'string',
      readOnly: true,
      options: {
        list: [
          {title: 'AI search', value: 'search'},
          {title: 'Listing page', value: 'property'},
        ],
      },
    }),
    defineField({
      name: 'propertySlug',
      title: 'Listing',
      type: 'string',
      readOnly: true,
      description: 'Slug of the listing the conversation was about. Empty for catalog-wide search.',
      hidden: ({document}) => document?.surface !== 'property',
    }),
    defineField({
      name: 'locale',
      title: 'Language',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'country',
      title: 'Country',
      type: 'string',
      readOnly: true,
      description: 'Two-letter code from the CDN edge. No IP address is stored.',
    }),
    defineField({
      name: 'turns',
      title: 'Exchanges',
      type: 'array',
      readOnly: true,
      description: 'Up to 20 exchanges; a longer conversation keeps counting but stops transcribing.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'aiDialogueTurn',
          title: 'Exchange',
          fields: [
            defineField({name: 'at', title: 'At', type: 'datetime', readOnly: true}),
            defineField({name: 'question', title: 'Visitor', type: 'text', rows: 3, readOnly: true}),
            defineField({name: 'answer', title: 'Assistant', type: 'text', rows: 8, readOnly: true}),
            defineField({
              name: 'shownSlugs',
              title: 'Listings shown',
              type: 'array',
              of: [defineArrayMember({type: 'string'})],
              readOnly: true,
            }),
            defineField({
              name: 'citedIds',
              title: 'Facts cited',
              type: 'array',
              of: [defineArrayMember({type: 'string'})],
              readOnly: true,
              description: 'knowledgeFact dataIds the assistant cited in this answer.',
            }),
          ],
          preview: {
            select: {title: 'question', subtitle: 'answer'},
            prepare: ({title, subtitle}: {title?: string; subtitle?: string}) => ({
              title: title || '—',
              subtitle: subtitle ? subtitle.slice(0, 120) : '',
            }),
          },
        }),
      ],
    }),
    defineField({
      name: 'turnCount',
      title: 'Exchanges (counted)',
      type: 'number',
      readOnly: true,
      description: 'Counts every exchange, including any past the transcription cap.',
    }),
    defineField({
      name: 'estimatedUsd',
      title: 'Estimated cost, USD',
      type: 'number',
      readOnly: true,
    }),
    defineField({
      name: 'startedAt',
      title: 'Started',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'updatedAt',
      title: 'Last message',
      type: 'datetime',
      readOnly: true,
      description: 'What retention is measured from.',
    }),
  ],

  orderings: [
    {
      title: 'Newest first',
      name: 'updatedAtDesc',
      by: [{field: 'updatedAt', direction: 'desc'}],
    },
    {
      title: 'Longest first',
      name: 'turnCountDesc',
      by: [{field: 'turnCount', direction: 'desc'}],
    },
  ],

  preview: {
    select: {
      turns: 'turns',
      surface: 'surface',
      propertySlug: 'propertySlug',
      locale: 'locale',
      country: 'country',
      turnCount: 'turnCount',
      updatedAt: 'updatedAt',
    },
    prepare: (selection: Record<string, unknown>) => {
      const turns = Array.isArray(selection.turns) ? (selection.turns as {question?: string}[]) : []
      const first = turns[0]?.question?.trim()
      const where =
        selection.surface === 'property' ? String(selection.propertySlug ?? 'listing') : 'search'
      const parts = [
        where,
        String(selection.locale ?? ''),
        selection.country ? String(selection.country) : '',
        `${Number(selection.turnCount ?? turns.length)} turns`,
        selection.updatedAt ? String(selection.updatedAt).slice(0, 16).replace('T', ' ') : '',
      ].filter(Boolean)
      return {
        title: first || '(no question recorded)',
        subtitle: parts.join(' · '),
      }
    },
  },
})
