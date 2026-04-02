import {defineType, defineField} from 'sanity'
import {AgentPromotionUsageInfo} from '../../components/sanity/AgentPromotionUsageInfo'

function agentSlugOwnerIds(document?: {_id?: string}): string[] {
  const id = document?._id
  if (!id) return []
  return id.startsWith('drafts.') ? [id, id.replace(/^drafts\./, '')] : [id, `drafts.${id}`]
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
      title: 'Contact page URL slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      description:
        'Used for the public URL /contact-realtor/[slug] when set. Leave empty if this agent has no dedicated contact page yet.',
      validation: (Rule) =>
        Rule.custom(async (value, context) => {
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
      name: 'userId',
      title: 'Sanity User ID',
      type: 'string',
      description: 'Used to link the Sanity user account to this agent profile',
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
