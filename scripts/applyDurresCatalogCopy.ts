/**
 * Fills the en/uk/ru/it/pl intro and bottom text of the Durrës catalog listing
 * pages (city, centre, Golem, Plazh, Shkëmbi) — 2026-09-16.
 *
 * Why: those five pages carry 360 of the site's Durrës listings, and only their
 * Albanian copy was ever written (100–170 words with zone prices). Every other
 * locale still had the seed stub — "Property catalog in Golem, Durres. Domlivo
 * aggregates up-to-date listings." — which is exactly the uk/it/pl long tail the
 * Durrës plan targets. Qerret and Mali i Robit already had all six locales.
 *
 * The texts follow the sq versions paragraph by paragraph, so every figure is
 * one already on the page (knowledge-base/02-cities/durres.md §2). The one
 * addition is the building-age check on Plazh and Shkëmbi (§6: the 2019
 * earthquake did its worst damage on that strip).
 *
 * Safety: sq is never touched; a locale is only written while it is still a
 * stub (intro under 20 words, bottom text under 40), so later edits survive.
 * Backups, ifRevisionID, one transaction.
 *
 * Run:
 *   npx tsx scripts/applyDurresCatalogCopy.ts
 *   npx tsx scripts/applyDurresCatalogCopy.ts --execute
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.includes('--execute')
const token = process.env.SANITY_API_TOKEN?.trim()
if (!token) {
  console.error('SANITY_API_TOKEN required in .env')
  process.exit(1)
}
const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token,
  useCdn: false,
})

const LOCALES = ['en', 'uk', 'ru', 'it', 'pl'] as const
type Locale = (typeof LOCALES)[number]
type Copy = {intro: Record<Locale, string>; bottom: Record<Locale, string[]>}

const COPY: Record<string, Copy> = {
  'catalogSeoPage-city-city-durres': {
    intro: {
      en: 'Apartments, studios, villas and land for sale in Durrës and along its coast — from the centre and Plazh to Golem, Qerret and Spille. Real prices, photos and direct contact.',
      uk: 'Квартири, студії, вілли та земля на продаж у Дурресі та на його узбережжі — від центру й Плажа до Голема, Черрета і Спілле. Реальні ціни, фото й прямий контакт.',
      ru: 'Квартиры, студии, виллы и земля на продажу в Дурресе и на его побережье — от центра и Плажа до Голема, Черрета и Спилле. Реальные цены, фото и прямой контакт.',
      it: 'Appartamenti, monolocali, ville e terreni in vendita a Durazzo e sulla sua costa, dal centro e Plazh fino a Golem, Qerret e Spille. Prezzi reali, foto e contatto diretto.',
      pl: 'Mieszkania, kawalerki, wille i działki na sprzedaż w Durrës i na jego wybrzeżu — od centrum i Plazh po Golem, Qerret i Spille. Prawdziwe ceny, zdjęcia i bezpośredni kontakt.',
    },
    bottom: {
      en: [
        'Durrës is the largest coastal housing market in Albania. The average asking price in the city is about 1,450 €/m² (first half of 2026), up roughly 18% in a year. The gap between zones is wide: from 450–800 €/m² for old stock in Shkëmbi i Kavajës, to 1,200–1,700 €/m² in Plazh and 1,900–2,800 €/m² in the centre and on the front row of Currila.',
        'This catalogue holds 1+1 and 2+1 apartments in new and finished buildings, studios for holiday letting, villas with land in Shkallnur and Gjiri i Lalzit, and land in Qerret and Spille. Every listing shows the real price, the area and photos; for buildings under construction the price per m² and the handover date are stated.',
        'Filter by zone, price, area and number of rooms, or open the district pages — Plazh, Shkëmbi i Kavajës, Golem, Mali i Robit, Qerret, Kavajë, Spille — for the prices and offers in each.',
      ],
      uk: [
        'Дуррес — найбільший ринок прибережного житла в Албанії. Середня ціна пропозиції в місті — близько 1,450 €/m² (перше півріччя 2026 року), за рік вона зросла приблизно на 18%. Розрив між зонами великий: від 450–800 €/m² за старий фонд у Шкембі-і-Каваєс до 1,200–1,700 €/m² у Плажі та 1,900–2,800 €/m² у центрі й на першій лінії Курріли.',
        'У каталозі — квартири 1+1 і 2+1 у новобудовах і зданих будинках, студії під туристичну оренду, вілли з ділянкою в Шкалнурі та затоці Лальзіт, земля в Черреті та Спілле. У кожному оголошенні — реальна ціна, площа й фото; для будинків, що будуються, вказано ціну за m² і термін здачі.',
        'Фільтруйте за зоною, ціною, площею та кількістю кімнат або відкривайте сторінки районів — Плаж, Шкембі-і-Каваєс, Голем, Малі і Робіт, Черрет, Кавая, Спілле, — щоб побачити ціни й пропозиції кожного.',
      ],
      ru: [
        'Дуррес — крупнейший рынок прибрежного жилья в Албании. Средняя цена предложения в городе — около 1,450 €/m² (первое полугодие 2026 года), за год она выросла примерно на 18%. Разрыв между зонами большой: от 450–800 €/m² за старый фонд в Шкемби-и-Каваес до 1,200–1,700 €/m² в Плаже и 1,900–2,800 €/m² в центре и на первой линии Курилы.',
        'В каталоге — квартиры 1+1 и 2+1 в новостройках и сданных домах, студии под туристическую аренду, виллы с участком в Шкалнуре и заливе Лальзит, земля в Черрете и Спилле. В каждом объявлении — реальная цена, площадь и фото; для строящихся домов указаны цена за m² и срок сдачи.',
        'Фильтруйте по зоне, цене, площади и числу комнат или открывайте страницы районов — Плаж, Шкемби-и-Каваес, Голем, Мали и Робит, Черрет, Кавая, Спилле, — чтобы увидеть цены и предложения каждого.',
      ],
      it: [
        'Durazzo è il più grande mercato residenziale costiero dell’Albania. Il prezzo medio richiesto in città è di circa 1,450 €/m² (primo semestre 2026), in crescita di circa il 18% in un anno. Il divario tra le zone è ampio: da 450–800 €/m² per il patrimonio vecchio di Shkëmbi i Kavajës a 1,200–1,700 €/m² a Plazh e 1,900–2,800 €/m² in centro e in prima linea a Currila.',
        'In questo catalogo trovate appartamenti 1+1 e 2+1 in edifici nuovi e finiti, monolocali per l’affitto turistico, ville con terreno a Shkallnur e nella Baia di Lalzi, e terreni a Qerret e Spille. Ogni annuncio riporta il prezzo reale, la superficie e le foto; per gli edifici in costruzione sono indicati il prezzo al m² e la data di consegna.',
        'Filtrate per zona, prezzo, superficie e numero di stanze, oppure aprite le pagine delle zone — Plazh, Shkëmbi i Kavajës, Golem, Mali i Robit, Qerret, Kavajë, Spille — per prezzi e offerte di ciascuna.',
      ],
      pl: [
        'Durrës to największy rynek nadmorskich mieszkań w Albanii. Średnia cena ofertowa w mieście wynosi około 1,450 €/m² (pierwsze półrocze 2026), o mniej więcej 18% więcej niż rok wcześniej. Różnice między strefami są duże: od 450–800 €/m² za stary zasób w Shkëmbi i Kavajës, przez 1,200–1,700 €/m² w Plazh, po 1,900–2,800 €/m² w centrum i w pierwszej linii Currili.',
        'W katalogu są mieszkania 1+1 i 2+1 w nowych i oddanych budynkach, kawalerki pod najem turystyczny, wille z działką w Shkallnur i Zatoce Lalzit oraz grunty w Qerret i Spille. Każde ogłoszenie ma prawdziwą cenę, powierzchnię i zdjęcia; przy budynkach w budowie podajemy cenę za m² i termin oddania.',
        'Filtruj według strefy, ceny, powierzchni i liczby pokoi albo otwórz strony dzielnic — Plazh, Shkëmbi i Kavajës, Golem, Mali i Robit, Qerret, Kavajë, Spille — aby zobaczyć ceny i oferty w każdej z nich.',
      ],
    },
  },

  'catalogSeoPage-district-district-durres-center': {
    intro: {
      en: 'Durrës city centre, Currila and Vollga are the city’s premium strip: apartments at 1,900–2,800 €/m² and penthouses above 3,000 €/m², with life all year round.',
      uk: 'Центр Дурреса, Курріла й Волга — преміальна смуга міста: квартири за 1,900–2,800 €/m², пентхауси понад 3,000 €/m² і життя цілий рік.',
      ru: 'Центр Дурреса, Курила и Волга — премиальная полоса города: квартиры за 1,900–2,800 €/m², пентхаусы дороже 3,000 €/m² и жизнь круглый год.',
      it: 'Il centro di Durazzo, Currila e Vollga sono la fascia di pregio della città: appartamenti a 1,900–2,800 €/m² e attici oltre 3,000 €/m², con vita tutto l’anno.',
      pl: 'Centrum Durrës, Currila i Vollga to najdroższy pas miasta: mieszkania po 1,900–2,800 €/m² i penthouse’y powyżej 3,000 €/m², z życiem przez cały rok.',
    },
    bottom: {
      en: [
        'Durrës city centre — the boulevard, Vollga, Taulantia and Currila — is where people live all year round and where prices are the highest in the city: 1,900–2,800 €/m² (2026-H1) for apartments and above 3,000 €/m² for penthouses with a sea view. Currila has risen 70–90% since 2019.',
        'In the catalogue: 1+1 and 2+1 apartments in new blocks near the promenade, renovated flats in the centre’s older stock, commercial property and offices. For a buyer looking for a city rather than a holiday, this is the zone: the amphitheatre, the port, the station and schools are all within walking distance.',
        'For a lower budget, look at Shkozet and Rrashbull inside the city, or at Plazh along the sea.',
      ],
      uk: [
        'Центр Дурреса — бульвар, Волга, Тауланція й Курріла — це місце, де живуть цілий рік і де ціни найвищі в місті: 1,900–2,800 €/m² (2026-H1) за квартири й понад 3,000 €/m² за пентхауси з видом на море. Курріла подорожчала на 70–90% з 2019 року.',
        'У каталозі — квартири 1+1 і 2+1 у нових будинках біля набережної, відремонтовані квартири в старому фонді центру, комерційна нерухомість і офіси. Для покупця, якому потрібне місто, а не відпочинок, це саме та зона: амфітеатр, порт, вокзал і школи — пішки.',
        'Для меншого бюджету дивіться Шкозет і Рашбуль у межах міста або Плаж уздовж моря.',
      ],
      ru: [
        'Центр Дурреса — бульвар, Волга, Таулантия и Курила — место, где живут круглый год и где цены самые высокие в городе: 1,900–2,800 €/m² (2026-H1) за квартиры и дороже 3,000 €/m² за пентхаусы с видом на море. Курила подорожала на 70–90% с 2019 года.',
        'В каталоге — квартиры 1+1 и 2+1 в новых домах у набережной, отремонтированные квартиры в старом фонде центра, коммерческая недвижимость и офисы. Для покупателя, которому нужен город, а не отдых, это та самая зона: амфитеатр, порт, вокзал и школы — пешком.',
        'Для меньшего бюджета смотрите Шкозет и Рашбуль в пределах города или Плаж вдоль моря.',
      ],
      it: [
        'Il centro di Durazzo — il viale, Vollga, Taulantia e Currila — è dove si vive tutto l’anno e dove i prezzi sono i più alti della città: 1,900–2,800 €/m² (2026-H1) per gli appartamenti e oltre 3,000 €/m² per gli attici vista mare. Currila è cresciuta del 70–90% dal 2019.',
        'Nel catalogo: appartamenti 1+1 e 2+1 in palazzi nuovi vicino al lungomare, appartamenti ristrutturati nel patrimonio storico del centro, immobili commerciali e uffici. Per chi cerca una città e non una vacanza, questa è la zona: anfiteatro, porto, stazione e scuole sono raggiungibili a piedi.',
        'Con un budget più basso guardate Shkozet e Rrashbull in città, oppure Plazh lungo il mare.',
      ],
      pl: [
        'Centrum Durrës — bulwar, Vollga, Taulantia i Currila — to miejsce, gdzie mieszka się przez cały rok i gdzie ceny są najwyższe w mieście: 1,900–2,800 €/m² (2026-H1) za mieszkania i ponad 3,000 €/m² za penthouse’y z widokiem na morze. Currila podrożała o 70–90% od 2019 roku.',
        'W katalogu: mieszkania 1+1 i 2+1 w nowych blokach przy promenadzie, wyremontowane mieszkania w starszej zabudowie centrum, lokale użytkowe i biura. Dla kupującego, który szuka miasta, a nie wakacji, to właściwa strefa: amfiteatr, port, dworzec i szkoły są w zasięgu spaceru.',
        'Przy niższym budżecie zobacz Shkozet i Rrashbull w granicach miasta albo Plazh wzdłuż morza.',
      ],
    },
  },

  'catalogSeoPage-district-district-golem-durres': {
    intro: {
      en: 'Golem is the most sought-after beach south of Durrës: new 1+1 and 2+1 apartments from 1,100 €/m² on the second line and 2,000–2,500 €/m² on the first.',
      uk: 'Голем — найзатребуваніший пляж на південь від Дурреса: нові квартири 1+1 і 2+1 від 1,100 €/m² на другій лінії та 2,000–2,500 €/m² на першій.',
      ru: 'Голем — самый востребованный пляж к югу от Дурреса: новые квартиры 1+1 и 2+1 от 1,100 €/m² на второй линии и 2,000–2,500 €/m² на первой.',
      it: 'Golem è la spiaggia più richiesta a sud di Durazzo: appartamenti nuovi 1+1 e 2+1 da 1,100 €/m² in seconda linea e 2,000–2,500 €/m² in prima.',
      pl: 'Golem to najbardziej poszukiwana plaża na południe od Durrës: nowe mieszkania 1+1 i 2+1 od 1,100 €/m² w drugiej linii i 2,000–2,500 €/m² w pierwszej.',
    },
    bottom: {
      en: [
        'Golem (Kavajë municipality, but part of the Durrës coast as far as the market is concerned) has the largest number of new builds on this coast. Asking prices on the second and third line are 1,100–1,500 €/m² (2026-H1), up 8–15% in a year; the first line, where nothing new is being built, asks 2,000–2,500 €/m² and rises faster still, because supply there does not grow.',
        'Typical offer: studios and 1+1 apartments of 40–60 m² in complexes with a pool and management, and 2+1 apartments of 70–90 m² for families, often priced per m² with instalments during construction. Always ask for the construction stage, the handover date and the ownership certificate — all three are noted on every listing of ours.',
        'For lower prices see neighbouring Mali i Robit; for villas and land, Qerret and Gjiri i Lalzit.',
      ],
      uk: [
        'Голем (муніципалітет Кавая, але для ринку — частина узбережжя Дурреса) має найбільше новобудов на цьому узбережжі. Ціни пропозиції на другій і третій лінії — 1,100–1,500 €/m² (2026-H1), зростання 8–15% за рік; перша лінія, де більше не будують, просить 2,000–2,500 €/m² і дорожчає ще швидше, бо пропозиція там не росте.',
        'Типова пропозиція: студії та квартири 1+1 площею 40–60 m² у комплексах із басейном і керуванням, 2+1 площею 70–90 m² для сімей, часто з ціною за m² і розстрочкою на час будівництва. Завжди питайте про стадію будівництва, термін здачі та свідоцтво про власність — усі три пункти вказані в кожному нашому оголошенні.',
        'Дешевше — у сусідньому Малі і Робіт; вілли й землю шукайте в Черреті та затоці Лальзіт.',
      ],
      ru: [
        'Голем (муниципалитет Кавая, но для рынка — часть побережья Дурреса) — зона с наибольшим числом новостроек на этом побережье. Цены предложения на второй и третьей линии — 1,100–1,500 €/m² (2026-H1), рост 8–15% за год; первая линия, где больше не строят, просит 2,000–2,500 €/m² и дорожает ещё быстрее, потому что предложение там не растёт.',
        'Типичное предложение: студии и квартиры 1+1 площадью 40–60 m² в комплексах с бассейном и управлением, 2+1 площадью 70–90 m² для семей, часто с ценой за m² и рассрочкой на время строительства. Всегда спрашивайте стадию строительства, срок сдачи и свидетельство о собственности — все три пункта указаны в каждом нашем объявлении.',
        'Дешевле — в соседнем Мали и Робит; виллы и землю ищите в Черрете и заливе Лальзит.',
      ],
      it: [
        'Golem (comune di Kavajë, ma per il mercato parte della costa di Durazzo) è la zona con il maggior numero di nuove costruzioni su questa costa. I prezzi richiesti in seconda e terza linea sono 1,100–1,500 €/m² (2026-H1), in crescita dell’8–15% in un anno; la prima linea, dove non si costruisce più, chiede 2,000–2,500 €/m² e sale ancora più in fretta, perché lì l’offerta non aumenta.',
        'Offerta tipica: monolocali e appartamenti 1+1 da 40–60 m² in complessi con piscina e gestione, e 2+1 da 70–90 m² per famiglie, spesso con prezzo al m² e pagamento a rate durante la costruzione. Chiedete sempre lo stato dei lavori, la data di consegna e il certificato di proprietà: tutti e tre sono indicati in ogni nostro annuncio.',
        'Per prezzi più bassi guardate la vicina Mali i Robit; per ville e terreni, Qerret e la Baia di Lalzi.',
      ],
      pl: [
        'Golem (gmina Kavajë, ale dla rynku część wybrzeża Durrës) to strefa z największą liczbą nowych inwestycji na tym wybrzeżu. Ceny ofertowe w drugiej i trzeciej linii to 1,100–1,500 €/m² (2026-H1), wzrost o 8–15% w ciągu roku; pierwsza linia, gdzie już się nie buduje, kosztuje 2,000–2,500 €/m² i drożeje jeszcze szybciej, bo podaż tam nie rośnie.',
        'Typowa oferta: kawalerki i mieszkania 1+1 o powierzchni 40–60 m² w kompleksach z basenem i zarządcą oraz 2+1 o powierzchni 70–90 m² dla rodzin, często z ceną za m² i ratami w trakcie budowy. Zawsze pytaj o etap budowy, termin oddania i akt własności — wszystkie trzy podajemy w każdym naszym ogłoszeniu.',
        'Taniej jest w sąsiednim Mali i Robit; wille i działki znajdziesz w Qerret i Zatoce Lalzit.',
      ],
    },
  },

  'catalogSeoPage-district-district-plazh': {
    intro: {
      en: 'Plazh is the main residential seafront of Durrës: 1+1 and 2+1 apartments near the promenade, with shops, transport and life all year round.',
      uk: 'Плаж — головна житлова приморська зона Дурреса: квартири 1+1 і 2+1 біля набережної, з магазинами, транспортом і життям цілий рік.',
      ru: 'Плаж — главная жилая приморская зона Дурреса: квартиры 1+1 и 2+1 у набережной, с магазинами, транспортом и жизнью круглый год.',
      it: 'Plazh è il principale fronte mare residenziale di Durazzo: appartamenti 1+1 e 2+1 vicino al lungomare, con negozi, trasporti e vita tutto l’anno.',
      pl: 'Plazh to główna mieszkalna część nadmorska Durrës: mieszkania 1+1 i 2+1 przy promenadzie, ze sklepami, komunikacją i życiem przez cały rok.',
    },
    bottom: {
      en: [
        'Plazh is the most sought-after part of Durrës for living and holidays alike: the coastal road, the promenade, supermarkets and city bus lines work all year, unlike the zones further south. Asking prices are 1,200–1,700 €/m² (2026-H1), up as much as 21% in a year; new blocks with a lift and a sea view sit at the top of the range, while stock from the 2000s sells for less.',
        'Typical offer: 1+1 apartments of 45–65 m² and 2+1 of 70–100 m², often furnished and ready to live in or to let by the day in season. Ask for the distance to the sea and the floor — on the second and third line the price difference is noticeable — and for the construction year, since the 2019 earthquake did its worst damage on this strip.',
        'This page shows the current listings in Plazh; for the neighbouring zones see Plepa, Shkëmbi i Kavajës and the centre of Durrës.',
      ],
      uk: [
        'Плаж — найзатребуваніша частина Дурреса і для життя, і для відпочинку: прибережна дорога, набережна, супермаркети й міські автобуси працюють цілий рік, на відміну від зон південніше. Ціни пропозиції — 1,200–1,700 €/m² (2026-H1), зростання до 21% за рік; нові будинки з ліфтом і видом на море — у верхній частині діапазону, фонд 2000-х продається дешевше.',
        'Типова пропозиція: квартири 1+1 площею 45–65 m² і 2+1 площею 70–100 m², часто вмебльовані й готові до життя або до подобової оренди в сезон. Питайте відстань до моря й поверх — на другій і третій лінії різниця в ціні відчутна — а також рік будівництва: землетрус 2019 року найсильніше вдарив саме по цій смузі.',
        'На цій сторінці — актуальні оголошення в Плажі; сусідні зони — Плепа, Шкембі-і-Каваєс і центр Дурреса.',
      ],
      ru: [
        'Плаж — самая востребованная часть Дурреса и для жизни, и для отдыха: прибрежная дорога, набережная, супермаркеты и городские автобусы работают круглый год, в отличие от зон южнее. Цены предложения — 1,200–1,700 €/m² (2026-H1), рост до 21% за год; новые дома с лифтом и видом на море — в верхней части диапазона, фонд 2000-х продаётся дешевле.',
        'Типичное предложение: квартиры 1+1 площадью 45–65 m² и 2+1 площадью 70–100 m², часто с мебелью и готовые к жизни или посуточной аренде в сезон. Спрашивайте расстояние до моря и этаж — на второй и третьей линии разница в цене ощутима — и год постройки: землетрясение 2019 года сильнее всего ударило именно по этой полосе.',
        'На этой странице — актуальные объявления в Плаже; соседние зоны — Плепа, Шкемби-и-Каваес и центр Дурреса.',
      ],
      it: [
        'Plazh è la parte di Durazzo più richiesta sia per viverci sia per le vacanze: la strada costiera, il lungomare, i supermercati e le linee urbane funzionano tutto l’anno, a differenza delle zone più a sud. I prezzi richiesti sono 1,200–1,700 €/m² (2026-H1), fino al +21% in un anno; i palazzi nuovi con ascensore e vista mare stanno nella parte alta, mentre il patrimonio degli anni 2000 costa meno.',
        'Offerta tipica: appartamenti 1+1 da 45–65 m² e 2+1 da 70–100 m², spesso arredati e pronti da abitare o da affittare a giornata in stagione. Chiedete la distanza dal mare e il piano (in seconda e terza linea la differenza di prezzo si sente) e l’anno di costruzione, perché il terremoto del 2019 ha colpito soprattutto questa fascia.',
        'Questa pagina mostra gli annunci attuali a Plazh; per le zone vicine vedete Plepa, Shkëmbi i Kavajës e il centro di Durazzo.',
      ],
      pl: [
        'Plazh to najbardziej poszukiwana część Durrës zarówno do mieszkania, jak i na wakacje: nadmorska droga, promenada, supermarkety i miejskie autobusy działają przez cały rok, w przeciwieństwie do stref dalej na południe. Ceny ofertowe to 1,200–1,700 €/m² (2026-H1), do 21% więcej niż rok wcześniej; nowe bloki z windą i widokiem na morze są w górnej części przedziału, a zabudowa z lat 2000. sprzedaje się taniej.',
        'Typowa oferta: mieszkania 1+1 o powierzchni 45–65 m² i 2+1 o powierzchni 70–100 m², często umeblowane i gotowe do zamieszkania lub najmu na doby w sezonie. Pytaj o odległość od morza i piętro — w drugiej i trzeciej linii różnica w cenie jest odczuwalna — oraz o rok budowy, bo trzęsienie ziemi w 2019 roku najmocniej uderzyło właśnie w ten pas.',
        'Na tej stronie są aktualne ogłoszenia w Plazh; sąsiednie strefy to Plepa, Shkëmbi i Kavajës i centrum Durrës.',
      ],
    },
  },

  'catalogSeoPage-district-district-shkembi-durres': {
    intro: {
      en: 'Shkëmbi i Kavajës has the widest price gap in Durrës: old stock from 450 €/m² and new builds by the sea up to 2,000 €/m².',
      uk: 'У Шкембі-і-Каваєс найбільший розрив цін у Дурресі: старий фонд від 450 €/m² і новобудови біля моря до 2,000 €/m².',
      ru: 'В Шкемби-и-Каваес самый большой разрыв цен в Дурресе: старый фонд от 450 €/m² и новостройки у моря до 2,000 €/m².',
      it: 'Shkëmbi i Kavajës ha il divario di prezzo più ampio di Durazzo: patrimonio vecchio da 450 €/m² e nuove costruzioni sul mare fino a 2,000 €/m².',
      pl: 'Shkëmbi i Kavajës ma największą rozpiętość cen w Durrës: stary zasób od 450 €/m² i nowe budynki nad morzem do 2,000 €/m².',
    },
    bottom: {
      en: [
        'Shkëmbi i Kavajës lies between Plepa and Golem, with a wide beach and blocks that start on the first line. New builds ask 1,200–2,000 €/m² (2026-H1), while old stock sells for 450–800 €/m² — the widest gap between new and old in all of Durrës, which makes the zone interesting both for living on a low budget and for investing in a new build.',
        'In the catalogue: studios of 30–40 m² for holiday letting, 1+1 and 2+1 apartments with a sea view, penthouses and garages. Many listings come from partner agencies that work only on this coast, so the prices are market prices, not estimates. In the old stock, check the construction year and the structure before you read a low price as a bargain: the 2019 earthquake hit this strip hardest.',
        'See also Golem and Mali i Robit further south, or Plepa towards the city — all three are a few minutes away by car.',
      ],
      uk: [
        'Шкембі-і-Каваєс лежить між Плепою та Големом — широкий пляж і будинки, що починаються з першої лінії. Новобудови просять 1,200–2,000 €/m² (2026-H1), а старий фонд продається за 450–800 €/m² — найбільший розрив між новим і старим у всьому Дурресі, тож зона цікава і для життя з невеликим бюджетом, і для інвестиції в новобудову.',
        'У каталозі — студії 30–40 m² під туристичну оренду, квартири 1+1 і 2+1 з видом на море, пентхауси й гаражі. Багато оголошень — від партнерських агентств, які працюють лише на цьому узбережжі, тож ціни ринкові, а не розрахункові. У старому фонді перевірте рік будівництва й конструкцію, перш ніж вважати низьку ціну вигідною: землетрус 2019 року найсильніше вдарив по цій смузі.',
        'Дивіться також Голем і Малі і Робіт південніше або Плепу в бік міста — усі три за кілька хвилин автомобілем.',
      ],
      ru: [
        'Шкемби-и-Каваес лежит между Плепой и Големом — широкий пляж и дома, начинающиеся с первой линии. Новостройки просят 1,200–2,000 €/m² (2026-H1), а старый фонд продаётся за 450–800 €/m² — самый большой разрыв между новым и старым во всём Дурресе, поэтому зона интересна и для жизни с небольшим бюджетом, и для инвестиции в новостройку.',
        'В каталоге — студии 30–40 m² под туристическую аренду, квартиры 1+1 и 2+1 с видом на море, пентхаусы и гаражи. Многие объявления — от партнёрских агентств, работающих только на этом побережье, поэтому цены рыночные, а не расчётные. В старом фонде проверьте год постройки и конструкцию, прежде чем считать низкую цену выгодной: землетрясение 2019 года сильнее всего ударило по этой полосе.',
        'Смотрите также Голем и Мали и Робит южнее или Плепу в сторону города — все три в нескольких минутах на машине.',
      ],
      it: [
        'Shkëmbi i Kavajës si trova tra Plepa e Golem, con una spiaggia ampia e palazzi che partono dalla prima linea. Le nuove costruzioni chiedono 1,200–2,000 €/m² (2026-H1), mentre il patrimonio vecchio si vende a 450–800 €/m²: il divario tra nuovo e vecchio più ampio di tutta Durazzo, che rende la zona interessante sia per viverci con un budget basso sia per investire nel nuovo.',
        'Nel catalogo: monolocali da 30–40 m² per l’affitto turistico, appartamenti 1+1 e 2+1 vista mare, attici e garage. Molti annunci arrivano da agenzie partner che lavorano solo su questa costa, quindi i prezzi sono di mercato, non stime. Nel patrimonio vecchio verificate anno di costruzione e struttura prima di considerare un prezzo basso un affare: il terremoto del 2019 ha colpito soprattutto questa fascia.',
        'Vedete anche Golem e Mali i Robit più a sud, o Plepa verso la città: tutte e tre sono a pochi minuti d’auto.',
      ],
      pl: [
        'Shkëmbi i Kavajës leży między Plepą a Golem, z szeroką plażą i blokami zaczynającymi się od pierwszej linii. Nowe budynki kosztują 1,200–2,000 €/m² (2026-H1), a stary zasób sprzedaje się po 450–800 €/m² — to największa różnica między nowym a starym w całym Durrës, dlatego strefa jest ciekawa zarówno do mieszkania przy niskim budżecie, jak i do inwestycji w nową zabudowę.',
        'W katalogu: kawalerki 30–40 m² pod najem turystyczny, mieszkania 1+1 i 2+1 z widokiem na morze, penthouse’y i garaże. Wiele ogłoszeń pochodzi od partnerskich agencji działających tylko na tym wybrzeżu, więc ceny są rynkowe, a nie szacunkowe. W starym zasobie sprawdź rok budowy i konstrukcję, zanim uznasz niską cenę za okazję: trzęsienie ziemi w 2019 roku najmocniej uderzyło w ten pas.',
        'Zobacz też Golem i Mali i Robit dalej na południe albo Plepę w stronę miasta — wszystkie trzy są kilka minut samochodem stąd.',
      ],
    },
  },
}

const words = (s: unknown) => (typeof s === 'string' ? s.trim().split(/\s+/).filter(Boolean).length : 0)

type Doc = {_id: string; _rev: string; intro?: Record<string, string>; bottomText?: Record<string, string>}

async function main(): Promise<void> {
  const ids = Object.keys(COPY)
  const drafts = await client.fetch<string[]>(`*[_id in $ids]._id`, {ids: ids.map((id) => `drafts.${id}`)})
  if (drafts.length) throw new Error(`drafts exist for ${drafts.join(', ')} — publish or discard them first`)
  const docs = await client.fetch<Doc[]>(`*[_id in $ids]{_id, _rev, intro, bottomText}`, {ids})

  const plans: Array<{doc: Doc; set: Record<string, string>}> = []
  for (const id of ids) {
    const doc = docs.find((d) => d._id === id)
    if (!doc) {
      console.warn(`! ${id} not found`)
      continue
    }
    const set: Record<string, string> = {}
    for (const l of LOCALES) {
      const intro = COPY[id].intro[l]
      const bottom = COPY[id].bottom[l].join('\n\n')
      if (words(doc.intro?.[l]) < 20) set[`intro.${l}`] = intro
      else console.log(`  ${id} intro.${l}: already written, kept`)
      if (words(doc.bottomText?.[l]) < 40) set[`bottomText.${l}`] = bottom
      else console.log(`  ${id} bottomText.${l}: already written, kept`)
    }
    const counts = LOCALES.map((l) => `${l} ${words(COPY[id].bottom[l].join(' '))}w`).join(', ')
    console.log(`${Object.keys(set).length ? '+' : '-'} ${id}: ${Object.keys(set).length} fields (${counts})`)
    if (Object.keys(set).length) plans.push({doc, set})
  }

  if (!execute) {
    console.log(`\nDry run: ${plans.length} documents. Re-run with --execute to write.`)
    return
  }
  if (!plans.length) return
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.resolve(process.cwd(), 'scripts/data/backups', `durresCatalogCopy-${stamp}`)
  fs.mkdirSync(backupDir, {recursive: true})
  const full = await client.fetch<Array<{_id: string}>>(`*[_id in $ids]`, {ids: plans.map((p) => p.doc._id)})
  for (const d of full) fs.writeFileSync(path.join(backupDir, `${d._id}.json`), JSON.stringify(d, null, 2))
  const tx = client.transaction()
  for (const p of plans) {
    tx.patch(p.doc._id, (patch) => patch.ifRevisionId(p.doc._rev).setIfMissing({intro: {_type: 'localizedString'}, bottomText: {_type: 'localizedText'}}).set(p.set))
  }
  const res = await tx.commit()
  console.log(`Written in transaction ${res.transactionId}. Backups: ${backupDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
