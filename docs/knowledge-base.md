# Knowledge base: editing and review in Studio

The full description (page format, where the code lives, how a number gets onto a
page) is in the frontend repo: `your-house-albania/docs/knowledge-base.md`.
This file covers the CMS side.

## Documents

- **Knowledge · Article** — one question page. The 30 pages of 2026-10-19 have a
  *Topic group* (buying, money, ownership, process, geography); the 23 research
  data sheets imported earlier have none and stay unpublished.
- **Knowledge · Fact** — one citable figure or rule with its source and dates.
  Table rows on a page point at facts by reference.
- **Knowledge · Source** — a law, decision, official page or dataset, with URL,
  publisher, publication and access dates.

## Seeding and translating

```
npx tsx scripts/seedKnowledgeBase20261019.ts --dry
npx tsx scripts/seedKnowledgeBase20261019.ts --execute
npx tsx scripts/translateLocaleGaps.ts --execute --types knowledgeArticle --locales de
```

The English master is `scripts/data/knowledge-base-2026-10-19/`. The seed keeps
existing translations wherever the English text is unchanged, and never clears
*Checked by* / *Checked on*. Run the translation once per locale (`de it pl uk ru
sq`), then once without `--locales` to fill what a failed batch left.

## Review (Viktor Grinchenko)

1. Open the page in Studio, group *Quality & review*. Read *Known gaps* first:
   HIGH ones are where a figure is missing or rests on a secondary source.
2. Check each table row's facts against their sources (open the fact, follow
   *Source* → URL).
3. To correct a figure, do not edit the old fact: create a new one with a new
   *Data ID*, set *Supersedes* to the old one, and set the old one's *Current*
   off with *Valid until*. Every page that cites the family picks it up.
4. When the page is right, set **Checked by** = Viktor Grinchenko and **Checked
   on** = today. The site then shows "Checked by" and adds the reviewer to the
   Article markup. Leave both empty until the review has really happened.
