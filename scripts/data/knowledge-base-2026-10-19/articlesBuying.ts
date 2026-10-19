import type {ArticleSpec} from './types'

/** Buying as a foreigner: who may buy what, with which papers, and what it gives. */

const APARTMENT_RULE_GAP = {
  id: 'GAP-APARTMENT-RULE-TEXT',
  text: 'No consolidated official text was found that states in so many words that foreigners may buy apartments; the rule rests on the absence of any restriction in the land laws and on legal practitioners. To be confirmed against the Official Gazette (qbz.gov.al was unreachable on 2026-10-19).',
  priority: 'MEDIUM' as const,
}

const OWNERSHIP_TABLE = {
  id: 'WHAT_A_FOREIGNER_CAN_OWN',
  title: 'What a foreign private buyer can own in Albania (October 2026)',
  columns: ['Property', 'Can a foreigner own it?', 'Rule'],
  rows: [
    {cells: ['Apartment, house, commercial unit', 'Yes', 'No restriction on buildings'], facts: ['DATA-LEGAL-0001']},
    {cells: ['Building plot (truall)', 'Yes, with a condition', 'Investment on it ≥ 3 × the plot value'], facts: ['DATA-LEGAL-0017']},
    {cells: ['Agricultural land, forest, meadow, pasture', 'No', 'Lease for up to 99 years only'], facts: ['DATA-LEGAL-0016']},
    {cells: ['Anything, through an Albanian company owned by a foreigner', 'Yes', 'The company is an Albanian person'], facts: ['DATA-LEGAL-0001']},
  ],
}

export const ARTICLES_BUYING: ArticleSpec[] = [
  {
    id: 'KB-BUY-FOREIGNERS',
    slug: 'can-foreigners-buy-property-in-albania',
    group: 'buying',
    category: 'legal',
    tags: ['foreign-buyers', 'legal', 'buying'],
    title: 'Can foreigners buy property in Albania?',
    summary:
      'Yes. As of October 2026 a foreign private buyer can own an apartment, a house or a commercial unit in Albania on the same terms as an Albanian, with no permit and no residency needed. The limits concern land: agricultural land, forests and pastures cannot be owned by foreigners (lease up to 99 years only), and a building plot can be bought once the investment on it reaches three times the plot value.',
    dataPeriod: '2026',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'WHAT_YOU_CAN_OWN',
        heading: 'What a foreigner can and cannot own',
        body: 'Albanian law restricts foreigners only on land. Apartments, houses and commercial premises are bought through the same notary deed and the same registration at the State Cadastre Agency (ASHK) as for a local buyer.\n\nNationality does not change this: the rules below apply equally to a buyer from Germany, Poland, Italy, Ukraine or the United Kingdom. No reciprocity test was found in the land laws.',
        tables: [OWNERSHIP_TABLE],
      },
      {
        key: 'HOW_IT_WORKS',
        heading: 'How the purchase works for a foreigner',
        body: '- The deed is signed before an Albanian notary, in Albanian; a buyer who does not speak Albanian has it translated.\n- The notary checks the seller\'s title in the electronic property register before signing.\n- The buyer identifies with a passport; documents issued abroad need an apostille and a certified translation.\n- The price is paid by bank transfer: a notary may not handle more than 150,000 ALL in cash.\n- The contract is then registered at ASHK, which is the moment the buyer becomes the registered owner.',
        tables: [
          {
            id: 'FOREIGN_BUYER_STEPS',
            title: 'The rules that apply to a foreign buyer',
            columns: ['Step', 'Rule', 'Basis'],
            rows: [
              {cells: ['Identity', 'Passport for a foreign buyer', 'Law 110/2018 on the notary'], facts: ['DATA-LEGAL-0002']},
              {cells: ['Language', 'Deed in Albanian, translated for the buyer', 'Law 110/2018'], facts: ['DATA-LEGAL-0003']},
              {cells: ['Foreign documents', 'Apostille, not consular legalisation', 'Hague Apostille Convention'], facts: ['DATA-LEGAL-0005']},
              {cells: ['Seller\'s title', 'Checked by the notary in the register', 'Law 110/2018'], facts: ['DATA-LEGAL-0008']},
              {cells: ['Payment', 'Bank transfer; notary cash limit 150,000 ALL', 'Law 110/2018'], facts: ['DATA-LEGAL-0009']},
              {cells: ['Registration', 'Sale contract registered at ASHK, fee 5,000 ALL', 'VKM 462/2025'], facts: ['DATA-PURCHASE-0007']},
            ],
          },
        ],
      },
      {
        key: 'RESIDENCE',
        heading: 'Does owning property let you live in Albania?',
        body: 'Owning a property does not by itself extend the visa-free stay of 90 days in any 180. It does qualify the owner for a temporary residence permit under Article 84 of the law on foreigners, issued for up to one year and renewable, with no minimum property value in the law.',
      },
    ],
    faq: [
      {q: 'Do I need Albanian residency to buy an apartment?', a: 'No. A passport is enough to sign the deed at the notary. Residency only matters if you want to stay longer than 90 days in any 180.'},
      {q: 'Can a foreigner buy a house with a garden?', a: 'A house is a building and can be bought freely. The plot under it is building land (truall); agricultural land around it cannot be owned by a foreign private person, only leased for up to 99 years.'},
      {q: 'Is it safer to buy through an Albanian company?', a: 'A company owned by a foreigner is an Albanian person and is not limited on land. For a single apartment it adds bookkeeping and tax filings without changing the buyer\'s rights over a building.'},
      {q: 'Are there extra taxes for foreign buyers?', a: 'No foreigner surcharge exists. The buyer pays the notary and the ASHK registration fee like any buyer; the seller pays 15% tax on the gain.'},
    ],
    facts: ['DATA-LEGAL-0014', 'DATA-LEGAL-0013'],
    sources: ['LEGAL-ALB-2026-001', 'KB-ALB-2026-008', 'KB-ALB-2026-009', 'KB-ALB-2026-001'],
    gaps: [APARTMENT_RULE_GAP],
    related: ['KB-LAND-VS-APARTMENT', 'KB-DOCUMENTS', 'KB-RESIDENCE-PURCHASE', 'KB-BUYING-STEPS'],
    seoTitle: 'Can foreigners buy property in Albania? Rules for 2026',
    seoDescription: 'Foreigners can own apartments and houses in Albania with no permit; agricultural land is excluded and building plots need 3× investment. Rules, documents and sources.',
    reviewMonths: 6,
  },
  {
    id: 'KB-BUY-GERMANY',
    slug: 'can-a-german-citizen-buy-property-in-albania',
    group: 'buying',
    category: 'legal',
    tags: ['foreign-buyers', 'germany', 'taxes', 'legal'],
    title: 'Can a German citizen buy property in Albania?',
    summary:
      'Yes. A German citizen can buy an apartment or a house in Albania with a passport or identity card, on the same terms as an Albanian buyer; only agricultural land is closed to foreigners. Under the Germany–Albania tax treaty (in effect since 2012) rent from an Albanian flat is taxed in Albania and exempt in Germany, which only uses it to set the rate on other income (Progressionsvorbehalt).',
    dataPeriod: '2026',
    confidence: 'HIGH',
    sections: [
      {
        key: 'OWNERSHIP',
        heading: 'What a German buyer can own',
        body: 'There is no rule specific to German or EU citizens: a German buyer is a foreign private person under Albanian law, free to buy buildings and limited only on land.',
        tables: [OWNERSHIP_TABLE],
      },
      {
        key: 'ENTRY_AND_STAY',
        heading: 'Entry, stay and residence',
        body: 'The Auswärtiges Amt (19 October 2026) lists passport, temporary passport, identity card and child passport as valid for entry; a temporary identity card is not accepted. Staying longer than 90 days needs a long-stay visa before travel or a residence permit applied for in the first 30 days; an apostilled German certificate of good conduct is part of the application.',
        tables: [
          {
            id: 'DE_ENTRY',
            title: 'Entry and residence for German citizens',
            columns: ['Question', 'Answer', 'Source'],
            rows: [
              {cells: ['Documents', 'Passport or identity card, valid ≥ 3 months on entry', 'Auswärtiges Amt'], facts: ['DATA-ENTRY-DE-0001']},
              {cells: ['Visa-free stay', '90 days in any 180', 'Law 79/2021 Art. 29'], facts: ['DATA-LEGAL-0013']},
              {cells: ['Permit for an owner', 'Up to 1 year, renewable', 'Law 79/2021 Art. 84'], facts: ['DATA-LEGAL-0014']},
              {cells: ['Permit for a pensioner', 'Pension income ≥ 1,200,000 ALL a year', 'Law 79/2021 Art. 85, VKM 858/2021'], facts: ['DATA-LEGAL-0015']},
            ],
          },
        ],
      },
      {
        key: 'TAX',
        heading: 'Tax: what the treaty says',
        body: 'Albania taxes rent from an Albanian property (15% for individuals) and a gain on its sale (15%). Germany exempts both under Article 23(1)(a) of the treaty and applies the progression clause, so the income raises the rate on your German income without being taxed again. Because Albania is outside the EU and EEA, the exception in § 32b EStG for EU property does not apply.\n\nA German statutory pension paid to someone who lives in Albania is taxed only in Albania (Article 18). Civil-service pensions are the exception: Germany keeps the right to tax them.',
        tables: [
          {
            id: 'DE_TAX',
            title: 'Germany–Albania treaty, property and pensions',
            columns: ['Income', 'Taxed in Albania', 'Taxed in Germany'],
            rows: [
              {cells: ['Rent from an Albanian flat', 'Yes, 15%', 'Exempt, with progression'], facts: ['DATA-TAX-DE-0001', 'DATA-TAX-0002']},
              {cells: ['Gain on selling it', 'Yes, 15% of the gain', 'Exempt, with progression'], facts: ['DATA-TAX-DE-0001', 'DATA-TAX-0010']},
              {cells: ['German statutory pension, resident in Albania', 'Residence state', 'No'], facts: ['DATA-TAX-DE-0002']},
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'Can I enter Albania with my German identity card?', a: 'Yes. The Auswärtiges Amt accepts the identity card, valid at least three months on entry; the temporary identity card is not accepted.'},
      {q: 'Do I declare Albanian rent in Germany?', a: 'Yes, on the foreign-income annex of the German return: it is exempt but counts for the progression of your rate. A tax adviser should confirm the form for your case.'},
      {q: 'Does buying a flat give me a residence permit?', a: 'Ownership qualifies you for a one-year renewable permit under Article 84 of the Albanian law on foreigners; you still apply for it, it is not automatic.'},
      {q: 'Is there a social security agreement between Germany and Albania?', a: 'Yes, for pensions, in force since 1 December 2017: a German pension is paid in full to Albania. It does not cover health insurance.'},
    ],
    sources: ['KB-DE-2026-001', 'KB-DE-2026-002', 'KB-DE-2026-003', 'KB-DE-2026-004', 'KB-ALB-2026-001', 'KB-ALB-2026-002'],
    gaps: [
      {id: 'GAP-DE-PENSION-AL-TAX', text: 'How Albania itself taxes a foreign pension of a resident was not researched; a draft to exempt it was reported but not checked.', priority: 'HIGH'},
      APARTMENT_RULE_GAP,
    ],
    related: ['KB-BUY-FOREIGNERS', 'KB-RESIDENCE-PURCHASE', 'KB-RENTAL-INCOME-TAX', 'KB-DOCUMENTS'],
    seoTitle: 'Can a German buy property in Albania? Rules and tax treaty 2026',
    seoDescription: 'German citizens can buy apartments in Albania with an ID card. Entry, residence permit, and how the Germany–Albania tax treaty treats rent and pensions, with sources.',
    reviewMonths: 6,
  },
  {
    id: 'KB-BUY-POLAND',
    slug: 'can-a-polish-citizen-buy-property-in-albania',
    group: 'buying',
    category: 'legal',
    tags: ['foreign-buyers', 'poland', 'taxes', 'legal'],
    title: 'Can a Polish citizen buy property in Albania?',
    summary:
      'Yes. A Polish citizen can buy an apartment or a house in Albania with a passport or identity card, on the same terms as an Albanian; agricultural land is the only category closed to foreigners. Under the 1993 Poland–Albania tax treaty, rent from the flat is taxed in Albania and exempt in Poland with progression; Polish private rental income at home is taxed at 8.5% (PIT-28).',
    dataPeriod: '2026',
    confidence: 'HIGH',
    sections: [
      {
        key: 'OWNERSHIP',
        heading: 'What a Polish buyer can own',
        body: 'EU citizenship does not create a special regime in Albania, which is not an EU member: a Polish buyer is a foreign private person, free to buy buildings and limited on land.',
        tables: [OWNERSHIP_TABLE],
      },
      {
        key: 'ENTRY_AND_STAY',
        heading: 'Entry and stay',
        body: 'The Polish foreign ministry (Odyseusz, 15 October 2026) accepts a passport or an identity card valid at least three months after leaving Albania, allows up to 90 days in any 180 without a visa and states that there is no registration duty. A longer stay is arranged with the immigration office, with a criminal record certificate and proof of address; a property deed counts as proof.',
        tables: [
          {
            id: 'PL_ENTRY',
            title: 'Entry and residence for Polish citizens',
            columns: ['Question', 'Answer', 'Source'],
            rows: [
              {cells: ['Documents', 'Passport or identity card, valid ≥ 3 months after leaving', 'MSZ Odyseusz'], facts: ['DATA-ENTRY-PL-0001']},
              {cells: ['Visa-free stay', '90 days in any 180', 'Law 79/2021 Art. 29'], facts: ['DATA-LEGAL-0013']},
              {cells: ['Permit for an owner', 'Up to 1 year, renewable', 'Law 79/2021 Art. 84'], facts: ['DATA-LEGAL-0014']},
            ],
          },
        ],
      },
      {
        key: 'TAX',
        heading: 'Tax for a Polish resident',
        body: 'Albania taxes the rent (15% for individuals) and any gain on sale (15%). Poland exempts this income under Article 24(1)(a) of the treaty and may apply progression under Article 24(1)(c). Albania reserved the MLI\'s method article in full, so the original exemption method still governs this treaty.\n\nThe Polish flat rate for private rent (8.5% up to PLN 100,000, then 12.5%) applies to rent earned in Poland; how the progression clause works inside PIT-28 should be confirmed with a Polish tax adviser.',
        tables: [
          {
            id: 'PL_TAX',
            title: 'Poland–Albania treaty, property income',
            columns: ['Income', 'Taxed in Albania', 'Taxed in Poland'],
            rows: [
              {cells: ['Rent from an Albanian flat', 'Yes, 15%', 'Exempt, with progression'], facts: ['DATA-TAX-PL-0001', 'DATA-TAX-0002']},
              {cells: ['Gain on selling it', 'Yes, 15% of the gain', 'Exempt, with progression'], facts: ['DATA-TAX-PL-0001', 'DATA-TAX-0010']},
              {cells: ['Rent from a flat in Poland (for comparison)', '—', '8.5% to PLN 100,000, then 12.5%'], facts: ['DATA-TAX-PL-0002']},
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'Can I travel to Albania on a Polish ID card?', a: 'Yes. The identity card is accepted if it is valid at least three months after you leave Albania.'},
      {q: 'Do I pay Polish tax on rent from Albania?', a: 'Not directly: the treaty exempts it in Poland, but Poland may take it into account to set the rate on your other income. The rent is taxed in Albania at 15%.'},
      {q: 'Do I need to register my stay in Albania?', a: 'The Polish foreign ministry states there is no registration duty for stays up to 90 days in 180.'},
    ],
    sources: ['KB-PL-2026-001', 'KB-PL-2026-002', 'KB-PL-2026-003', 'KB-ALB-2026-001'],
    gaps: [
      {id: 'GAP-PL-PIT28-PROGRESSION', text: 'How the progression clause is applied to Albanian rent inside a PIT-28 return (and whether PIT/ZG is attached) could not be confirmed: podatki.gov.pl was behind a CAPTCHA.', priority: 'HIGH'},
      APARTMENT_RULE_GAP,
    ],
    related: ['KB-BUY-FOREIGNERS', 'KB-RENTAL-INCOME-TAX', 'KB-DOCUMENTS', 'KB-POWER-OF-ATTORNEY'],
    seoTitle: 'Can a Pole buy property in Albania? Rules and taxes 2026',
    seoDescription: 'Polish citizens can buy apartments in Albania with an ID card. Entry, stay, and how the Poland–Albania tax treaty treats rent, with official sources.',
    reviewMonths: 6,
  },
  {
    id: 'KB-BUY-ITALY',
    slug: 'can-an-italian-citizen-buy-property-in-albania',
    group: 'buying',
    category: 'legal',
    tags: ['foreign-buyers', 'italy', 'taxes', 'legal'],
    title: 'Can an Italian citizen buy property in Albania?',
    summary:
      'Yes. An Italian citizen can buy an apartment or a house in Albania on the same terms as an Albanian; only agricultural land is closed to foreigners. Italy and Albania have a double taxation convention in force since 21 December 1999 and an investment protection agreement in force since 1996 (Farnesina, January 2026).',
    dataPeriod: '2026',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'OWNERSHIP',
        heading: 'What an Italian buyer can own',
        body: 'Albanian law has no rule specific to Italian citizens: an Italian buyer is a foreign private person, free to buy buildings and limited only on land.',
        tables: [OWNERSHIP_TABLE],
      },
      {
        key: 'TREATIES',
        heading: 'Agreements between Italy and Albania',
        tables: [
          {
            id: 'IT_TREATIES',
            title: 'Agreements in force (Farnesina, 23 January 2026)',
            columns: ['Agreement', 'Signed', 'In force'],
            rows: [
              {cells: ['Double taxation convention, with protocol', 'Tirana, 12.12.1994', '21.12.1999'], facts: ['DATA-TAX-IT-0001']},
              {cells: ['Investment promotion and protection', 'Rome, 12.9.1991', '29.1.1996'], facts: ['DATA-TAX-IT-0001']},
            ],
          },
        ],
        body: 'Under the standard OECD structure such conventions follow, income from immovable property may be taxed where the property is; Albania taxes rent at 15% and a gain on sale at 15%. How Italy relieves that income for an Italian resident (credit or exemption) depends on the convention\'s article on eliminating double taxation, which we have not yet checked in the text.',
      },
      {
        key: 'STAY',
        heading: 'Stay and residence',
        body: 'Citizens of visa-exempt countries may stay up to 90 days in any 180 under Article 29 of the Albanian law on foreigners. A property owner can apply for a one-year renewable residence permit under Article 84; a retired person can use the pensioner permit of Article 85, with a pension income of at least 1,200,000 ALL a year.',
        tables: [
          {
            id: 'IT_STAY',
            title: 'Stay rules that apply to Italian citizens',
            columns: ['Question', 'Answer', 'Basis'],
            rows: [
              {cells: ['Visa-free stay', '90 days in any 180', 'Law 79/2021 Art. 29'], facts: ['DATA-LEGAL-0013']},
              {cells: ['Permit for an owner', 'Up to 1 year, renewable', 'Law 79/2021 Art. 84'], facts: ['DATA-LEGAL-0014']},
              {cells: ['Permit for a pensioner', 'Pension ≥ 1,200,000 ALL a year', 'Law 79/2021 Art. 85'], facts: ['DATA-LEGAL-0015']},
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'Is there a tax treaty between Italy and Albania?', a: 'Yes. The convention signed in Tirana on 12 December 1994 has been in force since 21 December 1999.'},
      {q: 'Do Italians need a visa for Albania?', a: 'No visa is needed for stays up to 90 days in any 180 under the Albanian law on foreigners. For a longer stay you apply for a residence permit.'},
      {q: 'Can an Italian buy land by the sea in Albania?', a: 'A building plot, yes, once the investment on it reaches three times the plot value. Agricultural land cannot be owned by a foreign private person.'},
    ],
    sources: ['KB-IT-2026-001', 'KB-ALB-2026-001', 'KB-ALB-2026-008', 'KB-ALB-2026-009'],
    gaps: [
      {id: 'GAP-IT-DTA-METHOD', text: 'The Italy–Albania convention\'s method for eliminating double taxation (credit or exemption) on Albanian rent was not read in the text.', priority: 'HIGH'},
      {id: 'GAP-IT-ENTRY-DOCS', text: 'Whether an Italian identity card is accepted at the border, and its validity rule, was not confirmed on viaggiaresicuri.it (page did not load).', priority: 'MEDIUM'},
      APARTMENT_RULE_GAP,
    ],
    related: ['KB-BUY-FOREIGNERS', 'KB-RESIDENCE-PURCHASE', 'KB-RENTAL-INCOME-TAX', 'KB-DURRES-VS-VLORE'],
    seoTitle: 'Can an Italian buy property in Albania? Rules and treaty 2026',
    seoDescription: 'Italian citizens can buy apartments and houses in Albania; agricultural land is excluded. Tax treaty in force since 1999, stay rules and residence permits, with sources.',
    reviewMonths: 6,
  },
  {
    id: 'KB-BUY-UKRAINE',
    slug: 'can-a-ukrainian-citizen-buy-property-in-albania',
    group: 'buying',
    category: 'legal',
    tags: ['foreign-buyers', 'ukraine', 'legal'],
    title: 'Can a Ukrainian citizen buy property in Albania?',
    summary:
      'Yes. A Ukrainian citizen can buy an apartment or a house in Albania on the same terms as any foreigner; agricultural land is closed to all foreign private buyers. Under a Council of Ministers decision of 21 May 2025, Ukrainians who entered Albania on or after 18 March 2022 may stay up to four years without a residence permit.',
    dataPeriod: '2026',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'OWNERSHIP',
        heading: 'What a Ukrainian buyer can own',
        body: 'There is no nationality test in the Albanian land rules: a Ukrainian buyer can buy any building and is limited on land like any foreigner.',
        tables: [OWNERSHIP_TABLE],
      },
      {
        key: 'STAY',
        heading: 'Stay: the special rule for Ukrainians',
        body: 'Since 2022 Albania has let Ukrainian citizens stay without a residence permit under Decision No. 169 of 2022. The May 2025 amendment extended that period from three to four years for people who entered on or after 18 March 2022. Outside that regime the general rules apply: 90 days in any 180 for visa-free stays, and a one-year renewable permit for a property owner.',
        tables: [
          {
            id: 'UA_STAY',
            title: 'Stay rules for Ukrainian citizens',
            columns: ['Situation', 'Rule', 'Basis'],
            rows: [
              {cells: ['Entered on or after 18.03.2022', 'Up to 4 years without a residence permit', 'VKM 169/2022 as amended 21.05.2025'], facts: ['DATA-LEGAL-0022']},
              {cells: ['Property owner who wants a permit', 'Up to 1 year, renewable', 'Law 79/2021 Art. 84'], facts: ['DATA-LEGAL-0014']},
              {cells: ['General visa-free stay', '90 days in any 180', 'Law 79/2021 Art. 29'], facts: ['DATA-LEGAL-0013']},
            ],
          },
        ],
      },
      {
        key: 'PAYMENT',
        heading: 'Paying from abroad',
        body: 'The purchase price is paid by bank transfer: an Albanian notary may not accept more than 150,000 ALL in cash, and cash of 1,000,000 ALL or more carried across the border must be declared. Transfers from Ukraine are also subject to Ukrainian currency rules under martial law, which this page does not cover; check them with your bank before signing a preliminary contract.',
        tables: [
          {
            id: 'UA_PAYMENT',
            title: 'Albanian rules on paying for a property',
            columns: ['Rule', 'Threshold', 'Basis'],
            rows: [
              {cells: ['Cash at the notary', 'Max 150,000 ALL', 'Law 110/2018'], facts: ['DATA-LEGAL-0009']},
              {cells: ['Cash declaration at the border', 'From 1,000,000 ALL', 'Law 9917/2008 Art. 17'], facts: ['DATA-AML-0001']},
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'Does a Ukrainian need a residence permit to buy?', a: 'No. A passport is enough at the notary. The permit question only concerns how long you may stay.'},
      {q: 'Is there a Ukraine–Albania tax treaty?', a: 'We did not find one in force; Albanian rent and sale gains are taxed in Albania at 15% either way. Ukrainian tax on worldwide income should be checked with an adviser.'},
      {q: 'Can I pay for the flat in cash?', a: 'No. The notary may not handle more than 150,000 ALL in cash, so the price goes by bank transfer.'},
    ],
    sources: ['KB-UA-2026-001', 'KB-ALB-2026-001', 'KB-ALB-2026-010', 'LEGAL-ALB-2026-001'],
    gaps: [
      {id: 'GAP-UA-2027-EXTENSION', text: 'A newer decision letting Ukrainians stay until 30 March 2027 is reported by a Ukrainian travel portal but not confirmed in the Official Gazette.', priority: 'HIGH'},
      {id: 'GAP-UA-DTA', text: 'Whether a Ukraine–Albania double taxation treaty exists was not confirmed in an official list.', priority: 'MEDIUM'},
      {id: 'GAP-UA-NBU', text: 'Ukrainian (NBU) limits on transferring money abroad for a property purchase under martial law are not covered.', priority: 'HIGH'},
      APARTMENT_RULE_GAP,
    ],
    related: ['KB-BUY-FOREIGNERS', 'KB-MOVING-MONEY', 'KB-RESIDENCE-PURCHASE', 'KB-DOCUMENTS'],
    seoTitle: 'Can a Ukrainian buy property in Albania? Rules 2026',
    seoDescription: 'Ukrainians can buy apartments in Albania like any foreigner. The four-year stay rule of 2025, residence permits and how to pay, with sources.',
    reviewMonths: 6,
  },
  {
    id: 'KB-BUY-UK',
    slug: 'can-a-british-citizen-buy-property-in-albania',
    group: 'buying',
    category: 'legal',
    tags: ['foreign-buyers', 'united-kingdom', 'taxes', 'legal'],
    title: 'Can a British citizen buy property in Albania?',
    summary:
      'Yes. A British citizen can buy an apartment or a house in Albania on the same terms as an Albanian; only agricultural land is closed to foreigners. GOV.UK allows up to 90 days in any 180 without a visa, and the UK–Albania double taxation agreement has been in force since 30 December 2013.',
    dataPeriod: '2026',
    confidence: 'HIGH',
    sections: [
      {
        key: 'OWNERSHIP',
        heading: 'What a British buyer can own',
        tables: [OWNERSHIP_TABLE],
      },
      {
        key: 'ENTRY',
        heading: 'Entry, stay and residence',
        tables: [
          {
            id: 'UK_ENTRY',
            title: 'Entry and residence for British citizens',
            columns: ['Question', 'Answer', 'Source'],
            rows: [
              {cells: ['Visa-free stay', '90 days in any 180', 'GOV.UK travel advice'], facts: ['DATA-ENTRY-UK-0001']},
              {cells: ['Passport validity', '≥ 3 months after leaving', 'GOV.UK travel advice'], facts: ['DATA-ENTRY-UK-0001']},
              {cells: ['Permit for an owner', 'Up to 1 year, renewable', 'Law 79/2021 Art. 84'], facts: ['DATA-LEGAL-0014']},
              {cells: ['Permit for a pensioner', 'Pension ≥ 1,200,000 ALL a year', 'Law 79/2021 Art. 85'], facts: ['DATA-LEGAL-0015']},
            ],
          },
        ],
      },
      {
        key: 'TAX',
        heading: 'Tax treaty',
        body: 'The UK–Albania agreement has effect in Albania from 1 January 2014 and in the UK from 6 April 2014 for income tax and capital gains tax, and was modified by the multilateral instrument from 2021. Albania taxes rent from the flat at 15% and a gain on sale at 15%; a UK resident reports the income in the UK and claims relief for the Albanian tax under the agreement.',
        tables: [
          {
            id: 'UK_TAX',
            title: 'What Albania taxes',
            columns: ['Income', 'Albanian tax', 'Treaty'],
            rows: [
              {cells: ['Rent from the flat', '15%', 'UK–Albania DTA 2013'], facts: ['DATA-TAX-0002', 'DATA-TAX-UK-0001']},
              {cells: ['Gain on sale', '15% of the gain', 'UK–Albania DTA 2013'], facts: ['DATA-TAX-0010', 'DATA-TAX-UK-0001']},
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'Do British citizens need a visa for Albania?', a: 'No, for stays up to 90 days in any 180. Longer stays need a long-stay visa in advance or a residence permit.'},
      {q: 'Is there a UK–Albania tax treaty?', a: 'Yes, in force since 30 December 2013, effective in the UK from 6 April 2014 for income tax and capital gains tax.'},
      {q: 'Can I buy without travelling to Albania?', a: 'Yes, through a power of attorney signed abroad, apostilled and translated into Albanian.'},
    ],
    sources: ['KB-UK-2026-001', 'KB-UK-2026-002', 'KB-ALB-2026-001', 'KB-ALB-2026-008'],
    gaps: [
      {id: 'GAP-UK-RELIEF-METHOD', text: 'The relief article of the UK–Albania agreement (credit method) was not read in the treaty text.', priority: 'MEDIUM'},
      APARTMENT_RULE_GAP,
    ],
    related: ['KB-BUY-FOREIGNERS', 'KB-POWER-OF-ATTORNEY', 'KB-RESIDENCE-PURCHASE', 'KB-RENTAL-INCOME-TAX'],
    seoTitle: 'Can a British citizen buy property in Albania? 2026 rules',
    seoDescription: 'UK citizens can buy apartments and houses in Albania. 90/180 stay rule, residence permits and the UK–Albania tax treaty in force since 2013, with sources.',
    reviewMonths: 6,
  },
  {
    id: 'KB-LAND-VS-APARTMENT',
    slug: 'can-a-foreigner-buy-land-in-albania',
    group: 'buying',
    category: 'legal',
    tags: ['foreign-buyers', 'land', 'legal'],
    title: 'Can a foreigner buy land in Albania, or only an apartment?',
    summary:
      'Only some land. A foreign private buyer cannot own agricultural land, forests, meadows or pastures in Albania and may lease them for up to 99 years (Law 8337/1998, Art. 4); a building plot can be bought once the investment on it reaches at least three times the plot value (Law 7980/1995, Art. 5). Apartments and houses carry no such limit; a draft law to open agricultural land was in public consultation in May 2026.',
    dataPeriod: '2026',
    confidence: 'HIGH',
    sections: [
      {
        key: 'RULES',
        heading: 'The rules by type of land',
        tables: [OWNERSHIP_TABLE],
      },
      {
        key: 'PRACTICE',
        heading: 'What this means in practice',
        body: '- An apartment in a block: the share of the common land comes with it; nothing extra to check.\n- A house with its own plot: the plot must be registered as building land (truall), not agricultural land. Ask for the property card before paying anything.\n- A plot to build on: the purchase is tied to a project worth at least three times the plot. Plots of historic or archaeological value, national parks, reserves and military land are excluded.\n- Farmland or olive groves: only a lease of up to 99 years, or ownership through an Albanian company.',
      },
      {
        key: 'DRAFT',
        heading: 'The 2026 draft law on agricultural land',
        body: 'In May 2026 the Ministry of Agriculture put out for consultation a draft law on transferring agricultural land to foreign persons, linked to EU accession (free movement of capital). It would repeal Article 4 of Law 8337/1998. Until it is adopted and published, the ban stands.',
      },
    ],
    faq: [
      {q: 'Can I buy a plot by the sea and build a villa?', a: 'Yes, if the plot is building land and the investment reaches three times the plot value; coastal and protected zones carry their own planning limits.'},
      {q: 'Can I buy an olive grove?', a: 'Not in your own name: it is agricultural land. A lease of up to 99 years or an Albanian company are the routes used.'},
      {q: 'Has the ban on agricultural land been lifted?', a: 'Not as of October 2026. A draft law was in public consultation in May 2026; its adoption is not confirmed.'},
    ],
    facts: ['DATA-LEGAL-0001'],
    sources: ['KB-ALB-2026-008', 'KB-ALB-2026-009', 'LEGAL-ALB-2026-005'],
    gaps: [
      {id: 'GAP-AGRI-DRAFT-STATUS', text: 'Adoption status of the draft law on agricultural land for foreigners (RENJK 972) after May 2026.', priority: 'HIGH'},
      {id: 'GAP-7980-AMENDMENTS', text: 'Later amendments to Law 7980/1995 were not checked; the 3× rule is quoted from the original text.', priority: 'MEDIUM'},
    ],
    related: ['KB-BUY-FOREIGNERS', 'KB-INFORMAL-HOUSES', 'KB-LEGALISATION-CHECK'],
    seoTitle: 'Can foreigners buy land in Albania? Rules for 2026',
    seoDescription: 'Foreigners cannot own agricultural land in Albania (lease up to 99 years); building plots need a 3× investment. The laws, the 2026 draft and what it means.',
    reviewMonths: 6,
  },
  {
    id: 'KB-DOCUMENTS',
    slug: 'documents-to-buy-property-in-albania-as-a-foreigner',
    group: 'buying',
    category: 'legal',
    tags: ['foreign-buyers', 'documents', 'notary', 'legal'],
    title: 'What documents does a foreigner need to buy property in Albania?',
    summary:
      'A passport is the only document the law requires from a foreign buyer at the notary (Law 110/2018); a married buyer also declares the marital property regime, and any document issued abroad needs an apostille and a certified Albanian translation. After signing, the contract is registered at ASHK with the ownership certificate and property card, for a fee of 5,000 ALL (VKM 462/2025).',
    dataPeriod: '2026',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'BUYER',
        heading: 'What the buyer brings',
        tables: [
          {
            id: 'BUYER_DOCUMENTS',
            title: 'Buyer\'s documents',
            columns: ['Document', 'Required?', 'Basis'],
            rows: [
              {cells: ['Passport', 'Yes', 'Law 110/2018 on the notary'], facts: ['DATA-LEGAL-0002']},
              {cells: ['Marriage or family certificate', 'If married: the deed states the property regime', 'Law 110/2018'], facts: ['DATA-LEGAL-0007']},
              {cells: ['Translation of the deed', 'Yes, if the buyer does not speak Albanian', 'Law 110/2018'], facts: ['DATA-LEGAL-0003']},
              {cells: ['Apostille on foreign documents', 'Yes, for any public document issued abroad', 'Hague Apostille Convention'], facts: ['DATA-LEGAL-0005']},
              {cells: ['Certified translation of foreign documents', 'Yes', 'Practitioner guidance'], facts: ['DATA-LEGAL-0006']},
              {cells: ['Albanian tax number (NIPT)', 'Asked by agencies, not found in the law', '—'], facts: ['DATA-LEGAL-0011']},
              {cells: ['Albanian bank account, proof of funds', 'Practice, not a legal requirement', '—'], facts: ['DATA-LEGAL-0012']},
            ],
          },
        ],
      },
      {
        key: 'SELLER',
        heading: 'What the seller and the notary provide',
        body: 'The notary checks the seller\'s ownership in the electronic property register and attaches the result to the deed. After signing, the registration file at ASHK holds the sale contract, the ownership certificate, the updated property card and the receipts for taxes and fees; the notary usually submits it.',
        tables: [
          {
            id: 'REGISTRATION_FILE',
            title: 'Registration at ASHK',
            columns: ['Item', 'Detail', 'Basis'],
            rows: [
              {cells: ['Seller\'s title', 'Checked in the register by the notary', 'Law 110/2018'], facts: ['DATA-LEGAL-0008']},
              {cells: ['Registration file', 'Contract, certificate, property card, tax receipts', 'e-Albania service KP1'], facts: ['DATA-LEGAL-0010']},
              {cells: ['Registration fee', '5,000 ALL', 'VKM 462/2025'], facts: ['DATA-PURCHASE-0007']},
              {cells: ['Late registration', '10% of the fee a day, max 300,000 ALL', 'VKM 462/2025'], facts: ['DATA-PURCHASE-0009']},
            ],
          },
        ],
      },
    ],
    faq: [
      {q: 'Do I need an Albanian tax number to buy?', a: 'Agencies often list one, but we found no legal requirement for a private buyer. Ask the notary before you open one.'},
      {q: 'My marriage certificate is German. What do I do?', a: 'Get an apostille on it in Germany and have it translated into Albanian by a certified translator.'},
      {q: 'Who registers the property after signing?', a: 'Usually the notary, through the one-stop ASHK service. You can also file through e-Albania.'},
    ],
    sources: ['LEGAL-ALB-2026-001', 'LEGAL-ALB-2026-004', 'LEGAL-ALB-2026-002', 'KB-ALB-2026-003'],
    gaps: [
      {id: 'GAP-NIPT', text: 'Whether a private foreign buyer needs an Albanian tax identification number: agencies say yes, no legal basis found.', priority: 'MEDIUM'},
    ],
    related: ['KB-POWER-OF-ATTORNEY', 'KB-BUYING-STEPS', 'KB-NOTARY-FEES', 'KB-ASHK-REGISTRATION'],
    seoTitle: 'Documents to buy property in Albania as a foreigner (2026)',
    seoDescription: 'Passport, apostille, translation and the marital regime: what a foreign buyer needs at the Albanian notary and what goes to ASHK, with the laws and fees.',
    reviewMonths: 6,
  },
  {
    id: 'KB-POWER-OF-ATTORNEY',
    slug: 'buy-property-in-albania-with-power-of-attorney',
    group: 'buying',
    category: 'legal',
    tags: ['foreign-buyers', 'power-of-attorney', 'notary', 'legal'],
    title: 'Can I buy property in Albania by power of attorney, without travelling?',
    summary:
      'Yes. Albanian notary law lets a buyer be represented under a power of attorney, which the deed must cite with its date, object and legal basis (Law 110/2018). A power of attorney signed abroad needs an apostille and a certified Albanian translation; one signed before an Albanian notary costs 3,000 ALL for a special power (Order 279/2012 as amended).',
    dataPeriod: '2026',
    confidence: 'MEDIUM',
    sections: [
      {
        key: 'RULES',
        heading: 'The rules',
        tables: [
          {
            id: 'POA_RULES',
            title: 'Power of attorney for a property purchase',
            columns: ['Point', 'Rule', 'Basis'],
            rows: [
              {cells: ['Representation allowed', 'Yes; the deed cites the power\'s date, object and basis', 'Law 110/2018'], facts: ['DATA-LEGAL-0004']},
              {cells: ['Signed abroad', 'Apostille + certified translation into Albanian', 'Hague Apostille Convention'], facts: ['DATA-LEGAL-0005', 'DATA-LEGAL-0006']},
              {cells: ['Signed at an Albanian notary', 'Special 3,000 ALL; general 5,000 ALL', 'Notary tariff'], facts: ['DATA-PURCHASE-0011']},
            ],
          },
        ],
      },
      {
        key: 'HOW',
        heading: 'How to do it from abroad',
        body: '- Have the text drafted in Albanian and your language, naming the property (number, zone, volume and page from the property card), the price limits and what the attorney may sign and pay.\n- Sign it before a notary in your country and get an apostille on it.\n- Send the original to Albania and have it translated by a certified translator.\n- The attorney signs the deed; the notary checks the power before the deed.\n- Prefer a special power for one property over a general one, and choose an attorney who is not the seller\'s agent.',
      },
    ],
    faq: [
      {q: 'Can my lawyer in Albania sign everything for me?', a: 'Yes, with a special power of attorney that names the property and what they may sign and pay.'},
      {q: 'Does a power of attorney from my home country work in Albania?', a: 'Yes, with an apostille and a certified translation into Albanian. Albania has applied the Apostille Convention since 2004.'},
      {q: 'Should the agent selling the flat hold my power of attorney?', a: 'Better not: give it to someone who represents only you.'},
    ],
    sources: ['LEGAL-ALB-2026-001', 'LEGAL-ALB-2026-004', 'PURCHASE-ALB-2026-004'],
    gaps: [
      {id: 'GAP-NOTARY-TARIFF-OFFICIAL', text: 'The notary tariff (Order 279/2012 and the 2020 joint instruction) comes from three matching secondary sources; the official consolidated text was not opened.', priority: 'MEDIUM'},
    ],
    related: ['KB-DOCUMENTS', 'KB-BUYING-STEPS', 'KB-NOTARY-FEES'],
    seoTitle: 'Buying property in Albania by power of attorney (2026)',
    seoDescription: 'You can buy in Albania without travelling: power of attorney rules, apostille, translation and notary fees, with the laws behind them.',
    reviewMonths: 6,
  },
  {
    id: 'KB-RESIDENCE-PURCHASE',
    slug: 'does-buying-property-in-albania-give-residence',
    group: 'buying',
    category: 'legal',
    tags: ['foreign-buyers', 'residence-permit', 'legal'],
    title: 'Does buying property in Albania give you a residence permit?',
    summary:
      'It gives you the right to apply for one. Article 84 of Albania\'s law on foreigners (Law 79/2021) provides a temporary residence permit for a foreigner who owns property in Albania, issued for up to one year and renewable, also for a co-owner of half the property; no minimum property value is set in the law or in VKM 858/2021. It is a permit to stay, not citizenship or an EU right of movement.',
    dataPeriod: '2026',
    confidence: 'HIGH',
    sections: [
      {
        key: 'PERMITS',
        heading: 'Permits a property buyer can use',
        tables: [
          {
            id: 'PERMITS',
            title: 'Residence routes for a foreign property owner',
            columns: ['Route', 'Who', 'Duration', 'Basis'],
            rows: [
              {cells: ['Visa-free stay', 'Visa-exempt nationals', '90 days in 180', 'Law 79/2021 Art. 29'], facts: ['DATA-LEGAL-0013']},
              {cells: ['Owner permit', 'Owner or co-owner of ½', 'Up to 1 year, renewable', 'Law 79/2021 Art. 84'], facts: ['DATA-LEGAL-0014']},
              {cells: ['Pensioner permit', 'Retired in home country, pension ≥ 1,200,000 ALL/yr', 'Up to 1 year, renewable', 'Law 79/2021 Art. 85'], facts: ['DATA-LEGAL-0015']},
              {cells: ['Ukrainians (entered from 18.03.2022)', 'Ukrainian citizens', 'Up to 4 years without a permit', 'VKM 169/2022 as amended'], facts: ['DATA-LEGAL-0022']},
            ],
          },
        ],
      },
      {
        key: 'DOCUMENTS',
        heading: 'What the owner permit asks for',
        body: 'VKM 858/2021 lists, for the owner permit: proof of ownership (a notarised copy of the sale contract), proof of sufficient means and a personal statement on the purpose of the stay. The general file, filed online through e-Albania, adds the application form, a copy of the passport with the entry stamp and a statement on accommodation.\n\nThe owner permit does not allow work. A pensioner permit holder may not carry on any economic activity either.',
      },
    ],
    faq: [
      {q: 'Is there a minimum property value for the permit?', a: 'No minimum is set in Law 79/2021 or VKM 858/2021.'},
      {q: 'Does the permit let me work in Albania?', a: 'No. Working needs a work-based permit.'},
      {q: 'Does it lead to citizenship?', a: 'Not by itself. Permanent residence and citizenship have their own conditions and waiting periods.'},
      {q: 'Can my spouse get a permit too?', a: 'A co-owner of half the property qualifies in their own right; family reunification is also provided for pensioners.'},
    ],
    sources: ['KB-ALB-2026-001', 'KB-ALB-2026-002', 'KB-UA-2026-001'],
    gaps: [
      {id: 'GAP-VKM858-2025', text: 'VKM 858/2021 is quoted as consolidated in 2024; a revision after Law 43/2025 (which moved the pensioner criteria into the decision) was not found.', priority: 'MEDIUM'},
      {id: 'GAP-PERMANENT-RESIDENCE', text: 'Waiting period for permanent residence (Law 79/2021 Art. 87) not checked.', priority: 'LOW'},
    ],
    related: ['KB-BUY-FOREIGNERS', 'KB-BUY-GERMANY', 'KB-BUY-UK', 'KB-DOCUMENTS'],
    seoTitle: 'Does buying property in Albania give residency? 2026',
    seoDescription: 'Albanian law gives property owners a one-year renewable residence permit (Art. 84, Law 79/2021), with no minimum value. Conditions, documents and limits.',
    reviewMonths: 6,
  },
]
