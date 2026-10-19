# Translator brief — Domlivo articles, 2026-10-19

You translate one English master article (`<slug>.en.md`) into the other site locales and write one file per locale next to it: `<slug>.<locale>.md`, locales `de`, `uk`, `ru`, `sq`, `it`, `pl` (unless your task names fewer). Translation is done by you, by hand, in this session: never call any translation API or script.

The files are published by `scripts/createArticlesFromDir.ts`, which REJECTS the article if any rule below is broken. Read the English file fully first.

## File structure (copy exactly)

- Keep the marker lines exactly as in English: `## title`, `## metaTitle`, `## metaDescription`, `## excerpt`, `## keyFacts`, `## body`, `## faq`. These marker words stay in English.
- **Do not** write a `## sources` section. Sources exist only in the English file.
- `## keyFacts`: the same number of numbered items as English.
- `## body`: translate the `## ` section headings inside the body (they become h2). Never use `###`.
- `## faq`: the same number of items. Each item is `**Question?**` on one line, the answer on the next line, a blank line between items. Every question ends with `?`. Answers 35–75 words.
- Tables: the same number of rows (every line starting with `|`), same columns. Never put a link inside a table cell.
- Links `[text](/path)`: translate the text, keep the path byte-for-byte identical. Every locale must have exactly the same set of link paths as English, no more, no fewer.
- Lines like `{{zoneStatsEmbed:durres}}` or `{{guideDownloadEmbed}}`: copy unchanged, same position.

## Lengths (counted in characters, checked by the script)

- `metaTitle` at most 60 characters.
- `metaDescription` between 140 and 160 characters. Count it before you save. Rewrite it in the target language naturally rather than translating word by word; keep the question or the answer at the start.

## Numbers (checked by the script)

- Every number larger than 12 that appears in your file must also appear in the English file. Do not add numbers: no new years, no conversions, no rounding to different values, no counts the English does not state.
- You may format numbers the local way: `1.500` or `1 500` instead of `1,500`, `0,05%` instead of `0.05%`, `€1.500` or `1 500 €`. The value must stay the same.
- Dates written like `18.10.2026` or `31.12.2026` stay in that form. Write months in words only where English does.
- Keep legal references exactly: `Article 84 of Law 79/2021` → `Art. 84 des Gesetzes 79/2021` / `статья 84 закона 79/2021` etc.

## Style

Write as a native editor of that language would for a property website: plain, concrete, no marketing tone. Avoid AI tells: no "It's not X, it's Y", no "no X, no Y, no Z" lists, no dramatic colons, no "in conclusion", no filler adjectives. Short sentences are fine. Address the reader the way sites in that market do (German: "Sie"; Polish: forms without "Pan/Pani" or with impersonal constructions; Russian/Ukrainian: "вы" lower case; Italian: "tu" is fine; Albanian: "ju").

Terms by language:
- German: Doppelbesteuerungsabkommen (DBA), Progressionsvorbehalt, Einkommensteuergesetz (EStG), Anlage AUS, Führungszeugnis, Aufenthaltserlaubnis, Notar, Grundbuch/Katasteramt (ASHK), Kaufnebenkosten, Grunderwerbsteuer (only when talking about the 2% Albanian transfer tax call it "Übertragungssteuer von 2 %").
- Albanian: lekë (plural), çmimi i referencës, noter, ASHK, kartela e pasurisë, leje përdorimi, rivlerësim.
- Use "Domlivo" as the brand name.

Place names as the site writes them:

| en | de | it | pl | ru | uk | sq |
|---|---|---|---|---|---|---|
| Durrës | Durrës | Durazzo | Durrës | Дуррес | Дуррес | Durrës |
| Vlorë | Vlora | Valona | Vlora | Влёра | Вльора | Vlorë |
| Sarandë | Saranda | Saranda | Saranda | Саранда | Саранда | Sarandë |
| Tirana | Tirana | Tirana | Tirana | Тирана | Тірана | Tirana |
| Shëngjin | Shëngjin | Shëngjin | Shëngjin | Шенджин | Шенджін | Shëngjin |
| Himarë | Himara | Himara | Himara | Химара | Хімара | Himarë |
| Ksamil | Ksamil | Ksamil | Ksamil | Ксамил | Ксаміл | Ksamil |
| Golem | Golem | Golem | Golem | Голем | Голем | Golem |
| Plazh | Plazh | Plazh | Plazh | Плаж | Плаж | Plazh |
| Shkëmbi i Kavajës | Shkëmbi i Kavajës | Shkëmbi i Kavajës | Shkëmbi i Kavajës | Шкемби-и-Каваес | Шкембі-і-Каваєс | Shkëmbi i Kavajës |
| Lungomare | Lungomare | Lungomare | Lungomare | Лунгомаре | Лунгомаре | Lungomare |
| Orikum | Orikum | Orikum | Orikum | Орикум | Орикум | Orikum |
| Velipojë | Velipoja | Velipoja | Velipoja | Велипоя | Веліпоя | Velipojë |
| Blloku | Blloku | Blloku | Blloku | Блоку | Блоку | Blloku |

## When you finish

Re-open each file you wrote and check: markers, counts of key facts and FAQ items, table rows, link paths, embed lines, metaTitle ≤ 60, metaDescription 140–160, no number > 12 that the English lacks. Then report in 3 lines: files written, and anything in the English you found unclear or possibly wrong (do not fix facts yourself).
