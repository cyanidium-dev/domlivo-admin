/**
 * Hand-written copy for the SEO sprint of 2026-09-15 (applySeoSprint1.ts).
 *
 * Every value here was written against a Search Console finding, not a
 * template: the analysis is the "SEO-разбор Domlivo" report of 2026-09-15.
 * No figures appear in titles — prices stay in the page bodies, which cite
 * the knowledge base. Albanian is pending native review (CONTENT-OPS).
 *
 * Paths are Sanity JSONMatch paths, as `client.patch().set()` takes them.
 */

export type Locale = 'en' | 'sq' | 'ru' | 'uk' | 'it' | 'pl'
export type LocalizedValue = Partial<Record<Locale, string>>

export type DocEdit = {
  id: string
  why: string
  /** path (without the locale) → per-locale value */
  localized?: Record<string, LocalizedValue>
  /** path → plain value */
  plain?: Record<string, string>
}

/** Same value under `seo.metaTitle` and `seo.ogTitle`: landings resolve og first. */
function landingTitles(v: LocalizedValue): Record<string, LocalizedValue> {
  return {'seo.metaTitle': v, 'seo.ogTitle': v}
}

// ---------------------------------------------------------------------------
// City prices pages (`/{l}/albania/{city}/info`)
// ---------------------------------------------------------------------------
// The stored titles put the nominative after a preposition in four languages
// ("Prona në Tirana", "Недвижимость в Дуррес", "Нерухомість у Тірана") and
// said nothing about what the page is: prices by district. Search Console
// queries that reach these pages are price queries ("cmimet e apartamenteve
// ne tirane 2026", "реальные цены на жилье в дурресе 2026").

const cityPricesTitle: Record<string, LocalizedValue> = {
  tirana: {
    en: 'Tirana Property Prices 2026: €/m² by District and Best Areas',
    sq: 'Çmimet e apartamenteve në Tiranë 2026: €/m² sipas lagjeve',
    ru: 'Цены на недвижимость в Тиране 2026: €/м² по районам',
    uk: 'Ціни на нерухомість у Тирані 2026: €/м² за районами',
    it: 'Prezzi delle case a Tirana 2026: €/m² per zona',
    pl: 'Ceny nieruchomości w Tiranie 2026: €/m² według dzielnic',
  },
  durres: {
    en: 'Durres Property Prices 2026: €/m² by District',
    sq: 'Çmimet e apartamenteve në Durrës 2026: €/m² sipas zonave',
    ru: 'Цены на недвижимость в Дурресе 2026: €/м² по районам',
    uk: 'Ціни на нерухомість у Дурресі 2026: €/м² за районами',
    it: 'Prezzi delle case a Durazzo 2026: €/m² per zona',
    pl: 'Ceny nieruchomości w Durrës 2026: €/m² według dzielnic',
  },
  vlore: {
    en: 'Vlore Property Prices 2026: €/m² by District',
    sq: 'Çmimet e apartamenteve në Vlorë 2026: €/m² sipas zonave',
    ru: 'Цены на недвижимость во Влёре 2026: €/м² по районам',
    uk: 'Ціни на нерухомість у Вльорі 2026: €/м² за районами',
    it: 'Prezzi delle case a Valona 2026: €/m² per zona',
    pl: 'Ceny nieruchomości we Wlorze 2026: €/m² według dzielnic',
  },
  sarande: {
    en: 'Sarande Property Prices 2026: €/m² by District',
    sq: 'Çmimet e apartamenteve në Sarandë 2026: €/m² sipas zonave',
    ru: 'Цены на недвижимость в Саранде 2026: €/м² по районам',
    uk: 'Ціни на нерухомість у Саранді 2026: €/м² за районами',
    it: 'Prezzi delle case a Saranda 2026: €/m² per zona',
    pl: 'Ceny nieruchomości w Sarandzie 2026: €/m² według dzielnic',
  },
  himare: {
    en: 'Himare Property Prices 2026: €/m² by District',
    sq: 'Çmimet e apartamenteve në Himarë 2026: €/m² sipas zonave',
    ru: 'Цены на недвижимость в Химаре 2026: €/м² по районам',
    uk: 'Ціни на нерухомість у Хімарі 2026: €/м² за районами',
    it: 'Prezzi delle case a Himara 2026: €/m² per zona',
    pl: 'Ceny nieruchomości w Himarze 2026: €/m² według dzielnic',
  },
  shengjin: {
    en: 'Shëngjin Property Prices 2026: €/m² by District',
    sq: 'Çmimet e apartamenteve në Shëngjin 2026: €/m² sipas zonave',
    ru: 'Цены на недвижимость в Шенджине 2026: €/м² по районам',
    uk: 'Ціни на нерухомість у Шенджіні 2026: €/м² за районами',
    it: 'Prezzi delle case a Shëngjin 2026: €/m² per zona',
    pl: 'Ceny nieruchomości w Shëngjin 2026: €/m² według dzielnic',
  },
  shkoder: {
    en: 'Shkoder Property Prices 2026: €/m² by District',
    sq: 'Çmimet e apartamenteve në Shkodër 2026: €/m² sipas lagjeve',
    ru: 'Цены на недвижимость в Шкодере 2026: €/м² по районам',
    uk: 'Ціни на нерухомість у Шкодері 2026: €/м² за районами',
    it: 'Prezzi delle case a Scutari 2026: €/m² per zona',
    pl: 'Ceny nieruchomości w Szkodrze 2026: €/m² według dzielnic',
  },
}

/** Hero H1s: Tirana and Durrës opened with "Buy property in…" on a prices page — the listing's intent. */
const cityPricesH1: Record<string, {key: string; value: LocalizedValue}> = {
  tirana: {
    key: 'b3a6810d6269',
    value: {
      en: 'Property prices in Tirana in 2026, district by district',
      sq: 'Çmimet e apartamenteve në Tiranë në 2026, lagje pas lagjeje',
      ru: 'Цены на недвижимость в Тиране в 2026 году по районам',
      uk: 'Ціни на нерухомість у Тирані у 2026 році за районами',
      it: 'Prezzi delle case a Tirana nel 2026, zona per zona',
      pl: 'Ceny nieruchomości w Tiranie w 2026 roku, dzielnica po dzielnicy',
    },
  },
  durres: {
    key: 'heroSection-0',
    value: {
      en: 'Property prices in Durres in 2026, area by area',
      sq: 'Çmimet e apartamenteve në Durrës në 2026, zonë pas zone',
      ru: 'Цены на недвижимость в Дурресе в 2026 году по районам',
      uk: 'Ціни на нерухомість у Дурресі у 2026 році за районами',
      it: 'Prezzi delle case a Durazzo nel 2026, zona per zona',
      pl: 'Ceny nieruchomości w Durrës w 2026 roku, dzielnica po dzielnicy',
    },
  },
  // The Albanian H1s of these four repeated the ungrammatical stored title.
  himare: {key: 'hero', value: {sq: 'Çmimet e pronave në Himarë në 2026'}},
  sarande: {key: 'hero', value: {sq: 'Çmimet e pronave në Sarandë në 2026'}},
  shengjin: {key: 'hero', value: {sq: 'Çmimet e pronave në Shëngjin në 2026'}},
  vlore: {key: 'hero', value: {sq: 'Çmimet e pronave në Vlorë në 2026'}},
}

const cityLandingEdits: DocEdit[] = Object.entries(cityPricesTitle).map(([city, title]) => {
  const h1 = cityPricesH1[city]
  return {
    id: `landing-${city}`,
    why: 'city prices page: grammatical price-intent title' + (h1 ? ' and H1' : ''),
    localized: {
      ...landingTitles(title),
      ...(h1 ? {[`pageSections[_key=="${h1.key}"].title`]: h1.value} : {}),
    },
  }
})

// ---------------------------------------------------------------------------
// /cities
// ---------------------------------------------------------------------------
// "Cities — Domlivo" at position 4–5 with a 65-character description.

const citiesIndexEdit: DocEdit = {
  id: 'landing-cities',
  why: '/cities: title and description that say what the page compares',
  localized: {
    ...landingTitles({
      en: 'Best Cities to Buy Property in Albania: Prices by City 2026',
      sq: 'Ku të blini pronë në Shqipëri: çmimet sipas qyteteve 2026',
      ru: 'Где купить недвижимость в Албании: цены по городам 2026',
      uk: 'Де купити нерухомість в Албанії: ціни за містами 2026',
      it: 'Dove comprare casa in Albania: prezzi per città 2026',
      pl: 'Gdzie kupić nieruchomość w Albanii: ceny w miastach 2026',
    }),
    'seo.metaDescription': {
      en: 'Tirana, Durrës, Vlorë, Sarandë, Himarë, Shëngjin and Shkodër side by side: asking prices per m², who each city suits, and the listings for sale.',
      sq: 'Tirana, Durrësi, Vlora, Saranda, Himara, Shëngjini dhe Shkodra: çmimet për m², për kë është secili qytet dhe pronat në shitje.',
      ru: 'Тирана, Дуррес, Влёра, Саранда, Химара, Шенджин и Шкодер: цены за м², кому подходит каждый город и объекты в продаже.',
      uk: 'Тирана, Дуррес, Вльора, Саранда, Хімара, Шенджін і Шкодер: ціни за м², кому підходить кожне місто та обʼєкти в продажу.',
      it: 'Tirana, Durazzo, Valona, Saranda, Himara, Shëngjin e Scutari a confronto: prezzi al m², per chi è ogni città e gli immobili in vendita.',
      pl: 'Tirana, Durrës, Wlora, Saranda, Himara, Shëngjin i Szkodra: ceny za m², dla kogo jest każde miasto i oferty na sprzedaż.',
    },
  },
}
citiesIndexEdit.localized!['seo.ogDescription'] = citiesIndexEdit.localized!['seo.metaDescription']

// ---------------------------------------------------------------------------
// Blog posts (resolved metaTitle first, then ogTitle)
// ---------------------------------------------------------------------------

const blogEdits: Array<{slug: string; why: string; localized: Record<string, LocalizedValue>}> = [
  {
    slug: 'market-outlook-2026',
    why: 'position 6.3 with 164 impressions and no click: the title asked a question and gave no reason to open it',
    localized: {
      'seo.metaTitle': {en: 'Buy Property in Albania in 2026? Prices, Risks and Our Verdict'},
      'seo.ogTitle': {en: 'Buy Property in Albania in 2026? Prices, Risks and Our Verdict'},
    },
  },
  {
    slug: 'how-to-choose-tirana-durres-vlore',
    why: 'position 9 for "best city to live", "vlore vs durres": name the decision the post helps with',
    localized: {
      'seo.metaTitle': {en: 'Tirana vs Durrës vs Vlorë: Where to Buy Property in 2026'},
      'seo.ogTitle': {en: 'Tirana vs Durrës vs Vlorë: Where to Buy Property in 2026'},
    },
  },
]

// ---------------------------------------------------------------------------
// Comparison guides
// ---------------------------------------------------------------------------
// Italian searchers ask "meglio valona o durazzo", "meglio tirana o durazzo" —
// the only query on the site with a click. uk/ru get the country comparisons
// in the form "где купить у моря", which is the decision behind them.

const guideTitles: Record<string, LocalizedValue> = {
  'albania-vs-croatia': {
    it: 'Albania o Croazia: dove comprare casa al mare nel 2026',
    ru: 'Албания или Хорватия: где купить недвижимость у моря в 2026',
    uk: 'Албанія чи Хорватія: де купити нерухомість біля моря у 2026',
  },
  'albania-vs-greece': {
    it: 'Albania o Grecia: dove comprare casa al mare nel 2026',
    ru: 'Албания или Греция: где купить недвижимость у моря в 2026',
    uk: 'Албанія чи Греція: де купити нерухомість біля моря у 2026',
  },
  'albania-vs-montenegro': {
    it: 'Albania o Montenegro: dove comprare casa al mare nel 2026',
    ru: 'Албания или Черногория: где купить недвижимость у моря в 2026',
    uk: 'Албанія чи Чорногорія: де купити нерухомість біля моря у 2026',
  },
  'blloku-vs-myslym-shyri': {it: 'Meglio Blloku o Myslym Shyri? Prezzi e confronto 2026'},
  'dhermi-vs-himara': {it: 'Meglio Dhërmi o Himara? Prezzi e confronto 2026'},
  'golem-vs-plepa': {it: 'Meglio Golem o Plepa? Prezzi e confronto 2026'},
  'himara-vs-saranda': {it: 'Meglio Himara o Saranda? Prezzi e confronto 2026'},
  'kombinat-vs-komuna-e-parisit': {it: 'Meglio Kombinat o Komuna e Parisit? Confronto 2026'},
  'lungomare-vs-plazh': {it: 'Meglio Lungomare (Valona) o Plazh (Durazzo)? Confronto 2026'},
  'rana-e-hedhur-vs-tale': {it: 'Meglio Rana e Hedhur o Tale? Prezzi e confronto 2026'},
  'saranda-vs-ksamil': {
    it: 'Meglio Saranda o Ksamil? Prezzi e confronto 2026',
    uk: 'Саранда чи Ксаміль: де краще купити житло у 2026',
  },
  'shengjin-vs-durres': {it: 'Meglio Shëngjin o Durazzo? Prezzi e confronto 2026'},
  'tirana-vs-durres': {it: 'Meglio Tirana o Durazzo? Prezzi e confronto 2026'},
  'velipoja-vs-shengjin': {it: 'Meglio Velipoja o Shëngjin? Prezzi e confronto 2026'},
  'vlora-vs-saranda': {it: 'Meglio Valona o Saranda? Prezzi e confronto 2026'},
}

// ---------------------------------------------------------------------------
// City listings (catalogSeoPage: `title` is the H1, `seo.metaTitle` the <title>)
// ---------------------------------------------------------------------------

function listingTitle(v: LocalizedValue): Record<string, LocalizedValue> {
  return {title: v, 'seo.metaTitle': v}
}

const catalogCityEdits: DocEdit[] = [
  {
    id: 'catalogSeoPage-city-city-durres',
    why: 'ru/uk Durrës listing: the searched phrase is "недвижимость в дурресе", "квартири в дурресі" (positions 21–35)',
    localized: listingTitle({
      ru: 'Недвижимость в Дурресе: купить квартиру у моря',
      uk: 'Нерухомість у Дурресі: купити квартиру біля моря',
    }),
  },
  {
    id: 'catalogSeoPage-city-city-sarande',
    why: 'Poles search "Saranda", not the Albanian "Sarande" (87 impressions at position 33); ru/uk locative',
    localized: listingTitle({
      pl: 'Saranda: nieruchomości na sprzedaż — mieszkania i domy nad morzem',
      ru: 'Недвижимость в Саранде: купить квартиру у моря',
      uk: 'Нерухомість у Саранді: купити квартиру біля моря',
    }),
  },
  {
    id: 'catalogSeoPage-city-city-vlore',
    why: 'ru/uk locative',
    localized: listingTitle({
      ru: 'Недвижимость во Влёре: купить квартиру у моря',
      uk: 'Нерухомість у Вльорі: купити квартиру біля моря',
    }),
  },
  {
    id: 'catalogSeoPage-city-city-shengjin',
    why: 'ru/uk locative',
    localized: listingTitle({
      ru: 'Недвижимость в Шенджине: купить квартиру у моря',
      uk: 'Нерухомість у Шенджіні: купити квартиру біля моря',
    }),
  },
  {
    id: 'catalogSeoPage-city-city-tirana',
    why: 'ru/uk locative',
    localized: listingTitle({
      ru: 'Недвижимость в Тиране: купить квартиру или дом',
      uk: 'Нерухомість у Тирані: купити квартиру чи будинок',
    }),
  },
  {
    id: 'catalogSeoPage-city-city-shkoder',
    why: 'sq: "në Shkodra" → locative "në Shkodër"',
    localized: listingTitle({sq: 'Shtëpi dhe apartamente në shitje në Shkodër'}),
  },
]

const otherEdits: DocEdit[] = [
  {
    id: 'city-sarande',
    why: 'Polish name of the city is "Saranda"; "Sarande" reached nav, cards and titles',
    localized: {title: {pl: 'Saranda'}},
  },
  {
    id: 'landing-district-city-center-durres',
    why: '"реальные цены на жилье в дурресе 2026" reaches this page at position 7.5 with 15 impressions',
    localized: {
      ...landingTitles({ru: 'Центр Дурреса: реальные цены на жильё в 2026'}),
      'pageSections[_key=="hero"].title': {ru: 'Центр Дурреса: реальные цены на жильё в 2026'},
    },
  },
  {
    id: 'landing-home',
    why: 'home city carousel linked the prices pages; city listings had no contextual link at all',
    plain: {'pageSections[_key=="1f137bba4918"].linkTargetType': 'catalog'},
  },
]

export const STATIC_EDITS: DocEdit[] = [...cityLandingEdits, citiesIndexEdit, ...catalogCityEdits, ...otherEdits]
export const BLOG_EDITS = blogEdits
export const GUIDE_TITLES = guideTitles
export const guideTitleEdit = landingTitles

// ---------------------------------------------------------------------------
// Seeded catalogue intros that still offer rentals
// ---------------------------------------------------------------------------
// Rentals were removed from the site on 2026-09-15; 38 catalogue pages still
// opened with "…for sale and rent." — and ru/uk put the place in the
// nominative after "в". Only strings that match the seed exactly are
// replaced; hand-written intros and bottom texts are never touched.

export const SEEDED_INTRO: Record<Locale, RegExp> = {
  en: /^Browse properties in (.+): apartments, houses, villas for sale and rent\.$/,
  it: /^Sfoglia immobili (?:a|in) (.+): appartamenti, case, ville in vendita e affitto\.$/,
  ru: /^Просмотрите объекты в (.+): квартиры, дома, виллы для покупки и аренды\.$/,
  uk: /^Огляньте об'єкти в (.+): квартири, будинки, вілли для купівлі та оренди\.$/,
  sq: /^Shikoni pronat në (.+): apartamente, shtëpi, vila për blerje dhe qira\.$/,
  pl: /^Przeglądaj nieruchomości (?:w|na) (.+): mieszkania, domy i wille na sprzedaż i wynajem\.$/,
}

export const SALE_INTRO: Record<Locale, (place: string) => string> = {
  en: (p) => `Apartments, houses and villas for sale in ${p}.`,
  it: (p) => `Appartamenti, case e ville in vendita a ${p}.`,
  ru: (p) => `${p}: квартиры, дома и виллы на продажу.`,
  uk: (p) => `${p}: квартири, будинки та вілли на продаж.`,
  sq: (p) => `${p}: apartamente, shtëpi dhe vila në shitje.`,
  pl: (p) => `${p}: mieszkania, domy i wille na sprzedaż.`,
}

export const ROOT_INTRO: {seeded: LocalizedValue; sale: LocalizedValue} = {
  seeded: {
    en: 'Browse apartments, houses and villas for sale and rent. Filter by city, price and type.',
    it: 'Sfoglia appartamenti, case e ville in vendita e affitto. Filtra per città, prezzo e tipo.',
    pl: 'Przeglądaj mieszkania, domy i wille na sprzedaż i wynajem. Filtruj według miasta, ceny i typu.',
    ru: 'Просмотрите квартиры, дома и виллы для покупки и аренды. Фильтруйте по городу, цене и типу.',
    sq: 'Shikoni apartamente, shtëpi dhe vila për blerje dhe qira. Filtroni sipas qytetit, çmimit dhe llojit.',
    uk: 'Огляньте квартири, будинки та вілли для купівлі та оренди. Фільтруйте за містом, ціною та типом.',
  },
  sale: {
    en: 'Apartments, houses and villas for sale across Albania. Filter by city, price and type.',
    it: 'Appartamenti, case e ville in vendita in tutta l’Albania. Filtra per città, prezzo e tipo.',
    pl: 'Mieszkania, domy i wille na sprzedaż w całej Albanii. Filtruj według miasta, ceny i typu.',
    ru: 'Квартиры, дома и виллы на продажу по всей Албании. Фильтры по городу, цене и типу.',
    sq: 'Apartamente, shtëpi dhe vila në shitje në gjithë Shqipërinë. Filtroni sipas qytetit, çmimit dhe llojit.',
    uk: 'Квартири, будинки та вілли на продаж по всій Албанії. Фільтри за містом, ціною та типом.',
  },
}
