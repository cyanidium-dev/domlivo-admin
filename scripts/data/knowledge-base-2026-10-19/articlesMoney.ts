import type {ArticleSpec} from './types'

/** Money: what a purchase and ownership cost in taxes and fees. */

const NOTARY_BANDS = {
  id: 'NOTARY_BANDS',
  title: 'Notary fee for a sale contract, by value of the deal',
  columns: ['Value of the contract (ALL)', 'Approx. EUR at 92.02', 'Fee'],
  rows: [
    {cells: ['100,000 – 6,000,000', 'up to ≈ 65,200', '0.35%'], facts: ['DATA-PURCHASE-0001']},
    {cells: ['6,000,001 – 15,000,000', '≈ 65,200 – 163,000', '0.30%'], facts: ['DATA-PURCHASE-0001']},
    {cells: ['15,000,001 – 50,000,000', '≈ 163,000 – 543,400', '0.28%'], facts: ['DATA-PURCHASE-0001']},
    {cells: ['50,000,001 – 100,000,000', '≈ 543,400 – 1,086,700', '0.25%'], facts: ['DATA-PURCHASE-0001']},
    {cells: ['above 100,000,000', 'above ≈ 1,086,700', '0.23%'], facts: ['DATA-PURCHASE-0001']},
  ],
  methodology: 'EUR at the Bank of Albania rate of 92.02 ALL/EUR (9 September 2026). The fee is applied to the reference price when the contract price is lower.',
}

export const ARTICLES_MONEY: ArticleSpec[] = [
  {
    id: 'KB-TRANSFER-TAX',
    slug: 'is-there-a-transfer-tax-when-buying-property-in-albania',
    group: 'money',
    category: 'taxes',
    tags: ['taxes', 'purchase-costs', 'transfer-tax'],
    title: 'Is there a 2% transfer tax when you buy property in Albania?',
    summary:
      'Not on an apartment. The 2% local tax on transferring ownership (Law 9632/2006, Art. 28) applies to land and plots, and the seller pays it; when an apartment or house is sold, the seller pays 15% income tax on the gain instead (Joint Instruction 34/2023). The buyer\'s own costs are the notary fee (0.23–0.35% of the value) and the ASHK registration fee of 5,000 ALL (October 2026).',
    dataPeriod: '2026',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'WHO_PAYS_WHAT',
        heading: 'Who pays what when property changes hands',
        tables: [
          {
            id: 'TRANSFER_TAXES',
            title: 'Taxes and fees on a property sale in Albania (October 2026)',
            columns: ['Item', 'Rate or amount', 'Applies to', 'Paid by'],
            rows: [
              {cells: ['Local transfer tax', '2% (indicative level)', 'Land and plots, not buildings', 'Seller'], facts: ['DATA-PURCHASE-0008']},
              {cells: ['Income tax on the gain', '15% of (sale − purchase value)', 'Any property', 'Seller'], facts: ['DATA-TAX-0019']},
              {cells: ['Revaluation (2026 only)', '5% of the uplift instead of 15% later', 'Owners revaluing in 2026', 'Owner'], facts: ['DATA-TAX-0011']},
              {cells: ['Notary fee', '0.23–0.35% of the value', 'Any property', 'Usually the buyer'], facts: ['DATA-PURCHASE-0001']},
              {cells: ['ASHK registration', '5,000 ALL (≈ €54)', 'Any property', 'Buyer'], facts: ['DATA-PURCHASE-0007']},
            ],
          },
        ],
      },
      {
        key: 'WHY_THE_CONFUSION',
        heading: 'Where the "2% transfer tax" comes from',
        body: 'Guides written for foreign buyers often list a 2% transfer tax among the buyer\'s costs. The 2% figure exists, but in the local-tax law it is the indicative rate for transferring land and plots, and it is due from the person who transfers the right, that is the seller.\n\nFor a flat, the tax that matters is the seller\'s 15% income tax on the gain. Where the contract price is below the official reference price, the reference price (less 1% a year of use, up to 30%) is the deemed sale price. Sellers sometimes negotiate for the buyer to carry their taxes; that is a commercial term, so read the preliminary contract.',
      },
      {
        key: 'EXAMPLE',
        heading: 'A worked example: a €100,000 flat',
        tables: [
          {
            id: 'BUYER_COSTS_100K',
            title: 'Buyer\'s legal costs on a €100,000 (9,202,000 ALL) apartment',
            columns: ['Item', 'Amount', 'Note'],
            rows: [
              {cells: ['Notary fee', '≈ 27,600–30,600 ALL (≈ €300–333)', '0.30% on the whole value, or banded 0.35% / 0.30%'], facts: ['DATA-PURCHASE-0001']},
              {cells: ['ASHK registration', '5,000 ALL (≈ €54)', 'VKM 462/2025'], facts: ['DATA-PURCHASE-0007']},
              {cells: ['Transfer tax', '0', 'Not due on a building'], facts: ['DATA-PURCHASE-0008']},
            ],
            methodology: 'Exchange rate 92.02 ALL/EUR (Bank of Albania, 9 September 2026). Translation, a lawyer and any agency commission are extra and not set by law.',
            confidence: 'MEDIUM',
          },
        ],
      },
    ],
    faq: [
      {q: 'Does the buyer pay a transfer tax on an apartment in Albania?', a: 'No. The 2% local transfer tax concerns land and plots and is due from the seller.'},
      {q: 'What tax does the seller pay?', a: '15% income tax on the difference between the sale and purchase value, before ASHK registers the sale.'},
      {q: 'Can the seller make me pay their taxes?', a: 'Only if you agree to it in the contract. Read the preliminary contract for any clause shifting taxes to the buyer.'},
      {q: 'How much are the buyer\'s legal costs in total?', a: 'For a €100,000 flat, about €350–390: the notary fee plus 5,000 ALL for ASHK registration, before translation and any lawyer.'},
    ],
    facts: ['DATA-TAX-0010', 'DATA-TAX-0001'],
    sources: ['PURCHASE-ALB-2026-001', 'KB-ALB-2026-011', 'KB-ALB-2026-003', 'TAX-ALB-2026-016'],
    gaps: [
      {id: 'GAP-9632-ART28-TEXT', text: 'The land-only scope of the 2% tax rests on a consultancy summary of Law 9632/2006 Art. 28 (verified 11.10.2026); the official consolidated text was not opened.', priority: 'HIGH'},
      {id: 'GAP-NOTARY-BANDS-MARGINAL', text: 'Whether the notary percentage bands apply to the whole value or band by band is not stated in the sources; both results are shown.', priority: 'HIGH'},
    ],
    related: ['KB-NOTARY-FEES', 'KB-ASHK-REGISTRATION', 'KB-VAT-NEW-BUILD', 'KB-BUYING-STEPS'],
    seoTitle: 'Is there a 2% transfer tax on property in Albania? (2026)',
    seoDescription: 'The 2% Albanian transfer tax applies to land and is paid by the seller; on an apartment the seller pays 15% on the gain. Buyer costs, worked example and sources.',
    reviewMonths: 6,
  },
  {
    id: 'KB-NOTARY-FEES',
    slug: 'notary-fees-buying-property-albania',
    group: 'money',
    category: 'purchase_costs',
    tags: ['purchase-costs', 'notary', 'fees'],
    title: 'How much does the notary cost when you buy property in Albania?',
    summary:
      'The Albanian notary charges a percentage of the contract value: 0.35% up to 6,000,000 ALL (about €65,200), falling to 0.23% above 100,000,000 ALL, under the Ministry of Justice tariff (Order 279/2012 as amended in 2020). On a €100,000 flat that is roughly €300–333; if the contract price is below the zone reference price, the fee is computed on the reference price.',
    dataPeriod: '2026',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'BANDS',
        heading: 'The tariff',
        tables: [NOTARY_BANDS],
      },
      {
        key: 'OTHER_ACTS',
        heading: 'Other notary acts a buyer may need',
        tables: [
          {
            id: 'NOTARY_OTHER',
            title: 'Fixed notary fees',
            columns: ['Act', 'Fee (ALL)', 'Approx. EUR'],
            rows: [
              {cells: ['Special power of attorney', '3,000', '≈ 33'], facts: ['DATA-PURCHASE-0011']},
              {cells: ['General power of attorney', '5,000', '≈ 54'], facts: ['DATA-PURCHASE-0011']},
              {cells: ['Signature certification', '2,000', '≈ 22'], facts: ['DATA-PURCHASE-0011']},
              {cells: ['Certified copy, per copy', '300', '≈ 3'], facts: ['DATA-PURCHASE-0011']},
              {cells: ['Filing the registration request at ASHK', '4,000', '≈ 43'], facts: ['DATA-PURCHASE-0005']},
            ],
            methodology: 'EUR at 92.02 ALL/EUR (Bank of Albania, 9 September 2026), rounded.',
          },
        ],
      },
      {
        key: 'NOTES',
        heading: 'How to read the bill',
        body: '- The base is the contract value, or the zone reference price when that is higher.\n- The notary also handles translation of the deed when a party does not speak Albanian; translation is billed separately.\n- The notary\'s one-stop service files the registration request at ASHK for 4,000 ALL; the ASHK fee itself (5,000 ALL) is separate.',
      },
    ],
    faq: [
      {q: 'What percentage does a notary charge in Albania?', a: 'Between 0.23% and 0.35% of the contract value, depending on the size of the deal.'},
      {q: 'Who pays the notary, buyer or seller?', a: 'It is agreed between the parties; in practice the buyer usually pays it.'},
      {q: 'Is VAT added to the notary fee?', a: 'Not confirmed in any source we opened. Ask the notary for a written quote with taxes.'},
    ],
    facts: ['DATA-PURCHASE-0012', 'DATA-TAX-0001'],
    sources: ['PURCHASE-ALB-2026-001', 'PURCHASE-ALB-2026-004'],
    gaps: [
      {id: 'GAP-NOTARY-BANDS-MARGINAL', text: 'Whether the bands apply to the whole value or band by band.', priority: 'HIGH'},
      {id: 'GAP-NOTARY-VAT', text: 'Whether 20% VAT is added to notary fees.', priority: 'HIGH'},
      {id: 'GAP-NOTARY-MIN-CAP', text: 'No minimum fee for apartments and no maximum cap found.', priority: 'LOW'},
      {id: 'GAP-NOTARY-TARIFF-OFFICIAL', text: 'The tariff comes from three matching secondary sources; the official consolidated order was not opened.', priority: 'MEDIUM'},
    ],
    related: ['KB-TRANSFER-TAX', 'KB-ASHK-REGISTRATION', 'KB-POWER-OF-ATTORNEY'],
    seoTitle: 'Notary fees for buying property in Albania (2026 tariff)',
    seoDescription: 'Albanian notary fees are 0.23–0.35% of the contract value: the full tariff, fixed fees for powers of attorney and copies, and a €100,000 example.',
    reviewMonths: 6,
  },
  {
    id: 'KB-ASHK-REGISTRATION',
    slug: 'ashk-property-registration-fee-albania',
    group: 'money',
    category: 'purchase_costs',
    tags: ['purchase-costs', 'ashk', 'cadastre', 'fees'],
    title: 'How much does it cost to register a property purchase at ASHK?',
    summary:
      'Registering a sale contract at Albania\'s State Cadastre Agency (ASHK) costs 5,000 ALL, about €54, since VKM 462 of 31 July 2025 raised it from 3,500 ALL. Registering late costs 10% of the fee for each day of delay, up to 300,000 ALL, and the documents a buyer orders to check a property cost 1,000–3,000 ALL each.',
    dataPeriod: '2025–2026',
    confidence: 'HIGH',
    sections: [
      {
        key: 'FEES',
        heading: 'ASHK fees for a buyer',
        tables: [
          {
            id: 'ASHK_FEES',
            title: 'ASHK fees under VKM 462/2025',
            columns: ['Service', 'Fee (ALL)', 'Before (VKM 389/2020)'],
            rows: [
              {cells: ['Registration of a sale contract', '5,000', '3,500'], facts: ['DATA-PURCHASE-0007']},
              {cells: ['Ownership certificate', '3,000', '1,500'], facts: ['DATA-PURCHASE-0010']},
              {cells: ['Copy of the property card', '1,500', '1,000'], facts: ['DATA-PURCHASE-0010']},
              {cells: ['Online check of the legal status', '1,000', '600'], facts: ['DATA-PURCHASE-0010']},
              {cells: ['Late registration interest', '10% of the fee a day, max 300,000', '—'], facts: ['DATA-PURCHASE-0009']},
            ],
          },
        ],
      },
      {
        key: 'HOW',
        heading: 'How registration works',
        body: 'After the deed is signed, the file (sale contract, ownership certificate, updated property card, tax receipts) goes to ASHK, usually through the notary\'s one-stop service (4,000 ALL notary fee) or e-Albania. The seller\'s 15% tax on the gain has to be paid before ASHK registers the transfer.\n\nRegistration is what makes the buyer the owner in the public register: until it is done, the property card still shows the seller.',
      },
    ],
    faq: [
      {q: 'Is the ASHK fee still 3,500 lek?', a: 'No. Since VKM 462 of 31 July 2025 it is 5,000 ALL; calculators that use 3,500 are out of date.'},
      {q: 'Who pays the ASHK registration fee?', a: 'The buyer, in practice; the parties can agree otherwise.'},
      {q: 'What happens if I register late?', a: 'ASHK charges 10% of the fee for each day of delay, up to 300,000 ALL.'},
    ],
    facts: ['DATA-PURCHASE-0005', 'DATA-LEGAL-0010'],
    sources: ['KB-ALB-2026-003', 'KB-ALB-2026-004', 'LEGAL-ALB-2026-002'],
    gaps: [
      {id: 'GAP-ASHK-DEADLINE', text: 'The number of days after signing within which registration is due (30 days is commonly quoted) was not found in VKM 462/2025.', priority: 'MEDIUM'},
    ],
    related: ['KB-NOTARY-FEES', 'KB-TRANSFER-TAX', 'KB-LEGALISATION-CHECK', 'KB-DOCUMENTS'],
    seoTitle: 'ASHK registration fee for a property purchase in Albania (2026)',
    seoDescription: 'Registering a property sale at ASHK costs 5,000 ALL since VKM 462/2025 (was 3,500). Full fee table, late interest and how registration works.',
    reviewMonths: 6,
  },
  {
    id: 'KB-VAT-NEW-BUILD',
    slug: 'is-there-vat-on-new-build-apartments-in-albania',
    group: 'money',
    category: 'taxes',
    tags: ['taxes', 'vat', 'new-build', 'off-plan'],
    title: 'Is there VAT on a new-build apartment in Albania?',
    summary:
      'No VAT is charged on the sale of a new apartment to a private buyer in Albania as of October 2026: the supply of buildings is a VAT-exempt supply, and the option to charge 20% VAT on a building sale cannot be used when the buyer is an individual buying a home. VAT on the first sale of new homes was proposed in the 2022–2026 revenue strategy but not enacted in the sources found.',
    dataPeriod: '2026',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'RULE',
        heading: 'The rule',
        tables: [
          {
            id: 'VAT_RULES',
            title: 'VAT and property in Albania',
            columns: ['Transaction', 'VAT', 'Source'],
            rows: [
              {cells: ['Sale of a new apartment by a developer to an individual', 'Exempt', 'Tax administration notice'], facts: ['DATA-PURCHASE-0006']},
              {cells: ['Resale of an apartment by a private owner', 'Not a VAT supply', '—'], facts: ['DATA-PURCHASE-0006']},
              {cells: ['Standard VAT rate (for comparison)', '20%', 'PwC tax summaries'], facts: ['DATA-TAX-0014']},
              {cells: ['Accommodation services (short stays by a VAT-registered business)', '6%', 'PwC tax summaries'], facts: ['DATA-TAX-0014']},
            ],
          },
        ],
      },
      {
        key: 'WHAT_IT_MEANS',
        heading: 'What it means for the price',
        body: 'The developer cannot recover the VAT it paid on materials and services when the sale is exempt, so that cost sits inside the price per m². A price list is therefore comparable with resale prices as it is: there is no 20% to add.\n\nWatch two things in a contract: a clause that adds VAT "if the law changes" before the deed is signed, and furniture or parking sold as a separate service, which may be invoiced with VAT.',
      },
    ],
    faq: [
      {q: 'Do I pay 20% VAT on top of a developer\'s price?', a: 'No. The sale of a building to a private buyer is VAT-exempt in Albania.'},
      {q: 'Could VAT on new homes be introduced?', a: 'It was proposed in the 2022–2026 revenue strategy; we found no enacted change. Look for a contract clause on future tax changes.'},
      {q: 'Is VAT due on the notary fee?', a: 'Not confirmed. Ask the notary for a quote that states taxes.'},
    ],
    sources: ['PURCHASE-ALB-2026-006', 'TAX-ALB-2026-003'],
    gaps: [
      {id: 'GAP-VAT-PRIMARY', text: 'The exemption is taken from a tax administration notice stored in the research base; tatime.gov.al was unreachable on 2026-10-19, so the 2026 text of Law 92/2014 on VAT was not re-read.', priority: 'HIGH'},
    ],
    related: ['KB-OFF-PLAN-RISKS', 'KB-TRANSFER-TAX', 'KB-CHECK-DEVELOPER'],
    seoTitle: 'VAT on new-build apartments in Albania (2026)',
    seoDescription: 'Selling a new apartment to a private buyer is VAT-exempt in Albania; developers cannot opt for 20% VAT on homes sold to individuals. Rules and sources.',
    reviewMonths: 6,
  },
  {
    id: 'KB-RENTAL-INCOME-TAX',
    slug: 'rental-income-tax-albania',
    group: 'money',
    category: 'taxes',
    tags: ['taxes', 'rental-income', 'airbnb', 'long-term-rental'],
    title: 'How is rental income taxed in Albania?',
    summary:
      'An individual pays 15% tax on rental income in Albania, whether the flat is let long-term or to holiday guests. When the tenant is a business it withholds the 15% and pays it by the 20th of the next month; otherwise the owner declares the rent in the annual DIVA return and pays by 31 March; from 2026 short-term rental income of individuals is taxed at a flat 15% with no NIPT needed.',
    dataPeriod: '2026',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'RULES',
        heading: 'The rules by type of letting',
        tables: [
          {
            id: 'RENT_TAX',
            title: 'Rental income tax for individuals (2026)',
            columns: ['Situation', 'Tax', 'How it is paid'],
            rows: [
              {cells: ['Long-term let to a business', '15% of gross rent', 'Withheld by the tenant, paid by the 20th of the next month'], facts: ['DATA-TAX-0003']},
              {cells: ['Long-term let to a private person', '15%', 'Owner declares in DIVA, pays by 31 March'], facts: ['DATA-TAX-0002', 'DATA-TAX-0004']},
              {cells: ['Short-term (Airbnb, Booking)', '15% flat, from 2026', 'DIVA; no NIPT for a non-professional host'], facts: ['DATA-TAX-ALB-0001', 'DATA-TAX-0006']},
              {cells: ['Unregistered contract with a business', 'Fine 10,000 ALL (individual)', 'Per violation'], facts: ['DATA-TAX-0005']},
            ],
          },
        ],
      },
      {
        key: 'EXAMPLE',
        heading: 'Example',
        body: 'A Durrës 1+1 let for €390 a month earns €4,680 a year. At 15% the Albanian tax is €702, leaving €3,978 before building fees, repairs and vacancy.\n\nLeases longer than one year must be written and notarised. A non-resident owner with a tax treaty at home usually reports the rent there too; the treaty decides whether the home country exempts it or credits the Albanian tax.',
      },
      {
        key: 'COMPANY',
        heading: 'Letting through a company',
        body: 'A small company with turnover up to 14,000,000 ALL pays 0% corporate income tax until 2029, and dividends are taxed at 8% when distributed. That route brings bookkeeping, and it changes nothing for a single flat let to one tenant unless you plan several units.',
        tables: [
          {
            id: 'COMPANY_ROUTE',
            title: 'Company route, for comparison',
            columns: ['Item', 'Rate', 'Source'],
            rows: [
              {cells: ['Corporate income tax, turnover ≤ 14m ALL', '0% until 2029', 'PwC'], facts: ['DATA-TAX-0012']},
              {cells: ['Dividend withholding', '8%', 'PwC'], facts: ['DATA-TAX-0013']},
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'What is the rental income tax rate in Albania?', a: '15% for individuals, for both long-term and short-term lets.'},
      {q: 'Can I deduct expenses from rental income?', a: 'Not as an individual according to the sources found: the 15% is applied to the rent. Whether the platform commission comes off the short-term base is disputed between sources.'},
      {q: 'Do I need a business registration (NIPT) for Airbnb?', a: 'Not for tax, if you have no other commercial activity. Tourism licensing rules are separate and changing.'},
      {q: 'When do I pay?', a: 'By 31 March of the following year in your DIVA return, unless a business tenant withholds it monthly.'},
    ],
    facts: ['DATA-TAX-0007', 'DATA-RENT-ALB-0010', 'DATA-RENT-DURRES-0006'],
    sources: ['TAX-ALB-2026-010', 'TAX-ALB-2026-005', 'TAX-2026-001', 'TAX-ALB-2026-006', 'TAX-ALB-2026-002'],
    gaps: [
      {id: 'GAP-STR-BASE', text: 'Sources disagree on whether short-term income is taxed on the gross amount (HLB) or on the amount after platform commissions (Gazeta Dita); no instruction number was found.', priority: 'HIGH'},
      {id: 'GAP-LAW-29-2023-DEDUCTIONS', text: 'Whether Law 29/2023 allows any expense deduction for individual landlords: primary text not read.', priority: 'MEDIUM'},
    ],
    related: ['KB-RENTAL-MANAGEMENT', 'KB-YIELDS-DURRES-DISTRICTS', 'KB-PROPERTY-TAX', 'KB-BUY-GERMANY'],
    seoTitle: 'Rental income tax in Albania: 15% for owners (2026)',
    seoDescription: 'Albania taxes rental income of individuals at 15%, long-term and short-term. Who withholds, DIVA deadline 31 March, Airbnb rules from 2026, with sources.',
    reviewMonths: 6,
  },
  {
    id: 'KB-PROPERTY-TAX',
    slug: 'annual-property-tax-albania',
    group: 'money',
    category: 'taxes',
    tags: ['taxes', 'property-tax', 'ownership-costs'],
    title: 'How much is the annual property tax on an apartment in Albania?',
    summary:
      'The annual tax on a residential building in Albania is 0.05% of its value, where value means the official reference price per m² times the area, not the market price (PwC, July 2026). For a 60 m² flat in central Tirana at a reference of 228,400 ALL/m² that is about €74 a year; a draft law put out for consultation in June 2026 would move to 0.1–0.2% of market value from tax year 2029.',
    dataPeriod: '2026',
    confidence: 'HIGH',
    sections: [
      {
        key: 'RATES',
        heading: 'Rates now and in the draft',
        tables: [
          {
            id: 'PROPERTY_TAX_RATES',
            title: 'Annual tax on buildings',
            columns: ['Regime', 'Residential', 'Commercial', 'Base'],
            rows: [
              {cells: ['Current law', '0.05% a year', '0.2% a year', 'Reference price × m²'], facts: ['DATA-TAX-0008']},
              {cells: ['Draft (consultation 17 June – 15 July 2026)', '0.1–0.2%', '0.15–0.25%', 'Market value; 50% off for a first home; from 2029'], facts: ['DATA-TAX-0009']},
            ],
          },
        ],
      },
      {
        key: 'EXAMPLES',
        heading: 'What it comes to',
        tables: [
          {
            id: 'PROPERTY_TAX_EXAMPLES',
            title: 'Worked examples, 60 m² flat',
            columns: ['Case', 'Annual tax', 'Basis'],
            rows: [
              {cells: ['Tirana, Blloku, reference 228,400 ALL/m²', '≈ €74', 'Current 0.05%'], facts: ['DATA-TAX-CALC-0002']},
              {cells: ['Draft law example, first home', '≈ €65–130', 'Draft 0.1–0.2%'], facts: ['DATA-TAX-0009']},
            ],
            confidence: 'ESTIMATE',
          },
        ],
        body: 'Municipalities collect the tax, often together with the cleaning tariff on the water bill or at the municipal tax office. The cleaning and waste tariff is separate: Tirana charges households 417 ALL a month in 2026.',
      },
    ],
    faq: [
      {q: 'Is property tax in Albania based on market value?', a: 'Not yet. It is 0.05% of the reference value set by the government per zone. A draft law would switch to market value from 2029.'},
      {q: 'How do I pay it?', a: 'Through the municipality, often added to the water bill; ask the municipal tax office for your account.'},
      {q: 'Do foreign owners pay more?', a: 'No, the rate is the same for every owner.'},
    ],
    facts: ['DATA-WASTE-0001'],
    sources: ['TAX-ALB-2026-004', 'TAX-ALB-2026-007', 'WASTE-TIRANA-2026-001'],
    gaps: [
      {id: 'GAP-REFERENCE-PRICES-COAST', text: 'In-force reference prices outside Tirana (Durrës 67,500, Vlorë 61,800, Sarandë 56,000 ALL/m²) are press-reported only; the 2025 draft with new coastal zones was not adopted as of July 2026.', priority: 'HIGH'},
      {id: 'GAP-DRAFT-PROPERTY-TAX-STATUS', text: 'Status of the 2026 draft property-tax law after consultation.', priority: 'MEDIUM'},
    ],
    related: ['KB-UTILITIES-BY-CITY', 'KB-RENTAL-INCOME-TAX', 'KB-TRANSFER-TAX'],
    seoTitle: 'Annual property tax in Albania: 0.05% of reference value (2026)',
    seoDescription: 'Residential property tax in Albania is 0.05% a year of the reference value; about €74 for 60 m² in central Tirana. The 2026 draft and how to pay.',
    reviewMonths: 6,
  },
  {
    id: 'KB-MOVING-MONEY',
    slug: 'how-to-pay-for-property-in-albania-money-transfer-aml',
    group: 'money',
    category: 'banking',
    tags: ['banking', 'aml', 'payment', 'foreign-buyers'],
    title: 'How do you pay for a property in Albania and move the money legally?',
    summary:
      'By bank transfer. An Albanian notary may not handle more than 150,000 ALL (about €1,630) in cash in a deal (Law 110/2018), cash of 1,000,000 ALL or more must be declared at the border (Law 9917/2008, Art. 17), and notaries and estate agents must identify the buyer and report suspicious transactions. Keep the bank record of where the money came from: it is what the notary and the bank will ask for.',
    dataPeriod: '2026',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'RULES',
        heading: 'The rules on paying',
        tables: [
          {
            id: 'PAYMENT_RULES',
            title: 'Payment and anti-money-laundering rules',
            columns: ['Rule', 'Threshold', 'Basis'],
            rows: [
              {cells: ['Price stated in the deed with the payment method', '—', 'Law 110/2018'], facts: ['DATA-LEGAL-0009']},
              {cells: ['Cash handled by the notary', 'Max 150,000 ALL', 'Law 110/2018'], facts: ['DATA-LEGAL-0009']},
              {cells: ['Cash declaration at the border', 'From 1,000,000 ALL', 'Law 9917/2008 Art. 17'], facts: ['DATA-AML-0001']},
              {cells: ['Notaries, lawyers, estate agents identify the client', 'Every deal', 'Law 9917/2008 Art. 3'], facts: ['DATA-AML-0002']},
              {cells: ['Cadastre reports large transfers', '6,000,000 ALL or more, within 72 h', 'Law 9917/2008 Art. 19'], facts: ['DATA-AML-0002']},
            ],
          },
        ],
      },
      {
        key: 'HOW',
        heading: 'How buyers pay in practice',
        body: '- A deposit under a preliminary contract, by bank transfer to the seller or developer, against a receipt.\n- The balance at the deed, by transfer to the seller or through the notary\'s special bank account, which can hold the funds until the deed is signed.\n- An Albanian bank account is practical but not required by law.\n- Keep proof of the source of funds (salary, sale of a property, savings): the bank and the notary will ask for it on a large transfer.\n- Convert at the bank or before sending: the Bank of Albania fixing was 92.02 ALL per euro on 9 September 2026.',
      },
    ],
    faq: [
      {q: 'Can I pay for an apartment in cash in Albania?', a: 'No. The notary may not handle more than 150,000 ALL in cash; the price goes by bank transfer.'},
      {q: 'How much cash can I bring into Albania?', a: 'Any amount, but from 1,000,000 ALL (about €10,900) you must declare it at the border with its purpose and documents.'},
      {q: 'Does the notary check where my money comes from?', a: 'Notaries are anti-money-laundering reporting entities: they identify you and must report anything suspicious, so expect questions on a large deal.'},
    ],
    facts: ['DATA-TAX-0001', 'DATA-LEGAL-0012'],
    sources: ['LEGAL-ALB-2026-001', 'KB-ALB-2026-010', 'KB-DE-2026-002', 'TAX-ALB-2026-012'],
    gaps: [
      {id: 'GAP-AML-2021', text: 'Law 9917/2008 was read in its 2011 consolidated text; the 2017 and 2021 amendments (Law 120/2021) may change thresholds and obligations.', priority: 'HIGH'},
      {id: 'GAP-NOTARY-ESCROW-INSTRUCTION', text: 'The joint Justice–Finance instruction on paying the price through the notary\'s account was not read.', priority: 'MEDIUM'},
    ],
    related: ['KB-BUY-UKRAINE', 'KB-BUYING-STEPS', 'KB-OFF-PLAN-RISKS'],
    seoTitle: 'How to pay for property in Albania: transfers, cash limits, AML (2026)',
    seoDescription: 'Albanian property is paid by bank transfer: notary cash limit 150,000 ALL, border declaration from 1,000,000 ALL, AML checks by notaries. Rules and sources.',
    reviewMonths: 6,
  },
]
