import {defineType, defineField} from 'sanity'
import {
  DATA_ID_PATTERN,
  KNOWLEDGE_BUILDING_CLASSES,
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_CONFIDENCE,
  KNOWLEDGE_DATA_KINDS,
  KNOWLEDGE_PROPERTY_TYPES,
  KNOWLEDGE_SEASONS,
} from '../constants/knowledge'

const CONFIDENCE_DOT: Record<string, string> = {
  HIGH: '🟢',
  MEDIUM: '🟡',
  LOW: '🟠',
  ESTIMATE: '🧮',
  FORECAST: '🔮',
}

/**
 * One atomic, citable number: a tariff, an asking price, an occupancy rate, a
 * tax rate. This is what the assistant quotes and what `/knowledge` pages
 * anchor to, so the identity rules are strict.
 *
 * Facts are versioned, never overwritten. When a tariff changes, import writes
 * a new document with a new `dataId`, sets `supersedes` to the old one, and
 * flips the old one's `isCurrent` to false with a `validUntil` date. An answer
 * given last winter therefore still resolves to the tariff that was in force
 * then, which is the whole point of citing by `dataId` rather than by page.
 *
 * `value` is always the normalised EUR figure; `originalValue` keeps what the
 * source actually printed (usually lek) together with the rate used, so a
 * conversion can always be audited.
 */
export const knowledgeFact = defineType({
  name: 'knowledgeFact',
  title: 'Knowledge · Fact',
  type: 'document',
  groups: [
    {name: 'identity', title: 'Identity', default: true},
    {name: 'value', title: 'Value'},
    {name: 'scope', title: 'Scope'},
    {name: 'provenance', title: 'Provenance'},
    {name: 'placement', title: 'Placement'},
  ],
  fields: [
    defineField({
      name: 'dataId',
      title: 'Data ID',
      type: 'string',
      group: 'identity',
      description: 'Citation key, e.g. DATA-ELEC-0001. Unique forever; a new version gets a new ID.',
      validation: (Rule) =>
        Rule.required().custom((value) =>
          typeof value === 'string' && DATA_ID_PATTERN.test(value)
            ? true
            : 'Use DATA-FAMILY-NNNN in capitals, e.g. DATA-RENT-DURRES-0017',
        ),
    }),
    defineField({
      name: 'factFamily',
      title: 'Fact family',
      type: 'string',
      group: 'identity',
      description:
        'Stable key shared by every version of the same fact, e.g. DATA-ELEC-TARIFF-HH. Lets the site show a history.',
    }),
    defineField({
      name: 'version',
      title: 'Version',
      type: 'number',
      group: 'identity',
      initialValue: 1,
      validation: (Rule) => Rule.min(1).integer(),
    }),
    defineField({
      name: 'supersedes',
      title: 'Supersedes',
      type: 'reference',
      to: [{type: 'knowledgeFact'}],
      group: 'identity',
      description: 'The version this one replaces.',
    }),
    defineField({
      name: 'isCurrent',
      title: 'Current',
      type: 'boolean',
      group: 'identity',
      initialValue: true,
      description: 'Off once superseded. The assistant only reads current facts unless asked about a past year.',
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
      name: 'metric',
      title: 'Metric',
      type: 'string',
      group: 'identity',
      description:
        'Machine name of what is measured: household_tariff_incl_vat, asking_price_per_m2, adr, occupancy…',
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: 'title',
      title: 'Human label',
      type: 'string',
      group: 'identity',
      description: 'One line an editor can recognise in a list.',
      validation: (Rule) => Rule.max(300),
    }),
    defineField({
      name: 'dataKind',
      title: 'Data kind',
      type: 'string',
      group: 'value',
      options: {list: [...KNOWLEDGE_DATA_KINDS]},
      description: 'Asking price and transaction price are different facts. So are advertised and achieved rent.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'value',
      title: 'Value (normalised)',
      type: 'number',
      group: 'value',
      description: 'EUR for money. Empty only when the fact is a rule rather than a number.',
    }),
    defineField({name: 'valueLow', title: 'Range low', type: 'number', group: 'value'}),
    defineField({name: 'valueHigh', title: 'Range high', type: 'number', group: 'value'}),
    defineField({
      name: 'unit',
      title: 'Unit',
      type: 'string',
      group: 'value',
      description: 'EUR/kWh, EUR/m2, EUR/month, EUR/night, %, kWh/month, L/day, m3/month…',
      validation: (Rule) => Rule.required().max(40),
    }),
    defineField({
      name: 'valueText',
      title: 'Value as text',
      type: 'text',
      rows: 3,
      group: 'value',
      description:
        'The value exactly as researched, including rules that are not a single number ("15% of gross rent, declared by 31 March").',
    }),
    defineField({
      name: 'originalValue',
      title: 'Original value',
      type: 'number',
      group: 'value',
      description: 'What the source printed, before conversion.',
    }),
    defineField({
      name: 'originalCurrency',
      title: 'Original currency',
      type: 'string',
      group: 'value',
      options: {list: ['ALL', 'EUR', 'USD', 'GBP']},
    }),
    defineField({
      name: 'exchangeRate',
      title: 'Exchange rate used',
      type: 'number',
      group: 'value',
      description: 'ALL per EUR, e.g. 92.02. Historical values use their own year’s average, not today’s rate.',
    }),
    defineField({name: 'exchangeRateDate', title: 'Rate date', type: 'date', group: 'value'}),
    defineField({
      name: 'city',
      title: 'City',
      type: 'reference',
      to: [{type: 'city'}],
      group: 'scope',
      description: 'Leave empty for national facts and set Geography to “Albania”.',
    }),
    defineField({
      name: 'district',
      title: 'District',
      type: 'reference',
      to: [{type: 'district'}],
      group: 'scope',
    }),
    defineField({
      name: 'geography',
      title: 'Geography (text)',
      type: 'string',
      group: 'scope',
      description: 'Free-text scope when it is not a catalog city: “Albania”, “Golem”, “Ksamil”, “Vlorë County”.',
    }),
    defineField({
      name: 'propertyType',
      title: 'Property type',
      type: 'string',
      group: 'scope',
      options: {list: KNOWLEDGE_PROPERTY_TYPES},
      initialValue: 'any',
    }),
    defineField({
      name: 'buildingClass',
      title: 'Building class',
      type: 'string',
      group: 'scope',
      options: {list: [...KNOWLEDGE_BUILDING_CLASSES]},
      initialValue: 'any',
    }),
    defineField({name: 'sizeM2Min', title: 'Size from (m²)', type: 'number', group: 'scope'}),
    defineField({name: 'sizeM2Max', title: 'Size to (m²)', type: 'number', group: 'scope'}),
    defineField({
      name: 'occupants',
      title: 'Occupants assumed',
      type: 'number',
      group: 'scope',
      description: 'For consumption facts: how many people the figure assumes.',
    }),
    defineField({
      name: 'season',
      title: 'Season',
      type: 'string',
      group: 'scope',
      options: {list: KNOWLEDGE_SEASONS},
      initialValue: 'annual',
    }),
    defineField({
      name: 'period',
      title: 'Period described',
      type: 'string',
      group: 'provenance',
      description: 'What the number is about: 2026, 2025, 2026-Q1, 2026-07.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'validFrom',
      title: 'Valid from',
      type: 'date',
      group: 'provenance',
      description: 'Tariffs and tax rates: the day it came into force.',
    }),
    defineField({name: 'validUntil', title: 'Valid until', type: 'date', group: 'provenance'}),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'reference',
      to: [{type: 'knowledgeSource'}],
      group: 'provenance',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'secondarySources',
      title: 'Corroborating sources',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'knowledgeSource'}]}],
      group: 'provenance',
    }),
    defineField({
      name: 'confidence',
      title: 'Confidence',
      type: 'string',
      group: 'provenance',
      options: {list: [...KNOWLEDGE_CONFIDENCE]},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sampleSize',
      title: 'Sample size',
      type: 'number',
      group: 'provenance',
      description: 'Listings counted, when the number came from a marketplace sample.',
    }),
    defineField({
      name: 'methodology',
      title: 'Methodology',
      type: 'text',
      rows: 3,
      group: 'provenance',
      description: 'Required for ESTIMATE and FORECAST: the formula and the inputs it used.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const confidence = (context.document as {confidence?: string} | undefined)?.confidence
          if (confidence !== 'ESTIMATE' && confidence !== 'FORECAST') return true
          return typeof value === 'string' && value.trim().length > 0
            ? true
            : 'An ESTIMATE or FORECAST must say how it was derived.'
        }),
    }),
    defineField({
      name: 'rawQuote',
      title: 'Raw quote',
      type: 'text',
      rows: 3,
      group: 'provenance',
      description: 'Verbatim sentence from the source, at most ~40 words. What makes the citation checkable.',
    }),
    defineField({name: 'accessedAt', title: 'Accessed', type: 'date', group: 'provenance'}),
    defineField({
      name: 'lastVerifiedAt',
      title: 'Last verified',
      type: 'date',
      group: 'provenance',
      description: 'Drives the staleness warning the assistant appends when quoting.',
    }),
    defineField({
      name: 'article',
      title: 'Published in',
      type: 'reference',
      to: [{type: 'knowledgeArticle'}],
      group: 'placement',
      description: 'The /knowledge page a citation link should open.',
    }),
    defineField({name: 'sectionKey', title: 'Section key', type: 'string', group: 'placement'}),
    defineField({name: 'tableId', title: 'Table ID', type: 'string', group: 'placement'}),
    defineField({name: 'rowId', title: 'Row ID', type: 'string', group: 'placement'}),
    defineField({
      name: 'searchText',
      title: 'Search text',
      type: 'text',
      rows: 2,
      group: 'placement',
      description:
        'Generated on import: metric, category, geography and the Albanian terms, so an Albanian-language question still matches.',
    }),
    defineField({
      name: 'rawFile',
      title: 'Raw research file',
      type: 'string',
      group: 'placement',
      readOnly: true,
      description: 'Where the full fact block with notes lives in the research repo.',
    }),
  ],
  preview: {
    select: {
      dataId: 'dataId',
      title: 'title',
      metric: 'metric',
      value: 'value',
      unit: 'unit',
      confidence: 'confidence',
      geography: 'geography',
      period: 'period',
      isCurrent: 'isCurrent',
    },
    prepare({dataId, title, metric, value, unit, confidence, geography, period, isCurrent}) {
      const dot = CONFIDENCE_DOT[confidence as string] || ''
      const figure = typeof value === 'number' ? `${value} ${unit || ''}`.trim() : unit || ''
      return {
        title: `${isCurrent === false ? '⏸ ' : ''}${dataId} · ${title || metric}`,
        subtitle: [dot, figure, geography, period].filter(Boolean).join(' · '),
      }
    },
  },
  orderings: [
    {title: 'Data ID', name: 'dataIdAsc', by: [{field: 'dataId', direction: 'asc'}]},
    {
      title: 'Least recently verified',
      name: 'verifiedAsc',
      by: [{field: 'lastVerifiedAt', direction: 'asc'}],
    },
    {title: 'Category', name: 'categoryAsc', by: [{field: 'category', direction: 'asc'}, {field: 'dataId', direction: 'asc'}]},
  ],
})
