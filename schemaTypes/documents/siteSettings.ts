import {defineType, defineField, defineArrayMember} from 'sanity'
import {CurrencyRatesInput} from '../../components/sanity/CurrencyRatesInput'
import {DisplayCurrenciesInput} from '../../components/sanity/DisplayCurrenciesInput'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',

  groups: [
    {name: 'branding', title: 'Branding', default: true},
    {name: 'contact', title: 'Contact'},
    {name: 'social', title: 'Social'},
    {name: 'footer', title: 'Footer'},
    {name: 'content', title: 'Content'},
    {name: 'currency', title: 'Currency'},
    {name: 'seo', title: 'SEO'},
  ],

  fields: [
    // BRANDING
    defineField({
      name: 'siteName',
      title: 'Site Name',
      type: 'localizedString',
      group: 'branding',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'siteTagline',
      title: 'Site Tagline',
      type: 'localizedString',
      group: 'branding',
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      group: 'branding',
      options: {hotspot: true},
    }),

    // CONTACT
    defineField({
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'string',
      group: 'contact',
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: 'contactPhone',
      title: 'Contact Phone',
      type: 'string',
      group: 'contact',
    }),
    defineField({
      name: 'companyAddress',
      title: 'Company Address',
      type: 'text',
      group: 'contact',
    }),

    // SOCIAL
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      of: [defineArrayMember({type: 'socialLink'})],
      group: 'social',
      validation: (Rule) => Rule.max(10),
    }),

    // FOOTER
    defineField({
      name: 'footerQuickLinks',
      title: 'Footer Quick Links',
      type: 'array',
      of: [defineArrayMember({type: 'localizedFooterLink'})],
      group: 'footer',
      validation: (Rule) => Rule.max(20),
    }),
    defineField({
      name: 'policyLinks',
      title: 'Footer Policy Links',
      type: 'array',
      of: [defineArrayMember({type: 'localizedFooterLink'})],
      group: 'footer',
      validation: (Rule) => Rule.max(20),
    }),
    defineField({
      name: 'copyrightText',
      title: 'Copyright Text',
      type: 'localizedString',
      group: 'footer',
    }),

    // CONTENT
    defineField({
      name: 'similarPropertiesCount',
      title: 'Similar Properties Count',
      type: 'number',
      group: 'content',
      initialValue: 2,
      validation: (Rule) => Rule.min(1).max(12),
      description: 'Number of similar properties shown on property details page.',
    }),
    defineField({
      name: 'maxFeaturedProperties',
      title: 'Max Featured Properties',
      type: 'number',
      group: 'content',
      initialValue: 6,
      validation: (Rule) =>
        Rule.required()
          .integer()
          .min(1)
          .max(50)
          .error('Enter a whole number from 1 to 50.'),
      description:
        'Maximum number of featured properties shown as promoted items above catalog results.',
    }),
    defineField({
      name: 'priceRange',
      title: 'Price Range',
      type: 'priceRange',
      group: 'content',
      description:
        'Used by hero search and properties filters. Values are in EUR. Frontend falls back to defaults if missing.',
    }),
    defineField({
      name: 'areaRange',
      title: 'Area Range',
      type: 'areaRange',
      group: 'content',
      description:
        'Default area bounds for the catalog area slider. If left empty, frontend falls back to property data.',
      validation: (Rule) =>
        Rule.custom((value) => {
          if (value == null || typeof value !== 'object') return true
          const {from, to} = value as {from?: unknown; to?: unknown}
          if (from == null && to == null) return true
          if (from == null || to == null) {
            return 'Set both From and To, or leave both empty.'
          }
          if (typeof from !== 'number' || typeof to !== 'number') {
            return 'From and To must be numbers.'
          }
          if (from < 0 || to < 0) {
            return 'Values cannot be negative.'
          }
          if (to < from) {
            return 'To must be greater than or equal to From.'
          }
          return true
        }),
    }),

    // CURRENCY
    defineField({
      name: 'currencyRates',
      title: 'Exchange Rates',
      type: 'array',
      of: [defineArrayMember({type: 'currencyRate'})],
      group: 'currency',
      readOnly: true,
      description: 'Rates synced by cron. Do not edit manually. EUR = base (1).',
      components: {
        input: CurrencyRatesInput,
      },
      options: {
        collapsible: true,
        collapsed: true,
      },
    }),
    defineField({
      name: 'currencyLastSyncedAt',
      title: 'Last Synced At',
      type: 'datetime',
      group: 'currency',
      readOnly: true,
      description: 'When exchange rates were last updated by the cron job.',
    }),
    defineField({
      name: 'displayCurrencies',
      title: 'Display Currencies',
      type: 'array',
      of: [{type: 'string'}],
      group: 'currency',
      description:
        'Currencies the frontend can show. Select from the synced rates above. At least one required.',
      components: {
        input: DisplayCurrenciesInput,
      },
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const rates = (context.document?.currencyRates as {code?: string}[] | undefined) ?? []
          const codes = new Set(rates.map((r) => r?.code).filter(Boolean))

          if (codes.size === 0) {
            if (value && Array.isArray(value) && value.length > 0) {
              return 'Sync exchange rates first, then select display currencies.'
            }
            return true
          }

          if (!value || !Array.isArray(value) || value.length < 1) {
            return 'Select at least one display currency.'
          }

          const unique = [...new Set(value.filter((c): c is string => typeof c === 'string'))]
          if (unique.length !== value.length) {
            return 'Duplicate currencies are not allowed.'
          }

          const invalid = value.filter((code) => typeof code === 'string' && !codes.has(code))
          if (invalid.length > 0) {
            return `Selected currencies not in rates: ${invalid.join(', ')}. Remove them or sync rates.`
          }
          return true
        }),
    }),

    // SEO
    defineField({
      name: 'defaultSeo',
      title: 'Default SEO',
      type: 'localizedSeo',
      group: 'seo',
      description: 'Default meta and Open Graph values used when page-specific SEO is not set',
    }),
  ],

  preview: {
    prepare() {
      return {title: 'Site Settings'}
    },
  },
})
