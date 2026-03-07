import {defineType, defineField, defineArrayMember} from 'sanity'
import {languageField} from '../objects'

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
    languageField,

    // BRANDING
    defineField({
      name: 'siteName',
      title: 'Site Name',
      type: 'string',
      group: 'branding',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'siteTagline',
      title: 'Site Tagline',
      type: 'string',
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
      of: [defineArrayMember({type: 'footerLink'})],
      group: 'footer',
      validation: (Rule) => Rule.max(20),
    }),
    defineField({
      name: 'copyrightText',
      title: 'Copyright Text',
      type: 'string',
      group: 'footer',
    }),

    // SEO
    defineField({
      name: 'defaultSeo',
      title: 'Default SEO',
      type: 'seo',
      group: 'seo',
      description: 'Default meta and Open Graph values used when page-specific SEO is not set',
    }),
  ],

  preview: {
    select: {
      language: 'language',
    },
    prepare(selection) {
      return {
        title: 'Site Settings',
        subtitle: selection.language || undefined,
      }
    },
  },
})
