import {defineType, defineField} from 'sanity'

/**
 * Canonical rich-text / SEO block for landings.
 * Replaces the former city-only block: optional title, video, and CTA live here when needed.
 */
export const seoTextSection = defineType({
  name: 'seoTextSection',
  title: 'Rich text / SEO block',
  type: 'object',
  description:
    'Long-form portable text for SEO, city intros, or campaign copy. Optional heading, video, and CTA support location-style layouts.',

  groups: [
    {name: 'main', title: 'Content', default: true},
    {name: 'extras', title: 'Optional heading & media'},
  ],

  fields: [
    defineField({
      name: 'enabled',
      title: 'Enabled / Visible',
      type: 'boolean',
      group: 'main',
      initialValue: true,
      description: 'If disabled, the frontend should hide this section.',
    }),
    defineField({
      name: 'title',
      title: 'Heading (optional)',
      type: 'localizedString',
      group: 'extras',
      description: 'Optional title above the text (e.g. city or campaign heading).',
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL (optional)',
      type: 'string',
      group: 'extras',
      description: 'Optional YouTube/Vimeo URL shown with this block when the layout supports it.',
    }),
    defineField({
      name: 'content',
      title: 'Body',
      type: 'localizedBlockContent',
      group: 'main',
      description: 'Main rich text. Supports internal links and rich blocks per locale.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'cta',
      title: 'CTA (optional)',
      type: 'localizedCtaLink',
      group: 'extras',
      description: 'Optional button or text link below the content.',
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
      return {title: `${truncated}${status}`, subtitle: `SEO / rich text${videoHint}`}
    },
  },
})
