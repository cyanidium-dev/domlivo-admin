# Paste translations (Sanity Studio)

Editors can bulk-fill **localized** fields using **Paste translations…** below the normal language inputs.

## Where it appears

On object types:

- **Localized String**
- **Localized Text**
- **Localized Block Content** (Portable Text per language)

**Not included:** **Localized Slug** — legacy schema type (unused on current documents). Slugs need strict URL rules; use manual entry per language if you still edit old data.

Nested uses (e.g. SEO meta titles, CTA labels, FAQ questions) use the same types, so the button appears on those fields too.

**Not supported as a single paste target:** `localizedSeo` as one object (paste per nested field instead). `localizedCtaLink` only exposes the helper on the **label** (`localizedString`), not on `href`.

## Supported paste formats

### 1. Separator blocks

```text
---EN---
First paragraph.

Second paragraph.

---UK---
Текст українською.
```

Use `---` around a locale code (EN, UK, UA, RU, AL, SQ, IT). Content runs until the next separator.

### 2. Label lines

```text
EN:
First paragraph.

UK:
Текст.
```

Locale line must match `EN:`, `UK:`, `UA:`, `RU:`, `AL:`, `SQ:`, or `IT:` (case-insensitive). Text can start on the same line after the colon.

### 3. JSON

```json
{
  "en": "English line one.\n\nLine two.",
  "uk": "Українська",
  "ru": "Русский",
  "sq": "Shqip",
  "it": "Italiano"
}
```

Keys are normalized: `ua` → Ukrainian (`uk`), `al` → Albanian (`sq`). Unknown keys are ignored (with a warning in Preview).

## Behaviour

1. Click **Paste translations…**, paste your text, then **Preview** to validate.
2. **Apply to field** is enabled only after a successful Preview; it merges parsed locales into the current field.
3. **Only locales present in the paste are updated**; other languages are left unchanged.
4. Empty locale sections are skipped (they do not clear existing text).

## Portable Text fields

Plain text is turned into **normal** blocks: **blank lines** separate paragraphs (one block per paragraph). No markdown or HTML.

## Why not CSV?

Comma-separated rows break when the translation contains commas or multiple lines. Use separator blocks or JSON instead.

## Canonical locale ids

Stored keys are always: **`en`**, **`uk`**, **`ru`**, **`sq`**, **`it`** (see `lib/languages.ts`).
