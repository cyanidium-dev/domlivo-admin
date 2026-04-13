import {defineType, defineField} from 'sanity'
import {AgentPromotionUsageInfo} from '../../components/sanity/AgentPromotionUsageInfo'

function agentSlugOwnerIds(document?: {_id?: string}): string[] {
  const id = document?._id
  if (!id) return []
  return id.startsWith('drafts.') ? [id, id.replace(/^drafts\./, '')] : [id, `drafts.${id}`]
}

function makeStableToken(prefix: string): string {
  const uid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '')
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
  return `${prefix}_${uid}`
}

function canViewServiceData({currentUser}: {currentUser?: {roles?: {name?: string}[]}}): boolean {
  const roleNames = (currentUser?.roles ?? []).map((role) => role.name)
  return roleNames.includes('administrator')
}

export const agent = defineType({
  name: 'agent',
  title: 'Agent',
  type: 'document',

  fieldsets: [
    {
      name: 'promotionOverrides',
      title: 'Promotion Limit Overrides',
      description:
        'Optional per-agent override values. If left empty, Site Settings global defaults are used.',
      options: {collapsible: true, collapsed: false},
    },
  ],

  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'Display name used on listings and the contact page.',
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      description: 'Used for agent page URL. Must be unique.',
      validation: (Rule) =>
        Rule.required()
          .error('Slug is required for agent routing.')
          .custom(async (value, context) => {
            const current = (value as {current?: string} | undefined)?.current
            if (!current || !String(current).trim()) return true

            const client = context.getClient?.({apiVersion: '2024-01-01'})
            if (!client) return true

            const ids = agentSlugOwnerIds(context.document as {_id?: string})
            if (ids.length === 0) return true

            const dup = await client.fetch(
              `count(*[_type == "agent" && slug.current == $slug && !(_id in $ids)])`,
              {slug: current, ids},
            )
            if (dup === 0) return true
            return 'Another agent already uses this slug.'
          }),
    }),

    defineField({
      name: 'email',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),

    defineField({
      name: 'phone',
      type: 'string',
    }),

    defineField({
      name: 'company',
      title: 'Company',
      type: 'string',
      description: 'Optional company or agency name.',
    }),

    defineField({
      name: 'companyLogo',
      title: 'Company logo',
      type: 'image',
      description: 'Optional company logo.',
      options: {
        hotspot: true,
      },
      fields: [{name: 'alt', type: 'string', title: 'Alternative text'}],
    }),

    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'localizedText',
      description: 'Optional public-facing description for the contact page (per language).',
    }),

    defineField({
      name: 'photo',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [{name: 'alt', type: 'string', title: 'Alternative text'}],
    }),

    defineField({
      name: 'agentLogo',
      title: 'Logo',
      type: 'image',
      description: 'Optional personal or brand logo (e.g. for the contact page header).',
      options: {
        hotspot: true,
      },
      fields: [{name: 'alt', type: 'string', title: 'Alternative text'}],
    }),

    defineField({
      name: 'telegramUrl',
      title: 'Telegram',
      type: 'string',
      description: 'Full profile link, e.g. https://t.me/username',
      validation: (Rule) =>
        Rule.custom((value: string | undefined) => {
          if (value == null || !String(value).trim()) return true
          const v = String(value).trim()
          if (!/^https?:\/\//i.test(v)) return 'Use a full URL starting with http:// or https://.'
          if (!/t\.me\/|telegram\.me\//i.test(v)) return 'Use a t.me or telegram.me link.'
          return true
        }),
    }),

    defineField({
      name: 'facebookUrl',
      title: 'Facebook',
      type: 'string',
      description: 'Full profile or page URL',
      validation: (Rule) =>
        Rule.custom((value: string | undefined) => {
          if (value == null || !String(value).trim()) return true
          const v = String(value).trim()
          if (!/^https?:\/\//i.test(v)) return 'Use a full URL starting with http:// or https://.'
          if (!/facebook\.com|fb\.com|fb\.me\//i.test(v)) return 'Use a facebook.com, fb.com, or fb.me link.'
          return true
        }),
    }),

    defineField({
      name: 'instagramUrl',
      title: 'Instagram',
      type: 'string',
      description: 'Full profile URL',
      validation: (Rule) =>
        Rule.custom((value: string | undefined) => {
          if (value == null || !String(value).trim()) return true
          const v = String(value).trim()
          if (!/^https?:\/\//i.test(v)) return 'Use a full URL starting with http:// or https://.'
          if (!/instagram\.com/i.test(v)) return 'Use an instagram.com link.'
          return true
        }),
    }),

    defineField({
      name: 'youtubeUrl',
      title: 'YouTube',
      type: 'string',
      description: 'Channel or profile URL',
      validation: (Rule) =>
        Rule.custom((value: string | undefined) => {
          if (value == null || !String(value).trim()) return true
          const v = String(value).trim()
          if (!/^https?:\/\//i.test(v)) return 'Use a full URL starting with http:// or https://.'
          if (!/youtube\.com|youtu\.be\//i.test(v)) return 'Use a youtube.com or youtu.be link.'
          return true
        }),
    }),

    defineField({
      name: 'whatsapp',
      title: 'WhatsApp',
      type: 'string',
      description: 'Optional WhatsApp number or deep link.',
    }),
    defineField({
      name: 'showWhatsapp',
      title: 'Show WhatsApp publicly',
      type: 'boolean',
      initialValue: false,
      readOnly: ({document}) => !document?.whatsapp,
      hidden: ({document}) => !document?.whatsapp,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const hasValue = Boolean((context.document as {whatsapp?: string} | undefined)?.whatsapp)
          if (value && !hasValue) return 'Add WhatsApp value before enabling visibility.'
          return true
        }),
    }),
    defineField({
      name: 'telegram',
      title: 'Telegram (contact channel)',
      type: 'string',
      description: 'Optional Telegram username or deep link.',
    }),
    defineField({
      name: 'showTelegram',
      title: 'Show Telegram publicly',
      type: 'boolean',
      initialValue: false,
      readOnly: ({document}) => !document?.telegram,
      hidden: ({document}) => !document?.telegram,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const hasValue = Boolean((context.document as {telegram?: string} | undefined)?.telegram)
          if (value && !hasValue) return 'Add Telegram value before enabling visibility.'
          return true
        }),
    }),
    defineField({
      name: 'messenger',
      title: 'Messenger',
      type: 'string',
      description: 'Optional Messenger link or handle.',
    }),
    defineField({
      name: 'showMessenger',
      title: 'Show Messenger publicly',
      type: 'boolean',
      initialValue: false,
      readOnly: ({document}) => !document?.messenger,
      hidden: ({document}) => !document?.messenger,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const hasValue = Boolean((context.document as {messenger?: string} | undefined)?.messenger)
          if (value && !hasValue) return 'Add Messenger value before enabling visibility.'
          return true
        }),
    }),
    defineField({
      name: 'viber',
      title: 'Viber',
      type: 'string',
      description: 'Optional Viber number or deep link.',
    }),
    defineField({
      name: 'showViber',
      title: 'Show Viber publicly',
      type: 'boolean',
      initialValue: false,
      readOnly: ({document}) => !document?.viber,
      hidden: ({document}) => !document?.viber,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const hasValue = Boolean((context.document as {viber?: string} | undefined)?.viber)
          if (value && !hasValue) return 'Add Viber value before enabling visibility.'
          return true
        }),
    }),

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'localizedSeo',
      description: 'Optional meta and Open Graph for this agent profile.',
    }),

    defineField({
      name: 'userId',
      title: 'Sanity User ID',
      type: 'string',
      description: 'Used to link the Sanity user account to this agent profile',
    }),

    defineField({
      name: 'agentId',
      title: 'Agent ID',
      type: 'string',
      hidden: (context) => !canViewServiceData(context),
      readOnly: true,
      initialValue: () => makeStableToken('agent'),
      description: 'Internal service id. Hidden for non-admin workflow.',
    }),
    defineField({
      name: 'agentKey',
      title: 'Agent Key',
      type: 'string',
      hidden: (context) => !canViewServiceData(context),
      readOnly: true,
      initialValue: () => makeStableToken('akey'),
      description: 'Internal service key. Hidden for non-admin workflow.',
    }),
    defineField({
      name: 'telegramChatId',
      title: 'Telegram Chat ID',
      type: 'string',
      hidden: (context) => !canViewServiceData(context),
      description: 'Service field for Telegram delivery integration.',
    }),
    defineField({
      name: 'telegramChatLinked',
      title: 'Telegram Chat Linked',
      type: 'boolean',
      hidden: (context) => !canViewServiceData(context),
      initialValue: false,
      description: 'Service status for Telegram integration.',
    }),
    defineField({
      name: 'sendLeadsToTelegram',
      title: 'Send Leads to Telegram',
      type: 'boolean',
      hidden: (context) => !canViewServiceData(context),
      initialValue: false,
      description: 'Operational toggle for lead delivery automation.',
    }),

    defineField({
      name: 'maxPremiumPromotionsOverride',
      title: 'Override: Max Premium promotions',
      type: 'number',
      fieldset: 'promotionOverrides',
      description:
        'Optional. Overrides Site Settings default Premium cap for this agent only.',
      components: {input: AgentPromotionUsageInfo as any},
      validation: (Rule) =>
        Rule.integer()
          .min(1)
          .max(50)
          .error('Enter a whole number from 1 to 50, or leave empty to use global defaults.'),
    }),

    defineField({
      name: 'maxTopPromotionsOverride',
      title: 'Override: Max Top promotions',
      type: 'number',
      fieldset: 'promotionOverrides',
      description: 'Optional. Overrides Site Settings default Top cap for this agent only.',
      validation: (Rule) =>
        Rule.integer()
          .min(1)
          .max(50)
          .error('Enter a whole number from 1 to 50, or leave empty to use global defaults.'),
    }),
  ],

  preview: {
    select: {
      title: 'name',
      email: 'email',
      slug: 'slug.current',
      media: 'photo',
    },
    prepare({title, email, slug, media}: {title?: string; email?: string; slug?: string; media?: unknown}) {
      const parts = [slug, email].filter(Boolean)
      return {
        title: title || 'Unnamed agent',
        subtitle: parts.length > 0 ? parts.join(' · ') : 'Agent',
        media,
      }
    },
  },
})
