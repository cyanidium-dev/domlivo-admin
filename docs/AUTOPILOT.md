# Domlivo monthly autopilot

Instructions for the scheduled cloud agent that runs on the first day of every month in this repository (domlivo-admin). It collects primary sources, writes one data article in seven languages, publishes it, announces it and reports to the owner on Telegram. It runs without a human in the loop, so every step below has a check, and the run stops and reports instead of publishing when a check fails.

The site is domlivo.com, a real-estate marketplace for Albania in en, uk, ru, sq, it, pl, de. Its articles are data journalism: figures from primary sources plus the site's own listing data, never rewritten news. Everything the agent publishes must be traceable to a source it names.

## Environment

- Node 20+, `npm ci` once. Scripts run with `npx tsx` (TypeScript) or `node` (.mjs).
- Env vars, set in the cloud environment: `SANITY_PROJECT_ID`, `SANITY_DATASET` (production), `SANITY_API_TOKEN` (write), `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (the leads chat; reports are sent silently). `scripts/**` read them through dotenv or the process environment; there is no `.env` in git.
- Git: commit data files and state to `main` and push. Commit messages end with `Co-Authored-By: Claude <noreply@anthropic.com>`.
- Time budget: one run should finish in under 90 minutes. If a step cannot be completed, skip to "Report" with what happened.

## Step 1. Price index article (every month, no judgement needed)

1. `node scripts/reportDurresPriceIndex.mjs scripts/data/price-index/durres-YYYY-MM.json` where YYYY-MM is the current month. The JSON has the medians per district, layout, stage and sea proximity for Durrës. If it reports fewer than 150 flats, stop this step and note it in the report.
2. Read the previous month's article files in `scripts/data/articles-2026-09-20/` (slug `durres-asking-price-index-2026-09`, seven files) and the previous JSON in `scripts/data/price-index/`. Write the new month's seven files into `scripts/data/articles-YYYY-MM-01/` with slug `durres-asking-price-index-YYYY-MM`, same structure, new figures, and one paragraph on what changed against the previous month (compute the differences yourself from the two JSON files; every number you write must be in the new JSON or the previous one).
3. Add one entry to `ARTICLES` in `scripts/createPriceIndexArticle.ts` (slug, figures path, categories `blogCategory-market`, cover: reuse `image-1cf6d066c64bf3dd3872028133d517db16323bed-3840x2560-jpg` with alt "The beach and seafront at Durrës, Albania"), then run it without `--execute`. Fix every problem it prints. Run with `--execute` only when the dry run prints zero problems.

## Step 2. Sources for the month's second article (judgement needed)

1. `npx tsx scripts/autopilot/collectSources.ts` prints the items that appeared since the last run: Monitor articles on housing, the newest Bank of Albania survey PDF, the property-tax consultation page. Monitor is a secondary source that reports primary ones; fetch the primary document when one is named (Bank of Albania, INSTAT, a ministry, a law) and cite it first.
2. Pick at most one topic, by this order of value: a new Bank of Albania half-year survey; a change in law or tariff that changes a buyer's cost (property tax, reference prices, electricity tariff, foreigners law 79/2021); INSTAT quarterly data on construction permits or transactions; a Monitor analysis with figures that no article on the site has yet. Read the existing posts first: `curl -s https://www.domlivo.com/sitemap-blog.xml` lists them; do not write a second article on a topic the site covers unless the figures are new.
3. If nothing qualifies, skip to Step 4. A month with only the price index is fine; a month with a weak article is not.

## Step 3. Write and publish the second article

Model the files on `scripts/data/articles-2026-09-30/albania-property-market-h1-2026.*.md` (a Bank of Albania survey article) and read the header comment of `scripts/createArticlesFromDir.ts` for the file format and the checks.

Rules that the checks do not enforce but the site depends on:

- Write the English file first from the source, with every figure checked against the source text. Then the six others as translations of it. Do not add a figure in a translation that the English file does not have; the check will refuse it anyway.
- 450–650 words of body, 5 key facts, 3 FAQ items, at least one primary source in `## sources`, and a closing section "What this means for a buyer" with 3–5 internal links from this set (they exist in every locale): `/albania/durres/info`, `/albania/tirana/info`, `/albania/sarande/info`, `/albania/vlore/info`, `/albania/durres`, `/blog/durres-asking-price-index-YYYY-MM` (the current month's index from Step 1), `/blog/albania-property-market-h1-2026`, `/contacts`.
- Say where the data is thin instead of smoothing it over. The site's own listing counts outside Durrës are small; call Saranda and Vlora figures a floor, not a market, as the H1 2026 article does.
- Titles: `metaTitle` ≤ 60 characters, `metaDescription` 140–160, no brand in either (the site adds it). Slug in English, lowercase, hyphens, with the year.
- Cover: pick from the assets already on the site (any of these refs, with its alt):
  - `image-9289a580fbaa144be88b2a4f4b12772f78086db4-1920x1440-jpg` — The Albanian flag on Bulevardi Dëshmorët e Kombit in central Tirana, cranes behind
  - `image-1cf6d066c64bf3dd3872028133d517db16323bed-3840x2560-jpg` — The beach and seafront at Durrës, Albania
  - `image-913e2db279d7a045eddbd3d1b96bd893d1418c3e-1280x1707-jpg` — Bank of Albania building, central Durrës
  - `image-e0710445958bc5a06d6605c0bd7002fba420a7eb-1920x1469-jpg` — Vlorë seen from a balcony above the bay, Albania
  - `image-ac0387533335148f826dae78ca549e073c194a9c-1920x1387-jpg` — Sarandë on the Ionian coast, Albania
  - `image-fcdb6344c62ef3b1508fe4618da626f99834e9a3-1920x1276-jpg` — Apartment blocks and a corner café in central Tirana
  - `image-eee0dbba2fddf27a657aba7cf39bfb4e055c37c9-1920x1036-jpg` — The Palace of Culture on Skanderbeg Square, Tirana
- Categories: `blogCategory-market` for market data, plus one of `blogCategory-legal`, `blogCategory-investment`, `blogCategory-buying` when it fits.

Publish:

```bash
npx tsx scripts/createArticlesFromDir.ts --dir scripts/data/articles-YYYY-MM-DD --slug <slug> \
  --categories blogCategory-market,blogCategory-investment \
  --cover <asset ref> --cover-alt "<alt>"            # dry run: fix every problem it prints
npx tsx scripts/createArticlesFromDir.ts ... --execute   # only after a clean dry run
npx tsx scripts/autopilot/collectSources.ts --mark <source urls used>
```

## Step 4. Announce and record

1. `npx tsx scripts/autopilot/submitIndexNow.ts --slug <slug>` for each published post (seven URLs each).
2. Append one line per published post to `docs/AUTOPILOT-LOG.md`: date, slug, sources used, word counts, anything skipped and why.
3. Commit everything under `scripts/data/`, `scripts/autopilot/state.json`, `scripts/createPriceIndexArticle.ts` and `docs/AUTOPILOT-LOG.md`; push to `main`.
4. Do not request indexing in Search Console, do not touch the frontend repository, do not edit or delete existing posts, do not change scripts other than the `ARTICLES` list in `createPriceIndexArticle.ts`.

## Step 5. Report to the owner (always, even on failure)

Send one message with `npx tsx scripts/autopilot/notifyTelegram.ts "<text>"`, in Russian, in this shape:

```
Domlivo autopilot, <дата>
Индекс цен: опубликован https://www.domlivo.com/en/blog/<slug> (медиана €/м² <x>, <n> квартир, изменение к прошлому месяцу <±y %>) | пропущен: <причина>
Статья: <заголовок en> https://www.domlivo.com/en/blog/<slug>, источник <первичный источник>, 7 языков, IndexNow <код> | пропущена: <причина>
Проверить: <что стоит взглянуть глазами, одна строка, или «ничего»>
```

If a step failed, say which check failed and where the files are, so the owner can finish by hand. Never publish a post whose dry run printed a problem, and never send the report claiming a post is live without having seen `Created 1 posts` in the script output.

## Scheduling

The routine definition is `docs/autopilot-routine.json` (claude.ai cloud routine, cron `0 7 1 * *` = 08:00 London on the first of the month, model claude-opus-5-5, repository cyanidium-dev/domlivo-admin). Creating it needs the Claude account connected to GitHub (https://claude.ai/connect-github) and the five env vars set on the cloud environment (https://claude.ai/code/environments). The `.env` of this repository is not in git; the Sanity token must be copied into the environment by hand. A Telegram bot token and the chat id of the owner's chat are needed for the report.
