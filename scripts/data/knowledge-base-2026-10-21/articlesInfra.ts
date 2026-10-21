import type {ArticleSpec} from './types'

/**
 * Infrastructure and rules: the Tirana-Durrës railway, Vlora airport and the
 * registration rules for holiday letting. Dates are the latest official or
 * press statements found on 2026-10-21; every opening date here has slipped
 * before, and the pages say so.
 */

export const ARTICLES_INFRA: ArticleSpec[] = [
  // ------------------------------------------------------------------ railway
  {
    id: 'KB-TRAIN-TIRANA-DURRES',
    slug: 'tirana-durres-train-when-will-it-run-property',
    group: 'geography',
    category: 'forecast',
    tags: ['railway', 'tirana', 'durres', 'infrastructure'],
    title: 'When will the Tirana-Durrës train run, and what does it mean for property?',
    summary:
      "Not before the end of 2027. In July 2026 the infrastructure minister told parliament the civil works were complete and the stations still being built, and the ministry's search for an operator plans passenger service for the fourth quarter of 2027. The EBRD expects 22 minutes from Tirana to Durrës and 12 minutes from Tirana to the airport; the project's cost has passed €118 million (ACQJ, May 2026).",
    dataPeriod: '2021-2026',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'PROJECT',
        heading: 'The project in figures',
        tables: [
          {
            id: 'PROJECT',
            title: 'Tirana-Durrës railway with the airport branch',
            columns: ['Item', 'Figure', 'Source'],
            rows: [
              {cells: ['Route', 'Tirana-Durrës 37.9 km; Tirana-airport 15.4 km', 'Ministry operator call, via Monitor'], facts: ['DATA-KB2-RAIL-0005']},
              {cells: ['Works', 'more than 34 km of line rebuilt and about 5 km of new track to the airport', 'EBRD, 2021'], facts: ['DATA-KB2-RAIL-0001']},
              {cells: ['Journey time', 'Tirana-Durrës 22 minutes, Tirana-airport 12 minutes, at up to 100 km/h', 'EBRD, 2022'], facts: ['DATA-KB2-RAIL-0002']},
              {cells: ['Funding at the start', 'EBRD loan €36.9 million, EU grant up to €35.5 million, bilateral grants €2.75 million', 'EBRD, 2021'], facts: ['DATA-KB2-RAIL-0001']},
              {cells: ['Cost now', 'above €118 million, against a winning bid of €69.6 million in 2020', 'ACQJ, May 2026'], facts: ['DATA-KB2-RAIL-0003']},
              {cells: ['Stations', 'eight built or renovated, among them Kashar, Vorë, Sukth, Shkozet, Durrës and Tirana, for €10.2 million', 'Shqiptarja, 2025'], facts: ['DATA-KB2-RAIL-0006']},
              {cells: ['Operator', 'tender planned for Q4 2026; a 10-15 year contract with 4-6 electric trains', 'Monitor, June 2026'], facts: ['DATA-KB2-RAIL-0005']},
            ],
          },
        ],
      },
      {
        key: 'TIMELINE',
        heading: 'Timeline',
        tables: [
          {
            id: 'TIMELINE',
            title: 'From the start of works to the planned opening',
            columns: ['Date', 'Step', 'Source'],
            rows: [
              {cells: ['2021', 'Works start', 'ACQJ'], facts: ['DATA-KB2-RAIL-0003']},
              {cells: ['2024-2026', 'Earlier completion dates missed', 'ATA'], facts: ['DATA-FORECAST-0007']},
              {cells: ['Q1 2026', 'Planned handover of the stations, missed', 'Shqiptarja'], facts: ['DATA-KB2-RAIL-0006']},
              {cells: ['27 May - 26 July 2026', 'Call for a private operator', 'Monitor'], facts: ['DATA-KB2-RAIL-0005']},
              {cells: ['16 July 2026', 'Minister: civil works complete, stations under construction', 'Albanian Daily News'], facts: ['DATA-KB2-RAIL-0004']},
              {cells: ['Q4 2027', 'Planned start of passenger service', 'Monitor; Albanian Daily News'], facts: ['DATA-KB2-RAIL-0005', 'DATA-KB2-RAIL-0004']},
              {cells: ['Not yet tendered', 'Extension of about 4 km to central Tirana', 'ACQJ'], facts: ['DATA-KB2-RAIL-0003']},
            ],
          },
        ],
      },
      {
        key: 'PROPERTY',
        heading: 'What it can mean for property',
        body:
          'No study has measured a price effect from the railway yet, and the line has missed several opening dates, so treat it as a plan until trains run.\n\nIf it opens as planned:\n- Durrës becomes a 22-minute train ride from Tirana. The Durrës city-centre district has a live median asking price of €{{median:durres/city-center-durres}}/m² ({{count:durres/city-center-durres}} flats, {{date:durres}}), against €{{median:durres}}/m² for Durrës as a whole.\n- Shkozet, Sukth and Vorë get stations between the two cities.\n- Tirana airport is 12 minutes from Tirana by train.\n\nUntil the 4 km extension is built, the Tirana end of the line stops short of the city centre, so check the distance from a flat to the station itself.',
      },
    ],
    faq: [
      {q: 'Is there a train from Tirana to Durrës now?', a: 'No passenger trains run on the rebuilt line yet. The government’s target is the end of 2027.'},
      {q: 'How long will the train from Tirana to Durrës take?', a: '22 minutes, and 12 minutes from Tirana to the airport, according to the EBRD, at speeds of up to 100 km/h.'},
      {q: 'Will the train raise property prices in Durrës?', a: 'Nobody has measured that yet, and the line has missed earlier opening dates. Price a flat on today’s market and treat the train as a possible bonus.'},
      {q: 'Where are the stations?', a: 'Eight stations are being built or renovated, among them Kashar, Vorë, Sukth, Shkozet, Durrës and Tirana, plus the branch to the airport.'},
    ],
    sources: ['KB-F4-2026-025', 'KB-F4-2026-026', 'KB-F4-2026-027', 'KB-F4-2026-028', 'KB-F4-2026-029', 'KB-F4-2026-030', 'FORECAST-2027-010', 'KB-ALB-2026-012'],
    gaps: [
      {id: 'GAP-RAIL-STATIONS', text: 'Exact station sites, including the Tirana terminal, are not given in an official source we could open.', priority: 'MEDIUM'},
      {id: 'GAP-RAIL-FARES', text: 'No fare or timetable has been published.', priority: 'LOW'},
    ],
    related: ['KB-TIRANA-VS-DURRES', 'KB-TIRANA-AREAS', 'KB-SEA-VS-CENTRE-DURRES'],
    seoTitle: 'Tirana-Durrës train: when will it run? Status and property impact (2026)',
    seoDescription:
      'The rebuilt Tirana-Durrës-airport railway: 22 minutes to Durrës, cost above €118 million, passenger service planned for late 2027. Stations, timeline and what it means for buyers.',
    reviewMonths: 6,
  },

  // ------------------------------------------------------------------ Vlora airport
  {
    id: 'KB-VLORA-AIRPORT',
    slug: 'vlora-airport-opening-date-property',
    group: 'geography',
    category: 'forecast',
    tags: ['vlore', 'airport', 'infrastructure'],
    citySlug: 'vlore',
    title: 'When will Vlora airport open, and does it matter for buying in Vlorë?',
    summary:
      'No date is set. As of October 2026 Vlora International Airport has no scheduled flights: the opening once planned for June 2026 slipped, and in August 2026 the government began terminating the concession over missed deadlines and a dispute between its shareholders, which is now before an arbitration court in London. The airport was planned in 2021 with a 3,200 m runway and room for up to 3 million passengers a year, for about €104 million.',
    dataPeriod: '2021-2026',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'AIRPORT',
        heading: 'The airport in figures',
        tables: [
          {
            id: 'AIRPORT',
            title: 'Vlora International Airport',
            columns: ['Item', 'Figure', 'Source'],
            rows: [
              {cells: ['Runway', '3,200 m', 'aeroTELEGRAPH, 2021'], facts: ['DATA-KB2-VLORA-0001']},
              {cells: ['Terminal', '22,000 m²', 'RTSH, 2025'], facts: ['DATA-KB2-VLORA-0002']},
              {cells: ['Planned capacity', 'up to 3 million passengers a year', 'aeroTELEGRAPH, 2021'], facts: ['DATA-KB2-VLORA-0001']},
              {cells: ['Investment', 'about €104 million, 35-year concession', 'aeroTELEGRAPH, 2021'], facts: ['DATA-KB2-VLORA-0001']},
              {cells: ['Certification flight', 'May 2025', 'RTSH'], facts: ['DATA-KB2-VLORA-0002']},
              {cells: ['Status, October 2026', 'not in use, no scheduled flights', 'ShkodraWeb; Vlore Circle'], facts: ['DATA-KB2-VLORA-0004']},
            ],
          },
        ],
      },
      {
        key: 'TIMELINE',
        heading: 'Timeline',
        tables: [
          {
            id: 'TIMELINE',
            title: 'From the concession to the dispute',
            columns: ['Date', 'Event', 'Source'],
            rows: [
              {cells: ['December 2021', 'Concession to Mabco and YDA for 35 years', 'aeroTELEGRAPH'], facts: ['DATA-KB2-VLORA-0001']},
              {cells: ['May 2025', 'First certification flight', 'RTSH'], facts: ['DATA-KB2-VLORA-0002']},
              {cells: ['26 June 2026', 'Planned first route, to Zurich; not flown', 'RTSH; ShkodraWeb'], facts: ['DATA-KB2-VLORA-0002', 'DATA-KB2-VLORA-0004']},
              {cells: ['August 2026', 'The ministry begins terminating the concession', 'Oculus News'], facts: ['DATA-KB2-VLORA-0003']},
              {cells: ['September 2026', 'Mabco asks a London arbitration court for interim measures', 'Albanian Daily News'], facts: ['DATA-KB2-VLORA-0003']},
            ],
          },
        ],
      },
      {
        key: 'PROPERTY',
        heading: 'What it means for buyers in Vlorë',
        body:
          'For buyers in Vlorë the airport is a possible future plus. Today:\n- Vlorë asking prices were the highest of the cities in Deloitte’s Property Index 2025: €2,400/m² on average in 2024, up 25% in a year.\n- The official reference price in Vlorë is 61,800 ALL/m², about €672, a 2016-level figure still in force.\n- Domlivo lists {{count:vlore}} flats in Vlorë ({{date:vlore}}), too few for a price of our own.\n- International visitors fly into Tirana, which handled 11.6 million passengers in 2025.\n\nIf a sales pitch promises flights to Vlorë next season, ask which airline has announced which route.',
      },
    ],
    faq: [
      {q: 'Is Vlora airport open?', a: 'No. As of October 2026 it has no scheduled passenger flights and no confirmed opening date.'},
      {q: 'Why is the opening of Vlora airport delayed?', a: 'Construction deadlines were missed and the shareholders of the concession company, Mabco and 2A Group, are in dispute. The government began terminating the concession in August 2026 and Mabco went to arbitration.'},
      {q: 'Which airport do I use for Vlorë now?', a: 'Tirana International Airport, the only international airport in service in Albania in 2026.'},
      {q: 'Will the airport raise property prices in Vlorë?', a: 'That cannot be measured before it opens. On Deloitte’s figures, Vlorë prices rose 25% in 2024 without it.'},
    ],
    facts: ['DATA-PROPERTY-ALB-0018', 'DATA-KB2-REF-0001', 'DATA-TOURISM-0006'],
    sources: ['KB-F4-2026-031', 'KB-F4-2026-032', 'KB-F4-2026-033', 'KB-F4-2026-034', 'KB-F4-2026-035', 'TOURISM-ALB-2026-011', 'PROPERTY-ALB-2026-004', 'KB-F4-2026-014', 'TOURISM-ALB-2026-009', 'KB-ALB-2026-012'],
    gaps: [
      {id: 'GAP-VLORA-OFFICIAL', text: 'No official ministry statement on the termination could be opened; the account comes from the press.', priority: 'MEDIUM'},
      {id: 'GAP-VLORA-SPECS', text: 'Sources differ on the terminal size (22,000 or 34,000 m²) and on first-phase capacity.', priority: 'LOW'},
    ],
    related: ['KB-DURRES-VS-VLORE', 'KB-INVEST-REGIONS', 'KB-BUY-ITALY'],
    seoTitle: 'Vlora airport: when will it open? Status and property impact (2026)',
    seoDescription:
      'Vlora International Airport has no flights as of October 2026 and its concession is in dispute. Runway, capacity, timeline and what it means for buying in Vlorë, with sources.',
    reviewMonths: 3,
    tr: {
      it: {
        title: 'Quando aprirà l’aeroporto di Valona, e conta per chi compra casa a Valona?',
        summary:
          'Non c’è una data. A ottobre 2026 l’aeroporto internazionale di Valona non ha voli di linea: l’apertura prevista per giugno 2026 è slittata, e ad agosto 2026 il governo ha avviato la risoluzione della concessione per i ritardi e per una lite tra i soci, ora davanti a un tribunale arbitrale a Londra. Il progetto del 2021 prevedeva una pista di 3.200 m e fino a 3 milioni di passeggeri l’anno, per circa 104 milioni di euro.',
        seoTitle: 'Aeroporto di Valona: quando apre? Stato e effetti sul mercato immobiliare (2026)',
        seoDescription:
          'A ottobre 2026 l’aeroporto di Valona non ha voli e la concessione è contestata. Pista, capacità, cronologia e cosa significa per chi compra a Valona, con le fonti.',
        sections: {
          AIRPORT: {
            heading: 'L’aeroporto in cifre',
            tables: {
              AIRPORT: {
                title: 'Aeroporto internazionale di Valona',
                columns: ['Voce', 'Dato', 'Fonte'],
                rows: [
                  ['Pista', '3.200 m', 'aeroTELEGRAPH, 2021'],
                  ['Terminal', '22.000 m²', 'RTSH, 2025'],
                  ['Capacità prevista', 'fino a 3 milioni di passeggeri l’anno', 'aeroTELEGRAPH, 2021'],
                  ['Investimento', 'circa 104 milioni di euro, concessione di 35 anni', 'aeroTELEGRAPH, 2021'],
                  ['Volo di certificazione', 'maggio 2025', 'RTSH'],
                  ['Stato a ottobre 2026', 'non in funzione, nessun volo di linea', 'ShkodraWeb; Vlore Circle'],
                ],
              },
            },
          },
          TIMELINE: {
            heading: 'Cronologia',
            tables: {
              TIMELINE: {
                title: 'Dalla concessione alla controversia',
                columns: ['Data', 'Evento', 'Fonte'],
                rows: [
                  ['Dicembre 2021', 'Concessione a Mabco e YDA per 35 anni', 'aeroTELEGRAPH'],
                  ['Maggio 2025', 'Primo volo di certificazione', 'RTSH'],
                  ['26 giugno 2026', 'Prima rotta prevista, per Zurigo; mai volata', 'RTSH; ShkodraWeb'],
                  ['Agosto 2026', 'Il ministero avvia la risoluzione della concessione', 'Oculus News'],
                  ['Settembre 2026', 'Mabco chiede misure cautelari a un tribunale arbitrale di Londra', 'Albanian Daily News'],
                ],
              },
            },
          },
          PROPERTY: {
            heading: 'Cosa significa per chi compra a Valona',
            body:
              'Per chi compra a Valona l’aeroporto è un possibile vantaggio futuro. Oggi:\n- I prezzi richiesti a Valona erano i più alti tra le città del Property Index 2025 di Deloitte: in media 2.400 €/m² nel 2024, con un aumento del 25% in un anno.\n- Il prezzo di riferimento ufficiale a Valona è di 61.800 lek/m², circa 672 €, un valore del 2016 ancora in vigore.\n- Domlivo ha in elenco {{count:vlore}} appartamenti a Valona ({{date:vlore}}), troppo pochi per un prezzo nostro.\n- I visitatori internazionali arrivano all’aeroporto di Tirana, che nel 2025 ha gestito 11,6 milioni di passeggeri.\n\nSe un venditore promette voli per Valona dalla prossima stagione, chiedete quale compagnia ha annunciato quale rotta.',
          },
        },
        faq: [
          {q: 'L’aeroporto di Valona è aperto?', a: 'No. A ottobre 2026 non ha voli passeggeri di linea né una data di apertura confermata.'},
          {q: 'Perché l’apertura dell’aeroporto di Valona è in ritardo?', a: 'Le scadenze dei lavori non sono state rispettate e i soci della società concessionaria, Mabco e 2A Group, sono in lite. Ad agosto 2026 il governo ha avviato la risoluzione della concessione e Mabco è ricorsa all’arbitrato.'},
          {q: 'Quale aeroporto si usa oggi per Valona?', a: 'L’aeroporto internazionale di Tirana, l’unico aeroporto internazionale in funzione in Albania nel 2026.'},
          {q: 'L’aeroporto farà salire i prezzi delle case a Valona?', a: 'Non si può misurare prima dell’apertura. Secondo Deloitte, i prezzi a Valona sono saliti del 25% nel 2024 anche senza aeroporto.'},
        ],
        gaps: [
          'Non è stato possibile consultare un comunicato ufficiale del ministero sulla risoluzione; la ricostruzione viene dalla stampa.',
          'Le fonti divergono sulla superficie del terminal (22.000 o 34.000 m²) e sulla capacità della prima fase.',
        ],
      },
    },
  },

  // ------------------------------------------------------------------ holiday letting rules
  {
    id: 'KB-STR-RULES',
    slug: 'do-you-need-a-licence-to-rent-to-tourists-in-albania',
    group: 'ownership',
    category: 'short_term_rental',
    tags: ['short-term-rental', 'airbnb', 'licence', 'taxes'],
    title: 'Do you need a licence to rent your flat to tourists in Albania?',
    summary:
      'You need a categorisation certificate. Since Law 30/2024 amended the tourism law, a private owner letting an apartment, villa or room to tourists must apply for one before starting, through e-Albania; operating without it is fined 20,000-50,000 ALL for 1-5 rooms. No business registration (NIPT) is needed, and the income is declared in the annual DIVA return when it exceeds 50,000 ALL a year (tax office, February 2026).',
    dataPeriod: '2024-2026',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'RULES',
        heading: 'What a private host has to do',
        tables: [
          {
            id: 'RULES',
            title: 'Obligations of an individual letting to tourists, 2026',
            columns: ['Obligation', 'What applies', 'Source'],
            rows: [
              {cells: ['Categorisation certificate', 'Apply before the first guest, as "apartament", "vilë" or "dhomë"; the certificate does not expire and goes into the Central Tourism Register', 'Law 30/2024, Art. 43/1'], facts: ['DATA-KB2-STRLAW-0001']},
              {cells: ['How to apply', 'On e-Albania, with a self-declaration; an individual landlord needs no QKB/NIPT business registration', 'Order 213/2025'], facts: ['DATA-KB2-STRLAW-0002']},
              {cells: ['Fine without a certificate', '20,000-50,000 ALL for 1-5 rooms; 100,000 ALL for 6-15 rooms', 'Law 30/2024, Art. 71'], facts: ['DATA-KB2-STRLAW-0001']},
              {cells: ['Guest register', 'ID or passport number, nights, citizenship, residence, gender and age of each guest', 'Law 30/2024; Order 213/2025'], facts: ['DATA-KB2-STRLAW-0002']},
              {cells: ['Income tax', '15% on rental income; declared in DIVA when untaxed income exceeds 50,000 ALL a year, by 31 March of the next year', 'PwC tax summary; tax administration'], facts: ['DATA-TAX-0002', 'DATA-KB2-STRLAW-0003']},
              {cells: ['Overnight tax', 'Paid by the guest, collected by the host, paid to the municipality by the 5th of the next month; for units other than 4-5 star hotels, 140 ALL a night in Tirana and 70 ALL in Vlorë', 'Law 9632/2006, Art. 26; municipal decisions'], facts: ['DATA-KB2-STRLAW-0004', 'DATA-TAX-0017', 'DATA-TAX-0018']},
              {cells: ['Foreign guests', 'A foreign guest reports their address within 10 days, personally or through the host', 'Law 79/2021, Art. 130'], facts: ['DATA-KB2-STRLAW-0005']},
            ],
          },
        ],
      },
      {
        key: 'CHANGES',
        heading: 'What is changing',
        body:
          '- Platforms may start reporting hosts. A draft law put to consultation on 15 July 2026 would make Airbnb, Booking and other platforms report each property, its cadastral number and its rental days by 31 January each year. Press reports a start in 2029; it is still a draft.\n- The tax office is already checking. Its first checks cover 100 hosts and businesses that earned about €24.9 million between October 2022 and December 2025.\n- Law 55/2025 on co-ownership has no article that lets the owners’ assembly ban short-term letting. Guests and tenants must still follow the assembly’s rules, and the owner pays the administration fee whether or not the flat is let.',
      },
    ],
    faq: [
      {q: 'Do I need a NIPT to rent on Airbnb in Albania?', a: 'Not as a private individual letting a room, apartment or villa: Order 213/2025 exempts individual landlords from business registration. You still need the categorisation certificate.'},
      {q: 'What happens if I let my flat without a certificate?', a: 'The fine is 20,000-50,000 ALL for 1-5 rooms and 100,000 ALL for 6-15 rooms, under Article 71 of the tourism law as amended in 2024.'},
      {q: 'How is Airbnb income taxed in Albania?', a: 'At 15%. When no tax was withheld and the income passes 50,000 ALL in the year, you file the DIVA return by 31 March of the following year.'},
      {q: 'Do guests pay a tourist tax?', a: 'Yes, the overnight tax. The host collects it and pays it to the municipality by the 5th of the next month; Tirana charges 140 ALL a night for accommodation other than 4-5 star hotels.'},
    ],
    facts: ['DATA-KB2-STRLAW-0006', 'DATA-KB2-STRLAW-0007', 'DATA-KB2-STRLAW-0008'],
    sources: ['KB-F4-2026-043', 'KB-F4-2026-044', 'KB-F4-2026-045', 'KB-F4-2026-046', 'KB-F4-2026-047', 'KB-F4-2026-048', 'KB-ALB-2026-001', 'BUILDING-ALB-2026-007', 'TAX-ALB-2026-014', 'TAX-ALB-2026-009', 'TAX-ALB-2026-010'],
    gaps: [
      {id: 'GAP-STR-ESERVICE', text: 'The exact e-Albania service name and any fee for the certificate were not confirmed.', priority: 'MEDIUM'},
      {id: 'GAP-STR-TAX-BASE', text: 'Sources disagree on whether the 15% is charged on gross bookings or after the platform’s commission.', priority: 'MEDIUM'},
      {id: 'GAP-STR-COAST-TAX', text: 'Overnight tax rates for Durrës and Sarandë were not found.', priority: 'LOW'},
    ],
    related: ['KB-RENTAL-INCOME-TAX', 'KB-RENTAL-MANAGEMENT', 'KB-SECOND-HOME-DURRES'],
    seoTitle: 'Airbnb in Albania: do you need a licence? Rules for private hosts (2026)',
    seoDescription:
      'Private hosts in Albania need a categorisation certificate (fines 20,000-50,000 ALL), no NIPT, 15% tax via DIVA above 50,000 ALL, and the overnight tax. Sources included.',
    reviewMonths: 6,
  },
]
