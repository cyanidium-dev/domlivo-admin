import {defineType, defineField, defineArrayMember} from 'sanity'
import {requireLocalizedEn} from '../objects/mortgageCalcSection'

export const TRACKER_STATUSES = [
  {title: 'On track', value: 'onTrack'},
  {title: 'Delayed', value: 'delayed'},
  {title: 'Blocked', value: 'blocked'},
  {title: 'Done', value: 'done'},
] as const

const STATUS_DOT: Record<string, string> = {
  onTrack: '🟢',
  delayed: '🟡',
  blocked: '🔴',
  done: '🔵',
}

/**
 * Status tracker: one continuously-maintained fact sheet ("what is happening
 * with X right now") rendered on landings via `trackerSection`.
 * Shape mirrors the research base `08-infrastructure`: status + AEO summary +
 * dated event timeline with sources.
 */
export const tracker = defineType({
  name: 'tracker',
  title: 'Tracker',
  type: 'document',
  groups: [
    {name: 'basic', title: 'Basic', default: true},
    {name: 'timeline', title: 'Timeline'},
    {name: 'extras', title: 'FAQ & Sources'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      group: 'basic',
      validation: (Rule) => Rule.required().custom(requireLocalizedEn('Title is required (at least English).')),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'basic',
      options: {
        source: (doc: Record<string, unknown>) => (doc?.title as {en?: string} | undefined)?.en ?? '',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isPublished',
      title: 'Published',
      type: 'boolean',
      group: 'basic',
      initialValue: true,
    }),
    defineField({
      name: 'subject',
      title: 'Subject',
      type: 'localizedString',
      group: 'basic',
      description: 'One line: what is being tracked (e.g. "Vlora airport construction").',
    }),
    defineField({
      name: 'currentStatus',
      title: 'Current status',
      type: 'string',
      group: 'basic',
      options: {list: [...TRACKER_STATUSES], layout: 'radio', direction: 'horizontal'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'statusLabel',
      title: 'Status label override (optional)',
      type: 'localizedString',
      group: 'basic',
      description: 'Human-readable status when the default enum label is not enough.',
    }),
    defineField({
      name: 'statusSummary',
      title: 'Status summary',
      type: 'localizedText',
      group: 'basic',
      description: '2–4 sentences: the direct AEO answer to "what is happening right now".',
      validation: (Rule) =>
        Rule.required().custom(requireLocalizedEn('Status summary is required (at least English).')),
    }),
    defineField({
      name: 'lastCheckedAt',
      title: 'Last checked at',
      type: 'date',
      group: 'basic',
      description: 'When the facts were last verified. Shown as "Checked: {date}".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'timeline',
      title: 'Timeline',
      type: 'array',
      group: 'timeline',
      description: 'Dated events, newest first.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'date',
              title: 'Date',
              type: 'date',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'event',
              title: 'Event',
              type: 'localizedText',
              validation: (Rule) =>
                Rule.required().custom(requireLocalizedEn('Event text is required (at least English).')),
            }),
            defineField({
              name: 'sourceUrl',
              title: 'Source URL (optional)',
              type: 'url',
              validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
            }),
          ],
          preview: {
            select: {date: 'date', eventEn: 'event.en'},
            prepare({date, eventEn}: {date?: string; eventEn?: string}) {
              return {title: `${date ?? '—'} — ${eventEn ?? 'Event'}`}
            },
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(1).max(50),
    }),
    defineField({
      name: 'faq',
      title: 'FAQ (optional)',
      type: 'array',
      group: 'extras',
      of: [defineArrayMember({type: 'localizedFaqItem'}), defineArrayMember({type: 'localizedFaqItemRich'})],
      validation: (Rule) => Rule.max(20),
    }),
    defineField({
      name: 'sources',
      title: 'Sources (optional)',
      type: 'array',
      group: 'extras',
      of: [defineArrayMember({type: 'sourceItem'})],
      validation: (Rule) => Rule.max(30),
    }),
    defineField({name: 'seo', title: 'SEO', type: 'localizedSeo', group: 'seo'}),
  ],
  preview: {
    select: {titleEn: 'title.en', titleSq: 'title.sq', status: 'currentStatus', checked: 'lastCheckedAt'},
    prepare({titleEn, titleSq, status, checked}: {
      titleEn?: string
      titleSq?: string
      status?: string
      checked?: string
    }) {
      const dot = STATUS_DOT[status ?? ''] ?? '⚪'
      return {
        title: `${dot} ${titleEn || titleSq || 'Tracker'}`,
        subtitle: checked ? `checked ${checked}` : 'not checked yet',
      }
    },
  },
})
