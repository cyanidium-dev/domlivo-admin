import {defineType, defineField, defineArrayMember} from 'sanity'
import {languageField} from '../objects'

export const homePage = defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',

  groups: [
    {name: 'hero', title: 'Hero', default: true},
    {name: 'featured', title: 'Featured'},
    {name: 'cities', title: 'Cities'},
    {name: 'propertyTypes', title: 'Property Types'},
    {name: 'investment', title: 'Investment'},
    {name: 'about', title: 'About'},
    {name: 'agents', title: 'Agents'},
    {name: 'blog', title: 'Blog'},
    {name: 'seo', title: 'SEO'},
    {name: 'faq', title: 'FAQ'},
  ],

  fields: [
    languageField,

    // HERO
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
      group: 'hero',
      description: 'Main headline in the homepage hero section.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Hero Subtitle',
      type: 'text',
      group: 'hero',
      description: 'Supporting text below the hero headline.',
    }),
    defineField({
      name: 'heroShortLine',
      title: 'Hero Short Line',
      type: 'string',
      group: 'hero',
    }),
    defineField({
      name: 'heroBackgroundImage',
      title: 'Hero Background Image',
      type: 'image',
      group: 'hero',
      description: 'Background image used in the homepage hero section.',
      options: {hotspot: true},
    }),
    defineField({
      name: 'heroCta',
      title: 'Hero CTA',
      type: 'ctaLink',
      group: 'hero',
    }),

    // FEATURED
    defineField({
      name: 'featuredEnabled',
      title: 'Show Featured Section',
      type: 'boolean',
      group: 'featured',
      initialValue: true,
    }),
    defineField({
      name: 'featuredTitle',
      title: 'Featured Title',
      type: 'string',
      group: 'featured',
    }),
    defineField({
      name: 'featuredSubtitle',
      title: 'Featured Subtitle',
      type: 'text',
      group: 'featured',
    }),
    defineField({
      name: 'featuredCta',
      title: 'Featured CTA',
      type: 'ctaLink',
      group: 'featured',
    }),

    // CITIES
    defineField({
      name: 'citiesTitle',
      title: 'Cities Title',
      type: 'string',
      group: 'cities',
    }),
    defineField({
      name: 'citiesSubtitle',
      title: 'Cities Subtitle',
      type: 'text',
      group: 'cities',
    }),
    defineField({
      name: 'citiesCta',
      title: 'Cities CTA',
      type: 'ctaLink',
      group: 'cities',
    }),

    // PROPERTY TYPES
    defineField({
      name: 'propertyTypesTitle',
      title: 'Property Types Title',
      type: 'string',
      group: 'propertyTypes',
    }),
    defineField({
      name: 'propertyTypesSubtitle',
      title: 'Property Types Subtitle',
      type: 'text',
      group: 'propertyTypes',
    }),
    defineField({
      name: 'propertyTypesCta',
      title: 'Property Types CTA',
      type: 'ctaLink',
      group: 'propertyTypes',
    }),

    // INVESTMENT
    defineField({
      name: 'investmentTitle',
      title: 'Investment Title',
      type: 'string',
      group: 'investment',
    }),
    defineField({
      name: 'investmentSubtitle',
      title: 'Investment Subtitle',
      type: 'text',
      group: 'investment',
    }),
    defineField({
      name: 'investmentBenefits',
      title: 'Investment Benefits',
      type: 'array',
      of: [{type: 'string'}],
      group: 'investment',
      description: 'Up to 3 benefit points shown in the investment section.',
      validation: (Rule) => Rule.max(3),
    }),
    defineField({
      name: 'investmentPrimaryImage',
      title: 'Primary Investment Image',
      type: 'image',
      group: 'investment',
      options: {hotspot: true},
    }),
    defineField({
      name: 'investmentSecondaryImage',
      title: 'Secondary Investment Image',
      type: 'image',
      group: 'investment',
      options: {hotspot: true},
    }),
    defineField({
      name: 'investmentCta',
      title: 'Investment CTA',
      type: 'ctaLink',
      group: 'investment',
    }),

    // ABOUT
    defineField({
      name: 'aboutTitle',
      title: 'About Title',
      type: 'string',
      group: 'about',
    }),
    defineField({
      name: 'aboutText',
      title: 'About Text',
      type: 'array',
      of: [{type: 'block'}],
      group: 'about',
    }),
    defineField({
      name: 'aboutBenefits',
      title: 'About Benefits',
      type: 'array',
      of: [{type: 'string'}],
      group: 'about',
      description: 'Up to 3 benefit points shown in the about section.',
      validation: (Rule) => Rule.max(3),
    }),

    // AGENTS
    defineField({
      name: 'agentsEnabled',
      title: 'Show Agents Section',
      type: 'boolean',
      group: 'agents',
      initialValue: true,
    }),
    defineField({
      name: 'agentsTitle',
      title: 'Agents Title',
      type: 'string',
      group: 'agents',
    }),
    defineField({
      name: 'agentsSubtitle',
      title: 'Agents Subtitle',
      type: 'text',
      group: 'agents',
    }),
    defineField({
      name: 'agentsText',
      title: 'Agents Text',
      type: 'array',
      of: [{type: 'block'}],
      group: 'agents',
    }),
    defineField({
      name: 'agentsBenefits',
      title: 'Agents Benefits',
      type: 'array',
      of: [{type: 'string'}],
      group: 'agents',
      description: 'Up to 3 benefit points shown in the agents section.',
      validation: (Rule) => Rule.max(3),
    }),
    defineField({
      name: 'agentsCta',
      title: 'Agents CTA',
      type: 'ctaLink',
      group: 'agents',
    }),

    // BLOG
    defineField({
      name: 'blogEnabled',
      title: 'Show Blog Section',
      type: 'boolean',
      group: 'blog',
      initialValue: true,
    }),
    defineField({
      name: 'blogTitle',
      title: 'Blog Title',
      type: 'string',
      group: 'blog',
    }),
    defineField({
      name: 'blogSubtitle',
      title: 'Blog Subtitle',
      type: 'text',
      group: 'blog',
    }),
    defineField({
      name: 'blogCta',
      title: 'Blog CTA',
      type: 'ctaLink',
      group: 'blog',
    }),

    // SEO
    defineField({
      name: 'seoText',
      title: 'SEO Text',
      type: 'array',
      of: [{type: 'block'}],
      group: 'seo',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),

    // FAQ
    defineField({
      name: 'faqEnabled',
      title: 'Show FAQ Section',
      type: 'boolean',
      group: 'faq',
      initialValue: true,
    }),
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
      validation: (Rule) => Rule.required().min(1).max(20),
    }),
  ],

  preview: {
    select: {
      language: 'language',
    },
    prepare(selection) {
      return {
        title: 'Home Page',
        subtitle: selection.language || undefined,
      }
    },
  },
})
