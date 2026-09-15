/**
 * Turn an Imo-Home Instagram caption into listing fields.
 *
 * The agency writes to a house style — one fact per line, each behind an
 * emoji — so this is a parser, not a guess:
 *
 *   💥Shitet apartament 2+1 prane shetitores Kavaljon,Kavaje💥
 *   📍Prane shetitores Kavaljon
 *   🔸Kati 3
 *   🔸Siperfaqe 73 m2
 *   ▫️2 dhoma gjumi
 *   ▫️1 Tualet
 *   💵 Çmimi 54,000€
 *
 * Nothing here calls a model: the shapes are regular enough to read exactly,
 * and a deterministic parser can be tested. What it cannot read it leaves
 * empty rather than inventing, and the import reports the gaps.
 */

export type Parsed = {
  title: string
  /** Sale price in EUR, 0 when the caption gives no total. */
  priceEur: number
  /** True when the figure is a rate per m², not a total. */
  pricePerSqm: boolean
  priceRaw: string
  /** How the price was written, for the import's report. */
  priceKind: 'eur' | 'old-lek' | 'new-lek' | 'none'
  area: number
  plotArea: number
  bedrooms: number
  bathrooms: number
  livingRooms: number
  rooms: number
  floor: number
  districtLabel: string
  typeHint: string
  hasCertificate: boolean
  isNewBuild: boolean
  underConstruction: boolean
}

/** Ten old lek to the new one, about 100 new lek to the euro. */
const OLD_LEK_PER_EUR = 1000
const NEW_LEK_PER_EUR = 100
/** Under this, a converted sale total is a unit error rather than a bargain. */
const IMPLAUSIBLE_UNDER = 5000

export function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/** A number as the agency writes it: "2,200,000", "115.6", "45,66", "1 820". */
function num(raw: string): number {
  let s = raw.replace(/\s/g, '')
  // "45,66" is a decimal comma; "2,200,000" is thousands separators.
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '')
  else if (/^\d+,\d{1,2}$/.test(s)) s = s.replace(',', '.')
  else s = s.replace(/,/g, '')
  // "1.820" as thousands, but keep "115.6" as a decimal.
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '')
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

/** Every "N unit" figure on the price line, in order. */
type Money = {value: number; currency: 'eur' | 'lek'; perSqm: boolean; millions: boolean}

function readMoney(line: string): Money[] {
  const out: Money[] = []
  const re = /([\d][\d.,\s]*)\s*(milion\s*)?(€|euro|eur|lek[ëe]?)\s*(\/\s*m2?²?|\/m²)?/gi
  for (const m of line.matchAll(re)) {
    const value = num(m[1])
    if (!value) continue
    const millions = Boolean(m[2])
    out.push({
      value: millions ? value * 1_000_000 : value,
      currency: /lek/i.test(m[3]) ? 'lek' : 'eur',
      perSqm: Boolean(m[4]),
      millions,
    })
  }
  return out
}

/**
 * The price line, resolved to euro.
 *
 * Captions quote the same property several ways — "40€/m2 ose 80,000€",
 * "2,200,000leke (22milion leke)" — so a total in euro wins, then a total in
 * lek, and only a listing that offers nothing else is stored as a rate.
 *
 * Lek are ambiguous: the agency writes both the old lek (ten to the new) and,
 * occasionally, the new. Anything said in millions is old lek by convention;
 * a plain figure is divided by the rate that lands in a plausible band.
 */
export function readPrice(
  text: string,
  hints: {area?: number; dwelling?: boolean} = {},
): Pick<Parsed, 'priceEur' | 'pricePerSqm' | 'priceRaw' | 'priceKind'> {
  const line =
    text
      .split('\n')
      .find((l) => /[çc]mimi/i.test(l) || /duke filluar nga/i.test(l)) ?? ''
  if (!line) return {priceEur: 0, pricePerSqm: false, priceRaw: '', priceKind: 'none'}
  const money = readMoney(line)
  const raw = line.replace(/^[^\p{L}\p{N}]+/u, '').trim()

  const eurTotal = money.find((m) => m.currency === 'eur' && !m.perSqm)
  if (eurTotal) return {priceEur: Math.round(eurTotal.value), pricePerSqm: false, priceRaw: raw, priceKind: 'eur'}

  const lekTotal = money.find((m) => m.currency === 'lek' && !m.perSqm)
  if (lekTotal) {
    const asOld = Math.round(lekTotal.value / OLD_LEK_PER_EUR)
    const asNew = Math.round(lekTotal.value / NEW_LEK_PER_EUR)
    const pick = (v: number, kind: 'old-lek' | 'new-lek') =>
      ({priceEur: v, pricePerSqm: false, priceRaw: raw, priceKind: kind}) as const

    // When the same line also quotes a rate per m², the two must agree: the
    // reading whose total matches rate × area is the right one. This is the
    // only disambiguation that rests on the agency's own arithmetic rather
    // than on a guess about the market.
    const lekRate = money.find((m) => m.currency === 'lek' && m.perSqm)
    if (lekRate && hints.area) {
      const expectOld = (lekRate.value / OLD_LEK_PER_EUR) * hints.area
      const expectNew = (lekRate.value / NEW_LEK_PER_EUR) * hints.area
      const near = (a: number, b: number) => Math.abs(a - b) <= Math.max(a, b) * 0.15
      if (near(asOld, expectOld)) return pick(asOld, 'old-lek')
      if (near(asNew, expectNew)) return pick(asNew, 'new-lek')
    }

    // Otherwise let €/m² decide: a home outside €200–4 000/m² has been read in
    // the wrong lek. A 340 m² villa at €21 000 is a misread; at €210 000 it is
    // a villa.
    if (hints.dwelling && hints.area) {
      const perOld = asOld / hints.area
      const perNew = asNew / hints.area
      const sane = (v: number) => v >= 200 && v <= 4000
      if (sane(perOld) && !sane(perNew)) return pick(asOld, 'old-lek')
      if (sane(perNew) && !sane(perOld)) return pick(asNew, 'new-lek')
    }

    // Millions are the old lek by convention; a bare figure defaults there too
    // unless that leaves an implausibly small total.
    if (lekTotal.millions || asOld >= IMPLAUSIBLE_UNDER) return pick(asOld, 'old-lek')
    return pick(asNew, 'new-lek')
  }

  const rate = money.find((m) => m.perSqm)
  if (rate) {
    const eur = rate.currency === 'eur' ? rate.value : rate.value / NEW_LEK_PER_EUR
    return {priceEur: Math.round(eur), pricePerSqm: true, priceRaw: raw, priceKind: rate.currency === 'eur' ? 'eur' : 'new-lek'}
  }
  return {priceEur: 0, pricePerSqm: false, priceRaw: raw, priceKind: 'none'}
}

/**
 * "Siperfaqe … 73 m2" on a line, when the line is about the given subject.
 * The noun inflects — Siperfaqe, Siperfaqja, Siperfaqia — so the ending is
 * left open.
 */
function areaOn(text: string, subject: RegExp): number {
  for (const line of text.split('\n')) {
    if (!/sip[ëe]rfaq[ejia]/i.test(line)) continue
    if (!subject.test(fold(line))) continue
    const m = /([\d][\d.,\s]*)\s*m\s*[²2]/i.exec(line)
    if (m) return num(m[1])
  }
  return 0
}

/**
 * Counts like "2 dhoma gjumi", summed — a house lists them floor by floor.
 * The first line is skipped: the title already carries the layout as "2+1+2",
 * and counting it as well turned two bathrooms into four.
 */
function countAll(text: string, noun: RegExp): number {
  let total = 0
  for (const line of text.split('\n').slice(1)) {
    const m = new RegExp(`(\\d+)\\s*${noun.source}`, 'i').exec(line)
    if (m) total += Number(m[1])
  }
  return total
}

/** Place names the agency works, matched against the whole caption. */
const DISTRICTS: Array<[RegExp, string]> = [
  [/shk[ëe]mb/, 'Shkëmbi i Kavajës'],
  [/mali?\s*(i\s*)?robit/, 'Mali i Robit'],
  [/qerret/, 'Qerret'],
  [/golem|agonas/, 'Golem'],
  [/spille|bashtov/, 'Spille'],
  [/karpen/, 'Karpen'],
  [/momel|harizaj|zikxhafaj|gose|rrogozhin/, 'Kavajë'],
  [/kavaj/, 'Kavajë'],
]

const TYPE_HINTS: Array<[RegExp, string]> = [
  [/apart[- ]?hotel|mini[- ]?hotel|\bhotel\b/, 'commercial-space'],
  [/fabrik|magazin|kapanon/, 'commercial-space'],
  [/dyqan|ambient biznesi|njesi tregtare|lokal/, 'commercial-space'],
  [/\bzyr[ae]\b/, 'office'],
  [/\bvil[ëe]\b|\bvila\b/, 'villa'],
  [/sht[ëe]pi/, 'house'],
  [/duplek/, 'apartment'],
  [/garsonier/, 'studio'],
  [/apartament/, 'apartment'],
  [/tok[ëe]|truall|ullishte|ullinj/, 'land'],
]

export function parseCaption(text: string): Parsed {
  const flat = fold(text)
  const title = (text.split('\n')[0] || '').replace(/[^\p{L}\p{N}]+$/u, '').replace(/^[^\p{L}\p{N}]+/u, '').trim()

  // A dwelling's own area, then the plot it stands on.
  const built =
    areaOn(text, /ndertim|shtepie|shtepi|banes/) ||
    areaOn(text, /neto/) ||
    areaOn(text, /totale(?!\s+toke)/) ||
    areaOn(text, /^(?!.*toke).*$/)
  const plot = areaOn(text, /toke|truall|parcel/)

  const typeHint = TYPE_HINTS.find(([re]) => re.test(flat))?.[1] ?? ''
  // On land, the plot IS the listing's area.
  const area = typeHint === 'land' ? plot || built : built
  const plotArea = typeHint === 'land' ? 0 : plot

  // The area and the kind of property are what let a lek figure be read
  // correctly, so the price is worked out after them, not before.
  const price = readPrice(text, {
    area,
    dwelling: ['apartment', 'house', 'villa', 'studio', 'penthouse'].includes(typeHint),
  })

  const bedrooms = countAll(text, /dhom[ae]?\s*(e\s*)?gjumi/)
  const bathrooms = countAll(text, /tualet/)
  const livingRooms = countAll(text, /ambj?ent\s*(e\s*)?ndenj/)

  const notation = /(\d)\s*\+\s*(\d)/.exec(title) ?? /tipologjia?\s*(\d)\s*\+\s*(\d)/i.exec(text)
  const rooms = notation
    ? Number(notation[1]) + Number(notation[2])
    : bedrooms + (livingRooms || (bedrooms ? 1 : 0))

  const floorLine = /kati\s*:?\s*(\d{1,2})/i.exec(text)

  return {
    title,
    ...price,
    area,
    plotArea,
    bedrooms,
    bathrooms,
    livingRooms,
    rooms,
    floor: floorLine ? Number(floorLine[1]) : 0,
    districtLabel: DISTRICTS.find(([re]) => re.test(flat))?.[1] ?? '',
    typeHint,
    hasCertificate: /certifikat[ëe]\s*pron[ëe]si/i.test(flat),
    isNewBuild: /nd[ëe]rtim i ri|pallat i ri|i sapoperfunduar|i sapo perfunduar|kompleks i ri/i.test(flat),
    underConstruction: /faze nderti|ne ndertim|pritet te mbaroje|brenda \d+ muaj|me keste/i.test(flat),
  }
}

/**
 * Posts that are not listings at all: greetings, the agency's own branding,
 * and anything already sold or reserved. The user's rule is that sold
 * properties never reach the site.
 */
export function skipReason(text: string): string {
  if (text.trim().length < 200) return 'too short to be a listing'
  if (/\bSOLD\b|rezervuar|u shit\b|\bshitur\b/i.test(text)) return 'sold or reserved'
  if (/gezuar vitin|urime|festa e/i.test(text)) return 'greeting, not a listing'
  const isSale = /shitet|shiten/i.test(text.slice(0, 160))
  if (!isSale && /\bqera\b|\bqira\b|\/muaj/i.test(text)) return 'rental'
  if (!isSale) return 'not a sale listing'
  return ''
}
