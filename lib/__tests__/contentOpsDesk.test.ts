import {describe, expect, it} from 'vitest'
import {readFileSync} from 'node:fs'
import path from 'node:path'
import {CONTENT_OPS_LISTS, contentOpsParams, cutoffIso, hasTodoContent} from '../contentOps/desk'

describe('cutoffIso', () => {
  it('subtracts whole days and returns an ISO date', () => {
    expect(cutoffIso(30, new Date('2026-09-05T10:00:00Z'))).toBe('2026-08-06')
    expect(cutoffIso(300, new Date('2026-09-05T10:00:00Z'))).toBe('2025-11-09')
  })
})

describe('contentOpsParams', () => {
  it('produces the three cut-offs the filters reference', () => {
    const p = contentOpsParams(new Date('2026-09-05T10:00:00Z'))
    expect(p).toEqual({cutoff30: '2026-08-06', cutoff90: '2026-06-07', cutoff300: '2025-11-09'})
  })
})

describe('hasTodoContent', () => {
  const span = (text: string) => ({_type: 'span', text})
  const block = (text: string) => ({_type: 'block', children: [span(text)]})
  it('finds a TODO-CONTENT stub in any locale of a seoTextSection', () => {
    const sections = [
      {_type: 'heroSection', title: {en: 'x'}},
      {_type: 'seoTextSection', content: {en: [block('Real prose')], pl: [block('TODO-CONTENT: tekst')]}},
    ]
    expect(hasTodoContent(sections)).toBe(true)
  })
  it('ignores prose that merely mentions TODO later in a sentence', () => {
    const sections = [{_type: 'seoTextSection', content: {en: [block('We keep a TODO list.')]}}]
    expect(hasTodoContent(sections)).toBe(false)
  })
  it('is false for no sections, non-arrays and sections without content', () => {
    expect(hasTodoContent(undefined)).toBe(false)
    expect(hasTodoContent('x')).toBe(false)
    expect(hasTodoContent([{_type: 'seoTextSection'}])).toBe(false)
  })
})

describe('CONTENT_OPS_LISTS', () => {
  it('has ten lists with unique ids, known types, a filter that opens on the type and an ordering', () => {
    expect(CONTENT_OPS_LISTS).toHaveLength(10)
    expect(new Set(CONTENT_OPS_LISTS.map((l) => l.id)).size).toBe(10)
    for (const l of CONTENT_OPS_LISTS) {
      expect(l.types.length).toBeGreaterThan(0)
      for (const t of l.types) expect(t).toMatch(/^(landingPage|zoneMetrics|tracker|developer|property|district|city|agent)$/)
      const opener = l.types.length === 1 ? `_type == "${l.types[0]}"` : `_type in [${l.types.map((t) => `"${t}"`).join(', ')}]`
      expect(l.filter.startsWith(opener), l.id).toBe(true)
      expect(l.ordering.length).toBeGreaterThan(0)
      expect(l.meaning.length).toBeGreaterThan(20)
    }
  })
  it('every $param a filter uses is provided by contentOpsParams', () => {
    const provided = Object.keys(contentOpsParams(new Date()))
    for (const l of CONTENT_OPS_LISTS) {
      for (const m of l.filter.matchAll(/\$(\w+)/g)) expect(provided, `${l.id} uses $${m[1]}`).toContain(m[1])
    }
  })
  it('every npm script the manual names exists in package.json', () => {
    const manual = readFileSync(path.resolve(__dirname, '../../CONTENT-OPS.md'), 'utf8')
    const scripts = Object.keys(JSON.parse(readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8')).scripts)
    const named = Array.from(manual.matchAll(/npm run ([a-z0-9:-]+)/g)).map((m) => m[1])
    expect(named.length).toBeGreaterThan(10)
    for (const s of new Set(named)) expect(scripts, s).toContain(s)
  })
  it('the manual documents every desk list by its title', () => {
    const manual = readFileSync(path.resolve(__dirname, '../../CONTENT-OPS.md'), 'utf8')
    for (const l of CONTENT_OPS_LISTS) expect(manual, l.id).toContain(l.title)
  })
})
