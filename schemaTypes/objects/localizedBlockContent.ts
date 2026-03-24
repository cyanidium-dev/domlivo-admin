import {defineType, defineField, defineArrayMember} from 'sanity'
import {LocalizedPasteTranslationsInput} from '../../components/sanity/LocalizedPasteTranslationsInput'

/**
 * Inline link href rules: aligned with localizedCtaLink, plus #anchors for same-page links.
 * Duplicated here (not imported from localizedCtaLink) per project scope for this change set.
 */
function validateInlineLinkHref(value: unknown): true | string {
  if (!value || typeof value !== 'string') return true
  const v = value.trim()
  if (!v) return 'Link destination is required.'
  if (
    v.startsWith('/') ||
    v.startsWith('http://') ||
    v.startsWith('https://') ||
    v.startsWith('mailto:') ||
    v.startsWith('tel:') ||
    v.startsWith('#')
  )
    return true
  return 'Use a relative path (e.g. /properties), full URL (https://...), mailto:, tel:, or #anchor.'
}

const articleBodyBlockStyles = [
  {title: 'Paragraph', value: 'normal'},
  {title: 'H2', value: 'h2'},
  {title: 'H3', value: 'h3'},
  {title: 'H4', value: 'h4'},
  {title: 'Quote', value: 'blockquote'},
] as const

const articleBodyBlockLists = [
  {title: 'Bullet', value: 'bullet'},
  {title: 'Numbered', value: 'number'},
] as const

const articleBodyBlockMarks = {
  decorators: [
    {title: 'Strong', value: 'strong'},
    {title: 'Emphasis', value: 'em'},
    {title: 'Code', value: 'code'},
  ],
  annotations: [
    {
      name: 'link',
      type: 'object',
      title: 'Link',
      fields: [
        defineField({
          name: 'href',
          title: 'URL',
          type: 'string',
          validation: (Rule) => Rule.required().custom(validateInlineLinkHref),
          description:
            'Relative path (e.g. /properties), full URL (https://...), mailto:, tel:, or #anchor. Use the CTA block for button-style links.',
        }),
      ],
    },
  ],
}

/**
 * Portable Text block definition shared by localized article body and blog callout inner content.
 */
export function articleBodyBlockMember() {
  return defineArrayMember({
    type: 'block',
    styles: [...articleBodyBlockStyles],
    lists: [...articleBodyBlockLists],
    marks: articleBodyBlockMarks,
  })
}

const imageBlockDefinition = () =>
  defineArrayMember({
    type: 'image',
    options: {hotspot: true},
    fields: [
      {name: 'alt', type: 'string', title: 'Alternative text', description: 'For accessibility and SEO'},
      {name: 'caption', type: 'string', title: 'Caption'},
    ],
  })

/**
 * Allowed block types for article/rich content body.
 * Related posts and property embeds are managed via dedicated blogPost fields
 * (relatedPosts, relatedProperties), not inline blocks.
 */
const richContentArrayOf = [
  articleBodyBlockMember(),
  imageBlockDefinition(),
  defineArrayMember({type: 'blogTable'}),
  defineArrayMember({type: 'blogFaqBlock'}),
  defineArrayMember({type: 'blogCallout'}),
  defineArrayMember({type: 'blogCtaBlock'}),
]

export const localizedBlockContent = defineType({
  name: 'localizedBlockContent',
  title: 'Localized Block Content',
  type: 'object',

  components: {
    input: LocalizedPasteTranslationsInput,
  },

  fields: [
    defineField({
      name: 'en',
      title: 'English',
      type: 'array',
      of: richContentArrayOf,
    }),
    defineField({
      name: 'uk',
      title: 'Ukrainian',
      type: 'array',
      of: richContentArrayOf,
    }),
    defineField({
      name: 'ru',
      title: 'Russian',
      type: 'array',
      of: richContentArrayOf,
    }),
    defineField({
      name: 'sq',
      title: 'Albanian',
      type: 'array',
      of: richContentArrayOf,
    }),
    defineField({
      name: 'it',
      title: 'Italian',
      type: 'array',
      of: richContentArrayOf,
    }),
  ],

  preview: {
    select: {
      en: 'en',
      uk: 'uk',
      ru: 'ru',
      sq: 'sq',
      it: 'it',
    },
    prepare(selection: {en?: unknown[]; uk?: unknown[]; ru?: unknown[]; sq?: unknown[]; it?: unknown[]}) {
      const {en, uk, ru, sq, it} = selection
      const blocks = en || uk || ru || sq || it || []
      const count = Array.isArray(blocks) ? blocks.length : 0
      return {title: 'Block content', subtitle: `${count} block(s)`}
    },
  },
})
