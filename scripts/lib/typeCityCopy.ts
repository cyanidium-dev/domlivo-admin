/**
 * Editorial prose for the ТЗ-17 type×city landings (sweep 2026-09-05, F1).
 * The generator writes three h3 headings with a TODO-CONTENT paragraph under
 * each; this module holds the English paragraphs that replace them. Every
 * figure comes from the research knowledge base files named per city —
 * `02-cities/durres.md`, `tirana.md`, `vlora-riviera.md`, `saranda-ksamil.md`
 * — and the stats band above the text stays the live source for prices.
 * Other locales are produced by fillTypeCityCopy.ts through the translate
 * endpoint; sq is pending native review.
 */
export type TypeSlug = 'apartment' | 'villa' | 'house'
export type CitySlug = 'durres' | 'tirana' | 'vlore' | 'sarande'
/** Paragraphs under "Why … in …", "Who it suits", "What to check before buying". */
export type Copy = {why: string; who: string; check: string}

const durresCheck =
  'Durrës took the worst of the 2019 earthquake, so the year of construction and the seismic standard matter more here than anywhere else in Albania: new builds carry a documented "post-earthquake" premium and the old stock in Shkozet and old Plazh trades at a discount for a reason. Ask for the leje përdorimi (occupancy permit) on any finished building and check the permitted number of floors — Golem and Shkëmbi i Kavajës have a long history of 6–8-storey buildings on 3-storey permits, and titles on those are the buyer\'s problem. Pull the ownership extract from the cadastre yourself. In Golem, ask about sewage: the beach outflows are documented and the World Bank project is not finished.'

const tiranaCheck =
  'Tirana is a buyer\'s market in the middle segments: prices sat flat in the second half of 2025, the average time to sell stretched to about eight months, and a record 1.9 million m² of building permits (2024) means an oversupply risk in Astir, Yzberisht and Kashar, where Investropa sees a possible 10–15 % downside. Negotiate — deals close 3–5 % below asking. Check the developer\'s track record on finish quality, which is uneven in the mass segment, and the building\'s position relative to the Small Ring: the same flat costs about €2,054/m² inside it and €1,768/m² just outside. Foreign buyers mostly pay cash; a local mortgage for a non-resident is possible but slow, with loan-to-value around 50–60 %.'

const vloreCheck =
  'The single biggest thing to check in Vlorë is what you are paying for: the airport premium is already in the price, and as of summer 2026 the airport has no flights — a shareholder dispute, cancelled charters and an SPAK case. Treat any listing that sells "the airport" as selling a future that may not arrive. Then the practical items: water and sewage outages were recorded in 2025 and Lungomare had outflows in 2023, so ask the building about its own water supply; check the occupancy permit and the cadastre extract yourself; and in Himarë and on the Riviera, where restitution claims are the highest title risk in the country, do not sign without a lawyer who has read the property\'s full history.'

const sarandeCheck =
  'Foreign demand in Sarandë fell by 50 % in 2024 and another 30 % in 2025 while prices kept rising, and agencies admit deals close worse than before — which means you should negotiate, not rush. Build the financial model on 150–180 nights, because December to March earns close to nothing. In Ksamil, the number one legal risk on the south coast is illegal construction: demolitions have happened and the UNESCO buffer zone around Butrint is real, so an occupancy permit and a clean cadastre extract are non-negotiable. Water and sewage are the physical ceiling of the town — bursts have already happened. And there is no "Sarandë airport 2026": the nearest airport is Corfu, by ferry.'

export const COPY: Record<CitySlug, Record<TypeSlug, Copy>> = {
  durres: {
    apartment: {
      why:
        'Durrës is the cheapest way into the Albanian coast and its largest market. The city averages about €1,450/m² (first half of 2026, up roughly 18 % year on year), and 80 % of transactions fall between €1,200 and €1,700/m². The mass beach zone of Plazh and Iliria sits in that band; the first line at Golem runs €2,000–2,500/m² with no new construction, and Qerret — up 21–43 % in a year — is the fastest-growing zone in the agglomeration. A one-bedroom in Plazh lets long-term for €350–450 a month and roughly doubles in season. The Tirana–Durrës railway, due to bring the capital within 22 minutes, is the reason the city is being called Tirana\'s future dormitory.',
      who:
        'Half of the buyers on the Durrës coast are foreign: Kosovars and the diaspora on Golem and Plazh, Czechs, Poles, Hungarians and Slovaks in Qerret and the mass beach zones, Germans, Swiss and wealthier Kosovars in the Lalzi Bay luxury segment. The apartment buyer here is either a family from a landlocked country wanting a summer base that pays for itself, or a short-let investor: Plazh is the best-documented short-term-rental zone in the country with estimated gross yields of 7–11 %, though occupancy estimates range from 33 % to 56 % depending on the data provider, and off-season discounts of 40–50 % are normal. Locals and Tirana commuters buy in Currila, Vollga and the centre instead.',
      check: durresCheck,
    },
    villa: {
      why:
        'Villas in the Durrës agglomeration are a Lalzi Bay story. Since the south coast moved past €4,000–5,000/m², investors have come back to Lalzi: townhouses trade at €600,000–850,000, detached villas at €900,000–1.2 million and first-line villas at €1.5–3 million, while apartments in the same luxury complexes (Vala Mar, San Pietro, Porto Lalëzi) run €2,500–3,500/m². In season a villa there rents for €400–600 a night. Outside Lalzi the villa market is thin and priced by land: a 350 m² villa in Plepa was listed at about €270,000, which is €771/m² — a different product for a different buyer.',
      who:
        'The Lalzi villa buyer is the diaspora — Germany, Switzerland, the United States — and wealthier Kosovar families who want a gated, family-oriented luxury with a private beach rather than the crowds of Golem. It suits a second home used every summer and rented in the peak weeks, not a pure yield play: at these prices the rental income covers running costs and little more, and the return is in the land. Buyers who want a cheaper detached house with a garden near the beach look at Plepa, Shkëmbi i Kavajës and the hills behind the coast, where prices are a fraction of Lalzi but the stock is older and the paperwork needs more care.',
      check: durresCheck,
    },
    house: {
      why:
        'Houses in Durrës are where the price gap between the beach and everything else is widest. On the beach strip, land is priced for apartments, so a detached house is rare and expensive; a few hundred metres inland — Shkozet, Rrashbull, the hillside villages behind the coast — family houses sell at €1,100–1,600/m² of built area, and older stock in Spitallë, Kënetë and Xhafzotaj starts below €800/m². The city itself is not small: Durrës has 154,000 residents, the country\'s main port (about 80 % of foreign trade), a university with 17–20,000 students and a county that produces around 10 % of GDP, so a house here is a house in a working city, not only a resort.',
      who:
        'A house in Durrës suits a family that wants space and a garden within 40 minutes of Tirana — soon 22 by rail — or a returning diaspora household that already knows the city. It also suits a buyer who would rather own a renovation project on a plot than a new apartment on the strip: the Kosovar and Eastern European demand that lifts beach prices barely touches the inland house market, which has been flat at 0–3 % a year in the budget zones. It does not suit a short-let investor; Airbnb demand in Durrës is for apartments near the sand, and the ADR of $56–82 does not carry a house.',
      check: durresCheck,
    },
  },
  tirana: {
    apartment: {
      why:
        'Tirana is the country\'s deepest apartment market and, in 2026, a market that has stopped running. The average transaction price was €1,863/m² in the second quarter of 2025 — €2,054 inside the Small Ring, €2,660 in the former Blloku, €1,768 outside the ring — and the Bank of Albania index went flat in the second half of 2025 (0 % quarter on quarter after +56 % a year earlier). Deloitte still puts the capital above €2,000/m² and among Europe\'s fastest risers over the cycle, and the luxury record is €10,000/m² in a tower by the Artificial Lake. Prices range from €800/m² on the periphery to €5,500/m² for a new build in Blloku; the stats band above shows the current zone figures.',
      who:
        'Non-residents make up about 27 % of purchases in central Tirana against 18 % nationally: the Italian, German, Greek and British diaspora buying to invest or to come home, and foreign investors after the capital\'s liquidity. It suits a buyer who wants a year-round tenant rather than a summer one — a one-bedroom rents for about €680 in the centre and €420 outside it, a three-bedroom for €1,230 and €780 — and who accepts a gross yield of 5–6 % that has been shrinking as prices outran rents. Short lets are a middling business here (host income around €700 a month, occupancy 40–45 %), so the Tirana apartment is a capital-and-rent play, not an Airbnb play.',
      check: tiranaCheck,
    },
    villa: {
      why:
        'Tirana\'s villa market is small and specific: the gated zones of Farkë and Lundër south-east of the city and the embassy corridor along Rruga e Elbasanit are the only places where detached, guarded houses with gardens are the norm, a short drive from downtown rather than inside it. Elsewhere in the capital a "villa" is usually an older family house on a plot in Sauk, Kodra e Diellit or the northern edge. The state reference price for Farkë is a modest €1,175/m² — below the citywide average — because the land is valued as suburb, while the finished product is priced by scarcity: there are few of these houses and the diaspora wants them.',
      who:
        'A Tirana villa suits a family that has decided to live in the capital rather than visit it: diaspora households returning from Germany, Italy or the United States, executives on long postings, and locals who have outgrown an apartment and want the international schools and quiet of the Farkë side. It is the wrong product for yield — villa rents exist but the market is thin and seasonal in the wrong direction (no summer premium) — and the right one for a ten-year hold, where land in the only gated zones of a growing capital is the asset. Buyers who want a villa for summers and rentals should look at the coast instead.',
      check: tiranaCheck,
    },
    house: {
      why:
        'Houses in Tirana mean the city\'s edge: Kashar and the Tirana–Durrës corridor, Paskuqan and Kamëz to the north, Sauk and the hills to the south. Prices there follow the periphery bands of €800–1,500/m² of built area, against €1,500–2,500 on the semi-periphery, and the state reference prices tell the same story — Paskuqan carries the lowest in the capital at about €640/m². Kashar is where returning diaspora pensioners are buying, and the New Boulevard, the railway and the ring road are pulling value outward from the centre. A house here is the cheapest way to own land in a capital where flats inside the ring cost more than twice as much per metre.',
      who:
        'The Tirana house buyer is a local family that wants a garden and a car space, a diaspora couple retiring home, or a buyer who plans to build: plots on the edge are still priced as land, not as future apartments. It suits patience — the periphery is also where the 1.9 million m² of new permits will land, so resale liquidity is thinner than in the centre and the 2026 forecast is +3–5 % against +5–7 % for the core. It does not suit anyone who needs rental income; house rentals in Tirana are a small market. And in Kamëz and Paskuqan the historic title problems of informal construction make the cadastre check the whole purchase.',
      check: tiranaCheck,
    },
  },
  vlore: {
    apartment: {
      why:
        'Vlorë is the fastest-rising apartment market on the coast: Deloitte puts the city at about €2,400/m², up 25 % in a year and at the top of Europe together with Tirana. The Lungomare first line costs €2,500–3,500/m² — double its 2022 level — and the second line €2,000–2,500 after a 33–67 % jump; Jonufër and Radhimë, where the promenade is being extended, price the same as the first line. It is a two-speed market: the "urban" Vlorë where locals buy is still €800–1,000/m², Uji i Ftohtë runs 20–25 % below Lungomare, and Transballkanike €1,000–1,500. And Vlorë has the best short-let arithmetic in the country, with average host income of about €1,163 a month, far above Tirana\'s €700.',
      who:
        'Italians are the number one buyers in Vlorë and Poles the number two; in the coastal zones about 90 % of demand is foreign or diaspora, and the goal is almost always Airbnb. It suits an investor who wants the country\'s highest rental income per unit and a city that does not empty in winter — Vlorë has a port, students and roughly 84,000 residents, so a studio still lets for €250–350 and an apartment for €350–500 a month off-season. In August the average rate is about €98 a night at 70 % occupancy. It suits less well anyone buying on the promise of the new airport: the premium is in the price, the flights are not.',
      check: vloreCheck,
    },
    villa: {
      why:
        'Vlorë\'s villa market is really the Riviera\'s: south of the Llogara tunnel (open since July 2024, Vlorë to Dhërmi in 40–50 minutes) the coast turns into villages where detached houses with sea views are the natural product. Dhërmi trades at about €3,000/m² for new builds and up to €3,500 on the first line; Palasë, the tunnel\'s main beneficiary, is the only Blue Flag beach in the country; Vuno and Qeparo are older stone villages with restored houses rather than developments. Closer to the city, the Jonufër–Radhimë arc at €2,500–3,500/m² is where the Lungomare extension reaches villa plots. Land on the Riviera is priced from €150/m² inland to €350/m² on the first line.',
      who:
        'A Riviera villa suits a buyer who wants the Ionian coast rather than the town — Italians arriving by ferry, Northern Europeans who found Sarandë too crowded, and diaspora families who want a village house they can restore — and who understands the trade: the most beautiful coast in Albania is also the one with the highest title risk. Himarë carries restitution claims and the Beleri case; every villa purchase there needs a lawyer who has read the plot\'s whole history. It suits a long hold and personal use with premium summer lets (villas on this coast rent for several hundred euros a night in season), not a quick flip: liquidity in the villages is thin and winters are quiet.',
      check: vloreCheck,
    },
    house: {
      why:
        'A house in Vlorë means one of two things: a family house in the city\'s inland quarters — the centre and Bulevardi at €800–1,800/m², Transballkanike at €1,000–1,500, the local-buyer segment at €800–1,000 — or a village house in the hills and along the coast road toward Orikum and Radhimë. The first is the cheapest way to live in the only real city on the coast, with a port, a university and winter life; the second is the cheapest way onto the Riviera, where a habitable stone house often costs less than an apartment on the Lungomare. Orikum, at the southern end of the bay, sits at €1,300–1,500/m² and is a valid alternative to the promenade for buyers who want space.',
      who:
        'The Vlorë house suits a family relocating to the coast for good — Italians and Ukrainians are the largest such groups — and a diaspora household coming home to a city that works all year. It suits a renovator: much of the inland stock is older, and a house on a plot with a garden can be brought up to standard for far less than a new build costs per metre. It suits a short-let investor only in the coastal villages, where a whole house lets as a unit in summer. It does not suit anyone who needs the airport to exist before they buy; the city\'s fundamentals — port, students, the tunnel south — are the reasons to be here.',
      check: vloreCheck,
    },
  },
  sarande: {
    apartment: {
      why:
        'Sarandë is the most-searched destination among foreign buyers on Albania\'s south coast, and its prices show it: new builds within a kilometre of the sea cost €2,000–2,500/m², the first line €3,000–3,500, resort apartments up to €4,000, while a turnkey flat in the centre runs €1,600–1,800 (from €1,400) and old stock €600–1,000/m². New apartments rose about 41 % between 2023 and 2024. The short-let market is the best documented in the country: around 430 Airbnb listings, a median income of about $6,960 a year at 40.9 % occupancy and an average rate of $94 a night. Unlike Ksamil, Sarandë stays alive in winter with 35–40,000 residents, a port, a hospital and schools.',
      who:
        'Ninety per cent of coastal purchases in Sarandë are foreign, with Czechs, Poles and Hungarians at the core, then Italians and the diaspora; the typical budget is €80,000–300,000 and about 70 % of buyers use the flat themselves for a few weeks and rent it the rest of the season. It suits exactly that buyer — a family from a landlocked country wanting a base on the Ionian that covers its own costs — and it suits a realistic investor who plans on 4–6 % gross: the median listing on a €120,000 flat earns 5–6 % before the 15 % tax and a 20–25 % management fee. It does not suit anyone sold a "10–16 % ROI"; that is the top quartile with professional management, not the market.',
      check: sarandeCheck,
    },
    villa: {
      why:
        'Villas around Sarandë are a hillside and Ksamil product: the town itself is dense apartment blocks stepping up from the bay, so detached houses with pools sit above it on the slopes toward Lëkurës castle or along the coast toward Ksamil, where villa plots near the beaches command some of the highest land values in the south. Ksamil apartments already cost €1,800–3,000/m², more than Sarandë, so villa land there is priced accordingly. Further along the coast, the Lukovë–Borsh stretch is an early land market: plots at €150/m² inland and €350/m² on the first line, and a shell house on 220 m² of land in Piqeras was listed at about €150,000 — the entry point for a self-built villa.',
      who:
        'A Sarandë villa suits a buyer who wants the Ionian view and privacy that an apartment cannot give, and who will use it for the season and rent it in the peak weeks: whole-villa lets earn the most per night on the coast in July and August. It suits Italians and Northern Europeans who want Corfu\'s climate at a fraction of Corfu\'s prices — the ferry is 30 minutes — and diaspora families. It is the wrong purchase for a yield-first investor: winter income is close to zero on the south coast, and villa upkeep, water supply and access roads all cost more than an apartment. In Ksamil, only buy a villa with an occupancy permit and a clean cadastre history.',
      check: sarandeCheck,
    },
    house: {
      why:
        'Houses in the Sarandë area are village houses: in Ksamil, in Çukë, Gjashtë and Metoq behind the town, and along the Riviera road through Lukovë, Borsh and Piqeras. The state reference prices show how differently the land is valued — about €1,020/m² in Sarandë\'s five urban zones, €610–1,020 on the Ksamil coast and €570 in the villages — and the market follows: a habitable house in a village often costs less than a one-bedroom on Sarandë\'s seafront. This is where the south is still cheap. It is also where the stock is oldest, the documents are weakest and the infrastructure thinnest; the price reflects that honestly.',
      who:
        'A house here suits a buyer who wants the south coast without the resort: retirees from Italy and Scandinavia — Sarandë\'s Scandinavian channel runs through Corfu airport — diaspora families returning to their villages, and renovators who prefer a stone house with olives to a new apartment. It suits self-use and a modest summer let, not a rental business. It does not suit anyone who needs to resell fast: village liquidity is thin, most buyers are cash, and a house without an occupancy permit or with an unclear cadastre history can be unsellable at any price. The cheaper the house, the more of the budget should go to the lawyer.',
      check: sarandeCheck,
    },
  },
}

export const SOURCES_NOTE: Record<CitySlug, string> = {
  durres: '02-cities/durres.md §1–4, §6–7 (Monitor.al, Investropa, Homezone, AirROI/Airbtics/AirDNA)',
  tirana: '02-cities/tirana.md §1, §3–5, §8 (Keydata via Monitor.al, Bank of Albania, Deloitte, Troja, Investropa, Numbeo)',
  vlore: '02-cities/vlora-riviera.md §1–2, §5–8 (Monitor.al, Shqiptarja, Globihome, AirDNA via CNA)',
  sarande: '02-cities/saranda-ksamil.md §1–4, §8 (Monitor.al, Globihome, AirROI, Sarandaweb, Homezone)',
}
