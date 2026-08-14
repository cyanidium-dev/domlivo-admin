# Districts Ordering Debug Fix Report

## 1. Root cause

The "Districts in this City" child pane lacked an explicit `.id()`. Sanity's structure builder may reuse or conflict pane IDs when lists are created dynamically (e.g. in the async Cities child). That could cause the district list pane to inherit config from another pane—likely the property list—whose ordering uses the `order` field. Since `property` has no `order` field, the error appeared: "The current ordering config targeted the nonexistent field 'order' on schema type 'property'."

## 2. Exact file/section fixed

`structure/index.ts` — the "Districts in this City" list item and its child `S.documentTypeList('district')`:

- Added `.id(\`districts-in-city-${c._id}\`)` to the list item
- Added `.id(\`district-list-${c._id}\`)` and `.schemaType('district')` to the document list
- Updated filter to include `_type == "district"` explicitly: `_type == "district" && city._ref == $cityId`

## 3. Schema type used by the child list

`district` — via `S.documentTypeList('district')` and `.schemaType('district')`.

## 4. Filter used

```
_type == "district" && city._ref == $cityId
```

`$cityId` is provided via `.params({ cityId: c._id })`.

## 5. Ordering used

```
[
  { field: 'order', direction: 'asc' },
  { field: 'title.en', direction: 'asc' }
]
```

Both fields exist on the district schema.

## Verification

- Cities → Tirana → Districts in this City should load district documents only
- No ordering error
- District list remains filtered by the selected city
