/**
 * Authoring shapes for the knowledge-base question pages (seed of 2026-10-19).
 *
 * The English master is written here as plain data; the seed script turns it
 * into `knowledgeSource`, `knowledgeFact` and `knowledgeArticle` documents with
 * deterministic ids, so a re-run updates in place. Other locales are filled
 * afterwards by `translateLocaleGaps.ts --types knowledgeArticle`.
 */

export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'ESTIMATE' | 'FORECAST'

export type SourceSpec = {
  sourceId: string
  name: string
  publisher: string
  url: string
  sourceType:
    | 'official_government'
    | 'official_utility'
    | 'official_statistics'
    | 'research_institution'
    | 'market_analytics'
    | 'established_media'
    | 'marketplace'
    | 'agency'
    | 'forum_social'
    | 'internal_calculation'
  language: 'sq' | 'en' | 'it' | 'ru' | 'other'
  geography: string
  dataPeriod?: string
  publishedAt?: string
  accessedAt: string
  defaultConfidence: Confidence
  description: string
  notes?: string
}

export type FactSpec = {
  dataId: string
  factFamily: string
  category: string
  metric: string
  title: string
  dataKind:
    | 'tariff'
    | 'statistic'
    | 'asking_price'
    | 'reference_price'
    | 'advertised_rent'
    | 'model_estimate'
    | 'fee'
    | 'tax_rate'
    | 'legal_requirement'
  value?: number
  valueLow?: number
  valueHigh?: number
  unit: string
  valueText: string
  originalValue?: number
  originalCurrency?: 'ALL' | 'EUR'
  geography: string
  period: string
  validFrom?: string
  /** sourceId of an existing or new knowledgeSource. */
  source: string
  secondarySources?: string[]
  confidence: Confidence
  methodology?: string
  rawQuote?: string
  /** dataId of the version this one replaces; the seed flips it to isCurrent=false. */
  supersedes?: string
  citySlug?: string
}

/**
 * Prose in a section body: paragraphs separated by a blank line, a line that
 * starts with "- " is a bullet. No links or marks — the translator works on
 * whole paragraphs, and the related pages are linked by the page itself.
 */
export type Md = string

export type TableSpec = {
  id: string
  title?: string
  columns: string[]
  rows: {cells: string[]; facts?: string[]; note?: string}[]
  methodology?: string
  confidence?: Confidence
}

export type ArticleSpec = {
  /** documentId, e.g. KB-BUY-FOREIGNERS. */
  id: string
  slug: string
  group: 'buying' | 'money' | 'ownership' | 'process' | 'geography'
  category: string
  tags: string[]
  citySlug?: string
  /** The H1: the question, as a visitor would ask it. */
  title: string
  /** First paragraph: the answer in 2–3 sentences, with a figure and a date. */
  summary: string
  dataPeriod: string
  confidence: Confidence
  sections: {key: string; heading: string; body?: Md; tables?: TableSpec[]}[]
  faq: {q: string; a: string}[]
  /** Extra facts the page relies on beyond those cited in table rows. */
  facts?: string[]
  /** sourceIds cited in the text (laws, decisions) beyond the facts' own sources. */
  sources: string[]
  gaps?: {id: string; text: string; priority: 'HIGH' | 'MEDIUM' | 'LOW'}[]
  related?: string[]
  seoTitle?: string
  seoDescription?: string
  /** Months until the next review; taxes and law 6, prices 12. */
  reviewMonths?: number
}
