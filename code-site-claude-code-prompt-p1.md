# Code-Site.Art — Claude Code Prompt, Sprint 2 (P1)

> **Context:** Next.js App Router + TypeScript + Tailwind + Sanity + HeroUI, deployed on Vercel. Current domain is `code-site-solutions.vercel.app`; canonicals already point to `code-site.art` (migration is intentional, scheduled later).
> **Previous sprint (P0) is done** — completed commits: `eca6cad`, `8190af2`, `8c0481c`, `016d09c`. Key helpers and patterns already in the codebase:
> - `src/lib/seo.ts` with `hreflangAlternates(path)` → returns `{ canonical, languages: { uk, "x-default" } }`. EN scaffold is commented out with `TODO(i18n-P2.1)`.
> - `src/components/industry-baseline.tsx` (factory for `/sites-for/*` static baseline pages).
> - 7 static `/sites-for/*` pages compiled and indexed.
> - `/portfolio` page split into `publishedCases` (featured + has coverImage) and `upcomingCases` (teaser chips).
> - `app/sitemap.ts` includes all static routes + `STATIC_INDUSTRY_SLUGS` guard against Sanity dupes.
> - `/legal` page is structured imprint with `TODO(copy):` placeholders; `noindex` removed.

## How to work

1. Stick strictly to **P1.1 → P1.7** order. Don't skip ahead.
2. For every task: state the plan (files you'll touch), show the diff, run `pnpm typecheck && pnpm build`, then commit with `feat(seo):`, `feat(ui):`, `feat(content):`, or `fix(seo):` prefix.
3. **Never invent metrics** for Code-Site.Art. Use only what already lives on the site (47 projects, 4 countries, ×3.2 Efedra inquiries, Lighthouse 98, LCP 0.6s, NBYG Bornholm ×6 traffic + 24 inquiries/mo). For anything missing, leave a `TODO(copy):` comment.
4. **Atomic commits**: one P1.x task per commit.
5. Do **not** touch the Vercel domain, redirects, or migration. Canonicals stay on `code-site.art`.

---

## P1.1 — Schema.org JSON-LD across key pages

Create a typed helper module and inject JSON-LD blocks into the relevant pages. Use the official [`schema-dts`](https://github.com/google/schema-dts) types if you can install it; otherwise, plain typed objects are fine.

### Files

- New: `src/lib/seo/json-ld.ts` (helper factory)
- New: `src/components/json-ld.tsx` (`<JsonLd>` component)
- Touched: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/about/page.tsx`, `src/app/pricing/page.tsx`, `src/app/portfolio/page.tsx`, `src/app/portfolio/[slug]/page.tsx`, `src/app/contacts/page.tsx`, `src/app/process/page.tsx`, `src/components/industry-baseline.tsx`, blog templates (if `/blog/[slug]` exists)

### Helper module sketch

```ts
// src/lib/seo/json-ld.ts
import type { Organization, WebSite, Service, FAQPage, Article, ContactPage, BreadcrumbList } from 'schema-dts';

export const SITE_URL = 'https://code-site.art';
export const ORG_NAME = 'Code-Site.Art';

export function organizationSchema(): Organization {
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}#organization`,
    name: ORG_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/og/logo.png`,
    email: 'hi@code-site.art',
    telephone: '+380-97-006-87-07',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Kyiv',
      addressCountry: 'UA',
    },
    sameAs: [
      'https://linkedin.com/in/fedirdev',
      'https://t.me/fedirdev',
      'https://instagram.com/fedirdev',
      'https://github.com/fedirdev',
    ],
    founder: {
      '@type': 'Person',
      name: 'Fedir Alpatov',
      jobTitle: 'Tech Lead · Founder',
      url: 'https://linkedin.com/in/fedirdev',
    },
  };
}

export function websiteSchema(): WebSite {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}#website`,
    url: SITE_URL,
    name: ORG_NAME,
    inLanguage: 'uk-UA',
    publisher: { '@id': `${SITE_URL}#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function serviceSchema(opts: {
  name: string;
  slug: string;          // e.g. 'medicine'
  description: string;
  priceFrom: number;     // USD
  audience: string;      // e.g. 'Healthcare clinics'
}): Service {
  return {
    '@type': 'Service',
    '@id': `${SITE_URL}/sites-for/${opts.slug}#service`,
    name: opts.name,
    description: opts.description,
    provider: { '@id': `${SITE_URL}#organization` },
    serviceType: 'Web development',
    areaServed: ['Ukraine', 'European Union'],
    audience: { '@type': 'BusinessAudience', audienceType: opts.audience },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: opts.priceFrom,
      priceSpecification: {
        '@type': 'PriceSpecification',
        priceCurrency: 'USD',
        minPrice: opts.priceFrom,
      },
    },
  };
}

export function faqSchema(items: { question: string; answer: string }[]): FAQPage {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.question,
      acceptedAnswer: { '@type': 'Answer', text: it.answer },
    })),
  };
}

export function articleSchema(opts: {
  title: string;
  description: string;
  slug: string;          // e.g. 'how-to-pick-web-studio'
  datePublished: string; // ISO
  dateModified?: string;
  authorName: string;
  authorUrl?: string;
  coverImage: string;    // absolute URL
}): Article {
  return {
    '@type': 'Article',
    '@id': `${SITE_URL}/blog/${opts.slug}#article`,
    headline: opts.title,
    description: opts.description,
    image: opts.coverImage,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    author: {
      '@type': 'Person',
      name: opts.authorName,
      url: opts.authorUrl,
    },
    publisher: { '@id': `${SITE_URL}#organization` },
    mainEntityOfPage: `${SITE_URL}/blog/${opts.slug}`,
    inLanguage: 'uk-UA',
  };
}

export function breadcrumbSchema(crumbs: { name: string; url: string }[]): BreadcrumbList {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}
```

### `<JsonLd>` component

```tsx
// src/components/json-ld.tsx
import type { Thing, WithContext } from 'schema-dts';

type Props = { schema: Thing | Thing[] };

export function JsonLd({ schema }: Props) {
  const data = Array.isArray(schema)
    ? { '@context': 'https://schema.org', '@graph': schema }
    : ({ '@context': 'https://schema.org', ...(schema as object) } as WithContext<Thing>);

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted, server-generated JSON
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

### Where to inject

| Page | Schemas |
|---|---|
| `/` (homepage) | `Organization` + `WebSite` (in `<head>` via layout) |
| `/about` | `Organization` (employees if available) + `BreadcrumbList` |
| `/pricing` | `Service` with multiple `Offer`s (Landing, Multi-page, Industry Pro, Custom) + `FAQPage` for the pricing FAQ + `BreadcrumbList` |
| `/portfolio` | `BreadcrumbList` + `CollectionPage` reference |
| `/portfolio/[slug]` | `Article` (CreativeWork variant) with metrics, `Person` for client testimonial |
| `/sites-for/[industry]` | `Service` + `FAQPage` (industry FAQ) + `BreadcrumbList` |
| `/blog/[slug]` | `Article` + `BreadcrumbList` |
| `/contacts` | `ContactPage` + `ContactPoint` |
| `/process` | `HowTo` (7 steps) — optional but nice |

### Acceptance

```bash
pnpm build && curl -sL http://localhost:3000/ | grep -A2 '<script type="application/ld+json">'
```

Run each affected URL through Google's [Rich Results Test](https://search.google.com/test/rich-results) — zero errors. Document FAQPage and Service warnings (if any) in the commit message.

---

## P1.2 — OG images 1200×630 for all key pages

Use Next.js `opengraph-image.tsx` API (edge runtime + `ImageResponse`). One file per route.

### Files to create

- `src/app/opengraph-image.tsx` (homepage)
- `src/app/about/opengraph-image.tsx`
- `src/app/pricing/opengraph-image.tsx`
- `src/app/portfolio/opengraph-image.tsx`
- `src/app/calculator/opengraph-image.tsx`
- `src/app/process/opengraph-image.tsx`
- `src/app/contacts/opengraph-image.tsx`
- `src/app/sites-for/[industry]/opengraph-image.tsx` (dynamic by `params.industry`)
- `src/app/vs/[name]/opengraph-image.tsx` (if you have a dynamic `vs` route; otherwise per-page)
- `src/app/blog/[slug]/opengraph-image.tsx` (dynamic from Sanity)
- `src/app/portfolio/[slug]/opengraph-image.tsx` (dynamic from Sanity)

### Shared template

Extract a `src/lib/seo/og.tsx` factory so all OG images share the same brand layout:

```tsx
// src/lib/seo/og.tsx
import { ImageResponse } from 'next/og';

export const ogSize = { width: 1200, height: 630 } as const;
export const ogContentType = 'image/png';

type Props = {
  eyebrow?: string;       // 'CODE-SITE.ART · BOUTIQUE STUDIO'
  title: string;          // main headline
  accent?: string;        // word(s) to highlight in title (substring match, optional)
  metricA?: string;       // bottom-left, e.g. '×3.2 inquiries · Helsi/Medesk'
  metricB?: string;       // bottom-right, e.g. '47 projects · 4 countries'
  variant?: 'dark' | 'light';
};

export async function renderOg({
  eyebrow = 'CODE-SITE.ART · BOUTIQUE STUDIO',
  title,
  accent,
  metricA,
  metricB,
  variant = 'dark',
}: Props) {
  const bg = variant === 'dark'
    ? 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%)'
    : 'linear-gradient(135deg, #fff 0%, #f5f7fa 100%)';
  const ink = variant === 'dark' ? '#fff' : '#0f1419';
  const muted = variant === 'dark' ? '#9aa3ad' : '#555a60';

  const titleNode = accent && title.includes(accent)
    ? (() => {
        const [before, after] = title.split(accent);
        return (
          <>
            {before}
            <span style={{ color: '#C8461E' }}>{accent}</span>
            {after}
          </>
        );
      })()
    : title;

  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        background: bg, padding: 60, color: ink, fontFamily: 'Inter',
      }}>
        <div style={{ fontSize: 22, color: '#C8461E', letterSpacing: 1, marginBottom: 24 }}>
          {eyebrow}
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05, maxWidth: 1000 }}>
          {titleNode}
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-end', fontSize: 22, color: muted }}>
          <div>{metricA ?? ''}</div>
          <div>{metricB ?? ''}</div>
        </div>
      </div>
    ),
    ogSize,
  );
}
```

Each `opengraph-image.tsx`:

```tsx
import { renderOg, ogSize, ogContentType } from '@/lib/seo/og';

export const runtime = 'edge';
export const size = ogSize;
export const contentType = ogContentType;
export const alt = 'Code-Site.Art';

export default async function Image() {
  return renderOg({
    title: 'Сайт, який приносить заявки — поки ви приймаєте клієнтів',
    accent: 'приносить заявки',
    metricA: 'Custom code · Next.js · Lighthouse 98',
    metricB: '47 проєктів · 4 країни',
  });
}
```

### Acceptance

After build, every page metadata's `openGraph.images` automatically uses the generated PNG (Next.js auto-wires `opengraph-image` files into `<meta property="og:image">`). Test:

```bash
curl -sL http://localhost:3000/ | grep -i 'og:image'
# expect a URL pointing at /opengraph-image
```

Verify in [Twitter Card Validator](https://cards-dev.twitter.com/validator) and [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/).

---

## P1.3 — Internal linking pass

The goal: short, contextual cross-links so users (and Googlebot) navigate between intent levels.

### Concrete edits

1. **`/portfolio/[slug]` page** (e.g. `/portfolio/efedra-clinic`): add a bottom CTA block "Хочете такий же сайт для клініки?" linking to `/sites-for/medicine`. Use the case's `industry` tag to pick the link target.

2. **`/sites-for/[industry]` pages**: add a "Кейси по галузі" section that filters `publishedCases` where `case.industry === slug` (1–3 cards). If none yet — render a "Кейси у роботі" block with the small upcoming-case chips for that industry.

3. **`/pricing` body copy**: in the prose between hero and the price cards, add an inline link:
   > Не впевнені, який тир підходить? Прорахуйте вилку у [калькуляторі](/calculator) за 60 секунд.

4. **`/calculator` after the estimate block**: under the "What you get" section, add a small "Готові поговорити?" rail with two text links:
   - "Подивитись наш [процес](/process)" 
   - "Або кейси клієнтів у [портфоліо](/portfolio)"

5. **`/sites-for/medicine` (and every industry)**: at the bottom FAQ, the last item "Чи можна за законом розміщувати ціни на медичні послуги?" should link out to a future blog post — for now, put `<a href="/blog">детальніше у блозі</a>` placeholder so Googlebot sees one inbound link into `/blog`.

6. **Footer**: keep current structure, but ensure each link uses the canonical absolute URL `https://code-site.art/<path>` when rendered as `og:url` / canonical, while internal nav uses relative paths.

### Acceptance

```bash
pnpm build
# Then manually check anchor counts:
curl -sL http://localhost:3000/pricing | grep -c 'href="/calculator"'  # ≥1
curl -sL http://localhost:3000/portfolio/efedra-clinic | grep -c 'href="/sites-for/medicine"'  # ≥1
```

---

## P1.4 — Calculator: Ukrainian primary, English at `/en/calculator`

Currently the calculator at `/calculator` is fully in English. The rest of the site is Ukrainian. This is the single biggest UX inconsistency on the conversion path.

### What to do

1. Translate every visible string in `/calculator/page.tsx` and its sub-components to Ukrainian (UA = default).
2. Move the existing English copy verbatim to `src/app/en/calculator/page.tsx`. This is a scaffold; the `app/en/*` shell is allowed even if other EN pages aren't ready — calculator is a self-contained tool.
3. Update `hreflangAlternates('/calculator')` to start emitting `languages: { uk: '/calculator', en: '/en/calculator' }` and uncomment the EN scaffold for **this route only** in `src/lib/seo.ts` (or pass an option to the helper).
4. Numeric labels stay in USD (B2B norm in Ukraine). Currency selector is **out of scope** for P1.
5. CTA after estimate: **"Отримати фіксований прайс і timeline за 4 години"** (UA) / **"Get a fixed quote and timeline within 4 hours"** (EN).

### Strings to translate (full list)

| English | Ukrainian |
|---|---|
| "Know your website price in 60 seconds" | "Дізнайтеся ціну сайту за 60 секунд" |
| "No sales call, no "price on request"…" | "Без дзвінків і "ціни під запит"…" |
| "How this estimate works" | "Як працює оцінка" |
| "Base project" | "Базовий проєкт" |
| "Scope add-ons" | "Розширення обсягу" |
| "Final review" | "Фінальна перевірка" |
| "Three packages cover 80% of requests" | "Три пакети закривають 80% запитів" |
| "Starter Landing" | "Starter Landing" (залишити англ.) |
| "Growth Website" | "Growth Website" (залишити англ.) |
| "E-commerce Starter" | "E-commerce Starter" (залишити англ.) |
| "Configure your scope" | "Налаштуйте обсяг" |
| "Project basics" | "Основа проєкту" |
| "Landing page" | "Лендинг" |
| "Multi-page website" | "Багатосторінковий сайт" |
| "E-commerce" | "Інтернет-магазин" |
| "Number of pages" | "Кількість сторінок" |
| "Design & languages" | "Дизайн та мови" |
| "Simple / clean" | "Простий / мінімалізм" |
| "Custom branded" | "Кастомний брендований" |
| "Advanced / premium" | "Преміум / складний" |
| "One language" / "Two languages" / "Three languages" / "Four+" | "Одна мова" / "Дві мови" / "Три мови" / "Чотири+" |
| "CMS & SEO" | "CMS та SEO" |
| "Features & integrations" | "Функції та інтеграції" |
| "Content & timeline" | "Контент і терміни" |
| "Standard timeline" | "Стандартний термін" |
| "Faster delivery" | "Прискорений запуск" |
| "Urgent launch" | "Терміновий запуск" |
| "Estimate summary" | "Підсумок оцінки" |
| "Estimated project range" | "Орієнтовний бюджет проєкту" |
| "Final price after scope review" | "Фінальна ціна — після уточнення обсягу" |
| "What you get at this price" | "Що ви отримаєте за цю ціну" |
| "Why the price changes" | "Чому змінюється ціна" |
| "Show price breakdown" | "Показати деталі розрахунку" |
| "Get exact price & project plan" | "Отримати фіксований прайс і timeline за 4 години" |
| "Or book a 30-min call" | "Або призначити 30-хв дзвінок" |

### Acceptance

```bash
curl -sL http://localhost:3000/calculator | grep -c "Know your website price"  # → 0
curl -sL http://localhost:3000/calculator | grep -c "Дізнайтеся ціну"          # ≥ 1
curl -sL http://localhost:3000/en/calculator | grep -c "Know your website price"  # ≥ 1
```

---

## P1.5 — Hero CTA simplification

The current home hero has two equal-weight CTAs: "Розрахувати вартість" + "Подивитись кейси". This splits attention. Cut to one primary + one ghost.

### What to do

In the home hero section:

1. **Primary button (filled, accent color)**: "Розрахувати вартість за 60 секунд" → `/calculator`
2. **Secondary (ghost — border only, no fill)**: "Подивитись кейси" → `/portfolio`
3. **Trust strip** directly below, single line, small caps:
   > 47 проєктів · 4 країни · Lighthouse 98 · Гарантія 1 рік
4. Remove the existing 4-chip stack above the CTAs (the "Заявки 24/7 / 4-10 тижнів / Гарантія 1 рік / Все під ключ" boxes). Consolidate into the single trust strip.

Keep the right-side hero device mockup. Keep the eyebrow `CODE-SITE.ART · BOUTIQUE STUDIO`.

### Hero copy update

```diff
- H1: «Сайт приймає заявки, поки ви працюєте.»
+ H1: «Сайт, який приносить заявки — поки ви приймаєте клієнтів.»

- Sub: «Готовий сайт за 4-10 тижнів. Ваша участь — 5 годин, далі сайт працює сам: пише заявки, веде клієнтів і ранжується в Google.»
+ Sub: «Кастомний код на Next.js. Прозора фіксована ціна $1k–$14k. Гарантія 1 рік + 30% неустойка за зрив. 47 проєктів у 4 країнах.»
```

### Acceptance

Visual diff on `/` — exactly two buttons in hero, one trust strip below. No 4-chip grid above CTAs.

---

## P1.6 — Testimonial schema + UI for 8+ entries

Today there is one testimonial (Søren Hansen). Build the data model and UI to accept 8+.

### Sanity schema

```ts
// sanity/schemas/testimonial.ts
import { defineField, defineType } from 'sanity';

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({ name: 'authorName',    title: 'Name',              type: 'string', validation: r => r.required() }),
    defineField({ name: 'authorRole',    title: 'Role / position',   type: 'string' }),
    defineField({ name: 'authorCompany', title: 'Company',           type: 'string' }),
    defineField({ name: 'authorPhoto',   title: 'Photo',             type: 'image', options: { hotspot: true } }),
    defineField({ name: 'authorLinkedIn',title: 'LinkedIn URL',      type: 'url' }),
    defineField({ name: 'quote',         title: 'Quote',             type: 'text', rows: 4, validation: r => r.required() }),
    defineField({ name: 'metric',        title: 'Key metric (e.g. ×3.2 inquiries)', type: 'string' }),
    defineField({ name: 'caseSlug',      title: 'Related case',      type: 'reference', to: [{ type: 'case' }] }),
    defineField({ name: 'language',      title: 'Language',          type: 'string',
                  options: { list: [{ title: 'Ukrainian', value: 'uk' }, { title: 'English', value: 'en' }, { title: 'Danish', value: 'da' }] },
                  initialValue: 'uk' }),
    defineField({ name: 'order',         title: 'Display order',     type: 'number' }),
    defineField({ name: 'featured',      title: 'Featured (home + about)', type: 'boolean', initialValue: false }),
  ],
  preview: {
    select: { name: 'authorName', role: 'authorRole', company: 'authorCompany', media: 'authorPhoto' },
    prepare: ({ name, role, company, media }) => ({
      title: name,
      subtitle: [role, company].filter(Boolean).join(' · '),
      media,
    }),
  },
});
```

Register in `sanity/schema.ts`.

### UI component

`src/components/testimonials-carousel.tsx`:

- Server component, accepts `testimonials: Testimonial[]` prop.
- 3 visible on desktop (md+), 1 on mobile.
- Horizontal scroll on mobile with snap; grid on desktop.
- Each card: 80px round photo · name · role · company · LinkedIn icon (link, opens in new tab) · the quote in larger text · optional metric badge.

```tsx
// rough skeleton
export function TestimonialsCarousel({ items }: { items: Testimonial[] }) {
  return (
    <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto snap-x snap-mandatory md:overflow-visible">
      {items.map((t) => (
        <article key={t._id} className="min-w-[85%] md:min-w-0 snap-start rounded-2xl border border-neutral-200 bg-white p-6">
          <header className="flex items-center gap-3 mb-4">
            {t.authorPhoto && <Image src={urlForImage(t.authorPhoto).width(160).url()} alt={t.authorName} width={48} height={48} className="rounded-full" />}
            <div className="flex-1">
              <div className="font-semibold">{t.authorName}</div>
              <div className="text-sm text-neutral-600">{[t.authorRole, t.authorCompany].filter(Boolean).join(' · ')}</div>
            </div>
            {t.authorLinkedIn && <a href={t.authorLinkedIn} target="_blank" rel="noopener" aria-label="LinkedIn">…</a>}
          </header>
          <blockquote className="text-base leading-relaxed">&laquo;{t.quote}&raquo;</blockquote>
          {t.metric && <div className="mt-3 inline-block bg-accent/10 text-accent px-2 py-1 rounded text-sm">{t.metric}</div>}
        </article>
      ))}
    </div>
  );
}
```

### Wiring

- Add a `<TestimonialsCarousel>` instance on:
  - `/` (homepage) — fetch up to 6 where `featured == true`, order by `order asc`
  - `/about` — fetch up to 9, no featured filter
  - `/sites-for/[industry]` — fetch up to 3 where `caseSlug->industry == params.industry`
- Use existing GROQ helpers under `src/sanity/queries/` (or create `testimonialsQuery.ts`).

### Acceptance

- Sanity Studio shows new "Testimonial" doc type.
- The existing Søren Hansen quote becomes the first Testimonial document (data migration is fine to handle by manual entry in Studio, but commit the schema + UI separately).
- `pnpm build` passes.

---

## P1.7 — Copy rewrites (text-only)

Pure search-and-replace across the codebase. Each one is small but high-leverage.

| Location | Old | New |
|---|---|---|
| `/` hero H1 | «Сайт приймає заявки, поки ви працюєте.» | «Сайт, який приносить заявки — поки ви приймаєте клієнтів.» |
| `/` hero sub | «Готовий сайт за 4-10 тижнів. Ваша участь — 5 годин, далі сайт працює сам: пише заявки, веде клієнтів і ранжується в Google.» | «Кастомний код на Next.js. Прозора фіксована ціна $1k–$14k. Гарантія 1 рік + 30% неустойка за зрив. 47 проєктів у 4 країнах.» |
| `/pricing` sub | «Ціна — це те, що ви отримаєте. Не "під запит".» | «Прозорий прайс — те, що зазвичай прячуть. Ось ціна, ось дедлайн, ось неустойка, якщо зриваємо. Без сюрпризів.» |
| `/calculator` final CTA | "Get exact price & project plan" | "Отримати фіксований прайс і timeline за 4 години" (UA-default after P1.4) |
| `/portfolio` H1 | "30+ кейсів: сайти для клінік, юристів, e-commerce, стартапів" | "Кейси з реальними цифрами для клінік, юристів, e-commerce, стартапів" |
| `/portfolio` sub | "Реальні проєкти з реальними метриками. Кожен кейс — повний розбір з «до/після»." | (unchanged) |
| `/about` team section H2 | «12 людей. Чотирьох ви будете чути щодня.» | Keep IF actually 12 people; otherwise: «Ядро з 4 людей. Розширена мережа — ще 8 під ваш проєкт.» — **ask in PR description which is true**. |

### Acceptance

```bash
grep -r "Сайт приймає заявки, поки ви працюєте" src/  # → 0
grep -r "30+ кейсів" src/                              # → 0
```

---

## Out of scope for P1 (don't touch)

- Domain migration to `code-site.art` (intentional, later)
- EN-locale full rollout (only calculator is allowed to go EN-secondary)
- Google Ads / Meta Pixel
- Performance tuning beyond what falls out of P1 work
- Any rewrite of `/portfolio/efedra-clinic`

---

## Final QA checklist before PR

```bash
pnpm typecheck && pnpm lint && pnpm build

# Schema validation — run against your dev URL
for url in / /about /pricing /portfolio /portfolio/efedra-clinic /calculator /sites-for/medicine /sites-for/legal; do
  echo "=== $url ==="
  curl -sL "http://localhost:3000$url" | grep -c 'application/ld+json'   # ≥ 1
  curl -sL "http://localhost:3000$url" | grep -oP 'og:image" content="\K[^"]+' | head -1
done

# Hreflang verification (calculator only — others stay UA-only until P2)
curl -sL http://localhost:3000/calculator | grep 'hreflang'
```

Expected per page: `application/ld+json` count ≥1, og:image returns the auto-generated `/opengraph-image` URL, `/calculator` has both `uk` and `en` hreflang.

---

**Start with P1.1.** Show the plan first, then the diff, then the build output. Commit each P1.x atomically.
