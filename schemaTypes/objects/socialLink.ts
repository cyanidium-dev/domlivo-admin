import {LinkIcon} from '@sanity/icons'
import {defineType, defineField} from 'sanity'

/** Used on the object type and on `defineArrayMember` so list rows always show platform + URL. */
export const socialLinkPreview = {
  select: {
    platform: 'platform',
    url: 'url',
    channel: 'channel',
  },
  prepare({platform, url, channel}: {platform?: string; url?: string; channel?: string}) {
    const title = platform?.trim() || 'Social link'
    const column = channel === 'contact' ? 'Contacts column' : 'Social column'
    const subtitle = `${column} · ${url?.trim() || 'Add URL'}`
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
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'channel',
      title: 'Footer column',
      type: 'string',
      options: {
        list: [
          {title: 'Social — “Follow us on …” list', value: 'social'},
          {title: 'Contacts — direct-contact channel (Telegram, WhatsApp)', value: 'contact'},
        ],
        layout: 'radio',
      },
      initialValue: 'social',
      description:
        'Which footer column this link belongs to. Direct-contact channels used to live in their own siteSettings fields; they are entries here now so every social/contact link has one source.',
      validation: (Rule) => Rule.required(),
    }),
  ],

  preview: socialLinkPreview,
})
