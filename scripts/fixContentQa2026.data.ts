/**
 * Authored content for `fixContentQa2026.ts`. Facts come ONLY from the DomLivo
 * research knowledge base:
 *  - districts: knowledge-base/03-districts/tirana-districts.md
 *  - buyers/legal FAQ: knowledge-base/07-buyers/buyers.md, 05-legal/legal-guide.md
 * sq written natively (pending native review). Numbers carry cautious "2026"
 * framing per CONTENT-OPS.md.
 */

export type L = { en: string; ru: string; uk: string; sq: string; it: string };

/** Albanian declension forms for city headings (locative after "në", genitive after "e/i/rreth"). */
export const CITY_DECLENSION: Record<string, { locative: string; genitive: string }> = {
  tirana: { locative: 'Tiranë', genitive: 'Tiranës' },
  durres: { locative: 'Durrës', genitive: 'Durrësit' },
  vlore: { locative: 'Vlorë', genitive: 'Vlorës' },
  sarande: { locative: 'Sarandë', genitive: 'Sarandës' },
  himare: { locative: 'Himarë', genitive: 'Himarës' },
  shengjin: { locative: 'Shëngjin', genitive: 'Shëngjinit' },
  shkoder: { locative: 'Shkodër', genitive: 'Shkodrës' },
  berat: { locative: 'Berat', genitive: 'Beratit' },
  elbasan: { locative: 'Elbasan', genitive: 'Elbasanit' },
};

/** Home hero title, sale-focus (replaces the rent-mentioning heading). */
export const HOME_HERO_TITLE: L = {
  en: 'Real estate in Albania — buy an apartment, house or villa',
  ru: 'Недвижимость в Албании — купить квартиру, дом или виллу',
  uk: 'Нерухомість в Албанії — купити квартиру, будинок або віллу',
  sq: 'Pasuri të paluajtshme në Shqipëri — bli apartament, shtëpi ose vilë',
  it: 'Immobili in Albania — compra un appartamento, una casa o una villa',
};

/** Home bottom SEO text, sale-focus (rent paragraphs removed). */
export const HOME_SEO_TEXT: L = {
  en: 'Domlivo helps you buy property in Albania — apartments, houses, villas and commercial space in Tirana, Durrës, Vlorë, Sarandë and along the coast. Listings come directly from owners and trusted agencies, with no buyer commission. Foreign buyers are welcome: non-residents already make up a meaningful share of purchases, and a lawyer plus an independent ASHK (cadastre) extract keep every deal safe.',
  ru: 'Domlivo помогает купить недвижимость в Албании — квартиры, дома, виллы и коммерческие площади в Тиране, Дурресе, Влёре, Саранде и на побережье. Объекты — напрямую от собственников и проверенных агентств, без комиссии с покупателя. Иностранным покупателям мы рады: нерезиденты уже составляют заметную долю сделок, а юрист и независимая выписка из кадастра ASHK делают покупку безопасной.',
  uk: 'Domlivo допомагає купити нерухомість в Албанії — квартири, будинки, вілли та комерційні площі в Тирані, Дурресі, Влері, Саранді та на узбережжі. Об’єкти — напряму від власників і перевірених агенцій, без комісії з покупця. Іноземним покупцям ми раді: нерезиденти вже складають помітну частку угод, а юрист і незалежна виписка з кадастру ASHK роблять купівлю безпечною.',
  sq: 'Domlivo ju ndihmon të blini pronë në Shqipëri — apartamente, shtëpi, vila dhe hapësira tregtare në Tiranë, Durrës, Vlorë, Sarandë dhe përgjatë bregdetit. Listimet vijnë drejtpërdrejt nga pronarët dhe agjencitë e besuara, pa komision për blerësin. Blerësit e huaj janë të mirëpritur: jorezidentët përbëjnë tashmë një pjesë të konsiderueshme të blerjeve, ndërsa një avokat dhe një certifikatë e pavarur e ASHK-së (kadastra) e mbajnë çdo transaksion të sigurt.',
  it: 'Domlivo ti aiuta a comprare casa in Albania — appartamenti, case, ville e spazi commerciali a Tirana, Durazzo, Valona, Saranda e lungo la costa. Gli annunci arrivano direttamente da proprietari e agenzie affidabili, senza commissioni per l’acquirente. Gli acquirenti stranieri sono i benvenuti: i non residenti rappresentano già una quota significativa degli acquisti, e un avvocato più una visura indipendente del catasto ASHK rendono sicura ogni operazione.',
};

/** 10 sale-focus FAQ items. Facts: buyers.md §1/§3/§4, legal-guide.md §1/§3/§5. */
export const HOME_FAQ: Array<{ q: L; a: L }> = [
  {
    q: {
      en: 'Can foreigners buy property in Albania?',
      ru: 'Могут ли иностранцы покупать недвижимость в Албании?',
      uk: 'Чи можуть іноземці купувати нерухомість в Албанії?',
      sq: 'A mund të blejnë të huajt pronë në Shqipëri?',
      it: 'Gli stranieri possono comprare casa in Albania?',
    },
    a: {
      en: 'Yes. Foreigners can freely buy apartments and buildings; only agricultural land is restricted (usually held through a locally registered company). Non-residents already account for roughly 15–25% of purchases across the country, most of them EU citizens.',
      ru: 'Да. Иностранцы свободно покупают квартиры и здания; ограничена только сельхозземля (обычно оформляется через местную компанию). Нерезиденты уже составляют примерно 15–25% сделок по стране, большинство — граждане ЕС.',
      uk: 'Так. Іноземці вільно купують квартири та будівлі; обмежена лише сільгоспземля (зазвичай оформлюється через місцеву компанію). Нерезиденти вже складають приблизно 15–25% угод у країні, більшість — громадяни ЄС.',
      sq: 'Po. Të huajt mund të blejnë lirisht apartamente dhe ndërtesa; e kufizuar është vetëm toka bujqësore (zakonisht mbahet përmes një kompanie të regjistruar në vend). Jorezidentët përbëjnë tashmë rreth 15–25% të blerjeve në vend, shumica qytetarë të BE-së.',
      it: 'Sì. Gli stranieri possono comprare liberamente appartamenti ed edifici; solo i terreni agricoli sono soggetti a restrizioni (di solito tramite una società registrata localmente). I non residenti rappresentano già circa il 15–25% degli acquisti nel Paese, per lo più cittadini UE.',
    },
  },
  {
    q: {
      en: 'What are the transaction costs when buying?',
      ru: 'Какие расходы по сделке при покупке?',
      uk: 'Які витрати на угоду при купівлі?',
      sq: 'Cilat janë kostot e transaksionit gjatë blerjes?',
      it: 'Quali sono i costi di transazione all’acquisto?',
    },
    a: {
      en: 'Plan for roughly 3–4% of the price in transaction costs: notary about 0.35% (min 3,000 lek, capped near 150,000 lek), ASHK registration 5,000 lek, agent about 1% from the buyer, an independent lawyer €500–2,000, and a sworn translator €50–150 if needed.',
      ru: 'Закладывайте примерно 3–4% от цены: нотариус около 0,35% (мин. 3 000 лек, потолок ~150 000 лек), регистрация ASHK 5 000 лек, риэлтор около 1% с покупателя, независимый юрист €500–2 000 и присяжный переводчик €50–150 при необходимости.',
      uk: 'Закладайте приблизно 3–4% від ціни: нотаріус близько 0,35% (мін. 3 000 лек, стеля ~150 000 лек), реєстрація ASHK 5 000 лек, ріелтор близько 1% з покупця, незалежний юрист €500–2 000 та присяжний перекладач €50–150 за потреби.',
      sq: 'Llogaritni rreth 3–4% të çmimit si kosto transaksioni: noteri rreth 0,35% (min. 3.000 lekë, tavan afër 150.000 lekë), regjistrimi në ASHK 5.000 lekë, agjenti rreth 1% nga blerësi, një avokat i pavarur 500–2.000 € dhe një përkthyes zyrtar 50–150 € nëse duhet.',
      it: 'Prevedi circa il 3–4% del prezzo in costi: notaio circa 0,35% (min 3.000 lek, tetto ~150.000 lek), registrazione ASHK 5.000 lek, agente circa 1% dall’acquirente, un avvocato indipendente 500–2.000 € e un traduttore giurato 50–150 € se necessario.',
    },
  },
  {
    q: {
      en: 'Which documents should I check before buying?',
      ru: 'Какие документы проверить перед покупкой?',
      uk: 'Які документи перевірити перед купівлею?',
      sq: 'Cilat dokumente duhet të kontrolloj para blerjes?',
      it: 'Quali documenti controllare prima di comprare?',
    },
    a: {
      en: 'Check the property card (kartela e pasurisë) and cadastre extract from ASHK, any encumbrances, the indicative map (harta treguese) and the title history. Get an independent lawyer and pull your own ASHK/e-Albania extract — no extract, no money transfer.',
      ru: 'Проверьте карточку объекта (kartela e pasurisë) и выписку кадастра ASHK, обременения, ситуационную карту (harta treguese) и историю титула. Возьмите независимого юриста и получите собственную выписку ASHK/e-Albania — нет выписки, нет перевода денег.',
      uk: 'Перевірте картку об’єкта (kartela e pasurisë) та виписку кадастру ASHK, обтяження, ситуаційну карту (harta treguese) й історію титулу. Візьміть незалежного юриста та отримайте власну виписку ASHK/e-Albania — немає виписки, немає переказу грошей.',
      sq: 'Kontrolloni kartelën e pasurisë dhe certifikatën e kadastrës nga ASHK, barrët hipotekore, hartën treguese dhe historikun e titullit. Merrni një avokat të pavarur dhe siguroni vetë certifikatën ASHK/e-Albania — pa certifikatë, pa transfertë parash.',
      it: 'Controlla la scheda dell’immobile (kartela e pasurisë) e la visura catastale ASHK, eventuali gravami, la mappa indicativa (harta treguese) e la storia del titolo. Prendi un avvocato indipendente e ottieni tu stesso la visura ASHK/e-Albania — niente visura, niente bonifico.',
    },
  },
  {
    q: {
      en: 'Do I need a lawyer?',
      ru: 'Нужен ли юрист?',
      uk: 'Чи потрібен юрист?',
      sq: 'A më duhet avokat?',
      it: 'Serve un avvocato?',
    },
    a: {
      en: 'A lawyer is not required by law, but it is strongly recommended: an independent title check is the single most effective protection against cadastre, inheritance and unregistered-construction problems. The typical fee is €500–2,000.',
      ru: 'Юрист не обязателен по закону, но настоятельно рекомендуется: независимая проверка титула — самая эффективная защита от проблем с кадастром, наследниками и самостроем. Обычная стоимость — €500–2 000.',
      uk: 'Юрист не обов’язковий за законом, але наполегливо рекомендований: незалежна перевірка титулу — найефективніший захист від проблем із кадастром, спадкоємцями та самобудом. Звичайна вартість — €500–2 000.',
      sq: 'Avokati nuk kërkohet me ligj, por rekomandohet fort: kontrolli i pavarur i titullit është mbrojtja më efektive ndaj problemeve me kadastrën, trashëgimtarët dhe ndërtimet pa leje. Tarifa tipike është 500–2.000 €.',
      it: 'L’avvocato non è obbligatorio per legge, ma è vivamente consigliato: una verifica indipendente del titolo è la protezione più efficace contro problemi di catasto, eredi e costruzioni non registrate. La parcella tipica è 500–2.000 €.',
    },
  },
  {
    q: {
      en: 'How long does a purchase take?',
      ru: 'Сколько времени занимает покупка?',
      uk: 'Скільки часу займає купівля?',
      sq: 'Sa zgjat një blerje?',
      it: 'Quanto dura un acquisto?',
    },
    a: {
      en: 'A deposit (kaparo) is followed by 2–4 weeks of due diligence, the notarial deed, and ASHK registration. The full cycle usually runs 2–8 weeks with clean documents — fast by European standards — and a power of attorney is possible if you cannot attend.',
      ru: 'После задатка (kaparo) идёт 2–4 недели проверки, нотариальный договор и регистрация в ASHK. Полный цикл при чистых документах — обычно 2–8 недель, быстро по европейским меркам; возможна сделка по доверенности.',
      uk: 'Після завдатку (kaparo) — 2–4 тижні перевірки, нотаріальний договір і реєстрація в ASHK. Повний цикл за чистих документів — зазвичай 2–8 тижнів, швидко за європейськими мірками; можлива угода за довіреністю.',
      sq: 'Pas kaparit vijnë 2–4 javë kontroll, akti noterial dhe regjistrimi në ASHK. Cikli i plotë me dokumente të pastra zgjat zakonisht 2–8 javë — i shpejtë sipas standardeve evropiane — dhe mund të veprohet me prokurë nëse nuk jeni të pranishëm.',
      it: 'Dopo la caparra (kaparo) seguono 2–4 settimane di due diligence, l’atto notarile e la registrazione ASHK. Il ciclo completo con documenti in ordine dura di solito 2–8 settimane — rapido per gli standard europei — ed è possibile agire con procura.',
    },
  },
  {
    q: {
      en: 'Can a foreigner get a mortgage in Albania?',
      ru: 'Может ли иностранец взять ипотеку в Албании?',
      uk: 'Чи може іноземець взяти іпотеку в Албанії?',
      sq: 'A mund të marrë një i huaj kredi hipotekore në Shqipëri?',
      it: 'Uno straniero può ottenere un mutuo in Albania?',
    },
    a: {
      en: 'Mortgages are nearly unavailable to non-residents, so most foreign buyers pay cash or use a developer’s 0% installment plan until handover — a standard closing tool. Residents can borrow at roughly 3.5–5.5% on EUR loans (2026), subject to Bank of Albania limits.',
      ru: 'Ипотека почти недоступна нерезидентам, поэтому большинство иностранцев платят наличными или используют беспроцентную рассрочку от застройщика до сдачи — стандартный инструмент. Резиденты берут примерно под 3,5–5,5% в евро (2026) с учётом лимитов Банка Албании.',
      uk: 'Іпотека майже недоступна нерезидентам, тож більшість іноземців платять готівкою або беруть безвідсоткову розстрочку від забудовника до здачі — стандартний інструмент. Резиденти позичають приблизно під 3,5–5,5% у євро (2026) з урахуванням лімітів Банку Албанії.',
      sq: 'Kredia hipotekore është pothuajse e paarritshme për jorezidentët, ndaj shumica e blerësve të huaj paguajnë kesh ose përdorin këstet 0% të ndërtuesit deri në dorëzim — mjet standard. Rezidentët marrin hua rreth 3,5–5,5% për kreditë në euro (2026), sipas limiteve të Bankës së Shqipërisë.',
      it: 'Il mutuo è quasi inaccessibile ai non residenti, quindi la maggior parte degli acquirenti stranieri paga in contanti o usa il piano a rate 0% del costruttore fino alla consegna — uno strumento standard. I residenti ottengono circa 3,5–5,5% sui prestiti in euro (2026), nei limiti della Banca d’Albania.',
    },
  },
  {
    q: {
      en: 'What taxes apply to property?',
      ru: 'Какие налоги на недвижимость?',
      uk: 'Які податки на нерухомість?',
      sq: 'Cilat taksa zbatohen për pronën?',
      it: 'Quali tasse si applicano agli immobili?',
    },
    a: {
      en: 'Rental income is taxed at 15% (both long- and short-term from 2026). The annual property tax is about 0.05% of the fiscal value for housing. Capital gains on a sale by an individual are taxed at 15%. Always confirm the current figures with your notary or lawyer.',
      ru: 'Доход от аренды облагается 15% (и долгосрочная, и краткосрочная с 2026). Ежегодный налог на жильё — около 0,05% фискальной стоимости. Прирост капитала при продаже физлицом — 15%. Актуальные цифры уточняйте у нотариуса или юриста.',
      uk: 'Дохід від оренди оподатковується 15% (і довгострокова, і короткострокова з 2026). Щорічний податок на житло — близько 0,05% фіскальної вартості. Приріст капіталу при продажу фізособою — 15%. Актуальні цифри уточнюйте в нотаріуса чи юриста.',
      sq: 'Të ardhurat nga qiraja tatohen 15% (afatgjatë dhe afatshkurtër që nga 2026). Taksa vjetore për banesat është rreth 0,05% e vlerës fiskale. Fitimi kapital nga shitja prej një individi tatohet 15%. Konfirmoni gjithmonë shifrat aktuale me noterin ose avokatin.',
      it: 'Il reddito da locazione è tassato al 15% (sia lungo sia breve termine dal 2026). L’imposta annuale sulla casa è circa lo 0,05% del valore fiscale. La plusvalenza sulla vendita da parte di un privato è tassata al 15%. Verifica sempre i valori aggiornati con notaio o avvocato.',
    },
  },
  {
    q: {
      en: 'How do I protect myself when buying off-plan?',
      ru: 'Как обезопасить себя при покупке на котловане?',
      uk: 'Як убезпечити себе при купівлі на котловані?',
      sq: 'Si të mbrohem kur blej në fazë projekti (off-plan)?',
      it: 'Come proteggermi comprando su carta (off-plan)?',
    },
    a: {
      en: 'Albania has no escrow, so off-plan money goes straight to the developer. Prefer completed units with a registered title, check the developer’s track record, and make sure a kontrata porosie is registered with ASHK (mandatory since 2024). When in doubt, buy finished.',
      ru: 'Эскроу в Албании нет, деньги за котлован идут напрямую застройщику. Предпочитайте готовое с зарегистрированным титулом, проверяйте репутацию застройщика и убедитесь, что kontrata porosie зарегистрирован в ASHK (обязательно с 2024). Сомневаетесь — берите готовое.',
      uk: 'Ескроу в Албанії немає, гроші за котлован ідуть напряму забудовнику. Віддавайте перевагу готовому із зареєстрованим титулом, перевіряйте репутацію забудовника та переконайтеся, що kontrata porosie зареєстрований в ASHK (обов’язково з 2024). Сумніваєтесь — беріть готове.',
      sq: 'Shqipëria nuk ka llogari escrow, ndaj paratë për off-plan shkojnë drejt te ndërtuesi. Preferoni njësi të përfunduara me titull të regjistruar, kontrolloni historikun e ndërtuesit dhe sigurohuni që kontrata e porosisë të jetë regjistruar në ASHK (e detyrueshme që nga 2024). Në dyshim, blini të përfunduar.',
      it: 'L’Albania non ha deposito a garanzia (escrow), quindi i soldi dell’off-plan vanno direttamente al costruttore. Preferisci unità già completate con titolo registrato, verifica lo storico del costruttore e assicurati che la kontrata porosie sia registrata all’ASHK (obbligatoria dal 2024). Nel dubbio, compra finito.',
    },
  },
  {
    q: {
      en: 'Is Albanian property a good investment?',
      ru: 'Выгодно ли инвестировать в недвижимость Албании?',
      uk: 'Чи вигідно інвестувати в нерухомість Албанії?',
      sq: 'A është investim i mirë prona në Shqipëri?',
      it: 'Comprare in Albania è un buon investimento?',
    },
    a: {
      en: 'It can be, but use conservative numbers. Coastal rental income is seasonal, while Tirana’s centre has strong year-round demand. Model the yield honestly with our ROI calculator, budget the 3–4% transaction costs, and treat any promised “10–16%” return with caution.',
      ru: 'Может быть, но считайте консервативно. Доход от аренды на побережье сезонный, а в центре Тираны спрос круглогодичный. Честно моделируйте доходность нашим ROI-калькулятором, закладывайте 3–4% расходов по сделке и осторожно относитесь к обещаниям «10–16%».',
      uk: 'Може бути, але рахуйте консервативно. Дохід від оренди на узбережжі сезонний, а в центрі Тирани попит цілорічний. Чесно моделюйте дохідність нашим ROI-калькулятором, закладайте 3–4% витрат на угоду й обережно ставтеся до обіцянок «10–16%».',
      sq: 'Mund të jetë, por përdorni shifra konservatore. Të ardhurat nga qiraja bregdetare janë sezonale, ndërsa qendra e Tiranës ka kërkesë të fortë gjatë gjithë vitit. Modeloni rendimentin me ndershmëri me kalkulatorin tonë ROI, parashikoni 3–4% kosto transaksioni dhe trajtoni me kujdes çdo premtim “10–16%”.',
      it: 'Può esserlo, ma usa numeri prudenti. Il reddito da locazione sulla costa è stagionale, mentre il centro di Tirana ha una domanda forte tutto l’anno. Modella il rendimento con onestà tramite il nostro calcolatore ROI, considera il 3–4% di costi e tratta con cautela qualsiasi rendimento promesso del “10–16%”.',
    },
  },
  {
    q: {
      en: 'How do I get help choosing a property?',
      ru: 'Как получить помощь в выборе объекта?',
      uk: 'Як отримати допомогу у виборі об’єкта?',
      sq: 'Si të marr ndihmë për të zgjedhur një pronë?',
      it: 'Come ricevo aiuto nella scelta di un immobile?',
    },
    a: {
      en: 'Send us a request through the contact form and our team will reply with options that match your budget and goals. Listings on Domlivo come directly from owners and trusted agencies, with no buyer commission, so you talk to the right people from the start.',
      ru: 'Отправьте заявку через форму контакта, и наша команда ответит с вариантами под ваш бюджет и цели. Объекты на Domlivo — напрямую от собственников и проверенных агентств, без комиссии с покупателя, так что вы сразу общаетесь с нужными людьми.',
      uk: 'Надішліть запит через форму контакту, і наша команда відповість із варіантами під ваш бюджет і цілі. Об’єкти на Domlivo — напряму від власників і перевірених агенцій, без комісії з покупця, тож ви одразу спілкуєтеся з потрібними людьми.',
      sq: 'Na dërgoni një kërkesë përmes formularit të kontaktit dhe ekipi ynë do t’ju përgjigjet me opsione që përputhen me buxhetin dhe qëllimet tuaja. Listimet në Domlivo vijnë drejtpërdrejt nga pronarët dhe agjencitë e besuara, pa komision për blerësin, kështu që flisni me njerëzit e duhur që në fillim.',
      it: 'Inviaci una richiesta tramite il modulo di contatto e il nostro team ti risponderà con opzioni adatte al tuo budget e ai tuoi obiettivi. Gli annunci su Domlivo arrivano direttamente da proprietari e agenzie affidabili, senza commissioni per l’acquirente, così parli subito con le persone giuste.',
    },
  },
];
