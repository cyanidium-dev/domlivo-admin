/**
 * ТЗ-16 hub + footer seed: creates the three guide cluster hubs
 * (/guides/buying, /guides/investment-albania, /guides/albania-market) and
 * fills `siteSettings.footerGuideLinks` when it is empty.
 *
 * - Hubs are `createIfNotExists` — a re-run is a no-op, Studio edits survive.
 * - The footer patch only writes when `footerGuideLinks` is currently empty.
 * - All copy is authored inline in all six locales (EN source: spec §8/§9).
 *   The bot AI translate endpoint is deliberately NOT used (expiring key).
 *
 * Run: npm run seed:guide-hubs [-- --execute]
 * Spec: docs/engineering/SPEC-tz16-related-pages-2026-08-26.md §8–9
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.includes('--execute')

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

type L = {en: string; uk: string; ru: string; sq: string; it: string; pl: string}

const TODAY = new Date().toISOString().slice(0, 10)

// ---- Shared copy -----------------------------------------------------------

const FAQ_TITLE: L = {
  en: 'Frequently asked questions',
  uk: 'Поширені запитання',
  ru: 'Частые вопросы',
  sq: 'Pyetje të shpeshta',
  it: 'Domande frequenti',
  pl: 'Częste pytania',
}

const COLLECTION_TITLE: L = {
  en: 'Guides on this topic',
  uk: 'Гайди на цю тему',
  ru: 'Гайды по этой теме',
  sq: 'Udhëzues për këtë temë',
  it: 'Guide su questo tema',
  pl: 'Przewodniki na ten temat',
}

const CTA_TITLE: L = {
  en: 'Need help choosing?',
  uk: 'Потрібна допомога з вибором?',
  ru: 'Нужна помощь с выбором?',
  sq: 'Ju duhet ndihmë për të zgjedhur?',
  it: 'Serve aiuto nella scelta?',
  pl: 'Potrzebujesz pomocy w wyborze?',
}

const CTA_TEXT: L = {
  en: "Tell us what you're looking for — we'll point you to the right area, guide, or listing.",
  uk: 'Розкажіть, що ви шукаєте — ми підкажемо правильний район, гайд або оголошення.',
  ru: 'Расскажите, что вы ищете — мы подскажем подходящий район, гайд или объявление.',
  sq: 'Na tregoni çfarë kërkoni — ju drejtojmë te zona, udhëzuesi ose shpallja e duhur.',
  it: "Diteci cosa cercate — vi indirizziamo alla zona, alla guida o all'annuncio giusto.",
  pl: 'Powiedz nam, czego szukasz — wskażemy właściwą dzielnicę, przewodnik lub ofertę.',
}

const CTA_PRIMARY: L = {
  en: 'Talk to an expert',
  uk: 'Звернутися до експерта',
  ru: 'Обратиться к эксперту',
  sq: 'Flisni me një ekspert',
  it: 'Parla con un esperto',
  pl: 'Porozmawiaj z ekspertem',
}

const CTA_SECONDARY: L = {
  en: 'Explore the cities',
  uk: 'Огляд міст',
  ru: 'Обзор городов',
  sq: 'Shikoni qytetet',
  it: 'Esplora le città',
  pl: 'Poznaj miasta',
}

// ---- Hub definitions -------------------------------------------------------

type Faq = {key: string; question: L; answer: L}

type Hub = {
  id: string
  slug: string
  ownTags: string[]
  collectionTags: string[]
  title: L
  subtitle: L
  metaTitle: L
  metaDescription: L
  faq: Faq[]
}

const HUBS: Hub[] = [
  {
    id: 'landing-hub-buying',
    slug: 'buying',
    ownTags: ['theme:buying'],
    collectionTags: ['theme:buying', 'theme:comparison'],
    title: {
      en: 'Property Buying Guides',
      uk: 'Гайди з купівлі нерухомості',
      ru: 'Гайды по покупке недвижимости',
      sq: 'Udhëzues për blerjen e pronës',
      it: "Guide all'acquisto di immobili",
      pl: 'Przewodniki zakupu nieruchomości',
    },
    subtitle: {
      en: 'Step-by-step guides to buying real estate in Albania — legal checks, documents, costs, and how to choose the right area.',
      uk: 'Покрокові гайди з купівлі нерухомості в Албанії — юридичні перевірки, документи, витрати та вибір правильного району.',
      ru: 'Пошаговые гайды по покупке недвижимости в Албании — юридические проверки, документы, расходы и выбор подходящего района.',
      sq: 'Udhëzues hap pas hapi për blerjen e pronës në Shqipëri — verifikime ligjore, dokumente, kosto dhe si të zgjidhni zonën e duhur.',
      it: "Guide passo dopo passo all'acquisto di immobili in Albania — verifiche legali, documenti, costi e come scegliere la zona giusta.",
      pl: 'Przewodniki krok po kroku po zakupie nieruchomości w Albanii — kontrole prawne, dokumenty, koszty i wybór właściwej okolicy.',
    },
    metaTitle: {
      en: 'Property Buying Guides for Albania | DomLivo',
      uk: 'Гайди з купівлі нерухомості в Албанії | DomLivo',
      ru: 'Гайды по покупке недвижимости в Албании | DomLivo',
      sq: 'Udhëzues për blerjen e pronës në Shqipëri | DomLivo',
      it: "Guide all'acquisto di immobili in Albania | DomLivo",
      pl: 'Przewodniki zakupu nieruchomości w Albanii | DomLivo',
    },
    metaDescription: {
      en: 'How to buy property in Albania: legal steps, documents, costs, and area comparisons. Practical guides for foreign and local buyers.',
      uk: 'Як купити нерухомість в Албанії: юридичні кроки, документи, витрати та порівняння районів. Практичні гайди для іноземних і місцевих покупців.',
      ru: 'Как купить недвижимость в Албании: юридические шаги, документы, расходы и сравнения районов. Практичные гайды для иностранных и местных покупателей.',
      sq: 'Si të blini pronë në Shqipëri: hapat ligjorë, dokumentet, kostot dhe krahasimet e zonave. Udhëzues praktikë për blerës të huaj dhe vendas.',
      it: 'Come comprare un immobile in Albania: passaggi legali, documenti, costi e confronti tra zone. Guide pratiche per acquirenti stranieri e locali.',
      pl: 'Jak kupić nieruchomość w Albanii: kroki prawne, dokumenty, koszty i porównania okolic. Praktyczne przewodniki dla kupujących z zagranicy i z kraju.',
    },
    faq: [
      {
        key: 'q1',
        question: {
          en: 'Can foreigners buy property in Albania?',
          uk: 'Чи можуть іноземці купувати нерухомість в Албанії?',
          ru: 'Могут ли иностранцы покупать недвижимость в Албании?',
          sq: 'A mund të blejnë të huajt pronë në Shqipëri?',
          it: 'Gli stranieri possono comprare immobili in Albania?',
          pl: 'Czy cudzoziemcy mogą kupować nieruchomości w Albanii?',
        },
        answer: {
          en: 'Yes — foreign citizens can buy apartments and commercial property with almost the same rights as locals; only agricultural land requires a local company. Each guide covers the paperwork in detail.',
          uk: 'Так — іноземні громадяни можуть купувати квартири та комерційну нерухомість майже з тими самими правами, що й місцеві; лише для сільськогосподарської землі потрібна місцева компанія. Кожен гайд детально описує оформлення документів.',
          ru: 'Да — иностранные граждане могут покупать квартиры и коммерческую недвижимость почти с теми же правами, что и местные; только для сельскохозяйственной земли нужна местная компания. Каждый гайд подробно описывает оформление документов.',
          sq: 'Po — shtetasit e huaj mund të blejnë apartamente dhe prona komerciale me pothuajse të njëjtat të drejta si vendasit; vetëm toka bujqësore kërkon një kompani vendase. Çdo udhëzues i shpjegon dokumentet në detaje.',
          it: 'Sì — i cittadini stranieri possono acquistare appartamenti e immobili commerciali quasi con gli stessi diritti dei locali; solo i terreni agricoli richiedono una società locale. Ogni guida spiega la documentazione in dettaglio.',
          pl: 'Tak — cudzoziemcy mogą kupować mieszkania i nieruchomości komercyjne z niemal takimi samymi prawami jak miejscowi; tylko grunty rolne wymagają lokalnej spółki. Każdy przewodnik szczegółowo opisuje formalności.',
        },
      },
      {
        key: 'q2',
        question: {
          en: 'What documents should I check before buying?',
          uk: 'Які документи перевірити перед купівлею?',
          ru: 'Какие документы проверить перед покупкой?',
          sq: 'Cilat dokumente duhet të verifikoj para blerjes?',
          it: "Quali documenti controllare prima dell'acquisto?",
          pl: 'Jakie dokumenty sprawdzić przed zakupem?',
        },
        answer: {
          en: "The ownership certificate, the property card and map from the cadastre, building permits for new builds, and the seller's identity. Our legal guides walk through the full checklist.",
          uk: 'Свідоцтво про власність, картку нерухомості й мапу з кадастру, дозволи на будівництво для новобудов і особу продавця. Наші юридичні гайди проводять по повному чек-листу.',
          ru: 'Свидетельство о собственности, карточку недвижимости и карту из кадастра, разрешения на строительство для новостроек и личность продавца. Наши юридические гайды проводят по полному чек-листу.',
          sq: 'Certifikatën e pronësisë, kartelën e pasurisë dhe hartën nga kadastra, lejet e ndërtimit për ndërtimet e reja dhe identitetin e shitësit. Udhëzuesit tanë ligjorë kalojnë nëpër listën e plotë.',
          it: "Il certificato di proprietà, la scheda catastale e la mappa, i permessi di costruzione per le nuove costruzioni e l'identità del venditore. Le nostre guide legali seguono l'intera checklist.",
          pl: 'Świadectwo własności, kartę nieruchomości i mapę z katastru, pozwolenia na budowę dla nowych inwestycji oraz tożsamość sprzedającego. Nasze przewodniki prawne prowadzą przez pełną listę kontrolną.',
        },
      },
      {
        key: 'q3',
        question: {
          en: 'How much are the transaction costs?',
          uk: 'Скільки коштує оформлення угоди?',
          ru: 'Сколько стоит оформление сделки?',
          sq: 'Sa janë kostot e transaksionit?',
          it: 'Quanto costano le spese di transazione?',
          pl: 'Ile wynoszą koszty transakcji?',
        },
        answer: {
          en: 'Plan for roughly 3–5% on top of the price: notary fees, registration, possible agency commission and transfer costs. The exact split depends on the deal — see the cost breakdowns in the guides.',
          uk: 'Закладайте орієнтовно 3–5% понад ціну: нотаріальні збори, реєстрація, можлива комісія агентства та витрати на переказ. Точний розподіл залежить від угоди — див. розбивки витрат у гайдах.',
          ru: 'Закладывайте примерно 3–5% сверх цены: нотариальные сборы, регистрация, возможная комиссия агентства и расходы на перевод средств. Точное распределение зависит от сделки — см. разбивки расходов в гайдах.',
          sq: 'Llogaritni afërsisht 3–5% mbi çmimin: tarifat e noterit, regjistrimi, komisioni i mundshëm i agjencisë dhe kostot e transfertës. Ndarja e saktë varet nga marrëveshja — shihni ndarjet e kostove në udhëzues.',
          it: "Prevedete circa il 3–5% oltre il prezzo: spese notarili, registrazione, eventuale commissione d'agenzia e costi di trasferimento. La ripartizione esatta dipende dall'affare — vedi i dettagli dei costi nelle guide.",
          pl: 'Zaplanuj około 3–5% ponad cenę: opłaty notarialne, rejestracja, ewentualna prowizja agencji i koszty przelewu. Dokładny podział zależy od transakcji — zobacz zestawienia kosztów w przewodnikach.',
        },
      },
    ],
  },
  {
    id: 'landing-hub-investment-albania',
    slug: 'investment-albania',
    ownTags: ['theme:investment'],
    collectionTags: ['theme:investment', 'theme:market'],
    title: {
      en: 'Investing in Albanian Real Estate',
      uk: 'Інвестиції в нерухомість Албанії',
      ru: 'Инвестиции в недвижимость Албании',
      sq: 'Investime në pasuritë e paluajtshme në Shqipëri',
      it: "Investire nell'immobiliare albanese",
      pl: 'Inwestowanie w nieruchomości w Albanii',
    },
    subtitle: {
      en: "Market analysis, rental yields, and area-by-area investment guides for Albania's coast and capital.",
      uk: 'Аналіз ринку, дохідність оренди та інвестиційні гайди по районах узбережжя й столиці Албанії.',
      ru: 'Анализ рынка, доходность аренды и инвестиционные гайды по районам побережья и столицы Албании.',
      sq: 'Analizë tregu, kthime nga qiraja dhe udhëzues investimi zonë për zonë për bregdetin dhe kryeqytetin e Shqipërisë.',
      it: "Analisi di mercato, rendimenti da locazione e guide all'investimento zona per zona per la costa e la capitale dell'Albania.",
      pl: 'Analiza rynku, rentowność najmu i przewodniki inwestycyjne po poszczególnych rejonach wybrzeża i stolicy Albanii.',
    },
    metaTitle: {
      en: 'Real Estate Investment in Albania | DomLivo',
      uk: 'Інвестиції в нерухомість в Албанії | DomLivo',
      ru: 'Инвестиции в недвижимость в Албании | DomLivo',
      sq: 'Investime në pasuri të paluajtshme në Shqipëri | DomLivo',
      it: 'Investimenti immobiliari in Albania | DomLivo',
      pl: 'Inwestycje w nieruchomości w Albanii | DomLivo',
    },
    metaDescription: {
      en: 'Where to invest in Albanian property: rental yields, price trends, and comparisons of Tirana, Durrës, Vlora and the Riviera.',
      uk: "Куди інвестувати в албанську нерухомість: дохідність оренди, цінові тренди та порівняння Тирани, Дурреса, Вльори й Рив'єри.",
      ru: 'Куда инвестировать в албанскую недвижимость: доходность аренды, ценовые тренды и сравнения Тираны, Дурреса, Влёры и Ривьеры.',
      sq: 'Ku të investoni në pronë në Shqipëri: kthimet nga qiraja, trendet e çmimeve dhe krahasime të Tiranës, Durrësit, Vlorës dhe Rivierës.',
      it: "Dove investire nell'immobiliare albanese: rendimenti da locazione, andamento dei prezzi e confronti tra Tirana, Durazzo, Valona e la Riviera.",
      pl: 'Gdzie inwestować w albańskie nieruchomości: rentowność najmu, trendy cenowe i porównania Tirany, Durrës, Wlory i Riwiery.',
    },
    faq: [
      {
        key: 'q1',
        question: {
          en: 'What rental yields are realistic in Albania?',
          uk: 'Яка реальна дохідність оренди в Албанії?',
          ru: 'Какая реальная доходность аренды в Албании?',
          sq: 'Çfarë kthimesh nga qiraja janë realiste në Shqipëri?',
          it: 'Quali rendimenti da locazione sono realistici in Albania?',
          pl: 'Jaka rentowność najmu jest realna w Albanii?',
        },
        answer: {
          en: 'Long-term lets typically return around 5–7% gross in Tirana; short-term coastal rentals can reach more in high season but are strongly seasonal. The investment guides break this down by zone.',
          uk: 'Довгострокова оренда в Тирані зазвичай дає близько 5–7% брутто; подобова оренда на узбережжі в сезон може давати більше, але сильно залежить від сезону. Інвестиційні гайди розбирають це по зонах.',
          ru: 'Долгосрочная аренда в Тиране обычно даёт около 5–7% брутто; посуточная аренда на побережье в сезон может приносить больше, но сильно зависит от сезона. Инвестиционные гайды разбирают это по зонам.',
          sq: 'Qiratë afatgjata në Tiranë zakonisht japin rreth 5–7% bruto; qiratë afatshkurtra bregdetare mund të japin më shumë në sezon, por janë shumë sezonale. Udhëzuesit e investimit e ndajnë këtë zonë për zonë.',
          it: 'Gli affitti a lungo termine a Tirana rendono in genere circa il 5–7% lordo; gli affitti brevi sulla costa possono rendere di più in alta stagione ma sono fortemente stagionali. Le guide lo analizzano zona per zona.',
          pl: 'Najem długoterminowy w Tiranie zwykle daje około 5–7% brutto; najem krótkoterminowy na wybrzeżu może dać więcej w sezonie, ale jest silnie sezonowy. Przewodniki inwestycyjne rozkładają to na strefy.',
        },
      },
      {
        key: 'q2',
        question: {
          en: 'Which areas are growing fastest?',
          uk: 'Які райони зростають найшвидше?',
          ru: 'Какие районы растут быстрее всего?',
          sq: 'Cilat zona po rriten më shpejt?',
          it: 'Quali zone crescono più in fretta?',
          pl: 'Które rejony rosną najszybciej?',
        },
        answer: {
          en: "Recent years have seen the fastest price growth on the Durrës coast and in Tirana's newer districts, with the Riviera close behind. See the market guides for current figures and sources.",
          uk: "Останніми роками найшвидше дорожчали узбережжя Дурреса та новіші райони Тирани, Рив'єра — одразу за ними. Актуальні цифри та джерела — у ринкових гайдах.",
          ru: 'В последние годы быстрее всего дорожали побережье Дурреса и новые районы Тираны, Ривьера — сразу за ними. Актуальные цифры и источники — в рыночных гайдах.',
          sq: 'Vitet e fundit rritjen më të shpejtë të çmimeve e kanë pasur bregdeti i Durrësit dhe lagjet më të reja të Tiranës, me Rivierën menjëherë pas. Shihni udhëzuesit e tregut për shifrat dhe burimet aktuale.',
          it: 'Negli ultimi anni la crescita dei prezzi più rapida si è vista sulla costa di Durazzo e nei quartieri più nuovi di Tirana, con la Riviera subito dietro. Vedi le guide di mercato per cifre e fonti aggiornate.',
          pl: 'W ostatnich latach najszybciej drożały wybrzeże Durrës i nowsze dzielnice Tirany, tuż za nimi Riwiera. Aktualne liczby i źródła znajdziesz w przewodnikach rynkowych.',
        },
      },
      {
        key: 'q3',
        question: {
          en: 'Is buying off-plan safe?',
          uk: 'Чи безпечно купувати на етапі будівництва?',
          ru: 'Безопасно ли покупать на этапе строительства?',
          sq: 'A është e sigurt blerja në fazë ndërtimi?',
          it: 'Comprare su carta è sicuro?',
          pl: 'Czy zakup na etapie budowy jest bezpieczny?',
        },
        answer: {
          en: "It can be, with checks: the developer's track record, the building permit, and staged payments. The legal guides list the specific documents to verify.",
          uk: 'Може бути — за умови перевірок: репутація забудовника, дозвіл на будівництво та поетапні платежі. Юридичні гайди перелічують конкретні документи для перевірки.',
          ru: 'Может быть — при условии проверок: репутация застройщика, разрешение на строительство и поэтапные платежи. Юридические гайды перечисляют конкретные документы для проверки.',
          sq: "Mund të jetë, me verifikime: historiku i ndërtuesit, leja e ndërtimit dhe pagesat me faza. Udhëzuesit ligjorë rendisin dokumentet konkrete për t'u verifikuar.",
          it: 'Può esserlo, con le dovute verifiche: lo storico del costruttore, il permesso di costruzione e i pagamenti a stati di avanzamento. Le guide legali elencano i documenti specifici da controllare.',
          pl: 'Może być — pod warunkiem weryfikacji: historia dewelopera, pozwolenie na budowę i płatności etapami. Przewodniki prawne wymieniają konkretne dokumenty do sprawdzenia.',
        },
      },
    ],
  },
  {
    id: 'landing-hub-albania-market',
    slug: 'albania-market',
    ownTags: ['theme:market'],
    collectionTags: ['theme:market'],
    title: {
      en: 'Albania Property Market by City',
      uk: 'Ринок нерухомості Албанії по містах',
      ru: 'Рынок недвижимости Албании по городам',
      sq: 'Tregu i pronave në Shqipëri sipas qyteteve',
      it: 'Mercato immobiliare albanese per città',
      pl: 'Rynek nieruchomości w Albanii według miast',
    },
    subtitle: {
      en: 'Prices, trends and district comparisons for Tirana, Durrës, Vlora, Saranda and beyond.',
      uk: 'Ціни, тренди та порівняння районів для Тирани, Дурреса, Вльори, Саранди й не тільки.',
      ru: 'Цены, тренды и сравнения районов для Тираны, Дурреса, Влёры, Саранды и не только.',
      sq: 'Çmime, trende dhe krahasime lagjesh për Tiranën, Durrësin, Vlorën, Sarandën e më gjerë.',
      it: 'Prezzi, tendenze e confronti tra quartieri per Tirana, Durazzo, Valona, Saranda e oltre.',
      pl: 'Ceny, trendy i porównania dzielnic dla Tirany, Durrës, Wlory, Sarandy i innych miast.',
    },
    metaTitle: {
      en: 'Albania Property Market: Prices by City | DomLivo',
      uk: 'Ринок нерухомості Албанії: ціни по містах | DomLivo',
      ru: 'Рынок недвижимости Албании: цены по городам | DomLivo',
      sq: 'Tregu i pronave në Shqipëri: çmimet sipas qyteteve | DomLivo',
      it: 'Mercato immobiliare in Albania: prezzi per città | DomLivo',
      pl: 'Rynek nieruchomości w Albanii: ceny według miast | DomLivo',
    },
    metaDescription: {
      en: 'Current property prices and market trends across Albanian cities, with district-level data and side-by-side comparisons.',
      uk: 'Актуальні ціни на нерухомість і ринкові тренди в містах Албанії з даними по районах і порівняннями поруч.',
      ru: 'Актуальные цены на недвижимость и рыночные тренды в городах Албании с данными по районам и сравнениями бок о бок.',
      sq: 'Çmimet aktuale të pronave dhe trendet e tregut nëpër qytetet shqiptare, me të dhëna në nivel lagjeje dhe krahasime krah për krah.',
      it: 'Prezzi immobiliari attuali e tendenze di mercato nelle città albanesi, con dati a livello di quartiere e confronti affiancati.',
      pl: 'Aktualne ceny nieruchomości i trendy rynkowe w albańskich miastach, z danymi na poziomie dzielnic i porównaniami obok siebie.',
    },
    faq: [
      {
        key: 'q1',
        question: {
          en: 'How much does an apartment cost in Albania?',
          uk: 'Скільки коштує квартира в Албанії?',
          ru: 'Сколько стоит квартира в Албании?',
          sq: 'Sa kushton një apartament në Shqipëri?',
          it: 'Quanto costa un appartamento in Albania?',
          pl: 'Ile kosztuje mieszkanie w Albanii?',
        },
        answer: {
          en: 'Prices vary widely by city and district — from under €1,000/m² in secondary areas to several times that in prime coastal and central zones. The city guides carry detailed, sourced tables.',
          uk: 'Ціни сильно різняться за містами й районами — від менш ніж €1 000/м² у другорядних зонах до в кілька разів більше в преміальних прибережних і центральних. У міських гайдах — детальні таблиці з джерелами.',
          ru: 'Цены сильно различаются по городам и районам — от менее €1 000/м² во второстепенных зонах до в несколько раз больше в премиальных прибрежных и центральных. В городских гайдах — подробные таблицы с источниками.',
          sq: 'Çmimet ndryshojnë shumë sipas qytetit dhe lagjes — nga nën €1,000/m² në zona dytësore deri në disa herë më shumë në zonat kryesore bregdetare dhe qendrore. Udhëzuesit e qyteteve mbajnë tabela të detajuara me burime.',
          it: 'I prezzi variano molto per città e quartiere — da meno di 1.000 €/m² nelle zone secondarie a diverse volte tanto nelle zone costiere e centrali di pregio. Le guide delle città contengono tabelle dettagliate con le fonti.',
          pl: 'Ceny mocno różnią się w zależności od miasta i dzielnicy — od poniżej 1 000 €/m² w rejonach drugorzędnych do kilkukrotnie więcej w najlepszych strefach nadmorskich i centralnych. Przewodniki miejskie zawierają szczegółowe tabele ze źródłami.',
        },
      },
      {
        key: 'q2',
        question: {
          en: 'Are prices still rising?',
          uk: 'Чи ціни досі зростають?',
          ru: 'Цены всё ещё растут?',
          sq: 'A po rriten ende çmimet?',
          it: 'I prezzi stanno ancora salendo?',
          pl: 'Czy ceny nadal rosną?',
        },
        answer: {
          en: 'Most tracked zones showed year-on-year growth in 2025–2026, driven by tourism and foreign demand. Each city guide cites its sources and update date.',
          uk: 'Більшість відстежуваних зон показали річне зростання у 2025–2026 роках завдяки туризму та іноземному попиту. Кожен міський гайд наводить джерела й дату оновлення.',
          ru: 'Большинство отслеживаемых зон показали годовой рост в 2025–2026 годах благодаря туризму и иностранному спросу. Каждый городской гайд приводит источники и дату обновления.',
          sq: 'Shumica e zonave të ndjekura shënuan rritje vjetore në 2025–2026, të nxitura nga turizmi dhe kërkesa e huaj. Çdo udhëzues qyteti citon burimet dhe datën e përditësimit.',
          it: 'La maggior parte delle zone monitorate ha mostrato una crescita annua nel 2025–2026, trainata dal turismo e dalla domanda estera. Ogni guida cittadina cita fonti e data di aggiornamento.',
          pl: 'Większość monitorowanych stref odnotowała wzrost rok do roku w latach 2025–2026, napędzany turystyką i popytem zagranicznym. Każdy przewodnik miejski podaje źródła i datę aktualizacji.',
        },
      },
      {
        key: 'q3',
        question: {
          en: 'Where is the data from?',
          uk: 'Звідки дані?',
          ru: 'Откуда данные?',
          sq: 'Nga vijnë të dhënat?',
          it: 'Da dove vengono i dati?',
          pl: 'Skąd pochodzą dane?',
        },
        answer: {
          en: 'Zone metrics aggregate listing data, official reference prices and local market reports; every data block links its sources and shows when it was last updated.',
          uk: 'Метрики зон агрегують дані оголошень, офіційні референсні ціни та локальні ринкові звіти; кожен блок даних посилається на джерела й показує дату останнього оновлення.',
          ru: 'Метрики зон агрегируют данные объявлений, официальные референсные цены и локальные рыночные отчёты; каждый блок данных ссылается на источники и показывает дату последнего обновления.',
          sq: 'Metrikat e zonave bashkojnë të dhëna nga shpalljet, çmimet zyrtare të referencës dhe raportet lokale të tregut; çdo bllok të dhënash lidh burimet e veta dhe tregon kur është përditësuar për herë të fundit.',
          it: "Le metriche di zona aggregano dati degli annunci, prezzi ufficiali di riferimento e report locali di mercato; ogni blocco di dati collega le proprie fonti e mostra la data dell'ultimo aggiornamento.",
          pl: 'Metryki stref łączą dane z ogłoszeń, oficjalne ceny referencyjne i lokalne raporty rynkowe; każdy blok danych podaje źródła i datę ostatniej aktualizacji.',
        },
      },
    ],
  },
]

// ---- Footer links ----------------------------------------------------------

const FOOTER_LINKS: Array<{key: string; href: string; label: L}> = [
  {
    key: 'guides-index',
    href: '/guides',
    label: {en: 'All guides', uk: 'Усі гайди', ru: 'Все гайды', sq: 'Të gjithë udhëzuesit', it: 'Tutte le guide', pl: 'Wszystkie przewodniki'},
  },
  {
    key: 'guides-buying',
    href: '/guides/buying',
    label: {en: 'Buying guides', uk: 'Гайди з купівлі', ru: 'Гайды по покупке', sq: 'Udhëzues blerjeje', it: "Guide all'acquisto", pl: 'Przewodniki zakupu'},
  },
  {
    key: 'guides-investment',
    href: '/guides/investment-albania',
    label: {en: 'Investing in Albania', uk: 'Інвестиції в Албанію', ru: 'Инвестиции в Албанию', sq: 'Investime në Shqipëri', it: 'Investire in Albania', pl: 'Inwestowanie w Albanii'},
  },
  {
    key: 'guides-market',
    href: '/guides/albania-market',
    label: {en: 'Market by city', uk: 'Ринок по містах', ru: 'Рынок по городам', sq: 'Tregu sipas qyteteve', it: 'Mercato per città', pl: 'Rynek według miast'},
  },
]

// ---- Build + write ---------------------------------------------------------

function buildHubDoc(hub: Hub): Record<string, unknown> {
  return {
    _id: hub.id,
    _type: 'landingPage',
    enabled: true,
    pageType: 'custom',
    slug: {_type: 'slug', current: hub.slug},
    title: hub.title,
    cardDescription: hub.subtitle,
    topicTags: hub.ownTags,
    contentUpdatedAt: TODAY,
    seo: {
      metaTitle: hub.metaTitle,
      metaDescription: hub.metaDescription,
      ogTitle: hub.metaTitle,
      ogDescription: hub.metaDescription,
    },
    pageSections: [
      {
        _key: 'hero',
        _type: 'heroSection',
        enabled: true,
        title: hub.title,
        subtitle: hub.subtitle,
      },
      {
        _key: 'collection',
        _type: 'relatedPagesAutoSection',
        enabled: true,
        mode: 'topicGuides',
        title: COLLECTION_TITLE,
        topicTags: hub.collectionTags,
        limit: 6,
      },
      {
        _key: 'faq',
        _type: 'faqSection',
        enabled: true,
        title: FAQ_TITLE,
        imageMode: 'withoutImage',
        items: hub.faq.map((f) => ({
          _key: f.key,
          _type: 'localizedFaqItem',
          question: f.question,
          answer: f.answer,
        })),
      },
      {
        _key: 'cta',
        _type: 'ctaSection',
        enabled: true,
        title: CTA_TITLE,
        description: CTA_TEXT,
        cta: {href: '/contact', label: CTA_PRIMARY},
        secondaryCta: {href: '/cities', label: CTA_SECONDARY},
      },
    ],
  }
}

async function main(): Promise<void> {
  const docs = HUBS.map(buildHubDoc)
  const existing = new Set<string>(
    await client.fetch(`*[_type == "landingPage" && _id in $ids]._id`, {ids: docs.map((d) => d._id)}),
  )
  for (const d of docs) {
    console.log(`${existing.has(d._id as string) ? 'exists  ' : execute ? 'create  ' : 'would create '}${d._id} (/guides/${(d.slug as {current: string}).current})`)
  }

  const settings = await client.fetch<{footerGuideLinks?: unknown[]} | null>(
    `*[_type == "siteSettings" && _id == "siteSettings"][0]{footerGuideLinks}`,
  )
  const footerEmpty = !Array.isArray(settings?.footerGuideLinks) || settings.footerGuideLinks.length === 0
  console.log(
    footerEmpty
      ? `${execute ? 'patch   ' : 'would patch '}siteSettings.footerGuideLinks (${FOOTER_LINKS.length} links)`
      : 'siteSettings.footerGuideLinks already has entries — left alone',
  )

  if (!execute) {
    console.log('\nDry run. Re-run with --execute to write.')
    return
  }

  const toCreate = docs.filter((d) => !existing.has(d._id as string))
  if (toCreate.length) {
    await toCreate
      .reduce((t, d) => t.createIfNotExists(d as never), client.transaction())
      .commit()
    console.log(`Wrote ${toCreate.length} hub landing(s).`)
  }

  if (footerEmpty) {
    await client
      .patch('siteSettings')
      .set({
        footerGuideLinks: FOOTER_LINKS.map((l) => ({
          _key: l.key,
          _type: 'localizedFooterLink',
          href: l.href,
          label: l.label,
        })),
      })
      .commit()
    console.log('Footer guide links written.')
  }
  console.log('Done.')
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
