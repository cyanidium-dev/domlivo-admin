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
      validation: (Rule) => Rule.required(),
    }),
  ],

  preview: socialLinkPreview,
})
