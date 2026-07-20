import {defineType, defineField, defineArrayMember} from 'sanity'
import {requireLocalizedEn} from '../objects/mortgageCalcSection'

export const DEVELOPER_TIERS = [
  {title: 'Green', value: 'green'},
  {title: 'Yellow', value: 'yellow'},
  {title: 'Red', value: 'red'},
] as const

const TIER_DOT: Record<string, string> = {green: '🟢', yellow: '🟡', red: '🔴'}

/**
 * Developer reference card (traffic-light rating). Shape mirrors the research
 * base `06-developers`: tier with reasoning, projects, revenue note, neutral
 * risk notes and mandatory sources for yellow/red tiers. Quarterly review
 * cadence is enforced editorially via `lastReviewedAt` (frontend flags stale
 * entries; a tier without a review date must not exist).
 */
export const developer = defineType({
  name: 'developer',
  title: 'Developer',
  type: 'document',
  groups: [
    {name: 'basic', title: 'Basic', default: true},
    {name: 'rating', title: 'Rating'},
    {name: 'details', title: 'Details'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'basic',
      options: {source: 'name', maxLength: 96},
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
      name: 'logo',
      title: 'Logo (optional)',
      type: 'image',
      group: 'basic',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alternative text'}],
    }),
    defineField({
      name: 'tier',
      title: 'Tier',
      type: 'string',
      group: 'rating',
      options: {list: [...DEVELOPER_TIERS], layout: 'radio', direction: 'horizontal'},
      description:
        'Traffic-light tier. Neutral wording only — a mention in a legal case is not a verdict (see 06-developers in the research base).',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tierNote',
      title: 'Tier note',
      type: 'localizedText',
      group: 'rating',
      description: '1–3 sentences: why this tier. Neutral, sourced wording.',
      validation: (Rule) =>
        Rule.required().custom(requireLocalizedEn('Tier note is required (at least English).')),
    }),
    defineField({
      name: 'lastReviewedAt',
      title: 'Last reviewed at',
      type: 'date',
      group: 'rating',
      description: 'Review cadence: quarterly. The rating does not exist without a review date.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sources',
      title: 'Sources',
      type: 'array',
      group: 'rating',
      of: [defineArrayMember({type: 'sourceItem'})],
      description: 'Mandatory (min 1) for yellow and red tiers; optional for green.',
      validation: (Rule) =>
        Rule.max(30).custom((value, context) => {
          const tier = (context.document as {tier?: string} | undefined)?.tier
          const count = Array.isArray(value) ? value.length : 0
          if ((tier === 'yellow' || tier === 'red') && count === 0) {
            return 'Yellow and red tiers require at least one source.'
          }
          return true
        }),
    }),
    defineField({
      name: 'description',
      title: 'Description (optional)',
      type: 'localizedText',
      group: 'details',
    }),
    defineField({
      name: 'foundedYear',
      title: 'Founded year (optional)',
      type: 'number',
      group: 'details',
      validation: (Rule) => Rule.min(1900).max(2030),
    }),
    defineField({
      name: 'revenueNote',
      title: 'Revenue note (optional)',
      type: 'localizedString',
      group: 'details',
      description: 'E.g. "Revenue 2024: …". Keep sourced.',
    }),
    defineField({
      name: 'keyProjects',
      title: 'Key projects',
      type: 'array',
      group: 'details',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({name: 'location', title: 'Location (optional)', type: 'localizedString'}),
            defineField({
              name: 'url',
              title: 'URL (optional)',
              type: 'string',
              description: 'External link or a relative path to a project page.',
            }),
          ],
          preview: {
            select: {name: 'name'},
            prepare({name}: {name?: string}) {
              return {title: name || 'Project'}
            },
          },
        }),
      ],
      validation: (Rule) => Rule.max(15),
    }),
    defineField({
      name: 'risks',
      title: 'Risk notes (optional)',
      type: 'localizedText',
      group: 'details',
      description:
        'Known issues in NEUTRAL wording (delays, disputes, pending cases). No verdicts, no "blacklist" language.',
    }),
    defineField({
      name: 'linkedGuide',
      title: 'Linked guide (optional)',
      type: 'reference',
      group: 'details',
      to: [{type: 'landingPage'}],
      options: {filter: 'pageType == "custom" && enabled != false'},
      description: 'Editorial deep-dive guide about this developer, when one exists.',
    }),
    defineField({name: 'seo', title: 'SEO', type: 'localizedSeo', group: 'seo'}),
  ],
  preview: {
    select: {name: 'name', tier: 'tier', reviewed: 'lastReviewedAt'},
    prepare({name, tier, reviewed}: {name?: string; tier?: string; reviewed?: string}) {
      const dot = TIER_DOT[tier ?? ''] ?? '⚪'
      return {
        title: `${dot} ${name || 'Developer'}`,
        subtitle: reviewed ? `reviewed ${reviewed}` : 'not reviewed yet',
      }
    },
  },
})
