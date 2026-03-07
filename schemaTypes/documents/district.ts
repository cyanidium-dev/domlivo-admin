import {defineType, defineField, defineArrayMember} from 'sanity'
import {languageField} from '../objects'

export const district = defineType({
  name: 'district',
  title: 'District',
  type: 'document',

  groups: [
    {name: 'basic', title: 'Basic', default: true},
    {name: 'hero', title: 'Hero'},
    {name: 'content', title: 'Content'},
    {name: 'media', title: 'Media'},
    {name: 'faq', title: 'FAQ'},
    {name: 'seo', title: 'SEO'},
  ],

  fields: [
    // BASIC
    languageField,

    defineField({
      name: 'title',
      title: 'District name',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      group: 'basic',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'city',
      type: 'reference',
      to: [{type: 'city'}],
      group: 'basic',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'isPublished',
      title: 'Published',
      type: 'boolean',
      group: 'basic',
      initialValue: true,
      description: 'Show this district on the website.',
    }),

    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      group: 'basic',
      description: 'Display order (lower numbers first).',
    }),

    // HERO
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
      group: 'hero',
      description: 'Main headline on the district landing page hero section.',
    }),

    defineField({
      name: 'heroSubtitle',
      title: 'Hero Subtitle',
      type: 'text',
      group: 'hero',
      description: 'Supporting text in the district landing page hero.',
    }),

    defineField({
      name: 'heroShortLine',
      title: 'Hero Short Line',
      type: 'string',
      group: 'hero',
      description: 'Short tagline shown in the hero area.',
    }),

    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      group: 'hero',
      description: 'Main image for the district landing page hero.',
      options: {hotspot: true},
    }),

    defineField({
      name: 'heroCta',
      title: 'Hero CTA',
      type: 'ctaLink',
      group: 'hero',
    }),

    // CONTENT
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      group: 'content',
      description: 'Brief summary of the district; used in cards and listings.',
    }),

    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{type: 'block'}],
      group: 'content',
      description: 'Main content for the district landing page.',
    }),

    defineField({
      name: 'metricsTitle',
      title: 'Metrics Title',
      type: 'string',
      group: 'content',
      description: 'Title shown above the metrics section.',
    }),

    defineField({
      name: 'metrics',
      title: 'Metrics',
      type: 'array',
      of: [defineArrayMember({type: 'districtMetric'})],
      group: 'content',
      description: 'Key metrics displayed on the district page (e.g. average price, properties count).',
      validation: (Rule) => Rule.max(10),
    }),

    defineField({
      name: 'allPropertiesCta',
      title: 'All Properties CTA',
      type: 'ctaLink',
      group: 'content',
    }),

    // MEDIA
    defineField({
      name: 'galleryTitle',
      title: 'Gallery Title',
      type: 'string',
      group: 'media',
    }),

    defineField({
      name: 'gallerySubtitle',
      title: 'Gallery Subtitle',
      type: 'text',
      group: 'media',
    }),

    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      group: 'media',
      description: 'Image gallery for the district page. Add at least one image.',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
        }),
      ],
      validation: (Rule) =>
        Rule.min(1).error('Add at least one image').max(20).error('Maximum 20 images allowed'),
    }),

    // FAQ
    defineField({
      name: 'faqTitle',
      title: 'FAQ Title',
      type: 'string',
      group: 'faq',
    }),

    defineField({
      name: 'faqItems',
      title: 'FAQ Items',
      type: 'array',
      of: [defineArrayMember({type: 'faqItem'})],
      group: 'faq',
      validation: (Rule) => Rule.max(20),
    }),

    // SEO
    defineField({
      name: 'seoText',
      title: 'SEO Text',
      type: 'array',
      of: [{type: 'block'}],
      group: 'seo',
      description: 'Additional content for SEO; can be displayed at bottom of page.',
    }),

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
  ],

  preview: {
    select: {
      title: 'title',
      slug: 'slug.current',
      language: 'language',
      cityTitle: 'city.title',
      media: 'heroImage',
    },
    prepare(selection) {
      const {title, slug, language, cityTitle, media} = selection
      const parts = [language, cityTitle, slug].filter(Boolean)
      const subtitle = parts.length > 0 ? parts.join(' • ') : undefined
      return {
        title,
        subtitle,
        media,
      }
    },
  },
})
