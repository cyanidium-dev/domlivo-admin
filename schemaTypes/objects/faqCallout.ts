import {defineType, defineField} from 'sanity'

/**
 * Sticky brand callout shown alongside the FAQ accordion.
 * Optional — if all fields are empty, the FAQ section renders without it.
 */
export const faqCallout = defineType({
  name: 'faqCallout',
  title: 'FAQ Callout',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      description: 'Short headline, e.g. "Still have questions?"',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'localizedString',
      description: 'One-line subtitle under the title, e.g. "Free 15-min consultation"',
    }),
    defineField({
      name: 'primaryCta',
      title: 'Primary CTA',
      type: 'localizedCtaLink',
      description: 'Main button. Required to render the callout.',
    }),
    defineField({
      name: 'secondaryCta',
      title: 'Secondary CTA',
      type: 'localizedCtaLink',
      description: 'Optional secondary link (e.g. Telegram / WhatsApp).',
    }),
    defineField({
      name: 'secondaryIcon',
      title: 'Secondary CTA icon',
      type: 'string',
      description: 'Phosphor icon key (e.g. "telegram-logo", "whatsapp-logo", "chat-circle").',
      options: {
        list: [
          {value: 'telegram-logo', title: 'Telegram'},
          {value: 'whatsapp-logo', title: 'WhatsApp'},
          {value: 'chat-circle', title: 'Chat'},
          {value: 'envelope', title: 'Email'},
          {value: 'phone', title: 'Phone'},
        ],
      },
      hidden: ({parent}: {parent?: Record<string, unknown>}) => !parent?.secondaryCta,
    }),
  ],
  preview: {
    select: {title: 'title.en', sub: 'subtitle.en'},
    prepare({title, sub}: {title?: string; sub?: string}) {
      return {title: title || 'FAQ Callout', subtitle: sub || ''}
    },
  },
})
