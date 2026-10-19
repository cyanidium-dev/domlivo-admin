import {defineType, defineField, defineArrayMember} from 'sanity'
import {
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_CONFIDENCE,
  KNOWLEDGE_TOPIC_GROUPS,
  DOCUMENT_ID_PATTERN,
} from '../constants/knowledge'

/**
 * A page of the public knowledge base: one topic, answered with tables that
 * carry their sources. Not a blog post — no lead image, no marketing copy.
 * What it does have is a `questionSet` (the visitor questions it is written
 * to answer, which also feed the assistant's routing), explicit `gaps`, and a
 * `nextReviewAt` date so a tariff page cannot quietly go stale.
 *
 * Two kinds live here. The research data sheets are imported from the
 * research repo (`npm run knowledge:import`). The question pages (2026-10,
 * `topicGroup` set) are seeded from scripts/data/knowledge-base-2026-10-19:
 * they name the founder who compiled the data as `author`, carry an FAQ and a
 * source list, and leave `reviewedBy` empty until the reviewer has actually
 * checked the page — the site prints "checked by" only when it is set.
 */
export const knowledgeArticle = defineType({
  name: 'knowledgeArticle',
  title: 'Knowledge · Article',
  type: 'document',
  groups: [
    {name: 'identity', title: 'Identity', default: true},
    {name: 'content', title: 'Content'},
    {name: 'quality', title: 'Quality & review'},
    {name: 'related', title: 'Related'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'documentId',
      title: 'Document ID',
      type: 'string',
      group: 'identity',
      description: 'Citation key, e.g. UTIL-ELEC-ALB-2026. Matches the research document.',
      validation: (Rule) =>
        Rule.required().custom((value) =>
          typeof value === 'string' && DOCUMENT_ID_PATTERN.test(value)
            ? true
            : 'Capitals, digits and hyphens, e.g. CITY-DURRES-2026',
        ),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'identity',
      options: {source: 'title.en', maxLength: 96},
      description: 'URL under /knowledge/. Readable, not the document ID: electricity-tariffs-albania-2026.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      group: 'identity',
      validation: (Rule) =>
        Rule.required().custom((value) =>
          (value as {en?: string} | undefined)?.en ? true : 'English title is required.',
        ),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'localizedText',
      group: 'identity',
      description:
        'The answer in a few sentences, with the key figures. This is what the assistant reads first and what AI search engines quote.',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      group: 'identity',
      options: {list: KNOWLEDGE_CATEGORIES},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
      group: 'identity',
    }),
    defineField({
      name: 'topicGroup',
      title: 'Topic group',
      type: 'string',
      group: 'identity',
      description: 'Where the page sits on /knowledge. Empty for the research data sheets, which group by category.',
      options: {list: [...KNOWLEDGE_TOPIC_GROUPS]},
    }),
    defineField({
      name: 'author',
      title: 'Data compiled by',
      type: 'reference',
      to: [{type: 'blogAuthor'}],
      group: 'quality',
      description: 'The person who gathered the figures and sources. Shown as the byline and as Article author.',
    }),
    defineField({
      name: 'reviewedBy',
      title: 'Checked by',
      type: 'reference',
      to: [{type: 'blogAuthor'}],
      group: 'quality',
      description: 'Set only after the reviewer has read the page and its sources. Empty means not yet reviewed.',
    }),
    defineField({
      name: 'reviewedAt',
      title: 'Checked on',
      type: 'date',
      group: 'quality',
    }),
    defineField({
      name: 'city',
      title: 'City',
      type: 'reference',
      to: [{type: 'city'}],
      group: 'identity',
      description: 'Empty for national topics (tariffs, taxes, macro).',
    }),
    defineField({
      name: 'district',
      title: 'District',
      type: 'reference',
      to: [{type: 'district'}],
      group: 'identity',
    }),
    defineField({
      name: 'questionSet',
      title: 'Questions this answers',
      type: 'array',
      of: [defineArrayMember({type: 'localizedString'})],
      group: 'content',
      description:
        'Real visitor questions, in their words. Rendered as an FAQ block, used for FAQPage schema and by the assistant to pick the right page.',
      validation: (Rule) => Rule.max(20),
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [defineArrayMember({type: 'knowledgeSection'})],
      group: 'content',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'faq',
      title: 'FAQ',
      type: 'array',
      of: [defineArrayMember({type: 'localizedFaqItem'})],
      group: 'content',
      description: 'Question and answer pairs shown at the end of the page; three or more also become FAQPage markup.',
      validation: (Rule) => Rule.max(8),
    }),
    defineField({
      name: 'sources',
      title: 'Sources',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'knowledgeSource'}]}],
      group: 'content',
      description: 'Every publication the page relies on, including laws cited in the text. Rendered as the Sources list.',
    }),
    defineField({
      name: 'facts',
      title: 'Facts on this page',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'knowledgeFact'}]}],
      group: 'content',
      description: 'Filled by the importer. Used to resolve a citation back to its page.',
    }),
    defineField({
      name: 'dataPeriod',
      title: 'Data period',
      type: 'string',
      group: 'quality',
      description: 'What period the page describes: 2026, 2025–2026.',
    }),
    defineField({
      name: 'confidence',
      title: 'Overall confidence',
      type: 'string',
      group: 'quality',
      options: {list: [...KNOWLEDGE_CONFIDENCE]},
    }),
    defineField({
      name: 'exchangeRateNote',
      title: 'Exchange rate note',
      type: 'string',
      group: 'quality',
      description: 'e.g. “92.02 ALL/EUR, Bank of Albania, 2026-09-09”. Shown under the tables.',
    }),
    defineField({
      name: 'lastUpdated',
      title: 'Last updated',
      type: 'date',
      group: 'quality',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'nextReviewAt',
      title: 'Next review',
      type: 'date',
      group: 'quality',
      description:
        'Tariffs and taxes: 6 months. Prices and rents: 12 months. The weekly freshness report lists whatever is overdue.',
    }),
    defineField({
      name: 'gaps',
      title: 'Known gaps',
      type: 'array',
      group: 'quality',
      description:
        'What is missing and why. Published on the page — saying “we do not have this” is what makes the rest credible.',
      of: [
        defineArrayMember({
          name: 'knowledgeGap',
          type: 'object',
          fields: [
            defineField({name: 'gapId', title: 'Gap ID', type: 'string'}),
            defineField({name: 'description', title: 'What is missing', type: 'localizedString'}),
            defineField({
              name: 'priority',
              title: 'Priority',
              type: 'string',
              options: {list: ['HIGH', 'MEDIUM', 'LOW']},
            }),
          ],
          preview: {
            select: {gapId: 'gapId', description: 'description.en', priority: 'priority'},
            prepare({gapId, description, priority}) {
              return {title: `${gapId || '—'} ${description || ''}`.trim(), subtitle: priority}
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'sourceFile',
      title: 'Research file',
      type: 'string',
      group: 'quality',
      readOnly: true,
      description: 'Origin in the research repo, e.g. 12-ai-database/10-utilities-electricity.md.',
    }),
    defineField({
      name: 'relatedArticles',
      title: 'Related articles',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'knowledgeArticle'}]}],
      group: 'related',
      validation: (Rule) => Rule.max(8),
    }),
    defineField({
      name: 'relatedPosts',
      title: 'Related blog posts',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'blogPost'}]}],
      group: 'related',
      validation: (Rule) => Rule.max(6),
    }),
    defineField({
      name: 'relatedProperties',
      title: 'Related properties',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'property'}]}],
      group: 'related',
      validation: (Rule) => Rule.max(3),
    }),
    defineField({
      name: 'isPublished',
      title: 'Published',
      type: 'boolean',
      group: 'identity',
      initialValue: false,
      description: 'Off until the English text has been reviewed. Unpublished pages are invisible to the assistant too.',
    }),
    defineField({name: 'seo', title: 'SEO', type: 'localizedSeo', group: 'seo'}),
  ],
  preview: {
    select: {
      documentId: 'documentId',
      title: 'title.en',
      category: 'category',
      published: 'isPublished',
      review: 'nextReviewAt',
    },
    prepare({documentId, title, category, published, review}) {
      return {
        title: `${published ? '' : '⏸ '}${documentId} · ${title || ''}`.trim(),
        subtitle: [category, review ? `review ${review}` : null].filter(Boolean).join(' · '),
      }
    },
  },
  orderings: [
    {title: 'Document ID', name: 'documentIdAsc', by: [{field: 'documentId', direction: 'asc'}]},
    {title: 'Review due first', name: 'reviewAsc', by: [{field: 'nextReviewAt', direction: 'asc'}]},
  ],
})
