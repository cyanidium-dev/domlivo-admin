/**
 * Editorial descriptions for zones whose `district.description` never got past
 * the seed stub.
 *
 * `generateDistrictLandings.ts` only emits the `about` (seoTextSection) block
 * when `district.description.en` clears MIN_DESCRIPTION (150 chars). Six Durrës
 * districts sat under that line — three empty, three carrying a seed sentence
 * such as "Beachfront offers direct beach access in Durres." — so their landing
 * pages shipped with figures, listings and links but not one line of prose.
 * They happen to be the six that matter commercially: the centre, the beach,
 * Golem, Plepa, Shkëmbi and Shkozet.
 *
 * Every figure below comes from `zone-metrics-seed.json` (the `notes` and
 * metric fields of the zone's own record), so the copy and the price table on
 * the same page cannot drift apart. Nothing here is invented: if a fact is not
 * in the seed or in the district's `shortDescription`, it is not in the text.
 *
 * Only `en` and `ru` are authored. The other four locales are filled by the
 * project translator, which writes empty locales only:
 *   npm run translate:by-type -- district --locales=uk,sq,it,pl --execute
 *
 * House voice, copied from the zones that already read well (Qerret, Spille):
 * the band, how the price steps inside the zone, who buys, and one honest
 * caveat a buyer would otherwise learn too late.
 */

export type EditorialCopy = {en: string; ru: string}

/** Keyed by `district.slug.current`. */
export const ZONE_EDITORIAL_COPY: Record<string, EditorialCopy> = {
  'city-center-durres': {
    en: "Durrës city centre asks €1,900–2,800/m², the top of the city's range. The band covers the whole seafront strip — Currila, Vollga and Taulantia — rather than a single street, and penthouses on it go above €3,000/m². Currila alone is up 70–90% since 2019. Buyers here are mostly local families and Tirana commuters rather than seasonal investors, which is why the zone holds its price out of season. One thing to check before you sign: the reference-price schedule of 01.01.2026 tripled the port zone figure to 200,000 lek/m², and notary and tax costs are calculated from that schedule, not from what you actually pay.",
    ru: 'Центр Дурреса — €1 900–2 800/м², верх городского диапазона. Диапазон охватывает всю набережную полосу — Currila, Vollga, Taulantia, — а не одну улицу; пентхаусы на ней уходят выше €3 000/м². Одна только Currila прибавила 70–90% с 2019 года. Покупают здесь в основном местные семьи и те, кто ездит на работу в Тирану, а не сезонные инвесторы, — поэтому зона держит цену вне сезона. Что проверить до сделки: редакция справочных цен от 01.01.2026 утроила показатель портовой зоны до 200 000 лек/м², а нотариальные и налоговые расходы считаются именно по этой таблице, а не по сумме сделки.',
  },

  plazh: {
    en: "Plazh is the mass beach segment of Durrës: €1,200–1,700/m², up as much as 21% year on year from a €1,000–1,300 band. It is the strip most buyers mean when they say “an apartment by the sea in Durrës” — direct beach access, dense mid-rise stock, and a rental season that runs on domestic and diaspora demand rather than on foreign tourism. Because the stock is dense and much of it is alike, what moves price here is metres to the sand, not finish quality: compare the exact distance and the floor before you compare the price per square metre.",
    ru: 'Плаж — массовый пляжный сегмент Дурреса: €1 200–1 700/м², рост до 21% год к году с диапазона €1 000–1 300. Это та самая полоса, которую имеют в виду, когда говорят «квартира у моря в Дурресе»: прямой выход на пляж, плотная среднеэтажная застройка и арендный сезон, который держится на внутреннем спросе и диаспоре, а не на иностранном туризме. Фонд здесь плотный и во многом однотипный, поэтому цену двигают метры до песка, а не качество отделки: сравнивайте точное расстояние и этаж прежде, чем сравнивать цену за квадратный метр.',
  },

  'golem-durres': {
    en: "Golem is the second and third line behind the beach south of Durrës, asking €1,100–1,500/m² and rising 8–15% year on year — cheaper than the first line, and cheaper than Qerret further down the same sand. The state reference price for the zone is €56,500 per unit, which is the figure your notary and tax bill are calculated from. The zone's standing problem is sewerage discharging onto the beach. It has not stopped prices, but it is the one thing worth checking on the ground, in season, before you buy here to rent out.",
    ru: 'Голем — вторая и третья линия за пляжем к югу от Дурреса: €1 100–1 500/м², рост 8–15% год к году. Дешевле первой линии и дешевле Черрета дальше по той же полосе. Государственная справочная цена зоны — €56 500 за объект, и именно от неё считаются нотариальные и налоговые расходы. Постоянная проблема зоны — сток канализации на пляж. На цены это пока не повлияло, но это единственное, что стоит проверить на месте и в сезон, если покупаете под аренду.',
  },

  'plepa-durres': {
    en: "Plepa reads as one zone and prices as two. Mass stock asks €1,000–1,270/m²; anything with a real sea view asks €1,800–2,160/m² — and a single headline range for the district (€1,000–2,160, across 159 listings in the second half of 2026) hides that split entirely. It is a quiet residential part of Durrës with established infrastructure rather than a resort strip. Work out which of the two segments a listing belongs to before you judge whether its price is fair: here you are paying for the view, not the address.",
    ru: 'Плепа выглядит как одна зона, а стоит как две. Массовый фонд — €1 000–1 270/м²; всё, откуда действительно видно море, — €1 800–2 160/м². Общий диапазон по району (€1 000–2 160 по 159 объявлениям во втором полугодии 2026) этот разрыв полностью скрывает. Это тихая жилая часть Дурреса с готовой инфраструктурой, а не курортная полоса. Прежде чем судить о цене объявления, определите, к какому из двух сегментов оно относится: платите вы здесь за вид, а не за адрес.',
  },

  'shkembi-durres': {
    en: "Shkëmbi has the widest gap between new and old stock in Durrës. New builds ask €1,200–2,000/m² while older apartments trade from €450 to €800/m², and the zone median lands at about €1,110/m². It sits roughly 150 m from the promenade, quiet and green by Durrës standards. That spread is the whole story of the zone: two markets under one name, and the cheap half is cheap for building age and condition, not for location. Check the construction year, the structure and the legal file before you read a low price per square metre as a bargain.",
    ru: 'У Шкемби самый широкий разрыв между новым и старым фондом в Дурресе. Новостройки просят €1 200–2 000/м², старые квартиры уходят по €450–800/м², медиана по зоне — около €1 110/м². Район лежит примерно в 150 м от набережной, тихий и зелёный по меркам Дурреса. Этот разрыв и есть вся суть зоны: два рынка под одним названием, и дешёвая половина дешева из-за возраста и состояния домов, а не из-за расположения. Смотрите год постройки, конструкцию и документы, прежде чем считать низкую цену за метр выгодной.',
  },

  shkozet: {
    en: "Shkozet is inland Durrës — a residential district on the main approach to the city, with no beach premium in the price. Sources disagree on what it costs: one puts it at €1,100–1,600/m², a local one at €800–1,200, and the honest answer sits between them. That disagreement is itself the useful signal. The zone is bought by local buyers and priced deal by deal rather than off a published rate, so comparable completed sales matter more here than any printed band. Road connectivity is the district's main argument.",
    ru: 'Шкозет — внутренний Дуррес: жилой район на главном въезде в город, без пляжной надбавки в цене. Источники расходятся: один даёт €1 100–1 600/м², локальный — €800–1 200, и честный ответ лежит между ними. Само это расхождение и есть полезный сигнал. Зону берут местные покупатели, и цена складывается по каждой сделке отдельно, а не по опубликованной ставке, поэтому сопоставимые состоявшиеся сделки здесь значат больше любого напечатанного диапазона. Главный аргумент района — транспортная доступность.',
  },

  // --- Vlorë ---------------------------------------------------------------

  lungomare: {
    en: "Lungomare is Vlora's seafront promenade and the most expensive address in the city: €2,500–3,500/m², roughly double the €1,700–1,800 it asked in 2022. A three-year doubling on a strip that cannot be extended is most of the explanation — supply is fixed and the buyers are foreign — but it also means you are buying at the top of a fast move rather than into one. Before committing, compare what the same money buys at Uji i Ftohtë, which runs 20–25% below this strip, and check the completion status of anything sold off-plan on the promenade.",
    ru: 'Лунгомаре — набережная Влёры и самый дорогой адрес города: €2 500–3 500/м², примерно вдвое дороже, чем €1 700–1 800 в 2022 году. Удвоение за три года на полосе, которую невозможно расширить, во многом этим и объясняется — предложение фиксировано, а покупатель иностранный, — но это же значит, что вы входите на вершине быстрого движения, а не в его начале. До сделки сравните, что те же деньги дают в Уйи-и-Фтохте, где цены на 20–25% ниже, и проверьте стадию готовности всего, что продаётся на набережной на этапе строительства.',
  },

  'city-center-vlore': {
    en: "Vlora city centre runs at two speeds inside one band of €800–1,800/m². The boulevard and the streets behind it serve local buyers at €800–1,000/m²; the seafront frontage serves foreign ones at around three times that. An average for “the centre” is close to meaningless here — the same district holds the cheapest stock in the city and some of the dearest. Work out which side of that line a listing sits on before you read its price per square metre, because the address alone will not tell you.",
    ru: 'Центр Влёры работает на двух скоростях внутри одного диапазона €800–1 800/м². Бульвар и улицы за ним обслуживают местных покупателей по €800–1 000/м²; фронт набережной — иностранных, примерно втрое дороже. Средняя «по центру» здесь почти лишена смысла: в одном районе и самый дешёвый фонд города, и часть самого дорогого. Прежде чем читать цену за метр, определите, по какую сторону этой границы стоит объект, — по адресу это не понять.',
  },

  'uji-i-ftohte': {
    en: "Uji i Ftohtë is the coast immediately south of Vlora's promenade, priced at roughly €1,875–2,800/m². That band deserves a caveat the others do not: it is derived, not measured. The only source covering the zone states that it runs 20–25% below Lungomare, and the figures above apply that discount to the Lungomare range. Use them to size a budget, not to value a specific apartment, and ask the agent for comparable completed sales in the building before you make an offer.",
    ru: 'Уйи-и-Фтохте — побережье сразу к югу от набережной Влёры, примерно €1 875–2 800/м². Этот диапазон требует оговорки, которой не требуют остальные: он расчётный, а не измеренный. Единственный источник по зоне говорит лишь, что она на 20–25% дешевле Лунгомаре, и цифры выше — это применение той же скидки к диапазону Лунгомаре. Ими можно оценить бюджет, но не конкретную квартиру: до оферты запросите у агента сопоставимые состоявшиеся сделки в том же доме.',
  },

  orikum: {
    en: "Orikum is the cheap end of the Vlora bay: €1,300–1,500/m², where the lower segment has moved up from €800/m² — a 63% rise — and the ceiling sits around €1,500. The marina redevelopment dominates local coverage of the town, but the existing stock still prices well below Lungomare, and it is that existing stock, not the renderings, that you are most likely buying. The state reference price is 61,400 lek/m², about €625, and notary and tax costs are calculated from that figure rather than from the market band above.",
    ru: 'Орикум — дешёвый конец Влёрского залива: €1 300–1 500/м², где нижний сегмент поднялся с €800/м² — рост на 63%, — а потолок держится около €1 500. Местные публикации о городе заняты реконструкцией марины, но существующий фонд по-прежнему стоит заметно дешевле Лунгомаре, и покупаете вы, скорее всего, именно его, а не рендеры. Государственная справочная цена — 61 400 лек/м², около €625, и нотариальные с налоговыми расходами считаются от неё, а не от рыночного диапазона выше.',
  },

  // --- Sarandë -------------------------------------------------------------

  'buze-shetitores': {
    en: "Buzë Shëtitores is Sarandë's first line, along the promenade, at €3,000–3,500/m². Resort-branded apartments on it reach €4,000/m², and the coast tops out near €4,500 elsewhere. This is the most expensive stock the city sells, and it is priced on the view and the address rather than on what it earns: short-term rental in Sarandë runs at about 41% occupancy, which does not support these numbers on income alone. Buy here for use and for the asset, and treat any rental projection you are shown as the seller's arithmetic until you have checked it yourself.",
    ru: 'Бузе-Шетиторес — первая линия Саранды вдоль набережной, €3 000–3 500/м². Курортные апартаменты на ней доходят до €4 000/м², а по побережью потолок — около €4 500. Это самый дорогой фонд города, и цена в нём — за вид и адрес, а не за доходность: краткосрочная аренда в Саранде идёт при загрузке около 41%, что само по себе таких цифр не оправдывает. Покупайте здесь для себя и как актив, а любой показанный расчёт доходности считайте арифметикой продавца, пока не проверите его сами.',
  },

  'city-center-sarande': {
    en: "Sarandë's centre asks €1,600–1,800/m² for turnkey stock, up from about €1,200/m² in 2022–23. The number worth sitting with is a different one: foreign demand has fallen two years running — down 50% in 2024 and another 30% in 2025 — while prices kept climbing. Rising prices on falling demand is a supply-side story, and it is the single most important thing to understand before buying in this city. The centre itself remains the practical choice for year-round use: walkable, serviced out of season, and a clear step below the promenade in price.",
    ru: 'Центр Саранды просит €1 600–1 800/м² за фонд «под ключ» против примерно €1 200/м² в 2022–23 годах. Но задуматься стоит о другой цифре: иностранный спрос падает второй год подряд — минус 50% в 2024-м и ещё минус 30% в 2025-м, — а цены при этом росли. Рост цен на падающем спросе объясняется предложением, и это главное, что нужно понимать перед покупкой в этом городе. Сам центр остаётся практичным выбором для круглогодичной жизни: пешеходный, обслуживаемый вне сезона и заметно дешевле набережной.',
  },

  ksamil: {
    en: "Ksamil costs more per square metre than Sarandë — €1,800–3,000/m² — and earns less from short-term rental. The zone carries 522 listings, up 86% year on year, running at 38.3% occupancy: supply has grown far faster than the season has. Buying here on projected rental income alone does not work at these prices, and the arithmetic gets worse with every completion. The islands and the water are the reason to own in Ksamil; the yield is not. The state reference price runs €60,000–100,000 per unit, and that is the basis for notary and tax costs.",
    ru: 'Ксамиль дороже Саранды в пересчёте на метр — €1 800–3 000/м² — и зарабатывает на краткосрочной аренде меньше. В зоне 522 объявления, рост на 86% год к году, при загрузке 38,3%: предложение выросло куда быстрее, чем сезон. Покупка здесь в расчёте только на арендный доход при таких ценах не работает, и с каждым новым сданным домом арифметика ухудшается. Причина владеть в Ксамиле — острова и вода, а не доходность. Государственная справочная цена — €60 000–100 000 за объект, и именно от неё считаются нотариальные и налоговые расходы.',
  },
}

/**
 * Replacement body for a city landing's "About {city}" block.
 *
 * The Durrës one shipped as a single sentence ("Durrës is one of Albania's key
 * coastal cities with high demand for housing and investment property") — true
 * of every coastal city on the site, and therefore worth nothing to a reader or
 * to search. A city page's job is to send the reader to the right zone, so the
 * replacement is the zone ladder with the numbers on it.
 */
export type CityEditorialCopy = EditorialCopy & {
  /**
   * H2 for the block. The seeded headings were "Durrës description" and
   * "Tirana description" — a CMS field label promoted to a public heading,
   * matching nothing anyone searches for. These say what the section answers.
   */
  title: EditorialCopy
}

export const CITY_EDITORIAL_COPY: Record<string, CityEditorialCopy> = {
  durres: {
    title: {
      en: 'Where to buy in Durrës: districts and prices',
      ru: 'Где покупать в Дурресе: районы и цены',
    },
    en: "Durrës is Albania's second city and its busiest stretch of coast, and it does not have one price — it has a dozen. The centre and the Currila–Vollga–Taulantia seafront ask €1,900–2,800/m². The mass beach strip at Plazh runs €1,200–1,700. Further south along the same sand sit Golem at €1,100–1,500, Mali i Robit at €950–1,200 and Qerret at €1,100–2,500, Qerret being the fastest-appreciating zone in the agglomeration. Inland — Shkozet and Rrashbull — costs €1,000–1,600 with no season premium, and Spitallë starts at €500. The city average is about €1,450/m², up roughly 18% year on year, and it describes almost none of these places. Choose the zone first; the price follows from it.",
    ru: 'Дуррес — второй город Албании и самый плотный участок побережья, и цена у него не одна, а десяток. Центр и набережная Currila–Vollga–Taulantia просят €1 900–2 800/м². Массовая пляжная полоса в Плаже — €1 200–1 700. Дальше на юг по тому же песку идут Голем (€1 100–1 500), Мали-и-Робит (€950–1 200) и Черрет (€1 100–2 500), причём Черрет растёт быстрее всех в агломерации. Внутренние районы, Шкозет и Рашбуль, стоят €1 000–1 600 без сезонной надбавки, а Спитале начинается от €500. Средняя по городу — около €1 450/м², рост примерно 18% год к году, и эта средняя не описывает почти ни одно из перечисленных мест. Сначала выбирайте зону — цена следует из неё.',
  },

  tirana: {
    title: {
      en: 'Where to buy in Tirana: districts and prices',
      ru: 'Где покупать в Тиране: районы и цены',
    },
    en: "Tirana's median asking price is about €1,863/m², and the ladder underneath it runs from €750 to €5,500. Blloku is the top at €3,000–5,500/m² for new build and €2,500–3,500 resale. The centre and Pazari i Ri ask €2,300–3,500 new, Komuna e Parisit and the artificial lake €2,000–3,000, Myslym Shyri €2,000–2,500. Past the ring the numbers roughly halve: Astir €1,200–1,500, Kashar €1,000–1,400, Kombinat €1,000–1,300, Paskuqan €800–1,200, Kamëz €750–900. Recorded transactions confirm the split — €2,660/m² in Blloku, €2,054 inside the Small Ring and €1,768 outside it in Q2 2025. One caution on growth: the Bank of Albania's index shows the market flat half on half through the second half of 2025 after rising 56% the year before, so listing-based growth claims deserve scepticism.",
    ru: 'Медианная цена предложения в Тиране — около €1 863/м², а лестница под ней идёт от €750 до €5 500. Верх — Блоку: €3 000–5 500/м² в новостройках и €2 500–3 500 на вторичке. Центр и Пазари-и-Ри просят €2 300–3 500 за новое, Комуна-э-Паризит и Искусственное озеро — €2 000–3 000, Мыслым-Шюри — €2 000–2 500. За кольцом цифры примерно вдвое ниже: Астир €1 200–1 500, Кашар €1 000–1 400, Комбинат €1 000–1 300, Паскукан €800–1 200, Камза €750–900. Зарегистрированные сделки подтверждают разрыв: €2 660/м² в Блоку, €2 054 внутри Малого кольца и €1 768 за ним во II квартале 2025 года. Одна оговорка о росте: индекс Банка Албании показывает рынок без движения полугодие к полугодию во второй половине 2025-го после роста на 56% годом ранее, поэтому к заявлениям о росте, построенным на ценах объявлений, стоит относиться скептически.',
  },

  vlore: {
    title: {
      en: 'Where to buy in Vlora: zones and prices',
      ru: 'Где покупать во Влёре: зоны и цены',
    },
    en: "Vlora averaged about €2,400/m² in 2025 — up 25% year on year, which put it alongside Tirana at the top of Europe for growth. The city does not price as one place. Lungomare, the seafront promenade, asks €2,500–3,500/m² and has doubled since 2022. Uji i Ftohtë, the coast just south of it, runs 20–25% below. The centre and boulevard serve local buyers from €800/m², rising to roughly three times that on the seafront frontage of the same district. Orikum, at the far end of the bay, sits at €1,300–1,500. One thing to weigh before buying: Vlora's airport still had no flights as of summer 2026, and the expectation that it will is already inside the prices above.",
    ru: 'Влёра в 2025 году в среднем стоила около €2 400/м² — рост на 25% год к году, что поставило её вместе с Тираной в верх Европы по динамике. Но как одно место город не оценивается. Лунгомаре, набережная, просит €2 500–3 500/м² и удвоилась с 2022 года. Уйи-и-Фтохте, побережье сразу к югу, идёт на 20–25% дешевле. Центр и бульвар обслуживают местных покупателей от €800/м², а фронт набережной в том же районе — примерно втрое дороже. Орикум в дальнем конце залива — €1 300–1 500. Что стоит взвесить до покупки: у аэропорта Влёры по состоянию на лето 2026 года всё ещё нет рейсов, а ожидание того, что они появятся, уже заложено в цены выше.',
  },

  sarande: {
    title: {
      en: 'Where to buy in Sarandë: zones and prices',
      ru: 'Где покупать в Саранде: зоны и цены',
    },
    en: "Sarandë asks €2,000–2,500/m² for new build within a kilometre of the sea, and inside that figure the strip matters more than the city. Buzë Shëtitores, the first line along the promenade, runs €3,000–3,500/m², with resort apartments reaching €4,000. The centre is €1,600–1,800 for turnkey stock. Ksamil, 15 km south, is €1,800–3,000 — more per square metre than the city itself. The rental picture is the same across all three: about 430 short-term listings at roughly 41% occupancy, so an apartment here earns for part of the year and sits for the rest. Foreign demand has fallen two years running while prices rose, and that gap is the thing to understand before buying on this coast.",
    ru: 'Саранда просит €2 000–2 500/м² за новостройку в километре от моря, и внутри этой цифры полоса значит больше, чем город. Бузе-Шетиторес, первая линия вдоль набережной, — €3 000–3 500/м², курортные апартаменты доходят до €4 000. Центр — €1 600–1 800 за фонд «под ключ». Ксамиль в 15 км южнее — €1 800–3 000, то есть дороже за метр, чем сам город. Картина по аренде у всех трёх одинаковая: около 430 краткосрочных объявлений при загрузке примерно 41%, так что квартира здесь зарабатывает часть года, а остальное время простаивает. Иностранный спрос падал два года подряд, пока цены росли, и именно этот разрыв нужно понимать перед покупкой на этом побережье.',
  },
}
