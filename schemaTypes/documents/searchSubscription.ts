import {defineType, defineField} from 'sanity'

/**
 * A visitor's standing search: the public Telegram bot sends them the new
 * listings that match it, once a day (frontend: `src/lib/telegram/bot/search.ts`,
 * cron `/api/cron/search-alerts`).
 *
 * Written only by the frontend: created when the visitor presses Start on a
 * "new listings for this search" link, switched off by `/stop`. The team
 * can switch one off here too; nothing else is meant to be edited.
 */

const WEBSITE = 'Set by the website.'

function siteField(name: string, title: string, type: 'string' | 'number' | 'datetime' | 'boolean', description = WEBSITE) {
  return defineField({name, title, type, readOnly: true, description})
}

export const searchSubscription = defineType({
  name: 'searchSubscription',
  title: 'Search alert',
  type: 'document',
  description: 'Visitors who get new listings for a saved search in the Telegram bot.',

  fields: [
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      description: 'Off: no more alerts. The visitor turns it off with /stop; you can too.',
      initialValue: true,
    }),
    siteField('summary', 'Search', 'string', 'The search in the visitor\'s language, as the bot shows it.'),
    siteField('catalogUrl', 'Catalogue link', 'string', 'The same search on the website.'),
    siteField('locale', 'Language', 'string'),
    siteField('name', 'Visitor', 'string'),
    siteField('telegramUsername', 'Telegram @username', 'string'),
    siteField('telegramUserId', 'Telegram user id', 'string'),
    siteField('createdAt', 'Subscribed at', 'datetime'),
    siteField('lastSentAt', 'Last alert sent', 'datetime'),
    siteField('sentCount', 'Alerts sent', 'number'),
    siteField('stoppedAt', 'Stopped at', 'datetime'),
    siteField('payload', 'Start payload', 'string', 'The `start` parameter of the link the visitor pressed.'),
    defineField({
      name: 'filters',
      title: 'Filters',
      type: 'object',
      readOnly: true,
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({name: 'city', title: 'City', type: 'string'}),
        defineField({name: 'cities', title: 'Cities (any of)', type: 'array', of: [{type: 'string'}]}),
        defineField({name: 'district', title: 'District', type: 'string'}),
        defineField({name: 'type', title: 'Property type', type: 'string'}),
        defineField({name: 'types', title: 'Types (any of)', type: 'array', of: [{type: 'string'}]}),
        defineField({name: 'deal', title: 'Deal', type: 'string'}),
        defineField({name: 'stage', title: 'Construction stage', type: 'string'}),
        defineField({name: 'minPrice', title: 'Price from (EUR)', type: 'number'}),
        defineField({name: 'maxPrice', title: 'Price to (EUR)', type: 'number'}),
        defineField({name: 'minArea', title: 'Area from (m²)', type: 'number'}),
        defineField({name: 'maxArea', title: 'Area to (m²)', type: 'number'}),
        defineField({name: 'beds', title: 'Bedrooms from', type: 'number'}),
        defineField({name: 'bedsExact', title: 'Bedrooms exactly', type: 'number'}),
        defineField({name: 'nearSea', title: 'Near the sea', type: 'boolean'}),
        defineField({name: 'investment', title: 'Investment', type: 'boolean'}),
      ],
    }),
    defineField({
      name: 'sentSlugs',
      title: 'Listings already sent',
      type: 'array',
      of: [{type: 'string'}],
      readOnly: true,
      description: 'So a listing is never sent twice. The newest 200 are kept.',
      options: {collapsible: true, collapsed: true} as never,
    }),
  ],

  preview: {
    select: {summary: 'summary', name: 'name', locale: 'locale', active: 'active', sentCount: 'sentCount'},
    prepare({summary, name, locale, active, sentCount}) {
      return {
        title: `${active === false ? '⏸ ' : '🔔 '}${summary || 'Search alert'}`,
        subtitle: [name, locale ? String(locale).toUpperCase() : '', sentCount ? `${sentCount} sent` : ''].filter(Boolean).join(' · '),
      }
    },
  },
})
