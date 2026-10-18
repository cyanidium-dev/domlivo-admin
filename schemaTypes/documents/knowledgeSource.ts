import {defineType, defineField} from 'sanity'
import {
  KNOWLEDGE_CONFIDENCE,
  KNOWLEDGE_SOURCE_TYPES,
  SOURCE_ID_PATTERN,
  SOURCE_TYPE_RANK,
} from '../constants/knowledge'

/**
 * One publication a fact can be traced to: a regulator's tariff table, an
 * INSTAT release, an agency's market report, a marketplace listing page.
 *
 * Sources are never edited into something else — a new edition of the same
 * tariff table is a new source document with its own `sourceId`, so a citation
 * printed last year still resolves to what it said then. `archivedUrl` matters
 * for exactly that reason: Albanian ministry PDFs move.
 */
export const knowledgeSource = defineType({
  name: 'knowledgeSource',
  title: 'Knowledge · Source',
  type: 'document',
  groups: [
    {name: 'identity', title: 'Identity', default: true},
    {name: 'dates', title: 'Dates & trust'},
    {name: 'notes', title: 'Notes'},
  ],
  fields: [
    defineField({
      name: 'sourceId',
      title: 'Source ID',
      type: 'string',
      group: 'identity',
      description:
        'Stable citation key, e.g. ELEC-ALB-2026-001. Topic-Geo-Year-NNN. Never reused, never renamed.',
      validation: (Rule) =>
        Rule.required().custom((value) =>
          typeof value === 'string' && SOURCE_ID_PATTERN.test(value)
            ? true
            : 'Use the pattern TOPIC-GEO-YEAR-NNN in capitals, e.g. WATER-DURRES-2026-001',
        ),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'identity',
      description: 'Title of the publication as it appears on the page.',
      validation: (Rule) => Rule.required().max(300),
    }),
    defineField({
      name: 'publisher',
      title: 'Publisher',
      type: 'string',
      group: 'identity',
      description: 'Organisation behind it: ERE, INSTAT, Bank of Albania, Monitor.al…',
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      group: 'identity',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'archivedUrl',
      title: 'Archived copy',
      type: 'url',
      group: 'identity',
      description: 'web.archive.org snapshot or mirror. Ministry PDFs move; citations should not break.',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'sourceType',
      title: 'Source type',
      type: 'string',
      group: 'identity',
      options: {list: [...KNOWLEDGE_SOURCE_TYPES]},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'priorityRank',
      title: 'Priority rank',
      type: 'number',
      group: 'identity',
      readOnly: true,
      description: 'Derived from the source type on import (1 = government … 9 = forum).',
      validation: (Rule) => Rule.min(1).max(9),
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      group: 'identity',
      options: {
        list: [
          {title: 'Albanian', value: 'sq'},
          {title: 'English', value: 'en'},
          {title: 'Italian', value: 'it'},
          {title: 'Russian', value: 'ru'},
          {title: 'Other', value: 'other'},
        ],
      },
    }),
    defineField({
      name: 'geography',
      title: 'Geography',
      type: 'string',
      group: 'identity',
      description: 'What the source covers: Albania, Durrës, Vlorë…',
    }),
    defineField({
      name: 'dataPeriod',
      title: 'Data period',
      type: 'string',
      group: 'dates',
      description: 'Period the source describes, e.g. 2026, 2025-Q4, 2026-07. Not the publication date.',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published',
      type: 'date',
      group: 'dates',
      description: 'Leave empty for undated live pages (provider price lists, retailer pages).',
    }),
    defineField({
      name: 'accessedAt',
      title: 'Accessed',
      type: 'date',
      group: 'dates',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'lastVerifiedAt',
      title: 'Last verified',
      type: 'date',
      group: 'dates',
      description: 'Last time someone opened the page and confirmed the numbers still match.',
    }),
    defineField({
      name: 'defaultConfidence',
      title: 'Default confidence',
      type: 'string',
      group: 'dates',
      options: {list: [...KNOWLEDGE_CONFIDENCE]},
      description: 'Facts inherit this unless they set their own.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'What it gives',
      type: 'text',
      rows: 2,
      group: 'notes',
      description: 'One line: which numbers were taken from here.',
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 3,
      group: 'notes',
    }),
  ],
  preview: {
    select: {sourceId: 'sourceId', name: 'name', type: 'sourceType', published: 'publishedAt'},
    prepare({sourceId, name, type, published}) {
      const rank = SOURCE_TYPE_RANK[type as string]
      return {
        title: `${sourceId} · ${name}`,
        subtitle: [rank ? `P${rank}` : null, type, published].filter(Boolean).join(' · '),
      }
    },
  },
  orderings: [
    {
      title: 'Source ID',
      name: 'sourceIdAsc',
      by: [{field: 'sourceId', direction: 'asc'}],
    },
    {
      title: 'Least recently verified',
      name: 'verifiedAsc',
      by: [{field: 'lastVerifiedAt', direction: 'asc'}],
    },
  ],
})
