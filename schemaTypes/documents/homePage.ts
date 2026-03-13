import {defineType, defineField, defineArrayMember} from 'sanity'

export const homePage = defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',

  fields: [
    defineField({
      name: 'homepageSections',
      title: 'Homepage Sections',
      type: 'array',
      description: 'Add, remove, and reorder sections. Drag to reorder.',
      of: [
        defineArrayMember({type: 'homeHeroSection'}),
        defineArrayMember({type: 'homePropertyCarouselSection'}),
        defineArrayMember({type: 'homeLocationCarouselSection'}),
        defineArrayMember({type: 'homePropertyTypesSection'}),
        defineArrayMember({type: 'homeInvestmentSection'}),
        defineArrayMember({type: 'homeAboutSection'}),
        defineArrayMember({type: 'homeAgentsPromoSection'}),
        defineArrayMember({type: 'homeBlogSection'}),
        defineArrayMember({type: 'homeSeoTextSection'}),
        defineArrayMember({type: 'homeFaqSection'}),
      ],
      validation: (Rule) =>
        Rule.custom((sections) => {
          const heroCount = sections?.filter((s: {_type?: string}) => s?._type === 'homeHeroSection').length ?? 0
          if (heroCount > 1) return 'Only one Hero section allowed'
          return true
        }),
    }),
    defineField({
      name: 'seo',
      title: 'Page SEO',
      type: 'localizedSeo',
      description: 'Meta title, description and Open Graph for the homepage. Falls back to Site Settings default if empty.',
    }),
  ],

  preview: {
    prepare() {
      return {title: 'Home Page'}
    },
  },
})
