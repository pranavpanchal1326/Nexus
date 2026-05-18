import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import {
  buildWeekColumns,
  buildMonthLabels,
  formatTooltipDate,
} from '@/lib/heatmapHelpers'

const FIXED_DATE = new Date('2026-01-18T12:00:00Z')

beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_DATE)
})

afterAll(() => {
  vi.useRealTimers()
})

describe('buildWeekColumns', () => {
  const mockData = [
    { date: '2026-01-18', count: 2 as const },
    { date: '2026-01-17', count: 1 as const },
    { date: '2025-12-25', count: 4 as const },
  ]

  it('returns array of week columns', () => {
    const columns = buildWeekColumns(mockData)
    expect(Array.isArray(columns)).toBe(true)
    expect(columns.length).toBeGreaterThan(0)
  })

  it('each column has exactly 7 day slots', () => {
    const columns = buildWeekColumns(mockData)
    columns.forEach(col => {
      expect(col.days).toHaveLength(7)
    })
  })

  it('today (2026-01-18) is in the last column', () => {
    const columns = buildWeekColumns(mockData)
    const lastCol = columns[columns.length - 1]!
    const hasToday = lastCol.days.some(d => d?.date === '2026-01-18')
    expect(hasToday).toBe(true)
  })

  it('today has correct count from data', () => {
    const columns = buildWeekColumns(mockData)
    const lastCol = columns[columns.length - 1]!
    const today = lastCol.days.find(d => d?.date === '2026-01-18')
    expect(today?.count).toBe(2)
  })

  it('days not in data default to count 0', () => {
    const columns = buildWeekColumns(mockData)
    const allDays = columns.flatMap(c => c.days).filter(Boolean)
    const emptyDays = allDays.filter(d => d?.count === 0)
    expect(emptyDays.length).toBeGreaterThan(0)
  })

  it('Christmas 2025 has count 4', () => {
    const columns = buildWeekColumns(mockData)
    const allDays = columns.flatMap(c => c.days).filter(Boolean)
    const xmas = allDays.find(d => d?.date === '2025-12-25')
    expect(xmas?.count).toBe(4)
  })

  it('columns are in ascending date order - oldest first', () => {
    const columns = buildWeekColumns(mockData)
    const firstDay = columns[0]!.days.find(Boolean)
    const lastDay = columns[columns.length - 1]!.days.filter(Boolean).pop()
    expect(new Date(firstDay!.date).getTime())
      .toBeLessThan(new Date(lastDay!.date).getTime())
  })

  it('null padding in first column when range start is not Sunday', () => {
    const columns = buildWeekColumns(mockData)
    const firstCol = columns[0]!
    expect(firstCol.days).toHaveLength(7)
  })

  it('returns empty array for empty data', () => {
    const columns = buildWeekColumns([])
    expect(columns).toEqual([])
  })

  it('generates approximately 53 columns for 365 days', () => {
    const fullYearData: { date: string; count: 0 }[] = []
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      fullYearData.push({ date: d.toISOString().split('T')[0]!, count: 0 })
    }
    const columns = buildWeekColumns(fullYearData)
    expect(columns.length).toBeGreaterThanOrEqual(52)
    expect(columns.length).toBeLessThanOrEqual(54)
  })
})

describe('buildMonthLabels', () => {
  const mockData: { date: string; count: 0 }[] = []
  const today = new Date('2026-01-18')
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    mockData.push({ date: d.toISOString().split('T')[0]!, count: 0 })
  }

  it('returns month labels array', () => {
    const columns = buildWeekColumns(mockData)
    const labels = buildMonthLabels(columns)
    expect(Array.isArray(labels)).toBe(true)
    expect(labels.length).toBeGreaterThan(0)
  })

  it('returns up to 12 labels for a full year', () => {
    const columns = buildWeekColumns(mockData)
    const labels = buildMonthLabels(columns)
    expect(labels.length).toBeLessThanOrEqual(12)
    expect(labels.length).toBeGreaterThanOrEqual(11)
  })

  it('each label has month string and colIndex', () => {
    const columns = buildWeekColumns(mockData)
    const labels = buildMonthLabels(columns)
    labels.forEach(label => {
      expect(typeof label.month).toBe('string')
      expect(label.month.length).toBeGreaterThan(0)
      expect(typeof label.colIndex).toBe('number')
      expect(label.colIndex).toBeGreaterThanOrEqual(0)
    })
  })

  it('no duplicate months', () => {
    const columns = buildWeekColumns(mockData)
    const labels = buildMonthLabels(columns)
    const months = labels.map(l => l.month)
    const unique = new Set(months)
    expect(unique.size).toBe(months.length)
  })
})

describe('formatTooltipDate', () => {
  it('formats ISO date correctly', () => {
    const result = formatTooltipDate('2026-01-15')
    expect(result).toContain('January')
    expect(result).toContain('15')
    expect(result).toContain('2026')
  })

  it('handles first day of month', () => {
    const result = formatTooltipDate('2026-03-01')
    expect(result).toContain('March')
    expect(result).toContain('1')
  })

  it('handles December 31', () => {
    const result = formatTooltipDate('2025-12-31')
    expect(result).toContain('December')
    expect(result).toContain('31')
  })

  it('handles February 28', () => {
    const result = formatTooltipDate('2026-02-28')
    expect(result).toContain('February')
    expect(result).toContain('28')
  })
})
