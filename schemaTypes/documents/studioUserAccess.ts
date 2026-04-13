import {defineField, defineType} from 'sanity'

const ROLE_OPTIONS = [
  {title: 'Admin', value: 'admin'},
  {title: 'Editor', value: 'editor'},
  {title: 'Agent', value: 'agent'},
] as const

const ALLOWED_ROLES = new Set(ROLE_OPTIONS.map((item) => item.value))

export const studioUserAccess = defineType({
  name: 'studioUserAccess',
  title: 'Studio User Access',
  type: 'document',
  description:
    'Pseudo-role mapping for Studio workflow containment on Sanity free plan (not hard security).',
  fields: [
    defineField({
      name: 'userId',
      title: 'Sanity User ID',
      type: 'string',
      validation: (Rule) =>
        Rule.required().custom((value) => {
          const raw = typeof value === 'string' ? value.trim() : ''
          return raw ? true : 'User ID is required.'
        }),
      description: 'Sanity user id from currentUser.id. Use one document per Studio user.',
    }),
    defineField({
      name: 'userEmail',
      title: 'User Email',
      type: 'string',
      description: 'Optional display fallback to make mapping easier to identify.',
      validation: (Rule) =>
        Rule.custom((value) => {
          const raw = value != null ? String(value).trim() : ''
          if (!raw) return true
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? true : 'Must be a valid email address.'
        }),
    }),
    defineField({
      name: 'role',
      title: 'Pseudo Role',
      type: 'string',
      options: {
        list: [...ROLE_OPTIONS],
        layout: 'radio',
      },
      initialValue: 'editor',
      validation: (Rule) =>
        Rule.required().custom((value) => {
          const raw = typeof value === 'string' ? value.trim() : ''
          if (!raw) return 'Role is required.'
          return ALLOWED_ROLES.has(raw as 'admin' | 'editor' | 'agent') ? true : 'Invalid role.'
        }),
    }),
    defineField({
      name: 'linkedAgent',
      title: 'Linked Agent',
      type: 'reference',
      to: [{type: 'agent'}],
      description: 'Required when role is Agent. Used to resolve My Profile/My Properties/My Leads.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const role = (context.document as {role?: string} | undefined)?.role
          if (role !== 'agent') return true
          return value ? true : 'Agent role requires a linked agent.'
        }),
      hidden: ({document}) => document?.role !== 'agent',
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
      description: 'Optional soft switch to temporarily disable this mapping.',
    }),
  ],
  preview: {
    select: {
      userId: 'userId',
      userEmail: 'userEmail',
      role: 'role',
      agentName: 'linkedAgent.name',
      active: 'active',
    },
    prepare({userId, userEmail, role, agentName, active}) {
      const title = userEmail || userId || 'Unmapped user'
      const parts = [role, agentName, active === false ? 'inactive' : null].filter(Boolean)
      return {
        title,
        subtitle: parts.length ? parts.join(' · ') : 'Studio user mapping',
      }
    },
  },
})
