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
    {name: 'properties', title: 'Properties'},
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

    // Contacts page — manager portrait only; email and socials use Contact Email + Social Links (site-wide)
    defineField({
      name: 'contactsManagerPhoto',
      title: 'Contacts page — Manager photo',
      type: 'image',
      group: 'contact',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alternative text', description: 'For accessibility'}],
      description:
        'Photo for the manager block on the general Contacts page. Email and social links come from “Contact Email” above and “Social Links” in the Social group.',
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

    // FOOTER (navigation is frontend-owned; CMS supplies data only)
    defineField({
      name: 'footerIntro',
      title: 'Footer Intro',
      type: 'localizedString',
      group: 'footer',
      description:
        'Optional short supporting text in the footer (separate from the global site tagline). Labels and layout are defined in code.',
    }),
    defineField({
      name: 'footerTelegramUrl',
      title: 'Footer — Telegram URL',
      type: 'string',
      group: 'footer',
      description: 'Optional public Telegram link for the footer contact area.',
      validation: (Rule) =>
        Rule.custom((value: string | undefined) => {
          if (value == null || !String(value).trim()) return true
          const v = String(value).trim()
          if (!/^https?:\/\//i.test(v)) return 'Use a full URL starting with http:// or https://.'
          try {
            void new URL(v)
            return true
          } catch {
            return 'Enter a valid URL.'
          }
        }),
    }),
    defineField({
      name: 'footerWhatsappUrl',
      title: 'Footer — WhatsApp URL',
      type: 'string',
      group: 'footer',
      description: 'Optional WhatsApp link (e.g. https://wa.me/…).',
      validation: (Rule) =>
        Rule.custom((value: string | undefined) => {
          if (value == null || !String(value).trim()) return true
          const v = String(value).trim()
          if (!/^https?:\/\//i.test(v)) return 'Use a full URL starting with http:// or https://.'
          try {
            void new URL(v)
            return true
          } catch {
            return 'Enter a valid URL.'
          }
        }),
    }),
    defineField({
      name: 'footerApp',
      title: 'Footer App',
      type: 'footerApp',
      group: 'footer',
      description: 'Store URLs for a future app column; visibility is controlled by enabled (UI copy lives in the frontend).',
    }),
    defineField({
      name: 'footerCodesiteUrl',
      title: 'Footer — Codesite URL',
      type: 'string',
      group: 'footer',
      description: 'Optional partner/credits link (label in frontend).',
      validation: (Rule) =>
        Rule.custom((value: string | undefined) => {
          if (value == null || !String(value).trim()) return true
          const v = String(value).trim()
          if (!/^https?:\/\//i.test(v)) return 'Use a full URL starting with http:// or https://.'
          try {
            void new URL(v)
            return true
          } catch {
            return 'Enter a valid URL.'
          }
        }),
    }),
    defineField({
      name: 'footerWebbondUrl',
      title: 'Footer — Webbond URL',
      type: 'string',
      group: 'footer',
      description: 'Optional partner/credits link (label in frontend).',
      validation: (Rule) =>
        Rule.custom((value: string | undefined) => {
          if (value == null || !String(value).trim()) return true
          const v = String(value).trim()
          if (!/^https?:\/\//i.test(v)) return 'Use a full URL starting with http:// or https://.'
          try {
            void new URL(v)
            return true
          } catch {
            return 'Enter a valid URL.'
          }
        }),
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
      name: 'propertySettings',
      title: 'Property Settings',
      type: 'propertySettings',
      group: 'properties',
      description:
        'Property-specific defaults and catalog banner candidates for the /catalog experience.',
    }),
    defineField({
      name: 'howToPublishVideoUrl',
      title: 'How to Publish — Hero Video URL',
      type: 'string',
      group: 'content',
      description:
        'Optional embed URL for the hero video on `/how-to-publish` (and localized routes such as `/[locale]/how-to-publish`). Paste a YouTube, Vimeo, or other URL the frontend supports for embedding. Leave empty to hide the video or until a link is ready.',
      validation: (Rule) =>
        Rule.custom((value: string | undefined) => {
          if (value == null || !String(value).trim()) return true
          const v = String(value).trim()
          if (!/^https?:\/\//i.test(v)) return 'Use a full URL starting with http:// or https://.'
          try {
            void new URL(v)
            return true
          } catch {
            return 'Enter a valid URL.'
          }
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
