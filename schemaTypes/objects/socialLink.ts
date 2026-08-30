import {LinkIcon} from '@sanity/icons'
import {defineType, defineField} from 'sanity'

/** Used on the object type and on `defineArrayMember` so list rows always show platform + URL. */
export const socialLinkPreview = {
  select: {
    platform: 'platform',
    url: 'url',
  },
  prepare({platform, url}: {platform?: string; url?: string}) {
    const title = platform?.trim() || 'Social link'
    const subtitle = url?.trim() || 'Add URL'
    return {title, subtitle, media: LinkIcon}
  },
}

export const socialLink = defineType({
  name: 'socialLink',
  title: 'Social Link',
  type: 'object',

  fields: [
    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'url',
      title: 'URL',
      type: 'string',
      description: 'Full profile/page URL — bare domains (e.g. https://youtube.com) are rejected.',
      validation: (Rule) =>
        Rule.required().custom((value: string | undefined) => {
          const v = String(value ?? '').trim()
          if (!v) return 'URL is required.'
          if (!/^https?:\/\//i.test(v)) return 'Use a full URL starting with http:// or https://.'
          let parsed: URL
          try {
            parsed = new URL(v)
          } catch {
            return 'Enter a valid URL.'
          }
          // Reject bare domains for social platforms (must link to a profile/channel).
          const bareSocials = /(youtube|facebook|instagram|linkedin|twitter|x|tiktok|t)\.(com|me)$/i
          const path = parsed.pathname.replace(/\/+$/, '')
          if (bareSocials.test(parsed.hostname.replace(/^www\./, '')) && path === '') {
            return 'Link to a specific profile/channel, not the bare domain.'
          }
          return true
        }),
    }),
  ],

  preview: socialLinkPreview,
})
