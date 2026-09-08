# Content operations — the editor's manual (ТЗ-18)

**Two documents, two jobs.** This file is the *how*: how to create each kind of page with the tools that already exist, what to check before publishing, how translation works, when data must be refreshed, and what each list in the Studio's **Content ops** section means. The *rules* — facts only from the research knowledge base, text minimums, native Albanian, image licensing, sale-only, data hygiene — live in `your-house-albania/CONTENT-OPS.md` and are enforced by the `content-qa` audit in that repository. Read that file first; nothing below overrides it.

**The one source of facts** is the research knowledge base (`DomLivo Research Department/knowledge-base/`, `MASTER-KNOWLEDGE-BASE.md` is its index). A number without a KB source does not go on the site.

Every command below runs in this repository (`domlivo-admin`). Every writing script is **dry by default** and needs `--execute`; most snapshot what they change into `scripts/data/`.

---

## 1. Where content lives

| Document type | Renders as | Notes |
|---|---|---|
| `landingPage` (`pageType: city`) | `/{country}/{city}/info` | one per city; generated, then edited |
| `landingPage` (`district`) | `/{country}/{city}/districts/{district}` | generated from the district + its `zoneMetrics` |
| `landingPage` (`custom`) | `/guides/{slug}` | hubs, comparisons, type×city pages, market clusters; `locales` scopes a page to some locales |
| `city`, `district` | zone pages, breadcrumbs, filters | publish gate: five title locales, `description.en` ≥ 200 chars, hero, **gallery**, one `zoneMetrics` row |
| `zoneMetrics` | price tables, stats bands, market position badges | one row per zone per period; never edit an old period, add a new one |
| `blogPost` | `/blog/{slug}` | AEO shape: TOC, keyFacts, FAQ, sources, author |
| `tracker` | tracker blocks and embeds | monthly check cadence |
| `developer` | developer badges and rating blocks | quarterly review cadence |
| `property` | listings, catalog, map | comes from the Telegram bot, Studio ✨ Parse, or the partner import |
| `imageCredit` | `/image-credits` | one per licensed asset; stand-ins are marked |
| `agent` | `/agent/{slug}` | untick **Published** to drop a page from the sitemap |

---

## 2. How to create each page type

**A city or district.** Zones are declared in `scripts/data/zones.json`, never by hand in Studio.
1. Add the zone (a city needs an explicit country), then `npm run create:zone-shells` → unpublished shells.
2. Write `description` (five locales, ≥ 200 chars; CONTENT-OPS minimums are higher), hero and gallery from licensed photos (`npm run source:zone-images`, `npm run apply:zone-images`, `npm run backfill:image-credits`).
3. Add the price row: `npm run seed:zone-metrics` (from the KB file of the city) — the reference-price edition is mandatory.
4. `npm run generate:zone-seo`, then `npm run generate:district-landings` or `npm run generate:city-landings` (idempotent; `--verify` shows what a re-run would touch, `--force` replaces Studio edits).
5. `npm run audit:zone-readiness` — publish only what it reports **ready** (`--promote` publishes them). `npm run zones:verify` runs the whole chain's checks.

**A comparison («X vs Y»).** Add the pair to `scripts/data/comparisons.json` and run `npm run generate:comparisons`. Prices are never typed: they come from `zoneMetrics`, and a test fails the build if a €/m² figure appears in the config for a zone that has metrics. Both zones must be published.

**A type × city page.** `npm run generate:type-city-landings` maintains the registry; pages below the inventory threshold ship `noIndex` and carry `TODO-CONTENT` stubs until an editor writes the prose. `--verify` reports drift.

**A guide, hub, or market cluster.** Copy the pattern of `scripts/seedGuideHubs.ts` (`npm run seed:guide-hubs`) or, for a page that exists in one market only, `scripts/lib/plCluster.ts` + `scripts/seedPlCluster.ts` (`npm run seed:pl-cluster`): the pages are **data in a module with a quality test** (body length, links to siblings and the catalog, FAQ word counts, meta lengths, sources), the seeder is `createIfNotExists` with `--force`. Set `topicTags` so the related-pages block links the cluster, and `locales` when the page must not exist in every locale.

**A blog post.** Write the plan file (see `docs/superpowers/plans/2026-09-02-blogpost-*.md` for the shape), then:
`npm run create:blog-post` → `npm run apply:blog-seo-draft` (English meta) → `npm run add:blog-covers` (licensed cover with credit) → `npm run translate:blog-post` → `npm run translate:blog-tables` (tables are skipped by the body translator) → `npm run audit:block-translations` → `npm run publish:blog-post`.
To fix only the opening paragraph of a live post: `npm run patch:blog-lead`, then `npm run translate:blog-lead`.

**A district FAQ batch.** JSON source with 35–75-word answers → `npm run add:district-faq` (drafts, with a six-locale heading) → `npm run translate:by-type -- landingPage --locales=sq,uk,ru,it,pl --drafts-only` → `npx tsx scripts/verifyFaqDrafts.ts` → `npm run publish:document -- <ids>`.

**A tracker or a developer.** The field guide is `docs/engineering/CONTENT-developer-and-tracker-2026-08-23.md` (workspace). Create in Studio; translate new tracker text with `scripts/translateTracker.ts`. A tracker is published only after its facts are re-checked (`lastCheckedAt` = today).

**A property.** Intake through the Telegram bot (review → Update / Post) or Studio ✨ Parse. Afterwards `npm run editorial:property -- --slug <slug>` writes real copy from the source ad; `npm run backfill:construction-stage` marks completed units from `yearBuilt` and lists the rest for a decision; `npm run seed:property-coordinates` gives coordinates to listings that have none (marked approximate).

---

## 3. Publish checklist

Before pressing Publish (or running a publish script), every item holds:

- [ ] SEO meta title and description in **every locale the page exists in** (Studio validation enforces it; scoped pages need only their own locales).
- [ ] No `TODO-CONTENT` anywhere on the page (the Content ops desk and the ⚠ TODO badge show them).
- [ ] `contentUpdatedAt` set to the day the figures were last checked.
- [ ] Every figure has a source in the page's sources block, with the KB's confidence marker.
- [ ] FAQ answers are 35–75 words and end with a full sentence; the FAQ section has its own title.
- [ ] The hero has a `shortLine` (without it the theme's placeholder eyebrow renders).
- [ ] Zones: hero **and** gallery, licensed and credited; `npm run audit:zone-readiness` says ready.
- [ ] `locales` is set only on purpose; an unscoped page is visible in all six.
- [ ] Albanian and Polish written by a model are marked *pending native review* in the run record until a native speaker has read them.
- [ ] Nothing is deleted. To take a page down: `npm run unpublish:document -- <id>`.

---

## 4. Translation

- `npm run translate:by-type -- <type> [--locales=…] [--drafts-only]` fills **empty** locales on every document of a type; it never overwrites.
- `npm run translate:blog-post -- <slug>` translates a post (fields + body); `npm run translate:blog-tables -- <slug>` handles `blogTable` cells, which the body translator copies in English; `npm run translate:blog-lead -- <slug>` re-translates only block 0.
- `npm run audit:block-translations -- <slug>` proves a post is translated block by block (a headline that is a place name will show as "identical" in sq/it — that is fine).
- `npm run translate:inline -- <json>` writes hand translations when the AI endpoint is unavailable; `npm run dump:blog-for-translation -- <slug>` produces the source file.
- The endpoint requires the source language to be among the requested locales; the scripts handle it.
- `npm run fix:keys` repairs array items without `_key`, which every localization pass silently skips.
- Coverage reports: `npm run audit:zone-localization`, `npm run audit:pl-locale`.

---

## 5. Data-refresh cadence

From `MASTER-KNOWLEDGE-BASE.md` §4, with the CMS action and the desk list that turns red when it is missed:

| KB row | When | CMS action | Desk list |
|---|---|---|---|
| Bank of Albania HPI → files 01/02/04 | April / October | new `zoneMetrics` period rows → `npm run generate:zone-seo` → `npm run generate:district-landings -- --verify`, `npm run generate:city-landings -- --verify` | Zone metrics: newest row older than 10 months |
| Developer traffic light (06) | quarterly | review the tier, set `lastReviewedAt` | Developers: not reviewed for 90 days |
| Trackers: Vlora airport, railway, Porto Romano, Durrës Marina, Kushner (08) | monthly | re-verify, add a timeline entry if anything moved, set `lastCheckedAt`; translate new text | Trackers: not checked for 30 days |
| SERP + AI-citation snapshots (09/10) | quarterly | roadmap measurement log (`your-house-albania/docs/seo/SEO-ROADMAP-12M.md`), no CMS change | — |
| Tax reform → 05 | on enactment | re-check legal posts and hubs; `npm run patch:blog-lead` for leads that state a rate | — |
| Zone reference prices | when the map is updated | `zoneMetrics.referencePriceEdition` + new rows | Zone metrics (after the edition changes) |
| Deloitte Property Index | autumn | macro figures in hubs, the Polish cluster and blog leads | — |

---

## 6. The Content ops desk

Studio → **Content ops**. Every list is a saved filter; `npm run audit:content-ops` prints the same lists from the command line (published documents only). Cut-offs are computed when Studio loads — reload a tab that has been open for a day.

| List | What it means | What closes it |
|---|---|---|
| Landings: TODO-CONTENT stubs | a generator left editorial prose to write | write the prose from the KB, set `contentUpdatedAt` |
| Landings: one-locale pages | pages that exist only in the listed locales | confirm the scope is intentional |
| Landings: no Polish meta | an enabled landing whose SEO title has no `pl` value | add the meta (or `npm run translate:by-type -- landingPage --locales=pl`) |
| Zones: published without a gallery | a published city or district with no gallery photos — a defect | add licensed photos with credits, or unpublish |
| Zone metrics: newest row older than 10 months | the zone has had no new price row since an HPI release was missed (`periodDate` is the period start; old rows stay as history) | add a new period row; never edit the old one |
| Trackers: not checked for 30 days | monthly cadence missed | re-verify, timeline entry, `lastCheckedAt` |
| Developers: not reviewed for 90 days | quarterly review missed | re-check, confirm tier, `lastReviewedAt` |
| Properties: construction stage unset | no facet match, no badge | decide off-plan / under construction / completed |
| Properties: approximate location | the map pin is a district centroid | enter real coordinates, set precision to exact |
| Agents: no listings | an agent page with nothing behind it, usually a test record | untick **Published**, or attach listings |

Landing lists show a **⚠ TODO** badge on stubbed pages and the locale scope in the subtitle.

---

## 7. Never delete

Documents are unpublished, not deleted (`npm run unpublish:document`). Publishing scripts snapshot the previous published version first. Backups of every scripted change sit in `scripts/data/` (git-ignored). If a script wrote something wrong, the snapshot is the way back.
