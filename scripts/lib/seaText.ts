/**
 * What listing copy says about the sea: a stated distance in metres, first-line
 * wording, a sea view. Shared by enrichSeaData.ts (copies the text into the
 * structured fields) and computeSeaDistance20261011.ts (compares the text with
 * the distance measured on the map).
 */
const WORD_NUMBERS: Record<string, number> = {
  // en
  'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
  'a hundred': 100, 'one hundred': 100, 'hundred': 100, 'one hundred and fifty': 150, 'a hundred and fifty': 150,
  'two hundred': 200, 'two hundred and fifty': 250, 'three hundred': 300, 'three hundred and fifty': 350,
  'four hundred': 400, 'five hundred': 500, 'six hundred': 600, 'seven hundred': 700, 'eight hundred': 800,
  // sq
  'njëzet': 20, 'tridhjetë': 30, 'dyzet': 40, 'pesëdhjetë': 50, 'gjashtëdhjetë': 60, 'shtatëdhjetë': 70,
  'tetëdhjetë': 80, 'nëntëdhjetë': 90, 'njëqind': 100, 'njëqind e pesëdhjetë': 150, 'dyqind': 200,
  'dyqind e pesëdhjetë': 250, 'treqind': 300, 'treqind e pesëdhjetë': 350, 'katërqind': 400, 'pesëqind': 500,
  // ru (nominative and genitive/prepositional)
  'двадцать': 20, 'двадцати': 20, 'тридцать': 30, 'тридцати': 30, 'сорок': 40, 'сорока': 40,
  'пятьдесят': 50, 'пятидесяти': 50, 'шестьдесят': 60, 'шестидесяти': 60, 'семьдесят': 70, 'семидесяти': 70,
  'восемьдесят': 80, 'восьмидесяти': 80, 'девяносто': 90, 'сто': 100, 'ста': 100, 'двести': 200, 'двухсот': 200,
  'триста': 300, 'трёхсот': 300, 'трехсот': 300, 'четыреста': 400, 'четырёхсот': 400, 'пятьсот': 500, 'пятисот': 500,
  // uk
  'пʼятдесят': 50, "п'ятдесят": 50, 'пʼятдесяти': 50, 'сімдесят': 70, 'сімдесяти': 70, 'сотні': 100,
  'двісті': 200, 'двохсот': 200, 'чотириста': 400, 'чотирьохсот': 400, 'триста ': 300, 'трьохсот': 300, 'пʼятсот': 500, 'пʼятисот': 500,
  // it
  'cinquanta': 50, 'settanta': 70, 'cento': 100, 'duecento': 200, 'trecento': 300, 'cinquecento': 500,
  // pl
  'pięćdziesiąt': 50, 'pięćdziesięciu': 50, 'siedemdziesiąt': 70, 'siedemdziesięciu': 70, 'sto ': 100, 'stu': 100,
  'dwieście': 200, 'dwustu': 200, 'trzysta': 300, 'trzystu': 300, 'pięćset': 500, 'pięciuset': 500,
}
const WORD_ALT = Object.keys(WORD_NUMBERS)
  .map((w) => w.trim())
  .sort((a, b) => b.length - a.length)
  .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|')
// The lookbehind stops a spelled number matching the tail of a longer one:
// Ukrainian "чотириста" (400) must not read as "ста" (100).
const NUM = `(?<![\\p{L}\\d])(\\d{1,4}(?:[.,]\\d{3})?|${WORD_ALT})`
const SEA = {
  en: '(?:the\\s+)?(?:sea|beach|seafront|shore|coast)',
  sq: '(?:deti|detit|plazhi|plazhit|bregdeti)',
  ru: '(?:моря|пляжа|берега|набережной)',
  uk: '(?:моря|пляжу|берега)',
  it: '(?:mare|spiaggia)',
  pl: '(?:morza|plaży)',
}
const DISTANCE_PATTERNS: RegExp[] = [
  new RegExp(`${NUM}\\s?(?:m|metres|meters|metre|meter)\\b[^.\\n]{0,15}?\\b(?:from|to|away from)\\s+${SEA.en}`, 'giu'),
  new RegExp(`${SEA.en.replace('(?:the\\s+)?', '')}\\s+(?:is\\s+)?(?:only\\s+|just\\s+|about\\s+)?${NUM}\\s?(?:m|metres|meters)\\b(?:\\s+away)?`, 'giu'),
  new RegExp(`${NUM}\\s?(?:m|metra|metër|metro)\\s+(?:larg\\s+)?(?:nga|deri te|deri në)\\s+${SEA.sq}`, 'giu'),
  new RegExp(`${SEA.sq}\\s+(?:është\\s+|ndodhet\\s+)?(?:vetëm\\s+|rreth\\s+)?${NUM}\\s?(?:m|metra)\\b`, 'giu'),
  new RegExp(`${NUM}\\s?(?:м|метр\\p{L}*)\\s+(?:от|до)\\s+${SEA.ru}`, 'giu'),
  new RegExp(`до\\s+${SEA.ru.replace('(?:', '(?:')}\\s*(?:—|-|–)?\\s*(?:всего\\s+|около\\s+)?${NUM}\\s?(?:м|метр\\p{L}*)`, 'giu'),
  new RegExp(`${NUM}\\s?(?:м|метр\\p{L}*)\\s+(?:від|до)\\s+${SEA.uk}`, 'giu'),
  new RegExp(`до\\s+${SEA.uk}\\s*(?:—|-|–)?\\s*(?:всього\\s+|близько\\s+)?${NUM}\\s?(?:м|метр\\p{L}*)`, 'giu'),
  new RegExp(`${NUM}\\s?(?:m|metri)\\s+(?:dal|dalla)\\s+${SEA.it}`, 'giu'),
  new RegExp(`${NUM}\\s?(?:m|metrów|metry|metra)\\s+(?:od|do)\\s+${SEA.pl}`, 'giu'),
]
export const FIRST_LINE = /\b(?:first line|1st line|front line)\b|vij[aeë]n?\s+e\s+par[eë]|перв(?:ая|ой|ую)\s+лини|перш(?:а|ій|у)\s+лін|prima linea|pierwsz(?:a|ej|ą)\s+lini/iu
/**
 * Context that makes a first-line phrase mean something else: a distance from
 * the first line ("100 м от первой линии"), its noise, a road's first line.
 * "beachfront" is left out on purpose — the copy uses it for the whole coast.
 */
// \b is ASCII-only in JS regexes, so word starts are spelled as start-or-space.
const FIRST_LINE_NOT_BEFORE = /(?:^|\s)(?:от|from(?: the)?|від|nga|dal(?:la)?)\s*$/iu
const FIRST_LINE_NOT_AFTER = /^\p{L}*\s*(?:дорог|road|street|rrug|вулиц|улиц)/iu
export const SEA_VIEW = /\bsea[\s-]views?\b|views? (?:of|over) the sea|overlooking the sea|pamje\s+(?:nga\s+|ndaj\s+)?det|вид(?:ом)?\s+на\s+море|вид(?:ом)?\s+на\s+море|vista mare|widok(?:iem)?\s+na\s+morze/iu
export const SEA_VIEW_NEGATED = /\bno sea view|without (?:a )?sea view|pa pamje|без вида на море|без виду на море|senza vista mare|bez widoku na morze/iu

function toNumber(raw: string): number | null {
  const lower = raw.toLowerCase().trim()
  if (WORD_NUMBERS[lower] !== undefined) return WORD_NUMBERS[lower]
  const digits = Number(lower.replace(/[.,](?=\d{3}\b)/g, ''))
  return Number.isFinite(digits) ? digits : null
}

export function readDistance(texts: string[]): {meters: number; phrase: string} | null {
  let best: {meters: number; phrase: string} | null = null
  for (const text of texts) {
    for (const re of DISTANCE_PATTERNS) {
      re.lastIndex = 0
      for (const m of text.matchAll(re)) {
        // "109 m², 3 km from the sea": an area or a kilometre figure caught
        // between the number and the sea word is not a distance in metres.
        if (/\bm[²2]|\bkm\b|\bкм\b/iu.test(m[0])) continue
        const meters = toNumber(m[1])
        if (meters === null || meters < 5 || meters > 3000) continue
        if (!best || meters < best.meters) best = {meters, phrase: m[0]}
      }
    }
  }
  return best
}

/** The first-line phrase with some context, unless it means a distance from the first line, its noise or a road. */
export function firstLinePhrase(texts: string[]): string | null {
  for (const t of texts) {
    const m = FIRST_LINE.exec(t)
    if (!m) continue
    const before = t.slice(Math.max(0, m.index - 25), m.index)
    const after = t.slice(m.index + m[0].length, m.index + m[0].length + 15)
    if (FIRST_LINE_NOT_BEFORE.test(before) || /шум|гамір|noise|zhurm/iu.test(before) || FIRST_LINE_NOT_AFTER.test(after)) {
      continue
    }
    return t.slice(Math.max(0, m.index - 35), m.index + m[0].length + 25).replace(/\s+/g, ' ')
  }
  return null
}

/** The sea-view phrase, skipping a text that negates it. */
export function seaViewPhrase(texts: string[]): string | null {
  for (const t of texts) {
    if (SEA_VIEW_NEGATED.test(t)) continue
    const m = SEA_VIEW.exec(t)
    if (m) return m[0]
  }
  return null
}
