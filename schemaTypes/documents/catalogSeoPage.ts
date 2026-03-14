import {defineType, defineField} from 'sanity'

/**
 * Catalog listing page SEO content.
 * Used for /properties, /properties/[city], /properties/[city]/[district].
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
          {title: 'Properties root (/properties)', value: 'propertiesRoot'},
          {title: 'City catalog (/properties/[city])', value: 'city'},
          {title: 'District catalog (/properties/[city]/[district])', value: 'district'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
      description: 'Which catalog route this content applies to.',
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
          if (parent?.pageScope === 'city' || parent?.pageScope === 'district') {
            return value ? true : 'City is required for city and district scopes.'
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
      hidden: ({parent}) => parent?.pageScope !== 'district',
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
      description: 'Required for district scope. Must belong to the selected city.',
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
      active: 'active',
    },
    prepare({scope, cityTitle, districtTitle, active}) {
      const scopeLabel =
        scope === 'propertiesRoot'
          ? 'Properties'
          : scope === 'city'
            ? `City: ${cityTitle || '—'}`
            : `District: ${districtTitle || '—'}`
      const status = active === false ? ' (inactive)' : ''
      return {
        title: scopeLabel + status,
        subtitle: 'Catalog SEO Page',
      }
    },
  },
})
