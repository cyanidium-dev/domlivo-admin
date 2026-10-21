import type {ArticleSpec} from './types'
import {ARTICLES_MARKET} from './articlesMarket'
import {ARTICLES_LIVING} from './articlesLiving'
import {ARTICLES_INFRA} from './articlesInfra'

/** The 10 question pages of the 2026-10-21 batch (long-tail family F4). */
export const ARTICLES_F4: ArticleSpec[] = [...ARTICLES_MARKET, ...ARTICLES_LIVING, ...ARTICLES_INFRA]
