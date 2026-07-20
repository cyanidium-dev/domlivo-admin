import {defineType, defineField} from 'sanity'
import {PAGE_BUILDER_GROUPS} from '../constants/pageBuilderGroups'

/**
 * Embeds a `tracker` document on a landing: full (status + timeline + FAQ +
 * sources) or compact (status card for sidebars/inserts).
 */
export const trackerSection = defineType({
  name: 'trackerSection',
  title: 'Status tracker',
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
      name: 'tracker',
      title: 'Tracker',
      type: 'reference',
      group: 'data',
      to: [{type: 'tracker'}],
      options: {filter: 'isPublished != false'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'displayMode',
      title: 'Display mode',
      type: 'string',
      group: 'layout',
      options: {
        list: [
          {title: 'Full (timeline, FAQ, sources)', value: 'full'},
          {title: 'Compact (status card)', value: 'compact'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'full',
    }),
    defineField({
      name: 'title',
      title: 'Title override (optional)',
      type: 'localizedString',
      group: 'content',
      description: 'Overrides the tracker document title on this landing.',
    }),
  ],
  preview: {
    select: {trackerTitle: 'tracker.title.en', enabled: 'enabled', mode: 'displayMode'},
    prepare({trackerTitle, enabled, mode}: {trackerTitle?: string; enabled?: boolean; mode?: string}) {
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (trackerTitle || 'Tracker') + status, subtitle: mode || 'full'}
    },
  },
})
