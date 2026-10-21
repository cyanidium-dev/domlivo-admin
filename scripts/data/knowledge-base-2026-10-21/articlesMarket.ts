import type {ArticleSpec} from './types'

/**
 * Market and geography questions from the F4 demand list: the 2026 trend,
 * Tirana by area, Sarandë price growth and the regions investors look at.
 * Domlivo figures are live index tokens; everything else is a dated, sourced
 * figure.
 */

export const ARTICLES_MARKET: ArticleSpec[] = [
  // ------------------------------------------------------------------ trend
  {
    id: 'KB-MARKET-2026',
    slug: 'are-property-prices-in-albania-still-rising-2026',
    group: 'geography',
    category: 'market_analysis',
    tags: ['prices', 'market', 'bank-of-albania', '2026'],
    title: 'Are property prices in Albania still rising in 2026?',
    summary:
      "Yes, but far more slowly than in 2024 and 2025. The Bank of Albania's survey for the first half of 2026 (published in September 2026) shows national house prices unchanged on the previous half-year and 10% higher than a year earlier, down from annual growth of 41.7% in the first half of 2025 and 28% in the second. Tirana rose 10% in the half-year after a flat end of 2025.",
    dataPeriod: '2024-2026',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'HPI_SERIES',
        heading: 'The Bank of Albania index, half-year by half-year',
        tables: [
          {
            id: 'HPI',
            title: 'Bank of Albania house price index (Fisher), change in %',
            columns: ['Half-year', 'National, vs previous half', 'National, vs a year earlier', 'Tirana, vs previous half', 'Tirana, vs a year earlier'],
            rows: [
              {cells: ['H1 2024', '+16.9%', 'n/a', '+23.5%', '+11%'], facts: ['DATA-PROPERTY-ALB-0008']},
              {cells: ['H2 2024', '+23.6%', '+44.5%', '+26.2%', '+56%'], facts: ['DATA-PROPERTY-ALB-0007']},
              {cells: ['H1 2025', '+14.6%', '+41.7%', '+5.1%', '+32.6%'], facts: ['DATA-PROPERTY-ALB-0005']},
              {cells: ['H2 2025', '+11.7%', '+28%', '0%', '+4.4%'], facts: ['DATA-KB2-HPI-0002']},
              {cells: ['H1 2026', '0%', '+10%', '+10%', '+9%'], facts: ['DATA-KB2-HPI-0001']},
            ],
            methodology:
              'The index comes from a half-yearly survey of real estate agents and developers (230 respondents in H1 2026). It measures the prices they report, not registered sales.',
          },
        ],
      },
      {
        key: 'SIGNALS',
        heading: 'Other signals',
        tables: [
          {
            id: 'SIGNALS',
            title: 'Market indicators, latest available',
            columns: ['Indicator', 'Latest figure', 'Period', 'Source'],
            rows: [
              {cells: ['Average time to sell a home', '9.9 months (9.1 a half-year earlier); coast 8.2, Tirana 9.7', 'H1 2026', 'Bank of Albania survey'], facts: ['DATA-KB2-HPI-0003']},
              {cells: ['Homes sold to non-residents', 'about 20% (about 25% in H2 2025)', 'H1 2026', 'Bank of Albania survey'], facts: ['DATA-KB2-HPI-0004']},
              {cells: ['Sales financed with a bank loan', 'about 58%', 'H1 2026', 'Bank of Albania survey'], facts: ['DATA-KB2-HPI-0005']},
              {cells: ['Average rate on new euro home loans', '5.4% (4.9% a year earlier)', 'H1 2026', 'Bank of Albania data via Gazeta Tema'], facts: ['DATA-KB2-MACRO-0002']},
              {cells: ['Bank of Albania policy rate', '2.5%, unchanged', '7 October 2026', 'Bank of Albania'], facts: ['DATA-KB2-MACRO-0001']},
              {cells: ['Permits for new buildings', '460 (+30.7%), 331 of them residential', 'Q2 2026', 'INSTAT'], facts: ['DATA-KB2-MACRO-0003']},
              {cells: ['Construction cost of dwellings', '+1.1% a year', 'Q2 2026', 'INSTAT'], facts: ['DATA-KB2-MACRO-0004']},
              {cells: ['Average apartment price in Tirana', '€2,116/m²', 'Q2 2026', 'Keydata via Faktoje'], facts: ['DATA-KB2-TIRANA-0001']},
              {cells: ['Median asking price of a flat in Durrës (live)', '€{{median:durres}}/m² across {{count:durres}} flats', '{{date:durres}}', 'Domlivo Price Index']},
            ],
          },
        ],
      },
      {
        key: 'READING',
        heading: 'What changed in 2026',
        body:
          "- National growth stopped. After five half-years of rises, the Bank of Albania index did not move between the second half of 2025 and the first half of 2026.\n- Tirana picked up again. It was flat in the second half of 2025, when the coast drove the national rise, and then gained 10% in the first half of 2026.\n- Coastal homes sell faster. The average time to sell on the coast fell from 9.9 to 8.2 months, while Tirana went from 8.1 to 9.7.\n- Fewer foreign buyers in the mix. The share of homes bought by non-residents fell from about 25% to about 20%, most of them still EU citizens.\n\nSupply keeps coming: INSTAT counted 30.7% more permits for new buildings in Q2 2026 than a year earlier, while building costs rose only 1.1%. Borrowing in euro became slightly dearer, at 5.4% on new home loans.",
      },
      {
        key: 'ASKING',
        heading: 'Asking prices and real sale prices',
        body:
          "The Bank of Albania index is the only national series, and it rests on what agents report. Neither ASHK nor INSTAT publishes an index of registered sale prices.\n\nAsking prices on listing sites run above completed sales. In the Bank of Albania survey for the first half of 2025, more than half of agents said they closed sales at the asking price or up to 5% below it.",
      },
    ],
    faq: [
      {q: 'Are property prices in Albania falling?', a: 'Not on the latest official survey: national prices were flat in the first half of 2026 against the second half of 2025, and 10% higher than a year earlier.'},
      {q: 'Where are prices rising fastest?', a: 'In the first half of 2026, Tirana: +10% on the previous half-year. In the second half of 2025 the coast led while Tirana was flat.'},
      {q: 'How long does it take to sell a home in Albania?', a: '9.9 months on average in the first half of 2026: 8.2 months on the coast and 9.7 in Tirana, according to the Bank of Albania survey.'},
      {q: 'Is 2026 a good time to buy?', a: 'We do not forecast prices. The data shows slower growth, more building permits, slightly dearer euro loans and a smaller share of foreign buyers than in 2025. Compare any asking price with the live index for the district.'},
    ],
    facts: ['DATA-PROPERTY-ALB-0006'],
    sources: ['KB-F4-2026-001', 'KB-F4-2026-002', 'KB-F4-2026-003', 'KB-F4-2026-004', 'KB-F4-2026-005', 'KB-F4-2026-006', 'KB-F4-2026-010', 'KB-ALB-2026-012'],
    gaps: [
      {id: 'GAP-NO-TRANSACTION-INDEX', text: 'There is no official index of registered sale prices; the Bank of Albania index is survey-based.', priority: 'HIGH'},
      {id: 'GAP-BOA-ORIGINAL', text: "The Bank of Albania's own H1 2026 publication could not be opened; its figures here come from press reports of it.", priority: 'MEDIUM'},
    ],
    related: ['KB-TIRANA-AREAS', 'KB-INVEST-REGIONS', 'KB-TIRANA-VS-DURRES'],
    seoTitle: 'Albania property prices 2026: still rising? (Bank of Albania data)',
    seoDescription:
      'House prices in Albania were flat in H1 2026 and 10% up on a year earlier, after +28% in 2025. Tirana, the coast, time to sell, loans and permits, with sources.',
    reviewMonths: 6,
    tr: {
      de: {
        title: 'Steigen die Immobilienpreise in Albanien 2026 noch?',
        summary:
          'Ja, aber deutlich langsamer als 2024 und 2025. Laut der Umfrage der Bank of Albania für das erste Halbjahr 2026 (veröffentlicht im September 2026) blieben die Wohnungspreise landesweit gegenüber dem Vorhalbjahr unverändert und lagen 10% über dem Vorjahr, nach einem Jahresplus von 41,7% im ersten und 28% im zweiten Halbjahr 2025. In Tirana stiegen die Preise im Halbjahr um 10%, nachdem sie Ende 2025 stagniert hatten.',
        seoTitle: 'Immobilienpreise Albanien 2026: steigen sie noch? (Daten der Zentralbank)',
        seoDescription:
          'Wohnungspreise in Albanien: im 1. Halbjahr 2026 stabil, +10% zum Vorjahr nach +28% im Jahr 2025. Tirana, Küste, Verkaufsdauer, Kredite und Baugenehmigungen, mit Quellen.',
        sections: {
          HPI_SERIES: {
            heading: 'Der Preisindex der Bank of Albania nach Halbjahren',
            tables: {
              HPI: {
                title: 'Hauspreisindex der Bank of Albania (Fisher), Veränderung in %',
                columns: ['Halbjahr', 'Landesweit, ggü. Vorhalbjahr', 'Landesweit, ggü. Vorjahr', 'Tirana, ggü. Vorhalbjahr', 'Tirana, ggü. Vorjahr'],
                methodology:
                  'Der Index beruht auf einer halbjährlichen Umfrage unter Maklern und Bauträgern (230 Teilnehmer im 1. Halbjahr 2026). Er misst die von ihnen gemeldeten Preise, keine im Grundbuch eingetragenen Verkäufe.',
              },
            },
          },
          SIGNALS: {
            heading: 'Weitere Signale',
            tables: {
              SIGNALS: {
                title: 'Marktindikatoren, jeweils neuester Stand',
                columns: ['Kennzahl', 'Neuester Wert', 'Zeitraum', 'Quelle'],
                rows: [
                  ['Durchschnittliche Verkaufsdauer', '9,9 Monate (ein Halbjahr zuvor 9,1); Küste 8,2, Tirana 9,7', '1. Hj. 2026', 'Umfrage der Bank of Albania'],
                  ['Anteil der Käufer ohne Wohnsitz in Albanien', 'etwa 20% (2. Hj. 2025: etwa 25%)', '1. Hj. 2026', 'Umfrage der Bank of Albania'],
                  ['Mit Bankkredit finanzierte Käufe', 'etwa 58%', '1. Hj. 2026', 'Umfrage der Bank of Albania'],
                  ['Durchschnittszins neuer Wohnkredite in Euro', '5,4% (ein Jahr zuvor 4,9%)', '1. Hj. 2026', 'Daten der Bank of Albania via Gazeta Tema'],
                  ['Leitzins der Bank of Albania', '2,5%, unverändert', '7. Oktober 2026', 'Bank of Albania'],
                  ['Baugenehmigungen für Neubauten', '460 (+30,7%), davon 331 für Wohngebäude', '2. Quartal 2026', 'INSTAT'],
                  ['Baukosten für Wohngebäude', '+1,1% zum Vorjahr', '2. Quartal 2026', 'INSTAT'],
                  ['Durchschnittspreis einer Wohnung in Tirana', '2.116 €/m²', '2. Quartal 2026', 'Keydata via Faktoje'],
                  ['Median-Angebotspreis einer Wohnung in Durrës (live)', '{{median:durres}} €/m² bei {{count:durres}} Wohnungen', '{{date:durres}}', 'Domlivo-Preisindex'],
                ],
              },
            },
          },
          READING: {
            heading: 'Was sich 2026 geändert hat',
            body:
              '- Das landesweite Wachstum ist zum Stillstand gekommen. Nach fünf Halbjahren mit Zuwächsen bewegte sich der Index der Bank of Albania zwischen dem zweiten Halbjahr 2025 und dem ersten Halbjahr 2026 nicht.\n- Tirana zieht wieder an. Im zweiten Halbjahr 2025, als die Küste den landesweiten Anstieg trug, stagnierten die Preise dort, im ersten Halbjahr 2026 stiegen sie um 10%.\n- An der Küste wird schneller verkauft. Die durchschnittliche Verkaufsdauer sank dort von 9,9 auf 8,2 Monate, in Tirana stieg sie von 8,1 auf 9,7.\n- Weniger ausländische Käufer. Der Anteil der Käufer ohne Wohnsitz in Albanien fiel von etwa 25% auf etwa 20%, die meisten sind weiterhin EU-Bürger.\n\nDas Angebot wächst weiter: INSTAT zählte im 2. Quartal 2026 30,7% mehr Baugenehmigungen als ein Jahr zuvor, die Baukosten stiegen nur um 1,1%. Kredite in Euro wurden etwas teurer, neue Wohnkredite kosteten im Schnitt 5,4%.',
          },
          ASKING: {
            heading: 'Angebotspreise und echte Verkaufspreise',
            body:
              'Der Index der Bank of Albania ist die einzige landesweite Preisreihe, und er beruht auf den Angaben der Makler. Weder das Katasteramt ASHK noch INSTAT veröffentlichen einen Index der eingetragenen Verkaufspreise.\n\nAngebotspreise auf Immobilienportalen liegen über den tatsächlich erzielten Preisen. In der Umfrage der Bank of Albania für das erste Halbjahr 2025 gab mehr als die Hälfte der Makler an, zum Angebotspreis oder bis zu 5% darunter verkauft zu haben.',
          },
        },
        faq: [
          {q: 'Fallen die Immobilienpreise in Albanien?', a: 'Nach der neuesten offiziellen Umfrage nicht: Im ersten Halbjahr 2026 blieben die Preise landesweit gegenüber dem zweiten Halbjahr 2025 gleich und lagen 10% über dem Vorjahr.'},
          {q: 'Wo steigen die Preise am schnellsten?', a: 'Im ersten Halbjahr 2026 in Tirana: +10% gegenüber dem Vorhalbjahr. Im zweiten Halbjahr 2025 lag die Küste vorn, während Tirana stagnierte.'},
          {q: 'Wie lange dauert ein Verkauf in Albanien?', a: 'Im ersten Halbjahr 2026 im Schnitt 9,9 Monate: 8,2 Monate an der Küste und 9,7 in Tirana, laut der Umfrage der Bank of Albania.'},
          {q: 'Ist 2026 ein guter Zeitpunkt zum Kaufen?', a: 'Wir machen keine Preisprognosen. Die Daten zeigen langsameres Wachstum, mehr Baugenehmigungen, etwas teurere Euro-Kredite und weniger ausländische Käufer als 2025. Vergleichen Sie jeden Angebotspreis mit dem Live-Index des jeweiligen Stadtteils.'},
        ],
        gaps: [
          'Es gibt keinen offiziellen Index der eingetragenen Verkaufspreise; der Index der Bank of Albania beruht auf einer Umfrage.',
          'Die Originalveröffentlichung der Bank of Albania für das 1. Halbjahr 2026 war nicht abrufbar; die Zahlen stammen aus Presseberichten darüber.',
        ],
      },
    },
  },

  // ------------------------------------------------------------------ Tirana areas
  {
    id: 'KB-TIRANA-AREAS',
    slug: 'best-areas-to-buy-an-apartment-in-tirana',
    group: 'geography',
    category: 'districts',
    tags: ['tirana', 'districts', 'prices', 'rents'],
    citySlug: 'tirana',
    title: 'Which areas of Tirana are best to buy an apartment in, and what do they cost?',
    summary:
      'Ex-Blloku is the most expensive part of Tirana at an average €2,962/m² in June 2026, followed by unit 10 (the centre, Myslym Shyri) and unit 5 (Komuna e Parisit, the lake) at about €2,515/m²; the cheapest city units are 11 (Zogu i Zi, Laprakë) at €1,530 and 6 (Kombinat, Yzberisht) at €1,687 (Keydata index). The city average was €2,116/m² in Q2 2026, and unit 6 has grown fastest since 2019, by 151%.',
    dataPeriod: '2019-2026',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'BY_UNIT',
        heading: 'Prices by administrative unit',
        body:
          'The city of Tirana is split into 11 administrative units; the municipality has 24 in all, counting 13 outer units such as Kashar and Farkë. The Keydata index reports the average apartment price for each city unit. The official reference price, which the tax office uses as a floor, is set zone by zone inside each unit.',
        tables: [
          {
            id: 'UNITS',
            title: 'Tirana city units: average price in June 2026 and official reference price',
            columns: ['Unit', 'Areas (zone landmarks)', 'Average, €/m², June 2026', 'Change since Q2 2019', 'Reference price, ALL/m²'],
            rows: [
              {cells: ['5 (ex-Blloku)', 'Ish-Blloku, Libri Universitar', '€2,962', '+117%', '228,400'], facts: ['DATA-KB2-TIRANA-0002', 'DATA-KB2-TIRANA-0003']},
              {cells: ['10', 'Myslym Shyri, PTT, Rruga e Durrësit, Blloku i Ambasadave', '€2,515', '+119%', '121,200-192,800'], facts: ['DATA-KB2-TIRANA-0002', 'DATA-KB2-TIRANA-0003']},
              {cells: ['5', 'Komuna e Parisit, Botanical Garden, Selman Stërmasi stadium, the artificial lake, Selitë e Vogël', '€2,514', '+127%', '117,800-175,800'], facts: ['DATA-KB2-TIRANA-0002', 'DATA-KB2-TIRANA-0003']},
              {cells: ['2', 'Piramida, Pazari i Ri, Bërryli, Qyteti Studenti', '€2,306', '+95%', '85,700-202,400'], facts: ['DATA-KB2-TIRANA-0002', 'DATA-KB2-TIRANA-0003']},
              {cells: ['7', 'Ish-Ekspozita, Blloku i Ambasadave, Unaza e Re, the former airfield', '€2,131', '+128%', '114,300-159,100'], facts: ['DATA-KB2-TIRANA-0002', 'DATA-KB2-TIRANA-0003']},
              {cells: ['9', 'Bulevardi Zogu I, Rruga e Barrikadave, the old railway station, Don Bosko', '€2,127', '+112%', '113,850-163,600'], facts: ['DATA-KB2-TIRANA-0002', 'DATA-KB2-TIRANA-0003']},
              {cells: ['1', 'Ali Demi, Shkoza, Poligrafiku, Sauk', '€2,116 (as published)', '+115%', '97,200-102,800'], facts: ['DATA-KB2-TIRANA-0002', 'DATA-KB2-TIRANA-0003']},
              {cells: ['3', 'Xhamlliku, Kinostudio, Porcelani', '€1,796', '+116%', '86,300-98,500'], facts: ['DATA-KB2-TIRANA-0002', 'DATA-KB2-TIRANA-0003']},
              {cells: ['8', 'Selvia, Tregu Industrial, Dinamo, Bregu i Lumit', '€1,786', '+85%', '89,900-156,700'], facts: ['DATA-KB2-TIRANA-0002', 'DATA-KB2-TIRANA-0003']},
              {cells: ['4', 'Allias, the hospital complex, Bregu i Lumit', '€1,759', '+130%', '95,300-95,900'], facts: ['DATA-KB2-TIRANA-0002', 'DATA-KB2-TIRANA-0003']},
              {cells: ['6', 'Kombinat, Yzberisht, Selitë, Vaqarr, Sharrë', '€1,687', '+151%', '81,700'], facts: ['DATA-KB2-TIRANA-0002', 'DATA-KB2-TIRANA-0003']},
              {cells: ['11', 'Zogu i Zi, Ferluti, Laprakë, Don Bosko', '€1,530', '+107%', '93,600-113,000'], facts: ['DATA-KB2-TIRANA-0002', 'DATA-KB2-TIRANA-0003']},
            ],
            methodology:
              'Averages: Keydata index published by Monitor and reprinted by Shekulli on 4 August 2026; the unit 1 figure equals the city average and may be a misprint. Landmarks: the zone list in the same article. Reference prices: VKM 132/2018 Annex 1 a.2 as replaced by VKM 457/2023, lowest and highest zone of each unit (92.02 ALL = €1).',
          },
        ],
      },
      {
        key: 'RENTS',
        heading: 'Rents by area',
        tables: [
          {
            id: 'RENTS',
            title: 'Average asking rents in Tirana, H1 2026',
            columns: ['Area', '1+1, € a month', '2+1, € a month'],
            rows: [
              {cells: ['City average', '590', '954'], facts: ['DATA-KB2-TIRANA-0004', 'DATA-RENT-TIRANA-0015']},
              {cells: ['Near the Air Albania stadium', '800', '-'], facts: ['DATA-KB2-TIRANA-0004']},
              {cells: ['Ex-Blloku', '700', '1,100'], facts: ['DATA-KB2-TIRANA-0004']},
              {cells: ['Zogu i Zi', '620', '900'], facts: ['DATA-KB2-TIRANA-0004']},
              {cells: ['Selman Stërmasi', '570', '-'], facts: ['DATA-KB2-TIRANA-0004']},
              {cells: ['Astir', '550', '665'], facts: ['DATA-KB2-TIRANA-0004']},
              {cells: ['Myslym Shyri', '-', '1,400'], facts: ['DATA-KB2-TIRANA-0004']},
              {cells: ['Rruga e Elbasanit', '-', '1,250'], facts: ['DATA-KB2-TIRANA-0004']},
              {cells: ['Fresku', '-', '450'], facts: ['DATA-KB2-TIRANA-0004']},
            ],
            methodology: 'Century 21 Albania data analysed for Monitor, January-June 2026. A dash means the article gave no figure for that type.',
          },
        ],
      },
      {
        key: 'YIELDS',
        heading: 'What a flat earns before costs',
        body: 'Cheaper units yield more on paper, because rents vary less across the city than prices do: an ex-Blloku flat costs almost twice as much per m² as one in Zogu i Zi, but its 1+1 rent is only 13% higher.',
        tables: [
          {
            id: 'YIELD',
            title: 'Gross rental yield, Domlivo estimate',
            columns: ['Example', 'Price', 'Rent a year', 'Gross yield'],
            rows: [
              {cells: ['1+1, 55 m², city average', '€116,380', '€7,080', '6.1%'], facts: ['DATA-KB2-TIRANA-CALC-0001']},
              {cells: ['1+1, 55 m², ex-Blloku', '€162,910', '€8,400', '5.2%'], facts: ['DATA-KB2-TIRANA-CALC-0001']},
              {cells: ['1+1, 55 m², Zogu i Zi (unit 11)', '€84,150', '€7,440', '8.8%'], facts: ['DATA-KB2-TIRANA-CALC-0001']},
              {cells: ['2+1, 85 m², Myslym Shyri (unit 10)', '€213,775', '€16,800', '7.9%'], facts: ['DATA-KB2-TIRANA-CALC-0001']},
            ],
            methodology:
              'Price = unit average × assumed size; rent = Century 21 zone rent × 12. The two series come from different sources, so read the yields as a rough comparison, before the 15% tax on rent, fees and empty months.',
            confidence: 'ESTIMATE',
          },
        ],
      },
      {
        key: 'GETTING_AROUND',
        heading: 'Getting around and what is planned',
        body:
          '- Tirana has no metro or tram. The planned upgrade is an electric bus rapid transit network of three lines, €110.26 million with EU and German support: Kinostudio-Kombinat (17 km), the ring (14 km) and Tirana e Re (21 km).\n- The rebuilt railway to Durrës and the airport is due to carry passengers from the end of 2027. Its stations include Kashar and Tirana; an extension of about 4 km to the city centre is still to be tendered.\n- The Domlivo index has only {{count:tirana}} Tirana flats with a usable price ({{date:tirana}}), too few for a price of our own, so this page relies on Keydata and Century 21.',
      },
    ],
    faq: [
      {q: 'What is the most expensive area of Tirana?', a: 'Ex-Blloku: €2,962/m² on average in June 2026, and the highest official reference price in the city, 228,400 ALL/m² (zone 5/1).'},
      {q: 'What is the cheapest area of Tirana to buy in?', a: 'Among the city units, unit 11 (Zogu i Zi, Laprakë) at €1,530/m² and unit 6 (Kombinat, Yzberisht) at €1,687/m² in June 2026. Outer units such as Kashar are not in the index.'},
      {q: 'Where are rents highest in Tirana?', a: 'For a 1+1, near the Air Albania stadium (€800 a month) and in ex-Blloku (€700), against a city average of €590 in the first half of 2026. For a 2+1, Myslym Shyri (€1,400).'},
      {q: 'Does Tirana have a metro?', a: 'No. The plan is an electric bus rapid transit network of three lines; the train to Durrës and the airport is due at the end of 2027.'},
    ],
    facts: ['DATA-KB2-TIRANA-0001', 'DATA-KB2-TIRANA-0005', 'DATA-KB2-TIRANA-0006', 'DATA-KB2-RAIL-0006', 'DATA-KB2-RAIL-0003'],
    sources: ['KB-F4-2026-009', 'KB-F4-2026-010', 'KB-F4-2026-011', 'KB-F4-2026-012', 'KB-F4-2026-013', 'KB-F4-2026-014', 'KB-ALB-2026-012'],
    gaps: [
      {id: 'GAP-TIRANA-NEIGHBOURHOOD-SALES', text: 'No registered sale prices by neighbourhood are published; the unit averages come from the Keydata index, whose method is not public.', priority: 'HIGH'},
      {id: 'GAP-TIRANA-UNIT1', text: 'The unit 1 average equals the city average in the published table and may be a misprint.', priority: 'LOW'},
      {id: 'GAP-TIRANA-DOMLIVO-SAMPLE', text: 'Domlivo lists too few Tirana flats to give a price of its own.', priority: 'MEDIUM'},
    ],
    related: ['KB-TIRANA-VS-DURRES', 'KB-MARKET-2026', 'KB-TRAIN-TIRANA-DURRES'],
    seoTitle: 'Best areas to buy an apartment in Tirana: prices by area (2026)',
    seoDescription:
      'Tirana by administrative unit: average €/m² (ex-Blloku €2,962, Zogu i Zi €1,530), official reference prices, rents by area and gross yields, with sources.',
    reviewMonths: 6,
  },

  // ------------------------------------------------------------------ Sarandë
  {
    id: 'KB-SARANDA-PRICES',
    slug: 'how-fast-are-property-prices-rising-in-sarande',
    group: 'geography',
    category: 'property_prices',
    tags: ['sarande', 'ksamil', 'prices', 'tourism'],
    citySlug: 'sarande',
    title: 'How fast are property prices rising in Sarandë?',
    summary:
      'Nobody publishes an official price series for Sarandë, so growth can only be traced through asking prices: agents quoted €2,000-3,000/m² for new first-line flats in 2019, and in May 2024 the Albanian Builders Association put new builds at €2,200-2,500/m² and beachfront flats above €3,000/m². Demand grew fast: Butrint had 295,152 visitors in 2025, 47% more than in 2024, and active Airbnb listings in the Sarandë area rose 41% in the year to September 2026.',
    dataPeriod: '2019-2026',
    confidence: 'LOW',
    sections: [
      {
        key: 'PRICES',
        heading: 'What the price data shows',
        body:
          'The Bank of Albania survey does not report Sarandë separately. Its national index rose 41.7% in the year to the first half of 2025 and 28% in the year to the second half, when the coast drove the rise, and was flat in the first half of 2026.',
        tables: [
          {
            id: 'PRICE_POINTS',
            title: 'Sarandë apartment prices over time',
            columns: ['When', 'What was measured', '€/m²', 'Source'],
            rows: [
              {cells: ['2019', 'New first-line flats, asking', '2,000-3,000', 'Agents via Tirana Times'], facts: ['DATA-KB2-SARANDE-0003']},
              {cells: ['2024', 'Older flats / new builds / beachfront', '1,500 / 2,200-2,500 / over 3,000', 'Albanian Builders Association via Monitor'], facts: ['DATA-KB2-SARANDE-0002']},
              {cells: ['September 2026', 'Flats for sale on Century 21 Albania, 9 listings', 'median 2,149 (1,318-3,390)', 'Century 21 listings'], facts: ['DATA-PROPERTY-SARANDA-0005']},
              {cells: ['Live', 'Flats for sale on Domlivo', 'median {{median:sarande}} ({{count:sarande}} flats, indicative)', 'Domlivo Price Index']},
            ],
            methodology: 'All figures are asking prices or agents’ quotes from different samples. They show the price level at each date, not a measured rate of growth.',
            confidence: 'LOW',
          },
        ],
      },
      {
        key: 'OFFICIAL',
        heading: 'The official reference price',
        body:
          'The reference price is the floor the tax office uses when a flat is sold. For Sarandë it is still a single 2016-level figure of 56,000 ALL/m², about €609. A Ministry of Finance draft from July 2025 would split the town into five zones; it had not been approved by March 2026, and we found no later adoption.',
        tables: [
          {
            id: 'REF',
            title: 'Reference price for flats in Sarandë: in force and draft',
            columns: ['Status', 'ALL/m²', 'About €/m²', 'Against the price in force'],
            rows: [
              {cells: ['In force (VKM 132/2018)', '56,000', '609', '-'], facts: ['DATA-KB2-REF-0001']},
              {cells: ['Draft, zones 1 and 3', '100,000', '1,087', '+79%'], facts: ['DATA-KB2-SARANDE-0001']},
              {cells: ['Draft, zones 2 and 5', '80,000', '869', '+43%'], facts: ['DATA-KB2-SARANDE-0001']},
              {cells: ['Draft, zone 4', '65,000', '706', '+16%'], facts: ['DATA-KB2-SARANDE-0001']},
            ],
            methodology: '92.02 ALL = €1. The published draft does not name the streets in each zone.',
          },
        ],
      },
      {
        key: 'DEMAND',
        heading: 'The demand behind the prices',
        tables: [
          {
            id: 'DEMAND',
            title: 'Visitors and holiday lets in Sarandë',
            columns: ['Indicator', 'Figure', 'Period', 'Source'],
            rows: [
              {cells: ['Butrint National Park visitors', '295,152 (2024: 200,570)', '2025', 'ATA'], facts: ['DATA-KB2-TOURISM-0003']},
              {cells: ['Passengers through Sarandë port', '497,285 (Q3 2024: 392,067)', 'Q3 2025', 'INSTAT'], facts: ['DATA-KB2-TOURISM-0004']},
              {cells: ['Active Airbnb listings, Sarandë area', '2,209 (+41% a year), occupancy 42.2%', 'Oct 2025 - Sep 2026', 'AirROI'], facts: ['DATA-KB2-STR-0001']},
              {cells: ['Active Airbnb listings, Sarandë', '2,782, median occupancy 59%', 'Sep 2025 - Aug 2026', 'Airbtics'], facts: ['DATA-KB2-STR-0002']},
            ],
            methodology: 'AirROI and Airbtics draw the area differently and count listings differently; read the two as a range.',
          },
        ],
      },
      {
        key: 'CHECKS',
        heading: 'What to check before buying',
        body:
          '- Supply is growing fast. AirROI counts 41% more active listings than a year earlier, while average revenue rose 11%, so more flats compete for the same guests.\n- Illegal building is being enforced. The territorial inspectorate demolished 3 buildings in Ksamil in 2025, and in May 2026 prosecutors issued arrest warrants over illegal construction in Sarandë and Ksamil. Check the building permit and the ownership certificate before paying a deposit.\n- Vlora airport, the nearest one under construction, has no flights yet; visitors reach Sarandë by road or through its port.',
      },
    ],
    faq: [
      {q: 'Are property prices in Sarandë rising?', a: 'Asking prices for new first-line flats were €2,000-3,000/m² in 2019; in 2024 new builds were quoted at €2,200-2,500/m² and beachfront flats above €3,000. No official series measures the rate of growth.'},
      {q: 'How much does a flat in Sarandë cost per m²?', a: 'Century 21 Albania listings had a median of €2,149/m² in September 2026, on a sample of nine; new beachfront flats were quoted above €3,000/m² in 2024.'},
      {q: 'Will the new reference prices raise taxes in Sarandë?', a: 'If the July 2025 draft is approved, the floor for tax on a sale would rise from 56,000 ALL/m² to 65,000-100,000 ALL/m², depending on the zone. It was not in force in autumn 2026.'},
      {q: 'Is demand for holiday lets growing?', a: 'Visitors are: Butrint had 47% more visitors in 2025 than in 2024. Listings grew too, by 41% in a year, so competition between hosts is rising as well.'},
    ],
    facts: ['DATA-PROPERTY-ALB-0005', 'DATA-KB2-HPI-0002', 'DATA-KB2-HPI-0001', 'DATA-KB2-SARANDE-0004', 'DATA-KB2-VLORA-0004'],
    sources: ['KB-F4-2026-014', 'KB-F4-2026-015', 'KB-F4-2026-016', 'KB-F4-2026-017', 'KB-F4-2026-018', 'KB-F4-2026-019', 'KB-F4-2026-020', 'KB-F4-2026-021', 'KB-F4-2026-022', 'KB-F4-2026-023', 'KB-F4-2026-024', 'AIRBNB-SARANDE-2026-002', 'KB-ALB-2026-012'],
    gaps: [
      {id: 'GAP-SARANDE-SERIES', text: 'No official or consistent price series exists for Sarandë or Ksamil.', priority: 'HIGH'},
      {id: 'GAP-SARANDE-DRAFT', text: 'Whether the draft reference prices were approved after March 2026 could not be checked in the Official Gazette.', priority: 'MEDIUM'},
      {id: 'GAP-SARANDE-DOMLIVO', text: 'Domlivo lists too few Sarandë flats for a headline price.', priority: 'MEDIUM'},
    ],
    related: ['KB-INVEST-REGIONS', 'KB-LEGALISATION-CHECK', 'KB-BUY-POLAND'],
    seoTitle: 'Sarandë property prices: how fast are they rising? (2026)',
    seoDescription:
      'Sarandë and Ksamil prices per m² from 2019 to 2026, the official reference price (56,000 ALL in force, draft up to 100,000), tourism and Airbnb growth, with sources.',
    reviewMonths: 6,
    tr: {
      pl: {
        title: 'Jak szybko rosną ceny nieruchomości w Sarandzie?',
        summary:
          'Nikt nie publikuje oficjalnego indeksu cen dla Sarandy, więc wzrost widać tylko w cenach ofertowych: w 2019 roku pośrednicy podawali 2000-3000 €/m² za nowe mieszkania w pierwszej linii, a w maju 2024 roku Albańskie Stowarzyszenie Budowlańców wyceniało nowe budynki na 2200-2500 €/m², a mieszkania przy plaży na ponad 3000 €/m². Popyt rósł szybko: park Butrint odwiedziło w 2025 roku 295 152 osób, o 47% więcej niż w 2024, a liczba aktywnych ofert Airbnb w okolicy Sarandy wzrosła o 41% w ciągu roku do września 2026.',
        seoTitle: 'Ceny nieruchomości w Sarandzie: jak szybko rosną? (2026)',
        seoDescription:
          'Ceny za m² w Sarandzie i Ksamilu od 2019 do 2026, oficjalna cena referencyjna (56 000 ALL obecnie, projekt do 100 000), wzrost turystyki i Airbnb, ze źródłami.',
        sections: {
          PRICES: {
            heading: 'Co pokazują dane o cenach',
            body:
              'Badanie Banku Albanii nie podaje osobno danych dla Sarandy. Jego indeks krajowy wzrósł o 41,7% rok do roku w pierwszym półroczu 2025 i o 28% w drugim, kiedy wzrost napędzało wybrzeże, a w pierwszym półroczu 2026 się nie zmienił.',
            tables: {
              PRICE_POINTS: {
                title: 'Ceny mieszkań w Sarandzie w czasie',
                columns: ['Kiedy', 'Co mierzono', '€/m²', 'Źródło'],
                rows: [
                  ['2019', 'Nowe mieszkania w pierwszej linii, ceny ofertowe', '', 'Pośrednicy, za Tirana Times'],
                  ['2024', 'Starsze mieszkania / nowe budynki / przy plaży', '1500 / 2200-2500 / ponad 3000', 'Albańskie Stowarzyszenie Budowlańców, za Monitor'],
                  ['Wrzesień 2026', 'Mieszkania na sprzedaż w Century 21 Albania, 9 ofert', 'mediana 2149 (1318-3390)', 'Oferty Century 21'],
                  ['Na żywo', 'Mieszkania na sprzedaż w Domlivo', 'mediana {{median:sarande}} ({{count:sarande}} mieszkań, orientacyjnie)', 'Indeks cen Domlivo'],
                ],
                methodology: 'Wszystkie liczby to ceny ofertowe lub wyceny pośredników z różnych prób. Pokazują poziom cen w danym momencie, a nie zmierzone tempo wzrostu.',
              },
            },
          },
          OFFICIAL: {
            heading: 'Oficjalna cena referencyjna',
            body:
              'Cena referencyjna to minimum, od którego urząd skarbowy liczy podatek przy sprzedaży mieszkania. Dla Sarandy wciąż obowiązuje jedna stawka z 2016 roku: 56 000 ALL/m², około 609 €. Projekt Ministerstwa Finansów z lipca 2025 roku dzieli miasto na pięć stref; do marca 2026 nie został przyjęty i nie znaleźliśmy późniejszej decyzji.',
            tables: {
              REF: {
                title: 'Cena referencyjna mieszkań w Sarandzie: obowiązująca i projektowana',
                columns: ['Status', 'ALL/m²', 'Około €/m²', 'Względem obecnej ceny'],
                rows: [
                  ['Obowiązuje (VKM 132/2018)', '', '', ''],
                  ['Projekt, strefy 1 i 3', '', '', ''],
                  ['Projekt, strefy 2 i 5', '', '', ''],
                  ['Projekt, strefa 4', '', '', ''],
                ],
                methodology: '92,02 ALL = 1 €. Opublikowany projekt nie wymienia ulic w poszczególnych strefach.',
              },
            },
          },
          DEMAND: {
            heading: 'Popyt, który stoi za cenami',
            tables: {
              DEMAND: {
                title: 'Turyści i najem krótkoterminowy w Sarandzie',
                columns: ['Wskaźnik', 'Wartość', 'Okres', 'Źródło'],
                rows: [
                  ['Odwiedzający Park Narodowy Butrint', '295 152 (2024: 200 570)', '2025', 'ATA'],
                  ['Pasażerowie w porcie w Sarandzie', '497 285 (III kw. 2024: 392 067)', 'III kw. 2025', 'INSTAT'],
                  ['Aktywne oferty Airbnb, okolice Sarandy', '2209 (+41% rok do roku), obłożenie 42,2%', 'X 2025 - IX 2026', 'AirROI'],
                  ['Aktywne oferty Airbnb, Saranda', '2782, mediana obłożenia 59%', 'IX 2025 - VIII 2026', 'Airbtics'],
                ],
                methodology: 'AirROI i Airbtics inaczej wyznaczają obszar i inaczej liczą oferty; traktuj obie liczby jako przedział.',
              },
            },
          },
          CHECKS: {
            heading: 'Co sprawdzić przed zakupem',
            body:
              '- Podaż szybko rośnie. AirROI liczy o 41% więcej aktywnych ofert niż rok wcześniej, a średni przychód wzrósł o 11%, więc więcej mieszkań walczy o tych samych gości.\n- Nielegalne budownictwo jest ścigane. Inspektorat ochrony terytorium zburzył w 2025 roku 3 budynki w Ksamilu, a w maju 2026 prokuratura wydała nakazy aresztowania w sprawie nielegalnych budów w Sarandzie i Ksamilu. Przed wpłatą zaliczki sprawdź pozwolenie na budowę i zaświadczenie o własności.\n- Lotnisko we Wlorze, najbliższe budowane, wciąż nie obsługuje lotów; do Sarandy dojeżdża się drogą albo przypływa do portu.',
          },
        },
        faq: [
          {q: 'Czy ceny nieruchomości w Sarandzie rosną?', a: 'Ceny ofertowe nowych mieszkań w pierwszej linii wynosiły w 2019 roku 2000-3000 €/m²; w 2024 roku nowe budynki wyceniano na 2200-2500 €/m², a mieszkania przy plaży na ponad 3000 €. Żaden oficjalny indeks nie mierzy tempa wzrostu.'},
          {q: 'Ile kosztuje metr kwadratowy mieszkania w Sarandzie?', a: 'Oferty Century 21 Albania miały we wrześniu 2026 medianę 2149 €/m² na próbie dziewięciu mieszkań; nowe mieszkania przy plaży wyceniano w 2024 roku na ponad 3000 €/m².'},
          {q: 'Czy nowe ceny referencyjne podniosą podatki w Sarandzie?', a: 'Jeśli projekt z lipca 2025 zostanie przyjęty, minimum do opodatkowania sprzedaży wzrośnie z 56 000 ALL/m² do 65 000-100 000 ALL/m², zależnie od strefy. Jesienią 2026 projekt nie obowiązywał.'},
          {q: 'Czy rośnie popyt na najem wakacyjny?', a: 'Turystów przybywa: Butrint odwiedziło w 2025 roku o 47% więcej osób niż w 2024. Ofert też przybyło, o 41% w ciągu roku, więc rośnie także konkurencja między wynajmującymi.'},
        ],
        gaps: [
          'Nie istnieje oficjalny ani spójny indeks cen dla Sarandy i Ksamilu.',
          'Nie udało się sprawdzić w dzienniku urzędowym, czy projekt cen referencyjnych przyjęto po marcu 2026.',
          'Domlivo ma zbyt mało ofert z Sarandy, by podać własną cenę.',
        ],
      },
    },
  },

  // ------------------------------------------------------------------ regions
  {
    id: 'KB-INVEST-REGIONS',
    slug: 'most-popular-regions-for-property-investment-in-albania',
    group: 'geography',
    category: 'investment',
    tags: ['investment', 'regions', 'tirana', 'durres', 'vlore', 'sarande'],
    title: 'Which regions of Albania are most popular with property investors?',
    summary:
      "Tirana, the Durrës coast and the south around Vlorë and Sarandë. Deloitte's Property Index 2025 put average asking prices at €2,400/m² in Vlorë, €2,000 in Tirana and €1,350 in Durrës (2024 data), and the Bank of Albania's survey for the first half of 2026 found coastal homes selling fastest, in 8.2 months against 9.7 in Tirana, with about 20% of all homes bought by non-residents.",
    dataPeriod: '2024-2026',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'REGIONS',
        heading: 'The main markets compared',
        tables: [
          {
            id: 'REGIONS',
            title: 'Where buyers look',
            columns: ['Region', 'Average asking price, 2024 (Deloitte)', 'What drives demand', 'Flats listed on Domlivo (live)'],
            rows: [
              {cells: ['Tirana', '€2,000/m², +25% a year', 'The capital: jobs and tenants all year; 1+1 rent €590 a month in H1 2026', '{{count:tirana}}'], facts: ['DATA-PROPERTY-ALB-0018', 'DATA-RENT-TIRANA-0015']},
              {cells: ['Durrës and its coast', '€1,350/m²', 'The nearest beach to Tirana and the largest supply of flats on the coast', '{{count:durres}}, median €{{median:durres}}/m²'], facts: ['DATA-PROPERTY-ALB-0018']},
              {cells: ['Vlorë', '€2,400/m², +25% a year', 'Seafront city on the south coast; its airport is built but not open', '{{count:vlore}}'], facts: ['DATA-PROPERTY-ALB-0018', 'DATA-KB2-VLORA-0004']},
              {cells: ['Sarandë and Ksamil', 'not covered', 'Butrint (295,152 visitors in 2025) and 2,200-2,800 Airbnb listings', '{{count:sarande}}'], facts: ['DATA-KB2-TOURISM-0003', 'DATA-KB2-STR-0001', 'DATA-KB2-STR-0002']},
              {cells: ['Shëngjin', 'not covered', 'North coast; official reference price 56,000 ALL/m², the same as Sarandë', '{{count:shengjin}}'], facts: ['DATA-KB2-REF-0001']},
            ],
            methodology:
              "Deloitte figures are asking prices from its Property Index 2025, the first edition to include Albania. Domlivo counts are flats and studios with a usable price, recomputed hourly; a sample under 30 is indicative.",
          },
        ],
      },
      {
        key: 'SIGNALS',
        heading: 'What the official data says about demand',
        tables: [
          {
            id: 'DEMAND_SIGNALS',
            title: 'Demand indicators',
            columns: ['Indicator', 'Figure', 'Period', 'Source'],
            rows: [
              {cells: ['Time to sell a home, coast', '8.2 months (9.9 a half-year earlier)', 'H1 2026', 'Bank of Albania survey'], facts: ['DATA-KB2-HPI-0003']},
              {cells: ['Time to sell a home, Tirana', '9.7 months (8.1 a half-year earlier)', 'H1 2026', 'Bank of Albania survey'], facts: ['DATA-KB2-HPI-0003']},
              {cells: ['Homes bought by non-residents', 'about 20%, about 85% of them EU citizens', 'H1 2026', 'Bank of Albania survey'], facts: ['DATA-KB2-HPI-0004']},
              {cells: ['Arrivals of foreign citizens', '12,466,038 (+6.6%)', '2025', 'INSTAT'], facts: ['DATA-KB2-TOURISM-0001']},
              {cells: ['Arrivals of foreign citizens', '9,443,700 (+5.3%)', 'Jan-Aug 2026', 'INSTAT'], facts: ['DATA-KB2-TOURISM-0002']},
              {cells: ['Passengers at Tirana airport', '11.6 million (+8.7%)', '2025', 'Tirana International Airport'], facts: ['DATA-TOURISM-0006']},
            ],
          },
        ],
      },
      {
        key: 'WHO_FOR',
        heading: 'Which region suits which plan',
        body:
          '- Letting to tenants all year: Tirana. Rents are higher than on the coast, and the city has jobs and universities.\n- A flat by the sea within an hour of the capital: Durrës. It has the most listings, so prices can be compared district by district.\n- Holiday letting in the south: Vlorë and Sarandë. Prices per m² are higher, and the nearest international airport in service is still Tirana.\n- Taxes are national and the same everywhere. The official reference price, the floor for the tax on a later sale, differs by town: 56,000 ALL/m² in Sarandë and Shëngjin, 67,500 in Durrës and up to 228,400 in central Tirana.',
      },
    ],
    faq: [
      {q: 'Where do foreigners buy property in Albania?', a: 'Mostly in Tirana and along the coast from Durrës to Sarandë. The Bank of Albania survey found about 20% of homes sold in the first half of 2026 went to non-residents, mostly EU citizens, and coastal homes sold fastest.'},
      {q: 'Which Albanian city is most expensive?', a: 'Among the cities Deloitte covers, Vlorë: €2,400/m² on average in 2024, against €2,000 in Tirana and €1,350 in Durrës.'},
      {q: 'Which region has the most flats for sale?', a: 'Durrës, by a wide margin, in the Domlivo index: {{count:durres}} flats, against {{count:tirana}} in Tirana.'},
      {q: 'Is tourism to Albania still growing?', a: 'Yes, more slowly: arrivals of foreign citizens rose 6.6% in 2025 and 5.3% in January-August 2026.'},
    ],
    sources: ['PROPERTY-ALB-2026-004', 'KB-F4-2026-001', 'KB-F4-2026-007', 'KB-F4-2026-008', 'KB-F4-2026-014', 'TOURISM-ALB-2026-009', 'KB-ALB-2026-012'],
    gaps: [
      {id: 'GAP-REGION-SALES', text: 'No official breakdown of sales or of foreign purchases by region (ASHK or INSTAT) was found.', priority: 'HIGH'},
      {id: 'GAP-DELOITTE-2026', text: "Deloitte's 2026 edition with 2025 data was not found; Sarandë and Shëngjin are not covered.", priority: 'MEDIUM'},
    ],
    related: ['KB-MARKET-2026', 'KB-SARANDA-PRICES', 'KB-DURRES-VS-VLORE'],
    seoTitle: 'Best regions to invest in property in Albania (2026 data)',
    seoDescription:
      'Tirana, Durrës, Vlorë, Sarandë and Shëngjin compared: asking prices per m², time to sell, foreign buyers, tourism and live listing counts, with sources.',
    reviewMonths: 6,
    tr: {
      pl: {
        title: 'Które regiony Albanii są najpopularniejsze wśród inwestorów w nieruchomości?',
        summary:
          'Tirana, wybrzeże Durrës i południe wokół Wlory i Sarandy. Deloitte Property Index 2025 podał średnie ceny ofertowe 2400 €/m² we Wlorze, 2000 € w Tiranie i 1350 € w Durrës (dane za 2024), a badanie Banku Albanii za pierwsze półrocze 2026 wykazało, że najszybciej sprzedają się mieszkania na wybrzeżu, w 8,2 miesiąca wobec 9,7 w Tiranie, a około 20% wszystkich mieszkań kupili nierezydenci.',
        seoTitle: 'Najlepsze regiony do inwestycji w nieruchomości w Albanii (2026)',
        seoDescription:
          'Tirana, Durrës, Wlora, Saranda i Shëngjin w porównaniu: ceny ofertowe za m², czas sprzedaży, kupujący z zagranicy, turystyka i liczba ofert na żywo, ze źródłami.',
        sections: {
          REGIONS: {
            heading: 'Główne rynki w porównaniu',
            tables: {
              REGIONS: {
                title: 'Gdzie szukają kupujący',
                columns: ['Region', 'Średnia cena ofertowa, 2024 (Deloitte)', 'Co napędza popyt', 'Mieszkania w Domlivo (na żywo)'],
                rows: [
                  ['Tirana', '2000 €/m², +25% rok do roku', 'Stolica: praca i najemcy przez cały rok; czynsz za 1+1 590 € miesięcznie w I półroczu 2026', ''],
                  ['Durrës i okolice', '1350 €/m²', 'Najbliższa plaża od Tirany i największa podaż mieszkań na wybrzeżu', '{{count:durres}}, mediana {{median:durres}} €/m²'],
                  ['Wlora', '2400 €/m², +25% rok do roku', 'Nadmorskie miasto na południu; lotnisko zbudowane, ale nieczynne', ''],
                  ['Saranda i Ksamil', 'brak danych', 'Butrint (295 152 odwiedzających w 2025) i 2200-2800 ofert Airbnb', ''],
                  ['Shëngjin', 'brak danych', 'Północne wybrzeże; oficjalna cena referencyjna 56 000 ALL/m², tak jak w Sarandzie', ''],
                ],
                methodology:
                  'Dane Deloitte to ceny ofertowe z Property Index 2025, pierwszego wydania obejmującego Albanię. Liczby Domlivo to mieszkania i kawalerki z ceną za m², przeliczane co godzinę; próba poniżej 30 jest orientacyjna.',
              },
            },
          },
          SIGNALS: {
            heading: 'Co mówią oficjalne dane o popycie',
            tables: {
              DEMAND_SIGNALS: {
                title: 'Wskaźniki popytu',
                columns: ['Wskaźnik', 'Wartość', 'Okres', 'Źródło'],
                rows: [
                  ['Czas sprzedaży mieszkania, wybrzeże', '8,2 miesiąca (pół roku wcześniej 9,9)', 'I półr. 2026', 'Badanie Banku Albanii'],
                  ['Czas sprzedaży mieszkania, Tirana', '9,7 miesiąca (pół roku wcześniej 8,1)', 'I półr. 2026', 'Badanie Banku Albanii'],
                  ['Mieszkania kupione przez nierezydentów', 'około 20%, z tego około 85% obywatele UE', 'I półr. 2026', 'Badanie Banku Albanii'],
                  ['Przyjazdy cudzoziemców', '12 466 038 (+6,6%)', '2025', 'INSTAT'],
                  ['Przyjazdy cudzoziemców', '9 443 700 (+5,3%)', 'I-VIII 2026', 'INSTAT'],
                  ['Pasażerowie lotniska w Tiranie', '11,6 mln (+8,7%)', '2025', 'Port lotniczy Tirana'],
                ],
              },
            },
          },
          WHO_FOR: {
            heading: 'Który region do jakiego planu',
            body:
              '- Najem długoterminowy przez cały rok: Tirana. Czynsze są wyższe niż na wybrzeżu, a w mieście są praca i uczelnie.\n- Mieszkanie nad morzem godzinę od stolicy: Durrës. Ma najwięcej ofert, więc ceny można porównać dzielnica po dzielnicy.\n- Najem wakacyjny na południu: Wlora i Saranda. Ceny za m² są wyższe, a najbliższe czynne lotnisko międzynarodowe to wciąż Tirana.\n- Podatki są krajowe i wszędzie takie same. Oficjalna cena referencyjna, czyli minimum do podatku przy późniejszej sprzedaży, zależy od miasta: 56 000 ALL/m² w Sarandzie i Shëngjinie, 67 500 w Durrës i do 228 400 w centrum Tirany.',
          },
        },
        faq: [
          {q: 'Gdzie cudzoziemcy kupują nieruchomości w Albanii?', a: 'Głównie w Tiranie i na wybrzeżu od Durrës do Sarandy. Według badania Banku Albanii około 20% mieszkań sprzedanych w pierwszym półroczu 2026 kupili nierezydenci, głównie obywatele UE, a najszybciej sprzedawały się mieszkania na wybrzeżu.'},
          {q: 'Które albańskie miasto jest najdroższe?', a: 'Spośród miast objętych raportem Deloitte: Wlora, średnio 2400 €/m² w 2024 roku, wobec 2000 € w Tiranie i 1350 € w Durrës.'},
          {q: 'Gdzie jest najwięcej mieszkań na sprzedaż?', a: 'W Durrës, z dużą przewagą, w indeksie Domlivo: {{count:durres}} mieszkań wobec {{count:tirana}} w Tiranie.'},
          {q: 'Czy turystyka w Albanii nadal rośnie?', a: 'Tak, wolniej: przyjazdów cudzoziemców było o 6,6% więcej w 2025 roku i o 5,3% więcej w okresie styczeń-sierpień 2026.'},
        ],
        gaps: [
          'Nie znaleziono oficjalnego podziału sprzedaży ani zakupów przez cudzoziemców według regionów (ASHK lub INSTAT).',
          'Nie znaleziono wydania Deloitte 2026 z danymi za 2025; Saranda i Shëngjin nie są w nim ujęte.',
        ],
      },
    },
  },
]
