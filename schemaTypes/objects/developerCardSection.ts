import {defineType, defineField} from 'sanity'
import {PAGE_BUILDER_GROUPS} from '../constants/pageBuilderGroups'

/**
 * Single expanded developer card for embedding into district pages / guides.
 * The mandatory disclaimer here is a standard dictionary string on the
 * frontend (one key ×5 locales) — no duplicated CMS field.
 */
export const developerCardSection = defineType({
  name: 'developerCardSection',
  title: 'Developer card',
  type: 'object',
  groups: [...PAGE_BUILDER_GROUPS],
  fields: [
    defineField({
      name: 'enabled',
      title: 'Enabled / Visible',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
      description: 'If disabled, this section is hidden on the site.',
    }),
    defineField({
      name: 'developer',
      title: 'Developer',
      type: 'reference',
      group: 'data',
      to: [{type: 'developer'}],
      options: {filter: 'isPublished != false'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title override (optional)',
      type: 'localizedString',
      group: 'content',
    }),
  ],
  preview: {
    select: {name: 'developer.name', tier: 'developer.tier', enabled: 'enabled'},
    prepare({name, tier, enabled}: {name?: string; tier?: string; enabled?: boolean}) {
      const dot = tier === 'green' ? '🟢' : tier === 'yellow' ? '🟡' : tier === 'red' ? '🔴' : '⚪'
      const status = enabled === false ? ' (hidden)' : ''
      return {title: `${dot} ${name || 'Developer card'}${status}`}
    },
  },
})
