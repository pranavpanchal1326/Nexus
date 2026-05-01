import { describe, it, expect, vi } from 'vitest'
import {
  detectCircadianMode,
  resolveMode,
  countWords,
  formatNexusDate,
  relativeTime,
  calculateVolume,
  calculateVolumeDelta,
  truncate,
  capitalize,
  buildActivityContext,
} from '@/lib/utils'

describe('utils', () => {

  describe('detectCircadianMode', () => {
    it('returns apex during daytime hours', () => {
      vi.setSystemTime(new Date('2026-04-30T10:00:00'))
      expect(detectCircadianMode()).toBe('apex')
    })
    it('returns haven during evening hours', () => {
      vi.setSystemTime(new Date('2026-04-30T20:00:00'))
      expect(detectCircadianMode()).toBe('haven')
    })
    it('returns haven at midnight', () => {
      vi.setSystemTime(new Date('2026-04-30T00:00:00'))
      expect(detectCircadianMode()).toBe('haven')
    })
    it('returns apex at exactly 06:00', () => {
      vi.setSystemTime(new Date('2026-04-30T06:00:00'))
      expect(detectCircadianMode()).toBe('apex')
    })
    it('returns haven at exactly 18:00', () => {
      vi.setSystemTime(new Date('2026-04-30T18:00:00'))
      expect(detectCircadianMode()).toBe('haven')
    })
  })

  describe('resolveMode', () => {
    it('resolves auto to circadian mode', () => {
      vi.setSystemTime(new Date('2026-04-30T10:00:00'))
      expect(resolveMode('auto')).toBe('apex')
    })
    it('passes through apex preference', () => {
      expect(resolveMode('apex')).toBe('apex')
    })
    it('passes through haven preference', () => {
      expect(resolveMode('haven')).toBe('haven')
    })
  })

  describe('countWords', () => {
    it('counts simple words', () => {
      expect(countWords('hello world')).toBe(2)
    })
    it('handles multiple spaces', () => {
      expect(countWords('hello   world')).toBe(2)
    })
    it('handles empty string', () => {
      expect(countWords('')).toBe(0)
    })
    it('handles newlines', () => {
      expect(countWords('hello\nworld\nfoo')).toBe(3)
    })
  })

  describe('formatNexusDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2026-04-30')
      expect(formatNexusDate(date)).toMatch(/2026\.04\.30/)
    })
    it('accepts string input', () => {
      expect(formatNexusDate('2026-01-01')).toMatch(/2026\.01\.01/)
    })
  })

  describe('relativeTime', () => {
    it('returns just now for current time', () => {
      const now = new Date()
      expect(relativeTime(now)).toBe('just now')
    })
    it('returns m ago for recent minutes', () => {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60000)
      expect(relativeTime(fiveMinsAgo)).toBe('5m ago')
    })
    it('returns h ago for recent hours', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600000)
      expect(relativeTime(twoHoursAgo)).toBe('2h ago')
    })
  })

  describe('calculateVolume', () => {
    it('multiplies sets reps weight', () => {
      expect(calculateVolume(3, 10, 100)).toBe(3000)
    })
    it('handles zero weight', () => {
      expect(calculateVolume(3, 10, 0)).toBe(0)
    })
  })

  describe('calculateVolumeDelta', () => {
    it('calculates positive delta', () => {
      expect(calculateVolumeDelta(1100, 1000)).toBe(10)
    })
    it('calculates negative delta', () => {
      expect(calculateVolumeDelta(900, 1000)).toBe(-10)
    })
    it('returns 0 when previous is 0', () => {
      expect(calculateVolumeDelta(100, 0)).toBe(0)
    })
  })

  describe('truncate', () => {
    it('truncates long strings', () => {
      expect(truncate('hello world', 8)).toBe('hello...')
    })
    it('leaves short strings intact', () => {
      expect(truncate('hello', 10)).toBe('hello')
    })
  })

  describe('capitalize', () => {
    it('capitalizes first letter', () => {
      expect(capitalize('hello')).toBe('Hello')
    })
    it('lowercases rest', () => {
      expect(capitalize('HELLO')).toBe('Hello')
    })
    it('handles empty string', () => {
      expect(capitalize('')).toBe('')
    })
  })

  describe('buildActivityContext', () => {
    it('includes streak when provided', () => {
      const ctx = buildActivityContext({
        streak: 7,
        surface: 'dashboard',
      })
      expect(ctx).toContain('7 days')
    })
    it('includes journal count when provided', () => {
      const ctx = buildActivityContext({
        journalCount: 3,
        surface: 'journal',
      })
      expect(ctx).toContain('3')
    })
    it('omits undefined fields', () => {
      const ctx = buildActivityContext({ surface: 'gym' })
      expect(ctx).not.toContain('streak')
      expect(ctx).not.toContain('undefined')
    })
  })

})
