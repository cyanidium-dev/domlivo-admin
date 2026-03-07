import {defineType, defineField, defineArrayMember} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',

  groups: [
    {name: 'branding', title: 'Branding', default: true},
    {name: 'contact', title: 'Contact'},
    {name: 'social', title: 'Social'},
    {name: 'footer', title: 'Footer'},
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
      name: 'copyrightText',
      title: 'Copyright Text',
      type: 'localizedString',
      group: 'footer',
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
