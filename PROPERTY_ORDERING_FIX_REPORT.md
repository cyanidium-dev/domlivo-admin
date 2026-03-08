# Property Ordering Fix Report

## What caused the error

The Studio structure was using a default or inherited ordering that referenced the `order` field on the `property` schema. The `property` document type does not have an `order` field (unlike `city`, `district`, `propertyType`, etc.), so the ordering config was invalid and triggered the error.

## Where it was fixed

`structure/index.ts` — Property document lists now have explicit `defaultOrdering`:

1. **My Properties** — Added `.defaultOrdering([{field: 'createdAt', direction: 'desc'}])` to the `S.documentTypeList('property')` used for the My Properties filter.
2. **All Properties** — Replaced `S.documentTypeListItem('property')` with a `S.listItem()` whose child is `S.documentTypeList('property')` with `.defaultOrdering([{field: 'createdAt', direction: 'desc'}])`.

## Ordering used for properties

Properties are ordered by **`createdAt` descending** (newest first).

This uses the existing `createdAt` field on the property schema (analytics group) and avoids introducing an `order` field.

## Verification

- Districts use `order` (district schema has this field); no change.
- Cities use `order` (city schema has this field); no change.
- Structure builder still groups districts by city as designed.
- Property lists now use a valid ordering and should no longer show the error.
