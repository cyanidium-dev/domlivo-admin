import {defineType, defineField} from 'sanity'

/**
 * Benefit line with an icon. Used in marketingContentSection.benefitItems.
 * The legacy `benefits` field (array of localizedString) remains supported as
 * a fallback when no benefitItems are provided.
 */
export const marketingBenefit = defineType({
  name: 'marketingBenefit',
  title: 'Marketing benefit',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'iconKey',
      title: 'Icon',
      type: 'string',
      description: 'Phosphor icon shown next to the benefit (default: check-circle).',
      options: {
        list: [
          {value: 'check-circle', title: '✓  Check'},
          {value: 'users', title: '👥 Users'},
          {value: 'lightning', title: '⚡ Lightning'},
          {value: 'chart-line-up', title: '📈 Chart'},
          {value: 'shield-check', title: '🛡 Shield'},
          {value: 'gear', title: '⚙ Settings'},
          {value: 'coin', title: '🪙 Coin'},
          {value: 'globe', title: '🌐 Globe'},
          {value: 'headset', title: '🎧 Headset'},
          {value: 'code', title: '</> Code'},
          {value: 'buildings', title: '🏢 Buildings'},
          {value: 'megaphone', title: '📣 Megaphone'},
        ],
      },
    }),
  ],
  preview: {
    select: {label: 'label.en', icon: 'iconKey'},
    prepare({label, icon}: {label?: string; icon?: string}) {
      return {title: label || 'Benefit', subtitle: icon || 'check-circle'}
    },
  },
})
