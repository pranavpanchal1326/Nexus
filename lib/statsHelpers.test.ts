import { describe, it, expect } from 'vitest'
import {
  activityToIntensity,
  generateDateRange,
  truncatePreview,
  streakPercent,
  nextStreakMilestone,
} from '../lib/statsHelpers'

describe('activityToIntensity', () => {
  it('returns 0 for zero activity', () => {
    expect(activityToIntensity(0,0,0,0)).toBe(0)
  })
  it('returns 1 for exactly 1 activity', () => {
    expect(activityToIntensity(1,0,0,0)).toBe(1)
    expect(activityToIntensity(0,1,0,0)).toBe(1)
    expect(activityToIntensity(0,0,1,0)).toBe(1)
    expect(activityToIntensity(0,0,0,1)).toBe(1)
  })
  it('returns 2 for 2–3 activities', () => {
    expect(activityToIntensity(1,1,0,0)).toBe(2)
    expect(activityToIntensity(1,1,1,0)).toBe(2)
  })
  it('returns 3 for 4–6 activities', () => {
    expect(activityToIntensity(2,2,0,0)).toBe(3)
    expect(activityToIntensity(2,2,2,0)).toBe(3)
  })
  it('returns 4 for 7+ activities', () => {
    expect(activityToIntensity(2,2,2,2)).toBe(4)
    expect(activityToIntensity(10,0,0,0)).toBe(4)
  })
})

describe('generateDateRange', () => {
  it('generates exactly N dates', () => {
    expect(generateDateRange(365)).toHaveLength(365)
    expect(generateDateRange(7)).toHaveLength(7)
    expect(generateDateRange(1)).toHaveLength(1)
  })

  it('last date is today', () => {
    const dates  = generateDateRange(7)
    const today  = new Date().toISOString().split('T')[0]
    expect(dates[dates.length - 1]).toBe(today)
  })

  it('dates are in ascending order', () => {
    const dates = generateDateRange(14)
    for (let i = 1; i < dates.length; i++) {
      expect(new Date(dates[i]!).getTime())
        .toBeGreaterThan(new Date(dates[i-1]!).getTime())
    }
  })

  it('all dates are valid ISO date strings', () => {
    generateDateRange(30).forEach(d => {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })
})

describe('truncatePreview', () => {
  it('short text returned unchanged', () => {
    expect(truncatePreview('Hello.', 80)).toBe('Hello.')
  })

  it('long text truncated with ellipsis', () => {
    const long   = 'word '.repeat(30).trim()
    const result = truncatePreview(long, 40)
    expect(result.endsWith('…')).toBe(true)
    expect(result.replace('…', '').length).toBeLessThanOrEqual(40)
  })

  it('trims whitespace', () => {
    expect(truncatePreview('  hello  ', 80)).toBe('hello')
  })
})

describe('streakPercent', () => {
  it('returns 0 if longest is 0', () => {
    expect(streakPercent(5, 0)).toBe(0)
  })
  it('caps at 100', () => {
    expect(streakPercent(20, 10)).toBe(100)
  })
  it('returns correct percentage', () => {
    expect(streakPercent(5, 10)).toBe(50)
    expect(streakPercent(3, 4)).toBe(75)
  })
})

describe('nextStreakMilestone', () => {
  it('returns first milestone above current', () => {
    expect(nextStreakMilestone(0)).toBe(7)
    expect(nextStreakMilestone(6)).toBe(7)
    expect(nextStreakMilestone(7)).toBe(30)
    expect(nextStreakMilestone(29)).toBe(30)
    expect(nextStreakMilestone(30)).toBe(100)
    expect(nextStreakMilestone(99)).toBe(100)
    expect(nextStreakMilestone(100)).toBe(365)
  })
  it('returns null above all milestones', () => {
    expect(nextStreakMilestone(365)).toBeNull()
    expect(nextStreakMilestone(999)).toBeNull()
  })
})
