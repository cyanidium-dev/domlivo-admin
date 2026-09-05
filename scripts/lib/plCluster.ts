/**
 * SEO-04 — the Polish cluster: nine /pl/guides pages as data.
 * Spec: docs/engineering/SPEC-seo04-pl-cluster-2026-09-03.md (workspace).
 *
 * Every figure below is taken from the research knowledge base files the spec
 * names (01-macro/albania-macro.md, 02-cities/saranda-ksamil.md,
 * 05-legal/legal-guide.md, 07-buyers/buyers.md) and carries its source in
 * `sources`; nothing is typed from memory. Prices in tables come from
 * `zoneMetrics` at render time, never from this file.
 *
 * Polish copy: Claude, 2026-09-03 — pending native review.
 */
export type Para = {text: string; links?: Array<{phrase: string; href: string}>; style?: 'normal' | 'h2'}
export type Faq = {q: string; a: string}
export type Source = {label: string; url: string; publisher?: string; confidence: 'wysoka' | 'średnia' | 'niska'}
/** `zones` are zone document ids (city or district). */
export type PriceTable = {zones: string[]; title: string; subtitle: string}
/** `city` is a city document id. */
export type Carousel = {title: string; city?: string; deal?: 'sale'}
export type PlPage = {
  slug: string
  id: string
  h1: string
  lead: string
  metaTitle: string
  metaDescription: string
  tags: string[]
  body: Para[]
  priceTable?: PriceTable
  carousel?: Carousel
  faq: Faq[]
  sources: Source[]
}

export const CLUSTER_TAG = 'theme:pl-buyers'

export const CITY_IDS = {
  tirana: 'city-tirana',
  durres: 'city-durres',
  vlore: 'city-vlore',
  sarande: 'city-sarande',
  himare: 'city-himare',
  shengjin: 'city-shengjin',
  shkoder: 'city-shkoder',
} as const
/** Published Sarandë districts (verified 2026-09-03). */
export const SARANDE_DISTRICT_IDS = ['district-sarande-center', 'district-seafront-sarande', 'district-ksamil']

export const guide = (slug: string) => `/guides/${slug}`

// ---- Sources shared by several pages -------------------------------------
const SRC = {
  boa: {
    label: 'Bank Albanii — indeks cen mieszkań (Fischer HPI), II półrocze 2025',
    url: 'https://www.bankofalbania.org/',
    publisher: 'Bank of Albania',
    confidence: 'wysoka',
  },
  deloitte: {
    label: 'Deloitte Property Index 2025 — średnie ceny mieszkań w Europie',
    url: 'https://www.cdnimpuls.com/dosja.al/media3/1758710176x2025-property-index-399.pdf',
    publisher: 'Deloitte',
    confidence: 'wysoka',
  },
  monitorCoast: {
    label: 'Ceny mieszkań na wybrzeżu i popyt cudzoziemców — ankieta agencji',
    url: 'https://monitor.al/sa-i-ka-shtrenjtuar-cmimet-e-apartamenteve-ne-bregdet-kerkesa-nga-te-huajt-2/',
    publisher: 'Monitor.al',
    confidence: 'wysoka',
  },
  investropaDurres: {
    label: 'Ceny i prognozy dla Durrës, I półrocze 2026',
    url: 'https://investropa.com/blogs/news/durres-price-forecasts',
    publisher: 'Investropa',
    confidence: 'średnia',
  },
  globihomeVlora: {
    label: 'Rynek nieruchomości we Wlorze — przewodnik cenowy',
    url: 'https://globihome.com/en/blog/vlora-real-estate-guide',
    publisher: 'Globihome',
    confidence: 'średnia',
  },
  globihomeSaranda: {
    label: 'Rynek nieruchomości w Sarandzie — ceny i wynajem',
    url: 'https://globihome.com/en/blog/saranda-real-estate-market-2024',
    publisher: 'Globihome',
    confidence: 'średnia',
  },
  airroiSaranda: {
    label: 'Dane Airbnb dla Sarandy, 05.2025–04.2026',
    url: 'https://www.airroi.com/airbnb-data/albania/vlor%C3%AB-county/saranda',
    publisher: 'AirROI',
    confidence: 'średnia',
  },
  properstarSaranda: {
    label: 'Ceny mieszkań w Sarandzie — zestawienie ofert',
    url: 'https://www.properstar.com/albania/sarande/house-price',
    publisher: 'Properstar',
    confidence: 'średnia',
  },
  visitSarandaWinter: {
    label: 'Saranda zimą — sezonowość i najem długoterminowy',
    url: 'https://www.visitsaranda.net/how-to-find-an-apartment-for-long-term-rent-in-saranda/',
    publisher: 'Visit Saranda',
    confidence: 'średnia',
  },
  panoramaResorts: {
    label: 'Ceny apartamentów w resortach na wybrzeżu (do 4 500 €/m²)',
    url: 'https://www.panorama.com.al/deri-ne-4500-euro-metri-katror-zbulohen-cmimet-e-apartamenteve-dhe-resorteve-ne-bregdet-ja-zonat-me-te-shtrenjta/',
    publisher: 'Panorama',
    confidence: 'średnia',
  },
  sarandaReference: {
    label: 'Państwowe ceny referencyjne dla Sarandy, Ksamilu i okolic',
    url: 'https://sarandaweb.net/rriten-cmimet-e-references-edhe-per-fshatin-harta-e-cmimeve-ne-sarande-delvine-konispol-finiq-dhe-himare/',
    publisher: 'Sarandaweb',
    confidence: 'wysoka',
  },
  notaryTariff: {
    label: 'Taryfa notarialna przy sprzedaży nieruchomości (0,35 %)',
    url: 'https://monitor.al/ndryshon-udhezimi-per-tarifat-qe-paguhen-te-noteri-shtohen-sherbimet-e-reja-per-agjencine-e-kadastres/',
    publisher: 'Monitor.al',
    confidence: 'wysoka',
  },
  pwcTaxes: {
    label: 'Podatki od nieruchomości w Albanii — przegląd PwC',
    url: 'https://taxsummaries.pwc.com/albania/corporate/other-taxes',
    publisher: 'PwC',
    confidence: 'wysoka',
  },
  lukoveLand: {
    label: 'Działki i domy w rejonie Lukovë i Borsh — oferty',
    url: 'https://homezone.al/properties/sale/address-borsh-sarande',
    publisher: 'Homezone',
    confidence: 'średnia',
  },
  troja: {
    label: 'Ceny mieszkań w Tiranie według dzielnic, 2026',
    url: 'https://troja.al/sa-kushton-nje-apartament-ne-tirane-ne-2026-cmimet-e-verteta-lagje-per-lagje/',
    publisher: 'Troja.al',
    confidence: 'wysoka',
  },
} satisfies Record<string, Source>

const ALL_CITIES = Object.values(CITY_IDS) as string[]
const COAST_CITIES = [CITY_IDS.durres, CITY_IDS.vlore, CITY_IDS.sarande, CITY_IDS.himare, CITY_IDS.shengjin]

// ---- Pages ---------------------------------------------------------------
export const PAGES: PlPage[] = [
  // 1. hub
  {
    slug: 'nieruchomosci-w-albanii',
    id: 'landing-pl-nieruchomosci-w-albanii',
    h1: 'Nieruchomości w Albanii 2026: ceny, miasta i jak kupić',
    lead:
      'Średnia cena nowego mieszkania w Albanii to ok. 1 620 €/m² (Deloitte, 2025), w Tiranie ok. 2 000 €/m², a na wybrzeżu od 1 200 do 3 500 €/m² zależnie od linii morza. Ceny rosną, liczba transakcji spada — poniżej liczby, miasta i procedura zakupu dla obywatela Polski.',
    metaTitle: 'Nieruchomości w Albanii 2026 — ceny, miasta, zakup',
    metaDescription:
      'Ile kosztują nieruchomości w Albanii w 2026: ceny za m² w Tiranie, Durrës, Wlorze i Sarandzie, realny zwrot z wynajmu i procedura zakupu dla obywatela Polski.',
    tags: [CLUSTER_TAG, 'theme:albania-market', 'theme:buying'],
    body: [
      {
        text: 'Rynek nieruchomości w Albanii w 2026 roku jest rozdwojony. Według indeksu Banku Albanii ceny mieszkań w kraju wzrosły w drugiej połowie 2025 roku o 28 % rok do roku — jeden z najszybszych wzrostów w Europie — ale w samej Tiranie w tym samym półroczu stanęły w miejscu (0 % kwartał do kwartału). Wzrost ciągnie wybrzeże: Durrës, Wlora i Saranda. Jednocześnie liczba transakcji spadła w 2025 roku o ok. 35 %, a zapytania kupujących z zagranicy w Sarandzie zmalały drugi rok z rzędu. To klasyczny obraz późnej fazy cyklu: ceny wysokie, kupujący ostrożni, negocjacje możliwe.',
      },
      {text: 'Ile kosztuje metr kwadratowy', style: 'h2'},
      {
        text: 'Deloitte Property Index 2025 podaje średnią cenę nowego mieszkania w Albanii na poziomie 1 620 €/m². W Tiranie centrum kosztuje 2 500–5 500 €/m², półperyferia 1 500–2 500, a peryferia 800–1 500 €/m². W Durrës średnia to ok. 1 450 €/m², przy czym 80 % transakcji mieści się w przedziale 1 200–1 700, a pierwsza linia brzegowa przekracza 2 500. Wlora to 1 300–2 500 €/m² (od 550–750 na etapie wykopu). W Sarandzie centrum kosztuje 1 600–1 800, mieszkania z widokiem na morze 2 200–3 000, a pierwsza linia 3 000–3 500 €/m². Aktualną tabelę cen dla wszystkich miast znajdziesz poniżej; szczegóły dla najczęściej wybieranego przez Polaków miasta opisujemy na stronie o nieruchomościach w Sarandzie.',
        links: [{phrase: 'nieruchomościach w Sarandzie', href: guide('nieruchomosci-saranda')}],
      },
      {text: 'Kto kupuje i po co', style: 'h2'},
      {
        text: 'Cudzoziemcy odpowiadają za ok. 18 % transakcji, z czego 77 % to obywatele Unii Europejskiej. Polacy są dziś jednym z najaktywniejszych segmentów: celują w Sarandę, Ksamil i Durrës, z budżetem 70–150 tys. €, najczęściej pod wynajem krótkoterminowy połączony z własnymi wakacjami. Ważna korekta oczekiwań: reklamowane w Polsce „ROI 10–16 %” to wartości dla najlepszego kwartyla mieszkań z profesjonalnym zarządzaniem. Mediana oferty Airbnb w Sarandzie to ok. 6 960 $ rocznie przy obłożeniu 41 %, co dla mieszkania za 120 tys. € daje 4–6 % brutto przed kosztami. Uczciwy rachunek zysków i strat rozpisujemy w tekście czy warto kupić mieszkanie w Albanii.',
        links: [{phrase: 'czy warto kupić mieszkanie w Albanii', href: guide('czy-warto-kupic-mieszkanie-w-albanii')}],
      },
      {text: 'Jak wygląda zakup', style: 'h2'},
      {
        text: 'Obywatel Polski kupuje mieszkanie, dom lub lokal użytkowy w Albanii bez ograniczeń, na tych samych zasadach co Albańczyk; wyjątkiem jest ziemia rolna, dostępna tylko przez albańską spółkę lub dzierżawę do 99 lat. Umowa jest ważna wyłącznie w formie aktu notarialnego — umowa prywatna jest nieważna — a pieniądze przechodzą przez rachunek powierniczy notariusza. Rejestracja w katastrze ASHK trwa w praktyce 2–4 tygodnie, cały proces przy czystych dokumentach 4–8 tygodni, a koszty transakcyjne to ok. 3–4 % ceny. Procedurę krok po kroku opisujemy w przewodniku jak kupić mieszkanie w Albanii, a zasady dla cudzoziemców w tekście czy Polak może kupić mieszkanie w Albanii. Aktualne oferty sprzedaży ze wszystkich miast przegląda się w katalogu.',
        links: [
          {phrase: 'jak kupić mieszkanie w Albanii', href: guide('jak-kupic-mieszkanie-w-albanii')},
          {phrase: 'czy Polak może kupić mieszkanie w Albanii', href: guide('czy-polak-moze-kupic-mieszkanie-w-albanii')},
          {phrase: 'katalogu', href: '/sale'},
        ],
      },
    ],
    priceTable: {
      zones: ALL_CITIES,
      title: 'Ceny nieruchomości w miastach Albanii',
      subtitle: 'Nowe budownictwo, rynek wtórny i państwowa cena referencyjna — z bazy DomLivo, źródła pod tabelą.',
    },
    faq: [
      {
        q: 'Ile kosztuje mieszkanie w Albanii w 2026 roku?',
        a: 'Średnio ok. 1 620 €/m² według Deloitte za 2025 rok. W Tiranie centrum to 2 500–5 500 €/m², w Durrës średnia ok. 1 450 €/m², w Sarandzie centrum 1 600–1 800, a pierwsza linia brzegowa 3 000–3 500 €/m². Stare zasoby na wybrzeżu zaczynają się od ok. 600–1 000 €/m².',
      },
      {
        q: 'Czy ceny nieruchomości w Albanii jeszcze rosną?',
        a: 'W skali kraju tak: indeks Banku Albanii pokazał +28 % rok do roku w drugiej połowie 2025 roku, głównie dzięki wybrzeżu. Tirana w tym samym czasie stanęła w miejscu (0 % kwartał do kwartału), a liczba transakcji w kraju spadła o ok. 35 %. Rynek jest drogi, ale kupujący ma dziś siłę negocjacyjną.',
      },
      {
        q: 'Jaki jest realny zwrot z wynajmu w Albanii?',
        a: 'Dla przeciętnego mieszkania na wybrzeżu 4–6 % brutto rocznie przed podatkiem i kosztami zarządzania. Mediana oferty Airbnb w Sarandzie to ok. 6 960 $ rocznie przy obłożeniu 41 %. Reklamowane „10–16 %” dotyczą najlepszych mieszkań z profesjonalnym zarządzaniem i nie są punktem odniesienia dla typowego zakupu.',
      },
      {
        q: 'Czy obywatel Polski może kupić nieruchomość w Albanii?',
        a: 'Tak, mieszkania, domy i lokale użytkowe bez ograniczeń i na tych samych prawach co obywatele Albanii, łącznie z dziedziczeniem. Wyjątek to ziemia rolna, którą można nabyć tylko przez albańską spółkę (sh.p.k.) albo wydzierżawić na okres do 99 lat. Umowa musi mieć formę aktu notarialnego.',
      },
    ],
    sources: [SRC.boa, SRC.deloitte, SRC.monitorCoast, SRC.investropaDurres, SRC.globihomeSaranda, SRC.airroiSaranda],
  },

  // 2. coast
  {
    slug: 'nieruchomosci-nad-morzem-w-albanii',
    id: 'landing-pl-nieruchomosci-nad-morzem-w-albanii',
    h1: 'Nieruchomości nad morzem w Albanii na sprzedaż — ceny 2026',
    lead:
      'Mieszkanie nad morzem w Albanii kosztuje od ok. 1 200 €/m² w drugiej linii Durrës do 3 000–3 500 €/m² na pierwszej linii w Sarandzie (lato 2025). Poniżej: które wybrzeże wybrać, ile naprawdę kosztuje pierwsza linia i co dzieje się z wynajmem po sezonie.',
    metaTitle: 'Nieruchomości nad morzem w Albanii na sprzedaż — ceny 2026',
    metaDescription:
      'Ceny mieszkań nad morzem w Albanii w 2026: Durrës, Wlora, Saranda, Ksamil i Riwiera. Pierwsza linia kontra druga, sezonowość wynajmu i aktualne oferty.',
    tags: [CLUSTER_TAG, 'theme:coast', 'theme:albania-market'],
    body: [
      {
        text: 'Albańskie wybrzeże jest dziś motorem całego rynku: w drugiej połowie 2025 roku ceny mieszkań w kraju wzrosły o 28 % rok do roku, a wzrost ciągnęły Durrës, Wlora i Saranda, podczas gdy Tirana stanęła w miejscu. Kupujący z zagranicy — ok. 18 % transakcji — celują niemal wyłącznie w morze. W tym przewodniku pokazujemy realne przedziały cen na każdym odcinku wybrzeża i to, czego nie widać w ogłoszeniach: linię brzegową, etap budowy i zimę.',
      },
      {text: 'Które wybrzeże: Durrës, Wlora, Saranda czy Riwiera', style: 'h2'},
      {
        text: 'Durrës to najtańszy wjazd nad morze i największy rynek: średnio ok. 1 450 €/m², 80 % transakcji mieści się w przedziale 1 200–1 700 €/m², a pierwsza linia przekracza 2 500. Wlora, ulubione miasto Włochów, to 1 300–2 500 €/m², z ofertami od 550–750 €/m² na etapie wykopu. Saranda — najczęstszy wybór Polaków — kosztuje 1 600–1 800 €/m² w centrum, 2 200–3 000 z widokiem na morze i 3 000–3 500 na pierwszej linii. Ksamil bywa droższy od Sarandy (1 800–3 000 €/m²), choć mieszkanie zarabia tam mniej. Południe opisujemy szczegółowo na stronie o nieruchomościach w Sarandzie.',
        links: [{phrase: 'nieruchomościach w Sarandzie', href: guide('nieruchomosci-saranda')}],
      },
      {text: 'Pierwsza linia kontra druga', style: 'h2'},
      {
        text: 'Różnica między pierwszą a drugą linią to w Sarandzie ok. 1 000 €/m², a w Durrës ponad 800 €/m². Za tę premię kupuje się widok i czynsz w sezonie — ale też najwyższą cenę wejścia i najmniejszy margines negocjacji. Dla wynajmu krótkoterminowego liczy się odległość do plaży, nie adres: mieszkanie 300–500 m od morza wynajmuje się niemal tak samo, a kosztuje wyraźnie mniej. Jeśli budżet ma znaczenie, tańsze opcje zebraliśmy w tekście o tanich mieszkaniach w Albanii.',
        links: [{phrase: 'tanich mieszkaniach w Albanii', href: guide('tanie-mieszkania-w-albanii')}],
      },
      {text: 'Sezon i zima', style: 'h2'},
      {
        text: 'Wybrzeże żyje od maja do września. Saranda jest jedynym miastem południa, które nie wyludnia się zimą (ok. 35–40 tys. mieszkańców), Ksamil praktycznie pustoszeje, a najem długoterminowy poza sezonem to 250–400 € miesięcznie za standardowe mieszkanie. Realny zwrot z wynajmu przeciętnego mieszkania nad morzem to 4–6 % brutto rocznie, nie reklamowane 10–16 %. Aktualne oferty nad morzem przeglądasz w katalogu sprzedaży.',
        links: [{phrase: 'katalogu sprzedaży', href: '/sale'}],
      },
    ],
    priceTable: {
      zones: COAST_CITIES,
      title: 'Ceny w miastach nad morzem',
      subtitle: 'Durrës, Wlora, Saranda, Himara i Shëngjin — nowe budownictwo, rynek wtórny i cena referencyjna.',
    },
    carousel: {title: 'Aktualne oferty nad morzem', deal: 'sale'},
    faq: [
      {
        q: 'Ile kosztuje mieszkanie nad morzem w Albanii?',
        a: 'Od ok. 1 200 €/m² w drugiej linii Durrës do 3 000–3 500 €/m² na pierwszej linii w Sarandzie. Średnia w Durrës to ok. 1 450 €/m², we Wlorze 1 300–2 500, w Sarandzie z widokiem na morze 2 200–3 000 €/m². Apartamenty w resortach dochodzą do 4 000 €/m².',
      },
      {
        q: 'Które miasto nad morzem wybrać w Albanii?',
        a: 'Durrës — najtańsze wejście i największy rynek, 40 minut od Tirany. Wlora — szybko rosnące ceny i włoski klimat. Saranda — najlepiej udokumentowany wynajem krótkoterminowy i jedyne miasto południa żywe zimą. Ksamil — najpiękniejsze plaże, ale wyższe ceny niż w Sarandzie przy niższych przychodach z wynajmu.',
      },
      {
        q: 'Czy mieszkanie nad morzem da się wynająć zimą?',
        a: 'W Sarandzie tak, ale za 250–400 € miesięcznie w najmie długoterminowym, zwykle od października do maja. Ksamil i mniejsze kurorty praktycznie pustoszeją poza sezonem. Dlatego realny roczny zwrot z przeciętnego mieszkania nad morzem to 4–6 % brutto, a nie wartości reklamowane w ofertach.',
      },
    ],
    sources: [SRC.boa, SRC.monitorCoast, SRC.investropaDurres, SRC.globihomeVlora, SRC.properstarSaranda, SRC.visitSarandaWinter, SRC.airroiSaranda],
  },

  // 3. apartments
  {
    slug: 'mieszkania-w-albanii',
    id: 'landing-pl-mieszkania-w-albanii',
    h1: 'Mieszkania i apartamenty w Albanii na sprzedaż — ceny 2026',
    lead:
      'Nowe mieszkanie w Albanii kosztuje średnio 1 620 €/m² (Deloitte, 2025), stare budownictwo na wybrzeżu od 600–1 000 €/m², a apartamenty premium w centrum Tirany i na pierwszej linii morza 3 000–5 500 €/m². Poniżej: typy mieszkań, nowe kontra stare budownictwo i dokumenty, o które trzeba poprosić przed zapłatą.',
    metaTitle: 'Mieszkania w Albanii na sprzedaż — ceny i typy 2026',
    metaDescription:
      'Ceny mieszkań w Albanii w 2026: nowe budownictwo, rynek wtórny i apartamenty premium w Tiranie, Durrës, Wlorze i Sarandzie, plus dokumenty do sprawdzenia.',
    tags: [CLUSTER_TAG, 'theme:apartments', 'theme:buying'],
    body: [
      {
        text: 'Rozpiętość cen mieszkań w Albanii jest większa niż w większości krajów Europy. W Tiranie ten sam metr kwadratowy kosztuje 800 € na peryferiach i 5 500 € w centrum, a przeciętne mieszkanie w stolicy to równowartość 19 rocznych pensji brutto — najgorsza dostępność w Europie. Na wybrzeżu różnicę robi linia morza i etap budowy: od 550–750 €/m² za lokal na etapie wykopu we Wlorze do 3 000–3 500 €/m² na pierwszej linii w Sarandzie. Średnia krajowa według Deloitte to 1 620 €/m².',
      },
      {text: 'Nowe budownictwo czy rynek wtórny', style: 'h2'},
      {
        text: 'Nowe budownictwo dominuje w ofercie i w cenie: w Sarandzie lokale do 1 km od morza kosztują 2 000–2 500 €/m², a same nowe mieszkania podrożały tam o ok. 41 % między 2023 a 2024 rokiem. Rynek wtórny to inna liga — stare zasoby na wybrzeżu za 600–1 000 €/m², ale często w blokach sprzed 1990 roku, bez windy i z niepewną dokumentacją. Osobna kategoria to zakup z wykopu: najtańszy metr, ale od 2024 roku umowa rezerwacyjna z deweloperem (kontrata e porosisë) ma moc tylko w formie notarialnej i po zarejestrowaniu w katastrze ASHK. Zadatek to zwykle 5–10 %, przy nowych inwestycjach do 30 %, a kwestię VAT („me TVSH apo pa TVSH”) warto mieć na piśmie. Pełną procedurę opisujemy w przewodniku jak kupić mieszkanie w Albanii, a ceny domów i działek w tekście ile kosztuje dom w Albanii.',
        links: [
          {phrase: 'jak kupić mieszkanie w Albanii', href: guide('jak-kupic-mieszkanie-w-albanii')},
          {phrase: 'ile kosztuje dom w Albanii', href: guide('ile-kosztuje-dom-w-albanii')},
        ],
      },
      {text: 'Co sprawdzić przed zakupem', style: 'h2'},
      {
        text: 'Trzy dokumenty decydują o bezpieczeństwie: wyciąg z katastru (kartela e pasurisë), który pobiera się samodzielnie z ASHK, a nie od sprzedającego; wykaz obciążeń hipotecznych, w przypadku nowych budynków sprawdzany na działce macierzystej; oraz pozwolenie na użytkowanie (leje përdorimi) dla budynków ukończonych — bez niego lokalu nie da się poprawnie zarejestrować ani odsprzedać. Prawnik nie jest wymagany ustawą, ale przy zakupie przez cudzoziemca to 500–2 000 € dobrze wydane; tłumacz przysięgły jest obowiązkowy. Koszty transakcyjne to ok. 3–4 % ceny. Aktualne mieszkania na sprzedaż przeglądasz w katalogu, a oferty z Sarandy na osobnej liście.',
        links: [
          {phrase: 'katalogu', href: '/sale'},
          {phrase: 'osobnej liście', href: '/albania/sarande/sale'},
        ],
      },
    ],
    priceTable: {
      zones: ALL_CITIES,
      title: 'Ceny mieszkań w miastach Albanii',
      subtitle: 'Nowe budownictwo, rynek wtórny i cena referencyjna państwa — z bazy DomLivo.',
    },
    carousel: {title: 'Mieszkania na sprzedaż', deal: 'sale'},
    faq: [
      {
        q: 'Ile kosztuje mieszkanie w Albanii?',
        a: 'Średnio 1 620 €/m² za nowe mieszkanie (Deloitte, 2025). Najtaniej jest w starym budownictwie na wybrzeżu, 600–1 000 €/m², i na peryferiach Tirany, 800–1 500 €/m². Najdrożej w centrum Tirany, 2 500–5 500 €/m², i na pierwszej linii w Sarandzie, 3 000–3 500 €/m².',
      },
      {
        q: 'Nowe czy stare mieszkanie w Albanii?',
        a: 'Nowe budownictwo kosztuje więcej, ale ma czytelną dokumentację i pozwolenie na użytkowanie; w Sarandzie nowe lokale podrożały o 41 % w rok. Stare zasoby są tańsze o połowę, lecz często sprzed 1990 roku i z niepewnym tytułem. Zakup z wykopu wymaga umowy notarialnej zarejestrowanej w ASHK — inaczej nie ma mocy prawnej.',
      },
      {
        q: 'Jakie dokumenty sprawdzić przed zakupem mieszkania w Albanii?',
        a: 'Wyciąg z katastru (kartela e pasurisë) pobrany samodzielnie z ASHK, wykaz obciążeń hipotecznych — przy nowych budynkach na działce macierzystej — i pozwolenie na użytkowanie (leje përdorimi) dla ukończonych budynków. Przy zakupie z wykopu: umowę z deweloperem w formie notarialnej i zarejestrowaną w katastrze. Prawnik kosztuje 500–2 000 €.',
      },
    ],
    sources: [SRC.deloitte, SRC.troja, SRC.monitorCoast, SRC.globihomeVlora, SRC.notaryTariff, SRC.pwcTaxes],
  },

  // 4. Sarandë
  {
    slug: 'nieruchomosci-saranda',
    id: 'landing-pl-nieruchomosci-saranda',
    h1: 'Nieruchomości w Sarandzie 2026: ceny, wynajem i na co uważać',
    lead:
      'Mieszkanie w Sarandzie kosztuje 1 600–1 800 €/m² w centrum, 2 200–3 000 z widokiem na morze i 3 000–3 500 €/m² na pierwszej linii (lato 2025). Mediana oferty Airbnb zarabia ok. 6 960 $ rocznie, czyli 4–6 % brutto od ceny mieszkania — poniżej pełny obraz, łącznie z tym, czego nie mówią pośrednicy.',
    metaTitle: 'Nieruchomości Saranda 2026 — ceny, wynajem, ryzyka',
    metaDescription:
      'Nieruchomości w Sarandzie w 2026: ceny za m² według linii morza, realne przychody z Airbnb, porównanie z Ksamilem, zima i ryzyka prawne. Dane z bazy DomLivo.',
    tags: [CLUSTER_TAG, 'city:sarande', 'theme:coast'],
    body: [
      {
        text: 'Saranda to miasto, na które polscy kupujący patrzą najczęściej: bliżej stąd na Korfu niż do Tirany, sezon trwa od maja do października, a miasto — w odróżnieniu od Ksamilu — nie wyludnia się zimą (ok. 35–40 tys. mieszkańców, latem trzy-cztery razy więcej). Ceny rosły szybko: centrum kosztowało 1 200 €/m² w latach 2022–23, dziś 1 600–1 800; pierwsza linia już w 2019 roku sięgała 2 000–3 000 €/m². Państwowa cena referencyjna dla miasta to ok. 1 020 €/m², czyli mniej więcej połowa ceny rynkowej — od tej wartości nalicza się część podatków i opłat.',
      },
      {text: 'Ceny w Sarandzie w 2026 roku', style: 'h2'},
      {
        text: 'Nowe budownictwo do 1 km od morza: 2 000–2 500 €/m². Pierwsza linia: 3 000–3 500 €/m². Apartamenty w resortach: do 4 000 €/m². Centrum „pod klucz”: 1 600–1 800 €/m² (od 1 400). Typowe mieszkanie z widokiem na morze: 2 200–3 000 €/m². Stare zasoby: 600–1 000 €/m², ale z zastrzeżeniami co do stanu i dokumentów. Nowe mieszkania podrożały o ok. 41 % między 2023 a 2024 rokiem. Aktualną tabelę cen dla Sarandy i jej dzielnic znajdziesz poniżej, oferty sprzedaży w mieście na osobnej liście, a ogólny profil miasta na stronie Sarandy.',
        links: [
          {phrase: 'osobnej liście', href: '/albania/sarande/sale'},
          {phrase: 'stronie Sarandy', href: '/albania/sarande/info'},
        ],
      },
      {text: 'Ile naprawdę zarabia mieszkanie na wynajem', style: 'h2'},
      {
        text: 'W Sarandzie działa ok. 430 ofert Airbnb. Mediana zarabia ok. 6 960 $ rocznie przy obłożeniu 40,9 % i średniej stawce 94 $ za noc (mediana 68 $; najlepsze 10 % ofert powyżej 150 $). W szczycie sezonu, w lipcu i sierpniu, kawalerka kosztuje 45–65 € za noc, mieszkanie 1+1 65–85 €, z widokiem na morze 85–150 €. Zimą najem długoterminowy to 250–400 € miesięcznie. Dla mieszkania kupionego za 120 tys. € daje to 5–6 % brutto przed podatkiem 15 % od najmu krótkoterminowego i prowizją zarządcy 20–25 %. Reklamowane „ROI 10–16 %” dotyczą najlepszego kwartyla z profesjonalnym zarządzaniem. Pełny rachunek rozpisujemy w tekście czy warto kupić mieszkanie w Albanii.',
        links: [{phrase: 'czy warto kupić mieszkanie w Albanii', href: guide('czy-warto-kupic-mieszkanie-w-albanii')}],
      },
      {text: 'Saranda czy Ksamil', style: 'h2'},
      {
        text: 'Ksamil kosztuje więcej za metr (1 800–3 000 €/m²), a mieszkanie zarabia tam mniej: mediana oferty to ok. 5 495 $ rocznie przy obłożeniu 38 %. Liczba ofert Airbnb w Ksamilu wzrosła o 86 % w rok — najczytelniejszy sygnał nadpodaży na całym wybrzeżu. Do tego dochodzi ryzyko prawne numer jeden na południu: samowole budowlane, rozbiórki i strefa buforowa UNESCO wokół Butrintu. Saranda ma szpital, szkoły, port i całoroczne życie; Ksamil ma plaże. Inne miasta wybrzeża porównujemy na stronie o nieruchomościach nad morzem w Albanii.',
        links: [{phrase: 'nieruchomościach nad morzem w Albanii', href: guide('nieruchomosci-nad-morzem-w-albanii')}],
      },
      {text: 'Na co uważać', style: 'h2'},
      {
        text: 'Zapytania kupujących z zagranicy spadły w Sarandzie o 50 % w 2024 roku i o kolejne 30 % w 2025, podczas gdy ceny dalej rosły; agencje przyznają, że transakcje finalizują się gorzej. To argument za twardą negocjacją, nie za pośpiechem. Drugi punkt to pieniądze: w Albanii nie ma kultury depozytu u pośrednika, więc zadatek i cena powinny iść wyłącznie przez rachunek powierniczy notariusza. Trzeci to dokumenty — wyciąg z katastru pobrany samodzielnie i pozwolenie na użytkowanie; procedurę opisujemy w przewodniku jak kupić mieszkanie w Albanii.',
        links: [{phrase: 'jak kupić mieszkanie w Albanii', href: guide('jak-kupic-mieszkanie-w-albanii')}],
      },
    ],
    priceTable: {
      zones: [CITY_IDS.sarande, ...SARANDE_DISTRICT_IDS],
      title: 'Ceny w Sarandzie i jej dzielnicach',
      subtitle: 'Miasto, centrum, nabrzeże i Ksamil — nowe budownictwo, rynek wtórny i cena referencyjna.',
    },
    carousel: {title: 'Oferty sprzedaży w Sarandzie', city: CITY_IDS.sarande, deal: 'sale'},
    faq: [
      {
        q: 'Ile kosztuje mieszkanie w Sarandzie w 2026 roku?',
        a: 'W centrum 1 600–1 800 €/m² za mieszkanie pod klucz, z widokiem na morze 2 200–3 000 €/m², na pierwszej linii 3 000–3 500 €/m², w resortach do 4 000 €/m². Stare zasoby zaczynają się od 600–1 000 €/m². Nowe budownictwo podrożało o ok. 41 % między 2023 a 2024 rokiem.',
      },
      {
        q: 'Saranda czy Ksamil — gdzie lepiej kupić?',
        a: 'Do wynajmu i na własny użytek zwykle Saranda: mieszkanie zarabia więcej (mediana ok. 6 960 $ rocznie wobec ok. 5 495 $ w Ksamilu), a miasto żyje cały rok. Ksamil jest droższy za metr, wyludnia się zimą, liczba ofert Airbnb wzrosła tam o 86 % w rok i istnieje ryzyko samowoli budowlanych w strefie UNESCO.',
      },
      {
        q: 'Ile zarabia mieszkanie na Airbnb w Sarandzie?',
        a: 'Mediana oferty to ok. 6 960 $ rocznie przy obłożeniu 40,9 % i średniej stawce 94 $ za noc. W lipcu i sierpniu kawalerka kosztuje 45–65 € za noc, mieszkanie 1+1 65–85 €, z widokiem na morze 85–150 €. Dla mieszkania za 120 tys. € to 5–6 % brutto przed podatkiem 15 % i kosztami zarządzania.',
      },
      {
        q: 'Czy Saranda żyje zimą?',
        a: 'Tak, jako jedyne miasto południa. Zimą mieszka tu ok. 35–40 tys. osób, latem trzy-cztery razy więcej; działa port, szpital i szkoły. Promenada zamyka się we wrześniu lub październiku, a większość mieszkań wakacyjnych stoi pusta. Najem długoterminowy zimą to 250–400 € miesięcznie, zwykle od października do maja.',
      },
    ],
    sources: [SRC.monitorCoast, SRC.globihomeSaranda, SRC.airroiSaranda, SRC.panoramaResorts, SRC.sarandaReference, SRC.visitSarandaWinter, SRC.properstarSaranda],
  },

  // 5. cheap
  {
    slug: 'tanie-mieszkania-w-albanii',
    id: 'landing-pl-tanie-mieszkania-w-albanii',
    h1: 'Tanie mieszkania w Albanii 2026: gdzie naprawdę są i ile kosztują',
    lead:
      'Najtańsze mieszkania w Albanii to stare budownictwo na wybrzeżu za 600–1 000 €/m², peryferie Tirany za 800–1 500 €/m² i lokale na etapie wykopu we Wlorze od 550–750 €/m². „Tanio” zwykle znaczy: daleko od morza, stary blok albo ryzyko budowy — poniżej tłumaczymy, które z tych „tanio” ma sens.',
    metaTitle: 'Tanie mieszkania w Albanii 2026 — gdzie i za ile',
    metaDescription:
      'Gdzie w Albanii kupić tanie mieszkanie w 2026: stare budownictwo od 600 €/m², peryferie Tirany, Durrës do 100 tys. € i oferty z wykopu. Okazja czy pułapka?',
    tags: [CLUSTER_TAG, 'theme:budget', 'theme:apartments'],
    body: [
      {
        text: 'Albania wciąż jest jednym z najtańszych rynków w Europie, ale dwie liczby psują prosty obraz: średnia cena nowego mieszkania to już 1 620 €/m² (Deloitte, 2025), a ceny w kraju rosły w drugiej połowie 2025 roku o 28 % rok do roku. Tanie mieszkanie w 2026 roku to więc nie „każde mieszkanie w Albanii”, tylko konkretne segmenty: stare zasoby, peryferie, druga i trzecia linia od morza oraz lokale na wczesnym etapie budowy. Każdy z nich ma inną cenę i inne ryzyko.',
      },
      {text: 'Gdzie naprawdę jest tanio', style: 'h2'},
      {
        text: 'Na wybrzeżu najtańsze jest stare budownictwo: 600–1 000 €/m² za mieszkania w blokach sprzed 1990 roku, głównie w Durrës, Wlorze i Sarandzie. W Tiranie peryferia — Kombinat, Kamëz, Paskuqan — kosztują 800–1 500 €/m², dwa-trzy razy mniej niż centrum. W Durrës 80 % transakcji mieści się w przedziale 1 200–1 700 €/m², więc mieszkanie 50 m² w drugiej linii kupuje się za 60–85 tys. €. Najtańszy metr w ogóle to Wlora na etapie wykopu: 550–750 €/m² — z całym ryzykiem zakupu z planu. Przegląd wszystkich typów mieszkań i cen znajdziesz na stronie o mieszkaniach w Albanii, a oferty do 100 tys. € w katalogu z filtrem ceny.',
        links: [
          {phrase: 'mieszkaniach w Albanii', href: guide('mieszkania-w-albanii')},
          {phrase: 'katalogu z filtrem ceny', href: '/sale?maxPrice=100000'},
        ],
      },
      {text: 'Dlaczego jest tanio', style: 'h2'},
      {
        text: 'Cena metra w Albanii zależy od trzech rzeczy: etapu budowy, linii od morza i wieku budynku. Lokal z wykopu jest tańszy o 30–50 % od ukończonego, druga linia o 800–1 000 €/m² od pierwszej, a blok sprzed 1990 roku o połowę od nowego. Czwarty czynnik to moment rynku: liczba transakcji spadła w 2025 roku o 35 %, Tirana stanęła w miejscu, a zapytania cudzoziemców w Sarandzie maleją drugi rok — sprzedający, którzy muszą sprzedać, negocjują. To nie jest to samo co „tania Albania” sprzed pięciu lat, ale jest to rynek kupującego w drogim otoczeniu.',
      },
      {text: 'Czego nie kupować, nawet jeśli jest tanio', style: 'h2'},
      {
        text: 'Trzy pułapki powtarzają się w każdym roku. Pierwsza: lokal z wykopu na podstawie umowy prywatnej — od 2024 roku umowa z deweloperem ma moc tylko w formie notarialnej i po rejestracji w katastrze ASHK. Druga: tanie mieszkanie w Ksamilu bez pozwolenia na użytkowanie — na południu samowole budowlane i rozbiórki w strefie buforowej UNESCO są ryzykiem prawnym numer jeden. Trzecia: każde mieszkanie, którego sprzedający nie pozwala sprawdzić w katastrze — wyciąg pobiera się samodzielnie, a bez niego nie przelewa się pieniędzy. Realia południa opisujemy na stronie o nieruchomościach w Sarandzie.',
        links: [{phrase: 'nieruchomościach w Sarandzie', href: guide('nieruchomosci-saranda')}],
      },
    ],
    priceTable: {
      zones: [CITY_IDS.durres, CITY_IDS.vlore, CITY_IDS.sarande, CITY_IDS.shkoder, CITY_IDS.shengjin],
      title: 'Ceny w tańszych miastach Albanii',
      subtitle: 'Durrës, Wlora, Saranda, Szkodra i Shëngjin — nowe budownictwo, rynek wtórny i cena referencyjna.',
    },
    carousel: {title: 'Oferty sprzedaży', deal: 'sale'},
    faq: [
      {
        q: 'Ile kosztuje najtańsze mieszkanie w Albanii?',
        a: 'Stare budownictwo na wybrzeżu zaczyna się od 600–1 000 €/m², peryferie Tirany od 800 €/m², a lokale z wykopu we Wlorze od 550–750 €/m². Mieszkanie 50 m² w drugiej linii w Durrës kupuje się za 60–85 tys. €. Poniżej tych poziomów zwykle kryje się problem z dokumentami albo stanem budynku.',
      },
      {
        q: 'Czy tanie mieszkania w Albanii są bezpieczne?',
        a: 'Tak, jeśli cena wynika z lokalizacji, wieku budynku lub etapu budowy, a nie z braku dokumentów. Zawsze pobierz samodzielnie wyciąg z katastru ASHK, sprawdź pozwolenie na użytkowanie i przelewaj pieniądze wyłącznie przez rachunek powierniczy notariusza. Umowa z deweloperem musi być notarialna i zarejestrowana.',
      },
      {
        q: 'Gdzie szukać tanich mieszkań w Albanii?',
        a: 'W Durrës w drugiej i trzeciej linii od morza, na peryferiach Tirany (Kombinat, Kamëz, Paskuqan), w starym budownictwie Wlory i Sarandy oraz w nowych inwestycjach na wczesnym etapie budowy. Katalog DomLivo pozwala filtrować oferty według ceny maksymalnej, a każda oferta pokazuje pozycję ceny na tle dzielnicy.',
      },
    ],
    sources: [SRC.deloitte, SRC.boa, SRC.troja, SRC.investropaDurres, SRC.globihomeVlora, SRC.monitorCoast],
  },

  // 6. house price
  {
    slug: 'ile-kosztuje-dom-w-albanii',
    id: 'landing-pl-ile-kosztuje-dom-w-albanii',
    h1: 'Ile kosztuje dom w Albanii w 2026 roku?',
    lead:
      'Dom w Albanii wycenia się jak ziemia plus metry: ceny za m² to 800–1 500 € na peryferiach Tirany, ok. 1 450 € w Durrës i 1 600–1 800 € w centrum Sarandy, a do ceny trzeba doliczyć 3–4 % kosztów transakcyjnych. Działka na Riwierze kosztuje 150–350 €/m². Oficjalnego indeksu cen domów Albania nie publikuje — poniżej pokazujemy, jak liczyć.',
    metaTitle: 'Ile kosztuje dom w Albanii w 2026? Ceny i koszty',
    metaDescription:
      'Ile kosztuje dom w Albanii w 2026: ceny za m² w miastach i nad morzem, działki na Riwierze, koszty notariusza i katastru oraz zakup ziemi przez cudzoziemca.',
    tags: [CLUSTER_TAG, 'theme:houses', 'theme:prices'],
    body: [
      {
        text: 'Albania nie ma osobnego indeksu cen domów — Bank Albanii i Deloitte liczą ceny mieszkań, a domy wycenia się przez cenę metra w danej miejscowości i wartość ziemi. Praktyczna zasada: dom w mieście kosztuje tyle, co mieszkanie w tej samej strefie razy metraż, plus premia za działkę. W Tiranie oznacza to 800–1 500 €/m² na peryferiach i 1 500–2 500 €/m² na półperyferiach, w Durrës średnio ok. 1 450 €/m², w Sarandzie 1 600–1 800 €/m² w centrum. Domy z widokiem na morze i wille na pierwszej linii wyceniane są indywidualnie i sięgają poziomów apartamentów w resortach, do 4 000 €/m².',
      },
      {text: 'Dom, działka czy dom w budowie', style: 'h2'},
      {
        text: 'Najczytelniejsze dane o ziemi pochodzą z południa: w rejonie Lukovë i Borsh na Riwierze działka 650 m² oferowana jest po ok. 150 €/m², działka 670 m² na pierwszej linii po ok. 350 €/m², a działka 1 000 m² z pełną dokumentacją hipoteczną w Borsh za ok. 200 tys. €. Dom w stanie surowym (72 m² na działce 220 m²) w Piqeras wyceniano na ok. 150 tys. €. To rynek wczesny — ofert jest kilkanaście, nie setki — i wyceny są mniej pewne niż ceny mieszkań. Kupując dom w budowie, obowiązuje ta sama zasada co przy mieszkaniach: umowa z wykonawcą w formie notarialnej i zarejestrowana w katastrze, opisana w przewodniku jak kupić mieszkanie w Albanii.',
        links: [{phrase: 'jak kupić mieszkanie w Albanii', href: guide('jak-kupic-mieszkanie-w-albanii')}],
      },
      {text: 'Koszty poza ceną domu', style: 'h2'},
      {
        text: 'Do ceny dolicz 3–4 %: taryfa notarialna 0,35 % ceny (minimum 3 000 lek, a jeśli cena w umowie jest niższa od państwowej ceny referencyjnej, taryfę liczy się od referencji) plus 1 000 lek opłaty notarialnej; rejestracja w katastrze ASHK 5 000 lek; podatek od przeniesienia własności 2 % w Tiranie i Durrës, niżej w innych gminach — w praktyce wliczany w cenę; prowizja pośrednika zwyczajowo 1 % po stronie kupującego. Tłumacz przysięgły jest obowiązkowy dla kupującego bez znajomości albańskiego (50–150 €), a prawnik do sprawdzenia tytułu kosztuje 500–2 000 €. Roczny podatek od nieruchomości to 0,05 % wartości fiskalnej.',
      },
      {text: 'Ziemia pod dom dla cudzoziemca', style: 'h2'},
      {
        text: 'Dom z działką budowlaną obywatel Polski kupuje bez ograniczeń. Ziemi rolnej cudzoziemiec nie kupi bezpośrednio: rozwiązaniem jest albańska spółka sh.p.k. (w 100 % zagraniczna jest traktowana jak podmiot albański; rejestracja 10–14 dni, 500–1 500 €) albo dzierżawa do 99 lat. Historyczny warunek dla działek niezabudowanych — inwestycja trzykrotnej wartości ziemi — w praktyce omija się przez spółkę. Szczegóły dla kupujących z Polski zebraliśmy w tekście czy Polak może kupić mieszkanie w Albanii, a aktualne domy i działki na sprzedaż przeglądasz w katalogu.',
        links: [
          {phrase: 'czy Polak może kupić mieszkanie w Albanii', href: guide('czy-polak-moze-kupic-mieszkanie-w-albanii')},
          {phrase: 'katalogu', href: '/sale'},
        ],
      },
    ],
    priceTable: {
      zones: ALL_CITIES,
      title: 'Ceny za m² w miastach Albanii',
      subtitle: 'Punkt wyjścia do wyceny domu: nowe budownictwo, rynek wtórny i cena referencyjna państwa.',
    },
    faq: [
      {
        q: 'Ile kosztuje dom w Albanii?',
        a: 'Albania nie publikuje indeksu cen domów; dom wycenia się przez cenę metra w danej strefie plus wartość działki. Orientacyjnie: peryferia Tirany 800–1 500 €/m², Durrës ok. 1 450 €/m², centrum Sarandy 1 600–1 800 €/m². Dom w stanie surowym na Riwierze oferowano za ok. 150 tys. €, działki tam kosztują 150–350 €/m².',
      },
      {
        q: 'Jakie koszty dodatkowe przy zakupie domu w Albanii?',
        a: 'Około 3–4 % ceny: notariusz 0,35 % plus 1 000 lek, rejestracja w katastrze ASHK 5 000 lek, podatek od przeniesienia własności 2 % (w praktyce w cenie), prowizja pośrednika ok. 1 %, tłumacz przysięgły 50–150 € i opcjonalnie prawnik 500–2 000 €. Roczny podatek od nieruchomości wynosi 0,05 % wartości fiskalnej.',
      },
      {
        q: 'Czy Polak może kupić działkę w Albanii?',
        a: 'Działkę budowlaną z domem tak, bez ograniczeń. Ziemi rolnej cudzoziemiec nie kupi bezpośrednio — potrzebna jest albańska spółka sh.p.k., która nawet w 100 % zagraniczna jest traktowana jak podmiot albański (rejestracja 10–14 dni, 500–1 500 €), albo dzierżawa na okres do 99 lat.',
      },
    ],
    sources: [SRC.troja, SRC.investropaDurres, SRC.monitorCoast, SRC.lukoveLand, SRC.notaryTariff, SRC.pwcTaxes],
  },

  // 7. how to buy
  {
    slug: 'jak-kupic-mieszkanie-w-albanii',
    id: 'landing-pl-jak-kupic-mieszkanie-w-albanii',
    h1: 'Jak kupić mieszkanie w Albanii w 2026 roku: krok po kroku',
    lead:
      'Zakup mieszkania w Albanii to pięć kroków: rezerwacja z zadatkiem 5–10 %, sprawdzenie tytułu w katastrze ASHK, umowa przedwstępna, akt notarialny z pieniędzmi na rachunku powierniczym notariusza i rejestracja nowego wyciągu. Przy czystych dokumentach całość trwa 4–8 tygodni i kosztuje ok. 3–4 % ceny. Umowa prywatna nie ma mocy prawnej.',
    metaTitle: 'Jak kupić mieszkanie w Albanii — krok po kroku 2026',
    metaDescription:
      'Jak kupić mieszkanie w Albanii w 2026: pięć kroków od zadatku do wpisu w katastrze ASHK, dokumenty do sprawdzenia, koszty i terminy. Bez umów prywatnych.',
    tags: [CLUSTER_TAG, 'theme:buying', 'theme:legal'],
    body: [
      {
        text: 'Procedura zakupu w Albanii jest krótsza niż w Polsce, ale ma jedną cechę, która zaskakuje kupujących: nie ma tu kultury depozytu u pośrednika ani ksiąg wieczystych dostępnych online dla każdego. Bezpieczeństwo zapewniają dwie instytucje — notariusz, przez którego rachunek powierniczy przechodzą pieniądze, oraz kataster ASHK, z którego kupujący sam pobiera wyciąg o nieruchomości. Kto trzyma się tych dwóch zasad, przechodzi przez proces w 4–8 tygodni; kto podpisuje umowy prywatne i płaci gotówką, ryzykuje wszystko.',
      },
      {text: 'Pięć kroków zakupu', style: 'h2'},
      {
        text: 'Krok 1, rezerwacja: zadatek (kaparë) 5–10 % ceny, przy nowych inwestycjach do 30 %. Krok 2, weryfikacja (1–2 tygodnie): wyciąg z katastru, wykaz obciążeń, mapa ewidencyjna (harta treguese) i historia tytułu; prawnik kosztuje 500–2 000 €. Krok 3, umowa przedwstępna: dla nowych mieszkań umowa z deweloperem (kontrata e porosisë) wyłącznie w formie notarialnej i zarejestrowana w ASHK — tak stanowi instrukcja 1/2024. Krok 4, akt notarialny (1 dzień): jedyna ważna forma sprzedaży; pieniądze idą na rachunek powierniczy notariusza, który potrąca należne podatki; taryfa ok. 0,35 % ceny. Krok 5, rejestracja w ASHK: przez notariusza, bez wizyty kupującego, oficjalnie 21 dni, w praktyce 2–4 tygodnie, opłata 5 000 lek. Zasady dla cudzoziemców opisujemy w tekście czy Polak może kupić mieszkanie w Albanii.',
        links: [{phrase: 'czy Polak może kupić mieszkanie w Albanii', href: guide('czy-polak-moze-kupic-mieszkanie-w-albanii')}],
      },
      {text: 'Dokumenty, o które prosisz', style: 'h2'},
      {
        text: 'Kartela e pasurisë — wyciąg z katastru, który pokazuje właściciela, obciążenia i historię nieruchomości; pobierz go samodzielnie w ASHK, nie od sprzedającego, bo to właśnie kopie od sprzedającego bywają nieaktualne. Wykaz hipotek — przy nowych budynkach na działce macierzystej, bo hipoteka dewelopera na gruncie przechodzi na każde mieszkanie. Leje përdorimi — pozwolenie na użytkowanie; ukończony budynek bez niego nie da się poprawnie zarejestrować, obciążyć kredytem ani odsprzedać. Dla kupującego bez znajomości albańskiego obowiązkowy jest tłumacz przysięgły Ministerstwa Sprawiedliwości, który współpodpisuje akt (50–150 €). Koszty zakupu w całości rozpisujemy w tekście ile kosztuje dom w Albanii.',
        links: [{phrase: 'ile kosztuje dom w Albanii', href: guide('ile-kosztuje-dom-w-albanii')}],
      },
      {text: 'Pieniądze, konto i podatki', style: 'h2'},
      {
        text: 'Konto bankowe w Albanii można otworzyć (1–4 tygodnie, rygorystyczna weryfikacja źródła środków), ale do zakupu nie jest potrzebne: przelew SWIFT idzie bezpośrednio na rachunek powierniczy notariusza. Koszty transakcyjne to ok. 3–4 % ceny: notariusz 0,35 % plus 1 000 lek, ASHK 5 000 lek, podatek od przeniesienia własności 2 % (w praktyce wliczany w cenę), prowizja pośrednika zwyczajowo 1 %. Przy nowych mieszkaniach warto mieć na piśmie, czy cena jest z VAT, czy bez („me TVSH apo pa TVSH”). Po zakupie roczny podatek od nieruchomości to 0,05 % wartości fiskalnej, a dochód z najmu krótkoterminowego opodatkowany jest stawką 15 %. Aktualne oferty sprzedaży znajdziesz w katalogu.',
        links: [{phrase: 'katalogu', href: '/sale'}],
      },
    ],
    faq: [
      {
        q: 'Ile trwa zakup mieszkania w Albanii?',
        a: 'Przy czystych dokumentach 4–8 tygodni: 1–2 tygodnie na weryfikację tytułu w katastrze ASHK, jeden dzień na akt notarialny i oficjalnie 21 dni (w praktyce 2–4 tygodnie) na rejestrację nowego wyciągu. Sprawy z nieuregulowanym tytułem lub brakiem pozwolenia na użytkowanie potrafią ciągnąć się miesiącami.',
      },
      {
        q: 'Czy potrzebuję prawnika, żeby kupić mieszkanie w Albanii?',
        a: 'Ustawa go nie wymaga, ale przy zakupie przez cudzoziemca jest praktycznie niezbędny do sprawdzenia tytułu, obciążeń i pozwoleń — koszt 500–2 000 €. Obowiązkowy jest za to tłumacz przysięgły, który współpodpisuje akt notarialny, oraz notariusz, przez którego rachunek powierniczy muszą przejść pieniądze.',
      },
      {
        q: 'Czy muszę mieć konto bankowe w Albanii?',
        a: 'Nie. Do samej transakcji wystarczy przelew SWIFT z Polski na rachunek powierniczy notariusza, który wypłaca pieniądze sprzedającemu po akcie. Konto w Albanii można otworzyć w 1–4 tygodnie, ale banki rygorystycznie sprawdzają źródło środków; przydaje się później, do opłat i wynajmu.',
      },
      {
        q: 'Czy umowa prywatna kupna mieszkania jest ważna w Albanii?',
        a: 'Nie. Sprzedaż nieruchomości jest ważna wyłącznie w formie aktu notarialnego; umowa prywatna jest nieważna. Od 2024 roku także umowa rezerwacyjna z deweloperem na mieszkanie w budowie musi być zawarta u notariusza i zarejestrowana w katastrze ASHK, inaczej nie chroni kupującego.',
      },
    ],
    sources: [SRC.notaryTariff, SRC.pwcTaxes, SRC.monitorCoast, SRC.deloitte],
  },

  // 8. can a Pole buy
  {
    slug: 'czy-polak-moze-kupic-mieszkanie-w-albanii',
    id: 'landing-pl-czy-polak-moze-kupic-mieszkanie-w-albanii',
    h1: 'Czy Polak może kupić mieszkanie w Albanii? Zasady w 2026 roku',
    lead:
      'Tak. Obywatel Polski kupuje mieszkanie, dom lub lokal użytkowy w Albanii bez ograniczeń, na tych samych prawach co Albańczyk, łącznie z dziedziczeniem. Jedyny wyjątek to ziemia rolna, dostępna przez albańską spółkę albo dzierżawę do 99 lat. Poniżej: spółka czy osoba fizyczna, konto bankowe, podatki i pobyt.',
    metaTitle: 'Czy Polak może kupić mieszkanie w Albanii? Zasady 2026',
    metaDescription:
      'Czy Polak może kupić nieruchomość w Albanii: mieszkania i domy bez ograniczeń, ziemia rolna tylko przez spółkę, konto bankowe, podatki i pobyt w 2026 roku.',
    tags: [CLUSTER_TAG, 'theme:legal', 'theme:buying'],
    body: [
      {
        text: 'Albania należy do krajów, w których cudzoziemiec kupuje nieruchomość na dokładnie tych samych zasadach co obywatel. Mieszkania, domy, lokale użytkowe i działki budowlane z zabudową — bez zezwoleń, bez limitów, z pełnym prawem dziedziczenia. Cudzoziemcy odpowiadają za ok. 18 % transakcji w kraju, w większości są to obywatele Unii Europejskiej, a Polacy należą do najaktywniejszych grup na południowym wybrzeżu. Ograniczenia dotyczą tylko ziemi rolnej i, historycznie, niezabudowanych działek.',
      },
      {text: 'Czego nie kupisz bezpośrednio', style: 'h2'},
      {
        text: 'Ziemi rolnej cudzoziemiec nie może nabyć na własne nazwisko. Dwa legalne rozwiązania: albańska spółka z ograniczoną odpowiedzialnością (sh.p.k.), która nawet w 100 % zagraniczna jest traktowana jak podmiot albański — rejestracja trwa 10–14 dni i kosztuje 500–1 500 € — albo dzierżawa na okres do 99 lat. Historyczny warunek dla działek niezabudowanych (truall), czyli inwestycja o wartości trzykrotności ceny ziemi, w praktyce również omija się przez spółkę. Ceny domów i działek omawiamy w tekście ile kosztuje dom w Albanii.',
        links: [{phrase: 'ile kosztuje dom w Albanii', href: guide('ile-kosztuje-dom-w-albanii')}],
      },
      {text: 'Osoba fizyczna czy spółka', style: 'h2'},
      {
        text: 'Dla mieszkania na wynajem prostsza jest osoba fizyczna: podatek od zysku przy sprzedaży 15 %, dochód z najmu krótkoterminowego rozliczany stawką 15 % przez system DIVA, żadnej księgowości. Spółka sh.p.k. daje dostęp do ziemi, ale kosztuje podatek dochodowy 15 %, 8 % od dywidendy i stałą obsługę księgową. Większość kupujących z Polski wybiera zakup na własne nazwisko; spółkę zakłada się, gdy w grę wchodzi ziemia albo kilka nieruchomości. Sam proces zakupu — od zadatku po wpis w katastrze — opisujemy w przewodniku jak kupić mieszkanie w Albanii.',
        links: [{phrase: 'jak kupić mieszkanie w Albanii', href: guide('jak-kupic-mieszkanie-w-albanii')}],
      },
      {text: 'Konto bankowe i pobyt', style: 'h2'},
      {
        text: 'Konto w albańskim banku można otworzyć w 1–4 tygodnie, po rygorystycznej weryfikacji źródła środków; do zakupu nie jest potrzebne, bo przelew SWIFT idzie na rachunek powierniczy notariusza. Prawo o cudzoziemcach (art. 84 ustawy 79/2021) przewiduje zezwolenie na pobyt dla właściciela nieruchomości; ustawa nie określa progu wartości, w praktyce mówi się o 75–150 tys. €, zezwolenie wydaje się na rok z możliwością przedłużenia, a po pięciu latach można ubiegać się o pobyt stały. Progi 100 tys. € i 300 tys. € dla zezwolenia inwestorskiego, o których piszą media po ustawie 43/2025, nie zostały oficjalnie potwierdzone — traktuj je jako niepewne. Obywatele UE od 2025/26 roku rejestrują pobyt online. Ogólny obraz rynku znajdziesz na stronie o nieruchomościach w Albanii, a oferty w katalogu.',
        links: [
          {phrase: 'nieruchomościach w Albanii', href: guide('nieruchomosci-w-albanii')},
          {phrase: 'katalogu', href: '/sale'},
        ],
      },
    ],
    faq: [
      {
        q: 'Czy obywatel Polski może kupić mieszkanie w Albanii?',
        a: 'Tak, bez ograniczeń i bez zezwoleń — mieszkania, domy i lokale użytkowe na tych samych prawach co obywatele Albanii, łącznie z dziedziczeniem. Wyjątkiem jest ziemia rolna, dostępna tylko przez albańską spółkę sh.p.k. albo dzierżawę do 99 lat. Umowa sprzedaży musi mieć formę aktu notarialnego.',
      },
      {
        q: 'Czy zakup nieruchomości w Albanii daje prawo pobytu?',
        a: 'Ustawa o cudzoziemcach (art. 84 ustawy 79/2021) przewiduje zezwolenie na pobyt dla właściciela nieruchomości, bez progu wartości w samej ustawie; w praktyce mówi się o 75–150 tys. €. Zezwolenie wydaje się na rok z możliwością przedłużenia, po pięciu latach można ubiegać się o pobyt stały. Progi dla zezwolenia inwestorskiego nie są oficjalnie potwierdzone.',
      },
      {
        q: 'Czy do zakupu mieszkania w Albanii potrzebna jest spółka?',
        a: 'Nie — mieszkanie, dom czy lokal kupuje się na własne nazwisko. Spółka sh.p.k. jest potrzebna tylko do zakupu ziemi rolnej lub niezabudowanej; rejestracja trwa 10–14 dni i kosztuje 500–1 500 €, ale wiąże się z podatkiem dochodowym 15 %, podatkiem od dywidendy 8 % i stałą księgowością.',
      },
    ],
    sources: [SRC.pwcTaxes, SRC.notaryTariff, SRC.deloitte, SRC.monitorCoast],
  },

  // 9. is it worth it
  {
    slug: 'czy-warto-kupic-mieszkanie-w-albanii',
    id: 'landing-pl-czy-warto-kupic-mieszkanie-w-albanii',
    h1: 'Czy warto kupić mieszkanie w Albanii w 2026 roku? Uczciwy bilans',
    lead:
      'Warto, jeśli kupujesz na własny użytek z dodatkowym wynajmem i liczysz na 4–6 % brutto rocznie; nie warto, jeśli wierzysz w „10–16 % ROI” z reklam. Ceny na wybrzeżu rosną (+28 % rok do roku), ale liczba transakcji spadła o 35 %, a zapytania cudzoziemców w Sarandzie maleją drugi rok z rzędu. Poniżej rachunek.',
    metaTitle: 'Czy warto kupić mieszkanie w Albanii w 2026? Bilans',
    metaDescription:
      'Czy warto kupić mieszkanie w Albanii w 2026: za i przeciw, realny zwrot z wynajmu 4–6 %, podatek 15 %, sezonowość i ryzyka. Rachunek na przykładzie Sarandy.',
    tags: [CLUSTER_TAG, 'theme:investment', 'theme:albania-market'],
    body: [
      {
        text: 'Odpowiedź zależy od tego, po co kupujesz. Jako miejsce na wakacje z dodatkowym przychodem z wynajmu Albania w 2026 roku broni się dobrze: ceny wciąż niższe niż w Chorwacji czy Grecji, sezon od maja do października, 12,4 mln zagranicznych przyjazdów rocznie i perspektywa członkostwa w UE około 2030 roku. Jako czysta inwestycja pod „ROI 10–16 %” — nie: te liczby dotyczą najlepszego kwartyla mieszkań z profesjonalnym zarządzaniem, a przeciętne mieszkanie zarabia 4–6 % brutto przed podatkiem i kosztami.',
      },
      {text: 'Argumenty za', style: 'h2'},
      {
        text: 'Turystyka rośnie: 12,4–12,5 mln zagranicznych przyjazdów w 2025 roku, sektor wart 26,4 % PKB. Ceny na wybrzeżu rosły w drugiej połowie 2025 roku o 28 % rok do roku, a według Deloitte Albania miała drugi najszybszy wzrost cen mieszkań w Europie, tuż za Polską. Cudzoziemcy to 18 % transakcji, w tym 77 % obywateli UE, więc rynek wtórny dla odsprzedaży cudzoziemcowi istnieje. Negocjacje akcesyjne z Unią są w końcowej fazie. Do tego obywatel Polski kupuje bez ograniczeń, a cały proces trwa 4–8 tygodni.',
      },
      {text: 'Argumenty przeciw', style: 'h2'},
      {
        text: 'Liczba transakcji w kraju spadła w 2025 roku o 35 % przy rosnących cenach — sygnał późnej fazy cyklu. Tirana stanęła w miejscu, a mieszkanie w stolicy kosztuje równowartość 19 rocznych pensji, najgorzej w Europie. W Sarandzie zapytania cudzoziemców spadły o 50 % w 2024 i o 30 % w 2025 roku, a agencje przyznają, że transakcje domykają się gorzej. Nie ma kultury depozytu u pośrednika, jakość wykonania bywa nierówna, a poza sezonem kurorty pustoszeją: najem długoterminowy zimą to 250–400 € miesięcznie. Tańsze segmenty i ich ryzyka opisujemy w tekście o tanich mieszkaniach w Albanii.',
        links: [{phrase: 'tanich mieszkaniach w Albanii', href: guide('tanie-mieszkania-w-albanii')}],
      },
      {text: 'Rachunek na przykładzie Sarandy', style: 'h2'},
      {
        text: 'Mieszkanie za 120 tys. € w Sarandzie, wynajmowane jak mediana tamtejszych ofert Airbnb: ok. 6 960 $ rocznie przy obłożeniu 40,9 % i średniej stawce 94 $ za noc. To 5–6 % brutto. Od tego odchodzi podatek 15 % od dochodu z najmu krótkoterminowego, prowizja zarządcy 20–25 % (bez zarządcy trzeba być na miejscu w sezonie), media, sprzątanie i rezerwa na remont. Netto zostaje zwykle 3,5–4,5 %, plus wartość własnych wakacji i ewentualny wzrost ceny. Model agencyjny „180 nocy po 70 €” daje 12 600 € brutto i ok. 7 250 € netto, ale zakłada obłożenie, którego mediana rynku nie osiąga. Szczegóły miasta opisujemy na stronie o nieruchomościach w Sarandzie, a oferty przeglądasz w katalogu.',
        links: [
          {phrase: 'nieruchomościach w Sarandzie', href: guide('nieruchomosci-saranda')},
          {phrase: 'katalogu', href: '/sale'},
        ],
      },
      {text: 'Dla kogo tak, dla kogo nie', style: 'h2'},
      {
        text: 'Tak — jeśli chcesz mieć własne miejsce nad morzem, akceptujesz 4–6 % brutto jako dodatek, kupujesz w Sarandzie lub Durrës z myślą o dziesięciu latach i przechodzisz przez notariusza z pełną weryfikacją. Nie — jeśli liczysz na szybką odsprzedaż z zyskiem w przegrzanym segmencie, kupujesz z wykopu bez zarejestrowanej umowy, celujesz w Ksamil dla „najwyższych stawek” albo potrzebujesz przychodu przez cały rok.',
      },
    ],
    faq: [
      {
        q: 'Czy warto kupić mieszkanie w Albanii w 2026 roku?',
        a: 'Na własny użytek z dodatkowym wynajmem — tak: ceny niższe niż w Chorwacji, sezon od maja do października, 12,4 mln turystów rocznie i perspektywa UE około 2030 roku. Jako czysta inwestycja pod reklamowane 10–16 % zwrotu — nie: przeciętne mieszkanie zarabia 4–6 % brutto, a rynek jest w późnej fazie cyklu.',
      },
      {
        q: 'Jaki zwrot daje mieszkanie na wynajem w Albanii?',
        a: 'Przeciętnie 4–6 % brutto rocznie. Mediana oferty Airbnb w Sarandzie zarabia ok. 6 960 $ rocznie przy obłożeniu 41 %, co dla mieszkania za 120 tys. € daje 5–6 % przed podatkiem 15 % i prowizją zarządcy 20–25 %. Netto zostaje zwykle 3,5–4,5 %. Wyższe wartości dotyczą najlepszych mieszkań z profesjonalnym zarządzaniem.',
      },
      {
        q: 'Kiedy nie warto kupować mieszkania w Albanii?',
        a: 'Gdy liczysz na szybką odsprzedaż z zyskiem: liczba transakcji spadła o 35 %, Tirana stanęła w miejscu, a popyt cudzoziemców w Sarandzie maleje drugi rok. Gdy kupujesz z wykopu bez umowy notarialnej zarejestrowanej w katastrze, w Ksamilu bez pozwolenia na użytkowanie, albo gdy potrzebujesz przychodu z najmu przez cały rok.',
      },
    ],
    sources: [SRC.boa, SRC.deloitte, SRC.monitorCoast, SRC.airroiSaranda, SRC.globihomeSaranda, SRC.visitSarandaWinter],
  },
]
