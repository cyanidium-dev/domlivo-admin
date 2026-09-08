import {describe, expect, it} from 'vitest'
import {CLUSTER_TAG, PAGES, guide} from '../plCluster'

const words = (s: string) => s.trim().split(/\s+/).length
const bodyChars = (p: (typeof PAGES)[number]) =>
  p.body
    .filter((b) => b.style !== 'h2')
    .map((b) => b.text)
    .join(' ').length

describe('SEO-04 Polish cluster data', () => {
  it('has nine pages with unique ASCII slugs, matching ids and the cluster tag', () => {
    expect(PAGES).toHaveLength(9)
    const slugs = PAGES.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(9)
    for (const p of PAGES) {
      expect(p.slug).toMatch(/^[a-z0-9-]+$/)
      expect(p.id).toBe(`landing-pl-${p.slug}`)
      expect(p.tags).toContain(CLUSTER_TAG)
      expect(new Set(p.tags).size).toBe(p.tags.length)
    }
  })

  it('every body has ≥ 600 characters, ≥ 2 sibling links and ≥ 1 catalog link, and every link phrase exists', () => {
    for (const p of PAGES) {
      expect(bodyChars(p), p.slug).toBeGreaterThanOrEqual(600)
      const hrefs = p.body.flatMap((b) => b.links ?? []).map((l) => l.href)
      const siblings = hrefs.filter((h) => PAGES.some((o) => o.slug !== p.slug && h === guide(o.slug)))
      expect(new Set(siblings).size, `${p.slug} sibling links`).toBeGreaterThanOrEqual(2)
      expect(hrefs.some((h) => /^\/(sale|albania\/)/.test(h)), `${p.slug} catalog link`).toBe(true)
      expect(hrefs.includes(guide(p.slug)), `${p.slug} links to itself`).toBe(false)
      for (const b of p.body) for (const l of b.links ?? []) expect(b.text, `${p.slug}: "${l.phrase}"`).toContain(l.phrase)
    }
  })

  it('FAQ answers are 35–75 words and questions end with a question mark', () => {
    for (const p of PAGES) {
      expect(p.faq.length, p.slug).toBeGreaterThanOrEqual(3)
      for (const f of p.faq) {
        expect(f.q.trim().endsWith('?'), `${p.slug}: ${f.q}`).toBe(true)
        expect(words(f.a), `${p.slug}: ${f.q} (${words(f.a)} words)`).toBeGreaterThanOrEqual(35)
        expect(words(f.a), `${p.slug}: ${f.q} (${words(f.a)} words)`).toBeLessThanOrEqual(75)
      }
    }
  })

  it('meta fits the SERP, the lead is a direct answer, and every source has a URL', () => {
    for (const p of PAGES) {
      expect(p.metaTitle.length, `${p.slug} metaTitle ${p.metaTitle.length}`).toBeLessThanOrEqual(60)
      expect(p.metaDescription.length, `${p.slug} metaDescription ${p.metaDescription.length}`).toBeLessThanOrEqual(160)
      expect(p.h1).toMatch(/2026/)
      expect(words(p.lead), `${p.slug} lead ${words(p.lead)} words`).toBeGreaterThanOrEqual(30)
      expect(p.sources.length, p.slug).toBeGreaterThanOrEqual(2)
      for (const s of p.sources) expect(s.url, `${p.slug}: ${s.label}`).toMatch(/^https?:\/\//)
    }
  })
})
