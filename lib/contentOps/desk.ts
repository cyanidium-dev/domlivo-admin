/**
 * ТЗ-18 — the Content ops desk: ten filtered lists that surface half-done
 * content and stale data, shared by structure/index.ts (Studio lists),
 * scripts/auditContentOps.ts (CLI report) and CONTENT-OPS.md (the manual
 * names every list by title), so the three can never disagree.
 * Spec: docs/engineering/SPEC-tz18-content-ops-desk-2026-09-05.md (workspace).
 */
export type ContentOpsList = {
  id: string
  title: string
  /** One type renders as a typed list; several as a plain document list. */
  types: string[]
  filter: string
  ordering: Array<{field: string; direction: 'asc' | 'desc'}>
  /** One line for the manual and the CLI: what this list means and what closes it. */
  meaning: string
}

/** `pt::text` and `references()` need a modern API; the desk's own default is older. */
export const CONTENT_OPS_API_VERSION = '2024-06-01'

export function cutoffIso(days: number, now: Date = new Date()): string {
  const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

/** Parameters every filter may reference. Computed once per Studio load. */
export function contentOpsParams(now: Date = new Date()): {cutoff30: string; cutoff90: string; cutoff300: string} {
  return {cutoff30: cutoffIso(30, now), cutoff90: cutoffIso(90, now), cutoff300: cutoffIso(300, now)}
}

export const CONTENT_OPS_LISTS: readonly ContentOpsList[] = [
  {
    id: 'landings-todo',
    title: 'Landings: TODO-CONTENT stubs',
    types: ['landingPage'],
    // All six locales, not only en: a page can be written in English and still
    // carry stubs elsewhere (the type×city fill of 2026-09-05 had to stop at
    // English when the translate endpoint went down).
    filter:
      '_type == "landingPage" && count(pageSections[_type == "seoTextSection" && (pt::text(content.en) match "TODO*" || pt::text(content.uk) match "TODO*" || pt::text(content.ru) match "TODO*" || pt::text(content.sq) match "TODO*" || pt::text(content.it) match "TODO*" || pt::text(content.pl) match "TODO*")]) > 0',
    ordering: [{field: 'title.en', direction: 'asc'}],
    meaning: 'A generator left editorial prose to write, in at least one locale. Replace the stub from the research KB (fill:type-city-copy for type×city pages), then set contentUpdatedAt.',
  },
  {
    id: 'landings-scoped',
    title: 'Landings: one-locale pages',
    types: ['landingPage'],
    filter: '_type == "landingPage" && defined(locales) && count(locales) > 0',
    ordering: [{field: '_updatedAt', direction: 'desc'}],
    meaning: 'Pages that exist only in the listed locales (landingPage.locales). Check the scope is intentional.',
  },
  {
    id: 'landings-no-pl-meta',
    title: 'Landings: no Polish meta',
    types: ['landingPage'],
    filter:
      '_type == "landingPage" && enabled != false && !defined(seo.metaTitle.pl) && (!defined(locales) || count(locales) == 0 || "pl" in locales)',
    ordering: [{field: 'title.en', direction: 'asc'}],
    meaning: 'Enabled landings whose SEO title has no pl value; Polish search results fall back to English.',
  },
  {
    id: 'zones-no-gallery',
    title: 'Zones: published without a gallery',
    types: ['district', 'city'],
    // `count()` of an absent field is null, not 0 — most gallery-less zones have
    // no `gallery` key at all (found 2026-09-05: 0 hits with `count(gallery) == 0`, 15 with this).
    filter: '_type in ["district", "city"] && isPublished == true && (!defined(gallery) || count(gallery) == 0)',
    ordering: [{field: 'title.en', direction: 'asc'}],
    meaning: 'A published zone with no gallery is a defect (root CLAUDE.md). Add licensed photos, credited on /image-credits.',
  },
  {
    id: 'metrics-stale',
    title: 'Zone metrics: newest row older than 10 months',
    types: ['zoneMetrics'],
    // `periodDate` is the period START (2026-H1 → 2026-01-01) and old rows are
    // history that must stay, so only a zone's NEWEST row can be stale: the
    // next half-year's HPI lands ~4 months after the period ends, i.e. ~10
    // months after this one started. (Reviewed 2026-09-05: "older than 8
    // months" flagged 54 of 60 rows a month before the October release.)
    filter:
      '_type == "zoneMetrics" && periodDate < $cutoff300 && count(*[_type == "zoneMetrics" && zone._ref == ^.zone._ref && periodDate > ^.periodDate]) == 0',
    ordering: [{field: 'periodDate', direction: 'asc'}],
    meaning: 'The zone has had no new price row for 10 months — an HPI release was missed. Add a new period row; never edit the old one.',
  },
  {
    id: 'trackers-stale',
    title: 'Trackers: not checked for 30 days',
    types: ['tracker'],
    filter: '_type == "tracker" && lastCheckedAt < $cutoff30',
    ordering: [{field: 'lastCheckedAt', direction: 'asc'}],
    meaning: 'Monthly cadence missed. Re-verify the facts, add a timeline entry if anything moved, set lastCheckedAt.',
  },
  {
    id: 'developers-stale',
    title: 'Developers: not reviewed for 90 days',
    types: ['developer'],
    filter: '_type == "developer" && lastReviewedAt < $cutoff90',
    ordering: [{field: 'lastReviewedAt', direction: 'asc'}],
    meaning: 'Quarterly traffic-light review missed. Re-check court and SPAK news, confirm the tier, set lastReviewedAt.',
  },
  {
    id: 'properties-no-stage',
    title: 'Properties: construction stage unset',
    types: ['property'],
    filter: '_type == "property" && !defined(constructionStage)',
    ordering: [{field: 'createdAt', direction: 'desc'}],
    meaning: 'The listing neither matches the stage facet nor shows a badge. Decide off-plan, under construction or completed.',
  },
  {
    id: 'properties-approx',
    title: 'Properties: approximate location',
    types: ['property'],
    filter: '_type == "property" && locationPrecision == "approximate"',
    ordering: [{field: 'createdAt', direction: 'desc'}],
    meaning: 'The map pin is a district centroid. Enter real coordinates and set locationPrecision to exact.',
  },
  {
    id: 'agents-no-listings',
    title: 'Agents: no listings',
    types: ['agent'],
    filter: '_type == "agent" && count(*[_type == "property" && references(^._id)]) == 0',
    ordering: [{field: 'name', direction: 'asc'}],
    meaning: 'An agent page with nothing behind it — usually a test record. Untick "Published" to drop it from the sitemap, or attach listings.',
  },
]

type Span = {_type?: string; text?: string}
type Block = {_type?: string; children?: Span[]}

/** True when any seoTextSection, in any locale, opens a block with the TODO-CONTENT marker. */
export function hasTodoContent(sections: unknown): boolean {
  if (!Array.isArray(sections)) return false
  for (const s of sections as Array<{_type?: string; content?: Record<string, unknown>}>) {
    if (s?._type !== 'seoTextSection' || !s.content || typeof s.content !== 'object') continue
    for (const blocks of Object.values(s.content)) {
      if (!Array.isArray(blocks)) continue
      for (const b of blocks as Block[]) {
        const first = b?.children?.find((c) => c?._type === 'span')
        if (typeof first?.text === 'string' && first.text.trimStart().startsWith('TODO-CONTENT')) return true
      }
    }
  }
  return false
}
