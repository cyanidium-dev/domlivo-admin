/**
 * Authoring shapes for the second batch of knowledge-base question pages
 * (2026-10-21, long-tail family F4). Same shapes as the 2026-10-19 seed, plus
 * hand-written translations for the one or two locales where Search Console
 * shows demand. No other locale is filled: the page in those locales is
 * noindex and stays out of the sitemap until someone writes it.
 */
import type {ArticleSpec as BaseArticleSpec} from '../knowledge-base-2026-10-19/types'

export type {Confidence, SourceSpec, FactSpec, Md, TableSpec} from '../knowledge-base-2026-10-19/types'

export type TrLocale = 'uk' | 'ru' | 'sq' | 'it' | 'pl' | 'de'

export type TableTr = {
  title?: string
  columns?: string[]
  /** Cells by row, in the same order as the English rows; '' keeps the English cell. */
  rows?: string[][]
  methodology?: string
}

export type SectionTr = {
  heading: string
  body?: string
  tables?: Record<string, TableTr>
}

export type ArticleTr = {
  title: string
  summary: string
  seoTitle?: string
  seoDescription?: string
  /** By section key. */
  sections: Record<string, SectionTr>
  /** Same order and length as the English FAQ. */
  faq: {q: string; a: string}[]
  /** Same order as the English gaps. */
  gaps?: string[]
}

export type ArticleSpec = BaseArticleSpec & {
  tr?: Partial<Record<TrLocale, ArticleTr>>
}
