import {defineType, defineField} from 'sanity'
import {PAGE_BUILDER_GROUPS} from '../constants/pageBuilderGroups'

/** Rich text / SEO block for landing pages: body copy with optional heading, video, and CTA. */
export const seoTextSection = defineType({
  name: 'seoTextSection',
  title: 'Rich text / SEO block',
  type: 'object',
  description:
    'Long-form rich text for SEO, page intros, or campaign copy. Optional heading, video, and CTA.',

  groups: [...PAGE_BUILDER_GROUPS],

  fields: [
    defineField({
      name: 'enabled',
      title: 'Enabled / Visible',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
      description: 'If disabled, this section is hidden on the site.',
    }),
    defineField({
      name: 'title',
      title: 'Heading (optional)',
      type: 'localizedString',
      group: 'content',
      description: 'Optional title above the text.',
    }),
    defineField({
      name: 'content',
      title: 'Body',
      type: 'localizedBlockContent',
      group: 'content',
      description: 'Main rich text. Supports internal links and rich blocks per locale.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category chip (optional)',
      type: 'localizedString',
      group: 'content',
      description: 'Small label above the heading, e.g. "Market analysis".',
    }),
    defineField({
      name: 'readingTimeMinutes',
      title: 'Reading time (minutes)',
      type: 'number',
      group: 'content',
      description: 'Optional integer shown next to the category chip.',
      validation: (Rule) => Rule.min(1).max(60).integer(),
    }),
    defineField({
      name: 'author',
      title: 'Author byline (optional)',
      type: 'seoAuthor',
      group: 'content',
      description: 'Author block (name + role + avatar) shown above the body.',
    }),
    defineField({
      name: 'stats',
      title: 'Stat strip (optional)',
      type: 'array',
      group: 'content',
      of: [{type: 'seoStat'}],
      description: 'Up to 3 supporting numbers shown above the article body.',
      validation: (Rule) => Rule.max(3),
    }),
    defineField({
      name: 'pullQuote',
      title: 'Pull quote (optional)',
      type: 'seoPullQuote',
      group: 'content',
      description: 'Highlighted quote injected between body and footer CTA.',
    }),
    defineField({
      name: 'cta',
      title: 'Call to action (optional)',
      type: 'localizedCtaLink',
      group: 'content',
      description: 'Optional button or link below the content.',
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL (optional)',
      type: 'string',
      group: 'media',
      description: 'Optional YouTube/Vimeo URL when the layout supports video.',
    }),
  ],

  preview: {
    select: {title: 'title.en', enabled: 'enabled', videoUrl: 'videoUrl'},
    prepare({
      title,
      enabled,
      videoUrl,
    }: {
      title?: string
      enabled?: boolean
      videoUrl?: string
    }) {
      const status = enabled === false ? ' (hidden)' : ''
      const base = String(title || '').trim() || 'Rich text / SEO'
      const truncated = base.length > 48 ? `${base.slice(0, 47)}…` : base
      const videoHint = String(videoUrl || '').trim() ? ' · Video' : ''
      return {title: `${truncated}${status}`, subtitle: `SEO block${videoHint}`}
    },
  },
})
