# Domlivo CMS Guide

Guide for content editors and real estate agents using the Domlivo CMS.

## Overview

The Domlivo CMS is where you manage property listings, city and district pages, blog posts, and site settings. Content is organized in the left sidebar. All multilingual content is edited in **one document per item**: you fill in each language (English, Russian, Ukrainian, Albanian) in the same form using language tabs or fields.

---

## Home Page

The homepage is a **single document** that contains all languages. You do not choose “English” or “Albanian” as separate pages — you edit one Home Page and fill in the fields for each language (e.g. Hero Title: en, ru, uk, sq).

**How to edit:**

1. Click **Home Page** in the sidebar.
2. Edit the fields in the tabs: Hero, Featured, Cities, Property Types, Investment, About, Agents, Blog, SEO, FAQ. For text fields that support multiple languages, use the language tabs (en, ru, uk, sq) in each field.

**Sections:**

- **Hero** — Main headline, subtitle, background image, CTA button (text per language).
- **Featured** — Toggle to show/hide, title, subtitle, CTA.
- **Cities** — Title, subtitle, CTA for the cities section.
- **Property Types** — Same structure for property types.
- **Investment** — Title, benefits (up to 3), images, CTA.
- **About** — Title, text, benefits (up to 3).
- **Agents** — Toggle, title, subtitle, text, benefits, CTA.
- **Blog** — Toggle, title, subtitle, CTA.
- **SEO** — Extra SEO text and meta fields (per language where applicable).
- **FAQ** — Toggle, title, FAQ items (up to 20, each with question/answer per language).

Use the **enable** switches to show or hide sections.

---

## Site Settings

Global site settings are in **one document**. All languages are edited in the same place.

**How to edit:**

1. Click **Site Settings**.
2. Edit **Branding** (site name, tagline per language; logo is shared), **Contact** (email, phone, address), **Social** (social links, up to 10), **Footer** (quick links, copyright per language), **SEO** (default meta/OG values).

---

## Cities

Each city is **one document**. All languages for that city (name, hero, description, SEO, etc.) are in the same document.

**How to create a city:**

1. Go to **Locations → Cities**.
2. Click **Create**.
3. Fill in the city name and slug for each language (en, ru, uk, sq) in the localized fields.
4. Add content in the tabs: Basic, Hero, Content, Districts, Media, FAQ, SEO. Use the language tabs inside each text field where available.

**Important fields:**

- **Basic** — City name (per language), slug (per language), popular flag, order, published.
- **Hero** — Title, subtitle, short line, image (shared), CTA (per language).
- **Content** — Description, investment text, featured properties titles (per language).
- **Districts** — Districts section title, intro, district stats (up to 20).
- **Media** — Video URL (shared), gallery (shared, at least 1 image).
- **FAQ** — Title (per language), FAQ items (each with question/answer per language, max 20).
- **SEO** — Meta title, description, OG image (per language where applicable).

---

## Districts

Each district is **one document** with all languages in the same form. Districts belong to a city.

**How to create a district:**

1. Go to **Locations → Districts**.
2. Click **Create**.
3. Set **City** (required).
4. Fill in name, slug, and content in the tabs. Use language tabs in text fields for each locale.

**Important fields:**

- **Basic** — District name (per language), slug (per language), city, published, order.
- **Hero** — Title, subtitle, image (shared), CTA (per language).
- **Content** — Description, metrics (up to 10), CTA.
- **Media** — Gallery (at least 1 image, shared).
- **FAQ** — Title (per language), FAQ items (per language).
- **SEO** — Meta, OG, SEO text (per language where applicable).

Districts must belong to a city.

---

## Properties

### How to create a property

1. Go to **Properties → All Properties** (or **My Properties** if you’re an agent).
2. Click **Create**.
3. Fill in all required fields.

**Basic**

- **Title** — One value per language (en, ru, uk, sq) in the same field.
- **Slug** — Generated from the title; edit if needed.
- **Short Description** and **Description** — Per language in the same document.
- **Agent** — Select the agent.
- **Property Type** — Apartment, House, Land, etc.
- **Status** — Sale, Rent, or Short-term.
- **Published** — On/off for visibility.

**Pricing**

- **Price** — Required (same for all languages).
- **Currency** — EUR, USD, or ALL.
- **Featured** — Highlight in featured sections.
- **Investment** — Mark as investment property.

**Location**

- **City** — Required.
- **District** — Only districts of the chosen city.
- **Address** — Per language.
- **Coordinates** — Optional (lat/lng, shared).
- **Location Tags** — e.g. near beach, central.

**Details**

- **Area** (m²), **Bedrooms**, **Bathrooms**, **Year Built** (shared).
- **Amenities** — List (e.g. Parking, Pool).
- **Property Code** — Internal reference.

**Media**

- **Gallery** — At least 1 image, up to 30 (shared across languages). Enable hotspot for cropping.

**SEO**

- Meta title, description, OG image, etc. (per language if the field is localized).

### City and district

1. Choose **City** first.
2. **District** will only show districts for that city.
3. Both are required for proper categorization.

### Featured properties

1. In the **Pricing** tab, turn on **Featured**.
2. Featured properties appear in homepage and city sections.

### Publishing

- **Published** on = visible on the site.
- **Published** off = draft.
- Use **Publish** to make changes live.

---

## Agents

**How to add an agent:**

1. Go to **Agents**.
2. Click **Create**.
3. Enter name, email, phone, photo.
4. Optionally set **Sanity User ID** if the agent logs into the CMS.

Agents are linked to properties; each property must have an agent.

---

## Property Types and Location Tags

**Property Types** (Apartment, House, Villa, etc.) and **Location Tags** (Sea View, City Center, etc.) are **one document per type/tag** with localized fields. They appear in filters, homepage sections, and cards.

- **Property Types:** Go to **Property Types**, create or edit a type. Fill **Title** and **Short Description** for each language (en, ru, uk, sq) in the same form. Image, order, and active are shared.
- **Location Tags:** Go to **Location Tags**, create or edit a tag. Fill **Title**, **Slug**, and **Description** for each language in the same form. Active is shared.

---

## Blog

**How to create a blog post:**

1. Go to **Blog**.
2. Click **Create**.
3. Enter title, slug, excerpt, content, and publish date. If the schema uses localized fields, fill in each language in the same document (e.g. title and excerpt per language). If there is a **Categories** section, assign the post to a category.
4. Add SEO fields (per language if localized).

There is **one document per post**; all languages for that post are in the same document. Schema.org (e.g. Article) data is built on the frontend from these CMS fields.

---

## Multilingual content

### One document, many languages

- **Home Page, Site Settings, Cities, Districts, Properties, Property Types, Location Tags, Blog** — You always edit a **single document**. Text that varies by language has sub-fields or tabs (en, ru, uk, sq). Fill each language in the same form.
- **Images, URLs, numbers, references** — Stored once and shared across all languages; you do not duplicate them per language.

### No “Create translation” for these types

The old model (separate document per language, e.g. “Create translation”) is **not** used for city, district, home page, site settings, blog post, property type, or location tag. Do not expect a “Create translation” button for those — all languages are in one document.

---

## Tips

- Always set **City** before **District** when creating properties.
- Use **Featured** for properties you want on the homepage.
- Add at least one gallery image for each property.
- Use SEO fields on cities, districts, and blog posts for better search visibility.
- Check **Published** status before expecting content to appear on the site.
