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
