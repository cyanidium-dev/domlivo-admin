import {defineType, defineField, defineArrayMember} from 'sanity'
import {PAGE_BUILDER_GROUPS} from '../constants/pageBuilderGroups'
import {requireLocalizedEn} from './mortgageCalcSection'

/**
 * Developer traffic-light rating: grouped list of `developer` documents.
 * Mandatory visible disclaimer (legal caution — see 06-developers research doc).
 */
export const developersRatingSection = defineType({
  name: 'developersRatingSection',
  title: 'Developers rating',
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
    defineField({name: 'title', title: 'Title', type: 'localizedString', group: 'content'}),
    defineField({name: 'subtitle', title: 'Subtitle (optional)', type: 'localizedText', group: 'content'}),
    defineField({
      name: 'mode',
      title: 'Mode',
      type: 'string',
      group: 'data',
      options: {
        list: [
          {title: 'All published developers', value: 'all'},
          {title: 'Selected only', value: 'selected'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'all',
    }),
    defineField({
      name: 'developers',
      title: 'Developers (for "Selected only")',
      type: 'array',
      group: 'data',
      hidden: ({parent}) => parent?.mode !== 'selected',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'developer'}],
          options: {filter: 'isPublished != false'},
        }),
      ],
    }),
    defineField({
      name: 'showTiers',
      title: 'Show tiers (empty = all)',
      type: 'array',
      group: 'data',
      of: [defineArrayMember({type: 'string'})],
      options: {
        list: [
          {title: 'Green', value: 'green'},
          {title: 'Yellow', value: 'yellow'},
          {title: 'Red', value: 'red'},
        ],
      },
    }),
    defineField({
      name: 'disclaimer',
      title: 'Disclaimer (required)',
      type: 'localizedText',
      group: 'content',
      description:
        'Mandatory, always visible: editorial assessment, mention in a case is not a verdict. The block must not be published without it.',
      validation: (Rule) =>
        Rule.required().custom(requireLocalizedEn('Disclaimer is required (at least English).')),
    }),
  ],
  preview: {
    select: {title: 'title.en', enabled: 'enabled', mode: 'mode'},
    prepare({title, enabled, mode}: {title?: string; enabled?: boolean; mode?: string}) {
      const status = enabled === false ? ' (hidden)' : ''
      return {title: (title || 'Developers rating') + status, subtitle: mode || 'all'}
    },
  },
})
