# BLOG AUTHOR SIMPLIFICATION REPORT

## 1. What was over-engineered before

The blog post had an `author` field that referenced the `agent` document type. This was over-engineered because:

- Blog author info is only needed as lightweight SEO/editorial metadata
- Forcing a link to `agent` required either creating agent documents for every blog author or reusing agents who may not be authors
- The `agent` schema is for property listings (name, email, phone, userId), not for editorial bylines
- A separate document type or reference added unnecessary complexity for simple display metadata

## 2. What was removed

- **`author`** field (reference to `agent`) — removed from `blogPost`
- **`readingTimeMinutes`** — removed from GROQ fragment (field was already removed from schema earlier)

No separate `author.ts` schema existed; the reference was to `agent`.

## 3. What the final embedded author model is

Author data is now stored directly in the blog post as simple fields:

| Field        | Type   | Required | Description                          |
|-------------|--------|----------|--------------------------------------|
| authorName  | string | No       | Display name for byline and SEO      |
| authorRole  | string | No       | Optional title (e.g. "Real Estate Advisor") |
| authorImage | image  | No       | Optional author photo                |

- All fields are optional
- Editors enter author info directly in the post
- No references, no extra document types

## 4. Files changed

| File | Change |
|------|--------|
| `schemaTypes/documents/blogPost.ts` | Replaced `author` (reference to agent) with `authorName`, `authorRole`, `authorImage` |
| `lib/sanity/fragments.ts` | Updated BLOG_POST_FULL_FRAGMENT: removed `readingTimeMinutes`, added `authorRole` and `authorImage` |
