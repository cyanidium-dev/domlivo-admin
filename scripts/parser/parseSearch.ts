import {parse} from 'node-html-parser'

export type SearchRow = {
  advertId: string
  priceEur: number | null
  priceLek: number | null
  isRent: boolean
  title: string
}

/** "5 800 000" | "1.250" -> 5800000 | 1250 */
function toNumber(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return null
  const n = Number.parseInt(digits, 10)
  return Number.isFinite(n) ? n : null
}

/** "/njoftim/shitet-pallat-i-ri-parruce/19644148" -> "19644148" */
export function advertIdFromHref(href: string): string | null {
  const m = href.match(/\/njoftim\/[^/]+\/(\d+)/)
  return m ? m[1] : null
}

/**
 * Search pages carry the price but NOT the area. The advert id from the card's
 * own anchor is the join key to the detail page — never fall back to "first
 * /njoftim/ link on the page", which mispairs every card.
 */
export function parseSearch(html: string): SearchRow[] {
  const root = parse(html)
  const byId = new Map<string, SearchRow>()

  for (const card of root.querySelectorAll('div.goodssearch-item-content')) {
    const anchor = card.querySelector('a[href*="/njoftim/"]')
    const advertId = anchor ? advertIdFromHref(anchor.getAttribute('href') ?? '') : null
    if (!advertId || byId.has(advertId)) continue

    const text = card.text.replace(/\s+/g, ' ').trim()
    // Both orders occur: server HTML renders "17 000 EUR", the browser's
    // innerText renders "EUR 17 000". Match either, number-first preferred.
    const eur = text.match(/([\d][\d\s.]*\d)\s*EUR\b/i) ?? text.match(/\bEUR\s*([\d][\d\s.]*\d)/i)
    const lek = text.match(/([\d][\d\s.]*\d)\s*LEK\b/i) ?? text.match(/\bLEK\s*([\d][\d\s.]*\d)/i)

    byId.set(advertId, {
      advertId,
      priceEur: eur ? toNumber(eur[1]) : null,
      priceLek: lek ? toNumber(lek[1]) : null,
      isRent: /qir|qer|\/\s*muaj/i.test(text),
      title: text.slice(0, 140),
    })
  }

  return [...byId.values()].filter((r) => r.priceEur !== null || r.priceLek !== null)
}
