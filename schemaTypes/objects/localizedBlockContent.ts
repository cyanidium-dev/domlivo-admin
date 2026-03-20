import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * Localized Portable Text / block content.
 * Each language (en, uk, ru, sq, it) has its own rich content array.
 */
const blockContentDefinition = () =>
  defineArrayMember({
    type: 'block',
    styles: [
      {title: 'Paragraph', value: 'normal'},
      {title: 'H2', value: 'h2'},
      {title: 'H3', value: 'h3'},
      {title: 'H4', value: 'h4'},
      {title: 'Quote', value: 'blockquote'},
    ],
    lists: [
      {title: 'Bullet', value: 'bullet'},
      {title: 'Numbered', value: 'number'},
    ],
    marks: {
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
          fields: [{name: 'href', type: 'url', title: 'URL'}],
        },
      ],
    },
  })

const imageBlockDefinition = () =>
  defineArrayMember({
    type: 'image',
    options: {hotspot: true},
    fields: [
      {name: 'alt', type: 'string', title: 'Alternative text', description: 'For accessibility and SEO'},
      {name: 'caption', type: 'string', title: 'Caption'},
    ],
  })

const richContentArrayOf = [
  blockContentDefinition(),
  imageBlockDefinition(),
  defineArrayMember({type: 'blogTable'}),
  defineArrayMember({type: 'blogFaqBlock'}),
  defineArrayMember({type: 'blogCallout'}),
  defineArrayMember({type: 'blogCtaBlock'}),
  defineArrayMember({type: 'blogRelatedPostsBlock'}),
  defineArrayMember({type: 'blogPropertyEmbedBlock'}),
]

export const localizedBlockContent = defineType({
  name: 'localizedBlockContent',
  title: 'Localized Block Content',
  type: 'object',

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
