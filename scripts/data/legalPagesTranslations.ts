/**
 * `uk`, `sq`, `it` and `pl` for the privacy policy and terms of use.
 *
 * Translated by hand, not by the translator script — a mistranslated obligation
 * or right is a different class of error from a mistranslated marketing line,
 * and these were written rather than generated. `translateLegalPages.ts` is
 * gone for the same reason.
 *
 * Rules held to throughout:
 *  - every identifier is carried verbatim: Domlivo, Vercel, Sanity, Telegram,
 *    Anthropic, Google Tag Manager, Google Analytics 4, Microsoft Clarity,
 *    GTM-T27ZZ289, x4l0dctgle, NEXT_LOCALE, favorites, catalogViewMode,
 *    domlivo:ai-chat, hello@domlivo.com, idp.al, HTTPS, Consent Mode v2
 *  - `TODO(legal)` lines stay in English, so the three unfilled facts are
 *    equally visible in every locale
 *  - block count and shape match `legalPages.ts` exactly; the applier checks
 *
 * Albanian matters most of the six: it is the jurisdiction the policy names.
 *
 * Still not legal advice, and still unreviewed by a lawyer.
 */

import type {LegalBlock} from './legalPages'

export type TranslatedLocale = 'uk' | 'sq' | 'it' | 'pl'

export const PRIVACY_TITLES: Record<TranslatedLocale, string> = {
  uk: 'Політика конфіденційності',
  sq: 'Politika e privatësisë',
  it: 'Informativa sulla privacy',
  pl: 'Polityka prywatności',
}

export const TERMS_TITLES: Record<TranslatedLocale, string> = {
  uk: 'Умови користування',
  sq: 'Kushtet e përdorimit',
  it: 'Termini di utilizzo',
  pl: 'Warunki korzystania',
}

export const PRIVACY_META: Record<TranslatedLocale, string> = {
  uk: 'Що Domlivo робить з персональними даними: що збирають форми, куди йдуть заявки, яка аналітика вмикається лише після згоди та як реалізувати свої права.',
  sq: 'Çfarë bën Domlivo me të dhënat personale: çfarë mbledhin formularët, ku shkojnë kërkesat, cila analitikë ndizet vetëm pas pëlqimit dhe si t’i ushtroni të drejtat tuaja.',
  it: 'Cosa fa Domlivo con i dati personali: cosa raccolgono i moduli, dove arrivano le richieste, quali strumenti di analisi si attivano solo dopo il consenso e come esercitare i propri diritti.',
  pl: 'Co Domlivo robi z danymi osobowymi: co zbierają formularze, dokąd trafiają zgłoszenia, która analityka włącza się dopiero po zgodzie i jak skorzystać ze swoich praw.',
}

export const TERMS_META: Record<TranslatedLocale, string> = {
  uk: 'Умови користування Domlivo: що таке каталог, чому оголошення не є договором, що перевірити до оплати та які межі нашої відповідальності.',
  sq: 'Kushtet e përdorimit të Domlivo: çfarë është katalogu, pse një shpallje nuk është kontratë, çfarë të verifikoni para se të paguani dhe cilat janë kufijtë e përgjegjësisë sonë.',
  it: 'I termini d’uso di Domlivo: che cos’è il catalogo, perché un annuncio non è un contratto, cosa verificare prima di pagare e quali sono i limiti della nostra responsabilità.',
  pl: 'Warunki korzystania z Domlivo: czym jest katalog, dlaczego ogłoszenie nie jest umową, co sprawdzić przed zapłatą i jakie są granice naszej odpowiedzialności.',
}

export const PRIVACY_BODY: Record<TranslatedLocale, LegalBlock[]> = {
  uk: [
    {paragraphs: ['Останнє оновлення: 10 вересня 2026 року.']},
    {
      heading: 'Хто ми',
      paragraphs: [
        'Domlivo (domlivo.com) публікує оголошення про нерухомість в Албанії. Ця політика описує, що сайт насправді робить з персональними даними — у термінах того, як він побудований, а не загальними словами.',
        'З будь-якого питання за цією політикою пишіть на hello@domlivo.com.',
        'TODO(legal): the registered entity operating this site, its registration number and registered address belong here.',
      ],
    },
    {
      heading: 'Що ми збираємо',
      paragraphs: ['Персональні дані ви передаєте нам лише за власним рішенням:'],
      bullets: [
        'Форми звернень — ім’я, номер телефону, адреса електронної пошти та повідомлення, а також сторінка, з якої надіслано звернення. Віджет зворотного дзвінка запитує лише номер телефону.',
        'Реєстрація агентств і ріелторів — ім’я, номер телефону та адреса електронної пошти.',
        'ШІ-асистент — усе, що ви в ньому напишете.',
      ],
    },
    {
      paragraphs: ['Невеликий обсяг технічних даних сайт обробляє самостійно:'],
      bullets: [
        'Підрахунок переглядів — ваша IP-адреса використовується як короткочасний ключ, щоб один відвідувач не був зарахований двічі протягом півгодини. Вона зберігається лише в оперативній пам’яті сервера, нікуди не записується, а зберігається в підсумку тільки число.',
        'Аналітика — лише якщо ви погодилися в банері cookie. Див. нижче.',
      ],
    },
    {
      heading: 'Куди надходять заявки',
      paragraphs: [
        'Надіслана форма приходить нашій команді повідомленням у Telegram. До бази даних сайту вона не записується, тож дані живуть у цьому чаті й більше ніде тут.',
        'TODO(legal): state a definite retention period for those messages and delete on that schedule.',
      ],
    },
    {
      heading: 'Аналітика та запис сесій',
      paragraphs: ['Якщо — і лише якщо — ви прийняли аналітику в банері cookie, сайт підключає:'],
      bullets: [
        'Google Tag Manager і Google Analytics 4 (контейнер GTM-T27ZZ289) — агрегований вимір трафіку.',
        'Microsoft Clarity (проєкт x4l0dctgle) — теплові карти та запис сесій. Clarity записує, як ви рухаєте курсором і клікаєте; те, що ви вводите в поля форм, він не записує.',
      ],
    },
    {
      paragraphs: [
        'До вашої згоди Google Consent Mode v2 перебуває в положенні denied, і жоден із інструментів нічого не отримує. Відмова нічого не змінює в роботі сайту для вас, а рішення можна змінити пізніше за посиланням про cookie в підвалі.',
      ],
    },
    {
      heading: 'Що зберігається у вашому браузері',
      bullets: [
        'NEXT_LOCALE — мова, якою ви читаєте.',
        'Запис про згоду — які категорії ви прийняли.',
        'Валюта — валюта, обрана для цін.',
        'favorites — збережені вами об’єкти. Ці дані не залишають браузер.',
        'catalogViewMode — список чи плитка.',
        'domlivo:ai-chat — ваше листування з асистентом, у session storage; браузер видаляє його, коли ви закриваєте вкладку.',
      ],
    },
    {
      heading: 'Хто ще обробляє дані',
      bullets: [
        'Vercel — хостинг. Віддає кожну сторінку й тому обробляє дані запитів.',
        'Sanity — система керування контентом, з якої публікуються оголошення.',
        'Telegram — доставляє заявки нашій команді.',
        'Anthropic — отримує ваші повідомлення асистентові, щоб на них відповісти.',
        'Google і Microsoft — аналітика та запис сесій, лише за вашої згоди.',
      ],
    },
    {paragraphs: ['Ми не продаємо персональні дані й не передаємо їх для реклами.']},
    {
      heading: 'Передавання за межі Албанії та ЄЕЗ',
      paragraphs: [
        'Частина перелічених постачальників працює зі США. Там, куди персональні дані до них потрапляють, передавання спирається на стандартні договірні положення Європейської комісії або рівнозначну гарантію, запропоновану постачальником.',
      ],
    },
    {
      heading: 'Ваші права',
      paragraphs: [
        'Ви можете запитати копію своїх даних, вимагати їх виправити або видалити, обмежити їх обробку чи заперечити проти неї. Згоду на аналітику можна відкликати будь-коли. Напишіть на hello@domlivo.com — ми відповімо.',
        'Якщо наша відповідь вас не задовольнить, ви маєте право поскаржитися Комісару з права на інформацію та захисту персональних даних Албанії (idp.al). Якщо ви перебуваєте в Європейському Союзі — наглядовому органу своєї країни.',
      ],
    },
    {
      heading: 'Безпека',
      paragraphs: [
        'Сайт віддається через HTTPS, заявки передаються шифрованим з’єднанням. Доступ до системи керування контентом і до чату, куди надходять звернення, обмежений тими, кому він потрібен для роботи.',
      ],
    },
    {
      heading: 'Діти',
      paragraphs: ['Сайт не адресований дітям, і ми свідомо не збираємо дані про них.'],
    },
    {
      heading: 'Зміни',
      paragraphs: [
        'Ми оновлюємо цю сторінку, коли сайт змінює те, що робить із даними. Дата вгорі — коли це сталося востаннє.',
      ],
    },
  ],

  sq: [
    {paragraphs: ['Përditësuar për herë të fundit: 10 shtator 2026.']},
    {
      heading: 'Kush jemi',
      paragraphs: [
        'Domlivo (domlivo.com) publikon shpallje pronash në Shqipëri. Kjo politikë përshkruan çfarë bën në të vërtetë faqja me të dhënat personale — në terma konkretë të mënyrës se si është ndërtuar, jo me fjalë të përgjithshme.',
        'Për çdo çështje që lidhet me këtë politikë, na shkruani në hello@domlivo.com.',
        'TODO(legal): the registered entity operating this site, its registration number and registered address belong here.',
      ],
    },
    {
      heading: 'Çfarë mbledhim',
      paragraphs: ['Të dhëna personale na jepni vetëm kur vendosni ju:'],
      bullets: [
        'Formularët e kontaktit dhe të kërkesave — emri, numri i telefonit, adresa e email-it dhe mesazhi juaj, bashkë me faqen nga e cila e dërguat. Widget-i i telefonatës kthyese kërkon vetëm numrin e telefonit.',
        'Regjistrimi i agjencive dhe agjentëve — emri, numri i telefonit dhe adresa e email-it.',
        'Asistenti me inteligjencë artificiale — çfarëdo që shkruani në të.',
      ],
    },
    {
      paragraphs: ['Një sasi e vogël të dhënash teknike përpunohet nga vetë faqja:'],
      bullets: [
        'Numërimi i shikimeve — adresa juaj IP përdoret si çelës jetëshkurtër që një vizitor të mos numërohet dy herë brenda gjysmë ore. Ajo mbahet vetëm në memorien e serverit, nuk shkruhet askund dhe ajo që ruhet në fund është një numër.',
        'Analitika — vetëm nëse e pranoni te banderola e cookie-ve. Shihni më poshtë.',
      ],
    },
    {
      heading: 'Ku shkojnë kërkesat nga formularët',
      paragraphs: [
        'Një formular i dërguar i vjen ekipit tonë si mesazh në Telegram. Ai nuk shkruhet në asnjë bazë të dhënash të kësaj faqeje, prandaj të dhënat rrojnë në atë bisedë dhe askund tjetër këtu.',
        'TODO(legal): state a definite retention period for those messages and delete on that schedule.',
      ],
    },
    {
      heading: 'Analitika dhe regjistrimi i sesioneve',
      paragraphs: ['Nëse — dhe vetëm nëse — pranoni analitikën te banderola e cookie-ve, faqja ngarkon:'],
      bullets: [
        'Google Tag Manager dhe Google Analytics 4 (kontejneri GTM-T27ZZ289) — matje e përgjithshme e trafikut.',
        'Microsoft Clarity (projekti x4l0dctgle) — harta nxehtësie dhe regjistrim sesionesh. Clarity regjistron si e lëvizni kursorin dhe ku klikoni; atë që shkruani në fushat e formularëve nuk e regjistron.',
      ],
    },
    {
      paragraphs: [
        'Deri sa të jepni pëlqimin, Google Consent Mode v2 qëndron në gjendjen denied dhe asnjë prej këtyre mjeteve nuk merr asgjë. Refuzimi nuk ndryshon asgjë në mënyrën si funksionon faqja për ju, dhe zgjedhjen mund ta ndryshoni më vonë nga lidhja për cookie-t në fund të faqes.',
      ],
    },
    {
      heading: 'Çfarë ruhet në shfletuesin tuaj',
      bullets: [
        'NEXT_LOCALE — gjuha në të cilën po lexoni.',
        'Regjistrimi i pëlqimit — cilat kategori keni pranuar.',
        'Monedha — monedha që zgjodhët për çmimet.',
        'favorites — pronat që ruajtët. Këto nuk dalin kurrë nga shfletuesi juaj.',
        'catalogViewMode — nëse preferoni listën apo rrjetën.',
        'domlivo:ai-chat — biseda juaj me asistentin, në session storage, të cilën shfletuesi e fshin kur mbyllni skedën.',
      ],
    },
    {
      heading: 'Kush tjetër i përpunon të dhënat',
      bullets: [
        'Vercel — strehimi. Shërben çdo faqe dhe për këtë arsye përpunon të dhënat e kërkesave.',
        'Sanity — sistemi i përmbajtjes nga i cili publikohen shpalljet.',
        'Telegram — përcjell kërkesat te ekipi ynë.',
        'Anthropic — merr mesazhet tuaja drejtuar asistentit për t’u përgjigjur.',
        'Google dhe Microsoft — analitikë dhe regjistrim sesionesh, vetëm me pëlqimin tuaj.',
      ],
    },
    {paragraphs: ['Ne nuk i shesim të dhënat personale dhe nuk i ndajmë ato për reklama.']},
    {
      heading: 'Transferimet jashtë Shqipërisë dhe ZEE-së',
      paragraphs: [
        'Disa nga ofruesit e mësipërm veprojnë nga Shtetet e Bashkuara. Aty ku të dhënat personale mbërrijnë tek ata, transferimi mbështetet në klauzolat standarde kontraktuale të Komisionit Evropian ose në një garanci të njëvlershme të ofruar prej tyre.',
      ],
    },
    {
      heading: 'Të drejtat tuaja',
      paragraphs: [
        'Mund të kërkoni një kopje të të dhënave tuaja, të kërkoni korrigjimin ose fshirjen e tyre, të kërkoni kufizimin e përpunimit ose të kundërshtoni atë. Pëlqimin për analitikën mund ta tërhiqni në çdo kohë. Na shkruani në hello@domlivo.com dhe do t’ju përgjigjemi.',
        'Nëse përgjigjja jonë nuk ju kënaq, mund të ankoheni te Komisioneri për të Drejtën e Informimit dhe Mbrojtjen e të Dhënave Personale në Shqipëri (idp.al). Nëse ndodheni në Bashkimin Evropian, mund të ankoheni te autoriteti mbikëqyrës i vendit tuaj.',
      ],
    },
    {
      heading: 'Siguria',
      paragraphs: [
        'Faqja shërbehet me HTTPS dhe kërkesat nga formularët udhëtojnë përmes lidhjeve të enkriptuara. Aksesi në sistemin e përmbajtjes dhe në bisedën ku mbërrijnë kërkesat është i kufizuar te personat që e kanë të nevojshëm.',
      ],
    },
    {
      heading: 'Fëmijët',
      paragraphs: [
        'Faqja nuk u drejtohet fëmijëve dhe ne nuk mbledhim me vetëdije të dhëna për ta.',
      ],
    },
    {
      heading: 'Ndryshimet',
      paragraphs: [
        'Këtë faqe e përditësojmë kur faqja ndryshon atë që bën me të dhënat. Data në krye tregon kur ka ndryshuar për herë të fundit.',
      ],
    },
  ],

  it: [
    {paragraphs: ['Ultimo aggiornamento: 10 settembre 2026.']},
    {
      heading: 'Chi siamo',
      paragraphs: [
        'Domlivo (domlivo.com) pubblica annunci immobiliari in Albania. Questa informativa descrive che cosa fa davvero il sito con i dati personali, nei termini concreti di come è costruito e non in termini generici.',
        'Per qualsiasi questione relativa a questa informativa, scriveteci a hello@domlivo.com.',
        'TODO(legal): the registered entity operating this site, its registration number and registered address belong here.',
      ],
    },
    {
      heading: 'Quali dati raccogliamo',
      paragraphs: ['Ci fornite dati personali solo quando scegliete di farlo:'],
      bullets: [
        'Moduli di contatto e richiesta — nome, numero di telefono, indirizzo email e messaggio, insieme alla pagina da cui li avete inviati. Il widget di richiamata chiede soltanto il numero di telefono.',
        'Registrazione di agenzie e agenti — nome, numero di telefono e indirizzo email.',
        'L’assistente con intelligenza artificiale — tutto ciò che vi scrivete dentro.',
      ],
    },
    {
      paragraphs: ['Il sito tratta da sé una piccola quantità di dati tecnici:'],
      bullets: [
        'Conteggio delle visualizzazioni — il vostro indirizzo IP viene usato come chiave temporanea perché uno stesso visitatore non venga contato due volte nell’arco di mezz’ora. Resta solo nella memoria del server, non viene mai scritto su disco e ciò che viene conservato è un numero.',
        'Analytics — solo se lo accettate nel banner dei cookie. Vedi sotto.',
      ],
    },
    {
      heading: 'Dove arrivano i moduli inviati',
      paragraphs: [
        'Un modulo inviato arriva al nostro team come messaggio Telegram. Non viene scritto in alcun database di questo sito, quindi i dati vivono in quella conversazione e in nessun altro punto qui.',
        'TODO(legal): state a definite retention period for those messages and delete on that schedule.',
      ],
    },
    {
      heading: 'Analytics e registrazione delle sessioni',
      paragraphs: ['Se — e soltanto se — accettate gli analytics nel banner dei cookie, il sito carica:'],
      bullets: [
        'Google Tag Manager e Google Analytics 4 (contenitore GTM-T27ZZ289) — misurazione aggregata del traffico.',
        'Microsoft Clarity (progetto x4l0dctgle) — mappe di calore e registrazione delle sessioni. Clarity registra come muovete il puntatore e dove cliccate; non registra ciò che digitate nei campi dei moduli.',
      ],
    },
    {
      paragraphs: [
        'Finché non accettate, Google Consent Mode v2 resta su denied e nessuno dei due strumenti riceve alcunché. Il rifiuto non cambia nulla nel funzionamento del sito per voi, e la scelta si può modificare in seguito dal link sui cookie nel piè di pagina.',
      ],
    },
    {
      heading: 'Che cosa viene salvato nel vostro browser',
      bullets: [
        'NEXT_LOCALE — la lingua in cui state leggendo.',
        'La registrazione del consenso — quali categorie avete accettato.',
        'Valuta — la valuta scelta per i prezzi.',
        'favorites — gli annunci che avete salvato. Non escono mai dal vostro browser.',
        'catalogViewMode — se preferite l’elenco o la griglia.',
        'domlivo:ai-chat — la vostra conversazione con l’assistente, nel session storage, che il browser elimina alla chiusura della scheda.',
      ],
    },
    {
      heading: 'Chi altro tratta i dati',
      bullets: [
        'Vercel — hosting. Serve ogni pagina e quindi tratta i dati delle richieste.',
        'Sanity — il sistema di contenuti da cui vengono pubblicati gli annunci.',
        'Telegram — recapita al nostro team le richieste inviate dai moduli.',
        'Anthropic — riceve i vostri messaggi all’assistente per potervi rispondere.',
        'Google e Microsoft — analytics e registrazione delle sessioni, solo con il vostro consenso.',
      ],
    },
    {paragraphs: ['Non vendiamo dati personali e non li condividiamo a fini pubblicitari.']},
    {
      heading: 'Trasferimenti fuori dall’Albania e dallo SEE',
      paragraphs: [
        'Diversi dei fornitori citati operano dagli Stati Uniti. Laddove dati personali li raggiungano, il trasferimento si fonda sulle clausole contrattuali tipo della Commissione europea o su una garanzia equivalente offerta dal fornitore.',
      ],
    },
    {
      heading: 'I vostri diritti',
      paragraphs: [
        'Potete chiedere una copia dei vostri dati, chiederne la rettifica o la cancellazione, chiedere la limitazione del trattamento oppure opporvi ad esso. Potete revocare in qualsiasi momento il consenso agli analytics. Scrivete a hello@domlivo.com e vi risponderemo.',
        'Se la nostra risposta non vi soddisfa, potete rivolgervi al Commissario per il diritto all’informazione e la protezione dei dati personali in Albania (idp.al). Se vi trovate nell’Unione europea, potete rivolgervi all’autorità di controllo del vostro Paese.',
      ],
    },
    {
      heading: 'Sicurezza',
      paragraphs: [
        'Il sito è servito su HTTPS e i moduli inviati viaggiano su connessioni cifrate. L’accesso al sistema di contenuti e alla conversazione che riceve le richieste è limitato alle persone che ne hanno bisogno.',
      ],
    },
    {
      heading: 'Minori',
      paragraphs: [
        'Il sito non è rivolto ai minori e non raccogliamo consapevolmente dati che li riguardino.',
      ],
    },
    {
      heading: 'Modifiche',
      paragraphs: [
        'Aggiorniamo questa pagina quando il sito cambia ciò che fa con i dati. La data in alto indica l’ultima modifica.',
      ],
    },
  ],

  pl: [
    {paragraphs: ['Ostatnia aktualizacja: 10 września 2026 r.']},
    {
      heading: 'Kim jesteśmy',
      paragraphs: [
        'Domlivo (domlivo.com) publikuje ogłoszenia nieruchomości w Albanii. Ta polityka opisuje, co serwis rzeczywiście robi z danymi osobowymi — w konkretnych kategoriach tego, jak jest zbudowany, a nie ogólnikami.',
        'W każdej sprawie dotyczącej tej polityki piszcie na hello@domlivo.com.',
        'TODO(legal): the registered entity operating this site, its registration number and registered address belong here.',
      ],
    },
    {
      heading: 'Jakie dane zbieramy',
      paragraphs: ['Dane osobowe przekazujecie nam wyłącznie wtedy, gdy sami tak zdecydujecie:'],
      bullets: [
        'Formularze kontaktowe i zapytania — imię, numer telefonu, adres e-mail i treść wiadomości wraz ze stroną, z której zostały wysłane. Widget oddzwonienia prosi wyłącznie o numer telefonu.',
        'Rejestracja agencji i pośredników — imię, numer telefonu i adres e-mail.',
        'Asystent oparty na sztucznej inteligencji — wszystko, co w nim napiszecie.',
      ],
    },
    {
      paragraphs: ['Niewielką ilość danych technicznych serwis przetwarza samodzielnie:'],
      bullets: [
        'Zliczanie odsłon — wasz adres IP służy jako krótkotrwały klucz, aby jeden odwiedzający nie został policzony dwukrotnie w ciągu pół godziny. Pozostaje wyłącznie w pamięci serwera, nigdy nie jest zapisywany, a zachowywana jest ostatecznie tylko liczba.',
        'Analityka — tylko jeśli zaakceptujecie ją w banerze cookie. Zobacz niżej.',
      ],
    },
    {
      heading: 'Dokąd trafiają zgłoszenia z formularzy',
      paragraphs: [
        'Wysłany formularz trafia do naszego zespołu jako wiadomość na Telegramie. Nie jest zapisywany w żadnej bazie danych tego serwisu, więc dane żyją w tej rozmowie i nigdzie indziej tutaj.',
        'TODO(legal): state a definite retention period for those messages and delete on that schedule.',
      ],
    },
    {
      heading: 'Analityka i nagrywanie sesji',
      paragraphs: ['Jeśli — i tylko jeśli — zaakceptujecie analitykę w banerze cookie, serwis ładuje:'],
      bullets: [
        'Google Tag Manager i Google Analytics 4 (kontener GTM-T27ZZ289) — zbiorczy pomiar ruchu.',
        'Microsoft Clarity (projekt x4l0dctgle) — mapy cieplne i nagrywanie sesji. Clarity rejestruje, jak poruszacie kursorem i gdzie klikacie; nie rejestruje tego, co wpisujecie w pola formularzy.',
      ],
    },
    {
      paragraphs: [
        'Do momentu akceptacji Google Consent Mode v2 pozostaje w stanie denied i żadne z tych narzędzi niczego nie otrzymuje. Odmowa niczego nie zmienia w działaniu serwisu dla was, a wybór można później zmienić z odnośnika o plikach cookie w stopce.',
      ],
    },
    {
      heading: 'Co jest przechowywane w waszej przeglądarce',
      bullets: [
        'NEXT_LOCALE — język, w którym czytacie.',
        'Zapis zgody — które kategorie zaakceptowaliście.',
        'Waluta — waluta wybrana do wyświetlania cen.',
        'favorites — zapisane przez was ogłoszenia. Te dane nigdy nie opuszczają przeglądarki.',
        'catalogViewMode — czy wolicie listę, czy siatkę.',
        'domlivo:ai-chat — wasza rozmowa z asystentem, w session storage, którą przeglądarka usuwa po zamknięciu karty.',
      ],
    },
    {
      heading: 'Kto jeszcze przetwarza dane',
      bullets: [
        'Vercel — hosting. Serwuje każdą stronę, więc przetwarza dane żądań.',
        'Sanity — system zarządzania treścią, z którego publikowane są ogłoszenia.',
        'Telegram — dostarcza zgłoszenia naszemu zespołowi.',
        'Anthropic — otrzymuje wasze wiadomości do asystenta, aby na nie odpowiedzieć.',
        'Google i Microsoft — analityka i nagrywanie sesji, wyłącznie za waszą zgodą.',
      ],
    },
    {paragraphs: ['Nie sprzedajemy danych osobowych i nie udostępniamy ich do celów reklamowych.']},
    {
      heading: 'Przekazywanie poza Albanię i EOG',
      paragraphs: [
        'Część wymienionych dostawców działa ze Stanów Zjednoczonych. Tam, gdzie dane osobowe do nich trafiają, przekazanie opiera się na standardowych klauzulach umownych Komisji Europejskiej albo na równoważnym zabezpieczeniu oferowanym przez dostawcę.',
      ],
    },
    {
      heading: 'Wasze prawa',
      paragraphs: [
        'Możecie zażądać kopii swoich danych, ich sprostowania lub usunięcia, ograniczenia przetwarzania albo wnieść sprzeciw wobec niego. Zgodę na analitykę możecie wycofać w każdej chwili. Napiszcie na hello@domlivo.com, a odpowiemy.',
        'Jeśli nasza odpowiedź was nie usatysfakcjonuje, możecie złożyć skargę do Komisarza ds. Prawa do Informacji i Ochrony Danych Osobowych w Albanii (idp.al). Jeśli przebywacie w Unii Europejskiej — do organu nadzorczego w swoim kraju.',
      ],
    },
    {
      heading: 'Bezpieczeństwo',
      paragraphs: [
        'Serwis działa po HTTPS, a zgłoszenia z formularzy przesyłane są szyfrowanym połączeniem. Dostęp do systemu zarządzania treścią i do rozmowy, na którą trafiają zapytania, mają wyłącznie osoby, którym jest on potrzebny.',
      ],
    },
    {
      heading: 'Dzieci',
      paragraphs: [
        'Serwis nie jest skierowany do dzieci i nie zbieramy świadomie danych ich dotyczących.',
      ],
    },
    {
      heading: 'Zmiany',
      paragraphs: [
        'Aktualizujemy tę stronę, gdy serwis zmienia to, co robi z danymi. Data u góry wskazuje ostatnią zmianę.',
      ],
    },
  ],
}

export const TERMS_BODY: Record<TranslatedLocale, LegalBlock[]> = {
  uk: [
    {paragraphs: ['Останнє оновлення: 10 вересня 2026 року.']},
    {
      heading: 'Що таке цей сайт',
      paragraphs: [
        'Domlivo — каталог оголошень про нерухомість в Албанії разом із ринковими показниками та редакційними матеріалами. Користуючись сайтом, ви приймаєте ці умови.',
      ],
    },
    {
      heading: 'Ми не сторона вашої угоди',
      paragraphs: [
        'Domlivo публікує оголошення й зводить вас із продавцем. Ми не продавець, не орендодавець і не ваш агент, і ніщо опубліковане тут не є офертою. Ціна, площа, поверх або фотографія в картці — це відомості, передані нам, здебільшого партнерськими агентствами та власниками, а оголошення не є договором.',
      ],
    },
    {
      heading: 'Точність оголошень і цифр',
      paragraphs: [
        'Ми перевіряємо те, що можемо перевірити в розумних межах, і виправляємо те, про що нам повідомляють, але не можемо гарантувати актуальність кожної цифри: ціни змінюються, об’єкти продаються, партнерські вивантаження відстають.',
        'Ключове перевіряйте самі до будь-якої оплати — точне розташування, площу, юридичний статус об’єкта та особу продавця.',
        'Ринкові показники на сторінках міст і районів — це ціни пропозиції, зібрані з названих джерел із зазначенням дати. Це орієнтир, а не оцінка конкретного об’єкта.',
      ],
    },
    {
      heading: 'Користування сайтом',
      paragraphs: [
        'Користуйтеся сайтом за призначенням. Не вивантажуйте його масово, не переопубліковуйте каталог, не намагайтеся порушити його роботу й не використовуйте форми для розсилання небажаних повідомлень.',
      ],
    },
    {
      heading: 'Розміщення оголошення',
      paragraphs: [
        'Надсилаючи нам оголошення, ви підтверджуєте, що маєте право його публікувати й що фотографії належать вам. Ми можемо відмовити в публікації або зняти вже опубліковане оголошення без пояснення причин.',
      ],
    },
    {
      heading: 'Контент і права',
      paragraphs: [
        'Тексти, ринкові дані, фотографії та дизайн сайту належать нам або нашим ліцензіарам. Фотографії під ліцензією Creative Commons зазначені на сторінці атрибуції зображень.',
        'Ви можете цитувати нас із посиланням. Переопубліковувати каталог не можна.',
      ],
    },
    {
      heading: 'Посилання на інші сайти',
      paragraphs: [
        'Наші сторінки посилаються на інші сайти — агентства, статистичні джерела, офіційні таблиці довідкових цін. Ми їх не контролюємо й не відповідаємо за їхній зміст.',
      ],
    },
    {
      heading: 'Відповідальність',
      paragraphs: [
        'Сайт надається як є. У межах, дозволених законом, ми не несемо відповідальності за рішення, ухвалене вами на підставі опублікованої тут інформації, і за збитки через недоступність сайту.',
      ],
    },
    {
      heading: 'Застосовне право',
      paragraphs: [
        'До цих умов застосовується право Албанії.',
        'TODO(legal): confirm the competent forum and name it here.',
      ],
    },
    {heading: 'Контакт', paragraphs: ['hello@domlivo.com']},
  ],

  sq: [
    {paragraphs: ['Përditësuar për herë të fundit: 10 shtator 2026.']},
    {
      heading: 'Çfarë është kjo faqe',
      paragraphs: [
        'Domlivo është një katalog shpalljesh pronash në Shqipëri, bashkë me të dhëna tregu dhe materiale redaksionale. Duke përdorur faqen, ju pranoni këto kushte.',
      ],
    },
    {
      heading: 'Ne nuk jemi palë në transaksionin tuaj',
      paragraphs: [
        'Domlivo publikon shpallje dhe ju vë në kontakt. Ne nuk jemi shitësi, nuk jemi qiradhënësi dhe nuk jemi agjenti juaj, dhe asgjë e publikuar këtu nuk përbën ofertë të pranueshme. Çmimi, sipërfaqja, kati ose fotografia në një shpallje janë të dhëna që na jepen — kryesisht nga agjenci partnere dhe pronarë — dhe një shpallje nuk është kontratë.',
      ],
    },
    {
      heading: 'Saktësia e shpalljeve dhe e shifrave',
      paragraphs: [
        'Ne verifikojmë atë që mundemi në mënyrë të arsyeshme dhe korrigjojmë atë që na raportohet si e gabuar, por nuk mund të garantojmë që çdo shifër është e përditësuar: çmimet lëvizin, pronat shiten dhe të dhënat nga partnerët vijnë me vonesë.',
        'Gjërat thelbësore verifikojini vetë përpara se të paguani — vendndodhjen e saktë, sipërfaqen, statusin ligjor të pronës dhe identitetin e atij që shet.',
        'Të dhënat e tregut në faqet e qyteteve dhe të zonave janë çmime të kërkuara, të mbledhura nga burime të emërtuara dhe të datuara. Ato janë një pikë referimi për orientim, jo një vlerësim i një prone të caktuar.',
      ],
    },
    {
      heading: 'Përdorimi i faqes',
      paragraphs: [
        'Përdoreni faqen për atë që shërben. Mos e nxirrni masivisht me programe, mos e ripublikoni katalogun, mos u përpiqni ta prishni dhe mos i përdorni formularët për të dërguar mesazhe të pakërkuara.',
      ],
    },
    {
      heading: 'Dërgimi i një shpalljeje',
      paragraphs: [
        'Nëse na dërgoni një shpallje, ju konfirmoni se keni të drejtë ta publikoni dhe se fotografitë janë tuajat për t’u përdorur. Ne mund të refuzojmë një shpallje, ose të heqim një të publikuar, pa dhënë arsye.',
      ],
    },
    {
      heading: 'Përmbajtja dhe të drejtat',
      paragraphs: [
        'Tekstet, të dhënat e tregut, fotografitë dhe dizajni i kësaj faqeje na përkasin neve ose licencuesve tanë. Fotografitë e publikuara me licencë Creative Commons kreditohen në faqen e atribuimit të imazheve.',
        'Mund të na citoni me një lidhje kthyese. Katalogun nuk mund ta ripublikoni.',
      ],
    },
    {
      heading: 'Lidhjet drejt faqeve të tjera',
      paragraphs: [
        'Faqet tona lidhen me faqe të tjera — agjenci, burime statistikore, tabela zyrtare të çmimeve të referencës. Ne nuk i kontrollojmë ato dhe nuk përgjigjemi për përmbajtjen e tyre.',
      ],
    },
    {
      heading: 'Përgjegjësia',
      paragraphs: [
        'Faqja ofrohet ashtu siç është. Në masën që e lejon ligji, ne nuk mbajmë përgjegjësi për një vendim që ju merrni bazuar në informacionin e publikuar këtu, as për humbje të shkaktuara nga mosdisponueshmëria e faqes.',
      ],
    },
    {
      heading: 'Ligji i zbatueshëm',
      paragraphs: [
        'Këto kushte rregullohen nga ligji i Shqipërisë.',
        'TODO(legal): confirm the competent forum and name it here.',
      ],
    },
    {heading: 'Kontakti', paragraphs: ['hello@domlivo.com']},
  ],

  it: [
    {paragraphs: ['Ultimo aggiornamento: 10 settembre 2026.']},
    {
      heading: 'Che cos’è questo sito',
      paragraphs: [
        'Domlivo è un catalogo di annunci immobiliari in Albania, con dati di mercato e contenuti redazionali. Usando il sito accettate questi termini.',
      ],
    },
    {
      heading: 'Non siamo parte della vostra transazione',
      paragraphs: [
        'Domlivo pubblica annunci e vi mette in contatto. Non siamo il venditore, non siamo il locatore e non siamo il vostro agente, e nulla di quanto pubblicato qui costituisce una proposta accettabile. Prezzo, superficie, piano o fotografia in un annuncio sono informazioni che ci vengono fornite — in larga parte da agenzie partner e da proprietari — e un annuncio non è un contratto.',
      ],
    },
    {
      heading: 'Accuratezza degli annunci e dei dati',
      paragraphs: [
        'Verifichiamo ciò che ragionevolmente possiamo e correggiamo ciò che ci viene segnalato come errato, ma non possiamo garantire che ogni dato sia aggiornato: i prezzi si muovono, gli immobili vengono venduti e i flussi dei partner arrivano in ritardo.',
        'Verificate voi stessi l’essenziale prima di pagare qualsiasi somma: la posizione esatta, la superficie, lo stato giuridico dell’immobile e l’identità di chi vende.',
        'I dati di mercato nelle pagine di città e zone sono prezzi richiesti, raccolti da fonti citate e datate. Sono un riferimento per orientarsi, non la valutazione di un immobile specifico.',
      ],
    },
    {
      heading: 'Uso del sito',
      paragraphs: [
        'Usate il sito per ciò a cui serve. Non estraetelo massivamente, non ripubblicate il catalogo, non tentate di comprometterne il funzionamento e non usate i moduli di contatto per inviare comunicazioni non richieste.',
      ],
    },
    {
      heading: 'Invio di un annuncio',
      paragraphs: [
        'Se ci inviate un annuncio, confermate di avere il diritto di pubblicarlo e che le fotografie sono vostre da utilizzare. Possiamo rifiutare un annuncio, o ritirarne uno già pubblicato, senza fornire motivazioni.',
      ],
    },
    {
      heading: 'Contenuti e diritti',
      paragraphs: [
        'I testi, i dati di mercato, le fotografie e il design di questo sito appartengono a noi o ai nostri licenzianti. Le fotografie pubblicate con licenza Creative Commons sono accreditate nella pagina dei crediti immagini.',
        'Potete citarci con un link. Non potete ripubblicare il catalogo.',
      ],
    },
    {
      heading: 'Collegamenti ad altri siti',
      paragraphs: [
        'Le nostre pagine rimandano ad altri siti — agenzie, fonti statistiche, tabelle ufficiali dei prezzi di riferimento. Non li controlliamo e non rispondiamo dei loro contenuti.',
      ],
    },
    {
      heading: 'Responsabilità',
      paragraphs: [
        'Il sito è fornito così com’è. Nei limiti consentiti dalla legge, non rispondiamo delle decisioni che prendete sulla base delle informazioni qui pubblicate, né dei danni derivanti dall’indisponibilità del sito.',
      ],
    },
    {
      heading: 'Legge applicabile',
      paragraphs: [
        'Questi termini sono regolati dalla legge albanese.',
        'TODO(legal): confirm the competent forum and name it here.',
      ],
    },
    {heading: 'Contatti', paragraphs: ['hello@domlivo.com']},
  ],

  pl: [
    {paragraphs: ['Ostatnia aktualizacja: 10 września 2026 r.']},
    {
      heading: 'Czym jest ten serwis',
      paragraphs: [
        'Domlivo to katalog ogłoszeń nieruchomości w Albanii wraz z danymi rynkowymi i materiałami redakcyjnymi. Korzystanie z serwisu oznacza akceptację niniejszych warunków.',
      ],
    },
    {
      heading: 'Nie jesteśmy stroną waszej transakcji',
      paragraphs: [
        'Domlivo publikuje ogłoszenia i umożliwia kontakt. Nie jesteśmy sprzedającym, nie jesteśmy wynajmującym i nie jesteśmy waszym pośrednikiem, a nic z tego, co tu opublikowano, nie stanowi oferty w rozumieniu prawa. Cena, powierzchnia, piętro czy zdjęcie w ogłoszeniu to informacje nam przekazane — w większości przez agencje partnerskie i właścicieli — a ogłoszenie nie jest umową.',
      ],
    },
    {
      heading: 'Dokładność ogłoszeń i danych',
      paragraphs: [
        'Sprawdzamy to, co w rozsądnym zakresie możemy, i poprawiamy to, o czym nas informują, ale nie możemy zagwarantować, że każda liczba jest aktualna: ceny się zmieniają, nieruchomości są sprzedawane, a dane od partnerów przychodzą z opóźnieniem.',
        'Rzeczy kluczowe sprawdźcie sami przed jakąkolwiek zapłatą — dokładną lokalizację, powierzchnię, stan prawny nieruchomości i tożsamość sprzedającego.',
        'Dane rynkowe na stronach miast i dzielnic to ceny ofertowe zebrane z wymienionych z nazwy, datowanych źródeł. Są punktem odniesienia, a nie wyceną konkretnej nieruchomości.',
      ],
    },
    {
      heading: 'Korzystanie z serwisu',
      paragraphs: [
        'Korzystajcie z serwisu zgodnie z jego przeznaczeniem. Nie pobierajcie go masowo, nie publikujcie katalogu ponownie, nie próbujcie zakłócać jego działania i nie używajcie formularzy do wysyłania niezamówionych wiadomości.',
      ],
    },
    {
      heading: 'Przesłanie ogłoszenia',
      paragraphs: [
        'Przesyłając nam ogłoszenie, potwierdzacie, że macie prawo je opublikować i że zdjęcia należą do was. Możemy odmówić publikacji albo wycofać ogłoszenie już opublikowane, bez podania przyczyn.',
      ],
    },
    {
      heading: 'Treści i prawa',
      paragraphs: [
        'Teksty, dane rynkowe, zdjęcia i projekt tego serwisu należą do nas lub do naszych licencjodawców. Zdjęcia publikowane na licencji Creative Commons są oznaczone na stronie z atrybucją obrazów.',
        'Możecie nas cytować z odnośnikiem. Nie wolno ponownie publikować katalogu.',
      ],
    },
    {
      heading: 'Odnośniki do innych stron',
      paragraphs: [
        'Nasze strony odsyłają do innych serwisów — agencji, źródeł statystycznych, urzędowych tabel cen referencyjnych. Nie kontrolujemy ich i nie odpowiadamy za ich treść.',
      ],
    },
    {
      heading: 'Odpowiedzialność',
      paragraphs: [
        'Serwis udostępniany jest w stanie, w jakim jest. W zakresie dozwolonym przez prawo nie odpowiadamy za decyzję podjętą przez was na podstawie opublikowanych tu informacji ani za szkodę wynikłą z niedostępności serwisu.',
      ],
    },
    {
      heading: 'Prawo właściwe',
      paragraphs: [
        'Do niniejszych warunków stosuje się prawo Albanii.',
        'TODO(legal): confirm the competent forum and name it here.',
      ],
    },
    {heading: 'Kontakt', paragraphs: ['hello@domlivo.com']},
  ],
}
