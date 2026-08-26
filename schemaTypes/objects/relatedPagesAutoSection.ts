import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * Auto-interlinking block (ТЗ-16). The items are resolved from data at render
 * time — nothing item-level is editable on the page, so a link can never
 * drift from the documents it points at. Four modes:
 *
 * - `cityDistricts`   — district landings of a city (the page's own city by default)
 * - `zoneComparisons` — comparison guides whose `topicTags` carry `zone:<slug>`
 *                       for the page's zone (or all of the page's own zone tags)
 * - `topicGuides`     — custom landings sharing any of the given topic tags
 * - `manual`          — hand-picked landing references
 *
 * See docs/engineering/SPEC-tz16-related-pages-2026-08-26.md.
 */
export const relatedPagesAutoSection = defineType({
  name: 'relatedPagesAutoSection',
  title: 'Related pages (automatic)',
  type: 'object',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'settings', title: 'Settings'},
  ],
  fields: [
    defineField({
      name: 'enabled',
      title: 'Enabled',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
    }),
    defineField({
      name: 'title',
      title: 'Section title',
      type: 'localizedString',
      group: 'content',
      description: 'Optional. Empty shows a translated default heading for the chosen mode.',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'localizedText',
      group: 'content',
    }),
    defineField({
      name: 'mode',
      title: 'What to show',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'Districts of this city (automatic)', value: 'cityDistricts'},
          {title: 'Comparisons involving this zone (automatic)', value: 'zoneComparisons'},
          {title: 'Guides by topic tags (automatic)', value: 'topicGuides'},
          {title: 'Manual picks', value: 'manual'},
        ],
        layout: 'radio',
      },
      initialValue: 'cityDistricts',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'city',
      title: 'City',
      type: 'reference',
      to: [{type: 'city'}],
      group: 'settings',
      hidden: ({parent}) => parent?.mode !== 'cityDistricts',
      description: "Leave empty to use this page's own city.",
    }),
    defineField({
      name: 'zone',
      title: 'Zone',
      type: 'reference',
      to: [{type: 'district'}, {type: 'city'}],
      group: 'settings',
      hidden: ({parent}) => parent?.mode !== 'zoneComparisons',
      description: "Leave empty to use this page's own zone.",
    }),
    defineField({
      name: 'topicTags',
      title: 'Topic tags to match',
      type: 'array',
      of: [{type: 'string'}],
      group: 'settings',
      hidden: ({parent}) => parent?.mode !== 'topicGuides',
      description: "Leave empty to use this page's own topic tags.",
      validation: (Rule) => Rule.unique(),
    }),
    defineField({
      name: 'manualItems',
      title: 'Pages',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'landingPage'}]})],
      group: 'settings',
      hidden: ({parent}) => parent?.mode !== 'manual',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {mode?: string} | undefined
          if (parent?.mode !== 'manual') return true
          return Array.isArray(value) && value.length > 0
            ? true
            : 'Pick at least one page, or switch to an automatic mode.'
        }),
    }),
    defineField({
      name: 'limit',
      title: 'Max cards',
      type: 'number',
      group: 'settings',
      initialValue: 6,
      validation: (Rule) => Rule.min(3).max(8),
    }),
  ],
  preview: {
    select: {title: 'title.en', mode: 'mode', enabled: 'enabled'},
    prepare({title, mode, enabled}: {title?: string; mode?: string; enabled?: boolean}) {
      const source =
        mode === 'zoneComparisons'
          ? "comparisons involving this page's zone"
          : mode === 'topicGuides'
            ? 'guides by topic tags'
            : mode === 'manual'
              ? 'manual picks'
              : "districts of this page's city"
      return {
        title: `${enabled === false ? '(off) ' : ''}${title || 'Related pages (automatic)'}`,
        subtitle: source,
      }
    },
  },
})
