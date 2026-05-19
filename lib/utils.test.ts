import { describe, it, expect, vi, beforeEach } from 'vitest'
import { relativeTime, truncateWords, isToday, formatLocalTime } from '../lib/utils'

describe('relativeTime', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'))
  })

  it('returns "just now" for < 60 seconds', () => {
    const recent = new Date('2026-01-15T11:59:30Z').toISOString()
    expect(relativeTime(recent)).toBe('just now')
  })

  it('returns minutes for < 60 minutes', () => {
    const t = new Date('2026-01-15T11:30:00Z').toISOString()
    expect(relativeTime(t)).toBe('30m ago')
  })

  it('returns hours for < 24 hours', () => {
    const t = new Date('2026-01-15T06:00:00Z').toISOString()
    expect(relativeTime(t)).toBe('6h ago')
  })

  it('returns days for < 7 days', () => {
    const t = new Date('2026-01-12T12:00:00Z').toISOString()
    expect(relativeTime(t)).toBe('3d ago')
  })

  it('returns formatted date for >= 7 days', () => {
    const t = new Date('2026-01-01T12:00:00Z').toISOString()
    const result = relativeTime(t)
    expect(result).toMatch(/2026\.01\.01/)
  })
})

describe('truncateWords', () => {
  it('does not truncate short text', () => {
    expect(truncateWords('hello world', 10)).toBe('hello world')
  })

  it('truncates at maxWords', () => {
    const text   = 'one two three four five six'
    const result = truncateWords(text, 3)
    expect(result).toBe('one two three…')
  })

  it('handles single word', () => {
    expect(truncateWords('hello', 1)).toBe('hello')
  })

  it('handles empty string', () => {
    expect(truncateWords('', 5)).toBe('')
  })

  it('exact word count does not truncate', () => {
    expect(truncateWords('one two three', 3)).toBe('one two three')
  })
})

describe('isToday', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'))
  })

  it('returns true for today', () => {
    expect(isToday('2026-01-15T12:00:00.000Z')).toBe(true)
  })

  it('returns false for yesterday', () => {
    expect(isToday('2026-01-14T12:00:00.000Z')).toBe(false)
  })

  it('returns false for tomorrow', () => {
    expect(isToday('2026-01-16T12:00:00.000Z')).toBe(false)
  })
})

describe('formatLocalTime', () => {
  it('returns HH:MM format', () => {
    const d      = new Date('2026-01-15T09:05:00')
    const result = formatLocalTime(d)
    expect(result).toMatch(/\d{2}:\d{2}/)
  })
})
