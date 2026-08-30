import {defineType, defineField} from 'sanity'

/**
 * Attribution for one image asset.
 *
 * One document per asset, not per usage: the same photo can be a hero on one
 * zone and a gallery item on another, and it must not be credited twice.
 *
 * Why this exists: the site can only use freely licensed images, and until now
 * that meant CC0 or public domain only — an attribution licence cannot be
 * honoured on a page with nowhere to put the credit. Wikimedia Commons has good
 * photography of most Albanian zones, and almost all of it is CC BY or CC BY-SA,
 * so that restriction left a dozen pages without a real photo of the place.
 *
 * A credits page satisfies those licences without putting a byline under every
 * hero: Creative Commons allows attribution "in any reasonable manner based on
 * the medium", and a single credits page linked from the footer is the accepted
 * form for an image-heavy site.
 *
 * **A CC BY / CC BY-SA image is only usable once this document exists and the
 * credits page is live.** The licence is satisfied by the credit being visible
 * to the reader, not by it being recorded here.
 */
export const imageCredit = defineType({
  name: 'imageCredit',
  title: 'Image credit',
  type: 'document',

  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      description: 'The asset this credit belongs to. One credit per asset.',
      options: {hotspot: false},
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'title',
      title: 'What the photo shows',
      type: 'string',
      description:
        'Plain description of the subject, e.g. "The Roman amphitheatre in Durrës". Shown on the credits page.',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
      description: 'Photographer or uploader as named by the source. "Unknown" is acceptable for public domain works.',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'licence',
      title: 'Licence',
      type: 'string',
      options: {
        list: [
          {title: 'CC0 1.0 — no attribution required', value: 'cc0'},
          {title: 'Public domain', value: 'pd'},
          {title: 'Public Domain Mark 1.0', value: 'pdm'},
          {title: 'CC BY 4.0 — attribution required', value: 'cc-by-4.0'},
          {title: 'CC BY-SA 4.0 — attribution + share-alike', value: 'cc-by-sa-4.0'},
          {title: 'CC BY 3.0', value: 'cc-by-3.0'},
          {title: 'CC BY-SA 3.0', value: 'cc-by-sa-3.0'},
          {title: 'Unsplash / Pexels free licence', value: 'unsplash-pexels'},
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'licenceUrl',
      title: 'Licence URL',
      type: 'url',
      description: 'Link to the licence deed. Required for any CC BY / CC BY-SA image.',
      validation: (Rule) =>
        Rule.uri({scheme: ['http', 'https']}).custom((value, context) => {
          const licence = (context.document as {licence?: string} | undefined)?.licence ?? ''
          if (licence.startsWith('cc-by') && !value) {
            return 'An attribution licence must link to its deed — that link is part of the attribution.'
          }
          return true
        }),
    }),

    defineField({
      name: 'sourceUrl',
      title: 'Source URL',
      type: 'url',
      description: 'Where the file came from — the Commons file page, Unsplash photo page, and so on.',
      validation: (Rule) => Rule.required().uri({scheme: ['http', 'https']}),
    }),

    defineField({
      name: 'isStandIn',
      title: 'Stand-in',
      type: 'boolean',
      initialValue: false,
      description:
        'On when the photo does not show the zone it illustrates. Its alt text must describe the photograph rather than name the zone.',
    }),

    defineField({
      name: 'standInNote',
      title: 'What it actually shows',
      type: 'string',
      description: 'Only for stand-ins, e.g. "Shkëmbi i Kavajës, on the same coast — not Mali i Robit".',
      hidden: ({document}) => !document?.isStandIn,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const doc = context.document as {isStandIn?: boolean} | undefined
          if (doc?.isStandIn && !value) return 'Say what the photo actually shows, so it can be replaced later.'
          return true
        }),
    }),
  ],

  preview: {
    select: {title: 'title', author: 'author', licence: 'licence', media: 'image', standIn: 'isStandIn'},
    prepare({title, author, licence, media, standIn}) {
      const parts = [author, licence].filter(Boolean)
      return {
        title: standIn ? `${title} (stand-in)` : title,
        subtitle: parts.join(' · '),
        media,
      }
    },
  },
})

/** Licences that require the credit to be visible to the reader. */
export const ATTRIBUTION_LICENCES = ['cc-by-4.0', 'cc-by-sa-4.0', 'cc-by-3.0', 'cc-by-sa-3.0']
