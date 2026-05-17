import { describe, it, expect } from 'vitest'
import {
  activityToIntensity,
  generateDateRange,
  truncatePreview,
  streakPercent,
  nextStreakMilestone,
} from './statsHelpers'

describe('activityToIntensity', () => {
  it('returns 0 for no activity', () => {
    expect(activityToIntensity(0, 0, 0, 0)).toBe(0)
  })

  it('returns 1 for single activity', () => {
    expect(activityToIntensity(1, 0, 0, 0)).toBe(1)
    expect(activityToIntensity(0, 1, 0, 0)).toBe(1)
  })

  it('returns 2 for 2-3 activities', () => {
    expect(activityToIntensity(1, 1, 0, 0)).toBe(2)
    expect(activityToIntensity(1, 1, 1, 0)).toBe(2)
  })

  it('returns 3 for 4-6 activities', () => {
    expect(activityToIntensity(2, 2, 0, 0)).toBe(3)
    expect(activityToIntensity(2, 2, 2, 0)).toBe(3)
  })

  it('returns 4 for 7+ activities', () => {
    expect(activityToIntensity(2, 2, 2, 2)).toBe(4)
    expect(activityToIntensity(5, 5, 0, 0)).toBe(4)
  })
})

describe('generateDateRange', () => {
  it('generates exactly N dates', () => {
    const dates = generateDateRange(365)
    expect(dates).toHaveLength(365)
  })

  it('last date is today', () => {
    const dates = generateDateRange(365)
    const last = dates[dates.length - 1]
    const today = new Date().toISOString().split('T')[0]
    expect(last).toBe(today)
  })

  it('dates are in ascending order', () => {
    const dates = generateDateRange(7)
    for (let i = 1; i < dates.length; i++) {
      expect(new Date(dates[i]!).getTime())
        .toBeGreaterThan(new Date(dates[i - 1]!).getTime())
    }
  })

  it('all dates are valid ISO date strings', () => {
    const dates = generateDateRange(30)
    dates.forEach(d => {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })
})

describe('truncatePreview', () => {
  it('short text not truncated', () => {
    expect(truncatePreview('Hello world', 80)).toBe('Hello world')
  })

  it('long text truncated at maxLen with ellipsis', () => {
    const text = 'a'.repeat(100)
    const result = truncatePreview(text, 80)
    expect(result.endsWith('...')).toBe(true)
    expect(result.length).toBeLessThanOrEqual(83)
  })

  it('trims whitespace before truncating', () => {
    expect(truncatePreview('  hello  ', 80)).toBe('hello')
  })
})

describe('streakPercent', () => {
  it('returns 0 if longest is 0', () => {
    expect(streakPercent(5, 0)).toBe(0)
  })

  it('returns 100 if at or above longest', () => {
    expect(streakPercent(10, 10)).toBe(100)
    expect(streakPercent(15, 10)).toBe(100)
  })

  it('returns correct percentage', () => {
    expect(streakPercent(5, 10)).toBe(50)
    expect(streakPercent(7, 14)).toBe(50)
  })
})

describe('nextStreakMilestone', () => {
  it('returns first milestone above current', () => {
    expect(nextStreakMilestone(3)).toBe(7)
    expect(nextStreakMilestone(7)).toBe(30)
    expect(nextStreakMilestone(30)).toBe(100)
    expect(nextStreakMilestone(100)).toBe(365)
  })

  it('returns null if above all milestones', () => {
    expect(nextStreakMilestone(365)).toBeNull()
    expect(nextStreakMilestone(400)).toBeNull()
  })

  it('accepts custom milestone array', () => {
    expect(nextStreakMilestone(5, [10, 20, 50])).toBe(10)
    expect(nextStreakMilestone(10, [10, 20, 50])).toBe(20)
  })
})
