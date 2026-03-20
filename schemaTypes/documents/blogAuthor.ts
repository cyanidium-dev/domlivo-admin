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
      title: 'Author name',
      type: 'string',
      group: 'basic',
      validation: (Rule: any) => Rule.required(),
      description: 'Public name shown in article bylines.',
    }),
    defineField({
      name: 'slug',
      title: 'Author URL slug',
      type: 'slug',
      group: 'basic',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule: any) => Rule.required(),
      description: 'Used in the author page URL.',
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      group: 'basic',
      initialValue: true,
      description: 'When disabled, this author is hidden from the author picker and blog listings.',
    }),

    defineField({
      name: 'role',
      title: 'Role / title',
      type: 'localizedString',
      group: 'profile',
      description: 'Optional localized role shown under the author name (e.g. “Real Estate Advisor”).',
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'localizedText',
      group: 'profile',
      description: 'Optional localized short biography.',
    }),
    defineField({
      name: 'photo',
      title: 'Author avatar',
      type: 'image',
      group: 'profile',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alternative text'}],
      description: 'Optional author avatar/profile photo.',
    }),
    defineField({
      name: 'email',
      title: 'Email (optional, internal)',
      type: 'string',
      group: 'profile',
      validation: (Rule: any) => Rule.email(),
      description: 'Optional internal contact email.',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social links',
      type: 'array',
      group: 'profile',
      of: [defineArrayMember({type: 'socialLink'})],
      validation: (Rule: any) => Rule.max(10),
      description: 'Optional social profile links.',
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
    prepare({title, roleEn, roleSq, active, media}: any) {
      const parts: string[] = []
      if (active === false) parts.push('Inactive')
      if (roleEn || roleSq) parts.push(roleEn || roleSq)
      return {
        title: title || 'Unnamed author',
        subtitle: parts.length > 0 ? parts.join(' · ') : 'Author',
        media,
      }
    },
  },
})
