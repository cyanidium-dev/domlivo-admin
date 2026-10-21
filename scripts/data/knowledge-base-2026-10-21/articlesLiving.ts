import type {ArticleSpec} from './types'

/**
 * Living and owning: retirement costs and rules, the running costs of a
 * second home in Durrës, and what a budget under €50,000 buys.
 */

export const ARTICLES_LIVING: ArticleSpec[] = [
  // ------------------------------------------------------------------ retirement
  {
    id: 'KB-RETIRE-COSTS',
    slug: 'retiring-in-albania-monthly-costs',
    group: 'money',
    category: 'utilities',
    tags: ['retirement', 'cost-of-living', 'residence-permit', 'poland', 'germany'],
    title: 'How much does it cost to retire in Albania, and what permit do you need?',
    summary:
      'A retired couple renting a one-bedroom flat pays about €521 a month in Durrës and €717 in Tirana for rent, utilities, internet, municipal fees and voluntary health insurance (Domlivo calculation at October 2026 prices), before food and transport. To stay longer than 90 days in 180, a foreign pensioner needs a residence permit under Article 85 of Law 79/2021, which asks for a pension of at least 1,200,000 ALL a year, about €13,040.',
    dataPeriod: '2026',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'BUDGET',
        heading: 'Monthly budget for two',
        tables: [
          {
            id: 'BUDGET',
            title: 'Monthly fixed costs, retired couple renting a 1+1',
            columns: ['Item', 'Durrës', 'Tirana', 'Basis'],
            rows: [
              {cells: ['Rent, 1+1', '€390', '€590', 'Durrës median asking rent, Sept 2026; Tirana average, H1 2026'], facts: ['DATA-RENT-DURRES-0006', 'DATA-RENT-TIRANA-0015']},
              {cells: ['Electricity, 250 kWh', '€27.7', '€27.7', '10.2 ALL/kWh with VAT, the same everywhere'], facts: ['DATA-ELEC-0003']},
              {cells: ['Water, 6 m³ with the fixed fee', '€10.0', '€7.1', 'ERRU tariffs: 70+50 ALL/m³ in Durrës, 65+11 in Tirana, 200 ALL fixed'], facts: ['DATA-WATER-0001', 'DATA-WATER-0002', 'DATA-WATER-0003', 'DATA-WATER-0006']},
              {cells: ['Internet, 100 Mbps fibre', '€14.0', '€14.0', 'Tring list price, 1,290 ALL'], facts: ['DATA-INTERNET-0007']},
              {cells: ['Municipal cleaning and other fees', '€5.4', '€4.5', 'Durrës 6,000 ALL a year; Tirana 417 ALL a month'], facts: ['DATA-KB2-DURRES-0001', 'DATA-WASTE-0001']},
              {cells: ['Voluntary health insurance, two people', '€73.9', '€73.9', '3.4% of twice the minimum wage, each'], facts: ['DATA-KB2-RETIRE-0005', 'DATA-KB2-MACRO-0006']},
              {cells: ['Total', 'about €521', 'about €717', 'Domlivo calculation'], facts: ['DATA-KB2-RETIRE-CALC-0001']},
            ],
            methodology:
              'Health insurance: we read Law 10383/2011 as charging a voluntary member 3.4% of twice the minimum wage (50,000 ALL in 2026), 3,400 ALL a month per person; check the current amount with FSDKSH. Food, transport and medicines are not included. 92.02 ALL = €1.',
            confidence: 'ESTIMATE',
          },
        ],
      },
      {
        key: 'CONTEXT',
        heading: 'For scale',
        body:
          'The average gross wage in Albania was 92,150 ALL a month (about €1,000) in Q2 2026, the minimum wage is 50,000 ALL (about €543), and consumer prices rose 2.9% in the year to September 2026.',
      },
      {
        key: 'PERMIT',
        heading: 'Staying longer than 90 days',
        tables: [
          {
            id: 'RULES',
            title: 'Entry and residence rules for a foreign pensioner',
            columns: ['Rule', 'What it says', 'Source'],
            rows: [
              {cells: ['Visa-free stay', 'Up to 90 days in any 180 without a visa; Polish citizens can enter with an ID card', 'Law 79/2021 Art. 29; Polish foreign ministry'], facts: ['DATA-LEGAL-0013', 'DATA-ENTRY-PL-0001']},
              {cells: ['Pensioner residence permit', 'Up to one year at first, renewable every year; no work or business allowed; a spouse or partner can join', 'Law 79/2021 Art. 85'], facts: ['DATA-LEGAL-0015']},
              {cells: ['Income required', 'A pension of at least 1,200,000 ALL a year (about €13,040, or €1,087 a month), shown with a pension certificate', 'VKM 858/2021'], facts: ['DATA-LEGAL-0015']},
              {cells: ['How to apply', 'On e-Albania, with the form, a photo, a passport copy and a self-declaration of housing', 'VKM 858/2021']},
              {cells: ['If you buy instead of renting', 'An owner can apply for a separate permit under Art. 84', 'Law 79/2021 Art. 84'], facts: ['DATA-LEGAL-0014']},
            ],
            methodology: 'Law 43/2025 moved the permit criteria from the law into the Council of Ministers decision (VKM 858/2021); an amendment of that decision was in public consultation in 2026.',
          },
        ],
      },
      {
        key: 'PENSION',
        heading: 'Your pension: tax and payment',
        tables: [
          {
            id: 'PENSION',
            title: 'Polish and German pensions in Albania',
            columns: ['Question', 'Poland', 'Germany'],
            rows: [
              {cells: ['Where is the pension taxed?', 'Treaty Art. 18: pensions for past work only in the country of residence; pensions for state service (Art. 19) stay taxable in Poland unless you are also an Albanian national', 'Treaty Art. 18(1): only in the country of residence; civil-service pensions stay taxable in Germany (Art. 19)'], facts: ['DATA-KB2-RETIRE-0002', 'DATA-TAX-DE-0002']},
              {cells: ['Does Albania tax it?', 'Albanian law exempts pensions from the compulsory social insurance scheme (Law 29/2023 Art. 11) but does not say whether a foreign state pension counts; ask a tax adviser', 'Same rule'], facts: ['DATA-KB2-RETIRE-0001']},
              {cells: ['Can it be paid into an Albanian account?', 'Not yet: ZUS does not list Albania among the countries it pays to. A Poland-Albania social security agreement was signed on 23 February 2026; its start date is not yet published', 'A German-Albanian social security agreement has been in force since 1 December 2017; ask Deutsche Rentenversicherung about payment abroad'], facts: ['DATA-KB2-RETIRE-0003', 'DATA-KB2-RETIRE-0004', 'DATA-KB2-RETIRE-0006']},
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'How much money do you need to retire in Albania?', a: 'For the residence permit, a pension of at least 1,200,000 ALL a year, about €1,087 a month. A couple renting a 1+1 spends about €521 a month in Durrës on rent and fixed bills, before food.'},
      {q: 'Can a Polish pensioner live in Albania?', a: 'Yes. Up to 90 days in 180 without a visa, and longer with a pensioner residence permit under Article 85 of Law 79/2021.'},
      {q: 'Can I work on a pensioner permit?', a: 'No. Article 85 says the permit gives no right to any economic or professional activity.'},
      {q: 'Can a foreign resident use public healthcare?', a: 'A resident who is not otherwise covered can join the national health insurance scheme voluntarily; cover starts six months after registering and paying.'},
    ],
    facts: ['DATA-KB2-MACRO-0005', 'DATA-KB2-MACRO-0007'],
    sources: ['KB-ALB-2026-001', 'KB-ALB-2026-002', 'KB-PL-2026-001', 'KB-PL-2026-002', 'KB-DE-2026-001', 'KB-DE-2026-004', 'KB-F4-2026-036', 'KB-F4-2026-037', 'KB-F4-2026-038', 'KB-F4-2026-039', 'KB-F4-2026-040', 'KB-F4-2026-041', 'KB-F4-2026-042'],
    gaps: [
      {id: 'GAP-FOREIGN-PENSION-TAX', text: 'No official Albanian guidance says whether foreign state pensions are exempt from income tax.', priority: 'HIGH'},
      {id: 'GAP-ZUS-ALBANIA', text: 'The date from which ZUS will pay pensions to Albania under the 2026 agreement is not published.', priority: 'MEDIUM'},
      {id: 'GAP-PENSIONER-BASKET', text: 'No official consumer basket for a pensioner exists; food and transport are left out of the budget.', priority: 'MEDIUM'},
    ],
    related: ['KB-BUY-POLAND', 'KB-RESIDENCE-PURCHASE', 'KB-UTILITIES-BY-CITY'],
    seoTitle: 'Retiring in Albania: monthly costs and the pensioner permit (2026)',
    seoDescription:
      'What a retired couple pays a month in Durrës (about €521) and Tirana (about €717), the 1.2 million ALL pension rule for a residence permit, tax and ZUS, with sources.',
    reviewMonths: 6,
    tr: {
      pl: {
        title: 'Emerytura w Albanii: ile kosztuje życie i jakie zezwolenie jest potrzebne?',
        summary:
          'Para emerytów wynajmująca mieszkanie z jedną sypialnią płaci około 521 € miesięcznie w Durrës i 717 € w Tiranie za czynsz, media, internet, opłaty gminne i dobrowolne ubezpieczenie zdrowotne (wyliczenie Domlivo, ceny z października 2026), bez jedzenia i transportu. Aby zostać dłużej niż 90 dni w ciągu 180, emeryt z zagranicy potrzebuje zezwolenia na pobyt z art. 85 ustawy 79/2021, które wymaga emerytury co najmniej 1 200 000 ALL rocznie, czyli około 13 040 €.',
        seoTitle: 'Emerytura w Albanii: koszty życia i zezwolenie na pobyt (2026)',
        seoDescription:
          'Ile para emerytów płaci miesięcznie w Durrës (około 521 €) i w Tiranie (około 717 €), próg 1,2 mln ALL emerytury do zezwolenia na pobyt, podatki i ZUS, ze źródłami.',
        sections: {
          BUDGET: {
            heading: 'Miesięczny budżet dla dwojga',
            tables: {
              BUDGET: {
                title: 'Stałe koszty miesięczne, para emerytów wynajmująca 1+1',
                columns: ['Pozycja', 'Durrës', 'Tirana', 'Podstawa'],
                rows: [
                  ['Czynsz najmu, 1+1', '390 €', '590 €', 'Durrës: mediana czynszu ofertowego, IX 2026; Tirana: średnia, I półrocze 2026'],
                  ['Prąd, 250 kWh', '27,7 €', '27,7 €', '10,2 ALL/kWh z VAT, wszędzie tyle samo'],
                  ['Woda, 6 m³ z opłatą stałą', '10,0 €', '7,1 €', 'Taryfy ERRU: 70+50 ALL/m³ w Durrës, 65+11 w Tiranie, 200 ALL opłaty stałej'],
                  ['Internet, światłowód 100 Mb/s', '14,0 €', '14,0 €', 'Cena katalogowa Tring, 1290 ALL'],
                  ['Opłaty gminne (śmieci i inne)', '5,4 €', '4,5 €', 'Durrës 6000 ALL rocznie; Tirana 417 ALL miesięcznie'],
                  ['Dobrowolne ubezpieczenie zdrowotne, dwie osoby', '73,9 €', '73,9 €', 'Od każdej osoby 3,4% podwójnej płacy minimalnej'],
                  ['Razem', 'około 521 €', 'około 717 €', 'Wyliczenie Domlivo'],
                ],
                methodology:
                  'Ubezpieczenie zdrowotne: według naszej lektury ustawy 10383/2011 osoba ubezpieczona dobrowolnie płaci 3,4% podwójnej płacy minimalnej (50 000 ALL w 2026), czyli 3400 ALL miesięcznie; aktualną kwotę warto potwierdzić w FSDKSH. Bez jedzenia, transportu i leków. 92,02 ALL = 1 €.',
              },
            },
          },
          CONTEXT: {
            heading: 'Dla porównania',
            body:
              'Przeciętne wynagrodzenie brutto w Albanii wynosiło w II kwartale 2026 roku 92 150 ALL miesięcznie (około 1000 €), płaca minimalna to 50 000 ALL (około 543 €), a ceny konsumpcyjne wzrosły o 2,9% w ciągu roku do września 2026.',
          },
          PERMIT: {
            heading: 'Pobyt dłuższy niż 90 dni',
            tables: {
              RULES: {
                title: 'Zasady wjazdu i pobytu dla emeryta z zagranicy',
                columns: ['Zasada', 'Co mówią przepisy', 'Źródło'],
                rows: [
                  ['Pobyt bez wizy', 'Do 90 dni w każdym okresie 180 dni; obywatele Polski mogą wjechać na dowód osobisty', 'Ustawa 79/2021 art. 29; MSZ RP'],
                  ['Zezwolenie na pobyt dla emerytów', 'Najpierw do roku, odnawiane co rok; bez prawa do pracy i działalności gospodarczej; może dołączyć małżonek lub partner', 'Ustawa 79/2021 art. 85'],
                  ['Wymagany dochód', 'Emerytura co najmniej 1 200 000 ALL rocznie (około 13 040 €, czyli 1087 € miesięcznie), potwierdzona zaświadczeniem o emeryturze', 'VKM 858/2021'],
                  ['Jak złożyć wniosek', 'Przez e-Albania: formularz, zdjęcie, kopia paszportu i oświadczenie o miejscu zamieszkania', 'VKM 858/2021'],
                  ['Jeśli kupisz zamiast wynajmować', 'Właściciel może wystąpić o osobne zezwolenie z art. 84', 'Ustawa 79/2021 art. 84'],
                ],
                methodology: 'Ustawa 43/2025 przeniosła kryteria zezwolenia z ustawy do decyzji Rady Ministrów (VKM 858/2021); w 2026 roku trwały konsultacje jej zmiany.',
              },
            },
          },
          PENSION: {
            heading: 'Twoja emerytura: podatek i wypłata',
            tables: {
              PENSION: {
                title: 'Polska i niemiecka emerytura w Albanii',
                columns: ['Pytanie', 'Polska', 'Niemcy'],
                rows: [
                  ['Gdzie emerytura jest opodatkowana?', 'Umowa, art. 18: emerytury z tytułu dawnej pracy tylko w państwie zamieszkania; emerytury za służbę państwową (art. 19) pozostają opodatkowane w Polsce, chyba że masz też obywatelstwo albańskie', 'Umowa, art. 18 ust. 1: tylko w państwie zamieszkania; emerytury urzędnicze pozostają opodatkowane w Niemczech (art. 19)'],
                  ['Czy Albania ją opodatkuje?', 'Prawo albańskie zwalnia z podatku emerytury z obowiązkowego systemu ubezpieczeń społecznych (ustawa 29/2023 art. 11), ale nie mówi, czy dotyczy to emerytury z zagranicy; warto zapytać doradcę podatkowego', 'Ta sama zasada'],
                  ['Czy może być wypłacana na konto w Albanii?', 'Jeszcze nie: ZUS nie wymienia Albanii wśród krajów, do których przekazuje świadczenia. Umowę o zabezpieczeniu społecznym między Polską a Albanią podpisano 23 lutego 2026; data jej wejścia w życie nie została jeszcze ogłoszona', 'Umowa niemiecko-albańska o zabezpieczeniu społecznym obowiązuje od 1 grudnia 2017; o wypłatę za granicę warto zapytać Deutsche Rentenversicherung'],
                ],
              },
            },
          },
        },
        faq: [
          {q: 'Ile pieniędzy potrzeba, żeby przejść na emeryturę w Albanii?', a: 'Do zezwolenia na pobyt: emerytura co najmniej 1 200 000 ALL rocznie, około 1087 € miesięcznie. Para wynajmująca 1+1 w Durrës wydaje około 521 € miesięcznie na czynsz i stałe rachunki, bez jedzenia.'},
          {q: 'Czy polski emeryt może zamieszkać w Albanii?', a: 'Tak. Do 90 dni w ciągu 180 bez wizy, a dłużej z zezwoleniem na pobyt dla emerytów z art. 85 ustawy 79/2021.'},
          {q: 'Czy z zezwoleniem dla emerytów można pracować?', a: 'Nie. Art. 85 mówi, że zezwolenie nie daje prawa do żadnej działalności gospodarczej ani zawodowej.'},
          {q: 'Czy cudzoziemiec z pobytem może korzystać z publicznej służby zdrowia?', a: 'Osoba, która nie jest ubezpieczona w inny sposób, może dobrowolnie przystąpić do krajowego ubezpieczenia zdrowotnego; ochrona zaczyna się sześć miesięcy po rejestracji i wpłacie.'},
        ],
        gaps: [
          'Brak oficjalnych wyjaśnień albańskiego fiskusa, czy emerytury z zagranicy są zwolnione z podatku.',
          'Nie ogłoszono, od kiedy ZUS zacznie wypłacać emerytury do Albanii na podstawie umowy z 2026 roku.',
          'Nie istnieje oficjalny koszyk konsumpcyjny emeryta; jedzenia i transportu nie ma w budżecie.',
        ],
      },
    },
  },

  // ------------------------------------------------------------------ second home
  {
    id: 'KB-SECOND-HOME-DURRES',
    slug: 'second-home-durres-annual-running-costs',
    group: 'ownership',
    category: 'building_fees',
    tags: ['durres', 'second-home', 'running-costs', 'utilities', 'taxes'],
    citySlug: 'durres',
    title: 'What does a second home in Durrës cost to keep per year?',
    summary:
      'An empty 70 m² flat in Durrës costs about 13,200 ALL (€143) a year in fixed charges at 2026 tariffs: a 200 ALL monthly water fee, a 200 ALL monthly electricity fee in months the meter reads zero, about 6,000 ALL of municipal fees and about 2,360 ALL of building tax, all billed with the water bill. The building’s administration fee, insurance and any letting manager come on top.',
    dataPeriod: '2026',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'FIXED',
        heading: 'Fixed charges when nobody is there',
        tables: [
          {
            id: 'FIXED',
            title: 'Annual fixed charges, empty 70 m² flat in Durrës city',
            columns: ['Charge', 'Rate', 'A year', 'Source'],
            rows: [
              {cells: ['Water service fee', '200 ALL a month', '2,400 ALL', 'ERRU Decision 15/2024'], facts: ['DATA-KB2-DURRES-0004']},
              {cells: ['Electricity, months with a zero reading', '200 ALL a month', 'up to 2,400 ALL', 'ERE Decision 312/2025'], facts: ['DATA-KB2-DURRES-0005']},
              {cells: ['Cleaning and waste fee', '3,500 ALL a year per family', '3,500 ALL', 'Durrës fiscal package'], facts: ['DATA-KB2-DURRES-0001']},
              {cells: ['Public lighting fee', '1,500 ALL a year', '1,500 ALL', 'Durrës fiscal package'], facts: ['DATA-KB2-DURRES-0001']},
              {cells: ['Greenery fee', '1,000 ALL a year', '1,000 ALL', 'Durrës fiscal package'], facts: ['DATA-KB2-DURRES-0001']},
              {cells: ['Building tax', '33.75 ALL per m² a year (0.05% of the reference price)', '2,363 ALL', 'VKM 132/2018; Durrës fiscal package'], facts: ['DATA-KB2-DURRES-0002', 'DATA-TAX-0008']},
              {cells: ['Total', '', 'about 13,160 ALL (€143)', 'Domlivo calculation'], facts: ['DATA-KB2-DURRES-CALC-0001']},
            ],
            methodology:
              'Municipal fees are the 2024 package levels; the budget committee’s report on the 2026 package lists eight changes and none touches them. Golem and other coastal units outside Durrës city fall under different rules (Golem is in Kavajë municipality) and are not covered here. 92.02 ALL = €1.',
          },
        ],
      },
      {
        key: 'USE',
        heading: 'When you use the flat',
        body:
          '- Electricity costs 10.2 ALL per kWh with VAT up to 700 kWh a month, the same rate across Albania in 2026.\n- Water in Durrës costs 70 ALL per m³ plus 50 ALL for sewerage, on top of the fixed fee.\n- Durrës bills the cleaning, lighting and greenery fees and the building tax together with the water bill, so the bill keeps coming while the flat is empty. Set up a bank payment or ask someone to pay it.',
      },
      {
        key: 'EXTRA',
        heading: 'Costs that depend on the building and on you',
        body:
          '- Administration fee. Law 55/2025 sets no national rate: the owners’ assembly fixes it from the building’s costs and each owner’s share, and an owner pays it even when not living there. A late payment costs 30% of the fee per month. Ask the administrator for the current amount and the last year’s accounts before buying.\n- Insurance. Cover against natural disasters is voluntary and only about 5% of Albanian homes are insured (Monitor, October 2026). We found no published price we could verify; ask two or three insurers for a quote.\n- Letting it out. If you let the flat to holiday guests you need a categorisation certificate, pay 15% tax on the rental income, and a manager typically takes a share of bookings; see the related pages.',
      },
    ],
    faq: [
      {q: 'What are the yearly costs of an apartment in Durrës if I only use it in summer?', a: 'About 13,200 ALL (€143) a year in fixed charges for an empty 70 m² flat, plus what you use in summer, the building’s administration fee and insurance.'},
      {q: 'How much is property tax on a flat in Durrës?', a: '33.75 ALL per m² a year, which is 0.05% of the 67,500 ALL/m² reference price: about 2,360 ALL (€26) for 70 m². It is billed with the water bill.'},
      {q: 'Do I pay the building fee if I do not live there?', a: 'Yes. Law 55/2025 obliges an owner to pay the administration fee even when not living in the flat.'},
      {q: 'Is there a fixed electricity charge for an empty flat?', a: 'ERE’s 2026 tariff lists a 200 ALL monthly service fee for a month in which the meter reads zero. If anything stays switched on, you pay for the kWh instead.'},
    ],
    facts: ['DATA-KB2-DURRES-0003', 'DATA-KB2-DURRES-0006', 'DATA-KB2-STRLAW-0008', 'DATA-ELEC-0003', 'DATA-WATER-0001', 'DATA-WATER-0002'],
    sources: ['KB-F4-2026-049', 'KB-F4-2026-050', 'KB-F4-2026-051', 'KB-F4-2026-052', 'KB-F4-2026-014', 'WASTE-DURRES-2024-001', 'ELEC-ALB-2026-001', 'BUILDING-ALB-2026-007'],
    gaps: [
      {id: 'GAP-DURRES-2026-FEES-TEXT', text: 'The full text of the Durrës 2026 fiscal package was not readable; fee levels are those of 2024, which the 2026 committee report does not change.', priority: 'MEDIUM'},
      {id: 'GAP-KAVAJE-GOLEM', text: 'Household fees and building tax for Golem (Kavajë municipality) were not found.', priority: 'MEDIUM'},
      {id: 'GAP-INSURANCE-PRICE', text: 'No verifiable published premium for apartment insurance was found.', priority: 'MEDIUM'},
      {id: 'GAP-ZERO-READING-FEE', text: 'ERE Decision 103/2026 did not restate the zero-reading fee; whether it still applies after 30 April 2026 is not confirmed.', priority: 'LOW'},
    ],
    related: ['KB-UTILITIES-BY-CITY', 'KB-PROPERTY-TAX', 'KB-RENTAL-MANAGEMENT', 'KB-STR-RULES'],
    seoTitle: 'Second home in Durrës: annual running costs (2026 tariffs)',
    seoDescription:
      'What an empty flat in Durrës costs a year: water and electricity fixed fees, municipal fees, building tax (about €143 for 70 m²), plus administration fee and insurance, with sources.',
    reviewMonths: 6,
    tr: {
      de: {
        title: 'Was kostet eine Zweitwohnung in Durrës im Jahr?',
        summary:
          'Eine leerstehende 70-m²-Wohnung in Durrës kostet nach den Tarifen von 2026 etwa 13.200 ALL (143 €) im Jahr an Fixkosten: 200 ALL Wassergrundgebühr im Monat, 200 ALL Stromgebühr in Monaten, in denen der Zähler null anzeigt, rund 6.000 ALL Gemeindegebühren und etwa 2.360 ALL Gebäudesteuer, alles über die Wasserrechnung abgerechnet. Hausverwaltungsgebühr, Versicherung und gegebenenfalls ein Vermietungsverwalter kommen hinzu.',
        seoTitle: 'Zweitwohnung in Durrës: Nebenkosten pro Jahr (Tarife 2026)',
        seoDescription:
          'Was eine leerstehende Wohnung in Durrës im Jahr kostet: Grundgebühren für Wasser und Strom, Gemeindegebühren, Gebäudesteuer (etwa 143 € für 70 m²), dazu Hausgeld und Versicherung, mit Quellen.',
        sections: {
          FIXED: {
            heading: 'Fixkosten, wenn niemand da ist',
            tables: {
              FIXED: {
                title: 'Jährliche Fixkosten, leere 70-m²-Wohnung in der Stadt Durrës',
                columns: ['Posten', 'Satz', 'Pro Jahr', 'Quelle'],
                rows: [
                  ['Wasser-Grundgebühr', '200 ALL im Monat', '2.400 ALL', 'ERRU-Entscheidung 15/2024'],
                  ['Strom, Monate mit Zählerstand null', '200 ALL im Monat', 'bis 2.400 ALL', 'ERE-Entscheidung 312/2025'],
                  ['Reinigungs- und Müllgebühr', '3.500 ALL im Jahr pro Haushalt', '3.500 ALL', 'Gebührenpaket der Gemeinde Durrës'],
                  ['Gebühr für Straßenbeleuchtung', '1.500 ALL im Jahr', '1.500 ALL', 'Gebührenpaket der Gemeinde Durrës'],
                  ['Gebühr für Grünflächen', '1.000 ALL im Jahr', '1.000 ALL', 'Gebührenpaket der Gemeinde Durrës'],
                  ['Gebäudesteuer', '33,75 ALL pro m² im Jahr (0,05% des Referenzpreises)', '2.363 ALL', 'VKM 132/2018; Gebührenpaket Durrës'],
                  ['Summe', '', 'etwa 13.160 ALL (143 €)', 'Berechnung von Domlivo'],
                ],
                methodology:
                  'Die Gemeindegebühren entsprechen dem Paket von 2024; der Bericht des Haushaltsausschusses zum Paket 2026 nennt acht Änderungen, keine davon betrifft diese Gebühren. Golem und andere Küstenorte außerhalb der Stadt Durrës unterliegen anderen Regeln (Golem gehört zur Gemeinde Kavajë) und sind hier nicht erfasst. 92,02 ALL = 1 €.',
              },
            },
          },
          USE: {
            heading: 'Wenn Sie die Wohnung nutzen',
            body:
              '- Strom kostet 2026 in ganz Albanien 10,2 ALL pro kWh inklusive Mehrwertsteuer bis 700 kWh im Monat.\n- Wasser kostet in Durrës 70 ALL pro m³ plus 50 ALL Abwasser, zusätzlich zur Grundgebühr.\n- Durrës rechnet Reinigungs-, Beleuchtungs- und Grünflächengebühr sowie die Gebäudesteuer über die Wasserrechnung ab. Die Rechnung kommt also auch, wenn die Wohnung leer steht. Richten Sie eine Zahlung über die Bank ein oder bitten Sie jemanden vor Ort, sie zu begleichen.',
          },
          EXTRA: {
            heading: 'Kosten, die vom Gebäude und von Ihnen abhängen',
            body:
              '- Hausverwaltungsgebühr. Das Gesetz 55/2025 legt keinen landesweiten Satz fest: Die Eigentümerversammlung bestimmt sie nach den Kosten des Gebäudes und dem Anteil jedes Eigentümers, und ein Eigentümer zahlt sie auch, wenn er nicht dort wohnt. Verspätete Zahlung kostet 30% der Gebühr pro Monat. Fragen Sie vor dem Kauf den Verwalter nach dem aktuellen Betrag und der Abrechnung des letzten Jahres.\n- Versicherung. Eine Versicherung gegen Naturkatastrophen ist freiwillig, und nur etwa 5% der albanischen Wohnungen sind versichert (Monitor, Oktober 2026). Einen überprüfbaren veröffentlichten Preis haben wir nicht gefunden; holen Sie zwei oder drei Angebote ein.\n- Vermietung. Wer an Feriengäste vermietet, braucht ein Kategorisierungszertifikat, zahlt 15% Steuer auf die Mieteinnahmen, und ein Verwalter behält üblicherweise einen Anteil der Buchungen; siehe die verwandten Seiten.',
          },
        },
        faq: [
          {q: 'Welche jährlichen Nebenkosten hat eine Wohnung in Durrës, die ich nur im Sommer nutze?', a: 'Etwa 13.200 ALL (143 €) im Jahr an Fixkosten für eine leere 70-m²-Wohnung, dazu der Verbrauch im Sommer, das Hausgeld und die Versicherung.'},
          {q: 'Wie hoch ist die Grundsteuer für eine Wohnung in Durrës?', a: '33,75 ALL pro m² im Jahr, das sind 0,05% des Referenzpreises von 67.500 ALL/m²: etwa 2.360 ALL (26 €) für 70 m². Sie wird mit der Wasserrechnung abgerechnet.'},
          {q: 'Muss ich das Hausgeld zahlen, wenn ich nicht dort wohne?', a: 'Ja. Das Gesetz 55/2025 verpflichtet Eigentümer, die Verwaltungsgebühr auch dann zu zahlen, wenn sie nicht in der Wohnung wohnen.'},
          {q: 'Gibt es eine feste Stromgebühr für eine leere Wohnung?', a: 'Der Tarif der Regulierungsbehörde ERE für 2026 sieht 200 ALL im Monat für Monate vor, in denen der Zähler null anzeigt. Bleibt etwas eingeschaltet, zahlen Sie stattdessen die verbrauchten kWh.'},
        ],
        gaps: [
          'Der vollständige Text des Gebührenpakets 2026 von Durrës war nicht lesbar; die Gebühren sind die von 2024, die der Ausschussbericht 2026 nicht ändert.',
          'Gemeindegebühren und Gebäudesteuer für Golem (Gemeinde Kavajë) wurden nicht gefunden.',
          'Kein überprüfbarer veröffentlichter Preis für eine Wohnungsversicherung gefunden.',
          'Die ERE-Entscheidung 103/2026 wiederholt die Gebühr für den Zählerstand null nicht; ob sie nach dem 30. April 2026 noch gilt, ist nicht bestätigt.',
        ],
      },
    },
  },

  // ------------------------------------------------------------------ under €50,000
  {
    id: 'KB-UNDER-50K',
    slug: 'can-you-buy-an-apartment-in-albania-for-under-50000-euro',
    group: 'buying',
    category: 'property_prices',
    tags: ['budget', 'studio', 'durres', 'prices'],
    citySlug: 'durres',
    title: 'Can you buy an apartment in Albania for under €50,000?',
    summary:
      'Yes, but almost only studios on the Durrës coast: on 21 October 2026 Domlivo listed 13 flats at €50,000 or less, 12 of them studios of 24-52 m² in Shkëmbi i Kavajës, Plazh, Golem and nearby, and one 83 m² flat in Kavajë town. A budget of €70,000 opens 58 flats. On a €45,000 flat the buyer’s notary and registration fees come to about €210.',
    dataPeriod: '2026-10',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'BY_BUDGET',
        heading: 'What each budget buys',
        tables: [
          {
            id: 'BUDGETS',
            title: 'Flats for sale on Domlivo by total price, 21 October 2026',
            columns: ['Budget', 'Flats listed', 'Share of all flats'],
            rows: [
              {cells: ['up to €50,000', '13', '2.6%'], facts: ['DATA-KB2-LISTINGS-0001']},
              {cells: ['up to €60,000', '30', '6.0%'], facts: ['DATA-KB2-LISTINGS-0001']},
              {cells: ['up to €70,000', '58', '11.5%'], facts: ['DATA-KB2-LISTINGS-0001']},
              {cells: ['up to €80,000', '92', '18.3%'], facts: ['DATA-KB2-LISTINGS-0001']},
              {cells: ['up to €100,000', '208', '41.4%'], facts: ['DATA-KB2-LISTINGS-0001']},
            ],
            methodology:
              'Active sale listings of flats and studios on domlivo.com with a total asking price, 503 in all. Listings whose price was entered per m² instead of in total were left out. Live today: the cheapest flat in Durrës is listed at €{{from:durres}} and the median flat at €{{price:durres}} ({{date:durres}}).',
          },
        ],
      },
      {
        key: 'WHERE',
        heading: 'Where the flats under €50,000 are',
        tables: [
          {
            id: 'UNDER_50K',
            title: 'The 13 flats at €50,000 or less, 21 October 2026',
            columns: ['Area', 'Flats', 'Size', 'Asking price'],
            rows: [
              {cells: ['Shkëmbi i Kavajës', '5 studios', '28-40 m²', '€40,000-50,000'], facts: ['DATA-KB2-LISTINGS-0002']},
              {cells: ['Plazh', '3 studios', '24-41 m²', '€45,000-48,000'], facts: ['DATA-KB2-LISTINGS-0002']},
              {cells: ['Golem', '2 studios', '38 and 52 m²', '€45,000-45,600'], facts: ['DATA-KB2-LISTINGS-0002']},
              {cells: ['Qerret', '1 studio', '36 m²', '€47,000'], facts: ['DATA-KB2-LISTINGS-0002']},
              {cells: ['Spille', '1 studio', '37 m²', '€44,400'], facts: ['DATA-KB2-LISTINGS-0002']},
              {cells: ['Kavajë town', '1 flat', '83 m²', '€40,000'], facts: ['DATA-KB2-LISTINGS-0002']},
            ],
            methodology: 'Three of the 13 are under construction; 10 are listed within 500 m of the sea. None is in Tirana, Vlorë or Sarandë.',
          },
        ],
      },
      {
        key: 'COSTS',
        heading: 'What you pay on top',
        tables: [
          {
            id: 'COSTS',
            title: 'Buyer’s costs on a €45,000 flat',
            columns: ['Cost', 'Rule', 'Amount'],
            rows: [
              {cells: ['Notary', '0.35% of the price for values up to 6,000,000 ALL', '14,493 ALL (about €158)'], facts: ['DATA-PURCHASE-0001', 'DATA-KB2-LISTINGS-CALC-0001']},
              {cells: ['ASHK registration of the sale', 'flat fee', '5,000 ALL (about €54)'], facts: ['DATA-PURCHASE-0007']},
              {cells: ['Transfer tax for the buyer', 'none on a flat', '0'], facts: ['DATA-PURCHASE-0008', 'DATA-TAX-0019']},
              {cells: ['Total', '', 'about €212'], facts: ['DATA-KB2-LISTINGS-CALC-0001']},
            ],
            methodology:
              'If the contract price is below the official reference price, the notary applies the percentage to the reference price. Translation and power-of-attorney fees, if you need them, come on top.',
          },
        ],
      },
      {
        key: 'CHECKS',
        heading: 'What to check at this price',
        body:
          '- Most flats under €50,000 are studios. They suit holiday letting or a base for summer, and less so a family home.\n- Off-plan flats are cheaper but carry the developer’s risk until the building is finished and registered; ask for the building permit and the land title.\n- A studio still pays the full fixed charges of a home: water and municipal fees and building tax, about 12,000-13,000 ALL a year for an empty flat in Durrës.',
      },
    ],
    faq: [
      {q: 'What is the cheapest apartment in Albania on Domlivo?', a: 'On 21 October 2026 the cheapest flats were listed at €40,000: a studio in Shkëmbi i Kavajës and an 83 m² flat in Kavajë town. The live figure for Durrës is €{{from:durres}}.'},
      {q: 'Can I buy a flat in Tirana for under €50,000?', a: 'Not among the flats listed on Domlivo on 21 October 2026. At an average of €2,116/m² in Q2 2026, €50,000 buys about 24 m² in Tirana.'},
      {q: 'Can I find a flat by the sea for under €50,000?', a: 'Yes, a studio: 10 of the 13 flats at €50,000 or less are listed within 500 m of the sea, in Shkëmbi i Kavajës, Plazh and Golem.'},
      {q: 'Is there a transfer tax when I buy?', a: 'Not on a flat. The buyer pays the notary (0.35% up to 6,000,000 ALL) and the 5,000 ALL ASHK registration fee; the seller pays any tax on the gain.'},
    ],
    facts: ['DATA-PURCHASE-0012', 'DATA-KB2-TIRANA-0001', 'DATA-KB2-DURRES-CALC-0001'],
    sources: ['KB-ALB-2026-012', 'KB-ALB-2026-003', 'KB-ALB-2026-011', 'PURCHASE-ALB-2026-001'],
    gaps: [
      {id: 'GAP-LISTING-PRICE-FIELD', text: 'Some listings carry a price per m² in the total-price field; they are excluded from the counts.', priority: 'LOW'},
      {id: 'GAP-NOTARY-VAT', text: 'Whether VAT is added to the notary fee is not settled in the sources found.', priority: 'LOW'},
    ],
    related: ['KB-NOTARY-FEES', 'KB-OFF-PLAN-RISKS', 'KB-PLAZH-VS-GOLEM', 'KB-BUY-GERMANY'],
    seoTitle: 'Apartment in Albania under €50,000: what is for sale (Oct 2026)',
    seoDescription:
      'On 21 October 2026 Domlivo listed 13 flats at €50,000 or less, mostly studios on the Durrës coast. Where they are, sizes, and the buyer’s costs (about €210).',
    reviewMonths: 3,
    tr: {
      de: {
        title: 'Kann man in Albanien eine Wohnung für unter 50.000 Euro kaufen?',
        summary:
          'Ja, aber fast nur Studios an der Küste von Durrës: Am 21. Oktober 2026 waren auf Domlivo 13 Wohnungen für 50.000 € oder weniger gelistet, 12 davon Studios mit 24-52 m² in Shkëmbi i Kavajës, Plazh, Golem und Umgebung, dazu eine 83-m²-Wohnung in der Stadt Kavajë. Mit 70.000 € Budget sind es 58 Wohnungen. Bei einer Wohnung für 45.000 € zahlt der Käufer etwa 210 € für Notar und Grundbucheintragung.',
        seoTitle: 'Immobilien in Albanien bis 50.000 Euro: was es gibt (Okt. 2026)',
        seoDescription:
          'Am 21. Oktober 2026 waren auf Domlivo 13 Wohnungen bis 50.000 € gelistet, meist Studios an der Küste von Durrës. Lage, Größen und Kaufnebenkosten (etwa 210 €).',
        sections: {
          BY_BUDGET: {
            heading: 'Was man für welches Budget bekommt',
            tables: {
              BUDGETS: {
                title: 'Wohnungen zum Verkauf auf Domlivo nach Gesamtpreis, 21. Oktober 2026',
                columns: ['Budget', 'Gelistete Wohnungen', 'Anteil an allen Wohnungen'],
                rows: [
                  ['bis 50.000 €', '', '2,6%'],
                  ['bis 60.000 €', '', '6,0%'],
                  ['bis 70.000 €', '', '11,5%'],
                  ['bis 80.000 €', '', '18,3%'],
                  ['bis 100.000 €', '', '41,4%'],
                ],
                methodology:
                  'Aktive Verkaufsangebote für Wohnungen und Studios auf domlivo.com mit Gesamtpreis, insgesamt 503. Angebote, bei denen statt des Gesamtpreises der Preis pro m² eingetragen war, wurden nicht gezählt. Aktuell: Die günstigste Wohnung in Durrës kostet {{from:durres}} €, die mittlere {{price:durres}} € ({{date:durres}}).',
              },
            },
          },
          WHERE: {
            heading: 'Wo die Wohnungen unter 50.000 € liegen',
            tables: {
              UNDER_50K: {
                title: 'Die 13 Wohnungen bis 50.000 €, 21. Oktober 2026',
                columns: ['Ort', 'Wohnungen', 'Größe', 'Angebotspreis'],
                rows: [
                  ['Shkëmbi i Kavajës', '5 Studios', '28-40 m²', '40.000-50.000 €'],
                  ['Plazh', '3 Studios', '24-41 m²', '45.000-48.000 €'],
                  ['Golem', '2 Studios', '38 und 52 m²', '45.000-45.600 €'],
                  ['Qerret', '1 Studio', '36 m²', '47.000 €'],
                  ['Spille', '1 Studio', '37 m²', '44.400 €'],
                  ['Stadt Kavajë', '1 Wohnung', '83 m²', '40.000 €'],
                ],
                methodology: 'Drei der 13 sind noch im Bau; 10 liegen laut Angebot höchstens 500 m vom Meer entfernt. Keine liegt in Tirana, Vlorë oder Sarandë.',
              },
            },
          },
          COSTS: {
            heading: 'Was zusätzlich anfällt',
            tables: {
              COSTS: {
                title: 'Kaufnebenkosten bei einer Wohnung für 45.000 €',
                columns: ['Kosten', 'Regel', 'Betrag'],
                rows: [
                  ['Notar', '0,35% des Preises bei Werten bis 6.000.000 ALL', '14.493 ALL (etwa 158 €)'],
                  ['Eintragung des Kaufs beim Katasteramt ASHK', 'Pauschalgebühr', '5.000 ALL (etwa 54 €)'],
                  ['Grunderwerbsteuer für den Käufer', 'keine bei einer Wohnung', ''],
                  ['Summe', '', 'etwa 212 €'],
                ],
                methodology:
                  'Liegt der Vertragspreis unter dem offiziellen Referenzpreis, berechnet der Notar den Prozentsatz vom Referenzpreis. Übersetzungen und Vollmachten kommen gegebenenfalls hinzu.',
              },
            },
          },
          CHECKS: {
            heading: 'Worauf man in dieser Preisklasse achten sollte',
            body:
              '- Die meisten Wohnungen unter 50.000 € sind Studios. Sie eignen sich für Ferienvermietung oder als Sommerquartier, weniger als Familienwohnung.\n- Wohnungen im Bau sind günstiger, tragen aber das Risiko des Bauträgers, bis das Gebäude fertig und eingetragen ist; lassen Sie sich Baugenehmigung und Grundstückstitel zeigen.\n- Auch ein Studio zahlt die vollen Fixkosten einer Wohnung: Wasser, Gemeindegebühren und Gebäudesteuer, für eine leere Wohnung in Durrës etwa 12.000-13.000 ALL im Jahr.',
          },
        },
        faq: [
          {q: 'Was ist die günstigste Wohnung in Albanien auf Domlivo?', a: 'Am 21. Oktober 2026 kosteten die günstigsten Wohnungen 40.000 €: ein Studio in Shkëmbi i Kavajës und eine 83-m²-Wohnung in der Stadt Kavajë. Der aktuelle Wert für Durrës liegt bei {{from:durres}} €.'},
          {q: 'Gibt es in Tirana eine Wohnung für unter 50.000 €?', a: 'Unter den am 21. Oktober 2026 auf Domlivo gelisteten Wohnungen nicht. Bei durchschnittlich 2.116 €/m² im 2. Quartal 2026 bekommt man für 50.000 € in Tirana etwa 24 m².'},
          {q: 'Gibt es eine Wohnung am Meer für unter 50.000 €?', a: 'Ja, als Studio: 10 der 13 Wohnungen bis 50.000 € liegen laut Angebot höchstens 500 m vom Meer, in Shkëmbi i Kavajës, Plazh und Golem.'},
          {q: 'Zahlt der Käufer Grunderwerbsteuer?', a: 'Bei einer Wohnung nicht. Der Käufer zahlt den Notar (0,35% bis 6.000.000 ALL) und 5.000 ALL für die Eintragung beim ASHK; eine Steuer auf den Gewinn zahlt der Verkäufer.'},
        ],
        gaps: [
          'Einige Angebote enthalten im Feld für den Gesamtpreis einen Preis pro m²; sie sind nicht mitgezählt.',
          'Ob auf die Notargebühr Mehrwertsteuer kommt, klären die gefundenen Quellen nicht.',
        ],
      },
    },
  },
]
