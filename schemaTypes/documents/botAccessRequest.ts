import {defineType, defineField} from 'sanity'

/**
 * Access request filed automatically by the Telegram intake bot when an
 * unknown account presses /start. A manager approves by ticking Approved and
 * picking the Agent the person submits listings as — the bot checks this
 * document on every message, so approval takes effect immediately.
 * The bot creates these with createIfNotExists (id: botAccessRequest-<telegram id>),
 * so re-pressing /start can never reset an approval.
 */
export const botAccessRequest = defineType({
  name: 'botAccessRequest',
  title: 'Bot Access Request',
  type: 'document',

  fields: [
    defineField({
      name: 'telegramUserId',
      title: 'Telegram User ID',
      type: 'number',
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'username',
      title: 'Telegram Username',
      type: 'string',
      readOnly: true,
      description: 'The @username at the time of the request (may be empty — not all accounts have one).',
    }),
    defineField({
      name: 'firstName',
      title: 'Telegram First Name',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'requestedAt',
      title: 'Requested At',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'approved',
      title: 'Approved',
      type: 'boolean',
      initialValue: false,
      description: 'Tick to let this Telegram account submit listings. Requires an Agent below.',
    }),
    defineField({
      name: 'agent',
      title: 'Submits As Agent',
      type: 'reference',
      to: [{type: 'agent'}],
      description: 'Drafts from this Telegram account are assigned to this agent.',
    }),
  ],

  preview: {
    select: {username: 'username', firstName: 'firstName', approved: 'approved', agentName: 'agent.name'},
    prepare({username, firstName, approved, agentName}) {
      const who = username ? `@${username}` : (firstName ?? 'unknown')
      return {
        title: who,
        subtitle: approved ? `✅ approved → ${agentName ?? 'NO AGENT SET'}` : '⏳ pending approval',
      }
    },
  },
})
