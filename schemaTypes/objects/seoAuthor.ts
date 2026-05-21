import {defineType, defineField} from 'sanity'

/**
 * Author byline shown in the SEO editorial layout.
 */
export const seoAuthor = defineType({
  name: 'seoAuthor',
  title: 'SEO author',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'Author name',
      type: 'localizedString',
    }),
    defineField({
      name: 'role',
      title: 'Role / Title',
      type: 'localizedString',
      description: 'e.g. "Head of analytics, Domlivo".',
    }),
    defineField({
      name: 'initials',
      title: 'Initials (fallback)',
      type: 'string',
      description: 'Short initials shown in the avatar circle when no avatar image is set.',
    }),
    defineField({
      name: 'avatar',
      title: 'Avatar',
      type: 'image',
      options: {hotspot: true},
      description: 'Optional avatar image. If empty, initials are used.',
    }),
  ],
  preview: {
    select: {name: 'name.en', role: 'role.en', media: 'avatar'},
    prepare({name, role, media}: {name?: string; role?: string; media?: unknown}) {
      return {title: name || 'Author', subtitle: role || '', media}
    },
  },
})
