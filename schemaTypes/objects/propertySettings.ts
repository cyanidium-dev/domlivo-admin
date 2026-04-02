import {defineType, defineField, defineArrayMember} from 'sanity'

export const propertySettings = defineType({
  name: 'propertySettings',
  title: 'Property Settings',
  type: 'object',
  fields: [
    defineField({
      name: 'promotionDefaults',
      title: 'Promotion Defaults',
      type: 'object',
      description:
        'Global defaults for Premium and Top promotions. Agent-level overrides can still take precedence.',
      fields: [
        defineField({
          name: 'maxPremiumPromotions',
          title: 'Max Premium promotions',
          type: 'number',
          initialValue: 6,
          validation: (Rule) =>
            Rule.required()
              .integer()
              .min(1)
              .max(50)
              .error('Enter a whole number from 1 to 50.'),
        }),
        defineField({
          name: 'maxTopPromotions',
          title: 'Max Top promotions',
          type: 'number',
          initialValue: 6,
          validation: (Rule) =>
            Rule.required()
              .integer()
              .min(1)
              .max(50)
              .error('Enter a whole number from 1 to 50.'),
        }),
      ],
    }),
    defineField({
      name: 'catalogDefaults',
      title: 'Catalog Defaults',
      type: 'object',
      description: 'Defaults used by property catalog and property detail experiences.',
      fields: [
        defineField({
          name: 'similarPropertiesCount',
          title: 'Similar Properties Count',
          type: 'number',
          initialValue: 2,
          validation: (Rule) => Rule.min(1).max(12),
        }),
        defineField({
          name: 'priceRange',
          title: 'Price Range',
          type: 'priceRange',
        }),
        defineField({
          name: 'areaRange',
          title: 'Area Range',
          type: 'areaRange',
        }),
      ],
    }),
    defineField({
      name: 'propertyCatalogBanners',
      title: 'Property Catalog Banners',
      type: 'array',
      description:
        'Pool of candidate banners for /properties. The frontend may show up to 3 eligible banners for the current catalog view.',
      of: [defineArrayMember({type: 'propertyCatalogBanner'})],
    }),
  ],
})

