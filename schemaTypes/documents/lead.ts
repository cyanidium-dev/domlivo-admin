import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * Leads from the website: form submissions and clicks on WhatsApp / phone /
 * email links, with where the visitor came from and what they looked at.
 *
 * Created only by the frontend (`src/lib/leads/createLead.ts`, server-side,
 * with SANITY_API_TOKEN). Everything the website wrote is read-only here; the
 * team works a lead through `status` and `notes`. The lists below mirror
 * `src/lib/leads/types.ts` in the frontend — change both together.
 *
 * No IP address is ever stored; `country` comes from the edge geo header.
 */

export const LEAD_TYPES = [
  {title: 'Contact form', value: 'contact_form'},
  {title: 'Property inquiry', value: 'property_inquiry'},
  {title: 'Agent contact', value: 'agent_contact'},
  {title: 'Registration (realtor / agency)', value: 'registration'},
  {title: 'Clicked WhatsApp', value: 'click_whatsapp'},
  {title: 'Clicked Telegram', value: 'click_telegram'},
  {title: 'Clicked phone', value: 'click_phone'},
  {title: 'Clicked email', value: 'click_email'},
] as const

export const LEAD_STATUSES = [
  {title: 'New', value: 'new'},
  {title: 'Contacted', value: 'contacted'},
  {title: 'Qualified', value: 'qualified'},
  {title: 'Viewing', value: 'viewing'},
  {title: 'Negotiation', value: 'negotiation'},
  {title: 'Won', value: 'won'},
  {title: 'Lost', value: 'lost'},
  {title: 'Spam / test', value: 'spam'},
] as const

export const LEAD_CHANNELS = [
  {title: 'Direct', value: 'direct'},
  {title: 'Organic search', value: 'organic_search'},
  {title: 'Paid search', value: 'paid_search'},
  {title: 'AI assistant', value: 'ai'},
  {title: 'Social', value: 'social'},
  {title: 'Email', value: 'email'},
  {title: 'Referral', value: 'referral'},
  {title: 'Campaign (UTM)', value: 'campaign'},
] as const

const TYPE_ICON: Record<string, string> = {
  contact_form: '📝',
  property_inquiry: '🏠',
  agent_contact: '👤',
  registration: '🧾',
  click_whatsapp: '🟢',
  click_telegram: '✈️',
  click_phone: '📞',
  click_email: '✉️',
}

const WEBSITE = 'Written by the website. Read-only.'

function label<T extends {title: string; value: string}>(list: readonly T[], value: unknown): string {
  return list.find((i) => i.value === value)?.title ?? (typeof value === 'string' ? value : '—')
}

/** Read-only string field in a group. */
function siteString(name: string, title: string, group: string, description = WEBSITE) {
  return defineField({name, title, type: 'string', group, readOnly: true, description})
}

const touchFields = [
  defineField({name: 'source', title: 'Source', type: 'string'}),
  defineField({name: 'medium', title: 'Medium', type: 'string'}),
  defineField({name: 'channel', title: 'Channel', type: 'string', options: {list: [...LEAD_CHANNELS]}}),
  defineField({name: 'campaign', title: 'Campaign', type: 'string'}),
  defineField({name: 'landingPage', title: 'Landing page', type: 'string'}),
  defineField({name: 'referrerHost', title: 'Referrer host', type: 'string'}),
  defineField({name: 'at', title: 'At', type: 'datetime'}),
]

export const lead = defineType({
  name: 'lead',
  title: 'Lead',
  type: 'document',
  description: 'Leads from website forms and contact-link clicks. Work them through Status and Notes.',

  initialValue: () => ({status: 'new', internal: false}),

  groups: [
    {name: 'review', title: 'Review', default: true},
    {name: 'contact', title: 'Contact'},
    {name: 'subject', title: 'Property'},
    {name: 'attribution', title: 'Source'},
    {name: 'journey', title: 'Journey'},
  ],

  fields: [
    // --- Review: the only fields the team edits ------------------------------
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'review',
      options: {list: [...LEAD_STATUSES], layout: 'radio'},
      initialValue: 'new',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      group: 'review',
      rows: 5,
      description: 'Internal notes. Never shown on the website.',
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      group: 'review',
      readOnly: true,
      options: {list: [...LEAD_TYPES]},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'createdAt',
      title: 'Created at',
      type: 'datetime',
      group: 'review',
      readOnly: true,
    }),
    defineField({
      name: 'internal',
      title: 'Internal / test traffic',
      type: 'boolean',
      group: 'review',
      readOnly: true,
      description: 'Sent from a browser flagged with ?domlivo_internal=1. Saved with status Spam / test.',
    }),
    siteString('placement', 'Placement', 'review', 'Where on the page the form or link was.'),
    siteString('formLabel', 'Form label', 'review', 'Extra label the form sent (e.g. which blog post, realtor/agency).'),

    // --- Contact: form leads only; clicks carry no personal data ---------------
    siteString('name', 'Name', 'contact'),
    siteString('phone', 'Phone', 'contact'),
    siteString('email', 'Email', 'contact'),
    defineField({name: 'message', title: 'Message', type: 'text', rows: 5, group: 'contact', readOnly: true}),
    defineField({
      name: 'interest',
      title: 'Looking for',
      type: 'object',
      group: 'contact',
      readOnly: true,
      description: 'What the general contact form asked for.',
      options: {collapsible: true, collapsed: false},
      fields: [
        defineField({name: 'location', title: 'Location', type: 'string'}),
        defineField({name: 'propertyType', title: 'Property type', type: 'string'}),
        defineField({name: 'dealType', title: 'Deal type', type: 'string'}),
        defineField({name: 'budget', title: 'Budget', type: 'string'}),
        defineField({name: 'area', title: 'Area', type: 'string'}),
      ],
    }),

    // --- Property -------------------------------------------------------------
    defineField({
      name: 'property',
      title: 'Property',
      type: 'reference',
      to: [{type: 'property'}],
      weak: true,
      group: 'subject',
      readOnly: true,
    }),
    siteString('propertySlug', 'Property slug', 'subject'),
    siteString('propertyTitle', 'Property title', 'subject'),
    defineField({
      name: 'agent',
      title: 'Agent',
      type: 'reference',
      to: [{type: 'agent'}],
      weak: true,
      group: 'subject',
      readOnly: true,
    }),
    siteString('agentSlug', 'Agent slug', 'subject'),

    // --- Attribution (this visit) ----------------------------------------------
    siteString('source', 'Source', 'attribution'),
    siteString('medium', 'Medium', 'attribution'),
    defineField({
      name: 'channel',
      title: 'Channel',
      type: 'string',
      group: 'attribution',
      readOnly: true,
      options: {list: [...LEAD_CHANNELS]},
    }),
    siteString('campaign', 'Campaign', 'attribution'),
    defineField({
      name: 'utm',
      title: 'UTM parameters',
      type: 'object',
      group: 'attribution',
      readOnly: true,
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({name: 'source', title: 'utm_source', type: 'string'}),
        defineField({name: 'medium', title: 'utm_medium', type: 'string'}),
        defineField({name: 'campaign', title: 'utm_campaign', type: 'string'}),
        defineField({name: 'content', title: 'utm_content', type: 'string'}),
        defineField({name: 'term', title: 'utm_term', type: 'string'}),
      ],
    }),
    defineField({
      name: 'hasGclid',
      title: 'Google Ads click (gclid present)',
      type: 'boolean',
      group: 'attribution',
      readOnly: true,
    }),
    siteString('referrerHost', 'Referrer host', 'attribution'),
    siteString('landingPage', 'Landing page', 'attribution'),
    defineField({
      name: 'firstTouch',
      title: 'First visit',
      type: 'object',
      group: 'attribution',
      readOnly: true,
      description: 'How this browser first arrived (kept 30 days).',
      options: {collapsible: true, collapsed: false},
      fields: touchFields,
    }),
    siteString('country', 'Country', 'attribution', 'ISO code from the edge geo header. No IP is stored.'),
    defineField({
      name: 'device',
      title: 'Device',
      type: 'string',
      group: 'attribution',
      readOnly: true,
      options: {
        list: [
          {title: 'Mobile', value: 'mobile'},
          {title: 'Tablet', value: 'tablet'},
          {title: 'Desktop', value: 'desktop'},
        ],
      },
    }),
    siteString('locale', 'Site language', 'attribution'),
    siteString('browserLanguage', 'Browser language', 'attribution'),

    // --- Journey ----------------------------------------------------------------
    siteString('currentPage', 'Page of the lead', 'journey'),
    defineField({
      name: 'pagesViewedCount',
      title: 'Pages viewed',
      type: 'number',
      group: 'journey',
      readOnly: true,
    }),
    defineField({
      name: 'timeOnSiteSec',
      title: 'Time on site (seconds)',
      type: 'number',
      group: 'journey',
      readOnly: true,
    }),
    defineField({
      name: 'pagesViewed',
      title: 'Pages viewed (last 20, oldest first)',
      type: 'array',
      group: 'journey',
      readOnly: true,
      of: [
        defineArrayMember({
          type: 'object',
          name: 'pageVisit',
          fields: [
            defineField({name: 'path', title: 'Path', type: 'string'}),
            defineField({name: 'title', title: 'Title', type: 'string'}),
          ],
          preview: {select: {title: 'path', subtitle: 'title'}},
        }),
      ],
    }),
    defineField({
      name: 'propertySlugsViewed',
      title: 'Properties viewed',
      type: 'array',
      group: 'journey',
      readOnly: true,
      of: [defineArrayMember({type: 'string'})],
    }),
  ],

  orderings: [
    {title: 'Newest first', name: 'createdAtDesc', by: [{field: 'createdAt', direction: 'desc'}]},
  ],

  preview: {
    select: {
      type: 'type',
      status: 'status',
      name: 'name',
      phone: 'phone',
      propertyTitle: 'propertyTitle',
      propertySlug: 'propertySlug',
      source: 'source',
      medium: 'medium',
      createdAt: 'createdAt',
      internal: 'internal',
    },
    prepare({type, status, name, phone, propertyTitle, propertySlug, source, medium, createdAt, internal}) {
      const who = name || phone || label(LEAD_TYPES, type)
      const what = propertyTitle || propertySlug
      const when = createdAt ? new Date(createdAt).toLocaleString('ru-RU', {timeZone: 'Europe/Tirane'}) : ''
      return {
        title: `${internal ? '[TEST] ' : ''}${TYPE_ICON[type] ?? '•'} ${who}${what ? ` · ${what}` : ''}`,
        subtitle: [label(LEAD_STATUSES, status), source ? `${source} / ${medium ?? '—'}` : null, when]
          .filter(Boolean)
          .join(' · '),
      }
    },
  },
})
