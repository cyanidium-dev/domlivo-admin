# DISTRICT CITY AUTO-ASSIGN FIX REPORT

## 1. Root cause

The initial value template `district-in-city` existed and was registered, but the template's `value` function was not correctly receiving the `cityId` parameter in all Sanity runtime paths. Sanity can pass parameters in different shapes depending on context:

- Direct: `params` = `{cityId: "..."}`
- Nested: `params.parameters` or `params.templateParams`

The previous implementation only checked `params?.cityId`, so when parameters were passed in a nested structure, the template returned `{}` and the city field stayed empty.

## 2. What template was added or changed

**File:** `templates/districtInCity.ts`

- **Added:** Robust parameter extraction that handles direct, `parameters`, and `templateParams` structures
- **Behavior:** Returns `{city: {_type: 'reference', _ref: cityId}}` when `cityId` is available; returns `{}` otherwise
- **No schema changes** to district type; the `city` reference field stays visible and required

## 3. How structure/index.ts now passes cityId

Inside the city-scoped list (Cities → [City] → Districts in this City):

```ts
.initialValueTemplates([
  S.initialValueTemplateItem('district-in-city', {
    cityId: c._id,
  }),
])
```

- `c` is the current city from the `cities.map()` closure
- `c._id` is passed as `cityId` to the template
- The document list uses only this template, so clicking + uses it and does not fall back to the default district template
- The template receives `{cityId: c._id}` (or equivalent via nested paths)

## 4. What happens when clicking + inside a city-scoped district list

1. User navigates to **Cities → Vlore → Districts in this City**
2. User clicks the **+** button
3. Sanity uses the `district-in-city` template with `{cityId: <Vlore's _id>}`
4. The template’s `value` function runs and returns `{city: {_type: 'reference', _ref: <Vlore's _id>}}`
5. The new district document opens with `city` already set to Vlore
6. The editor can start editing title and other fields; they do not need to choose the city

## 5. Files changed

| File | Change |
|------|--------|
| `templates/districtInCity.ts` | Robust parameter extraction for `cityId` from multiple possible shapes |
| `structure/index.ts` | No change; already passes `{cityId: c._id}` to the template |
| `sanity.config.ts` | No change; already registers `districtInCityTemplate` |
| `schemaTypes/documents/district.ts` | No change; `city` reference field left as is |

## 6. Final code snippets

### District initial value template

```ts
// templates/districtInCity.ts
import type {Template} from 'sanity'

export const districtInCityTemplate: Template = {
  id: 'district-in-city',
  title: 'District in this city',
  schemaType: 'district',
  parameters: [{name: 'cityId', type: 'string', title: 'City ID'}],
  value: (paramsOrIntent: Record<string, unknown> = {}) => {
    const params =
      (paramsOrIntent?.parameters as Record<string, unknown>) ??
      (paramsOrIntent?.templateParams as Record<string, unknown>) ??
      paramsOrIntent
    const cityId = params?.cityId != null ? String(params.cityId) : ''
    if (!cityId) return {}
    return {
      city: {
        _type: 'reference' as const,
        _ref: cityId,
      },
    }
  },
}
```

### "Districts in this City" structure block

```ts
// structure/index.ts (inside cities.map, per city c)
S.listItem()
  .title('Districts in this City')
  .id(`districts-in-city-${c._id}`)
  .child(
    S.documentTypeList('district')
      .id(`district-list-${c._id}`)
      .schemaType('district')
      .title(`Districts in ${name}`)
      .filter('_type == "district" && city._ref == $cityId')
      .params({cityId: c._id})
      .initialValueTemplates([
        S.initialValueTemplateItem('district-in-city', {
          cityId: c._id,
        }),
      ])
      .defaultOrdering([
        {field: 'order', direction: 'asc'},
        {field: 'title.en', direction: 'asc'},
      ])
  )
```

## Verification

After restarting the dev server (`npm run dev`):

1. Go to **Cities → Vlore → Districts in this City**
2. Click **+** to create a new district
3. Confirm that the **City** field is already set to Vlore
