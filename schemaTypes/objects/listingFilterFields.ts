import {defineArrayMember, defineField} from 'sanity'

/**
 * The catalogue filter a landing block lists from. Shared by the property
 * carousel's auto mode and the inventory band, so a band placed above a feed
 * can describe exactly that feed. The frontend reads it in
 * `lib/landing/listingFilter.ts`; every field is optional, and a block with no
 * place follows its page (a district landing → that district).
 */
export function listingFilterFields() {
  return [
    defineField({name: 'city', title: 'City', type: 'reference', to: [{type: 'city'}]}),
    defineField({
      name: 'cities',
      title: 'Cities (any of)',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'city'}]})],
      description:
        'Several cities, matched with OR (e.g. Durrës + Vlorë for a "by the sea" page). Merged with City above. One city in total links "See all" to that city\'s listing page; several link to the catalogue.',
      validation: (Rule) => Rule.unique(),
    }),
    defineField({
      name: 'district',
      title: 'District',
      type: 'reference',
      to: [{type: 'district'}],
      description:
        "Wins over City. Without it, a district page's carousel shows the whole city — other districts' properties included.",
    }),
    defineField({
      name: 'propertyType',
      title: 'Property type',
      type: 'reference',
      to: [{type: 'propertyType'}],
    }),
    defineField({
      name: 'propertyTypes',
      title: 'Property types (any of)',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'propertyType'}]})],
      description: 'Several types, matched with OR (e.g. house + villa). Combine with Property type only if you mean both.',
      validation: (Rule) => Rule.unique(),
    }),
    defineField({
      name: 'deal',
      title: 'Deal',
      type: 'string',
      options: {
        list: [
          {title: 'Sale', value: 'sale'},
          {title: 'Long-term rent', value: 'rent'},
          {title: 'Short-term rent', value: 'short-term'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
    defineField({
      name: 'stage',
      title: 'Construction stage',
      type: 'string',
      description:
        'Makes this block about new builds. "Still being built" covers off-plan and under construction together, which is how buyers ask for it.',
      options: {
        list: [
          {title: 'Still being built', value: 'unfinished'},
          {title: 'Off-plan', value: 'off-plan'},
          {title: 'Under construction', value: 'under-construction'},
          {title: 'Completed', value: 'completed'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'investment',
      title: 'Only listings marked as an investment',
      type: 'boolean',
      initialValue: false,
      description:
        'Uses the Investment flag on the property — an editorial judgement, not a fact about the building. Combine with a stage to get "new builds worth investing in".',
    }),
    defineField({
      name: 'minPrice',
      title: 'Minimum price (EUR)',
      type: 'number',
      description: 'Total asking price. Listings priced per m² are left out of any price range.',
      validation: (Rule) => Rule.min(0).integer(),
    }),
    defineField({
      name: 'maxPrice',
      title: 'Maximum price (EUR)',
      type: 'number',
      description: 'Total asking price, e.g. 70000 for an "under €70k" feed.',
      validation: (Rule) =>
        Rule.min(0)
          .integer()
          .custom((value, context) => {
            const min = (context.parent as {minPrice?: number} | undefined)?.minPrice
            if (typeof value === 'number' && typeof min === 'number' && min > 0 && value > 0 && value < min) {
              return 'Maximum price is below the minimum.'
            }
            return true
          }),
    }),
    defineField({
      name: 'nearSea',
      title: 'Near the sea',
      type: 'boolean',
      initialValue: false,
      description: 'Within 300 m of the sea (the listing\'s sea distance) or on the first line — the catalogue\'s "near the sea" filter.',
    }),
  ]
}
