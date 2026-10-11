import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Lead form for a landing: name, phone, optional budget and wish. Posts to the
 * site's contact endpoint as placement "landing" with this landing's slug, so
 * the Telegram message and the Lead in Studio name the page that sold it.
 */
export const leadFormSection = defineType({
  name: 'leadFormSection',
  title: 'Lead form',
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
      title: 'Title',
      type: 'localizedString',
      group: 'content',
      description: 'Empty: "Get a tailored offer within 1 hour" in the page language.',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'localizedText',
      group: 'content',
    }),
    defineField({
      name: 'submitLabel',
      title: 'Button label',
      type: 'localizedString',
      group: 'content',
      description: 'Empty: "Get the offer" in the page language.',
    }),
    defineField({
      name: 'showBudget',
      title: 'Ask for a budget',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
    }),
    defineField({
      name: 'budgetOptions',
      title: 'Budget options',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'localizedString'})],
      hidden: ({parent}) => parent?.showBudget === false,
      description:
        'The choices of the budget select, in order (e.g. "do 50 000 €"). Empty: four bands (up to €50k, €50–100k, €100–200k, over €200k) in the page language.',
    }),
    defineField({
      name: 'showMessage',
      title: 'Ask what they are looking for',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
      description: 'An optional free-text field under the phone.',
    }),
    defineField({
      name: 'messengerCta',
      title: 'WhatsApp / Telegram buttons beside the form',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
      description: "The site's messenger links next to the heading. Off: a small row under the form instead.",
    }),
    defineField({
      name: 'anchorId',
      title: 'Anchor',
      type: 'string',
      group: 'settings',
      initialValue: 'lead-form',
      description:
        'Link to the form from a button with "#lead-form" (or the anchor set here). Lower-case letters, digits and dashes.',
      validation: (Rule) =>
        Rule.regex(/^[a-z][a-z0-9-_]*$/, {name: 'anchor'}).error(
          'Lower-case letters, digits, dashes; start with a letter.',
        ),
    }),
  ],
  preview: {
    select: {title: 'title.en', titlePl: 'title.pl', titleDe: 'title.de', titleRu: 'title.ru', enabled: 'enabled'},
    prepare({
      title,
      titlePl,
      titleDe,
      titleRu,
      enabled,
    }: {
      title?: string
      titlePl?: string
      titleDe?: string
      titleRu?: string
      enabled?: boolean
    }) {
      const name = title || titlePl || titleDe || titleRu || 'Lead form'
      return {title: `${name}${enabled === false ? ' (hidden)' : ''}`, subtitle: 'Lead form'}
    },
  },
})
