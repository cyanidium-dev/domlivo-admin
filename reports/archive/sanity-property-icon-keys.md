# Sanity Property Icon Keys

Canonical list of icon keys for property amenities and property offers. Single source of truth for Sanity ↔ frontend sync.

## Usage

These values are used in:

- `property.amenities[].iconKey` (propertyAmenity)
- `property.propertyOffers[].iconKey` (propertyOffer)

When `customIcon` is set on an item, it overrides the selected `iconKey`. Use custom icon upload for icons not in this list.

## Frontend Mapping

Frontend maps these keys to Iconify IDs using the `ph:` (Phosphor) prefix:

| iconKey   | Iconify ID  | Semantic meaning                         |
|-----------|-------------|-----------------------------------------|
| elevator  | ph:elevator | Building elevator                       |
| balcony   | ph:balcony  | Balcony                                 |
| parking   | ph:parking  | Parking                                 |
| snowflake | ph:snowflake | Air conditioning                       |
| car       | ph:car      | Car access / parking                    |
| waves     | ph:waves    | Sea view / pool                         |
| map-pin   | ph:map-pin  | Location                                |
| key       | ph:key      | Move-in ready                           |
| smartphone| ph:smartphone | Smart home integration               |
| layout    | ph:layout   | Spacious layout                         |
| sun       | ph:sun      | Natural light                           |
| shield    | ph:shield   | Security                               |
| wifi      | ph:wifi     | WiFi                                    |
| home      | ph:house    | Home / terrace                          |
| building  | ph:building | Building / investment                  |
| tree      | ph:tree     | Garden / nature / quiet area            |
| sofa      | ph:sofa     | Furnished                               |
| cloud     | ph:cloud    | Outdoor spaces                          |
| zap       | ph:lightning | Energy efficiency                     |

## Full Key List

```ts
// schemaTypes/constants/iconOptions.ts
export const PROPERTY_ICON_KEYS = [
  'elevator',
  'balcony',
  'parking',
  'snowflake',
  'car',
  'waves',
  'map-pin',
  'key',
  'smartphone',
  'layout',
  'sun',
  'shield',
  'wifi',
  'home',
  'building',
  'tree',
  'sofa',
  'cloud',
  'zap',
] as const
```

## Schema Validation

The `iconKey` field in both `propertyAmenity` and `propertyOffer` is validated against this list. Only these values are allowed; editors select from a dropdown. Unknown values will trigger validation errors until corrected (e.g. via migration).

## Adding New Icons

1. Add the key to `PROPERTY_ICON_KEYS` in `schemaTypes/constants/iconOptions.ts`
2. Add `{ title: 'Human Label', value: 'key' }` to `PROPERTY_ICON_OPTIONS`
3. Update this document and the frontend `resolvePropertyIconKey` mapper
4. Ensure Iconify has the icon (ph:key) or add fallback in frontend
