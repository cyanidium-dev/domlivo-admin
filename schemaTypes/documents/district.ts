import {defineType, defineField, defineArrayMember} from 'sanity'

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
    defineField({
      name: 'title',
      title: 'District name',
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
      type: 'localizedString',
      group: 'hero',
      description: 'Main headline on the district landing page hero section.',
    }),

    defineField({
      name: 'heroSubtitle',
      title: 'Hero Subtitle',
      type: 'localizedText',
      group: 'hero',
      description: 'Supporting text in the district landing page hero.',
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
      description: 'Main image for the district landing page hero. Also used in district cards on homepage.',
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
      description: 'Brief summary of the district; used in cards and listings.',
    }),

    defineField({
      name: 'description',
      title: 'Description',
      type: 'localizedText',
      group: 'content',
      description: 'Main content for the district landing page.',
    }),

    defineField({
      name: 'metricsTitle',
      title: 'Metrics Title',
      type: 'localizedString',
      group: 'content',
      description: 'Title shown above the metrics section.',
    }),

    defineField({
      name: 'metrics',
      title: 'Metrics',
      type: 'array',
      of: [defineArrayMember({type: 'districtMetric'})],
      group: 'content',
      description:
        'Key metrics displayed on the district page (e.g. average price, properties count).',
      validation: (Rule) => Rule.max(10),
    }),

    defineField({
      name: 'allPropertiesCta',
      title: 'All Properties CTA',
      type: 'localizedCtaLink',
      group: 'content',
    }),

    // MEDIA
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
    }),
  ],

  preview: {
    select: {
      titleEn: 'title.en',
      titleSq: 'title.sq',
      titleRu: 'title.ru',
      titleUk: 'title.uk',
      cityTitleEn: 'city.title.en',
      cityTitleSq: 'city.title.sq',
      cityTitleRu: 'city.title.ru',
      cityTitleUk: 'city.title.uk',
      slug: 'slug.current',
    },
    prepare(selection) {
      const title =
        selection.titleEn ||
        selection.titleSq ||
        selection.titleRu ||
        selection.titleUk ||
        'Untitled district'

      const cityTitle =
        selection.cityTitleEn ||
        selection.cityTitleSq ||
        selection.cityTitleRu ||
        selection.cityTitleUk ||
        'No city'

      const subtitle = selection.slug ? `${cityTitle} · ${selection.slug}` : cityTitle

      return {
        title,
        subtitle,
      }
    },
  },
})
