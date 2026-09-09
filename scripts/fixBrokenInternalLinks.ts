/**
 * Repoint CMS links that lead to 404s.
 *
 * The Ahrefs crawl of 2026-09-10 reports 75 broken pages and ~2,550 internal
 * links into them. Five of the destinations are paths the CMS invents; the app
 * has never had a route for them:
 *
 *   /contact        343 links  footer quick links + 56 district CTAs → /contacts
 *   /properties      61 links  footer quick links                    → /catalog
 *   /property-types  49 links  the home page's type grid CTA         → /catalog
 *
 * The remaining two, `/privacy` and `/terms`, are NOT touched here. They are
 * linked from the footer of every page and from the cookie banner — 2,591
 * links to `/privacy` alone — and the right fix is to publish the documents,
 * not to bend the links or delete them. Deleting a privacy link from a site
 * running GTM and Clarity would trade an SEO warning for a compliance problem.
 * Same for `/about`, which is a page someone decided to link before writing.
 *
 * Matching is exact and per-path, and a link already pointing at the new
 * target is left alone, so a second run is a no-op.
 *
 * Run:
 * - npm run fix:broken-links -- --dry
 * - npm run fix:broken-links -- --execute
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const args = process.argv.slice(2)
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')

if (!token || !projectId) {
  console.error('Error: SANITY_PROJECT_ID and SANITY_API_TOKEN required. Add them to .env')
  process.exit(1)
}
if (!isDry && !isExecute) {
  console.error('Use --dry to preview or --execute to write.')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token})

/** Broken path → the route that actually exists. */
const REDIRECT_MAP: Record<string, string> = {
  '/contact': '/contacts',
  '/properties': '/catalog',
  '/property-types': '/catalog',
}

/** Paths that need a page written before their links can be fixed. */
const NEEDS_A_PAGE = ['/privacy', '/terms', '/about']

type SiteSettings = {
  _id: string
  policyLinks?: Array<{_key?: string; href?: string}>
  footerQuickLinks?: Array<{_key?: string; href?: string}>
  footerGuideLinks?: Array<{_key?: string; href?: string}>
}

type LandingRow = {
  _id: string
  slug?: string
  sections: Array<{_key?: string; _type?: string; ctaHref?: string; secondaryCtaHref?: string}>
}

function retarget(href: string | undefined): string | null {
  if (!href) return null
  const [base, query] = href.split('?')
  const clean = base.replace(/\/$/, '') || '/'
  const to = REDIRECT_MAP[clean]
  if (!to) return null
  return query ? `${to}?${query}` : to
}

async function run() {
  console.log(`\n=== fix:broken-links (${isDry ? 'DRY RUN' : 'EXECUTE'}) ===\n`)
  let fixed = 0

  // --- siteSettings: footer and policy link arrays -------------------------
  const settings = await client.fetch<SiteSettings | null>(
    `*[_type == "siteSettings"][0]{_id, policyLinks, footerQuickLinks, footerGuideLinks}`,
  )
  if (settings?._id) {
    const set: Record<string, string> = {}
    for (const field of ['policyLinks', 'footerQuickLinks', 'footerGuideLinks'] as const) {
      for (const link of settings[field] ?? []) {
        const to = retarget(link.href)
        if (!to || !link._key) continue
        set[`${field}[_key=="${link._key}"].href`] = to
        console.log(`  siteSettings.${field}: ${link.href} → ${to}`)
        fixed += 1
      }
    }
    if (isExecute && Object.keys(set).length > 0) {
      await client.patch(settings._id).set(set).commit()
    }

    const stuck = [...(settings.policyLinks ?? []), ...(settings.footerQuickLinks ?? [])]
      .map((l) => l.href?.replace(/\/$/, ''))
      .filter((h): h is string => Boolean(h) && NEEDS_A_PAGE.includes(h!))
    for (const href of stuck) {
      console.warn(`  ! siteSettings still links ${href} — no such page exists (see the header)`)
    }
  }

  // --- landing page CTAs ---------------------------------------------------
  const landings = await client.fetch<LandingRow[]>(
    `*[_type in ["landingPage", "homePage"]]{
      _id, "slug": slug.current,
      "sections": pageSections[]{
        _key, _type,
        "ctaHref": cta.href,
        "secondaryCtaHref": secondaryCta.href
      }
    }`,
  )
  for (const landing of landings) {
    const set: Record<string, string> = {}
    for (const section of landing.sections ?? []) {
      if (!section._key) continue
      // A ctaSection carries two buttons; the district pages put "Contact us"
      // on the secondary one, which is where 56 of the 343 /contact links live.
      for (const [field, href] of [
        ['cta', section.ctaHref],
        ['secondaryCta', section.secondaryCtaHref],
      ] as const) {
        const to = retarget(href)
        if (!to) continue
        set[`pageSections[_key=="${section._key}"].${field}.href`] = to
        fixed += 1
      }
    }
    if (Object.keys(set).length === 0) continue
    console.log(`  ${landing.slug ?? landing._id}: ${Object.keys(set).length} CTA(s) repointed`)
    if (isExecute) await client.patch(landing._id).set(set).commit()
  }

  console.log(`\nDone: ${fixed} link(s).`)
  if (isDry) console.log('Nothing was written — rerun with --execute.\n')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
