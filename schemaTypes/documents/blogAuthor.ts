import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * Reusable blog author profile.
 * Referenced by blog posts for byline consistency.
 */
export const blogAuthor = defineType({
  name: 'blogAuthor',
  title: 'Blog Author',
  type: 'document',

  groups: [
    {name: 'basic', title: 'Basic', default: true},
    {name: 'profile', title: 'Profile'},
    {name: 'seo', title: 'SEO'},
  ],

  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required(),
      description: 'Public author name shown in bylines.',
    }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      group: 'basic',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
      description: 'Stable author slug for author pages.',
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      group: 'basic',
      initialValue: true,
      description: 'When disabled, this author should be hidden from listings.',
    }),

    defineField({
      name: 'role',
      title: 'Role / Title',
      type: 'localizedString',
      group: 'profile',
      description: 'Localized role shown under author name.',
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'localizedText',
      group: 'profile',
      description: 'Localized short biography.',
    }),
    defineField({
      name: 'photo',
      title: 'Profile image',
      type: 'image',
      group: 'profile',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alternative text'}],
      description: 'Optional author avatar/profile photo.',
    }),
    defineField({
      name: 'email',
      title: 'Email (internal)',
      type: 'string',
      group: 'profile',
      validation: (Rule) => Rule.email(),
      description: 'Optional internal contact email.',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      group: 'profile',
      of: [defineArrayMember({type: 'socialLink'})],
      validation: (Rule) => Rule.max(10),
      description: 'Optional social profiles.',
    }),

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'localizedSeo',
      group: 'seo',
      description: 'Optional SEO metadata for author profile pages.',
    }),
  ],

  preview: {
    select: {
      title: 'name',
      roleEn: 'role.en',
      roleSq: 'role.sq',
      active: 'active',
      media: 'photo',
      slug: 'slug.current',
    },
    prepare({title, roleEn, roleSq, active, media, slug}) {
      const parts = [slug || 'no-slug']
      if (roleEn || roleSq) parts.push(roleEn || roleSq)
      if (active === false) parts.push('inactive')
      return {
        title: title || 'Unnamed author',
        subtitle: parts.join(' · '),
        media,
      }
    },
  },
})
