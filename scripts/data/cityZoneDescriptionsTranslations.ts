/**
 * `uk`, `sq`, `it` and `pl` for the city descriptions and Shengjin's centre.
 *
 * Translated by hand. The generator is strict about locale when it borrows a
 * sentence for a meta description — falling back to English produced
 * "Tirana: cena ofertowa €1863/m². Recorded sales split Tirana more usefully
 * than any average…" on the Polish page — so an untranslated locale simply
 * gets the shorter, wholly-localized description instead. These exist so it
 * gets the longer one.
 *
 * As with the English and Russian originals, every figure comes from that
 * zone's own record in `zone-metrics-seed.json`. Numbers, units and proper
 * nouns are carried across verbatim; only the prose is translated.
 *
 * The first sentence of each is kept at roughly 120–150 characters in every
 * language, because that is the part the meta description takes.
 */

import type {EditorialCopy} from './zoneEditorialCopy'

export type TranslatedLocale = 'uk' | 'sq' | 'it' | 'pl'

type Translations = Record<string, Record<TranslatedLocale, string>>

export const CITY_DESCRIPTION_TRANSLATIONS: Translations = {
  tirana: {
    uk: 'Зареєстровані угоди ділять Тирану корисніше за будь-яку середню: €2 660/м² у Блоку, €2 054 всередині Малого кільця, €1 768 за ним. Медіанна ціна пропозиції — близько €1 863/м². Одне застереження щодо зростання: індекс Банку Албанії показує ринок без руху півріччя до півріччя у другій половині 2025 року після зростання на 56% роком раніше, тож до тверджень, побудованих на цінах оголошень, варто ставитися скептично.',
    sq: 'Transaksionet e regjistruara e ndajnë Tiranën më dobishëm se çdo mesatare: €2.660/m² në Bllok, €2.054 brenda Unazës së Vogël, €1.768 jashtë saj. Çmimi mesatar i kërkuar është rreth €1.863/m². Një paralajmërim për rritjen: indeksi i Bankës së Shqipërisë e tregon tregun të pandryshuar gjashtëmujor pas gjashtëmujori në gjysmën e dytë të 2025-ës, pas një rritjeje prej 56% një vit më parë, ndaj pretendimet e ndërtuara mbi çmimet e shpalljeve meritojnë skepticizëm.',
    it: 'Le compravendite registrate dividono Tirana in modo più utile di qualsiasi media: €2.660/m² al Blloku, €2.054 dentro il Piccolo Anello, €1.768 fuori. Il prezzo richiesto mediano è di circa €1.863/m². Una cautela sulla crescita: l’indice della Banca d’Albania mostra il mercato fermo semestre su semestre nella seconda metà del 2025, dopo un +56% l’anno precedente, quindi le affermazioni basate sui prezzi degli annunci meritano scetticismo.',
    pl: 'Zarejestrowane transakcje dzielą Tiranę użyteczniej niż jakakolwiek średnia: €2660/m² na Blloku, €2054 wewnątrz Małej Obwodnicy, €1768 poza nią. Mediana ceny ofertowej to około €1863/m². Jedno zastrzeżenie co do wzrostu: indeks Banku Albanii pokazuje rynek bez ruchu półrocze do półrocza w drugiej połowie 2025 roku, po wzroście o 56% rok wcześniej, więc do twierdzeń opartych na cenach ogłoszeń warto podchodzić sceptycznie.',
  },

  durres: {
    uk: 'Дуррес у середньому коштує близько €1 450/м² і додав приблизно 18% рік до року, але оцінюється не як один ринок, а як десяток окремих смуг. Центр і набережна Currila–Vollga–Taulantia просять €1 900–2 800/м²; пляж у Плажі — €1 200–1 700; внутрішні Шкозет і Рашбуль — €1 000–1 600 без сезонної надбавки. Редакція довідкових цін від 01.01.2026 потроїла показник портової зони до 200 000 лек/м², і міська середня цього не відображає.',
    sq: 'Durrësi mesatarisht kushton rreth €1.450/m² dhe është rritur me afërsisht 18% brenda vitit, por qyteti çmohet si një duzinë shiritash të veçantë, jo si një treg i vetëm. Qendra dhe fronti detar Currila–Vollga–Taulantia kërkojnë €1.900–2.800/m²; plazhi te Plazhi shkon €1.200–1.700; Shkozeti dhe Rrashbulli në brendësi qëndrojnë €1.000–1.600 pa shtesë sezonale. Tabela e referencës e 01.01.2026 e trefishoi shifrën e zonës portuale në 200.000 lekë/m², gjë që mesatarja e qytetit nuk e pasqyron.',
    it: 'Durazzo ha una media di circa €1.450/m² ed è cresciuta di circa il 18% su base annua, ma la città si valuta come una dozzina di fasce distinte, non come un mercato unico. Il centro e il lungomare Currila–Vollga–Taulantia chiedono €1.900–2.800/m²; la spiaggia di Plazh sta sui €1.200–1.700; Shkozet e Rrashbull nell’entroterra restano a €1.000–1.600 senza sovrapprezzo stagionale. Il prontuario di riferimento del 01.01.2026 ha triplicato il dato della zona portuale a 200.000 lek/m², cosa che la media cittadina non riflette.',
    pl: 'Durrës kosztuje średnio około €1450/m² i zyskał mniej więcej 18% rok do roku, ale miasto wycenia się jako kilkanaście osobnych pasów, a nie jeden rynek. Centrum i nadmorska promenada Currila–Vollga–Taulantia żądają €1900–2800/m²; plaża w Plazh mieści się w €1200–1700; położone w głębi Shkozet i Rrashbull to €1000–1600 bez sezonowej narzutki. Tabela cen referencyjnych z 01.01.2026 potroiła wskaźnik strefy portowej do 200 000 lek/m², czego średnia miejska nie odzwierciedla.',
  },

  vlore: {
    uk: 'Вльора у 2025 році в середньому коштувала €2 400/м², зростання на 25% рік до року — разом із Тираною це найшвидше зростання в Європі. Усередині розкид великий: набережна Лунгомаре просить €2 500–3 500/м² і подвоїлася з 2022 року, а центр і бульвар досі обслуговують місцевих покупців від €800/м². Що варто зважити перед покупкою: в аеропорту станом на літо 2026 року досі немає рейсів, а очікування, що вони з’являться, уже закладене в ціни.',
    sq: 'Vlora mesatarisht kushtoi €2.400/m² në 2025, me një rritje prej 25% brenda vitit — bashkë me Tiranën, rritja më e shpejtë në Evropë. Brenda saj hapësira është e gjerë: shëtitorja e Lungomares kërkon €2.500–3.500/m² dhe është dyfishuar që nga 2022, ndërsa qendra dhe bulevardi u shërbejnë ende blerësve vendas nga €800/m². Diçka për t’u peshuar para blerjes: aeroporti ende nuk kishte fluturime në verën e 2026-ës, dhe pritshmëria se do të ketë është tashmë brenda çmimeve.',
    it: 'Valona ha avuto una media di €2.400/m² nel 2025, +25% su base annua: con Tirana, la crescita più rapida d’Europa. Al suo interno la forbice è ampia: il lungomare Lungomare chiede €2.500–3.500/m² ed è raddoppiato dal 2022, mentre il centro e il viale servono ancora acquirenti locali a partire da €800/m². Una cosa da soppesare prima di comprare: l’aeroporto nell’estate 2026 non aveva ancora voli, e l’attesa che li avrà è già dentro i prezzi.',
    pl: 'Vlora kosztowała średnio €2400/m² w 2025 roku, o 25% więcej rok do roku — razem z Tiraną to najszybszy wzrost w Europie. Wewnątrz rozrzut jest duży: promenada Lungomare żąda €2500–3500/m² i podwoiła się od 2022 roku, a centrum i bulwar wciąż obsługują lokalnych kupujących od €800/m². Jedno, co warto rozważyć przed zakupem: lotnisko latem 2026 roku wciąż nie miało lotów, a oczekiwanie, że je będzie mieć, jest już wliczone w ceny.',
  },

  sarande: {
    uk: 'Саранда просить €2 000–2 500/м² за новобудову в кілометрі від моря, а її 430 короткострокових оголошень працюють із завантаженням близько 41%. Смуга важить більше за міську цифру: набережна сягає €3 000–3 500/м², центр — €1 600–1 800 «під ключ», Ксаміль — €1 800–3 000. Іноземний попит падав два роки поспіль, поки ціни зростали, і саме цей розрив треба розуміти перед покупкою тут.',
    sq: 'Saranda kërkon €2.000–2.500/m² për ndërtim të ri brenda një kilometri nga deti, dhe 430 shpalljet e saj me qira afatshkurtër punojnë me rreth 41% zënie. Shiriti ka më shumë peshë se shifra e qytetit: shëtitorja arrin €3.000–3.500/m², qendra është €1.600–1.800 me çelës në dorë, dhe Ksamili €1.800–3.000. Kërkesa e huaj ka rënë dy vjet radhazi ndërsa çmimet u rritën, dhe pikërisht kjo hendek është ajo që duhet kuptuar para se të blini këtu.',
    it: 'Saranda chiede €2.000–2.500/m² per il nuovo entro un chilometro dal mare, e i suoi 430 annunci di affitto breve viaggiano intorno al 41% di occupazione. La fascia conta più del dato cittadino: il lungomare arriva a €3.000–3.500/m², il centro è €1.600–1.800 chiavi in mano e Ksamil €1.800–3.000. La domanda estera è calata per due anni di fila mentre i prezzi salivano: è questo scarto la cosa da capire prima di comprare qui.',
    pl: 'Saranda żąda €2000–2500/m² za nowe budownictwo w promieniu kilometra od morza, a jej 430 ogłoszeń najmu krótkoterminowego pracuje przy obłożeniu około 41%. Pas znaczy więcej niż liczba dla całego miasta: promenada sięga €3000–3500/m², centrum to €1600–1800 pod klucz, a Ksamil €1800–3000. Popyt zagraniczny spadał dwa lata z rzędu, podczas gdy ceny rosły — i to właśnie ta rozbieżność jest tym, co trzeba zrozumieć przed zakupem tutaj.',
  },

  shengjin: {
    uk: 'Дорога Шенджин–Веліпоя, відкрита у 2025 році, скоротила 66 км до менш ніж 15, і місто продається по €1 100–2 000/м² переважно косовським покупцям і діаспорі. Масовий сегмент — €1 100–1 500; верх діапазону дістається преміальним резиденціям на першій лінії. Квартира тут продається приблизно за три — три з половиною місяці, а державна довідкова ціна — 49 200 лек/м².',
    sq: 'Rruga Shëngjin–Velipojë, e hapur në 2025, i shkurtoi 66 kilometrat në më pak se 15, dhe qyteti shitet me €1.100–2.000/m² kryesisht te blerës kosovarë dhe diaspora. Segmenti masiv qëndron te €1.100–1.500; maja e brezit u shkon rezidencave premium në vijën e parë. Një apartament këtu shitet për rreth tre deri në tre muaj e gjysmë, dhe çmimi i referencës shtetërore është 49.200 lekë/m².',
    it: 'La strada Shëngjin–Velipoja, aperta nel 2025, ha ridotto 66 km a meno di 15, e la città vende a €1.100–2.000/m² soprattutto ad acquirenti kosovari e della diaspora. Il segmento di massa sta a €1.100–1.500; la parte alta della fascia va alle residenze premium in prima linea. Un appartamento qui si vende in circa tre mesi e mezzo, e il prezzo di riferimento statale è 49.200 lek/m².',
    pl: 'Droga Shëngjin–Velipoja, otwarta w 2025 roku, skróciła 66 km do niespełna 15, a miasto sprzedaje po €1100–2000/m² głównie kupującym z Kosowa i diaspory. Segment masowy mieści się w €1100–1500; górna część przedziału przypada rezydencjom premium w pierwszej linii. Mieszkanie sprzedaje się tu w około trzy do trzech i pół miesiąca, a państwowa cena referencyjna to 49 200 lek/m².',
  },

  himare: {
    uk: 'Хімара оцінюється як єдиний ринок: перша лінія з видом сягає €3 500/м² і падає приблизно до €2 200 через дві-три вулиці вглиб. Медіана по місту — €2 701/м² за діапазону €1 600–3 200. Мікрозони тут окремо не оцінюються, бо вибірки справді замалі — це властивість ринку, а не прогалина в даних. Довідкова ціна зросла на 141%, з 58 000 до 140 000 лек/м².',
    sq: 'Himara çmohet si një treg i vetëm: vija e parë me pamje arrin €3.500/m² dhe bie në rreth €2.200 dy ose tre rrugë prapa. Mesatarja e qytetit është €2.701/m² brenda një brezi €1.600–3.200. Mikrozonat nuk çmohen veçmas këtu sepse kampionët janë vërtet shumë të hollë — një veti e këtij tregu, jo një mangësi në të dhëna. Çmimi i referencës u rrit me 141%, nga 58.000 në 140.000 lekë/m².',
    it: 'Himara si valuta come un mercato unico: la prima linea con vista arriva a €3.500/m² e scende a circa €2.200 due o tre strade più indietro. La mediana cittadina è €2.701/m² su una fascia €1.600–3.200. Le microzone non si prezzano separatamente qui perché i campioni sono davvero troppo esigui: è una caratteristica di questo mercato, non una lacuna nei dati. Il prezzo di riferimento è salito del 141%, da 58.000 a 140.000 lek/m².',
    pl: 'Himarë wycenia się jako jeden rynek: pierwsza linia z widokiem sięga €3500/m² i spada do około €2200 dwie lub trzy ulice w głąb. Mediana dla miasta to €2701/m² w przedziale €1600–3200. Mikrostrefy nie są tu wyceniane osobno, bo próby są naprawdę zbyt małe — to cecha tego rynku, a nie luka w danych. Cena referencyjna wzrosła o 141%, z 58 000 do 140 000 lek/m².',
  },

  shkoder: {
    uk: 'Шкодер свідомо не публікує єдиної середньої: якісна центральна новобудова йде по €1 700–1 900/м², а периферійний і старий фонд — по €800–1 200. Ціни на новобудови приблизно подвоїлися за чотири-п’ять років, і рушієм був дефіцит дозволів на будівництво, а не іноземний попит — тому дві половини цього ринку розійшлися так сильно.',
    sq: 'Shkodra nuk publikon qëllimisht një mesatare të vetme: ndërtimi i ri cilësor në qendër shkon €1.700–1.900/m², ndërsa fondi periferik dhe i vjetër qëndron €800–1.200. Çmimet e ndërtimeve të reja u dyfishuan afërsisht brenda katër-pesë vjetësh, dhe shtysa ishte mungesa e lejeve të ndërtimit e jo kërkesa e huaj — prandaj dy gjysmat e këtij tregu lëvizën kaq ndryshe.',
    it: 'Scutari non pubblica deliberatamente una media unica: il nuovo di pregio in centro sta a €1.700–1.900/m², mentre il patrimonio periferico e più vecchio resta a €800–1.200. I prezzi del nuovo sono all’incirca raddoppiati in quattro o cinque anni, e il motore è stata la scarsità di permessi edilizi più che la domanda estera: per questo le due metà di questo mercato si sono mosse in modo così diverso.',
    pl: 'Szkodra celowo nie publikuje jednej średniej: dobre nowe budownictwo w centrum idzie po €1700–1900/m², a zasoby peryferyjne i starsze po €800–1200. Ceny nowego budownictwa mniej więcej podwoiły się w cztery–pięć lat, a motorem był niedobór pozwoleń na budowę, a nie popyt zagraniczny — dlatego dwie połowy tego rynku rozeszły się tak bardzo.',
  },
}

export const DISTRICT_DESCRIPTION_TRANSLATIONS: Translations = {
  'center-shengjin': {
    uk: 'Приморський центр Шенджина — на практиці і є весь ринок Шенджина: другого району, який торгувався б окремо, у місті немає. Просить €1 100–2 000/м², де масовий сегмент — €1 100–1 500, а верх діапазону дістається преміальним резиденціям на першій лінії. Купують переважно косовари та діаспора, квартира продається приблизно за три — три з половиною місяці. Державна довідкова ціна — 49 200 лек/м², і саме від неї рахуються нотаріальні та податкові витрати, а не від суми угоди.',
    sq: 'Qendra bregdetare e Shëngjinit është, në praktikë, i gjithë tregu i Shëngjinit — qyteti nuk ka një zonë të dytë që tregtohet veçmas. Kërkon €1.100–2.000/m², ku segmenti masiv është €1.100–1.500 dhe maja e brezit u shkon rezidencave premium në vijën e parë. Blerësit janë kryesisht kosovarë dhe nga diaspora, dhe një apartament shitet për rreth tre deri në tre muaj e gjysmë. Çmimi i referencës shtetërore është 49.200 lekë/m², dhe pikërisht mbi të llogariten shpenzimet noteriale e tatimore, jo mbi çmimin që bini dakord.',
    it: 'Il centro fronte mare di Shëngjin è, in pratica, l’intero mercato di Shëngjin: la città non ha una seconda zona che si scambi separatamente. Chiede €1.100–2.000/m², con il segmento di massa a €1.100–1.500 e la parte alta della fascia riservata alle residenze premium in prima linea. Gli acquirenti sono soprattutto kosovari e della diaspora, e un appartamento si vende in circa tre mesi e mezzo. Il prezzo di riferimento statale è 49.200 lek/m², ed è su quello che si calcolano notaio e imposte, non sul prezzo pattuito.',
    pl: 'Nadmorskie centrum Shëngjin jest w praktyce całym rynkiem Shëngjin — miasto nie ma drugiej dzielnicy, która handlowałaby się osobno. Żąda €1100–2000/m², gdzie segment masowy to €1100–1500, a górna część przedziału przypada rezydencjom premium w pierwszej linii. Kupują głównie Kosowianie i diaspora, a mieszkanie sprzedaje się w około trzy do trzech i pół miesiąca. Państwowa cena referencyjna to 49 200 lek/m² i to od niej liczone są koszty notarialne i podatkowe, a nie od uzgodnionej ceny.',
  },
}

/** Merge the authored en/ru with these, for one write per document. */
export function withTranslations(
  base: Record<string, EditorialCopy>,
  translations: Translations,
): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {}
  for (const [slug, copy] of Object.entries(base)) {
    out[slug] = {en: copy.en, ru: copy.ru, ...(translations[slug] ?? {})}
  }
  return out
}
