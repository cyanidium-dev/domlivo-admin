import {defineType, defineField, defineArrayMember} from 'sanity'

export const investorLogosSection = defineType({
  name: 'investorLogosSection',
  title: 'Investor / Partner Logos (scrolling row)',
  type: 'object',
  fields: [
    defineField({
      name: 'enabled',
      title: 'Enabled / Visible',
      type: 'boolean',
      initialValue: true,
      description: 'If disabled, the frontend should hide this section.',
    }),
    defineField({
      name: 'title',
      title: 'Section title (optional)',
      type: 'localizedString',
      description: 'Optional heading above the logos row (e.g. “Our investors”).',
    }),
    defineField({
      name: 'description',
      title: 'Description (optional)',
      type: 'localizedText',
      description: 'Optional short text under the title.',
    }),
    defineField({
      name: 'items',
      title: 'Logos',
      type: 'array',
      description:
        'Partner or investor logos in display order — drag to reorder. The frontend will render these in a horizontal scroll or marquee row; each logo is also a link.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Name / label (optional)',
              type: 'string',
              description: 'For editors (e.g. investor name). Helps identify the logo in this list.',
            }),
            defineField({
              name: 'image',
              title: 'Logo image',
              type: 'image',
              options: {hotspot: true},
              fields: [
                {
                  name: 'alt',
                  type: 'string',
                  title: 'Alternative text',
                  description: 'Describe the logo for screen readers (e.g. company name).',
                },
              ],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'href',
              title: 'Link URL',
              type: 'string',
              description:
                'Where this logo links when clicked. Use an internal path (e.g. /about) or a full external URL.',
              validation: (Rule) =>
                Rule.required().custom((value: string) => {
                  if (!value || typeof value !== 'string') return true
                  const v = value.trim()
                  if (!v) return 'Link URL is required.'
                  if (
                    v.startsWith('/') ||
                    v.startsWith('http://') ||
                    v.startsWith('https://') ||
                    v.startsWith('mailto:') ||
                    v.startsWith('tel:')
                  )
                    return true
                  return 'Use a relative path (e.g. /properties), full URL (https://...), mailto:, or tel:.'
                }),
            }),
          ],
          preview: {
            select: {label: 'label', media: 'image', href: 'href'},
            prepare({label, media, href}: {label?: string; media?: unknown; href?: string}) {
              return {title: label || href || 'Logo', subtitle: href, media}
            },
          },
        }),
      ],
      validation: (Rule) => Rule.min(1).max(50),
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled', count: 'items'},
    prepare({title, enabled, count}: {title?: string; enabled?: boolean; count?: unknown[]}) {
      const n = Array.isArray(count) ? count.length : 0
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'Investor logos') + status, subtitle: `${n} logo(s)`}
    },
  },
})
