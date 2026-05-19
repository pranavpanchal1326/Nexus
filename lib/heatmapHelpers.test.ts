import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import {
  buildWeekColumns,
  buildMonthLabels,
  formatTooltipDate,
  getIntensityLabel,
} from '../lib/heatmapHelpers'

const FIXED_DATE = new Date('2026-01-18T12:00:00Z')

beforeAll(() => { vi.setSystemTime(FIXED_DATE) })
afterAll(() =>  { vi.useRealTimers() })

const mockData = [
  { date: '2026-01-18', count: 3 as const },
  { date: '2026-01-17', count: 1 as const },
  { date: '2025-12-25', count: 4 as const },
]

describe('buildWeekColumns', () => {
  it('returns empty array for empty data', () => {
    expect(buildWeekColumns([])).toEqual([])
  })

  it('each column has exactly 7 days', () => {
    buildWeekColumns(mockData).forEach(col => {
      expect(col.days).toHaveLength(7)
    })
  })

  it('today exists in last column with correct count', () => {
    const cols   = buildWeekColumns(mockData)
    const last   = cols[cols.length - 1]!
    const today  = last.days.find(d => d?.date === '2026-01-18')
    expect(today?.count).toBe(3)
  })

  it('Christmas 2025 has count 4', () => {
    const allDays = buildWeekColumns(mockData).flatMap(c => c.days).filter(Boolean)
    const xmas    = allDays.find(d => d?.date === '2025-12-25')
    expect(xmas?.count).toBe(4)
  })

  it('unlisted days default to count 0', () => {
    const allDays = buildWeekColumns(mockData).flatMap(c => c.days).filter(Boolean)
    const empty   = allDays.filter(d => d?.count === 0)
    expect(empty.length).toBeGreaterThan(0)
  })

  it('columns in ascending date order', () => {
    const cols     = buildWeekColumns(mockData)
    const first    = cols[0]!.days.find(Boolean)
    const last     = cols[cols.length-1]!.days.filter(Boolean).pop()
    expect(new Date(first!.date).getTime())
      .toBeLessThan(new Date(last!.date).getTime())
  })

  it('generates 52–54 columns for year data', () => {
    const yearData = Array.from({ length: 365 }, (_, i) => {
      const d = new Date(FIXED_DATE)
      d.setDate(d.getDate() - i)
      return { date: d.toISOString().split('T')[0]!, count: 0 as const }
    })
    const cols = buildWeekColumns(yearData)
    expect(cols.length).toBeGreaterThanOrEqual(52)
    expect(cols.length).toBeLessThanOrEqual(54)
  })
})

describe('buildMonthLabels', () => {
  it('returns between 11 and 12 labels for full year', () => {
    const yearData = Array.from({ length: 365 }, (_, i) => {
      const d = new Date(FIXED_DATE)
      d.setDate(d.getDate() - i)
      return { date: d.toISOString().split('T')[0]!, count: 0 as const }
    })
    const cols   = buildWeekColumns(yearData)
    const labels = buildMonthLabels(cols)
    expect(labels.length).toBeGreaterThanOrEqual(11)
    expect(labels.length).toBeLessThanOrEqual(12)
  })

  it('each label has valid month and colIndex', () => {
    const cols   = buildWeekColumns(mockData)
    const labels = buildMonthLabels(cols)
    labels.forEach(l => {
      expect(l.month.length).toBeGreaterThan(0)
      expect(l.colIndex).toBeGreaterThanOrEqual(0)
    })
  })
})

describe('formatTooltipDate', () => {
  it('formats ISO date as full date string', () => {
    const result = formatTooltipDate('2026-01-15')
    expect(result).toContain('January')
    expect(result).toContain('15')
    expect(result).toContain('2026')
  })

  it('handles month boundaries', () => {
    expect(formatTooltipDate('2026-03-01')).toContain('March')
    expect(formatTooltipDate('2026-12-31')).toContain('December')
    expect(formatTooltipDate('2026-02-28')).toContain('February')
  })
})

describe('getIntensityLabel', () => {
  it('returns correct labels for each level', () => {
    expect(getIntensityLabel(0)).toBe('No activity')
    expect(getIntensityLabel(1)).toBe('Light activity')
    expect(getIntensityLabel(2)).toBe('Moderate activity')
    expect(getIntensityLabel(3)).toBe('Moderate activity')
    expect(getIntensityLabel(4)).toBe('Active day')
    expect(getIntensityLabel(6)).toBe('Active day')
    expect(getIntensityLabel(7)).toBe('Very active day')
  })
})
