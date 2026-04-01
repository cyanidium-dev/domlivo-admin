import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * Generic marketing block for landing pages. Editors choose a layout first, then fill content and optional media.
 */
export const marketingContentSection = defineType({
  name: 'marketingContentSection',
  title: 'Marketing Content',
  type: 'object',
  description:
    'Headline, text, bullet highlights, optional button, and optional images or video—without tying this block to a single page type.',

  groups: [
    {name: 'layout', title: 'Layout', default: true},
    {name: 'content', title: 'Content'},
    {name: 'highlights', title: 'Highlights'},
    {name: 'action', title: 'CTA'},
    {name: 'media', title: 'Media'},
  ],

  fields: [
    defineField({
      name: 'enabled',
      title: 'Enabled / Visible',
      type: 'boolean',
      group: 'layout',
      initialValue: true,
      description: 'Turn off to hide this section on the page without removing it.',
    }),
    defineField({
      name: 'variant',
      title: 'Layout variant',
      type: 'string',
      group: 'layout',
      description:
        'Text + media: standard block with optional images. Dark promo: bold block with dark styling, good for strong offers. Grouped highlights: several titled lists (e.g. services or benefits).',
      options: {
        list: [
          {title: 'Text + media', value: 'split'},
          {title: 'Dark promo', value: 'splitDark'},
          {title: 'Grouped highlights', value: 'grouped'},
        ],
        layout: 'radio',
      },
      initialValue: 'split',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'eyebrow',
      title: 'Eyebrow (optional)',
      type: 'localizedString',
      group: 'content',
      description: 'Small line above the heading (optional).',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle (optional)',
      type: 'localizedString',
      group: 'content',
      description: 'Short supporting line under the title.',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'localizedText',
      group: 'content',
      description: 'Main paragraph under the title.',
    }),
    defineField({
      name: 'supportingText',
      title: 'Text below bullet list',
      type: 'localizedText',
      group: 'content',
      description: 'Optional extra paragraph after the bullets (for notes, disclaimers, or detail).',
    }),

    defineField({
      name: 'highlightsDisplay',
      title: 'Highlights style',
      type: 'string',
      group: 'highlights',
      initialValue: 'list',
      hidden: ({parent}) => parent?.variant === 'grouped',
      options: {
        list: [
          {title: 'Bullet list', value: 'list'},
          {title: 'Cards', value: 'cards'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
      description:
        'Bullet list: regular bullet points. Cards: structured value + label rows (similar to investment-style stat highlights), with optional short descriptions.',
    }),
    defineField({
      name: 'benefits',
      title: 'Bullet points',
      type: 'array',
      group: 'highlights',
      of: [defineArrayMember({type: 'localizedString'})],
      hidden: ({parent}) =>
        parent?.variant === 'grouped' || parent?.highlightsDisplay === 'cards',
      description: 'Short points for the Text + media or Dark promo layouts.',
      validation: (Rule) => Rule.max(12),
    }),
    defineField({
      name: 'highlightsCards',
      title: 'Highlight cards',
      type: 'array',
      group: 'highlights',
      hidden: ({parent}) =>
        parent?.variant === 'grouped' || parent?.highlightsDisplay !== 'cards',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'value',
              title: 'Value',
              type: 'localizedString',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'label',
              title: 'Label',
              type: 'localizedString',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'description',
              title: 'Description (optional)',
              type: 'localizedText',
              description: 'Optional supporting line under the value and label.',
            }),
          ],
          preview: {
            select: {v: 'value.en', l: 'label.en'},
            prepare({v, l}: {v?: string; l?: string}) {
              return {title: [v, l].filter(Boolean).join(' · ') || 'Card'}
            },
          },
        }),
      ],
      validation: (Rule) =>
        Rule.max(16).custom((value, context) => {
          const parent = context.parent as {
            variant?: string
            highlightsDisplay?: string
          }
          if (parent?.variant === 'grouped' || parent?.highlightsDisplay !== 'cards') {
            return true
          }
          if (!Array.isArray(value) || value.length < 1) {
            return 'Add at least one card when using Cards display.'
          }
          return true
        }),
      description: 'Stat-style cards: prominent value, label, and optional short description.',
    }),
    defineField({
      name: 'contentGroups',
      title: 'Content groups',
      type: 'array',
      group: 'highlights',
      hidden: ({parent}) => parent?.variant !== 'grouped',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'groupTitle',
              title: 'Group title (optional)',
              type: 'localizedString',
              description: 'Optional heading. Leave empty if description and highlights are enough.',
            }),
            defineField({
              name: 'description',
              title: 'Group description (optional)',
              type: 'localizedText',
              description: 'Optional intro text for this group (with or without a title).',
            }),
            defineField({
              name: 'groupDisplay',
              title: 'Highlights style',
              type: 'string',
              initialValue: 'list',
              options: {
                list: [
                  {title: 'Bullet list', value: 'list'},
                  {title: 'Cards', value: 'cards'},
                ],
                layout: 'radio',
              },
              validation: (Rule) => Rule.required(),
              description:
                'Bullet list: points for this group only. Cards: value/label rows like stat highlights, for this group only.',
            }),
            defineField({
              name: 'bullets',
              title: 'Bullet points',
              type: 'array',
              of: [defineArrayMember({type: 'localizedString'})],
              hidden: ({parent}) => parent?.groupDisplay === 'cards',
              validation: (Rule) =>
                Rule.max(12).custom((value, context) => {
                  const parent = context.parent as {groupDisplay?: string} | undefined
                  if (parent?.groupDisplay === 'cards') return true
                  if (!Array.isArray(value) || value.length < 1) {
                    return 'Add at least one bullet when using Bullet list.'
                  }
                  return true
                }),
            }),
            defineField({
              name: 'cards',
              title: 'Cards',
              type: 'array',
              hidden: ({parent}) => parent?.groupDisplay !== 'cards',
              of: [
                defineArrayMember({
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'value',
                      title: 'Value',
                      type: 'localizedString',
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: 'label',
                      title: 'Label',
                      type: 'localizedString',
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: 'description',
                      title: 'Description (optional)',
                      type: 'localizedText',
                      description: 'Optional supporting line under the value and label.',
                    }),
                  ],
                  preview: {
                    select: {v: 'value.en', l: 'label.en'},
                    prepare({v, l}: {v?: string; l?: string}) {
                      return {title: [v, l].filter(Boolean).join(' · ') || 'Card'}
                    },
                  },
                }),
              ],
              validation: (Rule) =>
                Rule.max(16).custom((value, context) => {
                  const parent = context.parent as {groupDisplay?: string} | undefined
                  if (parent?.groupDisplay !== 'cards') return true
                  if (!Array.isArray(value) || value.length < 1) {
                    return 'Add at least one card when using Cards.'
                  }
                  return true
                }),
              description: 'Stat-style cards for this group (value, label, optional description).',
            }),
          ],
          preview: {
            select: {t: 'groupTitle.en', gd: 'groupDisplay'},
            prepare({t, gd}: {t?: string; gd?: string}) {
              const mode = gd === 'cards' ? 'Cards' : 'Bullet list'
              const title = String(t || '').trim()
              return {
                title: title || `Group · ${mode}`,
                subtitle: mode,
              }
            },
          },
        }),
      ],
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {variant?: string} | undefined
          if (parent?.variant !== 'grouped') return true
          if (!Array.isArray(value) || value.length < 1) {
            return 'Add at least one content group.'
          }
          return true
        }),
      description:
        'Several highlight groups (by topic, service, etc.). Each group can use bullets or cards and may omit a title if only description + highlights are needed.',
    }),

    defineField({
      name: 'cta',
      title: 'CTA (optional)',
      type: 'localizedCtaLink',
      group: 'action',
      description: 'Optional button or text link.',
    }),

    defineField({
      name: 'mediaMode',
      title: 'Media mode',
      type: 'string',
      group: 'media',
      initialValue: 'none',
      hidden: ({parent}) => parent?.variant === 'grouped',
      options: {
        list: [
          {title: 'No media', value: 'none'},
          {title: 'Default media', value: 'fallback'},
          {title: 'Custom media', value: 'custom'},
        ],
        layout: 'radio',
      },
      description:
        'No media: text only. Default media: uses predefined visuals. Custom media: add images in the Images field (Text + media layout).',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'promoMediaType',
      title: 'Media type',
      type: 'string',
      group: 'media',
      initialValue: 'image',
      hidden: ({parent}) =>
        parent?.variant !== 'splitDark' || parent?.mediaMode !== 'custom',
      options: {
        list: [
          {title: 'Image', value: 'image'},
          {title: 'Video', value: 'video'},
        ],
        layout: 'radio',
      },
      description: 'Choose image or video for the Dark promo layout.',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      group: 'media',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alternative text'}],
      hidden: ({parent}) =>
        parent?.variant !== 'splitDark' ||
        parent?.mediaMode !== 'custom' ||
        parent?.promoMediaType === 'video',
      description: 'Shown when Media type is Image.',
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      group: 'media',
      hidden: ({parent}) =>
        parent?.variant !== 'splitDark' ||
        parent?.mediaMode !== 'custom' ||
        parent?.promoMediaType !== 'video',
      description: 'Link to the video when Media type is Video.',
    }),
    defineField({
      name: 'groupedMediaMode',
      title: 'Media mode',
      type: 'string',
      group: 'media',
      initialValue: 'none',
      hidden: ({parent}) => parent?.variant !== 'grouped',
      options: {
        list: [
          {title: 'No media', value: 'none'},
          {title: 'Default media', value: 'default'},
          {title: 'Custom media', value: 'custom'},
        ],
        layout: 'radio',
      },
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {variant?: string} | undefined
          if (parent?.variant !== 'grouped') return true
          const v = value === undefined || value === null ? 'none' : value
          return ['none', 'default', 'custom'].includes(String(v))
            ? true
            : 'Choose a media option.'
        }),
      description:
        'Optional visual for the section intro (grouped layout). Custom media: add images in the Images field.',
    }),
    defineField({
      name: 'mediaSide',
      title: 'Media side',
      type: 'string',
      group: 'media',
      initialValue: 'right',
      hidden: ({parent}) => {
        const p = parent as {
          variant?: string
          mediaMode?: string
          groupedMediaMode?: string
        } | undefined
        const splitCustom = p?.variant === 'split' && p?.mediaMode === 'custom'
        const groupedCustom = p?.variant === 'grouped' && p?.groupedMediaMode === 'custom'
        return !(splitCustom || groupedCustom)
      },
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Right', value: 'right'},
        ],
      },
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const p = context.parent as {
            variant?: string
            mediaMode?: string
            groupedMediaMode?: string
          } | undefined
          const splitCustom = p?.variant === 'split' && p?.mediaMode === 'custom'
          const groupedCustom = p?.variant === 'grouped' && p?.groupedMediaMode === 'custom'
          if (!splitCustom && !groupedCustom) return true
          return value === 'left' || value === 'right' ? true : 'Choose whether media is on the left or right.'
        }),
      description:
        'Text + media and Grouped layouts with custom media only. Dark promo uses a fixed layout.',
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      group: 'media',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [{name: 'alt', type: 'string', title: 'Alternative text'}],
        }),
      ],
      hidden: ({parent}) => {
        const p = parent as {variant?: string; mediaMode?: string; groupedMediaMode?: string} | undefined
        const splitCustom = p?.variant === 'split' && p?.mediaMode === 'custom'
        const groupedCustom = p?.variant === 'grouped' && p?.groupedMediaMode === 'custom'
        return !(splitCustom || groupedCustom)
      },
      validation: (Rule) =>
        Rule.max(2).custom((value, context) => {
          const p = context.parent as {
            variant?: string
            mediaMode?: string
            groupedMediaMode?: string
          }
          const splitCustom = p?.variant === 'split' && p?.mediaMode === 'custom'
          const groupedCustom = p?.variant === 'grouped' && p?.groupedMediaMode === 'custom'
          if (!splitCustom && !groupedCustom) return true
          if (!Array.isArray(value) || value.length < 1) {
            return 'Add at least one image for custom media (up to two).'
          }
          return true
        }),
      description:
        'Used for the section media area. Add one or two images when using Custom media (Text + media or Grouped highlights). Same field for both layouts.',
    }),
  ],

  preview: {
    select: {
      title: 'title.en',
      variant: 'variant',
      highlightsDisplay: 'highlightsDisplay',
      contentGroups: 'contentGroups',
      enabled: 'enabled',
    },
    prepare({
      title,
      variant,
      highlightsDisplay,
      contentGroups,
      enabled,
    }: {
      title?: string
      variant?: string
      highlightsDisplay?: string
      contentGroups?: unknown[]
      enabled?: boolean
    }) {
      const MAX_TITLE_CHARS = 52
      const raw = String(title || '').trim()
      const body = raw.length > 0 ? raw : 'Untitled'
      const truncated =
        body.length > MAX_TITLE_CHARS ? `${body.slice(0, MAX_TITLE_CHARS - 1)}…` : body
      const hidden = enabled === false ? ' (hidden)' : ''
      const previewTitle = `Marketing: ${truncated}${hidden}`

      let subtitle: string
      if (variant === 'splitDark') {
        subtitle = 'Dark promo'
      } else if (variant === 'grouped') {
        const n = Array.isArray(contentGroups) ? contentGroups.length : 0
        subtitle = n > 0 ? `Grouped · ${n} group${n === 1 ? '' : 's'}` : 'Grouped'
      } else {
        const hl = highlightsDisplay === 'cards' ? 'Cards' : 'Bullets'
        subtitle = `Split · ${hl}`
      }

      return {title: previewTitle, subtitle}
    },
  },
})
