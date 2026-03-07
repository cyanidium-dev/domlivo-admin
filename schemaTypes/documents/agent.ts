import {defineType, defineField} from 'sanity'

export const agent = defineType({
  name: 'agent',
  title: 'Agent',
  type: 'document',

  fields: [
    defineField({
      name: 'name',
      type: 'string',
      validation: (Rule) => Rule.required(),
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
      name: 'photo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),

    defineField({
      name: 'userId',
      title: 'Sanity User ID',
      type: 'string',
      description: 'Used to link the Sanity user account to this agent profile',
    }),
  ],

  preview: {
    select: {
      title: 'name',
      subtitle: 'email',
      media: 'photo',
    },
  },
})
