import {defineType, defineField} from 'sanity'

/**
 * Catalog listing page SEO content.
 * Used for catalog route scopes (root, city, district, facet).
 * A facet page is a city or district listing narrowed to one slice
 * (`/albania/durres/1-1`, `/albania/durres/plazh/near-the-sea`); its own copy
 * lives here with `pageScope: "facet"`, the city, the facet slug and, for a
 * district's slice, the district.
 * Frontend canonical filter routes are handled outside manual landing creation.
 * One document per route scope (root, per city, per district).
 */
export const catalogSeoPage = defineType({
  name: 'catalogSeoPage',
  title: 'Catalog SEO Page',
  type: 'document',

  groups: [
    {name: 'scope', title: 'Page Scope', default: true},
    {name: 'content', title: 'Content'},
    {name: 'seo', title: 'SEO'},
  ],

  fields: [
    defineField({
      name: 'pageScope',
      title: 'Page Type',
      type: 'string',
      group: 'scope',
      options: {
        list: [
          {title: 'Catalog root (/catalog)', value: 'propertiesRoot'},
          {title: 'City catalog scope', value: 'city'},
          {title: 'District catalog scope', value: 'district'},
          {title: 'Facet page (city or district slice)', value: 'facet'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
      description: 'Which catalog scope this content applies to.',
    }),

    defineField({
      name: 'city',
      title: 'City',
      type: 'reference',
      to: [{type: 'city'}],
      group: 'scope',
      hidden: ({parent}) => parent?.pageScope === 'propertiesRoot',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {pageScope?: string} | undefined
          if (parent?.pageScope === 'city' || parent?.pageScope === 'district' || parent?.pageScope === 'facet') {
            return value ? true : 'City is required for city, district and facet scopes.'
          }
          return true
        }),
      description: 'Required for city and district scopes. Match by city slug.',
    }),

    defineField({
      name: 'district',
      title: 'District',
      type: 'reference',
      to: [{type: 'district'}],
      group: 'scope',
      hidden: ({parent}) => parent?.pageScope !== 'district' && parent?.pageScope !== 'facet',
      options: {
        filter: ({document}) => {
          const cityRef = (document?.city as {_ref?: string} | undefined)?._ref
          if (!cityRef) return {filter: '_type == "district" && false', params: {}}
          return {
            filter: '_type == "district" && city._ref == $cityId',
            params: {cityId: cityRef},
          }
        },
      },
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {pageScope?: string} | undefined
          if (parent?.pageScope === 'district') {
            return value ? true : 'District is required for district scope.'
          }
          return true
        }),
      description:
        'Required for district scope. Must belong to the selected city. On a facet page: only for a district slice (/durres/plazh/1-1); leave empty for the city slice.',
    }),

    defineField({
      name: 'facet',
      title: 'Facet',
      type: 'string',
      group: 'scope',
      hidden: ({parent}) => parent?.pageScope !== 'facet',
      options: {
        // Same slugs as the frontend's LISTING_FACET_SLUGS (src/lib/catalog/listingFacets.ts).
        list: [
          {title: 'Near the sea (≤ 300 m or first line)', value: 'near-the-sea'},
          {title: '1+1 apartments', value: '1-1'},
          {title: '2+1 apartments', value: '2-1'},
          {title: '3+1 and larger apartments', value: '3-1'},
          {title: 'Flats under €80,000', value: 'under-80k'},
          {title: 'Flats under €100,000', value: 'under-100k'},
          {title: 'New builds (off-plan, under construction)', value: 'new-builds'},
        ],
      },
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {pageScope?: string} | undefined
          if (parent?.pageScope === 'facet') return value ? true : 'Facet is required for a facet page.'
          return true
        }),
      description: 'Which slice of the place this copy is for. Figures: write tokens such as {{count:durres/1-1}}.',
    }),

    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      group: 'scope',
      initialValue: true,
      description: 'When disabled, this page content is not used. Frontend falls back to defaults.',
    }),

    defineField({
      name: 'title',
      title: 'H1 / Page Title',
      type: 'localizedString',
      group: 'content',
      description: 'Main heading for the listing page.',
    }),

    defineField({
      name: 'intro',
      title: 'Intro Text',
      type: 'localizedText',
      group: 'content',
      description: 'Introductory text shown at top of the listing.',
    }),

    defineField({
      name: 'bottomText',
      title: 'Bottom / SEO Text',
      type: 'localizedText',
      group: 'content',
      description: 'Long-form text at bottom of page. Used for SEO.',
    }),

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'localizedSeo',
      group: 'seo',
      description: 'Meta title, description, Open Graph per language.',
    }),
  ],

  preview: {
    select: {
      scope: 'pageScope',
      cityTitle: 'city.title.en',
      districtTitle: 'district.title.en',
      facet: 'facet',
      active: 'active',
    },
    prepare({scope, cityTitle, districtTitle, facet, active}) {
      const scopeLabel =
        scope === 'propertiesRoot'
          ? 'Catalog'
          : scope === 'city'
            ? `City: ${cityTitle || '—'}`
            : scope === 'facet'
              ? `Facet: ${districtTitle || cityTitle || '—'} / ${facet || '—'}`
              : `District: ${districtTitle || '—'}`
      const status = active === false ? ' (inactive)' : ''
      return {
        title: scopeLabel + status,
        subtitle: 'Catalog SEO Page',
      }
    },
  },
})
