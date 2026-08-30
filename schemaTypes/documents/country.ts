import {defineType, defineField} from 'sanity'
import {
  findUniqueLandingOwningSlug,
  isReservedForGeoEntity,
  landingOwnsSlugMessage,
  reservedSlugMessage,
} from '../constants/reservedRouteSlugs'

/**
 * Country: canonical geo route segment for city-aware URLs.
 * Cities reference exactly one country.
 */
export const country = defineType({
  name: 'country',
  title: 'Country',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
      description:
        'Display name per language (e.g. Albania / Shqipëri). Used for the country breadcrumb; when a locale is empty the frontend falls back to the URL slug.',
    }),

    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      options: {
        source: 'title.en',
        maxLength: 96,
      },
      validation: (Rule) =>
        Rule.required().custom(async (value, context) => {
          const current = (value as {current?: string} | undefined)?.current
          if (!current) return true
          if (isReservedForGeoEntity(current)) return reservedSlugMessage(current)
          // Entity routes eclipse Unique Landings at /<slug> — block a country
          // slug that would silently take over an existing landing's URL.
          const client = context.getClient({apiVersion: '2024-06-01'})
          const landing = await findUniqueLandingOwningSlug(client, current)
          if (landing) return landingOwnsSlugMessage(current)
          return true
        }),
      description: 'Kebab-case segment for routes (e.g. albania).',
    }),

    defineField({
      name: 'code',
      title: 'Code (optional)',
      type: 'string',
      description: 'ISO or internal code for future use (e.g. AL).',
    }),
  ],

  preview: {
    select: {titleEn: 'title.en', titleSq: 'title.sq', slug: 'slug.current'},
    prepare({titleEn, titleSq, slug}: {titleEn?: string; titleSq?: string; slug?: string}) {
      return {title: titleEn || titleSq || 'Country', subtitle: slug || ''}
    },
  },
})
