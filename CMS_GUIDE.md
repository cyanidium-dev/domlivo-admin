# Domlivo CMS Guide

Guide for content editors and real estate agents using the Domlivo CMS.

## Overview

The Domlivo CMS is where you manage property listings, city and district pages, blog posts, and site settings. Content is organized in the left sidebar.

---

## Home Page

The homepage has a separate version for each language (English, Russian, Ukrainian, Albanian).

**How to edit:**

1. Click **Home Page** in the sidebar.
2. Choose the language (e.g. English).
3. Edit the fields in the tabs: Hero, Featured, Cities, Property Types, Investment, About, Agents, Blog, SEO, FAQ.

**Sections:**

- **Hero** — Main headline, subtitle, background image, CTA button.
- **Featured** — Toggle to show/hide, title, subtitle, CTA.
- **Cities** — Title, subtitle, CTA for the cities section.
- **Property Types** — Same structure for property types.
- **Investment** — Title, benefits (up to 3), images, CTA.
- **About** — Title, text, benefits (up to 3).
- **Agents** — Toggle, title, subtitle, text, benefits, CTA.
- **Blog** — Toggle, title, subtitle, CTA.
- **SEO** — Extra SEO text and meta fields.
- **FAQ** — Toggle, title, FAQ items (up to 20).

Use the **enable** switches to show or hide sections.

---

## Site Settings

Global site settings, one set per language.

**How to edit:**

1. Click **Site Settings**.
2. Choose the language.
3. Edit **Branding** (site name, tagline, logo), **Contact** (email, phone, address), **Social** (social links, up to 10), **Footer** (quick links, copyright), **SEO** (default meta/OG values).

---

## Cities

**How to create a city:**

1. Go to **Locations → Cities**.
2. Click **Create**.
3. Fill in the city name and slug (generated from name).
4. Add content in the tabs: Basic, Hero, Content, Districts, Media, FAQ, SEO.

**Important fields:**

- **Basic** — City name, slug, popular flag, order, published.
- **Hero** — Title, subtitle, short line, image, CTA.
- **Content** — Description, investment text, featured properties titles.
- **Districts** — Districts section title, intro, district stats (up to 20).
- **Media** — Video URL (YouTube/Vimeo), gallery (at least 1 image).
- **FAQ** — Title, FAQ items (up to 20).
- **SEO** — Meta title, description, OG image.

Use **Create translation** to add other languages.

---

## Districts

**How to create a district:**

1. Go to **Locations → Districts**.
2. Click **Create**.
3. Set **City** (required).
4. Fill in name, slug, and content in the tabs.

**Important fields:**

- **Basic** — District name, slug, city, published, order.
- **Hero** — Title, subtitle, image, CTA.
- **Content** — Description, metrics (up to 10), CTA.
- **Media** — Gallery (at least 1 image).
- **FAQ** — Title, FAQ items.
- **SEO** — Meta, OG, SEO text.

Districts must belong to a city.

---

## Properties

### How to create a property

1. Go to **Properties → All Properties** (or **My Properties** if you’re an agent).
2. Click **Create**.
3. Fill in all required fields.

**Basic**

- **Title** — One value per language (English, Russian, Ukrainian, Albanian).
- **Slug** — Generated from the title; edit if needed.
- **Short Description** and **Description** — Per language.
- **Agent** — Select the agent.
- **Property Type** — Apartment, House, Land, etc.
- **Status** — Sale, Rent, or Short-term.
- **Published** — On/off for visibility.

**Pricing**

- **Price** — Required.
- **Currency** — EUR, USD, or ALL.
- **Featured** — Highlight in featured sections.
- **Investment** — Mark as investment property.

**Location**

- **City** — Required.
- **District** — Only districts of the chosen city.
- **Address** — Per language.
- **Coordinates** — Optional (lat/lng).
- **Location Tags** — e.g. near beach, central.

**Details**

- **Area** (m²), **Bedrooms**, **Bathrooms**, **Year Built**.
- **Amenities** — List (e.g. Parking, Pool).
- **Property Code** — Internal reference.

**Media**

- **Gallery** — At least 1 image, up to 30. Enable hotspot for cropping.

**SEO**

- Meta title, description, OG image, etc.

### Images

- Upload or drag and drop.
- Set the hotspot (crop area) for important images.
- Gallery: minimum 1 image, maximum 30.

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

## Blog

**How to create a blog post:**

1. Go to **Blog**.
2. Click **Create**.
3. Enter title, slug, excerpt, content, publish date.
4. Add SEO fields.
5. Use **Create translation** for other languages.

---

## Multilingual content

### Document-level (Cities, Districts, Blog, Home Page, Site Settings)

1. Edit a document in one language.
2. Use the **Create translation** (language) button in the editor.
3. Choose the target language and create the translation.
4. Edit each language version independently.

### Field-level (Properties)

For properties, fill in the title and descriptions for each language in the same form. Use the language tabs (en, ru, uk, sq) in the localized fields.

---

## Tips

- Always set **City** before **District** when creating properties.
- Use **Featured** for properties you want on the homepage.
- Add at least one gallery image for each property.
- Use SEO fields on cities, districts, and blog posts for better search visibility.
- Check **Published** status before expecting content to appear on the site.
