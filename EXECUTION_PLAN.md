# Execution Plan: Reset + Reseed

## 1. Scripts removed

- `scripts/migrateFieldLevelI18n.ts` — failed migration
- `scripts/cleanupOldDocumentI18n.ts` — migration-specific cleanup
- `scripts/auditMultilingualDuplicates.ts` — migration-related audit
- `scripts/fixMultilingualDuplicates.ts` — migration-related fix
- NPM scripts: `audit:duplicates`, `fix:duplicates`, `migrate:field-i18n`, `cleanup:i18n:dry`, `cleanup:i18n`

## 2. Scripts kept

- `scripts/seed.ts` — rewritten for field-level i18n
- `scripts/fix-missing-keys.ts`, `scripts/fixMissingKeys.ts`
- `scripts/fix-translation-groups.ts` — for blogPost
- `scripts/auth-test.ts`

## 3. New scripts

- `scripts/resetContentForFieldLevelI18n.ts` — removes bad/old content
  - `npm run reset:content:dry` — preview only
  - `npm run reset:content` — execute deletion

## 4. Content types that will be deleted (reset)

- **city**: all documents (old doc-level + broken migrated)
- **district**: all documents
- **homePage**: all documents
- **siteSettings**: all documents
- **translation.metadata** for city, district, homePage, siteSettings

## 5. Content types NOT deleted

- property
- propertyType
- locationTag
- agent
- blogPost

## 6. Fresh content created by seed

- Property types: 5 (Apartment, House, Villa, Commercial, Short Term Rental)
- Location tags: 8 (sea-view, city-center, new-building, investment, beachfront, luxury, near-park, tourist-area)
- Agents: 3
- Cities: 4 (Tirana, Durres, Vlore, Sarande) — one doc each, field-level i18n
- Districts: 9 — one doc each, field-level i18n
- HomePage: 1 singleton
- SiteSettings: 1 singleton
- Properties: 10 demo properties
- Blog posts: 8 (2 topics × 4 languages)

## 7. Manual steps (do not run automatically)

1. **Preview reset**  
   `npm run reset:content:dry`

2. **Execute reset**  
   `npm run reset:content`

3. **Reseed**  
   `npm run seed`
