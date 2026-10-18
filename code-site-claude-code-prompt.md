# Промпт для Claude Code — Code-Site.Art

> **Контекст:** Це Next.js + Sanity сайт бутик-студії (UA, ЄС, US, DK). Стек: Next.js (App Router), TypeScript, Tailwind, Sanity (CMS), HeroUI. Деплой на Vercel.
> Ціль цього сеансу — підняти SEO/маркетингову готовність сайту до рівня «можна вмикати лідогенерацію». Домен ми мігруємо пізніше — зараз працюємо з тим, що задеплоєне.

---

## Як працювати

1. Йди по задачах **строго в порядку P0 → P1 → P2**. Не починай P1 поки P0 не закриті.
2. На кожен великий крок:
   - покажи план (які файли торкнеш)
   - покажи diff
   - запусти `pnpm build` (або `npm run build`) і `pnpm typecheck`
   - локально перевір сторінку через `curl -sL <url> | grep -i '<title\|description\|og:\|hreflang\|canonical'`
3. **Жодного нового контенту, який вигадуєш сам.** Якщо текст не наданий нижче — постав `// TODO(copy): ...` коментар і йди далі.
4. Коміти атомарні: 1 задача = 1 commit. Префікси: `feat(seo):`, `fix(seo):`, `feat(content):`, `chore(seo):`.

---

## P0 — критичні (тиждень 1)

### P0.1 — Виправити порожні сторінки

При curl на `/blog`, `/vs/wordpress`, `/vs/freelancers`, `/sites-for/legal` — повертається порожнє body (HTML без контенту). Googlebot з вимкненим JS бачить soft-404.

**Що зробити:**

1. Перевір, чи всі сторінки в `app/(marketing)/**` (або де лежать маркетингові роути) використовують Server Components або SSG, а не клієнтський рендер з порожнім fallback.
2. Для кожної з 4 сторінок:
   - якщо роут існує, але дані тягнуться з Sanity і там порожньо — додай **fallback-контент в коді** (статичні секції з заголовком, intro, CTA), щоб HTML рендерився навіть якщо CMS порожній.
   - якщо роут не існує — створи мінімальну сторінку зі структурою як у `/sites-for/medicine`: H1, intro-параграф, 3 секції болю, FAQ-секція, CTA.
3. Переконайся, що в `metadata` експорті є `title` + `description` + `openGraph` + `alternates.canonical`.

**Acceptance:**

```bash
for url in /blog /vs/wordpress /vs/freelancers /sites-for/legal; do
  echo "=== $url ==="
  curl -sL "https://code-site-solutions.vercel.app$url" | grep -c '<h1'
done
# має повернути ≥1 на кожен URL
```

---

### P0.2 — Виправити прайс і description для пріоритетних роутів

Зараз тільки `/sites-for/medicine` має повний набір мета-розмітки. Решта — порожньо або auto-generated.

Для кожного з цих роутів додай (або поправ) експорт `metadata` у `page.tsx` (або в `generateMetadata` якщо там SSG):

```ts
// Шаблон
export const metadata: Metadata = {
  title: '<рядок з таблиці нижче>',
  description: '<рядок з таблиці нижче>',
  openGraph: {
    title: '<те саме що title, без бренду в кінці>',
    description: '<те саме>',
    type: 'website',
    locale: 'uk_UA',
    url: 'https://code-site.art<path>',
    images: [{ url: 'https://code-site.art/og/<slug>.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '<те саме>',
    description: '<те саме>',
    images: ['https://code-site.art/og/<slug>.png'],
  },
  alternates: { canonical: 'https://code-site.art<path>' },
};
```

**Таблиця title/description:**

| Path | Title | Description |
|---|---|---|
| `/` | Розробка сайтів під ключ для бізнесу — Code-Site.Art · Київ · ЄС | Кастомний код на Next.js. Фіксована ціна $1k–$14k, гарантія 1 рік + 30% неустойка. 47 проєктів у 4 країнах. Запуск 4–10 тижнів. |
| `/about` | Команда з 12 людей · 47 проєктів у 4 країнах — Code-Site.Art | Бутик-студія з Києва, що робить сайти для бізнесу в Україні і ЄС з 2022 року. Tech lead + дизайнер + фронтенд + маркетинг — спілкуєтесь напряму. |
| `/pricing` | Скільки коштує сайт для бізнесу? Прозорий прайс $1k–$14k — Code-Site | Фіксована ціна, ніяких «під запит». Лендинг від $1 000, Industry-сайт від $3 500, Custom від $14 000. Гарантія + неустойка 30% за зрив. |
| `/portfolio` | Бутик-студія: кейси з реальними цифрами — Code-Site.Art | Реальні проєкти для клінік, юристів, e-commerce і стартапів. ×3.2 заявок, Lighthouse 98, Top-3 Google за 6 місяців. |
| `/calculator` | Калькулятор вартості сайту за 60 секунд — Code-Site.Art | Дізнайтеся точну вилку ціни і термінів за 1 хвилину. Без дзвінків і «під запит». Чесний breakdown, що впливає на вартість. |
| `/process` | Як ми працюємо: 7 кроків від брифу до запуску — Code-Site.Art | Бриф → договір → дизайн → код → QA → запуск → 1 рік підтримки. Фіксовані терміни, штраф 30% за зрив. Щотижневі screencasts. |
| `/contacts` | Обговорити проєкт — Telegram, Zoom або бриф · Code-Site.Art | Найшвидший канал — Telegram (відповідь за 30 хв). Або 30-хв консультація без зобов'язань. Або детальний бриф через форму. |
| `/sites-for/legal` | Сайти для адвокатів і юр. фірм — Code-Site.Art | Сайти для юр. фірм, адвокатських бюро, приватних юристів. Diia.Sign, online-консультація, інтеграція з Clio. Від $3 500 · 4–10 тижнів. |
| `/sites-for/accounting` | Сайти для бухгалтерії і аудиторів — Code-Site.Art | Сайти для бух-аутсорсингу і аудиторів. MEDoc, FinCRM, 1С/BAS-інтеграції. Від $3 500 · 4–10 тижнів. |
| `/sites-for/ecommerce` | Інтернет-магазини на Next.js — Code-Site.Art | Інтернет-магазини, маркетплейси, B2B-каталоги. Stripe, LiqPay, Нова Пошта. Від $5 000 · 6–10 тижнів. |
| `/sites-for/saas` | Лендинги для SaaS-стартапів — Code-Site.Art | Продуктові лендинги для SaaS і стартапів. Stripe, Posthog, HubSpot. Запуск за 3–6 тижнів. |
| `/sites-for/real-estate` | Сайти для забудовників і нерухомості — Code-Site.Art | Сайти для забудовників, агенцій, ремонтних компаній. CRM, listings, калькулятори. Від $3 000 · 4–8 тижнів. |
| `/sites-for/cosmetology` | Сайти для beauty-студій і косметології — Code-Site.Art | Сайти для салонів краси і клінік естетичної медицини. YClients, Booksy, online-запис. Від $3 000 · 4–8 тижнів. |
| `/sites-for/education` | Сайти для онлайн-курсів і шкіл — Code-Site.Art | Сайти для онлайн-курсів, шкіл, репетиторів. Stripe, Teachable, Zoom. Від $3 000 · 3–6 тижнів. |
| `/vs/wordpress` | Next.js vs WordPress: 3-річний TCO для бізнесу — Code-Site.Art | Чому кастомний сайт окупається швидше за WordPress. Lighthouse 98 vs 35, $0 на плагіни, код у вашому GitHub. |
| `/vs/constructors` | Кастомний сайт vs Тильда / Wix — Code-Site.Art | Конструктор — швидкий старт, дорогий TCO. Кастом — інвестиція, що окупається на 3-му році. Чесне порівняння. |
| `/vs/freelancers` | Студія vs фрилансер: коли який вибір — Code-Site.Art | Фрилансер — для маленьких задач. Студія — коли потрібна гарантія, контракт і scalable код. |

**Acceptance:** після білда `curl -sL <url> | grep -oP '<title[^>]*>\K[^<]+'` повертає очікуваний title.

---

### P0.3 — Сторінки `/sites-for/*` що повертають порожньо

Окрім `/sites-for/medicine` решта 7 сторінок повертають порожнє тіло (curl без JS). Підозра: контент тягнеться з Sanity на клієнті, а на сервері fallback порожній.

**Що зробити:**

1. Відкрий `/sites-for/medicine/page.tsx` (або де лежить) і подивись, як вона рендериться.
2. Перенеси цю саму архітектуру на решту 7 роутів.
3. Якщо контент в Sanity порожній — створи **статичний baseline** в коді (як у `/sites-for/medicine`, але адаптований під галузь), щоб HTML повертався навіть з порожньою CMS. Sanity потім перекриває.

**Структура baseline для кожної галузі (UA, копіюй pattern):**

```
1. Hero: H1 + sub + 4 trust-чіпи + CTA-stack
2. Stats row (3-4 числа)
3. "3 причини чому не приходять клієнти" (галузево-специфічні болі)
4. Case study before/after (для тих, де є — Efedra; для решти — TODO(copy))
5. "Що ми робимо для <галузі>" (6 фіч)
6. "Підключаємо системи" (лого CRM/інтеграцій)
7. "Чим кастомний сайт кращий за <шаблонне рішення>" (таблиця)
8. CTA-форма
9. Прайс (3 тири з галузевими цінами)
10. FAQ (8 питань)
11. CTA-секція в кінці
```

**Acceptance:** `curl -sL "/sites-for/legal" | wc -c` — >50 000 байт HTML.

---

### P0.4 — Сховати або згрупувати «Coming soon» картки на /portfolio

Зараз 10 з 11 кейсів — заглушки «Coming soon». Це руйнує довіру.

**Що зробити:**

1. У компоненті `<PortfolioGrid />` (або як він називається) додай prop або умову: `case.status === 'published'`.
2. Опублікованими залиш тільки Efedra.
3. Заглушки **прибери з основної сітки** і винеси в окрему секцію внизу під заголовком:

```
"Наступна хвиля кейсів — публікуємо протягом 4 тижнів"
[маленькі сірі картки тільки з лого + назвою клієнта + категорією, без "Coming soon" тексту]
```

4. У H1 сторінки **прибери «30+ кейсів»** — заміни на «Кейси з реальними цифрами».
5. Title в metadata — також без «30+».

**Acceptance:** на скріншоті `/portfolio` тільки 1 повна картка вгорі + сіра ряд внизу.

---

### P0.5 — Hreflang + canonical на всіх сторінках

Зараз тільки `/sites-for/medicine` має canonical (і він вказує на code-site.art — для UA-локалі ОК, для майбутньої EN — треба нову логіку).

**Що зробити:**

1. У `app/layout.tsx` або в окремому helper-у винеси функцію `buildMetadata({ path, title, description, ogImage })` яка повертає правильні `alternates.canonical` і — коли буде EN — `alternates.languages`.
2. Прокинь її в кожен `page.tsx`.
3. Поки EN-версії немає — `alternates.canonical = 'https://code-site.art' + path`. (Так, на code-site.art — це навмисно. Канонікал має дивитись на майбутній prod-домен.)
4. Закладено під майбутнє: `alternates.languages = { 'uk-UA': '/', 'en': '/en' }` — додай, але закоментуй з TODO, поки EN не готовий.

---

### P0.6 — Sitemap.xml і robots.txt

**robots.txt:** створи `app/robots.ts`:

```ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/studio/'] },
    ],
    sitemap: 'https://code-site.art/sitemap.xml',
    host: 'https://code-site.art',
  };
}
```

**sitemap.xml:** створи `app/sitemap.ts`:

```ts
import { MetadataRoute } from 'next';
// тут має бути імпорт Sanity-клієнта для blog + portfolio

const STATIC_ROUTES = [
  '', 'about', 'pricing', 'portfolio', 'calculator', 'process', 'contacts', 'blog',
  'sites-for/medicine', 'sites-for/legal', 'sites-for/accounting',
  'sites-for/ecommerce', 'sites-for/saas', 'sites-for/real-estate',
  'sites-for/cosmetology', 'sites-for/education',
  'vs/wordpress', 'vs/constructors', 'vs/freelancers',
  'policy', 'offer', 'public-contract', 'legal',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://code-site.art';
  const now = new Date();
  // TODO: підтягнути blog-статті + portfolio-кейси з Sanity
  return STATIC_ROUTES.map((path) => ({
    url: `${base}/${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1.0 : path.startsWith('sites-for') ? 0.9 : 0.7,
  }));
}
```

**Acceptance:** `curl -sL /sitemap.xml` повертає валідний XML з усіма URL.

---

### P0.7 — Заповнити /legal

Створи `/legal/page.tsx` з юридичними реквізитами. Поки точних даних нема — постав TODO-блоки:

```tsx
<dl>
  <dt>Юридична назва</dt>
  <dd>{/* TODO(copy): ФОП Алпатов Федір */}</dd>
  <dt>ЄДРПОУ</dt>
  <dd>{/* TODO(copy) */}</dd>
  <dt>ІПН</dt>
  <dd>{/* TODO(copy) */}</dd>
  <dt>Адреса</dt>
  <dd>{/* TODO(copy): Київ, ... */}</dd>
  <dt>VAT (для ЄС-клієнтів)</dt>
  <dd>{/* TODO(copy): не платник / VAT номер */}</dd>
  <dt>Email</dt>
  <dd>hi@code-site.art</dd>
  <dt>Телефон</dt>
  <dd>+380 97 006 87 07</dd>
</dl>
```

---

## P1 — важливі (тиждень 2-3)

### P1.1 — Schema.org для ключових сторінок

Створи helper `lib/seo/jsonLd.ts` з функціями `organizationSchema()`, `websiteSchema()`, `serviceSchema(industry)`, `articleSchema(article)`, `faqSchema(faqs)`.

Рендер: через `<script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(schema)}} />` у відповідному page.tsx.

**Де що додати:**

- `/` → `Organization` + `WebSite` (з `potentialAction: SiteSearchAction`)
- `/about` → `Organization` з повним `employee` масивом (4 ключові + 8 заглушок)
- `/pricing` → `Service` з 4 `offers`
- `/sites-for/<industry>` → `Service` з `serviceType` + `areaServed`
- `/portfolio/<slug>` → `Article` + `CreativeWork`
- Будь-яка сторінка з FAQ-блоком → `FAQPage`

**Acceptance:** Rich Results Test (https://search.google.com/test/rich-results) — без помилок на всіх типах.

---

### P1.2 — OG-картинки 1200×630 для всіх сторінок

Використай Next.js `app/<route>/opengraph-image.tsx` API — рендериться на edge через `ImageResponse`.

**Шаблон (`app/sites-for/medicine/opengraph-image.tsx`):**

```tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                    background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%)',
                    padding: 60, color: '#fff', fontFamily: 'Inter' }}>
        <div style={{ fontSize: 24, color: '#C8461E', marginBottom: 20 }}>CODE-SITE.ART · BOUTIQUE STUDIO</div>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05 }}>
          Сайт для клініки, що {' '}
          <span style={{ color: '#C8461E' }}>приймає записи 24/7</span>
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between' }}>
          <div>×3.2 заявок · Helsi/Medesk · від $3 500</div>
          <div>47 проєктів · 4 країни</div>
        </div>
      </div>
    ),
    size
  );
}
```

Скопіюй цей шаблон для всіх 8 `/sites-for/*` + `/` + `/pricing` + `/about` + `/portfolio` — варіюй заголовок під сторінку.

---

### P1.3 — Internal linking

1. На сторінці `/portfolio/efedra-clinic` (кейс) — додай блок «Хочеш такий самий сайт для клініки?» з лінком на `/sites-for/medicine`.
2. На кожній `/sites-for/<industry>` — додай блок «Кейси по цій галузі» з лінком на портфоліо (фільтр по category).
3. На `/pricing` — в тілі тексту (не тільки в кінці) додай inline-посилання: «Не впевнені, який тир? Прорахуйте вилку в нашому [калькуляторі](/calculator) за 60 секунд.»
4. На `/calculator` — після estimate-блоку додай посилання на `/process` і `/portfolio`.
5. У хедері мобільного меню — переконайся, що всі 8 галузей лінкуються.

---

### P1.4 — Калькулятор UA-версія як основа

Зараз `/calculator` повністю англійською, тоді як решта сайту — українською. Це когнітивний дисонанс для UA-юзера на ключовому конверсійному кроці.

**Що зробити:**

1. Перекласти весь текст калькулятора українською в існуючому компоненті (UA = default).
2. EN-версію перенести на `/en/calculator` (поки що з простою маршрутизацією — повна EN-локаль буде в P2).
3. Усі numeric labels залишити в USD (це норма для B2B).
4. CTA-кнопка після estimate: «Отримати фіксований прайс і timeline за 4 години».

---

### P1.5 — Hero — спростити CTA-стек

На головній зараз 2 кнопки в hero одного візуального ваги: «Розрахувати вартість» + «Подивитись кейси». Це розпорошує увагу.

**Що зробити:**

1. Залишити один **primary CTA**: «Розрахувати вартість за 60 секунд» → `/calculator`.
2. Друга кнопка — ghost-style (тільки border): «Подивитись кейси» → `/portfolio`.
3. Під CTA додати **trust-стрічку одним рядком:** `47 проєктів · 4 країни · Lighthouse 98 · Гарантія 1 рік`.
4. Прибрати дрібну розкладку 4-х trust-чіпів над CTA — об'єднати в один рядок.

---

### P1.6 — Testimonial-секція з структурою під 8+

Зараз 1 відгук (Søren Hansen). Створи **Sanity schema** + UI-компонент під 8+:

**Sanity schema `testimonial`:**

```ts
{
  name: 'testimonial',
  type: 'document',
  fields: [
    { name: 'authorName', type: 'string' },
    { name: 'authorRole', type: 'string' },
    { name: 'authorCompany', type: 'string' },
    { name: 'authorPhoto', type: 'image' },
    { name: 'authorLinkedIn', type: 'url' },
    { name: 'quote', type: 'text' },
    { name: 'metric', type: 'string', description: 'e.g. ×3.2 inquiries' },
    { name: 'caseSlug', type: 'reference', to: [{ type: 'case' }] },
    { name: 'language', type: 'string', options: { list: ['uk', 'en', 'da'] } },
    { name: 'order', type: 'number' },
  ],
}
```

UI-компонент `<TestimonialsCarousel />` (Embla або просто overflow-x-scroll):
- showcase 3 на десктопі, 1 на мобільному
- фото + ім'я + посада + лого компанії + LinkedIn-іконка + цитата

Розмісти на: `/` (під cases), `/sites-for/<industry>` (галузевий filter), `/about` (нижче команди).

---

### P1.7 — Текстові правки (копі)

Просто реплейс по сайту:

**Hero на `/`:**

```
H1 було: «Сайт приймає заявки, поки ви працюєте.»
H1 стало: «Сайт, який приносить заявки — поки ви приймаєте клієнтів.»

Sub було: «Готовий сайт за 4-10 тижнів. Ваша участь — 5 годин, далі сайт працює сам: пише заявки, веде клієнтів і ранжується в Google.»
Sub стало: «Кастомний код на Next.js. Прозора фіксована ціна $1k–$14k. Гарантія 1 рік + 30% неустойка за зрив. 47 проєктів у 4 країнах.»
```

**Pricing підзаголовок:**

```
Було: «Ціна — це те, що ви отримаєте. Не "під запит".»
Стало: «Прозорий прайс — те, що зазвичай прячуть. Ось ціна, ось дедлайн, ось неустойка, якщо зриваємо. Без сюрпризів.»
```

**Calculator CTA після estimate (UA):**

```
Було: "Get exact price & project plan"
Стало: "Отримати фіксований прайс і timeline за 4 години"
```

---

## P2 — пізніше (тиждень 3-4)

### P2.1 — Скелет EN-локалі

Створи `app/en/layout.tsx` + `app/en/page.tsx` + `app/en/pricing/page.tsx` + `app/en/calculator/page.tsx`. Поки що — копія UA з машинним перекладом + `TODO(copy-en): final review needed` коментарями. Hreflang і `alternates.languages` увімкни.

Це підготовка під майбутній EN-launch, в коді — не публіковане в навігації.

### P2.2 — Sanity-схема для кейсів + 4 заглушки під майбутні публікації

Якщо `case` schema ще не існує — створи:

```ts
{
  name: 'case',
  fields: [
    { name: 'title', type: 'string' },
    { name: 'slug', type: 'slug' },
    { name: 'client', type: 'string' },
    { name: 'industry', type: 'string', options: { list: [...] } },
    { name: 'country', type: 'string' },
    { name: 'year', type: 'number' },
    { name: 'status', type: 'string', options: { list: ['draft', 'published'] } },
    { name: 'beforeImage', type: 'image' },
    { name: 'afterImage', type: 'image' },
    { name: 'metrics', type: 'array', of: [{ type: 'object', fields: [
      { name: 'label', type: 'string' },
      { name: 'value', type: 'string' },
    ]}]},
    { name: 'body', type: 'array', of: [{ type: 'block' }] },
    { name: 'testimonial', type: 'reference', to: [{ type: 'testimonial' }] },
  ],
}
```

### P2.3 — Blog Sanity-схема + порожня landing

```ts
{
  name: 'post',
  fields: [
    { name: 'title', type: 'string' },
    { name: 'slug', type: 'slug' },
    { name: 'author', type: 'reference', to: [{ type: 'author' }] },
    { name: 'category', type: 'string' },
    { name: 'language', type: 'string' },
    { name: 'publishedAt', type: 'datetime' },
    { name: 'excerpt', type: 'text' },
    { name: 'coverImage', type: 'image' },
    { name: 'body', type: 'array', of: [{ type: 'block' }, { type: 'image' }, { type: 'code' }] },
    { name: 'seoTitle', type: 'string' },
    { name: 'seoDescription', type: 'text' },
  ],
}
```

`/blog/page.tsx` — навіть з 0 постів має рендерити: H1 «Розбори, кейси і прорахунки. Без води.» + sub-параграф + блок «Поки публікуємо першу хвилю — підпишись на email». Перевір що НЕ повертає порожнє HTML.

### P2.4 — Analytics events

Якщо ще не стоїть — додай GA4 або Plausible. Трекати:
- `cta_calculator_click` (звідки прийшли)
- `calculator_started`
- `calculator_completed` (з value = estimate range)
- `brief_submitted`
- `telegram_click`, `calendly_click`
- scroll depth 50/75/100

---

## Чого НЕ робити

- Не змінюй домен/canonical на vercel.app — лиш на code-site.art (це навмисно, міграція пізніше).
- Не додавай Google Ads / Meta Pixel — це не входить у цей сеанс.
- Не вигадуй цифр («50+ записів», «×3.2 заявок» — лиш ті, що вже є на сайті, або TODO).
- Не торкайся `/portfolio/efedra-clinic` (єдиний живий кейс) — він уже ОК.
- Не пиши документацію / README до того, як виправиш P0.

---

## Фінальний QA-чек перед PR

```bash
pnpm build && pnpm typecheck
pnpm lint

# SEO smoke-test
for url in / /about /pricing /portfolio /calculator /blog \
           /sites-for/medicine /sites-for/legal /sites-for/accounting \
           /sites-for/ecommerce /sites-for/saas /sites-for/real-estate \
           /sites-for/cosmetology /sites-for/education \
           /vs/wordpress /vs/constructors /vs/freelancers \
           /legal /process /contacts; do
  echo "=== $url ==="
  curl -sIL "https://code-site-solutions.vercel.app$url" | head -1
  curl -sL  "https://code-site-solutions.vercel.app$url" \
    | grep -oP '<title[^>]*>\K[^<]+' | head -1
  curl -sL  "https://code-site-solutions.vercel.app$url" \
    | grep -c '<h1'
done

# Robots + sitemap
curl -sL https://code-site-solutions.vercel.app/robots.txt
curl -sL https://code-site-solutions.vercel.app/sitemap.xml | head -30
```

Очікуване: усі 19 URL повертають 200, мають title, ≥1 H1, robots.txt + sitemap.xml існують.

---

**Старт:** почни з P0.1 і покажи план перед виправленням.
