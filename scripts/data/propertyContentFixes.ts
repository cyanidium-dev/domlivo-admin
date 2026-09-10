/**
 * Corrections for the listings the content audit flagged.
 *
 * Every fact here is taken from the listing's own long description — the text
 * the agency wrote by hand, emoji and all — or from its structured fields.
 * Nothing is inferred from a photograph and no number appears that was not
 * already recorded.
 *
 * Two rules shaped the short descriptions:
 *
 *  - they do not repeat the price, the area or the bedroom count. Those sit in
 *    the fields directly beside them on the card and the page, and repeating
 *    them is what made the old generated blurb worthless.
 *  - they say the one thing that would make a reader open the listing: how far
 *    the sea is, which floor, what the flat is actually for.
 *
 * Albanian is written here rather than machine-translated, and is still marked
 * PENDING NATIVE REVIEW in the delivery report, per CONTENT-OPS.
 */

export type LocalizedText = {en: string; ru: string; uk: string; sq: string; it: string; pl: string}

export type PropertyFix = {
  slug: string
  /** Why the structured fields change, in one line, for the delivery report. */
  note?: string
  bedrooms?: number
  rooms?: number
  bathrooms?: number
  /** Replaces the title only in the locales listed. */
  title?: Partial<LocalizedText>
  shortDescription?: LocalizedText
}

/**
 * The typology corrections.
 *
 * On these listings `bedrooms` holds the room total and `rooms` is empty or
 * one too high — the DatoCMS import read one number as the other. The agency's
 * own Russian text settles every one of them: it says "1+1" or "2-комнатная"
 * where the imported fields say 2+1. The hand-written text is the original;
 * the fields and the English, Albanian, Italian and Polish titles were all
 * generated from the same bad import in one pass.
 */
export const FIXES: PropertyFix[] = [
  // ---------------------------------------------------------------- Vlorë
  {
    slug: 'prodaetsya-bolshaya-kvartira-1-1-vo-vlere',
    note: 'Russian text says 1+1 twice; the imported fields said 2 bedrooms / 3 rooms and four titles said 2+1',
    bedrooms: 1,
    rooms: 2,
    title: {
      en: 'One-bedroom apartment with two balconies, central Vlorë',
      sq: 'Apartament 1+1 me dy ballkone, qendra e Vlorës',
      it: 'Appartamento 1+1 con due balconi, centro di Valona',
      pl: 'Mieszkanie 1+1 z dwoma balkonami, centrum Wlory',
      uk: 'Простора квартира 1+1 з двома балконами у Вльорі',
    },
    shortDescription: {
      en: 'Ninth floor of an eleven-storey building from 2020, east-facing, with two balconies over the bay. Two lifts, cameras in the entrance and a caretaker living a floor below.',
      ru: 'Девятый этаж одиннадцатиэтажного дома 2020 года, восточная сторона, два балкона с видом на залив. Два лифта, камеры на входе, администратор живёт этажом ниже.',
      uk: 'Дев’ятий поверх одинадцятиповерхового будинку 2020 року, східний бік, два балкони з видом на затоку. Два ліфти, камери на вході, адміністратор живе поверхом нижче.',
      sq: 'Kati i nëntë i një pallati njëmbëdhjetëkatësh të vitit 2020, nga lindja, me dy ballkone nga gjiri. Dy ashensorë, kamera në hyrje dhe një administrator që banon një kat më poshtë.',
      it: 'Nono piano di un edificio del 2020 di undici piani, esposto a est, con due balconi sulla baia. Due ascensori, telecamere all’ingresso e un custode che abita al piano di sotto.',
      pl: 'Dziewiąte piętro jedenastopiętrowego budynku z 2020 roku, strona wschodnia, dwa balkony z widokiem na zatokę. Dwie windy, kamery przy wejściu i dozorca mieszkający piętro niżej.',
    },
  },

  // ---------------------------------------------------- Durrës · Plepa
  {
    slug: 'prodaetsya-vidovaya-kvartira-1-1-v-rayone-plepa',
    note: 'all six titles say 1+1; bedrooms held the room total',
    bedrooms: 1,
    rooms: 2,
    shortDescription: {
      en: 'Ninth floor with a lift, a hundred metres from the water in Plepa. Furnished and equipped, and let year-round to tourists and residents alike.',
      ru: 'Девятый этаж с лифтом, сто метров до воды в районе Плепа. С мебелью и техникой, район востребован и у туристов, и у местных круглый год.',
      uk: 'Дев’ятий поверх із ліфтом, сто метрів до води в районі Плепа. З меблями й технікою, район затребуваний і в туристів, і в місцевих цілий рік.',
      sq: 'Kati i nëntë me ashensor, njëqind metra nga uji në Plepa. I mobiluar dhe i pajisur, në një zonë të kërkuar nga turistët dhe banorët gjatë gjithë vitit.',
      it: 'Nono piano con ascensore, a cento metri dall’acqua a Plepa. Arredato e attrezzato, in una zona richiesta tutto l’anno da turisti e residenti.',
      pl: 'Dziewiąte piętro z windą, sto metrów od wody w dzielnicy Plepa. Umeblowane i wyposażone, w okolicy popularnej wśród turystów i mieszkańców przez cały rok.',
    },
  },
  {
    slug: 'prodazha-kvartiry-1-1-s-vidom-na-more',
    shortDescription: {
      en: 'Fifth floor of the Rotonda building in Plepa, a hundred metres from the sea, with a private beach nearby. Recently furnished.',
      ru: 'Пятый этаж дома «Ротонда» в Плепе, сто метров до моря, рядом частный пляж. Свежая мебель и техника.',
      uk: 'П’ятий поверх будинку «Ротонда» в Плепі, сто метрів до моря, поряд приватний пляж. Свіжі меблі й техніка.',
      sq: 'Kati i pestë i pallatit Rotonda në Plepa, njëqind metra nga deti, me një plazh privat afër. I mobiluar rishtazi.',
      it: 'Quinto piano dell’edificio Rotonda a Plepa, a cento metri dal mare, con una spiaggia privata nelle vicinanze. Arredamento recente.',
      pl: 'Piąte piętro budynku Rotonda w Plepie, sto metrów od morza, obok prywatna plaża. Świeże umeblowanie.',
    },
  },
  {
    slug: 'prodazha-vidovoy-kvartiry-studii',
    shortDescription: {
      en: 'Fourth floor of the Rotonda building in Plepa, lift, a hundred and fifty metres to the water. A studio bought either to live by the sea or to let.',
      ru: 'Четвёртый этаж дома «Ротонда» в Плепе, лифт, сто пятьдесят метров до воды. Студия под жизнь у моря или под сдачу.',
      uk: 'Четвертий поверх будинку «Ротонда» в Плепі, ліфт, сто п’ятдесят метрів до води. Студія під життя біля моря або під оренду.',
      sq: 'Kati i katërt i pallatit Rotonda në Plepa, me ashensor, njëqind e pesëdhjetë metra nga uji. Një studio për të jetuar buzë detit ose për ta dhënë me qira.',
      it: 'Quarto piano dell’edificio Rotonda a Plepa, ascensore, centocinquanta metri dall’acqua. Un monolocale da abitare sul mare o da affittare.',
      pl: 'Czwarte piętro budynku Rotonda w Plepie, winda, sto pięćdziesiąt metrów do wody. Kawalerka pod życie nad morzem albo pod wynajem.',
    },
  },

  // ----------------------------------------------------- Durrës · Plazh
  {
    slug: 'prodaetsya-kvartira-s-bolshoy-terrasoy-s-vidom-na-more',
    shortDescription: {
      en: 'Fifth floor with a lift, a hundred metres from the sea, and a terrace large enough that the flat can be divided into four or five separate studios.',
      ru: 'Пятый этаж с лифтом, сто метров до моря, и терраса такого размера, что квартиру можно разделить на четыре-пять отдельных студий.',
      uk: 'П’ятий поверх із ліфтом, сто метрів до моря, і тераса такого розміру, що квартиру можна поділити на чотири-п’ять окремих студій.',
      sq: 'Kati i pestë me ashensor, njëqind metra nga deti, dhe një tarracë aq e madhe sa banesa mund të ndahet në katër ose pesë studio të veçanta.',
      it: 'Quinto piano con ascensore, a cento metri dal mare, e una terrazza così ampia che l’appartamento può essere diviso in quattro o cinque monolocali.',
      pl: 'Piąte piętro z windą, sto metrów od morza, i taras na tyle duży, że mieszkanie da się podzielić na cztery lub pięć osobnych kawalerek.',
    },
  },
  {
    slug: 'prodazha-21-u-morya-s-novym-remontom-r-n-plyazh-durres',
    shortDescription: {
      en: 'Sixth floor with a lift in Iliria, two hundred metres from the water. Recently renovated and fully furnished, ninety-six square metres of it living space.',
      ru: 'Шестой этаж с лифтом в Илирии, двести метров до воды. Новый ремонт и полная меблировка, из них девяносто шесть метров жилой площади.',
      uk: 'Шостий поверх із ліфтом в Ілірії, двісті метрів до води. Новий ремонт і повне вмеблювання, з них дев’яносто шість метрів житлової площі.',
      sq: 'Kati i gjashtë me ashensor në Iliria, dyqind metra nga uji. I rinovuar rishtazi dhe plotësisht i mobiluar, nga të cilat nëntëdhjetë e gjashtë metra katrorë sipërfaqe banimi.',
      it: 'Sesto piano con ascensore a Iliria, a duecento metri dall’acqua. Ristrutturato di recente e completamente arredato, di cui novantasei metri quadri abitabili.',
      pl: 'Szóste piętro z windą w Ilirii, dwieście metrów od wody. Świeżo wyremontowane i w pełni umeblowane, w tym dziewięćdziesiąt sześć metrów powierzchni mieszkalnej.',
    },
  },
  {
    slug: 'prodazha-bolshoy-kvartiry-3-1-2-sanuzla',
    note: 'the Russian text lists three bedrooms and two bathrooms; bedrooms held the room total and rooms was empty',
    bedrooms: 3,
    rooms: 4,
    bathrooms: 2,
    shortDescription: {
      en: 'Seventh floor in Plazh, two hundred and fifty metres from the sea, east-facing with a view to the mountains. Three bedrooms, two bathrooms and a living room with the kitchen.',
      ru: 'Седьмой этаж в районе Пляж, двести пятьдесят метров до моря, окна на восток, вид на гору. Три спальни, два санузла и гостиная с кухней.',
      uk: 'Сьомий поверх у районі Пляж, двісті п’ятдесят метрів до моря, вікна на схід, вид на гору. Три спальні, два санвузли й вітальня з кухнею.',
      sq: 'Kati i shtatë në Plazh, dyqind e pesëdhjetë metra nga deti, nga lindja me pamje nga mali. Tri dhoma gjumi, dy banjo dhe një dhomë ndenjeje me kuzhinën.',
      it: 'Settimo piano a Plazh, a duecentocinquanta metri dal mare, esposto a est con vista sulla montagna. Tre camere, due bagni e un soggiorno con cucina.',
      pl: 'Siódme piętro w dzielnicy Plazh, dwieście pięćdziesiąt metrów od morza, okna na wschód, widok na górę. Trzy sypialnie, dwie łazienki i salon z kuchnią.',
    },
  },
  {
    slug: 'prodazha-kvartiry-u-morya-61m2',
    shortDescription: {
      en: 'Second floor with a lift by the Pelikan café, a hundred metres from the water. Ready to move into; a similar flat in the same building is also for sale.',
      ru: 'Второй этаж с лифтом у кафе «Пеликан», сто метров до воды. Готова к проживанию; в том же доме продаётся похожая квартира.',
      uk: 'Другий поверх із ліфтом біля кафе «Пелікан», сто метрів до води. Готова до проживання; у тому ж будинку продається схожа квартира.',
      sq: 'Kati i dytë me ashensor pranë kafenesë Pelikan, njëqind metra nga uji. Gati për t’u banuar; në të njëjtin pallat shitet edhe një banesë e ngjashme.',
      it: 'Secondo piano con ascensore vicino al caffè Pelikan, a cento metri dall’acqua. Pronto da abitare; nello stesso edificio è in vendita un appartamento simile.',
      pl: 'Drugie piętro z windą przy kawiarni Pelikan, sto metrów od wody. Gotowe do zamieszkania; w tym samym budynku sprzedaje się podobne mieszkanie.',
    },
  },
  {
    slug: 'prodazha-kvartiry-u-morya-68m2',
    shortDescription: {
      en: 'Second floor with a lift by the Pelikan café, a hundred metres from the water. The larger of two flats for sale in the same building.',
      ru: 'Второй этаж с лифтом у кафе «Пеликан», сто метров до воды. Большая из двух квартир, которые продаются в этом доме.',
      uk: 'Другий поверх із ліфтом біля кафе «Пелікан», сто метрів до води. Більша з двох квартир, що продаються в цьому будинку.',
      sq: 'Kati i dytë me ashensor pranë kafenesë Pelikan, njëqind metra nga uji. Më e madhja nga dy banesat që shiten në të njëjtin pallat.',
      it: 'Secondo piano con ascensore vicino al caffè Pelikan, a cento metri dall’acqua. Il più grande dei due appartamenti in vendita nello stesso edificio.',
      pl: 'Drugie piętro z windą przy kawiarni Pelikan, sto metrów od wody. Większe z dwóch mieszkań sprzedawanych w tym budynku.',
    },
  },

  // -------------------------------------------------- Durrës · Shkëmbi
  {
    slug: 'prodazha-studii-42m2',
    note: 'the Russian text describes a studio laid out as a 1+1; rooms said 1',
    bedrooms: 1,
    rooms: 2,
    shortDescription: {
      en: 'Third floor at Shkëmbi i Kavajës, two hundred metres from the sea. Laid out as a one-bedroom with a separate kitchen, and the building has its own water well.',
      ru: 'Третий этаж в Шкемби-и-Кавайес, двести метров до моря. Планировка разделена на спальню и отдельную кухню, у дома собственная скважина.',
      uk: 'Третій поверх у Шкемби-і-Кавайєс, двісті метрів до моря. Планування поділене на спальню й окрему кухню, будинок має власну свердловину.',
      sq: 'Kati i tretë në Shkëmbin e Kavajës, dyqind metra nga deti. E organizuar si 1+1 me kuzhinë të veçantë, dhe pallati ka pusin e vet të ujit.',
      it: 'Terzo piano a Shkëmbi i Kavajës, a duecento metri dal mare. Distribuito come 1+1 con cucina separata, e l’edificio ha un proprio pozzo d’acqua.',
      pl: 'Trzecie piętro w Shkëmbi i Kavajës, dwieście metrów od morza. Rozkład jak 1+1 z osobną kuchnią, budynek ma własną studnię.',
    },
  },
  {
    slug: 'prodazha-uyutnoy-kvartiry-1-1-u-morya',
    shortDescription: {
      en: 'In Shkëmbi i Kavajës, the quiet green stretch of coast at Durrës — liveable through the winter and in demand as a summer let.',
      ru: 'В Шкемби-и-Кавайес, тихой зелёной части побережья Дурреса — здесь живут круглый год, а летом сдают отдыхающим.',
      uk: 'У Шкемби-і-Кавайєс, тихій зеленій частині узбережжя Дурреса — тут живуть цілий рік, а влітку здають відпочивальникам.',
      sq: 'Në Shkëmbin e Kavajës, pjesa e qetë dhe e gjelbër e bregdetit të Durrësit — e banueshme gjatë gjithë vitit dhe e kërkuar për qira verore.',
      it: 'A Shkëmbi i Kavajës, il tratto di costa tranquillo e verde di Durazzo — abitabile tutto l’anno e richiesto per gli affitti estivi.',
      pl: 'W Shkëmbi i Kavajës, cichej i zielonej części wybrzeża Durrës — mieszka się tu cały rok, a latem wynajmuje wczasowiczom.',
    },
  },
  {
    slug: 'prodazha-uyutnoy-kvartiry-1-1-u-gory',
    note: 'all six titles say 1+1; bedrooms held the room total and rooms was empty',
    bedrooms: 1,
    rooms: 2,
  },

  // ------------------------------------------------------ Durrës · Golem
  {
    slug: 'prodazha-kvartiry-2-1-200m-ot-morya',
    shortDescription: {
      en: 'Second floor in Golem, two hundred metres from the sea, among the Premium, Miami 2 and Grand Blue Fafa hotels and the seasonal trade that follows them.',
      ru: 'Второй этаж в Големе, двести метров до моря, среди отелей Premium, Miami 2 и Grand Blue Fafa и сезонной инфраструктуры вокруг них.',
      uk: 'Другий поверх у Големі, двісті метрів до моря, серед готелів Premium, Miami 2 і Grand Blue Fafa та сезонної інфраструктури навколо них.',
      sq: 'Kati i dytë në Golem, dyqind metra nga deti, mes hoteleve Premium, Miami 2 dhe Grand Blue Fafa dhe infrastrukturës sezonale përreth.',
      it: 'Secondo piano a Golem, a duecento metri dal mare, tra gli hotel Premium, Miami 2 e Grand Blue Fafa e le attività stagionali che li circondano.',
      pl: 'Drugie piętro w Golem, dwieście metrów od morza, wśród hoteli Premium, Miami 2 i Grand Blue Fafa oraz sezonowej infrastruktury wokół nich.',
    },
  },

  // ------------------------------------------------------------- rentals
  {
    slug: 'apartment-2-1-55-m-for-rent-in-durres',
    note: 'the Russian text says 2-комнатная, i.e. 1+1; the imported fields said 2 bedrooms / 3 rooms',
    bedrooms: 1,
    rooms: 2,
    title: {en: 'One-bedroom apartment with a sea view, Durrës', sq: 'Apartament 1+1 me pamje nga deti, Durrës', it: 'Appartamento 1+1 con vista mare, Durazzo', pl: 'Mieszkanie 1+1 z widokiem na morze, Durrës'},
    shortDescription: {
      en: 'Eighth floor, a side view of the sea and the Kavajë rock from the balcony, a hundred metres from the beach across the road. Parking in the yard.',
      ru: 'Восьмой этаж, с балкона боковой вид на море и скалу Кавая, сто метров до пляжа через дорогу. Во дворе есть где поставить машину.',
      uk: 'Восьмий поверх, з балкона боковий вид на море й скелю Кавая, сто метрів до пляжу через дорогу. У дворі є де поставити авто.',
      sq: 'Kati i tetë, me pamje anësore nga deti dhe Shkëmbi i Kavajës nga ballkoni, njëqind metra nga plazhi përtej rrugës. Vend parkimi në oborr.',
      it: 'Ottavo piano, vista laterale sul mare e sulla roccia di Kavaja dal balcone, a cento metri dalla spiaggia oltre la strada. Parcheggio nel cortile.',
      pl: 'Ósme piętro, z balkonu boczny widok na morze i skałę Kavaja, sto metrów do plaży przez drogę. Miejsce na auto na podwórzu.',
    },
  },
  {
    slug: 'dlya-arendy-kvartira-1-1-s-vidom-na-more',
    note: 'duplicate of apartment-2-1-55-m-for-rent-in-durres (both DATO-O_RPIOYN); same correction applied',
    bedrooms: 1,
    rooms: 2,
    title: {en: 'One-bedroom apartment with a sea view, Durrës', sq: 'Apartament 1+1 me pamje nga deti, Durrës', it: 'Appartamento 1+1 con vista mare, Durazzo', pl: 'Mieszkanie 1+1 z widokiem na morze, Durrës'},
    shortDescription: {
      en: 'Eighth floor, a side view of the sea and the Kavajë rock from the balcony, a hundred metres from the beach across the road. Parking in the yard.',
      ru: 'Восьмой этаж, с балкона боковой вид на море и скалу Кавая, сто метров до пляжа через дорогу. Во дворе есть где поставить машину.',
      uk: 'Восьмий поверх, з балкона боковий вид на море й скелю Кавая, сто метрів до пляжу через дорогу. У дворі є де поставити авто.',
      sq: 'Kati i tetë, me pamje anësore nga deti dhe Shkëmbi i Kavajës nga ballkoni, njëqind metra nga plazhi përtej rrugës. Vend parkimi në oborr.',
      it: 'Ottavo piano, vista laterale sul mare e sulla roccia di Kavaja dal balcone, a cento metri dalla spiaggia oltre la strada. Parcheggio nel cortile.',
      pl: 'Ósme piętro, z balkonu boczny widok na morze i skałę Kavaja, sto metrów do plaży przez drogę. Miejsce na auto na podwórzu.',
    },
  },
  {
    slug: 'dlya-arendy-kvartira-1-1-o-r',
    note: 'the Russian text says 2-комнатная, i.e. 1+1; the imported fields said 2 bedrooms / 3 rooms',
    bedrooms: 1,
    rooms: 2,
    title: {en: 'One-bedroom apartment in central Durrës', sq: 'Apartament 1+1 në qendër të Durrësit', it: 'Appartamento 1+1 nel centro di Durazzo', pl: 'Mieszkanie 1+1 w centrum Durrës'},
    shortDescription: {
      en: 'Third floor, windows onto a quiet courtyard, two to three hundred metres from the sea and the promenade. Renovated, with new appliances.',
      ru: 'Третий этаж, окна во двор, где тихо, двести-триста метров до моря и набережной. Современный ремонт, новая техника.',
      uk: 'Третій поверх, вікна у двір, де тихо, двісті-триста метрів до моря й набережної. Сучасний ремонт, нова техніка.',
      sq: 'Kati i tretë, dritaret nga një oborr i qetë, dyqind–treqind metra nga deti dhe shëtitorja. I rinovuar, me pajisje të reja.',
      it: 'Terzo piano, finestre su un cortile tranquillo, a duecento-trecento metri dal mare e dal lungomare. Ristrutturato, con elettrodomestici nuovi.',
      pl: 'Trzecie piętro, okna na cichy dziedziniec, dwieście–trzysta metrów od morza i promenady. Po remoncie, z nowym sprzętem.',
    },
  },
  {
    slug: 'dlya-arendy-komfortnaya-studiya-magdalena',
    shortDescription: {
      en: 'Fifth floor, two to three hundred metres from the beach, quiet inside. Supermarkets, a bank, a post office and a school stay open through the winter.',
      ru: 'Пятый этаж, двести-триста метров до пляжа, внутри тихо. Супермаркеты, банк, почта и школа работают и зимой.',
      uk: 'П’ятий поверх, двісті-триста метрів до пляжу, всередині тихо. Супермаркети, банк, пошта і школа працюють і взимку.',
      sq: 'Kati i pestë, dyqind–treqind metra nga plazhi, i qetë nga brenda. Supermarketet, banka, posta dhe shkolla punojnë edhe në dimër.',
      it: 'Quinto piano, a duecento-trecento metri dalla spiaggia, silenzioso all’interno. Supermercati, banca, ufficio postale e scuola restano aperti anche d’inverno.',
      pl: 'Piąte piętro, dwieście–trzysta metrów od plaży, w środku cicho. Supermarkety, bank, poczta i szkoła działają także zimą.',
    },
  },
  {
    slug: 'dlya-arendy-studiya-zensa-v-dome-pallati',
    shortDescription: {
      en: 'Eighth floor with the town in view from the balcony, two to three hundred metres from the beach. Parking in the yard and year-round shops on the doorstep.',
      ru: 'Восьмой этаж, с балкона виден город, двести-триста метров до пляжа. Во дворе паркуются, магазины рядом работают круглый год.',
      uk: 'Восьмий поверх, з балкона видно місто, двісті-триста метрів до пляжу. У дворі паркуються, крамниці поряд працюють цілий рік.',
      sq: 'Kati i tetë me pamje nga qyteti prej ballkonit, dyqind–treqind metra nga plazhi. Parkim në oborr dhe dyqane që punojnë gjatë gjithë vitit.',
      it: 'Ottavo piano con la città in vista dal balcone, a duecento-trecento metri dalla spiaggia. Parcheggio nel cortile e negozi aperti tutto l’anno.',
      pl: 'Ósme piętro z widokiem na miasto z balkonu, dwieście–trzysta metrów od plaży. Parking na podwórzu i sklepy czynne cały rok.',
    },
  },

  // ------------------------------------------------------------ the villa
  {
    slug: '390-m-villa-8-bedrooms-plazh-durres',
    note: 'the Albanian title said 4+1 on a villa the record and the English title both put at eight bedrooms',
    title: {sq: 'Vilë 390 m² me tetë dhoma gjumi, Plazh, Durrës'},
  },

  // -------------------------------------------------- second pass, after re-audit
  {
    slug: 'prodaetsya-bolshaya-kvartira-1-1-v-rayone-plepa',
    note: 'all six titles say 1+1; bedrooms held the room total and rooms was empty. Missed on the first pass — the slug is one word away from prodaetsya-vidovaya-kvartira-1-1-v-rayone-plepa.',
    bedrooms: 1,
    rooms: 2,
  },
  {
    slug: 'dlya-arendy-studiya-zensa-v-dome-pallati',
    note: 'the Ukrainian title counted one room for a two-room flat — the Slavic form counts every room, not just bedrooms',
    title: {uk: '2-кімнатна квартира 42 м² в оренду, Дуррес'},
  },
  {
    slug: 'dlya-arendy-komfortnaya-studiya-magdalena',
    note: 'same undercount in the Ukrainian title',
    title: {uk: '2-кімнатна квартира 45 м² в оренду, Дуррес'},
  },

  // ------------------------------------ the same defect, arrived with the import
  {
    slug: 'shitet-apartament-1-1-tek-plazhi-i-golemit-ndertim-i-ri-279',
    note: 'partner data: the title says 1+1 and bedrooms held the room total',
    bedrooms: 1,
    rooms: 2,
  },
  {
    slug: 'shitet-apartament-1-1-ne-malin-e-robit-100-metra-nga-deti-298',
    note: 'partner data: the title says 1+1 and bedrooms held the room total',
    bedrooms: 1,
    rooms: 2,
  },
]
