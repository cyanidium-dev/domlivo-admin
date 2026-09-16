/**
 * FAQ for the Durrës district pages (addDurresDistrictFaq.ts), 2026-09-15.
 *
 * Every figure comes from the zone's own research record — `zone-metrics-seed.json`
 * and the sourced editorial copy in `zoneEditorialCopy.ts` / `district.description`
 * — the same material the price table and the "about" block on each page are
 * built from, so the answers cannot contradict the page. Nothing is estimated.
 *
 * Shape follows the Tirana district FAQs: price, who the zone suits, what to
 * check. Answers are self-contained 35–75-word passages, written to be quoted
 * without the page around them. Albanian is pending native review (CONTENT-OPS).
 */

export type L6 = {en: string; sq: string; ru: string; uk: string; it: string; pl: string}
export type DistrictFaq = {title: L6; items: Array<{q: L6; a: L6}>}

export const FAQ_SUBTITLE: L6 = {
  en: 'Prices, who the area suits and what to check — short answers from the DomLivo research base.',
  it: 'Prezzi, a chi si adatta la zona e cosa verificare — risposte brevi dalla base di ricerca DomLivo.',
  pl: 'Ceny, dla kogo jest ta okolica i co sprawdzić — krótkie odpowiedzi z bazy badawczej DomLivo.',
  ru: 'Цены, кому подходит район и что проверить — короткие ответы из исследовательской базы DomLivo.',
  sq: 'Çmimet, kujt i përshtatet zona dhe çfarë duhet kontrolluar — përgjigje të shkurtra nga baza kërkimore e DomLivo.',
  uk: 'Ціни, кому підходить район і що перевірити — короткі відповіді з дослідницької бази DomLivo.',
}

export const DURRES_DISTRICT_FAQ: Record<string, DistrictFaq> = {
  'city-center-durres': {
    title: {
      en: 'Durrës city centre: frequently asked questions',
      sq: 'Qendra e Durrësit: pyetje të shpeshta',
      ru: 'Центр Дурреса: частые вопросы',
      uk: 'Центр Дурреса: часті запитання',
      it: 'Centro di Durazzo: domande frequenti',
      pl: 'Centrum Durrës: najczęstsze pytania',
    },
    items: [
      {
        q: {
          en: 'How much does an apartment cost in Durrës city centre?',
          sq: 'Sa kushton një apartament në qendër të Durrësit?',
          ru: 'Сколько стоит квартира в центре Дурреса?',
          uk: 'Скільки коштує квартира в центрі Дурреса?',
          it: 'Quanto costa un appartamento nel centro di Durazzo?',
          pl: 'Ile kosztuje mieszkanie w centrum Durrës?',
        },
        a: {
          en: "Durrës city centre asks about €1,900–2,800 per square metre in 2026, the top of the city's range. The band covers the whole seafront strip of Currila, Vollga and Taulantia rather than one street, and penthouses there go above €3,000/m². Currila alone has risen 70–90% since 2019, according to the zone research.",
          sq: 'Qendra e Durrësit kërkon rreth 1.900–2.800 € për metër katror në vitin 2026, maja e çmimeve të qytetit. Brezi përfshin gjithë vijën bregdetare të Currilës, Vollgës dhe Taulantias, jo një rrugë të vetme, dhe penthouse-t aty kalojnë 3.000 €/m². Vetëm Currila është rritur 70–90% që nga viti 2019, sipas kërkimit për zonën.',
          ru: 'Центр Дурреса просит около €1 900–2 800 за квадратный метр в 2026 году — это верх городского диапазона. Он охватывает всю прибрежную полосу Куррилы, Воллги и Таулантии, а не одну улицу, а пентхаусы там стоят дороже €3 000/м². Одна только Куррила подорожала на 70–90% с 2019 года, по данным исследования зоны.',
          uk: 'Центр Дурреса просить близько €1 900–2 800 за квадратний метр у 2026 році — це верх міського діапазону. Він охоплює всю прибережну смугу Курріли, Воллги й Таулантії, а не одну вулицю, а пентхауси там коштують понад €3 000/м². Сама лише Курріла подорожчала на 70–90% з 2019 року, за даними дослідження зони.',
          it: "Il centro di Durazzo chiede circa 1.900–2.800 € al metro quadro nel 2026, il livello più alto della città. La fascia copre tutto il lungomare di Currila, Vollga e Taulantia, non una sola strada, e gli attici superano i 3.000 €/m². La sola Currila è salita del 70–90% dal 2019, secondo la ricerca sulla zona.",
          pl: 'Centrum Durrës to w 2026 roku około 1900–2800 € za metr kwadratowy, czyli górna granica cen w mieście. Przedział obejmuje cały nadmorski pas Currila, Vollga i Taulantia, a nie jedną ulicę, a penthouse’y przekraczają tam 3000 €/m². Sama Currila zdrożała o 70–90% od 2019 roku, według badania strefy.',
        },
      },
      {
        q: {
          en: 'Who buys in the centre of Durrës?',
          sq: 'Kush blen në qendër të Durrësit?',
          ru: 'Кто покупает жильё в центре Дурреса?',
          uk: 'Хто купує житло в центрі Дурреса?',
          it: 'Chi compra casa nel centro di Durazzo?',
          pl: 'Kto kupuje mieszkania w centrum Durrës?',
        },
        a: {
          en: 'Mostly local families and Tirana commuters rather than seasonal investors. That is why the centre holds its price out of season: shops, services and the promenade work all year, so an apartment here lives as a home first and a holiday let second. Buyers chasing summer rental income usually look at the beach strips south of the city instead.',
          sq: 'Kryesisht familje vendase dhe njerëz që punojnë në Tiranë, jo investitorë sezonalë. Prandaj qendra e mban çmimin edhe jashtë sezonit: dyqanet, shërbimet dhe shëtitorja punojnë gjithë vitin, kështu që apartamenti këtu është në radhë të parë shtëpi dhe vetëm pastaj qira pushimesh. Kush kërkon të ardhura nga qiraja verore zakonisht shikon plazhet në jug të qytetit.',
          ru: 'В основном местные семьи и те, кто ездит на работу в Тирану, а не сезонные инвесторы. Поэтому центр держит цену и вне сезона: магазины, сервисы и набережная работают круглый год, и квартира здесь — прежде всего жильё, а уже потом сдача отдыхающим. Тем, кто рассчитывает на летнюю аренду, обычно больше подходят пляжные зоны к югу от города.',
          uk: 'Здебільшого місцеві родини та ті, хто їздить на роботу до Тирани, а не сезонні інвестори. Тому центр тримає ціну й поза сезоном: магазини, сервіси та набережна працюють цілий рік, і квартира тут — насамперед житло, а вже потім оренда для відпочивальників. Тим, хто розраховує на літню оренду, зазвичай більше підходять пляжні зони на південь від міста.',
          it: "Soprattutto famiglie locali e pendolari che lavorano a Tirana, più che investitori stagionali. Per questo il centro tiene il prezzo anche fuori stagione: negozi, servizi e lungomare funzionano tutto l'anno, quindi un appartamento qui è prima una casa e poi un affitto per le vacanze. Chi punta sull'affitto estivo di solito guarda alle spiagge a sud della città.",
          pl: 'Głównie miejscowe rodziny i osoby dojeżdżające do pracy w Tiranie, a nie inwestorzy sezonowi. Dlatego centrum trzyma cenę także poza sezonem: sklepy, usługi i promenada działają cały rok, więc mieszkanie jest tu przede wszystkim domem, a dopiero potem lokalem na wakacyjny najem. Kto liczy na letni najem, zwykle wybiera plaże na południe od miasta.',
        },
      },
      {
        q: {
          en: 'What should I check before buying in central Durrës?',
          sq: 'Çfarë duhet të kontrolloj para se të blej në qendër të Durrësit?',
          ru: 'Что проверить перед покупкой в центре Дурреса?',
          uk: 'Що перевірити перед купівлею в центрі Дурреса?',
          it: 'Cosa verificare prima di comprare nel centro di Durazzo?',
          pl: 'Co sprawdzić przed zakupem w centrum Durrës?',
        },
        a: {
          en: 'The state reference price. Notary and tax costs are calculated from it rather than from the price you pay whenever it is the higher of the two. Durrës still applies a single city rate; a 2025 draft that would have split the city into 13 zones and raised the port zone to 200,000 lek per square metre has not been approved. Ask your notary which value applies to the exact address before you agree the final price.',
          sq: 'Çmimin shtetëror të referencës. Kostot e noterit dhe taksat llogariten prej tij, jo nga çmimi që paguani, sa herë që ai është më i lartë. Durrësi ende zbaton një tarifë të vetme për qytetin; drafti i vitit 2025 që do ta ndante qytetin në 13 zona dhe do ta çonte zonën e portit në 200.000 lekë për metër katror nuk është miratuar. Pyesni noterin cila vlerë zbatohet për adresën e saktë para se të bini dakord për çmimin përfundimtar.',
          ru: 'Государственную справочную цену. Нотариальные расходы и налоги считаются от неё, а не от цены, которую вы платите, если она выше. В Дурресе до сих пор действует единая городская ставка; проект 2025 года, который разделил бы город на 13 зон и поднял портовую зону до 200 000 леков за квадратный метр, не утверждён. Спросите нотариуса, какое значение действует для конкретного адреса, до того как согласуете окончательную цену.',
          uk: 'Державну довідкову ціну. Нотаріальні витрати й податки рахуються від неї, а не від ціни, яку ви платите, якщо вона вища. У Дурресі досі діє єдина міська ставка; проєкт 2025 року, який поділив би місто на 13 зон і підняв портову зону до 200 000 леків за квадратний метр, не затверджено. Спитайте нотаріуса, яке значення діє для конкретної адреси, до того як погодите остаточну ціну.',
          it: "Il prezzo di riferimento statale. Notaio e imposte si calcolano su quello, invece che sul prezzo pagato, quando è il più alto dei due. Durazzo applica ancora un’unica tariffa cittadina; la bozza del 2025 che avrebbe diviso la città in 13 zone portando la zona portuale a 200.000 lek al metro quadro non è stata approvata. Chiedete al notaio quale valore vale per l’indirizzo esatto prima di concordare il prezzo finale.",
          pl: 'Państwową cenę referencyjną. Koszty notarialne i podatki liczy się od niej, a nie od ceny, którą płacisz, jeśli jest wyższa. W Durrës wciąż obowiązuje jedna stawka dla całego miasta; projekt z 2025 roku, który podzieliłby miasto na 13 stref i podniósłby strefę portową do 200 000 leków za metr kwadratowy, nie został zatwierdzony. Zapytaj notariusza, jaka wartość obowiązuje dla konkretnego adresu, zanim uzgodnisz ostateczną cenę.',
        },
      },
    ],
  },

  plazh: {
    title: {
      en: 'Plazh, Durrës: frequently asked questions',
      sq: 'Plazh, Durrës: pyetje të shpeshta',
      ru: 'Пляж, Дуррес: частые вопросы',
      uk: 'Пляж, Дуррес: часті запитання',
      it: 'Plazh, Durazzo: domande frequenti',
      pl: 'Plazh, Durrës: najczęstsze pytania',
    },
    items: [
      {
        q: {
          en: 'How much does an apartment by the sea in Plazh, Durrës cost?',
          sq: 'Sa kushton një apartament buzë detit në Plazh, Durrës?',
          ru: 'Сколько стоит квартира у моря в районе Пляж, Дуррес?',
          uk: 'Скільки коштує квартира біля моря в районі Пляж, Дуррес?',
          it: 'Quanto costa un appartamento vicino al mare a Plazh, Durazzo?',
          pl: 'Ile kosztuje mieszkanie nad morzem w Plazh w Durrës?',
        },
        a: {
          en: 'Plazh asks about €1,200–1,700 per square metre in 2026, up as much as 21% year on year from a €1,000–1,300 band. It is the mass beach segment of Durrës — the strip most buyers mean by "an apartment by the sea in Durrës" — with direct beach access and dense mid-rise buildings.',
          sq: 'Plazhi kërkon rreth 1.200–1.700 € për metër katror në vitin 2026, deri në 21% më shumë se një vit më parë, nga një brez prej 1.000–1.300 €. Është segmenti masiv i plazhit në Durrës — vija që shumica e blerësve kanë parasysh kur thonë "apartament buzë detit në Durrës" — me dalje direkte në plazh dhe pallate të dendura me lartësi mesatare.',
          ru: 'Пляж просит около €1 200–1 700 за квадратный метр в 2026 году — до 21% больше, чем годом раньше, когда диапазон был €1 000–1 300. Это массовый пляжный сегмент Дурреса, та самая полоса, которую большинство покупателей имеют в виду под «квартирой у моря в Дурресе»: прямой выход к пляжу и плотная застройка средней этажности.',
          uk: 'Пляж просить близько €1 200–1 700 за квадратний метр у 2026 році — до 21% більше, ніж роком раніше, коли діапазон був €1 000–1 300. Це масовий пляжний сегмент Дурреса, та сама смуга, яку більшість покупців мають на увазі під «квартирою біля моря в Дурресі»: прямий вихід до пляжу й щільна забудова середньої поверховості.',
          it: 'Plazh chiede circa 1.200–1.700 € al metro quadro nel 2026, fino al 21% in più su base annua rispetto a una fascia di 1.000–1.300 €. È il segmento balneare di massa di Durazzo — la striscia che la maggior parte degli acquirenti intende con "appartamento sul mare a Durazzo" — con accesso diretto alla spiaggia e palazzi fitti di media altezza.',
          pl: 'Plazh to w 2026 roku około 1200–1700 € za metr kwadratowy, nawet o 21% więcej niż rok wcześniej, gdy przedział wynosił 1000–1300 €. To masowy plażowy segment Durrës — pas, o którym myśli większość kupujących, mówiąc „mieszkanie nad morzem w Durrës” — z bezpośrednim dostępem do plaży i gęstą, średniowysoką zabudową.',
        },
      },
      {
        q: {
          en: 'Is Plazh a good place to buy for renting out?',
          sq: 'A është Plazhi vend i mirë për të blerë dhe dhënë me qira?',
          ru: 'Подходит ли Пляж для покупки под сдачу в аренду?',
          uk: 'Чи підходить Пляж для купівлі під здачу в оренду?',
          it: "Plazh conviene per comprare e affittare?",
          pl: 'Czy Plazh to dobre miejsce na zakup pod najem?',
        },
        a: {
          en: 'It has a real season, driven by domestic and diaspora holidaymakers rather than foreign tourists, and the district keeps shops, cafés and transport running all year, so flats also suit permanent living. Because much of the stock is alike, rental demand follows the same few things as price: distance to the sand and the floor.',
          sq: 'Ka një sezon të vërtetë, të shtyrë nga pushuesit vendas dhe nga diaspora më shumë se nga turistët e huaj, dhe zona i mban dyqanet, kafenetë dhe transportin aktive gjithë vitin, kështu që apartamentet i shërbejnë edhe banimit të përhershëm. Meqë shumica e ndërtimeve ngjajnë, kërkesa për qira ndjek të njëjtat gjëra si çmimi: largësia nga rëra dhe kati.',
          ru: 'Здесь настоящий сезон, который делают внутренние туристы и диаспора, а не иностранцы, а магазины, кафе и транспорт в районе работают круглый год, поэтому квартиры подходят и для постоянной жизни. Поскольку жильё в основном однотипное, спрос на аренду зависит от тех же вещей, что и цена: расстояния до песка и этажа.',
          uk: 'Тут справжній сезон, який роблять внутрішні туристи й діаспора, а не іноземці, а магазини, кафе й транспорт у районі працюють цілий рік, тож квартири підходять і для постійного життя. Оскільки житло переважно однотипне, попит на оренду залежить від тих самих речей, що й ціна: відстані до піску та поверху.',
          it: "Ha una vera stagione, trainata da vacanzieri albanesi e della diaspora più che da turisti stranieri, e il quartiere tiene aperti negozi, bar e trasporti tutto l'anno, quindi gli appartamenti vanno bene anche per viverci stabilmente. Poiché gran parte degli edifici si somiglia, la domanda di affitto segue le stesse cose del prezzo: distanza dalla sabbia e piano.",
          pl: 'Ma prawdziwy sezon, napędzany przez krajowych wczasowiczów i diasporę, a nie zagranicznych turystów, a sklepy, kawiarnie i transport działają tu cały rok, więc mieszkania nadają się też do stałego życia. Ponieważ zabudowa jest w dużej mierze podobna, popyt na najem zależy od tego samego co cena: odległości od piasku i piętra.',
        },
      },
      {
        q: {
          en: 'What matters most when comparing flats in Plazh?',
          sq: 'Çfarë ka më shumë rëndësi kur krahasoni apartamente në Plazh?',
          ru: 'Что важнее всего при сравнении квартир в районе Пляж?',
          uk: 'Що найважливіше при порівнянні квартир у районі Пляж?',
          it: 'Cosa conta di più nel confrontare appartamenti a Plazh?',
          pl: 'Co jest najważniejsze przy porównywaniu mieszkań w Plazh?',
        },
        a: {
          en: 'Metres to the sand, not finish quality. The stock is dense and similar, so two apartments at the same price per square metre can differ a lot in value if one is on the front and the other three streets back. Compare the exact distance and the floor first, then the price per square metre.',
          sq: 'Metrat deri te rëra, jo cilësia e përfundimit. Ndërtimet janë të dendura dhe të ngjashme, ndaj dy apartamente me të njëjtin çmim për metër katror mund të kenë vlerë shumë të ndryshme nëse njëri është në vijën e parë dhe tjetri tri rrugë më brenda. Krahasoni fillimisht largësinë e saktë dhe katin, pastaj çmimin për metër katror.',
          ru: 'Метры до песка, а не качество отделки. Застройка плотная и однотипная, поэтому две квартиры с одинаковой ценой за квадратный метр могут сильно отличаться по реальной стоимости, если одна стоит у самого моря, а другая — через три улицы. Сначала сравните точное расстояние и этаж, а уже потом цену за метр.',
          uk: 'Метри до піску, а не якість оздоблення. Забудова щільна й однотипна, тому дві квартири з однаковою ціною за квадратний метр можуть сильно відрізнятися за реальною вартістю, якщо одна стоїть біля самого моря, а інша — за три вулиці. Спершу порівняйте точну відстань і поверх, а вже потім ціну за метр.',
          it: "I metri dalla sabbia, non la qualità delle finiture. Gli edifici sono fitti e simili, quindi due appartamenti allo stesso prezzo al metro quadro possono valere molto diversamente se uno è in prima fila e l'altro tre strade più indietro. Confronta prima la distanza esatta e il piano, poi il prezzo al metro quadro.",
          pl: 'Metry do piasku, a nie jakość wykończenia. Zabudowa jest gęsta i podobna, więc dwa mieszkania o tej samej cenie za metr mogą mieć bardzo różną wartość, jeśli jedno stoi przy samym morzu, a drugie trzy ulice dalej. Najpierw porównaj dokładną odległość i piętro, a dopiero potem cenę za metr kwadratowy.',
        },
      },
    ],
  },

  'golem-durres': {
    title: {
      en: 'Golem, Durrës: frequently asked questions',
      sq: 'Golem, Durrës: pyetje të shpeshta',
      ru: 'Голем, Дуррес: частые вопросы',
      uk: 'Голем, Дуррес: часті запитання',
      it: 'Golem, Durazzo: domande frequenti',
      pl: 'Golem, Durrës: najczęstsze pytania',
    },
    items: [
      {
        q: {
          en: 'How much do apartments cost in Golem, Durrës?',
          sq: 'Sa kushtojnë apartamentet në Golem, Durrës?',
          ru: 'Сколько стоят квартиры в Големе, Дуррес?',
          uk: 'Скільки коштують квартири в Големі, Дуррес?',
          it: 'Quanto costano gli appartamenti a Golem, Durazzo?',
          pl: 'Ile kosztują mieszkania w Golem w Durrës?',
        },
        a: {
          en: 'Golem asks about €1,100–1,500 per square metre in 2026, rising 8–15% year on year — cheaper than the first line and cheaper than Qerret further down the same beach. The first line itself prices separately, at roughly €2,000–2,500/m². The state reference price for the zone is €56,500 per unit.',
          sq: 'Golemi kërkon rreth 1.100–1.500 € për metër katror në vitin 2026, me rritje 8–15% në vit — më lirë se vija e parë dhe më lirë se Qerreti më poshtë në të njëjtin plazh. Vetë vija e parë ka çmim më vete, rreth 2.000–2.500 €/m². Çmimi shtetëror i referencës për zonën është 56.500 € për njësi.',
          ru: 'Голем просит около €1 100–1 500 за квадратный метр в 2026 году при росте на 8–15% в год — дешевле первой линии и дешевле Керрета дальше по тому же пляжу. Сама первая линия оценивается отдельно, примерно в €2 000–2 500/м². Государственная справочная цена для зоны — €56 500 за объект.',
          uk: 'Голем просить близько €1 100–1 500 за квадратний метр у 2026 році при зростанні на 8–15% на рік — дешевше за першу лінію і дешевше за Керрет далі тим самим пляжем. Сама перша лінія оцінюється окремо, приблизно в €2 000–2 500/м². Державна довідкова ціна для зони — €56 500 за об’єкт.',
          it: 'Golem chiede circa 1.100–1.500 € al metro quadro nel 2026, in crescita dell’8–15% annuo — meno della prima fila e meno di Qerret, più avanti sulla stessa spiaggia. La prima fila ha prezzi a parte, intorno a 2.000–2.500 €/m². Il prezzo di riferimento statale per la zona è di 56.500 € per unità.',
          pl: 'Golem to w 2026 roku około 1100–1500 € za metr kwadratowy przy wzroście o 8–15% rocznie — taniej niż pierwsza linia i taniej niż Qerret dalej na tej samej plaży. Sama pierwsza linia ma osobne ceny, około 2000–2500 €/m². Państwowa cena referencyjna dla strefy wynosi 56 500 € za lokal.',
        },
      },
      {
        q: {
          en: 'What kind of area is Golem?',
          sq: 'Çfarë lloj zone është Golemi?',
          ru: 'Что за район Голем?',
          uk: 'Що за район Голем?',
          it: 'Che tipo di zona è Golem?',
          pl: 'Jaką okolicą jest Golem?',
        },
        a: {
          en: 'Golem is the second and third line behind the long beach south of Durrës, past Shkëmbi i Kavajës and before Qerret. It suits buyers who want a flat near the sea for holidays or seasonal letting at a lower entry price than the first line, on the same stretch of sand as the dearer zones.',
          sq: 'Golemi është vija e dytë dhe e tretë pas plazhit të gjatë në jug të Durrësit, pas Shkëmbit të Kavajës dhe para Qerretit. U përshtatet blerësve që duan një apartament pranë detit për pushime ose qira sezonale me një çmim hyrjeje më të ulët se vija e parë, në të njëjtin plazh me zonat më të shtrenjta.',
          ru: 'Голем — это вторая и третья линия за длинным пляжем к югу от Дурреса, после Шкемби-и-Каваяс и перед Керретом. Он подходит тем, кто хочет квартиру у моря для отдыха или сезонной сдачи с более низким порогом входа, чем на первой линии, на том же песке, что и более дорогие зоны.',
          uk: 'Голем — це друга й третя лінія за довгим пляжем на південь від Дурреса, після Шкембі-і-Каваяс і перед Керретом. Він підходить тим, хто хоче квартиру біля моря для відпочинку чи сезонної оренди з нижчим порогом входу, ніж на першій лінії, на тому самому піску, що й дорожчі зони.',
          it: 'Golem è la seconda e terza fila dietro la lunga spiaggia a sud di Durazzo, dopo Shkëmbi i Kavajës e prima di Qerret. È adatta a chi vuole un appartamento vicino al mare per le vacanze o per l’affitto stagionale con un prezzo d’ingresso più basso della prima fila, sulla stessa sabbia delle zone più care.',
          pl: 'Golem to druga i trzecia linia za długą plażą na południe od Durrës, za Shkëmbi i Kavajës i przed Qerret. Pasuje kupującym, którzy chcą mieszkania blisko morza na wakacje lub najem sezonowy za niższą cenę wejścia niż na pierwszej linii, na tym samym piasku co droższe strefy.',
        },
      },
      {
        q: {
          en: 'What should I check before buying in Golem?',
          sq: 'Çfarë duhet të kontrolloj para se të blej në Golem?',
          ru: 'Что проверить перед покупкой в Големе?',
          uk: 'Що перевірити перед купівлею в Големі?',
          it: 'Cosa verificare prima di comprare a Golem?',
          pl: 'Co sprawdzić przed zakupem w Golem?',
        },
        a: {
          en: "The beach itself. Golem's standing problem is sewage discharging onto the sand. It has not stopped prices rising, but it is the one thing worth checking on the ground, in season, before you buy to rent out. Also confirm the reference price of €56,500 per unit, because notary and tax costs are calculated from it.",
          sq: 'Vetë plazhin. Problemi i vazhdueshëm i Golemit janë ujërat e zeza që shkarkohen në rërë. Kjo nuk i ka ndalur çmimet, por është e vetmja gjë që ia vlen ta kontrolloni në vend, gjatë sezonit, para se të blini për ta dhënë me qira. Konfirmoni edhe çmimin e referencës prej 56.500 € për njësi, sepse kostot e noterit dhe taksat llogariten mbi të.',
          ru: 'Сам пляж. Хроническая проблема Голема — сброс канализации на песок. Рост цен это не остановило, но это единственное, что стоит проверить на месте и в сезон, прежде чем покупать под сдачу. Уточните также справочную цену €56 500 за объект: от неё считаются нотариальные расходы и налоги.',
          uk: 'Сам пляж. Хронічна проблема Голема — скидання каналізації на пісок. Зростання цін це не зупинило, але це єдине, що варто перевірити на місці й у сезон, перш ніж купувати під оренду. Уточніть також довідкову ціну €56 500 за об’єкт: від неї рахуються нотаріальні витрати й податки.',
          it: 'La spiaggia stessa. Il problema cronico di Golem sono gli scarichi fognari che finiscono sulla sabbia. Non ha fermato la crescita dei prezzi, ma è l’unica cosa da verificare sul posto, in stagione, prima di comprare per affittare. Conferma anche il prezzo di riferimento di 56.500 € per unità, perché costi notarili e imposte si calcolano su quello.',
          pl: 'Samą plażę. Stałym problemem Golem jest zrzut ścieków na piasek. Nie zatrzymało to wzrostu cen, ale to jedyna rzecz, którą warto sprawdzić na miejscu, w sezonie, zanim kupisz pod najem. Potwierdź też cenę referencyjną 56 500 € za lokal, bo od niej liczy się koszty notarialne i podatki.',
        },
      },
    ],
  },

  'shkembi-durres': {
    title: {
      en: 'Shkëmbi i Kavajës: frequently asked questions',
      sq: 'Shkëmbi i Kavajës: pyetje të shpeshta',
      ru: 'Шкемби-и-Каваяс: частые вопросы',
      uk: 'Шкембі-і-Каваяс: часті запитання',
      it: 'Shkëmbi i Kavajës: domande frequenti',
      pl: 'Shkëmbi i Kavajës: najczęstsze pytania',
    },
    items: [
      {
        q: {
          en: 'How much does an apartment cost in Shkëmbi i Kavajës?',
          sq: 'Sa kushton një apartament në Shkëmbin e Kavajës?',
          ru: 'Сколько стоит квартира в Шкемби-и-Каваяс?',
          uk: 'Скільки коштує квартира в Шкембі-і-Каваяс?',
          it: 'Quanto costa un appartamento a Shkëmbi i Kavajës?',
          pl: 'Ile kosztuje mieszkanie w Shkëmbi i Kavajës?',
        },
        a: {
          en: "It depends on the building's age more than anywhere else in Durrës. New builds ask about €1,200–2,000 per square metre, older apartments trade at €450–800/m², and the zone median lands around €1,110/m². The area lies between Plepa and Golem, roughly 150 metres from the promenade.",
          sq: 'Këtu çmimi varet nga mosha e ndërtesës më shumë se kudo tjetër në Durrës. Ndërtimet e reja kërkojnë rreth 1.200–2.000 € për metër katror, apartamentet e vjetra shiten me 450–800 €/m², dhe mediana e zonës bie rreth 1.110 €/m². Zona shtrihet mes Plepës dhe Golemit, rreth 150 metra nga shëtitorja.',
          ru: 'Здесь цена зависит от возраста дома сильнее, чем где-либо ещё в Дурресе. Новостройки просят около €1 200–2 000 за квадратный метр, старые квартиры продаются по €450–800/м², а медиана по зоне — около €1 110/м². Район лежит между Плепой и Големом, примерно в 150 метрах от набережной.',
          uk: 'Тут ціна залежить від віку будинку сильніше, ніж будь-де ще в Дурресі. Новобудови просять близько €1 200–2 000 за квадратний метр, старі квартири продаються по €450–800/м², а медіана по зоні — близько €1 110/м². Район лежить між Плепою і Големом, приблизно за 150 метрів від набережної.',
          it: "Qui il prezzo dipende dall'età dell'edificio più che in qualsiasi altra zona di Durazzo. Le nuove costruzioni chiedono circa 1.200–2.000 € al metro quadro, gli appartamenti datati si vendono a 450–800 €/m² e la mediana della zona è di circa 1.110 €/m². L'area si trova tra Plepa e Golem, a circa 150 metri dal lungomare.",
          pl: 'Tu cena zależy od wieku budynku bardziej niż gdziekolwiek indziej w Durrës. Nowe budynki to około 1200–2000 € za metr kwadratowy, starsze mieszkania sprzedają się po 450–800 €/m², a mediana strefy wynosi około 1110 €/m². Okolica leży między Plepą a Golem, około 150 metrów od promenady.',
        },
      },
      {
        q: {
          en: 'Why are some flats in Shkëmbi i Kavajës so cheap?',
          sq: 'Pse disa apartamente në Shkëmbin e Kavajës janë kaq të lira?',
          ru: 'Почему некоторые квартиры в Шкемби-и-Каваяс такие дешёвые?',
          uk: 'Чому деякі квартири в Шкембі-і-Каваяс такі дешеві?',
          it: 'Perché alcuni appartamenti a Shkëmbi i Kavajës costano così poco?',
          pl: 'Dlaczego niektóre mieszkania w Shkëmbi i Kavajës są tak tanie?',
        },
        a: {
          en: 'Because the zone holds two markets under one name. The cheap half is cheap for building age and condition, not for location: older blocks sit on the same stretch of coast as the new ones. A low price per square metre here is often an old structure rather than a bargain, which is why the zone average says little.',
          sq: 'Sepse zona mban dy tregje nën një emër. Gjysma e lirë është e lirë për shkak të moshës dhe gjendjes së ndërtesës, jo të vendndodhjes: pallatet e vjetra ndodhen në të njëjtin bregdet me të rejat. Një çmim i ulët për metër katror këtu shpesh do të thotë strukturë e vjetër dhe jo okazion, prandaj mesatarja e zonës tregon pak.',
          ru: 'Потому что под одним названием здесь два рынка. Дешёвая половина дешева из-за возраста и состояния домов, а не из-за расположения: старые дома стоят на том же отрезке побережья, что и новые. Низкая цена за метр здесь часто означает старую конструкцию, а не выгодную сделку, поэтому средняя по зоне говорит мало.',
          uk: 'Бо під однією назвою тут два ринки. Дешева половина дешева через вік і стан будинків, а не через розташування: старі будинки стоять на тому самому відрізку узбережжя, що й нові. Низька ціна за метр тут часто означає стару конструкцію, а не вигідну угоду, тому середня по зоні мало що каже.',
          it: "Perché sotto un unico nome convivono due mercati. La metà economica costa poco per età e condizioni dell'edificio, non per posizione: i palazzi vecchi stanno sullo stesso tratto di costa di quelli nuovi. Un prezzo basso al metro quadro qui spesso indica una struttura datata più che un affare, ed è per questo che la media della zona dice poco.",
          pl: 'Bo pod jedną nazwą działają tu dwa rynki. Tańsza połowa jest tania ze względu na wiek i stan budynków, a nie lokalizację: stare bloki stoją na tym samym odcinku wybrzeża co nowe. Niska cena za metr oznacza tu często starą konstrukcję, a nie okazję, dlatego średnia dla strefy mówi niewiele.',
        },
      },
      {
        q: {
          en: 'What should I check on an older flat in Shkëmbi i Kavajës?',
          sq: 'Çfarë duhet të kontrolloj për një apartament të vjetër në Shkëmbin e Kavajës?',
          ru: 'Что проверить в старой квартире в Шкемби-и-Каваяс?',
          uk: 'Що перевірити в старій квартирі в Шкембі-і-Каваяс?',
          it: 'Cosa verificare su un appartamento datato a Shkëmbi i Kavajës?',
          pl: 'Co sprawdzić w starszym mieszkaniu w Shkëmbi i Kavajës?',
        },
        a: {
          en: 'The construction year, the state of the structure and the legal file. With resale stock trading from €450 per square metre, the difference between a good buy and a costly one is usually in the building, not the view. Ask for the ownership certificate and any legalisation papers before you start negotiating the price.',
          sq: 'Vitin e ndërtimit, gjendjen e strukturës dhe dosjen ligjore. Me apartamente të vjetra që shiten nga 450 € për metër katror, ndryshimi mes një blerjeje të mirë dhe një të kushtueshme zakonisht qëndron te ndërtesa, jo te pamja. Kërkoni certifikatën e pronësisë dhe çdo dokument legalizimi para se të nisni negocimin e çmimit.',
          ru: 'Год постройки, состояние конструкции и юридические документы. Когда вторичное жильё продаётся от €450 за квадратный метр, разница между удачной покупкой и дорогой ошибкой обычно в самом доме, а не в виде из окна. Запросите свидетельство о собственности и документы о легализации до того, как начнёте торговаться.',
          uk: 'Рік будівництва, стан конструкції та юридичні документи. Коли вторинне житло продається від €450 за квадратний метр, різниця між вдалою покупкою і дорогою помилкою зазвичай у самому будинку, а не у виді з вікна. Попросіть свідоцтво про власність і документи про легалізацію до того, як почнете торгуватися.',
          it: "L'anno di costruzione, lo stato della struttura e la documentazione legale. Con l'usato che si vende da 450 € al metro quadro, la differenza tra un buon acquisto e uno costoso di solito sta nell'edificio, non nella vista. Chiedi il certificato di proprietà e gli eventuali documenti di legalizzazione prima di iniziare a trattare il prezzo.",
          pl: 'Rok budowy, stan konstrukcji i dokumenty prawne. Gdy mieszkania z rynku wtórnego sprzedają się od 450 € za metr, różnica między dobrym zakupem a kosztownym zwykle tkwi w budynku, a nie w widoku. Poproś o zaświadczenie o własności i ewentualne dokumenty legalizacyjne, zanim zaczniesz negocjować cenę.',
        },
      },
    ],
  },

  'plepa-durres': {
    title: {
      en: 'Plepa, Durrës: frequently asked questions',
      sq: 'Plepa, Durrës: pyetje të shpeshta',
      ru: 'Плепа, Дуррес: частые вопросы',
      uk: 'Плепа, Дуррес: часті запитання',
      it: 'Plepa, Durazzo: domande frequenti',
      pl: 'Plepa, Durrës: najczęstsze pytania',
    },
    items: [
      {
        q: {
          en: 'How much do apartments cost in Plepa, Durrës?',
          sq: 'Sa kushtojnë apartamentet në Plepa, Durrës?',
          ru: 'Сколько стоят квартиры в Плепе, Дуррес?',
          uk: 'Скільки коштують квартири в Плепі, Дуррес?',
          it: 'Quanto costano gli appartamenti a Plepa, Durazzo?',
          pl: 'Ile kosztują mieszkania w Plepie w Durrës?',
        },
        a: {
          en: 'Plepa prices as two segments. Ordinary stock asks about €1,000–1,270 per square metre, while anything with a real sea view asks €1,800–2,160/m². A single headline range for the district — €1,000–2,160 across 159 listings in the second half of 2026 — hides that split entirely.',
          sq: 'Plepa ka dy segmente çmimesh. Ndërtimet e zakonshme kërkojnë rreth 1.000–1.270 € për metër katror, ndërsa çdo gjë me pamje të vërtetë nga deti kërkon 1.800–2.160 €/m². Një brez i vetëm për gjithë zonën — 1.000–2.160 € mbi 159 njoftime në gjysmën e dytë të vitit 2026 — e fsheh plotësisht këtë ndarje.',
          ru: 'В Плепе два ценовых сегмента. Обычное жильё просит около €1 000–1 270 за квадратный метр, а всё с настоящим видом на море — €1 800–2 160/м². Единый диапазон по району — €1 000–2 160 по 159 объявлениям во втором полугодии 2026 года — это разделение полностью скрывает.',
          uk: 'У Плепі два цінові сегменти. Звичайне житло просить близько €1 000–1 270 за квадратний метр, а все зі справжнім видом на море — €1 800–2 160/м². Єдиний діапазон по району — €1 000–2 160 за 159 оголошеннями в другому півріччі 2026 року — цей поділ повністю приховує.',
          it: 'Plepa ha due segmenti di prezzo. Gli immobili ordinari chiedono circa 1.000–1.270 € al metro quadro, mentre tutto ciò che ha una vera vista mare chiede 1.800–2.160 €/m². Un’unica fascia per il quartiere — 1.000–2.160 € su 159 annunci nel secondo semestre 2026 — nasconde del tutto questa divisione.',
          pl: 'Plepa ma dwa segmenty cenowe. Zwykłe mieszkania to około 1000–1270 € za metr kwadratowy, a wszystko z prawdziwym widokiem na morze — 1800–2160 €/m². Jeden przedział dla całej okolicy — 1000–2160 € na podstawie 159 ogłoszeń w drugiej połowie 2026 roku — całkowicie ukrywa ten podział.',
        },
      },
      {
        q: {
          en: 'What is Plepa like to live in?',
          sq: 'Si është jeta në Plepa?',
          ru: 'Каково жить в Плепе?',
          uk: 'Як живеться в Плепі?',
          it: 'Com’è vivere a Plepa?',
          pl: 'Jak się mieszka w Plepie?',
        },
        a: {
          en: "Plepa is a quiet residential part of Durrës with established infrastructure rather than a resort strip. That makes it a practical choice for living year-round or for longer lets, and a calmer alternative to the busy beach at Plazh. The sea-view blocks on the front are where the district's higher prices sit.",
          sq: 'Plepa është një pjesë e qetë banimi e Durrësit me infrastrukturë të konsoliduar, jo një zonë turistike. Kjo e bën një zgjedhje praktike për banim gjithë vitin ose për qira afatgjatë, dhe një alternativë më të qetë se plazhi i ngarkuar i Plazhit. Pallatet me pamje nga deti në vijën e parë janë aty ku janë çmimet më të larta të zonës.',
          ru: 'Плепа — тихий жилой район Дурреса со сложившейся инфраструктурой, а не курортная полоса. Поэтому он удобен для жизни круглый год или долгосрочной сдачи и спокойнее оживлённого пляжа в районе Пляж. Более высокие цены района сосредоточены в домах с видом на море у самой воды.',
          uk: 'Плепа — тихий житловий район Дурреса з усталеною інфраструктурою, а не курортна смуга. Тому він зручний для життя цілий рік або довгострокової оренди й спокійніший за жвавий пляж у районі Пляж. Вищі ціни району зосереджені в будинках із видом на море біля самої води.',
          it: 'Plepa è una zona residenziale tranquilla di Durazzo con infrastrutture consolidate, non una striscia turistica. Per questo è una scelta pratica per vivere tutto l’anno o per affitti lunghi, e un’alternativa più calma alla spiaggia affollata di Plazh. I prezzi più alti del quartiere si concentrano nei palazzi vista mare in prima fila.',
          pl: 'Plepa to spokojna, mieszkalna część Durrës z ugruntowaną infrastrukturą, a nie kurortowy pas. Dlatego sprawdza się do mieszkania przez cały rok lub długiego najmu i jest spokojniejszą alternatywą dla zatłoczonej plaży w Plazh. Wyższe ceny okolicy skupiają się w budynkach z widokiem na morze przy samej wodzie.',
        },
      },
      {
        q: {
          en: 'How can I tell if a Plepa listing is fairly priced?',
          sq: 'Si ta kuptoj nëse një njoftim në Plepa ka çmim të drejtë?',
          ru: 'Как понять, справедлива ли цена объявления в Плепе?',
          uk: 'Як зрозуміти, чи справедлива ціна оголошення в Плепі?',
          it: 'Come capire se un annuncio a Plepa ha un prezzo giusto?',
          pl: 'Jak ocenić, czy cena ogłoszenia w Plepie jest uczciwa?',
        },
        a: {
          en: 'Work out which of the two segments it belongs to first. A flat with a genuine sea view should be compared with the €1,800–2,160 band, and one without it with the €1,000–1,270 band. In Plepa you pay for the view rather than the address, so a view claimed in a listing is worth checking in person.',
          sq: 'Së pari përcaktoni se në cilin nga dy segmentet bën pjesë. Një apartament me pamje të vërtetë nga deti duhet krahasuar me brezin 1.800–2.160 €, dhe një pa pamje me brezin 1.000–1.270 €. Në Plepa paguani për pamjen dhe jo për adresën, ndaj një pamje e premtuar në njoftim ia vlen të kontrollohet me sytë tuaj.',
          ru: 'Сначала определите, к какому из двух сегментов оно относится. Квартиру с настоящим видом на море сравнивайте с диапазоном €1 800–2 160, а без него — с диапазоном €1 000–1 270. В Плепе платят за вид, а не за адрес, поэтому обещанный в объявлении вид стоит проверить лично.',
          uk: 'Спершу визначте, до якого з двох сегментів воно належить. Квартиру зі справжнім видом на море порівнюйте з діапазоном €1 800–2 160, а без нього — з діапазоном €1 000–1 270. У Плепі платять за вид, а не за адресу, тому обіцяний в оголошенні вид варто перевірити особисто.',
          it: 'Per prima cosa capisci a quale dei due segmenti appartiene. Un appartamento con una vera vista mare va confrontato con la fascia 1.800–2.160 €, uno senza con la fascia 1.000–1.270 €. A Plepa si paga la vista più che l’indirizzo, quindi una vista promessa nell’annuncio va verificata di persona.',
          pl: 'Najpierw ustal, do którego z dwóch segmentów należy. Mieszkanie z prawdziwym widokiem na morze porównuj z przedziałem 1800–2160 €, a bez widoku — z przedziałem 1000–1270 €. W Plepie płaci się za widok, a nie za adres, więc obiecany w ogłoszeniu widok warto sprawdzić osobiście.',
        },
      },
    ],
  },

  shkozet: {
    title: {
      en: 'Shkozet, Durrës: frequently asked questions',
      sq: 'Shkozet, Durrës: pyetje të shpeshta',
      ru: 'Шкозет, Дуррес: частые вопросы',
      uk: 'Шкозет, Дуррес: часті запитання',
      it: 'Shkozet, Durazzo: domande frequenti',
      pl: 'Shkozet, Durrës: najczęstsze pytania',
    },
    items: [
      {
        q: {
          en: 'How much does property cost in Shkozet, Durrës?',
          sq: 'Sa kushton prona në Shkozet, Durrës?',
          ru: 'Сколько стоит недвижимость в Шкозете, Дуррес?',
          uk: 'Скільки коштує нерухомість у Шкозеті, Дуррес?',
          it: 'Quanto costano gli immobili a Shkozet, Durazzo?',
          pl: 'Ile kosztują nieruchomości w Shkozet w Durrës?',
        },
        a: {
          en: 'Sources disagree. One puts Shkozet at €1,100–1,600 per square metre, a local source at €800–1,200, and the realistic answer sits between them. The zone is inland, on the main approach to the city, so there is no beach premium built into the price.',
          sq: 'Burimet nuk pajtohen. Njëri e vendos Shkozetin në 1.100–1.600 € për metër katror, një burim vendas në 800–1.200 €, dhe përgjigjja realiste është mes tyre. Zona është në brendësi, në hyrjen kryesore të qytetit, ndaj në çmim nuk ka shtesë për plazhin.',
          ru: 'Источники расходятся. Один оценивает Шкозет в €1 100–1 600 за квадратный метр, местный — в €800–1 200, и реалистичный ответ лежит посередине. Зона находится вглубь от моря, на главном въезде в город, поэтому пляжной надбавки в цене нет.',
          uk: 'Джерела розходяться. Одне оцінює Шкозет у €1 100–1 600 за квадратний метр, місцеве — у €800–1 200, і реалістична відповідь лежить посередині. Зона розташована вглиб від моря, на головному в’їзді до міста, тож пляжної надбавки в ціні немає.',
          it: 'Le fonti non concordano. Una colloca Shkozet a 1.100–1.600 € al metro quadro, una fonte locale a 800–1.200 €, e la risposta realistica sta nel mezzo. La zona è nell’entroterra, sull’accesso principale alla città, quindi nel prezzo non c’è alcun sovrapprezzo per la spiaggia.',
          pl: 'Źródła się różnią. Jedno podaje dla Shkozet 1100–1600 € za metr kwadratowy, lokalne 800–1200 €, a realistyczna odpowiedź leży pośrodku. Strefa leży w głębi lądu, przy głównym wjeździe do miasta, więc w cenie nie ma dopłaty za plażę.',
        },
      },
      {
        q: {
          en: 'Who is Shkozet for?',
          sq: 'Për kë është Shkozeti?',
          ru: 'Кому подходит Шкозет?',
          uk: 'Кому підходить Шкозет?',
          it: 'Per chi è adatta Shkozet?',
          pl: 'Dla kogo jest Shkozet?',
        },
        a: {
          en: 'For buyers who want to live in Durrës rather than holiday there. It is a residential district bought mainly by local buyers, and its main argument is road connectivity on the approach to the city. With no beach season, rents and prices behave like a normal residential market instead of spiking in summer.',
          sq: 'Për blerësit që duan të jetojnë në Durrës dhe jo të pushojnë aty. Është zonë banimi e blerë kryesisht nga blerës vendas, dhe argumenti i saj kryesor është lidhja rrugore në hyrje të qytetit. Pa sezon plazhi, qiratë dhe çmimet sillen si një treg normal banimi, pa kulm në verë.',
          ru: 'Тем, кто хочет жить в Дурресе, а не отдыхать. Это жилой район, где покупают в основном местные, и главный его аргумент — транспортная доступность на въезде в город. Без пляжного сезона аренда и цены ведут себя как на обычном жилом рынке, без летних скачков.',
          uk: 'Тим, хто хоче жити в Дурресі, а не відпочивати. Це житловий район, де купують переважно місцеві, і головний його аргумент — транспортна доступність на в’їзді до міста. Без пляжного сезону оренда й ціни поводяться як на звичайному житловому ринку, без літніх стрибків.',
          it: 'Per chi vuole vivere a Durazzo più che andarci in vacanza. È un quartiere residenziale comprato soprattutto da acquirenti locali, e il suo argomento principale sono i collegamenti stradali all’ingresso della città. Senza stagione balneare, affitti e prezzi si comportano come un normale mercato residenziale, senza picchi estivi.',
          pl: 'Dla kupujących, którzy chcą w Durrës mieszkać, a nie spędzać wakacji. To dzielnica mieszkaniowa kupowana głównie przez miejscowych, a jej głównym atutem jest dojazd przy wjeździe do miasta. Bez sezonu plażowego czynsze i ceny zachowują się jak na zwykłym rynku mieszkaniowym, bez letnich skoków.',
        },
      },
      {
        q: {
          en: 'How should I judge a price in Shkozet?',
          sq: 'Si ta vlerësoj një çmim në Shkozet?',
          ru: 'Как оценить цену в Шкозете?',
          uk: 'Як оцінити ціну в Шкозеті?',
          it: 'Come valutare un prezzo a Shkozet?',
          pl: 'Jak ocenić cenę w Shkozet?',
        },
        a: {
          en: 'By comparable completed sales rather than a published rate. The zone is priced deal by deal and the sources disagree on the band, and that disagreement is itself the signal: ask the agent or the notary for recent sales in the same street or building before you make an offer.',
          sq: 'Me shitje të ngjashme të përfunduara, jo me një tarifë të publikuar. Zona çmohet marrëveshje pas marrëveshjeje dhe burimet nuk pajtohen për brezin — kjo mospajtim është vetë sinjali: kërkojini agjentit ose noterit shitjet e fundit në të njëjtën rrugë ose pallat para se të bëni ofertë.',
          ru: 'По сопоставимым завершённым сделкам, а не по опубликованной ставке. Цена в зоне складывается от сделки к сделке, источники расходятся в диапазоне, и само это расхождение — сигнал: попросите агента или нотариуса показать недавние продажи на той же улице или в том же доме, прежде чем делать предложение.',
          uk: 'За порівнянними завершеними угодами, а не за опублікованою ставкою. Ціна в зоні складається від угоди до угоди, джерела розходяться в діапазоні, і саме це розходження — сигнал: попросіть агента чи нотаріуса показати нещодавні продажі на тій самій вулиці чи в тому самому будинку, перш ніж робити пропозицію.',
          it: 'Con vendite concluse comparabili, non con una tariffa pubblicata. La zona si prezza trattativa per trattativa e le fonti non concordano sulla fascia: proprio questo disaccordo è il segnale. Chiedi all’agente o al notaio le vendite recenti nella stessa strada o nello stesso palazzo prima di fare un’offerta.',
          pl: 'Na podstawie porównywalnych zakończonych transakcji, a nie opublikowanej stawki. Ceny w strefie ustala się transakcja po transakcji, a źródła różnią się co do przedziału — i właśnie ta rozbieżność jest sygnałem. Poproś agenta lub notariusza o niedawne sprzedaże na tej samej ulicy lub w tym samym budynku, zanim złożysz ofertę.',
        },
      },
    ],
  },

  qerret: {
    title: {
      en: 'Qerret: frequently asked questions',
      sq: 'Qerret: pyetje të shpeshta',
      ru: 'Керрет: частые вопросы',
      uk: 'Керрет: часті запитання',
      it: 'Qerret: domande frequenti',
      pl: 'Qerret: najczęstsze pytania',
    },
    items: [
      {
        q: {
          en: 'How much does an apartment cost in Qerret?',
          sq: 'Sa kushton një apartament në Qerret?',
          ru: 'Сколько стоит квартира в Керрете?',
          uk: 'Скільки коштує квартира в Керреті?',
          it: 'Quanto costa un appartamento a Qerret?',
          pl: 'Ile kosztuje mieszkanie w Qerret?',
        },
        a: {
          en: 'Prices step sharply with distance from the water: about €1,100–1,500 per square metre behind the villas, €1,700–2,000 nearer the sea, and €2,200–2,500 on the first line, where almost nothing new is being built. Qerret has been the fastest-appreciating zone around Durrës, up 21–43% year on year.',
          sq: 'Çmimet ndryshojnë ndjeshëm sipas largësisë nga uji: rreth 1.100–1.500 € për metër katror pas vilave, 1.700–2.000 € më afër detit dhe 2.200–2.500 € në vijën e parë, ku pothuajse nuk ndërtohet asgjë e re. Qerreti ka qenë zona me rritjen më të shpejtë të vlerës rreth Durrësit, 21–43% në vit.',
          ru: 'Цены резко меняются с расстоянием от воды: около €1 100–1 500 за квадратный метр за виллами, €1 700–2 000 ближе к морю и €2 200–2 500 на первой линии, где почти ничего нового не строится. Керрет дорожал быстрее всех зон вокруг Дурреса — на 21–43% в год.',
          uk: 'Ціни різко змінюються з відстанню від води: близько €1 100–1 500 за квадратний метр за віллами, €1 700–2 000 ближче до моря і €2 200–2 500 на першій лінії, де майже нічого нового не будується. Керрет дорожчав найшвидше з усіх зон навколо Дурреса — на 21–43% на рік.',
          it: 'I prezzi salgono nettamente avvicinandosi all’acqua: circa 1.100–1.500 € al metro quadro dietro le ville, 1.700–2.000 € più vicino al mare e 2.200–2.500 € in prima fila, dove non si costruisce quasi più nulla. Qerret è stata la zona con la rivalutazione più rapida intorno a Durazzo, +21–43% su base annua.',
          pl: 'Ceny mocno rosną wraz z bliskością wody: około 1100–1500 € za metr kwadratowy za willami, 1700–2000 € bliżej morza i 2200–2500 € na pierwszej linii, gdzie prawie nic nowego się nie buduje. Qerret drożał najszybciej ze wszystkich stref wokół Durrës — o 21–43% rocznie.',
        },
      },
      {
        q: {
          en: 'Who buys property in Qerret?',
          sq: 'Kush blen prona në Qerret?',
          ru: 'Кто покупает недвижимость в Керрете?',
          uk: 'Хто купує нерухомість у Керреті?',
          it: 'Chi compra casa a Qerret?',
          pl: 'Kto kupuje nieruchomości w Qerret?',
        },
        a: {
          en: 'Mostly Polish and Czech buyers alongside the Albanian diaspora. Qerret sits past Golem on the same beach strip south of Durrës, and its first line is close to built out, which is part of the reason prices there have moved faster than in the neighbouring zones.',
          sq: 'Kryesisht blerës polakë dhe çekë, bashkë me diasporën shqiptare. Qerreti ndodhet pas Golemit në të njëjtin brez plazhi në jug të Durrësit, dhe vija e tij e parë është pothuajse e ndërtuar e gjitha — kjo është një pjesë e arsyes pse çmimet aty janë rritur më shpejt se në zonat fqinje.',
          ru: 'В основном поляки и чехи, а также албанская диаспора. Керрет расположен за Големом на той же пляжной полосе к югу от Дурреса, а его первая линия почти полностью застроена — отчасти поэтому цены там росли быстрее, чем в соседних зонах.',
          uk: 'Здебільшого поляки й чехи, а також албанська діаспора. Керрет розташований за Големом на тій самій пляжній смузі на південь від Дурреса, а його перша лінія майже повністю забудована — почасти тому ціни там зростали швидше, ніж у сусідніх зонах.',
          it: 'Soprattutto acquirenti polacchi e cechi, insieme alla diaspora albanese. Qerret si trova dopo Golem sulla stessa striscia di spiaggia a sud di Durazzo, e la sua prima fila è quasi completamente costruita: è in parte il motivo per cui lì i prezzi sono saliti più in fretta che nelle zone vicine.',
          pl: 'Głównie Polacy i Czesi, a także albańska diaspora. Qerret leży za Golem na tym samym pasie plaży na południe od Durrës, a jego pierwsza linia jest niemal całkowicie zabudowana — to po części dlatego ceny rosły tam szybciej niż w sąsiednich strefach.',
        },
      },
      {
        q: {
          en: 'What should foreigners know before buying in Qerret?',
          sq: 'Çfarë duhet të dinë të huajt para se të blejnë në Qerret?',
          ru: 'Что иностранцу важно знать перед покупкой в Керрете?',
          uk: 'Що іноземцю важливо знати перед купівлею в Керреті?',
          it: 'Cosa deve sapere uno straniero prima di comprare a Qerret?',
          pl: 'Co cudzoziemiec powinien wiedzieć przed zakupem w Qerret?',
        },
        a: {
          en: 'Qerret belongs to Kavajë municipality, not Durrës. Building permits, legalisation files and the enforcement cases documented in the area are handled by Bashkia Kavajë, so check the property’s permit and legal status with that municipality rather than assuming the Durrës address on the listing tells the whole story.',
          sq: 'Qerreti i përket Bashkisë Kavajë, jo Durrësit. Lejet e ndërtimit, dosjet e legalizimit dhe rastet e zbatimit të dokumentuara në zonë trajtohen nga Bashkia Kavajë, ndaj verifikoni lejen dhe statusin ligjor të pronës pranë kësaj bashkie, në vend që të mendoni se adresa "Durrës" në njoftim tregon gjithçka.',
          ru: 'Керрет относится к муниципалитету Каваи, а не Дурреса. Разрешения на строительство, дела о легализации и задокументированные в районе принудительные меры ведёт Bashkia Kavajë, поэтому разрешение и юридический статус объекта проверяйте именно там, а не полагайтесь на адрес «Дуррес» в объявлении.',
          uk: 'Керрет належить до муніципалітету Каваї, а не Дурреса. Дозволи на будівництво, справи про легалізацію та задокументовані в районі примусові заходи веде Bashkia Kavajë, тому дозвіл і юридичний статус об’єкта перевіряйте саме там, а не покладайтеся на адресу «Дуррес» в оголошенні.',
          it: "Qerret appartiene al comune di Kavajë, non a Durazzo. Permessi di costruzione, pratiche di legalizzazione e i casi di contestazione documentati nella zona sono gestiti dalla Bashkia Kavajë, quindi verifica permesso e situazione legale dell'immobile presso quel comune invece di dare per scontato che l'indirizzo di Durazzo nell'annuncio dica tutto.",
          pl: 'Qerret należy do gminy Kavajë, a nie Durrës. Pozwolenia na budowę, sprawy legalizacyjne i udokumentowane w okolicy postępowania egzekucyjne prowadzi Bashkia Kavajë, więc pozwolenie i status prawny nieruchomości sprawdzaj właśnie tam, zamiast zakładać, że adres „Durrës” w ogłoszeniu mówi wszystko.',
        },
      },
    ],
  },

  'gjiri-i-lalzit': {
    title: {
      en: 'Gjiri i Lalzit: frequently asked questions',
      sq: 'Gjiri i Lalzit: pyetje të shpeshta',
      ru: 'Залив Лалзи: частые вопросы',
      uk: 'Затока Лалзі: часті запитання',
      it: 'Baia di Lalzi: domande frequenti',
      pl: 'Zatoka Lalzi: najczęstsze pytania',
    },
    items: [
      {
        q: {
          en: 'How much does property cost in Gjiri i Lalzit?',
          sq: 'Sa kushton prona në Gjirin e Lalzit?',
          ru: 'Сколько стоит недвижимость в заливе Лалзи?',
          uk: 'Скільки коштує нерухомість у затоці Лалзі?',
          it: 'Quanto costano gli immobili nella Baia di Lalzi?',
          pl: 'Ile kosztują nieruchomości w Zatoce Lalzi?',
        },
        a: {
          en: 'It is priced in tiers. Second-line flats and early phases go at €1,500–1,700 per square metre; established complexes such as Vala Mar, San Pietro and Porto Lalëzi sit at €2,500–3,500. San Pietro moved from €1,350/m² in 2021 to €2,800–3,650 in 2025. Townhouses run €600–850k and villas €900k–1.2m.',
          sq: 'Çmimet janë me shkallë. Apartamentet në vijën e dytë dhe fazat e para shiten me 1.500–1.700 € për metër katror; komplekset e njohura si Vala Mar, San Pietro dhe Porto Lalëzi janë 2.500–3.500 €. San Pietro kaloi nga 1.350 €/m² në 2021 në 2.800–3.650 € në 2025. Shtëpitë në rresht kushtojnë 600–850 mijë €, vilat 900 mijë–1,2 milionë €.',
          ru: 'Цены здесь ступенчатые. Квартиры второй линии и первые очереди продаются по €1 500–1 700 за квадратный метр; известные комплексы — Vala Mar, San Pietro, Porto Lalëzi — стоят €2 500–3 500. San Pietro вырос с €1 350/м² в 2021 году до €2 800–3 650 в 2025-м. Таунхаусы стоят €600–850 тыс., виллы — €900 тыс.–1,2 млн.',
          uk: 'Ціни тут ступінчасті. Квартири другої лінії та перші черги продаються по €1 500–1 700 за квадратний метр; відомі комплекси — Vala Mar, San Pietro, Porto Lalëzi — коштують €2 500–3 500. San Pietro зріс із €1 350/м² у 2021 році до €2 800–3 650 у 2025-му. Таунхауси коштують €600–850 тис., вілли — €900 тис.–1,2 млн.',
          it: 'I prezzi sono a livelli. Gli appartamenti in seconda fila e le prime fasi vanno a 1.500–1.700 € al metro quadro; complessi affermati come Vala Mar, San Pietro e Porto Lalëzi stanno a 2.500–3.500 €. San Pietro è passato da 1.350 €/m² nel 2021 a 2.800–3.650 € nel 2025. Le villette a schiera costano 600–850 mila €, le ville 900 mila–1,2 milioni €.',
          pl: 'Ceny są tu stopniowane. Mieszkania w drugiej linii i pierwsze etapy kosztują 1500–1700 € za metr kwadratowy; znane kompleksy, takie jak Vala Mar, San Pietro i Porto Lalëzi, to 2500–3500 €. San Pietro wzrósł z 1350 €/m² w 2021 roku do 2800–3650 € w 2025 roku. Szeregowce kosztują 600–850 tys. €, wille 900 tys.–1,2 mln €.',
        },
      },
      {
        q: {
          en: 'Who buys in Gjiri i Lalzit?',
          sq: 'Kush blen në Gjirin e Lalzit?',
          ru: 'Кто покупает недвижимость в заливе Лалзи?',
          uk: 'Хто купує нерухомість у затоці Лалзі?',
          it: 'Chi compra nella Baia di Lalzi?',
          pl: 'Kto kupuje w Zatoce Lalzi?',
        },
        a: {
          en: 'Mostly the diaspora from Germany, Switzerland and the United States, plus wealthier buyers from Kosovo. The bay is the closest thing Albania has to a planned resort coast, and the research suggests many of these buyers turned to it once prices in the south passed €4,000–5,000 per square metre.',
          sq: 'Kryesisht diaspora nga Gjermania, Zvicra dhe Shtetet e Bashkuara, si dhe blerës më të pasur nga Kosova. Gjiri është gjëja më e afërt që ka Shqipëria me një bregdet turistik të planifikuar, dhe kërkimi tregon se shumë nga këta blerës u kthyen këtu kur çmimet në jug kaluan 4.000–5.000 € për metër katror.',
          ru: 'В основном диаспора из Германии, Швейцарии и США, а также состоятельные покупатели из Косово. Залив — ближайшее, что есть в Албании к спланированному курортному побережью, и, по данным исследования, многие из этих покупателей переключились сюда, когда цены на юге превысили €4 000–5 000 за квадратный метр.',
          uk: 'Здебільшого діаспора з Німеччини, Швейцарії та США, а також заможні покупці з Косова. Затока — найближче, що є в Албанії до спланованого курортного узбережжя, і, за даними дослідження, багато з цих покупців переключилися сюди, коли ціни на півдні перевищили €4 000–5 000 за квадратний метр.',
          it: 'Soprattutto la diaspora da Germania, Svizzera e Stati Uniti, più acquirenti benestanti dal Kosovo. La baia è quanto di più simile l’Albania abbia a una costa turistica pianificata, e secondo la ricerca molti di questi acquirenti si sono spostati qui quando i prezzi al sud hanno superato i 4.000–5.000 € al metro quadro.',
          pl: 'Głównie diaspora z Niemiec, Szwajcarii i Stanów Zjednoczonych oraz zamożniejsi kupujący z Kosowa. Zatoka to najbliższe, co Albania ma do zaplanowanego wybrzeża kurortowego, a według badań wielu z tych kupujących przeniosło się tu, gdy ceny na południu przekroczyły 4000–5000 € za metr kwadratowy.',
        },
      },
      {
        q: {
          en: 'What rental income can I expect in Gjiri i Lalzit?',
          sq: 'Çfarë të ardhurash nga qiraja mund të pres në Gjirin e Lalzit?',
          ru: 'На какой доход от аренды можно рассчитывать в заливе Лалзи?',
          uk: 'На який дохід від оренди можна розраховувати в затоці Лалзі?',
          it: 'Che reddito da affitto posso aspettarmi nella Baia di Lalzi?',
          pl: 'Na jaki dochód z najmu można liczyć w Zatoce Lalzi?',
        },
        a: {
          en: 'In peak season a 1+1 apartment lets at about €100–150 a night and a villa at €400–600, according to the research behind these pages. Those are high-season rates rather than yearly averages, so a rental plan should count on a short summer and much lower demand for the rest of the year.',
          sq: 'Në kulm të sezonit një apartament 1+1 jepet me qira rreth 100–150 € nata dhe një vilë 400–600 €, sipas kërkimit mbi të cilin bazohen këto faqe. Këto janë tarifa të sezonit të lartë dhe jo mesatare vjetore, ndaj një plan qiraje duhet të llogarisë një verë të shkurtër dhe kërkesë shumë më të ulët pjesën tjetër të vitit.',
          ru: 'В пик сезона квартира 1+1 сдаётся примерно за €100–150 в сутки, а вилла — за €400–600, по данным исследования, на котором построены эти страницы. Это ставки высокого сезона, а не средние за год, поэтому план сдачи должен учитывать короткое лето и гораздо более низкий спрос в остальное время.',
          uk: 'У пік сезону квартира 1+1 здається приблизно за €100–150 за добу, а вілла — за €400–600, за даними дослідження, на якому побудовані ці сторінки. Це ставки високого сезону, а не середні за рік, тому план оренди має враховувати коротке літо й набагато нижчий попит решту часу.',
          it: 'In alta stagione un appartamento 1+1 si affitta a circa 100–150 € a notte e una villa a 400–600 €, secondo la ricerca su cui si basano queste pagine. Sono tariffe di alta stagione, non medie annuali, quindi un piano di affitto deve contare su un’estate breve e su una domanda molto più bassa nel resto dell’anno.',
          pl: 'W szczycie sezonu mieszkanie 1+1 wynajmuje się za około 100–150 € za noc, a willę za 400–600 €, według badań, na których opierają się te strony. To stawki wysokiego sezonu, a nie średnie roczne, więc plan najmu powinien zakładać krótkie lato i znacznie niższy popyt przez resztę roku.',
        },
      },
    ],
  },

  'mali-i-robit': {
    title: {
      en: 'Mali i Robit: frequently asked questions',
      sq: 'Mali i Robit: pyetje të shpeshta',
      ru: 'Мали-и-Робит: частые вопросы',
      uk: 'Малі-і-Робіт: часті запитання',
      it: 'Mali i Robit: domande frequenti',
      pl: 'Mali i Robit: najczęstsze pytania',
    },
    items: [
      {
        q: {
          en: 'How much does an apartment cost in Mali i Robit?',
          sq: 'Sa kushton një apartament në Mali i Robit?',
          ru: 'Сколько стоит квартира в Мали-и-Робит?',
          uk: 'Скільки коштує квартира в Малі-і-Робіт?',
          it: 'Quanto costa un appartamento a Mali i Robit?',
          pl: 'Ile kosztuje mieszkanie w Mali i Robit?',
        },
        a: {
          en: "About €950–1,200 per square metre, the cheapest point on the beach strip running south from Durrës — below Golem and less than half of Qerret's first line on the same coast. The figure comes from listing data alone: no agency survey or press series covers Mali i Robit separately.",
          sq: 'Rreth 950–1.200 € për metër katror, pika më e lirë në brezin e plazhit që shtrihet në jug të Durrësit — nën Golemin dhe më pak se gjysma e vijës së parë të Qerretit në të njëjtin bregdet. Shifra vjen vetëm nga të dhënat e njoftimeve: asnjë anketë agjencish apo seri shtypi nuk e mbulon veçmas Malin e Robit.',
          ru: 'Около €950–1 200 за квадратный метр — самая дешёвая точка на пляжной полосе к югу от Дурреса: ниже Голема и меньше половины цены первой линии Керрета на том же побережье. Цифра основана только на данных объявлений: ни один опрос агентств или газетный ряд не рассматривает Мали-и-Робит отдельно.',
          uk: 'Близько €950–1 200 за квадратний метр — найдешевша точка на пляжній смузі на південь від Дурреса: нижче за Голем і менше половини ціни першої лінії Керрета на тому самому узбережжі. Цифра базується лише на даних оголошень: жодне опитування агентств чи газетна серія не розглядає Малі-і-Робіт окремо.',
          it: 'Circa 950–1.200 € al metro quadro, il punto più economico della striscia di spiaggia a sud di Durazzo — sotto Golem e meno della metà della prima fila di Qerret sulla stessa costa. Il dato viene solo dagli annunci: nessuna indagine di agenzie o serie di stampa copre Mali i Robit separatamente.',
          pl: 'Około 950–1200 € za metr kwadratowy, najtańszy punkt pasa plaży ciągnącego się na południe od Durrës — poniżej Golem i mniej niż połowa ceny pierwszej linii w Qerret na tym samym wybrzeżu. Liczba pochodzi wyłącznie z ogłoszeń: żadne badanie agencji ani seria prasowa nie obejmuje Mali i Robit osobno.',
        },
      },
      {
        q: {
          en: 'Why is Mali i Robit cheaper than Golem?',
          sq: 'Pse Mali i Robit është më i lirë se Golemi?',
          ru: 'Почему Мали-и-Робит дешевле Голема?',
          uk: 'Чому Малі-і-Робіт дешевший за Голем?',
          it: 'Perché Mali i Robit costa meno di Golem?',
          pl: 'Dlaczego Mali i Robit jest tańszy niż Golem?',
        },
        a: {
          en: 'It is further from the city, thinner on services and has none of the resort infrastructure that lets Gjiri i Lalzit or Qerret charge a premium. The coastline is the same, so buyers here are trading distance and amenities for a lower entry price rather than accepting a worse beach.',
          sq: 'Është më larg qytetit, me më pak shërbime dhe pa infrastrukturën turistike që u lejon Gjirit të Lalzit apo Qerretit të kërkojnë çmim më të lartë. Bregdeti është i njëjti, ndaj blerësit këtu shkëmbejnë largësinë dhe komoditetet me një çmim hyrjeje më të ulët, jo me një plazh më të keq.',
          ru: 'Он дальше от города, беднее сервисами и лишён курортной инфраструктуры, за которую залив Лалзи или Керрет берут надбавку. Побережье то же самое, поэтому покупатели здесь меняют расстояние и удобства на более низкий порог входа, а не соглашаются на худший пляж.',
          uk: 'Він далі від міста, бідніший на сервіси й позбавлений курортної інфраструктури, за яку затока Лалзі чи Керрет беруть надбавку. Узбережжя те саме, тож покупці тут обмінюють відстань і зручності на нижчий поріг входу, а не погоджуються на гірший пляж.',
          it: 'È più lontano dalla città, con meno servizi e senza l’infrastruttura turistica che permette alla Baia di Lalzi o a Qerret di chiedere di più. La costa è la stessa, quindi qui gli acquirenti scambiano distanza e servizi con un prezzo d’ingresso più basso, non con una spiaggia peggiore.',
          pl: 'Leży dalej od miasta, ma mniej usług i nie ma infrastruktury kurortowej, dzięki której Zatoka Lalzi czy Qerret mogą żądać więcej. Wybrzeże jest to samo, więc kupujący wymieniają tu odległość i udogodnienia na niższą cenę wejścia, a nie godzą się na gorszą plażę.',
        },
      },
      {
        q: {
          en: 'How reliable are the prices for Mali i Robit?',
          sq: 'Sa të besueshme janë çmimet për Malin e Robit?',
          ru: 'Насколько надёжны цены по Мали-и-Робит?',
          uk: 'Наскільки надійні ціни по Малі-і-Робіт?',
          it: 'Quanto sono affidabili i prezzi di Mali i Robit?',
          pl: 'Na ile wiarygodne są ceny dla Mali i Robit?',
        },
        a: {
          en: 'Treat them as a starting point for negotiation rather than a settled rate. Because the band comes only from asking prices in listings, with no independent survey behind it, the real sale price can land lower. Compare several listings in the same building or street before you make an offer.',
          sq: 'Trajtojini si pikënisje për negociim, jo si tarifë të qëndrueshme. Meqë brezi vjen vetëm nga çmimet e kërkuara në njoftime, pa asnjë anketë të pavarur pas tij, çmimi real i shitjes mund të dalë më i ulët. Krahasoni disa njoftime në të njëjtin pallat ose rrugë para se të bëni ofertë.',
          ru: 'Считайте их отправной точкой для торга, а не устоявшейся ставкой. Диапазон построен только на ценах предложения из объявлений, без независимого исследования, поэтому реальная цена сделки может оказаться ниже. Сравните несколько объявлений в том же доме или на той же улице, прежде чем делать предложение.',
          uk: 'Вважайте їх відправною точкою для торгу, а не усталеною ставкою. Діапазон побудований лише на цінах пропозиції з оголошень, без незалежного дослідження, тому реальна ціна угоди може виявитися нижчою. Порівняйте кілька оголошень у тому самому будинку чи на тій самій вулиці, перш ніж робити пропозицію.',
          it: 'Considerali un punto di partenza per la trattativa, non una tariffa consolidata. Poiché la fascia deriva solo dai prezzi richiesti negli annunci, senza un’indagine indipendente alle spalle, il prezzo reale di vendita può risultare più basso. Confronta più annunci nello stesso palazzo o nella stessa strada prima di fare un’offerta.',
          pl: 'Traktuj je jako punkt wyjścia do negocjacji, a nie ustaloną stawkę. Przedział pochodzi wyłącznie z cen ofertowych w ogłoszeniach, bez niezależnego badania, więc rzeczywista cena sprzedaży może być niższa. Porównaj kilka ogłoszeń w tym samym budynku lub na tej samej ulicy, zanim złożysz ofertę.',
        },
      },
    ],
  },

  rrashbull: {
    title: {
      en: 'Rrashbull, Durrës: frequently asked questions',
      sq: 'Rrashbull, Durrës: pyetje të shpeshta',
      ru: 'Рашбуль, Дуррес: частые вопросы',
      uk: 'Рашбуль, Дуррес: часті запитання',
      it: 'Rrashbull, Durazzo: domande frequenti',
      pl: 'Rrashbull, Durrës: najczęstsze pytania',
    },
    items: [
      {
        q: {
          en: 'How much does property cost in Rrashbull, Durrës?',
          sq: 'Sa kushton prona në Rrashbull, Durrës?',
          ru: 'Сколько стоит недвижимость в Рашбуле, Дуррес?',
          uk: 'Скільки коштує нерухомість у Рашбулі, Дуррес?',
          it: 'Quanto costano gli immobili a Rrashbull, Durazzo?',
          pl: 'Ile kosztują nieruchomości w Rrashbull w Durrës?',
        },
        a: {
          en: 'Roughly €1,000–1,500 per square metre. That range reconciles two sources rather than quoting one: Investropa puts the zone at €1,100–1,600 and Dyqani at €800–1,200. Rrashbull is inland Durrës, usually grouped with Shkozet, so there is no sea premium in the price.',
          sq: 'Afërsisht 1.000–1.500 € për metër katror. Ky brez pajton dy burime në vend që të citojë njërin: Investropa e vendos zonën në 1.100–1.600 € dhe Dyqani në 800–1.200 €. Rrashbulli është në brendësi të Durrësit, zakonisht bashkë me Shkozetin, ndaj në çmim nuk ka shtesë për detin.',
          ru: 'Примерно €1 000–1 500 за квадратный метр. Этот диапазон сводит два источника, а не цитирует один: Investropa оценивает зону в €1 100–1 600, а Dyqani — в €800–1 200. Рашбуль — это Дуррес вглубь от моря, его обычно рассматривают вместе со Шкозетом, поэтому морской надбавки в цене нет.',
          uk: 'Приблизно €1 000–1 500 за квадратний метр. Цей діапазон зводить два джерела, а не цитує одне: Investropa оцінює зону в €1 100–1 600, а Dyqani — у €800–1 200. Рашбуль — це Дуррес углиб від моря, його зазвичай розглядають разом зі Шкозетом, тож морської надбавки в ціні немає.',
          it: 'Circa 1.000–1.500 € al metro quadro. La fascia concilia due fonti invece di citarne una: Investropa colloca la zona a 1.100–1.600 € e Dyqani a 800–1.200 €. Rrashbull è la Durazzo dell’entroterra, di solito accorpata a Shkozet, quindi nel prezzo non c’è sovrapprezzo per il mare.',
          pl: 'Około 1000–1500 € za metr kwadratowy. Ten przedział godzi dwa źródła zamiast cytować jedno: Investropa podaje dla strefy 1100–1600 €, a Dyqani 800–1200 €. Rrashbull to Durrës w głębi lądu, zwykle łączony z Shkozet, więc w cenie nie ma dopłaty za morze.',
        },
      },
      {
        q: {
          en: 'Who is Rrashbull for?',
          sq: 'Për kë është Rrashbulli?',
          ru: 'Кому подходит Рашбуль?',
          uk: 'Кому підходить Рашбуль?',
          it: 'Per chi è adatta Rrashbull?',
          pl: 'Dla kogo jest Rrashbull?',
        },
        a: {
          en: 'The buyer who wants to live in the city without paying for sand. With no sea and no season there is no summer spike in rents and no winter collapse either, so it behaves like a normal residential market — which on this coast is unusual enough to be the main reason to choose it.',
          sq: 'Për blerësin që do të jetojë në qytet pa paguar për rërën. Pa det dhe pa sezon nuk ka kulm të qirave në verë as rënie në dimër, kështu që sillet si një treg normal banimi — gjë që në këtë bregdet është aq e rrallë sa të jetë arsyeja kryesore për ta zgjedhur.',
          ru: 'Тому, кто хочет жить в городе и не платить за песок. Без моря и сезона здесь нет ни летнего скачка аренды, ни зимнего провала, поэтому район ведёт себя как обычный жилой рынок — а на этом побережье это достаточно необычно, чтобы быть главной причиной его выбрать.',
          uk: 'Тому, хто хоче жити в місті й не платити за пісок. Без моря й сезону тут немає ні літнього стрибка оренди, ні зимового провалу, тож район поводиться як звичайний житловий ринок — а на цьому узбережжі це достатньо незвично, щоб бути головною причиною його обрати.',
          it: 'Per chi vuole vivere in città senza pagare la sabbia. Senza mare e senza stagione non ci sono né picchi estivi degli affitti né crolli invernali, quindi si comporta come un normale mercato residenziale — cosa abbastanza rara su questa costa da essere il motivo principale per sceglierla.',
          pl: 'Dla kupującego, który chce mieszkać w mieście i nie płacić za piasek. Bez morza i sezonu nie ma tu ani letniego skoku czynszów, ani zimowego spadku, więc okolica zachowuje się jak zwykły rynek mieszkaniowy — co na tym wybrzeżu jest na tyle nietypowe, że stanowi główny powód wyboru.',
        },
      },
      {
        q: {
          en: 'Is Rrashbull a good place to buy to rent out?',
          sq: 'A është Rrashbulli vend i mirë për të blerë dhe dhënë me qira?',
          ru: 'Подходит ли Рашбуль для покупки под сдачу?',
          uk: 'Чи підходить Рашбуль для купівлі під оренду?',
          it: 'Rrashbull conviene per comprare e affittare?',
          pl: 'Czy Rrashbull to dobre miejsce na zakup pod najem?',
        },
        a: {
          en: 'For long-term lets rather than holiday rentals. Demand here is residential and steady through the year instead of seasonal, so the useful comparison is with other inland districts such as Shkozet, not with the beach zones. Check recent rents in the same area before relying on any projected income.',
          sq: 'Për qira afatgjatë më shumë se për qira pushimesh. Kërkesa këtu është për banim dhe e qëndrueshme gjatë gjithë vitit, jo sezonale, ndaj krahasimi i dobishëm është me zona të tjera të brendshme si Shkozeti, jo me zonat e plazhit. Kontrolloni qiratë e fundit në të njëjtën zonë para se të mbështeteni te ndonjë e ardhur e parashikuar.',
          ru: 'Скорее для долгосрочной сдачи, чем для посуточной. Спрос здесь жилой и ровный круглый год, а не сезонный, поэтому сравнивать имеет смысл с другими районами вглубь от моря, например Шкозетом, а не с пляжными зонами. Проверьте актуальные ставки аренды в районе, прежде чем полагаться на прогноз дохода.',
          uk: 'Радше для довгострокової оренди, ніж подобової. Попит тут житловий і рівний цілий рік, а не сезонний, тож порівнювати варто з іншими районами вглиб від моря, як-от Шкозетом, а не з пляжними зонами. Перевірте актуальні ставки оренди в районі, перш ніж покладатися на прогноз доходу.',
          it: 'Per affitti lunghi più che per affitti turistici. La domanda qui è residenziale e costante tutto l’anno, non stagionale, quindi il confronto utile è con altri quartieri dell’entroterra come Shkozet, non con le zone balneari. Verifica gli affitti recenti nella stessa zona prima di contare su un reddito previsto.',
          pl: 'Raczej pod najem długoterminowy niż wakacyjny. Popyt jest tu mieszkaniowy i równy przez cały rok, a nie sezonowy, więc sensownie jest porównywać z innymi dzielnicami w głębi lądu, jak Shkozet, a nie ze strefami plażowymi. Sprawdź aktualne czynsze w okolicy, zanim zaczniesz polegać na prognozowanym dochodzie.',
        },
      },
    ],
  },
}
