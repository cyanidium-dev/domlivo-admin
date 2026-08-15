import {parse} from 'node-html-parser'

export type DetailRow = {
  advertId: string
  areaM2: number | null
  condition: string | null
  address: string | null
  rooms: number | null
  listingType: string | null
}

/**
 * Detail pages expose attributes as `a.tag-item` blocks:
 *   <span>Sip&#235;rfaqe:</span><bdi>100 m<sup>2</sup></bdi>
 * Parsing the DOM rather than flattened text matters twice over: the label is
 * entity-encoded, and the unit is marked up, so a raw-HTML string match on
 * "Sipërfaqe:" or "m2" finds nothing.
 *
 * The price is NOT here — MerrJep renders it client-side and the server HTML
 * carries the literal "Placeholder". Never try to read a price from this page;
 * it comes from the search card, joined on advert id.
 */
export function parseDetail(html: string, advertId: string): DetailRow {
  const root = parse(html)
  const fields = new Map<string, string>()

  for (const tag of root.querySelectorAll('a.tag-item')) {
    const label = tag.querySelector('span')?.text?.replace(/\s+/g, ' ').trim() ?? ''
    const value = tag.querySelector('bdi')?.text?.replace(/\s+/g, ' ').trim() ?? ''
    if (!label) continue
    fields.set(label.replace(/:\s*$/, '').toLowerCase(), value)
  }

  const area = fields.get('sipërfaqe') ?? fields.get('siperfaqe') ?? ''
  const areaMatch = area.match(/([\d.,]+)\s*m/i)

  const rooms = fields.get('numri i dhomave') ?? ''
  const roomsMatch = rooms.match(/(\d+)/)

  return {
    advertId,
    areaM2: areaMatch ? Number.parseFloat(areaMatch[1].replace(',', '.')) : null,
    condition: fields.get('gjendje') ?? null,
    address: fields.get('adresa/rruga') ?? null,
    rooms: roomsMatch ? Number.parseInt(roomsMatch[1], 10) : null,
    listingType: fields.get('lloji i njoftimit') ?? null,
  }
}
