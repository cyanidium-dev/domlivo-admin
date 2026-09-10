/**
 * Privacy Policy and Terms of Use.
 *
 * `/privacy` and `/terms` are linked from the footer of every page and from the
 * cookie banner, and neither existed: 2,591 links to `/privacy` alone landed on
 * a 404 (Ahrefs crawl 2026-09-10). On a site running Google Tag Manager and
 * Microsoft Clarity that is a compliance gap before it is an SEO one.
 *
 * WHAT THIS IS AND IS NOT
 * ----------------------------------------------------------------------------
 * Every factual claim below was read out of this codebase, not copied from
 * another site's policy:
 *
 *   forms        src/app/api/contact-agent, /api/registration-request →
 *                delivered by Telegram bot, not written to a database
 *   AI chat      src/app/api/ai/chat → Anthropic; history in sessionStorage
 *   view counter src/app/api/metrics/view → IP only as an in-memory dedupe key
 *   analytics    src/lib/analytics/config → GTM-T27ZZ289, Clarity x4l0dctgle,
 *                Consent Mode v2 default-denied, off unless consented
 *   storage      NEXT_LOCALE, consent record, currency, favorites,
 *                catalogViewMode, domlivo:ai-chat:v1:*
 *
 * It is NOT legal advice and has not been reviewed by a lawyer. Three things
 * cannot be read out of code and are marked `TODO(legal)` in the text: the
 * registered entity behind the site, how long lead messages are kept, and the
 * choice of forum. Fill those in before treating this as final.
 *
 * Competitor calibration (structure only — no wording was taken): njoftime.al
 * ~4.2k characters, century21albania.com ~3.5k, realting.com ~9.9k,
 * merrjep.al ~33k. These sit at the upper-middle of that range and are more
 * specific than any of them, because they describe one real stack.
 */

export type LegalBlock = {heading?: string; paragraphs?: string[]; bullets?: string[]}
export type LegalDoc = {
  slug: string
  title: {en: string; ru: string}
  metaDescription: {en: string; ru: string}
  updated: string
  body: {en: LegalBlock[]; ru: LegalBlock[]}
}

const UPDATED = '2026-09-10'

export const PRIVACY: LegalDoc = {
  slug: 'privacy',
  title: {en: 'Privacy Policy', ru: 'Политика конфиденциальности'},
  metaDescription: {
    en: 'What Domlivo does with personal data: what the forms collect, where submissions go, which analytics run only after consent, and how to exercise your rights.',
    ru: 'Что Domlivo делает с персональными данными: что собирают формы, куда уходят заявки, какая аналитика включается только после согласия и как реализовать свои права.',
  },
  updated: UPDATED,
  body: {
    en: [
      {paragraphs: [`Last updated: 10 September 2026.`]},
      {
        heading: 'Who we are',
        paragraphs: [
          'Domlivo (domlivo.com) publishes property listings in Albania. This policy describes what the site actually does with personal data, in the specific terms of how it is built rather than in general ones.',
          'For anything in this policy, write to hello@domlivo.com.',
          'TODO(legal): the registered entity operating this site, its registration number and registered address belong here.',
        ],
      },
      {
        heading: 'What we collect',
        paragraphs: ['You give us personal data only when you choose to:'],
        bullets: [
          'Contact and enquiry forms — your name, phone number, email address and message, together with the page you sent it from. The callback widget asks for a phone number and nothing else.',
          'Agency and realtor registration — your name, phone number and email address.',
          'The AI assistant — whatever you type into it.',
        ],
      },
      {
        paragraphs: ['The site also handles a small amount of technical data on its own:'],
        bullets: [
          'Page view counting — your IP address is used as a short-lived key so that one visitor is not counted twice within half an hour. It is held in the server’s memory only, is never written to storage, and what gets saved is a number.',
          'Analytics — only if you accept it in the cookie banner. See below.',
        ],
      },
      {
        heading: 'Where form submissions go',
        paragraphs: [
          'A submitted form is delivered to our team as a Telegram message. It is not written to a database on this site, so the data lives in that chat and nowhere else here.',
          'TODO(legal): state a definite retention period for those messages and delete on that schedule.',
        ],
      },
      {
        heading: 'Analytics and session recording',
        paragraphs: ['If, and only if, you accept analytics in the cookie banner, the site loads:'],
        bullets: [
          'Google Tag Manager and Google Analytics 4 (container GTM-T27ZZ289) — aggregate traffic measurement.',
          'Microsoft Clarity (project x4l0dctgle) — heatmaps and session recording. Clarity records how you move and click on a page; it does not record what you type into form fields.',
        ],
      },
      {
        paragraphs: [
          'Until you accept, Google Consent Mode v2 is set to denied and neither tool receives anything. Refusing changes nothing about how the site works for you, and you can change the choice later from the cookie link in the footer.',
        ],
      },
      {
        heading: 'What is stored in your browser',
        bullets: [
          'NEXT_LOCALE — the language you are reading in.',
          'The consent record — which categories you accepted.',
          'Currency — the currency you chose for prices.',
          'favorites — the listings you saved. This never leaves your browser.',
          'catalogViewMode — whether you prefer the list or the grid.',
          'domlivo:ai-chat — your assistant conversation, in session storage, which the browser discards when you close the tab.',
        ],
      },
      {
        heading: 'Who else processes the data',
        bullets: [
          'Vercel — hosting. It serves every page and therefore handles request data.',
          'Sanity — the content system the listings are published from.',
          'Telegram — carries form submissions to our team.',
          'Anthropic — receives your assistant messages in order to answer them.',
          'Google and Microsoft — analytics and session recording, only with your consent.',
        ],
      },
      {
        paragraphs: ['We do not sell personal data and we do not share it for advertising.'],
      },
      {
        heading: 'Transfers outside Albania and the EEA',
        paragraphs: [
          'Several of the providers above operate from the United States. Where personal data reaches them, the transfer relies on the European Commission’s standard contractual clauses or an equivalent safeguard offered by that provider.',
        ],
      },
      {
        heading: 'Your rights',
        paragraphs: [
          'You may ask for a copy of your data, ask us to correct it or delete it, ask us to restrict what we do with it, or object to it. You may withdraw consent to analytics at any time. Write to hello@domlivo.com and we will answer.',
          'If our answer does not satisfy you, you can complain to the Information and Data Protection Commissioner in Albania (idp.al). If you are in the European Union, you can complain to the supervisory authority in your own country.',
        ],
      },
      {
        heading: 'Security',
        paragraphs: [
          'The site is served over HTTPS and form submissions travel over encrypted connections. Access to the content system and to the chat that receives enquiries is limited to the people who need it.',
        ],
      },
      {
        heading: 'Children',
        paragraphs: [
          'The site is not directed at children and we do not knowingly collect data about them.',
        ],
      },
      {
        heading: 'Changes',
        paragraphs: [
          'We update this page when the site changes what it does with data. The date at the top is when it last changed.',
        ],
      },
    ],
    ru: [
      {paragraphs: ['Последнее обновление: 10 сентября 2026 года.']},
      {
        heading: 'Кто мы',
        paragraphs: [
          'Domlivo (domlivo.com) публикует объявления о недвижимости в Албании. Эта политика описывает, что сайт на самом деле делает с персональными данными — в терминах того, как он устроен, а не в общих словах.',
          'По любому вопросу из этой политики пишите на hello@domlivo.com.',
          'TODO(legal): здесь должны стоять юридическое лицо, эксплуатирующее сайт, его регистрационный номер и юридический адрес.',
        ],
      },
      {
        heading: 'Что мы собираем',
        paragraphs: ['Персональные данные вы передаёте нам только по своему решению:'],
        bullets: [
          'Формы обращений — имя, телефон, email и сообщение, а также страница, с которой отправлено обращение. Виджет обратного звонка спрашивает только телефон.',
          'Регистрация агентств и риелторов — имя, телефон и email.',
          'ИИ-ассистент — всё, что вы в нём напишете.',
        ],
      },
      {
        paragraphs: ['Небольшой объём технических данных сайт обрабатывает сам:'],
        bullets: [
          'Подсчёт просмотров — ваш IP-адрес используется как кратковременный ключ, чтобы один посетитель не был засчитан дважды в течение получаса. Он держится только в оперативной памяти сервера, никуда не записывается, и сохраняется в итоге лишь число.',
          'Аналитика — только если вы согласились в баннере cookie. См. ниже.',
        ],
      },
      {
        heading: 'Куда уходят заявки',
        paragraphs: [
          'Отправленная форма приходит нашей команде сообщением в Telegram. В базу данных сайта она не записывается, поэтому данные живут в этом чате и больше нигде здесь.',
          'TODO(legal): указать конкретный срок хранения этих сообщений и удалять по нему.',
        ],
      },
      {
        heading: 'Аналитика и запись сессий',
        paragraphs: ['Если — и только если — вы приняли аналитику в баннере cookie, сайт подключает:'],
        bullets: [
          'Google Tag Manager и Google Analytics 4 (контейнер GTM-T27ZZ289) — агрегированное измерение трафика.',
          'Microsoft Clarity (проект x4l0dctgle) — тепловые карты и запись сессий. Clarity записывает, как вы двигаете курсором и кликаете; то, что вы вводите в поля форм, он не записывает.',
        ],
      },
      {
        paragraphs: [
          'До вашего согласия Google Consent Mode v2 стоит в положении denied, и ни один из инструментов ничего не получает. Отказ ничего не меняет в работе сайта для вас, а решение можно изменить позже по ссылке про cookie в подвале.',
        ],
      },
      {
        heading: 'Что хранится в вашем браузере',
        bullets: [
          'NEXT_LOCALE — язык, на котором вы читаете.',
          'Запись о согласии — какие категории вы приняли.',
          'Валюта — валюта, выбранная для цен.',
          'favorites — сохранённые вами объекты. Эти данные не покидают браузер.',
          'catalogViewMode — список или плитка.',
          'domlivo:ai-chat — переписка с ассистентом, в session storage; браузер удаляет её при закрытии вкладки.',
        ],
      },
      {
        heading: 'Кто ещё обрабатывает данные',
        bullets: [
          'Vercel — хостинг. Отдаёт каждую страницу и потому обрабатывает данные запросов.',
          'Sanity — система управления контентом, из которой публикуются объявления.',
          'Telegram — доставляет заявки нашей команде.',
          'Anthropic — получает ваши сообщения ассистенту, чтобы на них ответить.',
          'Google и Microsoft — аналитика и запись сессий, только с вашего согласия.',
        ],
      },
      {
        paragraphs: ['Мы не продаём персональные данные и не передаём их для рекламы.'],
      },
      {
        heading: 'Передача за пределы Албании и ЕЭЗ',
        paragraphs: [
          'Часть перечисленных поставщиков работает из США. Там, где персональные данные к ним попадают, передача опирается на стандартные договорные условия Европейской комиссии или на равнозначную гарантию, предлагаемую поставщиком.',
        ],
      },
      {
        heading: 'Ваши права',
        paragraphs: [
          'Вы можете запросить копию своих данных, потребовать их исправить или удалить, ограничить их обработку или возразить против неё. Согласие на аналитику можно отозвать в любой момент. Напишите на hello@domlivo.com — мы ответим.',
          'Если наш ответ вас не устроит, вы вправе пожаловаться Комиссару по праву на информацию и защите персональных данных Албании (idp.al). Если вы находитесь в Европейском союзе — надзорному органу своей страны.',
        ],
      },
      {
        heading: 'Безопасность',
        paragraphs: [
          'Сайт отдаётся по HTTPS, заявки передаются по шифрованному соединению. Доступ к системе управления контентом и к чату, куда приходят обращения, ограничен теми, кому он нужен по работе.',
        ],
      },
      {
        heading: 'Дети',
        paragraphs: [
          'Сайт не адресован детям, и мы сознательно не собираем данные о них.',
        ],
      },
      {
        heading: 'Изменения',
        paragraphs: [
          'Мы обновляем эту страницу, когда сайт меняет то, что делает с данными. Дата вверху — когда это случилось в последний раз.',
        ],
      },
    ],
  },
}

export const TERMS: LegalDoc = {
  slug: 'terms',
  title: {en: 'Terms of Use', ru: 'Условия использования'},
  metaDescription: {
    en: 'The terms for using Domlivo: what the catalogue is, why a listing is not a contract, what to verify before you pay, and the limits of our liability.',
    ru: 'Условия использования Domlivo: что представляет собой каталог, почему объявление не является договором, что проверить до оплаты и каковы пределы нашей ответственности.',
  },
  updated: UPDATED,
  body: {
    en: [
      {paragraphs: ['Last updated: 10 September 2026.']},
      {
        heading: 'What this site is',
        paragraphs: [
          'Domlivo is a catalogue of property listings in Albania, together with market figures and editorial guides. Using the site means accepting these terms.',
        ],
      },
      {
        heading: 'We are not a party to your transaction',
        paragraphs: [
          'Domlivo publishes listings and puts you in contact. We are not the seller, not the landlord and not your agent, and nothing published here is an offer capable of acceptance. A price, an area, a floor or a photograph on a listing page is information supplied to us — largely by partner agencies and owners — and a listing is not a contract.',
        ],
      },
      {
        heading: 'Accuracy of listings and figures',
        paragraphs: [
          'We check what we reasonably can and correct what we are told is wrong, but we cannot guarantee that every figure is current: prices move, properties sell, and partner feeds lag behind.',
          'Verify the essentials yourself before you pay anything — the exact location, the area, the legal status of the property and the identity of the person selling it.',
          'Market figures on city and district pages are asking prices collected from named, dated sources. They are a reference for orientation, not a valuation of any particular property.',
        ],
      },
      {
        heading: 'Using the site',
        paragraphs: [
          'Use the site for what it is for. Do not scrape it in bulk, do not republish the catalogue, do not attempt to disrupt it, and do not use the contact forms to send anything unsolicited.',
        ],
      },
      {
        heading: 'Submitting a listing',
        paragraphs: [
          'If you send us a listing, you confirm that you are entitled to publish it and that its photographs are yours to use. We may decline a listing, or withdraw one already published, without giving reasons.',
        ],
      },
      {
        heading: 'Content and rights',
        paragraphs: [
          'The text, market data, photographs and design of this site belong to us or to our licensors. Photographs published under a Creative Commons licence are credited on the image credits page.',
          'You may quote us with a link back. You may not republish the catalogue.',
        ],
      },
      {
        heading: 'Links to other sites',
        paragraphs: [
          'Our pages link to other sites — agencies, statistical sources, official price schedules. We do not control them and are not responsible for their content.',
        ],
      },
      {
        heading: 'Liability',
        paragraphs: [
          'The site is provided as it is. To the extent the law allows, we are not liable for a decision you take on the basis of information published here, nor for loss caused by the site being unavailable.',
        ],
      },
      {
        heading: 'Governing law',
        paragraphs: [
          'These terms are governed by the law of Albania.',
          'TODO(legal): confirm the competent forum and name it here.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: ['hello@domlivo.com'],
      },
    ],
    ru: [
      {paragraphs: ['Последнее обновление: 10 сентября 2026 года.']},
      {
        heading: 'Что представляет собой сайт',
        paragraphs: [
          'Domlivo — каталог объявлений о недвижимости в Албании вместе с рыночными показателями и редакционными материалами. Пользуясь сайтом, вы принимаете эти условия.',
        ],
      },
      {
        heading: 'Мы не сторона вашей сделки',
        paragraphs: [
          'Domlivo публикует объявления и сводит вас с продавцом. Мы не продавец, не арендодатель и не ваш агент, и ничто опубликованное здесь не является офертой. Цена, площадь, этаж или фотография в карточке — это сведения, переданные нам, в основном партнёрскими агентствами и собственниками, а объявление не является договором.',
        ],
      },
      {
        heading: 'Точность объявлений и цифр',
        paragraphs: [
          'Мы проверяем то, что можем проверить в разумных пределах, и исправляем то, о чём нам сообщают, но не можем гарантировать актуальность каждой цифры: цены меняются, объекты продаются, партнёрские выгрузки отстают.',
          'Ключевое проверяйте сами до любой оплаты — точное расположение, площадь, юридический статус объекта и личность продавца.',
          'Рыночные показатели на страницах городов и районов — это цены предложения, собранные из названных источников с указанием даты. Это ориентир, а не оценка конкретного объекта.',
        ],
      },
      {
        heading: 'Использование сайта',
        paragraphs: [
          'Пользуйтесь сайтом по назначению. Не выгружайте его массово, не переопубликовывайте каталог, не пытайтесь нарушить его работу и не используйте формы для рассылки нежелательных сообщений.',
        ],
      },
      {
        heading: 'Размещение объявления',
        paragraphs: [
          'Отправляя нам объявление, вы подтверждаете, что вправе его публиковать и что фотографии принадлежат вам. Мы можем отказать в публикации или снять уже опубликованное объявление без объяснения причин.',
        ],
      },
      {
        heading: 'Контент и права',
        paragraphs: [
          'Тексты, рыночные данные, фотографии и дизайн сайта принадлежат нам или нашим лицензиарам. Фотографии под лицензией Creative Commons указаны на странице атрибуции изображений.',
          'Вы можете цитировать нас со ссылкой. Переопубликовывать каталог нельзя.',
        ],
      },
      {
        heading: 'Ссылки на другие сайты',
        paragraphs: [
          'Наши страницы ссылаются на другие сайты — агентства, статистические источники, официальные таблицы справочных цен. Мы их не контролируем и не отвечаем за их содержимое.',
        ],
      },
      {
        heading: 'Ответственность',
        paragraphs: [
          'Сайт предоставляется как есть. В пределах, допускаемых законом, мы не несём ответственности за решение, принятое вами на основании опубликованной здесь информации, и за убытки из-за недоступности сайта.',
        ],
      },
      {
        heading: 'Применимое право',
        paragraphs: [
          'К этим условиям применяется право Албании.',
          'TODO(legal): подтвердить компетентный суд и указать его здесь.',
        ],
      },
      {
        heading: 'Контакт',
        paragraphs: ['hello@domlivo.com'],
      },
    ],
  },
}

export const LEGAL_DOCS: LegalDoc[] = [PRIVACY, TERMS]
