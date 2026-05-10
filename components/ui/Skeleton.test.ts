import { describe, it, expect } from 'vitest'
import { EMPTY_STATE_COPY } from './EmptyState'

// ─── EmptyState copy completeness ─────────────────────────────────────────────

const ALL_MODULES = [
  'journal',
  'gym',
  'lexicon',
  'oracle',
  'heatmap',
  'feed',
  'generic',
] as const

describe('EmptyState copy', () => {
  ALL_MODULES.forEach(module => {
    it(`${module}: has non-empty label and subline`, () => {
      const copy = EMPTY_STATE_COPY[module]
      expect(copy).toBeDefined()
      expect(copy.label.length).toBeGreaterThan(0)
      expect(copy.subline.length).toBeGreaterThan(0)
    })

    it(`${module}: label is fully uppercase`, () => {
      const { label } = EMPTY_STATE_COPY[module]
      expect(label).toBe(label.toUpperCase())
    })

    it(`${module}: subline is a complete sentence`, () => {
      const { subline } = EMPTY_STATE_COPY[module]
      // Sublines must end with a period — they are complete thoughts
      expect(subline.trimEnd().endsWith('.')).toBe(true)
    })
  })
})

// ─── Barrel export smoke test ─────────────────────────────────────────────────

describe('UI kit barrel exports', () => {
  it('EMPTY_STATE_COPY covers all 7 modules', () => {
    const keys = Object.keys(EMPTY_STATE_COPY)
    expect(keys).toHaveLength(7)
    ALL_MODULES.forEach(m => {
      expect(keys).toContain(m)
    })
  })
})
