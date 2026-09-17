import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * One addressable section of a knowledge article — the unit a citation points
 * at when it is not a single table row. `sectionKey` becomes the anchor on the
 * page and the middle part of a citation id
 * (UTIL-ELEC-ALB-2026 § TARIFF_2026 › ELEC_TARIFF_2026 row 01).
 */
export const knowledgeSection = defineType({
  name: 'knowledgeSection',
  title: 'Knowledge section',
  type: 'object',
  fields: [
    defineField({
      name: 'sectionKey',
      title: 'Section key',
      type: 'string',
      description: 'Anchor and citation key: TARIFF_2026, PRICE_BANDS, GAPS.',
      validation: (Rule) =>
        Rule.required().custom((value) =>
          typeof value === 'string' && /^[A-Z][A-Z0-9_]*$/.test(value)
            ? true
            : 'Capitals, digits and underscores only, e.g. BILL_EXAMPLES',
        ),
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'localizedBlockContent',
      description: 'Prose around the tables: what the numbers mean, caveats, how to read them.',
    }),
    defineField({
      name: 'tables',
      title: 'Tables',
      type: 'array',
      of: [defineArrayMember({type: 'knowledgeTable'})],
    }),
  ],
  preview: {
    select: {sectionKey: 'sectionKey', heading: 'heading.en', tables: 'tables'},
    prepare({sectionKey, heading, tables}: {sectionKey?: string; heading?: string; tables?: unknown[]}) {
      const n = Array.isArray(tables) ? tables.length : 0
      return {
        title: `${sectionKey || 'SECTION'} · ${heading || ''}`.trim(),
        subtitle: n > 0 ? `${n} table(s)` : 'text only',
      }
    },
  },
})
