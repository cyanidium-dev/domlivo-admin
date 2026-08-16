import React from 'react'
import {defineType, defineField, defineArrayMember} from 'sanity'
import {
  findUniqueLandingOwningSlug,
  isReservedForGeoEntity,
  landingOwnsSlugMessage,
  reservedSlugMessage,
} from '../constants/reservedRouteSlugs'
import {SeoFillInfoInput} from '../../components/sanity/SeoFillInfoInput'
import {GalleryWithCopyAltInput} from '../../components/sanity/GalleryWithCopyAltInput'

export const city = defineType({
  name: 'city',
  title: 'City',
  type: 'document',
  description:
    'Canonical geo entity for a city. Properties, city landings (linkedCity), districts, and catalog SEO pages should all reference the same city document for a given real-world city.',

  groups: [
    {name: 'basic', title: 'Basic', default: true},
    {name: 'hero', title: 'Hero'},
    {name: 'content', title: 'Content'},
    {name: 'districts', title: 'Districts'},
    {name: 'media', title: 'Media'},
    {name: 'faq', title: 'FAQ'},
    {name: 'seo', title: 'SEO'},
  ],

  fields: [
    // BASIC
    defineField({
      name: 'title',
      title: 'City name',
      type: 'localizedString',
      group: 'basic',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      type: 'slug',
      title: 'URL slug',
      group: 'basic',
      options: {
        source: (doc: Record<string, unknown>) => {
          const t = doc?.title as {en?: string} | undefined
          return t?.en ?? ''
        },
        maxLength: 96,
      },
      validation: (Rule) =>
        Rule.required().custom(async (value, context) => {
          const current = (value as {current?: string} | undefined)?.current
          if (!current) return true
          if (isReservedForGeoEntity(current)) return reservedSlugMessage(current)
          // Entity routes eclipse Unique Landings at /<slug> — block a city
          // slug that would silently take over an existing landing's URL.
          const client = context.getClient({apiVersion: '2024-06-01'})
          const landing = await findUniqueLandingOwningSlug(client, current)
          if (landing) return landingOwnsSlugMessage(current)
          return true
        }),
    }),

    defineField({
      name: 'country',
      title: 'Country',
      type: 'reference',
      to: [{type: 'country'}],
      group: 'basic',
      description:
        'Country for geo-based URLs (e.g. /{locale}/{country}/{city}/...). Required for routing; create a Country document first if none appear.',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'popular',
      title: 'Popular',
      type: 'boolean',
      group: 'basic',
      description: 'Mark as a popular city for filtering and highlighting.',
    }),

    defineField({
      name: 'vibe',
      title: 'Vibe / Tag',
      type: 'localizedString',
      group: 'basic',
      description:
        'Short categorical tag shown as a chip on the city card. E.g. "Sea", "Business", "Mountains", "Old town". Keep it 1-2 words per language.',
    }),

    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      group: 'basic',
      description: 'Display order (lower numbers first).',
    }),

    defineField({
      name: 'isPublished',
      title: 'Published',
      type: 'boolean',
      group: 'basic',
      initialValue: true,
      description: 'Show this city on the website.',
    }),

    // HERO
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'localizedString',
      group: 'hero',
      description: 'Main headline on the city landing page hero section.',
    }),

    defineField({
      name: 'heroSubtitle',
      title: 'Hero Subtitle',
      type: 'localizedText',
      group: 'hero',
      description: 'Supporting text in the city landing page hero.',
    }),

    defineField({
      name: 'heroShortLine',
      title: 'Hero Short Line',
      type: 'localizedString',
      group: 'hero',
      description: 'Short tagline shown in the hero area.',
    }),

    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      group: 'hero',
      description: 'Main image for the city landing page hero. Also used in city cards on homepage.',
      options: {hotspot: true},
      fields: [
        {name: 'alt', type: 'string', title: 'Alternative text', description: 'For accessibility and card display'},
      ],
    }),

    defineField({
      name: 'heroCta',
      title: 'Hero CTA',
      type: 'localizedCtaLink',
      group: 'hero',
    }),

    // CONTENT
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'localizedText',
      group: 'content',
      description: 'Brief summary of the city; used in cards and listings.',
    }),

    defineField({
      name: 'description',
      title: 'Description',
      type: 'localizedText',
      group: 'content',
      description: 'Main content for the city landing page.',
    }),

    defineField({
      name: 'investmentText',
      title: 'Investment Text',
      type: 'localizedText',
      group: 'content',
      description: 'Content for the investment section on the city page.',
    }),

    defineField({
      name: 'featuredPropertiesTitle',
      title: 'Featured Properties Title',
      type: 'localizedString',
      group: 'content',
      description: 'Title shown above the featured properties slider on the city page.',
    }),

    defineField({
      name: 'featuredPropertiesSubtitle',
      title: 'Featured Properties Subtitle',
      type: 'localizedText',
      group: 'content',
      description: 'Subtitle shown above the featured properties slider.',
    }),

    defineField({
      name: 'allPropertiesCta',
      title: 'All Properties CTA',
      type: 'localizedCtaLink',
      group: 'content',
    }),

    // DISTRICTS
    defineField({
      name: 'districtsTitle',
      title: 'Districts Title',
      type: 'localizedString',
      group: 'districts',
    }),

    defineField({
      name: 'districtsIntro',
      title: 'Districts Introduction',
      type: 'localizedText',
      group: 'districts',
      description: 'Introductory text for the districts section.',
    }),

    defineField({
      name: 'districtStats',
      title: 'District Stats',
      type: 'array',
      of: [defineArrayMember({type: 'districtStat'})],
      group: 'districts',
      validation: (Rule) => Rule.max(20),
    }),

    // MEDIA
    defineField({
      name: 'cityVideoUrl',
      title: 'City Video URL',
      type: 'string',
      group: 'media',
      description: 'Paste a YouTube or Vimeo URL. Used for the city video section.',
    }),

    defineField({
      name: 'galleryTitle',
      title: 'Gallery Title',
      type: 'localizedString',
      group: 'media',
    }),

    defineField({
      name: 'gallerySubtitle',
      title: 'Gallery Subtitle',
      type: 'localizedText',
      group: 'media',
    }),

    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      group: 'media',
      description:
        'Tip: you can drag and drop multiple images onto this gallery block to upload them at once. Drop them on the array block, not inside a single image item.',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            {name: 'alt', type: 'string', title: 'Alternative text', description: 'For accessibility'},
            {name: 'label', type: 'string', title: 'Label', description: 'Editorial label / caption'},
          ],
        }),
      ],
      // A warning, not an error: a city can be created before anyone sources
      // its images, and publication is gated by `npm run audit:zone-readiness`
      // rather than by Studio validation.
      validation: (Rule) =>
        Rule.min(1)
          .warning('Add at least one image before publishing this city')
          .max(20)
          .error('Maximum 20 images allowed'),
      components: {input: GalleryWithCopyAltInput},
    }),

    // FAQ
    defineField({
      name: 'faqTitle',
      title: 'FAQ Title',
      type: 'localizedString',
      group: 'faq',
    }),

    defineField({
      name: 'faqItems',
      title: 'FAQ Items',
      type: 'array',
      of: [defineArrayMember({type: 'localizedFaqItem'})],
      group: 'faq',
      validation: (Rule) => Rule.max(20),
    }),

    // SEO
    defineField({
      name: 'seoText',
      title: 'SEO Text',
      type: 'localizedText',
      group: 'seo',
      description: 'Additional content for SEO; can be displayed at bottom of page.',
    }),

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'localizedSeo',
      group: 'seo',
      components: {
        input: (props: Record<string, unknown>) =>
          React.createElement(SeoFillInfoInput, {...props, sourceType: 'city'}),
      },
    }),
  ],

  preview: {
    select: {
      titleEn: 'title.en',
      titleSq: 'title.sq',
      slug: 'slug.current',
      media: 'heroImage',
    },
    prepare(selection) {
      const s = selection || {}
      const title = s.titleEn || s.titleSq || 'Untitled city'
      const slug = s.slug || 'no-slug'
      return {title: String(title), subtitle: String(slug), media: s.media}
    },
  },
})
