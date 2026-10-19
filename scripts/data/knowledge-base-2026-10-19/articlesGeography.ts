import type {ArticleSpec} from './types'

/**
 * Where to buy: "X vs Y" pages. Every Domlivo price is a live index token;
 * a city with fewer than 30 flats in the sample is called indicative in the
 * copy, never a headline price.
 */

export const ARTICLES_GEOGRAPHY: ArticleSpec[] = [
  {
    id: 'KB-TIRANA-VS-DURRES',
    slug: 'tirana-or-durres-where-to-buy',
    group: 'geography',
    category: 'market_analysis',
    tags: ['tirana', 'durres', 'comparison', 'prices'],
    title: 'Tirana or Durrës: which is better for buying an apartment?',
    summary:
      'Durrës is the cheaper and better-documented market for a sea-side flat: the Domlivo Price Index puts its median asking price at €{{median:durres}}/m² across {{count:durres}} flats ({{date:durres}}). Tirana is the capital and the rental market, with an average 1+1 rent of €590 a month in the first half of 2026 against a Durrës median of €390, but our Tirana sample is only {{count:tirana}} flats, so its €{{median:tirana}}/m² is indicative.',
    dataPeriod: '2025–2026',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'SIDE_BY_SIDE',
        heading: 'Side by side',
        tables: [
          {
            id: 'TIRANA_DURRES',
            title: 'Tirana and Durrës compared',
            columns: ['Measure', 'Tirana', 'Durrës', 'Source'],
            rows: [
              {cells: ['Median asking price, flats (live)', '€{{median:tirana}}/m² ({{count:tirana}} flats, indicative)', '€{{median:durres}}/m² ({{count:durres}} flats)', 'Domlivo Price Index']},
              {cells: ['20th–80th percentile (live)', '€{{p20:tirana}}–{{p80:tirana}}/m²', '€{{p20:durres}}–{{p80:durres}}/m²', 'Domlivo Price Index']},
              {cells: ['1+1 rent', '€590/month average, H1 2026', '€390/month median asking, Sept 2026', 'Century 21 via Monitor; MerrJep'], facts: ['DATA-RENT-TIRANA-0015', 'DATA-RENT-DURRES-0006']},
              {cells: ['House prices, year to H2 2025', '+4.4%', 'national +28%', 'Bank of Albania survey'], facts: ['DATA-RENT-ALB-0013']},
              {cells: ['Water + sewerage per m³', '65 + 11 ALL', '70 + 50 ALL', 'ERRU'], facts: ['DATA-WATER-0006', 'DATA-WATER-0001', 'DATA-WATER-0002']},
            ],
            methodology: 'Live rows are recomputed from the listings on domlivo.com; a sample under 30 flats is indicative only.',
          },
        ],
      },
      {
        key: 'WHO_FOR',
        heading: 'Which suits whom',
        body: '- Tirana: living and working in the capital, letting to local professionals all year. Prices in Tirana rose fastest earlier: the Bank of Albania survey showed +32.6% a year in the first half of 2025 and +4.4% by the second half.\n- Durrës: a flat by the sea, summer use, holiday letting in season and long-term letting the rest of the year. Rents drop in winter.\n- Both are served by the same national rules: same taxes, same notary and ASHK fees.',
      },
    ],
    faq: [
      {q: 'Is Durrës cheaper than Tirana?', a: 'On asking prices per m², yes in our data, but our Tirana sample is small. Compare the live figures above, which update with the listings.'},
      {q: 'Where are rents higher?', a: 'In Tirana: an average 1+1 rented for €590 a month in the first half of 2026, against a €390 median asking rent in Durrës in September 2026.'},
      {q: 'Are taxes different between the two cities?', a: 'National taxes are the same. Municipal fees, such as the cleaning tariff, and water tariffs differ.'},
    ],
    facts: ['DATA-RENT-ALB-0012'],
    sources: ['KB-ALB-2026-012', 'RENT-TIRANA-2026-006', 'RENT-DURRES-2026-002', 'RENT-ALB-2026-009', 'RENT-ALB-2026-008', 'WATER-ALB-2026-001'],
    gaps: [
      {id: 'GAP-TIRANA-SAMPLE', text: 'The Domlivo index has too few Tirana flats for a headline price; transaction data by city (ASHK or INSTAT) was not found.', priority: 'HIGH'},
    ],
    related: ['KB-DURRES-VS-VLORE', 'KB-YIELDS-DURRES-DISTRICTS', 'KB-UTILITIES-BY-CITY'],
    seoTitle: 'Tirana or Durrës: where to buy an apartment? (2026 data)',
    seoDescription: 'Tirana vs Durrës compared: live asking prices per m², rents (€590 vs €390 for a 1+1), price growth and utility tariffs, with sources.',
    reviewMonths: 12,
  },
  {
    id: 'KB-DURRES-VS-VLORE',
    slug: 'durres-or-vlore-where-to-buy',
    group: 'geography',
    category: 'market_analysis',
    tags: ['durres', 'vlore', 'comparison', 'prices', 'seaside'],
    title: 'Durrës or Vlorë: which seaside city is better to buy in?',
    summary:
      'Durrës is the larger and cheaper market in our data: a median asking price of €{{median:durres}}/m² across {{count:durres}} flats, against €{{median:vlore}}/m² for Vlorë on a sample of only {{count:vlore}} flats ({{date:durres}}). Long-term rents are close: €250–400 a month for a Durrës 1+1 on an annual lease and €400–600 for a Vlorë flat in 2026 listings.',
    dataPeriod: '2026',
    confidence: 'LOW',
    sections: [
      {
        key: 'SIDE_BY_SIDE',
        heading: 'Side by side',
        tables: [
          {
            id: 'DURRES_VLORE',
            title: 'Durrës and Vlorë compared',
            columns: ['Measure', 'Durrës', 'Vlorë', 'Source'],
            rows: [
              {cells: ['Median asking price, flats (live)', '€{{median:durres}}/m² ({{count:durres}} flats)', '€{{median:vlore}}/m² ({{count:vlore}} flats, indicative)', 'Domlivo Price Index']},
              {cells: ['Long-term rent', '1+1 €250–400/month', '€400–600/month', 'Dyqani; KaKtu listings'], facts: ['DATA-RENT-DURRES-0001', 'DATA-RENT-VLORE-0003']},
              {cells: ['Water + sewerage per m³', '70 + 50 ALL', '60 + 17 ALL', 'ERRU'], facts: ['DATA-WATER-0001', 'DATA-WATER-0002', 'DATA-WATER-0007']},
              {cells: ['Household cleaning tariff', 'not found for 2026', '2,400–3,300 ALL a year', 'Bashkia Vlorë'], facts: ['DATA-WASTE-0003', 'DATA-WASTE-0002']},
            ],
            confidence: 'LOW',
          },
        ],
      },
      {
        key: 'CHARACTER',
        heading: 'How the two markets differ',
        body: 'Durrës has the deepest stock of flats for sale on the coast: Plazh, Golem and Shkëmbi i Kavajës each have more than 70 flats in our index. Vlorë has far fewer listings with us, concentrated on the Lungomare, so its median moves a lot with each new listing.\n\nFor a buyer this means two things: in Durrës you can compare districts on solid numbers; in Vlorë, compare individual buildings and ask for recent sale prices in the same block.',
      },
    ],
    faq: [
      {q: 'Is Vlorë more expensive than Durrës?', a: 'Our Vlorë sample is too small to say with confidence; the live figures above show where asking prices stand today.'},
      {q: 'Which city has more flats for sale?', a: 'Durrës, by far, in the Domlivo index: hundreds of flats against a handful in Vlorë.'},
      {q: 'Which is better for long-term letting?', a: 'Asking rents are in a similar band; Durrës has more supply and more tenants commuting to Tirana.'},
    ],
    sources: ['KB-ALB-2026-012', 'RENT-DURRES-2026-001', 'RENT-VLORE-2026-001', 'WATER-ALB-2026-001'],
    gaps: [
      {id: 'GAP-VLORE-SAMPLE', text: 'Vlorë has fewer than 30 flats in the Domlivo index; no independent price series for Vlorë was found.', priority: 'HIGH'},
      {id: 'GAP-DURRES-WASTE', text: 'No 2026 household cleaning tariff found for Durrës.', priority: 'LOW'},
    ],
    related: ['KB-TIRANA-VS-DURRES', 'KB-PLAZH-VS-GOLEM', 'KB-BUY-ITALY'],
    seoTitle: 'Durrës or Vlorë: where to buy by the sea? (2026 data)',
    seoDescription: 'Durrës vs Vlorë: live asking prices per m², rents, water and municipal tariffs compared, with the size of each sample stated.',
    reviewMonths: 12,
  },
  {
    id: 'KB-PLAZH-VS-GOLEM',
    slug: 'plazh-or-golem-durres-where-to-buy',
    group: 'geography',
    category: 'districts',
    tags: ['durres', 'plazh', 'golem', 'districts', 'comparison'],
    citySlug: 'durres',
    title: 'Plazh or Golem: which Durrës district is better to buy in?',
    summary:
      'Golem is cheaper per square metre, Plazh is closer to the city: the Domlivo Price Index puts the median asking price at €{{median:durres/golem-durres}}/m² in Golem and €{{median:durres/plazh}}/m² in Plazh ({{date:durres}}). With similar asking rents for a 1+1, that gives Golem the higher gross yield, about 7% against 5.3% at October 2026 prices.',
    dataPeriod: '2026-10',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'SIDE_BY_SIDE',
        heading: 'Side by side',
        tables: [
          {
            id: 'PLAZH_GOLEM',
            title: 'Plazh and Golem compared',
            columns: ['Measure', 'Plazh', 'Golem', 'Source'],
            rows: [
              {cells: ['Median asking price (live)', '€{{median:durres/plazh}}/m²', '€{{median:durres/golem-durres}}/m²', 'Domlivo Price Index']},
              {cells: ['20th–80th percentile (live)', '€{{p20:durres/plazh}}–{{p80:durres/plazh}}/m²', '€{{p20:durres/golem-durres}}–{{p80:durres/golem-durres}}/m²', 'Domlivo Price Index']},
              {cells: ['Flats in sample (live)', '{{count:durres/plazh}}', '{{count:durres/golem-durres}}', 'Domlivo Price Index']},
              {cells: ['1+1 asking rent', '€300–400, median €350', '€430–450', 'MerrJep, Sept 2026'], facts: ['DATA-RENT-DURRES-0007']},
              {cells: ['Gross yield, 55 m² 1+1', '≈ 5.3%', '≈ 7%', 'Domlivo estimate, Oct 2026'], facts: ['DATA-YIELD-DURRES-CALC-0001', 'DATA-YIELD-DURRES-CALC-0002']},
            ],
          },
        ],
      },
      {
        key: 'CHARACTER',
        heading: 'What the numbers do not show',
        body: 'Plazh is the older beach district next to the city, with year-round shops and services and older building stock. Golem lies further south along the same coast, with newer resort-style complexes that fill in summer and empty in winter. Listing data from September 2026 shows newer Golem complexes asking higher rents than older Plazh flats, which is what lifts the Golem yield.',
      },
    ],
    faq: [
      {q: 'Is Golem cheaper than Plazh?', a: 'Yes, per square metre, in the Domlivo index; the live medians above show by how much today.'},
      {q: 'Which is better for living all year?', a: 'Plazh, being next to the city with services open all year. Golem is more seasonal.'},
      {q: 'Which gives a better rental return?', a: 'On October 2026 asking figures, Golem: about 7% gross for a 1+1, against 5.3% in Plazh. The Golem rent sample is small.'},
    ],
    sources: ['KB-ALB-2026-012', 'RENT-DURRES-2026-002'],
    gaps: [
      {id: 'GAP-GOLEM-RENTS', text: 'Golem rents rest on three listings; achieved rents are not available.', priority: 'MEDIUM'},
    ],
    related: ['KB-YIELDS-DURRES-DISTRICTS', 'KB-SEA-VS-CENTRE-DURRES', 'KB-DURRES-VS-VLORE'],
    seoTitle: 'Plazh or Golem: where to buy in Durrës? (2026 prices)',
    seoDescription: 'Plazh vs Golem in Durrës: live median prices per m², rents and gross yields (about 5.3% vs 7%), from the Domlivo Price Index.',
    reviewMonths: 12,
  },
  {
    id: 'KB-SEA-VS-CENTRE-DURRES',
    slug: 'durres-seafront-or-city-centre-prices',
    group: 'geography',
    category: 'districts',
    tags: ['durres', 'seafront', 'city-centre', 'comparison', 'prices'],
    citySlug: 'durres',
    title: 'By the sea or in the centre: how do prices compare in Durrës?',
    summary:
      'In Durrës the beach and the centre sit at similar median asking prices: €{{median:durres/plazh}}/m² in Plazh by the sea and €{{median:durres/city-center-durres}}/m² in the city centre ({{date:durres}}, Domlivo Price Index). The difference is in the spread: the 80th percentile is €{{p80:durres/city-center-durres}}/m² in the centre against €{{p80:durres/plazh}}/m² in Plazh, and further south along the beach the medians are €{{median:durres/shkembi-durres}}/m² in Shkëmbi i Kavajës and €{{median:durres/golem-durres}}/m² in Golem.',
    dataPeriod: '2026-10',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'TABLE',
        heading: 'Prices by district',
        tables: [
          {
            id: 'SEA_CENTRE',
            title: 'Durrës districts, asking price per m² (live)',
            columns: ['District', 'Setting', 'Median', '20th–80th percentile', 'Flats'],
            rows: [
              {cells: ['City centre', 'Centre', '€{{median:durres/city-center-durres}}', '€{{p20:durres/city-center-durres}}–{{p80:durres/city-center-durres}}', '{{count:durres/city-center-durres}}']},
              {cells: ['Plazh', 'Beach, next to the city', '€{{median:durres/plazh}}', '€{{p20:durres/plazh}}–{{p80:durres/plazh}}', '{{count:durres/plazh}}']},
              {cells: ['Shkëmbi i Kavajës', 'Beach, south', '€{{median:durres/shkembi-durres}}', '€{{p20:durres/shkembi-durres}}–{{p80:durres/shkembi-durres}}', '{{count:durres/shkembi-durres}}']},
              {cells: ['Golem', 'Beach, further south', '€{{median:durres/golem-durres}}', '€{{p20:durres/golem-durres}}–{{p80:durres/golem-durres}}', '{{count:durres/golem-durres}}']},
              {cells: ['Mali i Robit', 'Beach, south of Golem', '€{{median:durres/mali-i-robit}}', '€{{p20:durres/mali-i-robit}}–{{p80:durres/mali-i-robit}}', '{{count:durres/mali-i-robit}}']},
            ],
            methodology: 'Median and percentiles of the asking price per m² of flats and studios listed for sale on domlivo.com, recomputed hourly. Asking prices, not completed sales.',
          },
        ],
      },
      {
        key: 'READING',
        heading: 'How to read it',
        body: '- A "sea view" premium shows up inside each district rather than between them: front-line buildings sit in the top 20% of their own district.\n- The centre\'s wide band reflects a mix of old blocks and new towers by the port.\n- Further from the city along the beach, prices per m² fall, but so do winter services; rents in summer stay high.',
      },
    ],
    faq: [
      {q: 'Is it more expensive to buy by the sea in Durrës?', a: 'Not on the median: Plazh and the centre ask about the same per m². Front-line sea-view flats are priced at the top of their district.'},
      {q: 'Where is the cheapest sea-side flat in Durrës?', a: 'Further south along the beach: Golem and Shkëmbi i Kavajës have lower medians than Plazh in our index.'},
      {q: 'How often do these numbers change?', a: 'The index is recomputed hourly from live listings; the figures on this page are filled in from it each time the page is built.'},
    ],
    sources: ['KB-ALB-2026-012'],
    gaps: [
      {id: 'GAP-SEA-VIEW-FLAG', text: 'Listings are not yet tagged for sea view or front line, so the premium cannot be measured directly.', priority: 'MEDIUM'},
    ],
    related: ['KB-PLAZH-VS-GOLEM', 'KB-YIELDS-DURRES-DISTRICTS', 'KB-TIRANA-VS-DURRES'],
    seoTitle: 'Durrës: seafront or city centre? Prices per m² by district (2026)',
    seoDescription: 'Live median asking prices per m² for Durrës city centre, Plazh, Shkëmbi i Kavajës, Golem and Mali i Robit from the Domlivo Price Index.',
    reviewMonths: 12,
  },
]
