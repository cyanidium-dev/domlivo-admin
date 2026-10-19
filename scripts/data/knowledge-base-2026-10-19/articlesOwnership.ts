import type {ArticleSpec} from './types'

/**
 * Owning and renting out; process and risks.
 *
 * Domlivo figures are written as price-index tokens ({{median:durres/plazh}}),
 * which the site fills from the live index on every render, so the copy cannot
 * drift from the table. Derived yields are ESTIMATE facts dated October 2026.
 */

export const ARTICLES_OWNERSHIP: ArticleSpec[] = [
  {
    id: 'KB-UTILITIES-BY-CITY',
    slug: 'utility-costs-apartment-albania-by-city',
    group: 'ownership',
    category: 'utilities',
    tags: ['utilities', 'water', 'electricity', 'ownership-costs'],
    title: 'How much are utilities for an apartment in Albania, by city?',
    summary:
      'Electricity costs the same everywhere in Albania: 10.2 ALL per kWh with VAT (about €0.11) up to 700 kWh a month in 2026 (ERE). Household water is 60–70 ALL per m³ plus 11–50 ALL per m³ for sewerage and a 200 ALL monthly fee, depending on the city (ERRU); two people using 6 m³ of water and 250 kWh of electricity in Durrës pay about €38 a month for both.',
    dataPeriod: '2026',
    confidence: 'HIGH',
    sections: [
      {
        key: 'WATER',
        heading: 'Water and sewerage by city',
        tables: [
          {
            id: 'WATER_BY_CITY',
            title: 'Household water tariffs, 2026 (ALL)',
            columns: ['City', 'Water per m³', 'Sewerage per m³', 'Fixed per month'],
            rows: [
              {cells: ['Tirana', '65', '11', '200'], facts: ['DATA-WATER-0006']},
              {cells: ['Durrës', '70', '50', '200'], facts: ['DATA-WATER-0001', 'DATA-WATER-0002', 'DATA-WATER-0003']},
              {cells: ['Vlorë', '60', '17', '200'], facts: ['DATA-WATER-0007']},
              {cells: ['Sarandë', '60', '25', '200'], facts: ['DATA-WATER-0008']},
              {cells: ['Lezhë (Shëngjin)', '65', '19', '200'], facts: ['DATA-WATER-0009']},
            ],
            methodology: 'Tariffs approved by the water regulator ERRU, as listed in its table updated January 2026.',
          },
        ],
      },
      {
        key: 'ELECTRICITY',
        heading: 'Electricity',
        body: 'There is one national household tariff. The price jumps for the whole month, not just the extra units, once consumption passes 700 kWh, which matters for a flat running air conditioning all summer. An empty flat with a zero reading pays a 200 ALL monthly service fee.',
        tables: [
          {
            id: 'ELECTRICITY',
            title: 'Household electricity, 2026',
            columns: ['Monthly consumption', 'Price excl. VAT', 'Price incl. VAT'],
            rows: [
              {cells: ['Up to 700 kWh', '8.5 ALL/kWh', '10.2 ALL/kWh'], facts: ['DATA-ELEC-0001', 'DATA-ELEC-0003']},
              {cells: ['701 kWh or more (whole month)', '9.5 ALL/kWh', '11.4 ALL/kWh'], facts: ['DATA-ELEC-0002', 'DATA-ELEC-0003']},
              {cells: ['Zero reading', '200 ALL/month', '—'], facts: ['DATA-ELEC-0008']},
            ],
          },
        ],
      },
      {
        key: 'OTHER',
        heading: 'Waste tariff and building fees',
        tables: [
          {
            id: 'OTHER_MONTHLY',
            title: 'Other recurring charges',
            columns: ['Charge', 'Amount', 'Note'],
            rows: [
              {cells: ['Tirana cleaning and waste, household', '417 ALL a month', '2026 fiscal package'], facts: ['DATA-WASTE-0001']},
              {cells: ['Vlorë city cleaning, household', '2,400–3,300 ALL a year', 'Latest package found: 2025 draft and 2020'], facts: ['DATA-WASTE-0003', 'DATA-WASTE-0002']},
              {cells: ['Sarandë cleaning, household', '3,600 ALL a year', 'As cited by the 2025 state audit'], facts: ['DATA-WASTE-0004']},
              {cells: ['Building administration, Tirana', '400–500 ALL (old blocks) to 1,000–1,200 ALL (new) a month', 'Set by each building'], facts: ['DATA-BUILDING-0004']},
            ],
          },
        ],
      },
      {
        key: 'EXAMPLE',
        heading: 'Example monthly bill',
        body: 'Two people in a Durrës flat using 6 m³ of water and 250 kWh of electricity: water 6 × (70 + 50) + 200 = 920 ALL; electricity 250 × 10.2 = 2,550 ALL. Together about 3,470 ALL, roughly €38, before the building fee and internet. In July and August, with air conditioning, electricity can pass 700 kWh and the whole month is billed at the higher rate.',
      },
    ],
    faq: [
      {q: 'Is electricity cheaper in some Albanian cities?', a: 'No. The household tariff is national: 8.5 ALL/kWh before VAT up to 700 kWh a month.'},
      {q: 'Why is water dearer in Durrës?', a: 'The Durrës utility charges 50 ALL/m³ for sewerage, against 11 in Tirana and 17 in Vlorë.'},
      {q: 'What does an empty holiday flat cost per month?', a: 'The fixed fees: 200 ALL for water and 200 ALL for a zero electricity reading, plus the building and waste fees.'},
    ],
    facts: ['DATA-TAX-0001'],
    sources: ['WATER-ALB-2026-001', 'ELEC-ALB-2026-001', 'ELEC-ALB-2026-007', 'WASTE-TIRANA-2026-001'],
    gaps: [
      {id: 'GAP-WATER-VAT', text: 'Whether VAT is added to household water bills: the ERRU tariffs are quoted without it.', priority: 'MEDIUM'},
      {id: 'GAP-WASTE-DURRES', text: 'No 2026 household waste tariff found for Durrës, Lezhë or Sarandë.', priority: 'MEDIUM'},
      {id: 'GAP-BUILDING-FEE-DATA', text: 'Building administration fees come from undated press articles about Tirana; no data for the coast.', priority: 'MEDIUM'},
    ],
    related: ['KB-PROPERTY-TAX', 'KB-RENTAL-MANAGEMENT', 'KB-YIELDS-DURRES-DISTRICTS'],
    seoTitle: 'Utility costs for an apartment in Albania by city (2026)',
    seoDescription: 'Electricity 10.2 ALL/kWh nationwide; water 60–70 ALL/m³ plus sewerage by city. Tariff tables for Tirana, Durrës, Vlorë, Sarandë and Shëngjin, with an example bill.',
    reviewMonths: 6,
  },
  {
    id: 'KB-RENTAL-MANAGEMENT',
    slug: 'rental-management-fees-albania',
    group: 'ownership',
    category: 'property_management',
    tags: ['property-management', 'short-term-rental', 'airbnb'],
    title: 'How much does rental management cost in Albania?',
    summary:
      'Short-term rental managers in Albania charge about 10–15% of booking income for a partial service and 20–30% for full service, with premium operators up to 40–45% (Airbtics, 2026). On top of that the owner pays 15% tax on rental income and the building\'s administration fee, which under Law 55/2025 can be secured by a mortgage on the flat after six months unpaid.',
    dataPeriod: '2026',
    confidence: 'LOW',
    sections: [
      {
        key: 'FEES',
        heading: 'What managers charge',
        tables: [
          {
            id: 'MANAGEMENT_FEES',
            title: 'Management fee levels (share of booking income)',
            columns: ['Service level', 'Fee', 'What is usually included'],
            rows: [
              {cells: ['Partial (listing, guest messages, check-in)', '10–15%', 'Owner pays cleaning and repairs'], facts: ['DATA-MGMT-ALB-0001']},
              {cells: ['Full service', '20–30%', 'Pricing, cleaning coordination, maintenance calls'], facts: ['DATA-MGMT-ALB-0001']},
              {cells: ['Premium operators', 'up to 40–45%', 'Brand, own channels, linen'], facts: ['DATA-MGMT-ALB-0001']},
            ],
            confidence: 'LOW',
          },
        ],
      },
      {
        key: 'BENCHMARK',
        heading: 'What a managed flat earns',
        body: 'Airbtics tracked 31 management companies with 2,207 listings in Albania in June 2026. One Tirana operator\'s managed portfolio reached an average nightly rate of €117 and 71% occupancy, against €49 and 62% for the Tirana market, which shows how wide the gap between an average listing and a professionally run one can be. A single operator\'s portfolio is not a forecast for your flat.',
        tables: [
          {
            id: 'MANAGED_BENCHMARK',
            title: 'Managed portfolio vs market, Tirana (Airbtics, June 2026)',
            columns: ['Metric', 'Managed portfolio', 'Tirana market'],
            rows: [
              {cells: ['Average daily rate', '10,783 ALL (≈ €117)', '4,555 ALL (≈ €49)'], facts: ['DATA-MGMT-ALB-0002']},
              {cells: ['Occupancy', '71%', '62%'], facts: ['DATA-MGMT-ALB-0002']},
            ],
            confidence: 'MEDIUM',
          },
        ],
      },
      {
        key: 'OWNER_COSTS',
        heading: 'The owner\'s other obligations',
        tables: [
          {
            id: 'OWNER_OBLIGATIONS',
            title: 'Costs and rules besides the management fee',
            columns: ['Item', 'Rule', 'Source'],
            rows: [
              {cells: ['Tax on short-term income', '15%, declared in DIVA', 'HLB Albania'], facts: ['DATA-TAX-ALB-0001']},
              {cells: ['Building administration fee', 'Owner\'s share; mortgage possible after 6 months unpaid', 'Law 55/2025'], facts: ['DATA-BUILDING-0001']},
              {cells: ['Long-term lease over 1 year', 'Written and notarised', 'Notary guidance'], facts: ['DATA-RENT-ALB-0010']},
              {cells: ['Deposit on a long-term lease', 'Usually 1–2 months\' rent', 'Legal guidance'], facts: ['DATA-RENT-ALB-0011']},
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'What percentage do Airbnb managers take in Albania?', a: 'About 20–30% of booking income for full service, 10–15% for partial service.'},
      {q: 'Can I manage a rental from abroad without a company?', a: 'For tax, an individual with no other business does not need a NIPT; check the tourism registration rules, which are being tightened.'},
      {q: 'Who pays the building fee when the flat is rented?', a: 'The owner, unless the lease passes it to the tenant. Under Law 55/2025 unpaid fees can end in a mortgage on the unit.'},
    ],
    facts: ['DATA-TAX-0006'],
    sources: ['MGMT-2026-002', 'MGMT-2026-001', 'BUILDING-ALB-2026-007', 'TAX-2026-001'],
    gaps: [
      {id: 'GAP-MGMT-PRICE-LISTS', text: 'Fee levels come from one analytics profile and international norms; no published Albanian price lists were collected.', priority: 'HIGH'},
      {id: 'GAP-TOURISM-LICENSING', text: 'The 2026 tourism-law amendment bringing apartments under accommodation licensing: final text and dates not confirmed.', priority: 'HIGH'},
    ],
    related: ['KB-RENTAL-INCOME-TAX', 'KB-YIELDS-DURRES-DISTRICTS', 'KB-UTILITIES-BY-CITY'],
    seoTitle: 'Rental management fees in Albania: 10–30% (2026)',
    seoDescription: 'Albanian short-term rental managers charge 10–15% (partial) to 20–30% (full service). Benchmarks, owner obligations and taxes, with sources.',
    reviewMonths: 6,
  },
  {
    id: 'KB-YIELDS-DURRES-DISTRICTS',
    slug: 'rental-yield-durres-by-district',
    group: 'ownership',
    category: 'roi',
    tags: ['investment', 'roi', 'durres', 'districts', 'long-term-rental'],
    citySlug: 'durres',
    title: 'What rental yield can you expect in Durrës, by district?',
    summary:
      'About 5–7% gross for a one-bedroom flat let long-term, at October 2026 asking prices: roughly 5.3% in Plazh, 5.9% in Shkëmbi i Kavajës and 7% in Golem, before the 15% rental tax and costs. Flats in Durrës are listed at a median of €{{median:durres}}/m² across {{count:durres}} flats in the Domlivo Price Index ({{date:durres}}).',
    dataPeriod: '2026-10',
    confidence: 'ESTIMATE',
    sections: [
      {
        key: 'BY_DISTRICT',
        heading: 'Asking prices and yields by district',
        tables: [
          {
            id: 'DURRES_DISTRICT_YIELDS',
            title: 'Durrës districts: price per m² and gross yield of a 55 m² 1+1',
            columns: ['District', 'Median asking price (live)', 'Flats in sample', '1+1 asking rent', 'Gross yield (Oct 2026)'],
            rows: [
              {cells: ['Plazh', '€{{median:durres/plazh}}/m²', '{{count:durres/plazh}}', '€390/month', '≈ 5.3%'], facts: ['DATA-YIELD-DURRES-CALC-0001', 'DATA-RENT-DURRES-0006']},
              {cells: ['Golem', '€{{median:durres/golem-durres}}/m²', '{{count:durres/golem-durres}}', '€430–450/month', '≈ 7%'], facts: ['DATA-YIELD-DURRES-CALC-0002', 'DATA-RENT-DURRES-0007']},
              {cells: ['Shkëmbi i Kavajës', '€{{median:durres/shkembi-durres}}/m²', '{{count:durres/shkembi-durres}}', '€380/month', '≈ 5.9%'], facts: ['DATA-YIELD-DURRES-CALC-0003', 'DATA-RENT-DURRES-0007']},
              {cells: ['City centre', '€{{median:durres/city-center-durres}}/m²', '{{count:durres/city-center-durres}}', 'n/a', '—']},
              {cells: ['Mali i Robit', '€{{median:durres/mali-i-robit}}/m²', '{{count:durres/mali-i-robit}}', 'n/a', '—']},
            ],
            methodology:
              'Gross yield = annual asking rent ÷ (55 m² × district median asking price on 19 October 2026). Prices update live; the yield column is fixed at the October 2026 calculation. Asking prices and asking rents, not completed deals.',
            confidence: 'ESTIMATE',
          },
        ],
      },
      {
        key: 'SEASON',
        heading: 'Season changes the picture',
        body: 'Durrës rents swing with the beach season. Listing data for 2026 put a 1+1 at €250–400 a month on an annual lease, €400–600 in summer and €200–350 in winter. A flat let short-term in July and August and long-term the rest of the year can beat the long-term yield, at the cost of management fees and empty weeks.',
        tables: [
          {
            id: 'DURRES_SEASONAL_RENTS',
            title: 'Durrës 1+1 asking rents by season (2026)',
            columns: ['Period', '1+1', '2+1'],
            rows: [
              {cells: ['Annual lease', '€250–400', '€350–550'], facts: ['DATA-RENT-DURRES-0001']},
              {cells: ['Summer (June–September)', '€400–600', '€500–900'], facts: ['DATA-RENT-DURRES-0002']},
              {cells: ['Winter 2025/26', '€200–350', '€300–500'], facts: ['DATA-RENT-DURRES-0003']},
            ],
            confidence: 'LOW',
          },
        ],
      },
      {
        key: 'NET',
        heading: 'From gross to net',
        body: '- Rental tax: 15% of the rent for an individual.\n- Building administration fee and repairs.\n- Vacancy between tenants.\n- Management, if you are not on site: 10–30% of income for short lets.\n\nA 5.3% gross yield becomes roughly 4.5% after the 15% tax alone.',
      },
    ],
    faq: [
      {q: 'Which Durrës district has the best rental yield?', a: 'On October 2026 asking figures, Golem (about 7% gross for a 1+1), because flats are cheaper per m² than in Plazh while rents are similar. The Golem rent sample is small.'},
      {q: 'Are these yields guaranteed?', a: 'No. They divide asking rents by asking prices; real deals and real rents can differ.'},
      {q: 'Where do the prices come from?', a: 'From the Domlivo Price Index: the median asking price per m² of flats listed for sale on domlivo.com, recomputed hourly and published as open data.'},
    ],
    sources: ['KB-ALB-2026-012', 'RENT-DURRES-2026-001', 'RENT-DURRES-2026-002', 'TAX-ALB-2026-010'],
    facts: ['DATA-TAX-0002'],
    gaps: [
      {id: 'GAP-ACHIEVED-RENTS', text: 'Achieved (signed) rents by district are not available; all rents are asking rents from listing portals.', priority: 'HIGH'},
      {id: 'GAP-RENT-SAMPLE-GOLEM', text: 'The Golem and Shkëmbi yields rest on one to three rent listings.', priority: 'MEDIUM'},
    ],
    related: ['KB-PLAZH-VS-GOLEM', 'KB-RENTAL-INCOME-TAX', 'KB-RENTAL-MANAGEMENT', 'KB-SEA-VS-CENTRE-DURRES'],
    seoTitle: 'Rental yield in Durrës by district: Plazh, Golem, Shkëmbi (2026)',
    seoDescription: 'Gross yields of 5–7% for a 1+1 in Durrës at October 2026 asking prices, district by district, with live price-per-m² medians from the Domlivo Price Index.',
    reviewMonths: 6,
  },
  /* ------------------------------------------------------------ process -- */
  {
    id: 'KB-BUYING-STEPS',
    slug: 'steps-to-buy-property-in-albania',
    group: 'process',
    category: 'legal',
    tags: ['buying', 'process', 'notary', 'ashk'],
    title: 'What are the steps to buy a property in Albania?',
    summary:
      'Six steps: check the property card at ASHK, sign a preliminary contract with a deposit, sign the deed before a notary, the seller pays 15% tax on the gain, the contract is registered at ASHK (5,000 ALL since July 2025), and you transfer the utility contracts. The buyer\'s legal costs on a €100,000 flat come to about €350–390 (October 2026).',
    dataPeriod: '2026',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'STEPS',
        heading: 'The steps',
        tables: [
          {
            id: 'BUYING_STEPS',
            title: 'Buying a property in Albania, step by step',
            columns: ['Step', 'What happens', 'Cost or rule'],
            rows: [
              {cells: ['1. Check the property', 'Order the property card and legal-status check from ASHK', '1,500 + 1,000 ALL'], facts: ['DATA-PURCHASE-0010']},
              {cells: ['2. Preliminary contract', 'Price, deposit, deadline, who pays which tax', 'Deposit by bank transfer'], facts: ['DATA-LEGAL-0009']},
              {cells: ['3. Notary deed', 'Notary checks title, identity, payment; deed in Albanian', '0.23–0.35% of value'], facts: ['DATA-LEGAL-0008', 'DATA-PURCHASE-0001']},
              {cells: ['4. Seller\'s tax', '15% of the gain, paid before registration', 'Joint Instruction 34/2023'], facts: ['DATA-TAX-0019']},
              {cells: ['5. Registration at ASHK', 'Contract, certificate, card, receipts', '5,000 ALL; late interest 10%/day'], facts: ['DATA-PURCHASE-0007', 'DATA-PURCHASE-0009']},
              {cells: ['6. After registration', 'New property card in your name; transfer water and electricity contracts', '—']},
            ],
          },
        ],
      },
      {
        key: 'TIPS',
        heading: 'What protects the buyer',
        body: '- Read the property card yourself: owner, number, zone, and any mortgage or seizure in the encumbrances section.\n- For a legalised home look for a statutory mortgage (plot price unpaid) or a registration "without land".\n- Pay only by bank transfer, never cash; the notary cannot accept more than 150,000 ALL in cash anyway.\n- Write into the preliminary contract who pays which tax and what happens to the deposit if the seller cannot deliver a clean title.\n- Check that the seller\'s tax and the registration have been done: until ASHK registers the deed, the card still shows the seller.',
      },
    ],
    faq: [
      {q: 'Do I need a lawyer to buy in Albania?', a: 'The law does not require one; the notary checks title and identity. An independent lawyer is worth it for off-plan, legalised or inherited property.'},
      {q: 'When do I become the owner?', a: 'When ASHK registers the sale contract and issues the property card in your name.'},
      {q: 'How much deposit is usual?', a: 'It is negotiated; there is no legal level. Tie its return to the seller delivering a clean title.'},
    ],
    facts: ['DATA-LEGAL-0019'],
    sources: ['LEGAL-ALB-2026-001', 'KB-ALB-2026-003', 'KB-ALB-2026-011', 'KB-ALB-2026-013'],
    gaps: [
      {id: 'GAP-ASHK-PROCESSING-TIME', text: 'Statutory or typical ASHK processing time for registering a sale was not found.', priority: 'MEDIUM'},
    ],
    related: ['KB-DOCUMENTS', 'KB-TIMELINE', 'KB-LEGALISATION-CHECK', 'KB-TRANSFER-TAX'],
    seoTitle: 'Steps to buy property in Albania: from ASHK check to registration',
    seoDescription: 'Six steps to buy in Albania: ASHK property card, preliminary contract, notary deed, seller\'s 15% tax, ASHK registration (5,000 ALL) and utilities. Costs and rules.',
    reviewMonths: 6,
  },
  {
    id: 'KB-TIMELINE',
    slug: 'how-long-does-buying-property-in-albania-take',
    group: 'process',
    category: 'legal',
    tags: ['buying', 'process', 'timeline'],
    title: 'How long does it take to buy a property in Albania?',
    summary:
      'The legal part is short: once the seller\'s title is clean, the notary deed can be signed as soon as the papers are ready, and registering it at ASHK late costs 10% of the fee per day of delay, which pushes both sides to file quickly. What takes time is the market: the Bank of Albania\'s survey put the average time to sell a home at 9.1 months in the second half of 2025, and a property still in legalisation adds ASHK\'s 60-day decision period.',
    dataPeriod: '2025–2026',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'TIMES',
        heading: 'Known time frames',
        tables: [
          {
            id: 'TIME_FRAMES',
            title: 'Time frames that affect a purchase',
            columns: ['Stage', 'Time frame', 'Source'],
            rows: [
              {cells: ['Registration after the deed', 'Late filing costs 10% of the fee per day, max 300,000 ALL', 'VKM 462/2025'], facts: ['DATA-PURCHASE-0009']},
              {cells: ['Legalisation decision', 'Within 60 days of qualification', 'Law 20/2020 Art. 21'], facts: ['DATA-LEGAL-0018']},
              {cells: ['Plot-price discount on a legalised home', 'Pay within 30 days of the notice: −20%', 'VKM 446/2023'], facts: ['DATA-LEGAL-0020']},
              {cells: ['Average time to sell a home', '9.1 months (Tirana 8.1), H2 2025', 'Bank of Albania survey'], facts: ['DATA-RENT-ALB-0013']},
              {cells: ['Visa-free stay while you buy', '90 days in any 180', 'Law 79/2021 Art. 29'], facts: ['DATA-LEGAL-0013']},
            ],
          },
        ],
      },
      {
        key: 'PLANNING',
        heading: 'Planning the purchase',
        body: 'Documents issued abroad (apostilled marriage certificate, power of attorney) take the longest to prepare: order them before you travel. If you cannot stay in Albania for the deed, sign a power of attorney so a representative can finish the deal within your 90 days, or after them.',
      },
    ],
    faq: [
      {q: 'Can I buy a flat in Albania in one trip?', a: 'Often yes, if the title is clean and your documents are apostilled before you travel. Registration can be finished by the notary after you leave.'},
      {q: 'Why does a legalised house take longer?', a: 'Until ASHK issues the legalisation decision and the plot price is settled, the building cannot be sold with full title.'},
      {q: 'How long does ASHK take to register?', a: 'We found no published standard time; ask the notary for the current wait at the local ASHK office.'},
    ],
    sources: ['KB-ALB-2026-003', 'KB-ALB-2026-005', 'KB-ALB-2026-006', 'RENT-ALB-2026-009', 'KB-ALB-2026-001'],
    gaps: [
      {id: 'GAP-ASHK-PROCESSING-TIME', text: 'No statutory or typical ASHK processing time for registering a sale was found.', priority: 'HIGH'},
      {id: 'GAP-BOA-SURVEY-PRIMARY', text: 'The 9.1-month figure is taken from press coverage of the Bank of Albania survey, not from the survey PDF.', priority: 'MEDIUM'},
    ],
    related: ['KB-BUYING-STEPS', 'KB-POWER-OF-ATTORNEY', 'KB-LEGALISATION-CHECK'],
    seoTitle: 'How long does buying property in Albania take? (2026)',
    seoDescription: 'Time frames for buying in Albania: notary and ASHK registration, legalisation (60 days), average time on market 9.1 months. Planning tips and sources.',
    reviewMonths: 6,
  },
  {
    id: 'KB-LEGALISATION-CHECK',
    slug: 'how-to-check-if-a-property-in-albania-is-legalised',
    group: 'process',
    category: 'legal',
    tags: ['legalisation', 'due-diligence', 'ashk', 'risks'],
    title: 'How do you check whether a property in Albania is legalised?',
    summary:
      'Order the property card (1,500 ALL) and the online legal-status check (1,000 ALL) from ASHK and read the encumbrances. A legalised home can carry a statutory mortgage until its plot price is paid, or be registered "without the land" when it stands on someone else\'s plot (Law 20/2020, Art. 22). ASHK issued 26,101 legalisation decisions in 2025 and plans to close the process in 2028.',
    dataPeriod: '2025–2026',
    confidence: 'HIGH',
    sections: [
      {
        key: 'WHAT_TO_ORDER',
        heading: 'What to order and what to look for',
        tables: [
          {
            id: 'LEGALISATION_CHECKS',
            title: 'Checks before buying a legalised or older property',
            columns: ['Check', 'What it shows', 'Cost'],
            rows: [
              {cells: ['Property card (kartela)', 'Owner, number, zone, volume and page, encumbrances', '1,500 ALL'], facts: ['DATA-PURCHASE-0010']},
              {cells: ['Online legal-status check', 'Whether the property is registered and any restrictions', '1,000 ALL'], facts: ['DATA-PURCHASE-0010']},
              {cells: ['Statutory mortgage on the card', 'Plot price still unpaid', 'Law 20/2020 Art. 22(10)'], facts: ['DATA-LEGAL-0019']},
              {cells: ['"Without land relationship"', 'Building on third-party land, compensation pending', 'Law 20/2020 Art. 22(6)'], facts: ['DATA-LEGAL-0019']},
              {cells: ['Ownership certificate', 'Official proof of title', '3,000 ALL'], facts: ['DATA-PURCHASE-0010']},
            ],
          },
        ],
      },
      {
        key: 'HOW_LEGALISATION_WORKS',
        heading: 'How legalisation works',
        body: 'Law 20/2020 replaced the old ALUIZNI process: ASHK now legalises buildings without a permit that appear on the national orthophoto taken before the law. The legalisation act also transfers the plot, up to three times the footprint and at most 500 m² for a home, against a plot price of 50% of the zone\'s land value, with 20% off if paid within 30 days.\n\nSome buildings can never be legalised: those harming major infrastructure, national roads, public buildings, cultural heritage, strategic-investment areas or the coastline.',
        tables: [
          {
            id: 'LEGALISATION_FIGURES',
            title: 'Legalisation in figures',
            columns: ['Item', 'Figure', 'Source'],
            rows: [
              {cells: ['Decisions in 2025', '26,101', 'ASHK report 2025'], facts: ['DATA-LEGAL-0021']},
              {cells: ['Decisions 2006–2025', '291,114', 'ASHK report 2025'], facts: ['DATA-LEGAL-0021']},
              {cells: ['Plot price', '50% of land value; −20% within 30 days', 'VKM 446/2023'], facts: ['DATA-LEGAL-0020']},
              {cells: ['Decision deadline', '60 days after qualification', 'Law 20/2020 Art. 21'], facts: ['DATA-LEGAL-0018']},
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'Can I buy a legalised apartment in Albania?', a: 'Yes, once it has a property card. Check the card for a statutory mortgage or a "without land" note and have them cleared before paying.'},
      {q: 'What does "pa marrëdhënie me truallin" mean?', a: 'The building is registered without the land under it, because the land belongs to someone else and their compensation is pending.'},
      {q: 'Can I buy a house that is still being legalised?', a: 'Not with full title: until ASHK issues the decision and the plot price is paid, you would be buying a claim, not registered property.'},
    ],
    sources: ['KB-ALB-2026-005', 'KB-ALB-2026-006', 'KB-ALB-2026-007', 'KB-ALB-2026-003', 'KB-ALB-2026-013'],
    gaps: [
      {id: 'GAP-LEGALISATION-STATUS-SERVICE', text: 'No e-Albania service named "certificate of legalisation status" was found; the check relies on the property card and the legal-status check.', priority: 'MEDIUM'},
      {id: 'GAP-2026-AMENDMENT', text: 'A September 2026 draft amendment on informal homes in high-rise zones (only the dwelling legalised, not the land) is press-reported only.', priority: 'MEDIUM'},
    ],
    related: ['KB-INFORMAL-HOUSES', 'KB-BUYING-STEPS', 'KB-ASHK-REGISTRATION'],
    seoTitle: 'How to check if a property in Albania is legalised (2026)',
    seoDescription: 'Use the ASHK property card and legal-status check, and look for a statutory mortgage or "without land" registration. Law 20/2020 explained, with 2025 figures.',
    reviewMonths: 6,
  },
  {
    id: 'KB-INFORMAL-HOUSES',
    slug: 'buying-an-informal-house-without-permit-albania',
    group: 'process',
    category: 'legal',
    tags: ['legalisation', 'risks', 'informal-buildings', 'houses'],
    title: 'Is it safe to buy an "informal" house without a permit in Albania?',
    summary:
      'Only once it is legalised and registered. A house built without a permit can be legalised under Law 20/2020 if it appears on the pre-2020 orthophoto and is not on the coastline or another excluded zone; until ASHK issues the decision there is no registered title to buy. In 2025 ASHK issued 26,101 legalisation decisions and 610 refusals.',
    dataPeriod: '2025–2026',
    confidence: 'HIGH',
    sections: [
      {
        key: 'RISKS',
        heading: 'The risks, one by one',
        tables: [
          {
            id: 'INFORMAL_RISKS',
            title: 'Risks of an unpermitted house',
            columns: ['Situation', 'What it means for a buyer', 'Basis'],
            rows: [
              {cells: ['Not on the pre-2020 orthophoto', 'Not eligible for legalisation', 'Law 20/2020 Art. 17'], facts: ['DATA-LEGAL-0018']},
              {cells: ['On the coastline or near major infrastructure', 'Excluded from legalisation', 'Law 20/2020 Art. 18'], facts: ['DATA-LEGAL-0018']},
              {cells: ['Legalised, plot price unpaid', 'Statutory mortgage on the property', 'Law 20/2020 Art. 22(10)'], facts: ['DATA-LEGAL-0019']},
              {cells: ['On another owner\'s land', 'Registered without the land until compensation', 'Law 20/2020 Art. 22(6)'], facts: ['DATA-LEGAL-0019']},
              {cells: ['Legalised and plot paid', 'Normal registered property', 'VKM 446/2023'], facts: ['DATA-LEGAL-0020']},
            ],
          },
        ],
      },
      {
        key: 'NUMBERS',
        heading: 'How common it is',
        body: 'ASHK issued 291,114 legalisation decisions between 2006 and 2025 and 26,101 in 2025 alone, the highest yearly figure since 2016; it refused 610 that year. Its 2025 report sets 2028 as the year initial registration, legalisation included, should be finished.',
        tables: [
          {
            id: 'LEGALISATION_BY_YEAR',
            title: 'Legalisation decisions by year (ASHK)',
            columns: ['Year', 'Decisions'],
            rows: [
              {cells: ['2016', '48,351'], facts: ['DATA-LEGAL-0021']},
              {cells: ['2023', '10,132'], facts: ['DATA-LEGAL-0021']},
              {cells: ['2024', '11,167'], facts: ['DATA-LEGAL-0021']},
              {cells: ['2025', '26,101'], facts: ['DATA-LEGAL-0021']},
            ],
          },
        ],
      },
      {
        key: 'ADVICE',
        heading: 'How buyers handle it',
        body: '- Buy only what has a property card in the seller\'s name; a legalisation application is not a title.\n- If the seller is still in the process, make the preliminary contract conditional on the ASHK decision and on the plot price being paid.\n- Ask for the extract of the seller\'s application from ASHK\'s unpermitted-building database, which every applicant can obtain.\n- On the coast, check that the house is not in an excluded zone before negotiating.',
      },
    ],
    faq: [
      {q: 'Can a foreigner buy a legalised house?', a: 'Yes, like any building, once it is registered. The plot that comes with legalisation is building land.'},
      {q: 'Can I legalise a house myself after buying it?', a: 'Only the possessor who applied can complete legalisation; buying before the decision transfers no title.'},
      {q: 'Will legalisation end?', a: 'ASHK aims to finish initial registration, legalisation included, in 2028.'},
    ],
    facts: ['DATA-LEGAL-0001'],
    sources: ['KB-ALB-2026-005', 'KB-ALB-2026-006', 'KB-ALB-2026-007'],
    gaps: [
      {id: 'GAP-REFUSALS-2025', text: 'The 610 refusals of 2025 come from the same ASHK report table; reasons by category are not published.', priority: 'LOW'},
      {id: 'GAP-NEW-APPLICATIONS', text: 'No explicit closing date for new legalisation applications was found in the law.', priority: 'MEDIUM'},
    ],
    related: ['KB-LEGALISATION-CHECK', 'KB-LAND-VS-APARTMENT', 'KB-BUYING-STEPS'],
    seoTitle: 'Buying an informal house in Albania: legalisation risks (2026)',
    seoDescription: 'Unpermitted houses in Albania can be bought safely only after ASHK legalises and registers them. What Law 20/2020 allows, what it excludes, and 2025 figures.',
    reviewMonths: 6,
  },
  {
    id: 'KB-OFF-PLAN-RISKS',
    slug: 'off-plan-property-albania-risks-escrow',
    group: 'process',
    category: 'legal',
    tags: ['off-plan', 'new-build', 'risks', 'escrow'],
    title: 'What are the risks of buying off-plan in Albania, and is there escrow?',
    summary:
      'The main risk is that you pay before there is a registered flat: an off-plan apartment only gets its own property card after the building\'s final registration at ASHK (fee 8,000 ALL under VKM 462/2025). We found no Albanian law requiring escrow for off-plan payments as of October 2026; the notary\'s special bank account can hold money until a deed is signed, and staged payments tied to construction milestones are the usual protection.',
    dataPeriod: '2026',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'RISKS',
        heading: 'Risks and what reduces them',
        tables: [
          {
            id: 'OFF_PLAN_RISKS',
            title: 'Off-plan risks',
            columns: ['Risk', 'What reduces it', 'Basis'],
            rows: [
              {cells: ['No registered title until completion', 'Notarised contract; register it if possible; pay in stages', 'VKM 462/2025'], facts: ['DATA-PURCHASE-0013']},
              {cells: ['Developer does not own the land', 'Ask for the registered developer–landowner contract on the plot\'s card', 'VKM 462/2025 no. 35'], facts: ['DATA-PURCHASE-0013']},
              {cells: ['Mortgage on the plot or building', 'Read the encumbrances on the property card', 'ASHK'], facts: ['DATA-PURCHASE-0010']},
              {cells: ['Money paid with no safeguard', 'Use the notary\'s special account where possible; never cash', 'Law 110/2018'], facts: ['DATA-LEGAL-0009']},
              {cells: ['Tax surprise', 'New homes sold to individuals are VAT-exempt; check for a "future tax" clause', 'Tax administration'], facts: ['DATA-PURCHASE-0006']},
            ],
          },
        ],
      },
      {
        key: 'CONTRACT',
        heading: 'What the contract should say',
        body: '- The apartment\'s number, floor, area (net and gross) and the plan attached.\n- Payment stages tied to construction milestones, not to dates alone.\n- Delivery date and a penalty for delay.\n- What happens to your payments if the permit is suspended or the building is not completed.\n- The obligation to deliver the property card in your name, and by when.',
      },
    ],
    faq: [
      {q: 'Is there mandatory escrow for off-plan purchases in Albania?', a: 'We found none in force as of October 2026. Protection comes from the contract, staged payments and the notary\'s account.'},
      {q: 'When do I get the property card for an off-plan flat?', a: 'After the building is completed and registered at ASHK; then each unit is registered to its buyer.'},
      {q: 'Is VAT added to an off-plan price?', a: 'No. The sale of a new home to an individual is VAT-exempt.'},
    ],
    sources: ['KB-ALB-2026-003', 'LEGAL-ALB-2026-001', 'PURCHASE-ALB-2026-006'],
    gaps: [
      {id: 'GAP-ESCROW-LAW', text: 'Whether any Albanian law or draft requires escrow or a guarantee for off-plan payments: none found, not exhaustively searched.', priority: 'HIGH'},
      {id: 'GAP-PERMIT-CHECK', text: 'A public online check of building permits (e-Leje) could not be confirmed: the permit system works through e-Albania with the applicant\'s login.', priority: 'HIGH'},
    ],
    related: ['KB-CHECK-DEVELOPER', 'KB-VAT-NEW-BUILD', 'KB-MOVING-MONEY', 'KB-BUYING-STEPS'],
    seoTitle: 'Off-plan property in Albania: risks and escrow (2026)',
    seoDescription: 'Off-plan flats in Albania have no title until the building\'s final registration; no mandatory escrow was found. Risks, contract clauses and safeguards.',
    reviewMonths: 6,
  },
  {
    id: 'KB-CHECK-DEVELOPER',
    slug: 'how-to-check-a-developer-in-albania',
    group: 'process',
    category: 'legal',
    tags: ['off-plan', 'developers', 'due-diligence', 'new-build'],
    title: 'How do you check a property developer in Albania?',
    summary:
      'Start with the land: ask for the property card of the plot (1,500 ALL at ASHK) to see who owns it, any mortgage on it and the registered developer–landowner contract. Then check the developer\'s finished buildings, which must have been finally registered at ASHK before their buyers got property cards, and pay only by bank transfer through a notarised contract (October 2026).',
    dataPeriod: '2026',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'CHECKLIST',
        heading: 'A checklist',
        tables: [
          {
            id: 'DEVELOPER_CHECKS',
            title: 'Checks on a developer and a project',
            columns: ['Check', 'Where', 'What you learn'],
            rows: [
              {cells: ['Property card of the plot', 'ASHK, 1,500 ALL', 'Owner, mortgages, seizures'], facts: ['DATA-PURCHASE-0010']},
              {cells: ['Developer–landowner contract', 'Registered at ASHK (4,000 ALL fee)', 'The developer\'s right to build and sell'], facts: ['DATA-PURCHASE-0013']},
              {cells: ['Finished buildings', 'ASHK final registration of new buildings', 'Whether earlier buyers got their cards'], facts: ['DATA-PURCHASE-0013']},
              {cells: ['Notarised contract, bank payments', 'Notary', 'A traceable, enforceable deal'], facts: ['DATA-LEGAL-0009']},
              {cells: ['Agency involved', 'Licensed under Law 9/2022', 'Commission terms in writing'], facts: ['DATA-PURCHASE-0004']},
            ],
          },
        ],
      },
      {
        key: 'QUESTIONS',
        heading: 'Questions to put to the developer',
        body: '- Which buildings have you completed, and can I see a buyer\'s property card from one of them?\n- Who owns the plot, and is the developer–landowner contract registered?\n- Is there a bank loan secured on the plot or the building?\n- What is the permit number, and when was it issued?\n- When will the building be finally registered, and the cards handed over?',
      },
    ],
    faq: [
      {q: 'How can I tell if a developer owns the land?', a: 'Ask for the property card of the plot: it shows the owner and whether a developer–landowner contract is registered.'},
      {q: 'Can I see a developer\'s past projects in a register?', a: 'Each finished building is finally registered at ASHK; a property card from an earlier buyer is the simplest proof.'},
      {q: 'Is a building permit public in Albania?', a: 'Permits are issued through the e-Leje system. We could not confirm a public online search, so ask the developer for the permit number and the municipality to confirm it.'},
    ],
    sources: ['KB-ALB-2026-003', 'LEGAL-ALB-2026-001', 'PURCHASE-ALB-2026-002', 'KB-ALB-2026-013'],
    gaps: [
      {id: 'GAP-QKB-EXTRACT', text: 'The National Business Centre (QKB) company extract was not checked (qkb.gov.al did not resolve on 2026-10-19).', priority: 'MEDIUM'},
      {id: 'GAP-PERMIT-CHECK', text: 'Public online verification of building permits (e-Leje) not confirmed.', priority: 'HIGH'},
    ],
    related: ['KB-OFF-PLAN-RISKS', 'KB-VAT-NEW-BUILD', 'KB-LEGALISATION-CHECK'],
    seoTitle: 'How to check a property developer in Albania (2026)',
    seoDescription: 'Check the plot\'s property card at ASHK, the registered developer–landowner contract and past buildings\' registration. A due-diligence checklist with sources.',
    reviewMonths: 6,
  },
]
