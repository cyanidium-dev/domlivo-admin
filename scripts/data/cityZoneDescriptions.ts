/**
 * `city.description` for all seven cities, and the one published district that
 * still had none.
 *
 * These feed two places: the city or district page's editorial copy, and —
 * through `buildZoneMetaDescription` — the sentence a zone's meta description
 * borrows when the figures alone leave it thin. Every city carried a stub
 * ("Durres is the main port.", 24 characters), which is why their search
 * snippets read as a price and nothing else.
 *
 * The first sentence of each is deliberately written to stand alone at roughly
 * 120–130 characters, because that is the part the meta description takes.
 *
 * Every figure comes from that zone's own record in `zone-metrics-seed.json`,
 * so the copy and the tables on the same page cannot drift apart. Only `en` and
 * `ru` are authored; the rest are filled by `translate:zone-editorial`.
 */

import type {EditorialCopy} from './zoneEditorialCopy'

/** Keyed by `city.slug.current`. */
export const CITY_ZONE_DESCRIPTIONS: Record<string, EditorialCopy> = {
  tirana: {
    en: "Recorded sales split Tirana more usefully than any average: €2,660/m² in Blloku, €2,054 inside the Small Ring, €1,768 outside it. The median asking price is about €1,863/m². One caution on growth — the Bank of Albania's index shows the market flat half on half through the second half of 2025, after rising 56% the year before, so claims built on listing prices deserve scepticism.",
    ru: 'Зарегистрированные сделки делят Тирану полезнее любой средней: €2 660/м² в Блоку, €2 054 внутри Малого кольца, €1 768 за ним. Медианная цена предложения — около €1 863/м². Одна оговорка о росте: индекс Банка Албании показывает рынок без движения полугодие к полугодию во второй половине 2025 года после роста на 56% годом ранее, поэтому к заявлениям, построенным на ценах объявлений, стоит относиться скептически.',
  },

  durres: {
    en: 'Durrës averages about €1,450/m² and is up roughly 18% year on year, but the city prices as a dozen separate strips rather than one. The centre and the Currila–Vollga–Taulantia seafront ask €1,900–2,800/m²; the beach at Plazh runs €1,200–1,700; inland Shkozet and Rrashbull sit at €1,000–1,600 with no season premium. The 01.01.2026 reference schedule tripled the port zone figure to 200,000 lek/m², which the city average does not reflect.',
    ru: 'Дуррес в среднем стоит около €1 450/м² и прибавил примерно 18% год к году, но оценивается не как один рынок, а как десяток отдельных полос. Центр и набережная Currila–Vollga–Taulantia просят €1 900–2 800/м²; пляж в Плаже — €1 200–1 700; внутренние Шкозет и Рашбуль — €1 000–1 600 без сезонной надбавки. Редакция справочных цен от 01.01.2026 утроила показатель портовой зоны до 200 000 лек/м², и городская средняя этого не отражает.',
  },

  vlore: {
    en: 'Vlora averaged €2,400/m² in 2025, up 25% year on year — with Tirana, the fastest growth in Europe. Inside that the spread is wide: the Lungomare promenade asks €2,500–3,500/m² and has doubled since 2022, while the centre and boulevard still serve local buyers from €800/m². One thing to weigh before buying — the airport still had no flights as of summer 2026, and the expectation that it will is already in the prices.',
    ru: 'Влёра в 2025 году в среднем стоила €2 400/м², рост на 25% год к году — вместе с Тираной это самый быстрый рост в Европе. Внутри разброс велик: набережная Лунгомаре просит €2 500–3 500/м² и удвоилась с 2022 года, а центр и бульвар по-прежнему обслуживают местных покупателей от €800/м². Что стоит взвесить до покупки: у аэропорта по состоянию на лето 2026 года всё ещё нет рейсов, а ожидание того, что они появятся, уже заложено в цены.',
  },

  sarande: {
    en: 'Sarandë asks €2,000–2,500/m² for new build within a kilometre of the sea, and its 430 short-term listings run at about 41% occupancy. The strip matters more than the city figure: the promenade reaches €3,000–3,500/m², the centre is €1,600–1,800 turnkey, and Ksamil is €1,800–3,000. Foreign demand has fallen two years running while prices rose, and that gap is the thing to understand before buying here.',
    ru: 'Саранда просит €2 000–2 500/м² за новостройку в километре от моря, а её 430 краткосрочных объявлений работают при загрузке около 41%. Полоса значит больше городской цифры: набережная доходит до €3 000–3 500/м², центр — €1 600–1 800 «под ключ», Ксамиль — €1 800–3 000. Иностранный спрос падал два года подряд, пока цены росли, и именно этот разрыв нужно понимать перед покупкой здесь.',
  },

  shengjin: {
    en: 'The 2025 Shëngjin–Velipoja road cut 66 km to under 15, and the town sells at €1,100–2,000/m² to mostly Kosovar and diaspora buyers. The mass segment sits at €1,100–1,500; the top of the band goes to premium residences on the front. A flat here takes about three to three and a half months to sell, and the state reference price is 49,200 lek/m².',
    ru: 'Дорога Шенджин–Велипоя, открытая в 2025 году, сократила 66 км до менее чем 15, и город продаётся по €1 100–2 000/м² преимущественно косовским покупателям и диаспоре. Массовый сегмент — €1 100–1 500; верх диапазона уходит премиальным резиденциям на первой линии. Квартира здесь продаётся примерно за три — три с половиной месяца, а государственная справочная цена — 49 200 лек/м².',
  },

  himare: {
    en: 'Himarë prices as one market: first line with a view reaches €3,500/m² and drops to about €2,200 two or three streets back. The city median is €2,701/m² across a €1,600–3,200 band. Microzones are not priced separately here because the samples are genuinely too thin — a property of this market rather than a gap in the data. The state reference rose 141%, from 58,000 to 140,000 lek/m².',
    ru: 'Химара оценивается как единый рынок: первая линия с видом доходит до €3 500/м² и падает примерно до €2 200 через две-три улицы вглубь. Медиана по городу — €2 701/м² при диапазоне €1 600–3 200. Микрозоны здесь отдельно не оцениваются, потому что выборки действительно слишком малы — это свойство рынка, а не пробел в данных. Справочная цена выросла на 141%, с 58 000 до 140 000 лек/м².',
  },

  shkoder: {
    en: 'Shkodër publishes no single average, deliberately: prime central new build runs €1,700–1,900/m², while peripheral and older stock sits at €800–1,200. New-build prices roughly doubled in four to five years, and the driver was a shortage of building permits rather than foreign demand — which is why the two halves of this market moved so differently.',
    ru: 'Шкодер сознательно не публикует единой средней: качественная центральная новостройка идёт по €1 700–1 900/м², а периферийный и старый фонд — по €800–1 200. Цены на новостройки примерно удвоились за четыре-пять лет, и двигателем был дефицит разрешений на строительство, а не иностранный спрос — поэтому две половины этого рынка разошлись так сильно.',
  },
}

/**
 * Published districts still without editorial copy after the Durrës, Vlorë and
 * Sarandë passes. Shëngjin's centre was the last one.
 */
export const EXTRA_DISTRICT_DESCRIPTIONS: Record<string, EditorialCopy> = {
  'center-shengjin': {
    en: "Shëngjin's seaside centre is, in practice, the whole Shëngjin market — the town has no second district that trades separately. It asks €1,100–2,000/m², with the mass segment at €1,100–1,500 and the top of the band going to premium residences on the front. Buyers are mostly Kosovar and from the diaspora, and a flat takes about three to three and a half months to sell. The state reference price is 49,200 lek/m², which is what notary and tax costs are calculated from rather than the price you agree.",
    ru: 'Приморский центр Шенджина — на практике и есть весь рынок Шенджина: второго района, который торговался бы отдельно, в городе нет. Просит €1 100–2 000/м², где массовый сегмент — €1 100–1 500, а верх диапазона уходит премиальным резиденциям на первой линии. Покупают в основном косовары и диаспора, квартира продаётся примерно за три — три с половиной месяца. Государственная справочная цена — 49 200 лек/м², и именно от неё считаются нотариальные и налоговые расходы, а не от суммы сделки.',
  },
}
