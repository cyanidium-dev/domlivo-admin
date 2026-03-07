# Domlivo Project Roadmap

Possible future improvements for the Domlivo platform.

**Current architecture (as of this doc):** Field-level i18n only. One document per city, district, home page, site settings, property, and blog post; localized fields (en, ru, uk, sq) hold text; media, URLs, numbers, and references are shared. No document-level translations or per-language singleton documents. See ARCHITECTURE.md and DATA_MODEL.md.

---

## Content & Taxonomy

### Property amenities taxonomy

- Replace free-text amenities with a reference to an `amenity` document type.
- Define standard amenities (Parking, Pool, Balcony, etc.) with slug and icon.
- Enables consistent filtering and display across the site.

### Property features / custom fields

- Allow custom fields or feature flags per property (e.g. sea view, elevator).
- Useful for advanced filters and comparison.

### Neighborhood / area taxonomy

- Add `neighborhood` or `area` between district and property.
- Support URLs like `/en/sale/tirana/blloku/block-5`.

---

## Search & Discovery

### Advanced search filters

- Filters by: price range, bedrooms, area, property type, amenities.
- Saved searches or alerts for users.
- Map-based search with bounds.

### Map clustering

- Show property clusters on a map.
- Expand clusters on zoom.
- Click clusters to see property list.

### Property comparison

- Compare 2–4 properties side by side.
- Compare specs, price, location, amenities.

---

## Analytics & Insights

### Analytics integration

- Send events to GA4 or similar.
- Track views, saves, contacts per property.
- Dashboards for agents and admins.

### Lead management

- Store and manage leads (contacts, inquiries).
- Assign leads to agents.
- Basic lead pipeline (new → contacted → converted).

### CRM integration

- Sync with external CRM (HubSpot, Pipedrive, etc.).
- Push leads and property views.
- Sync agent and contact data.

---

## Content & AI

### AI property descriptions

- Generate or enhance descriptions from basic inputs.
- Support multiple languages (fill localizedString/localizedText).
- Keep human review before publishing.

### Smart recommendations

- “Similar properties” based on type, price, location.
- “You might also like” for users.

### Automated translations

- Use AI to draft translations for new content (e.g. fill missing locales in localizedString).
- Human review and editing before publish.

---

## Technical Improvements

### Schema versioning

- Version major schema changes.
- Migration scripts for existing data when adding or changing fields.

### Performance

- Image optimization (responsive, WebP).
- Lazy loading for galleries.
- CDN for Sanity assets.

### Preview mode

- Draft preview in the frontend before publish.
- Iframe or overlay from Studio to site.

### Access control

- Enforce hard security in backend/API layer for agent-only property editing and restricted access to site-wide content (homePage, siteSettings, cities, districts, blog). Studio structure is UX-only.

---

## Future Considerations

- **Reviews / ratings** — Property or agent ratings.
- **Virtual tours** — 360° or video embedding.
- **Document scheduling** — Publish/unpublish at a specific time.
- **Workflow / approvals** — Draft → review → publish.
- **Multi-currency display** — Show prices in user’s currency.
- **Booking / availability** — For short-term rentals.
