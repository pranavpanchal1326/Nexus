import type { HeatmapDay } from '@/hooks/useStats'

const DAYS_IN_WEEK = 7
const MONTH_ABBREV = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export interface WeekColumn {
  weekIndex: number
  days: (HeatmapDay | null)[]
}

export function buildWeekColumns(data: HeatmapDay[]): WeekColumn[] {
  if (!data.length) return []

  const dateMap = new Map<string, HeatmapDay>()
  data.forEach(d => dateMap.set(d.date, d))

  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 364)

  const firstSunday = new Date(startDate)
  firstSunday.setDate(firstSunday.getDate() - firstSunday.getDay())

  const columns: WeekColumn[] = []
  let current = new Date(firstSunday)

  while (current <= today) {
    const days: (HeatmapDay | null)[] = []

    for (let d = 0; d < DAYS_IN_WEEK; d++) {
      const cellDate = new Date(current)
      cellDate.setDate(cellDate.getDate() + d)

      if (cellDate > today || cellDate < startDate) {
        days.push(null)
      } else {
        const iso = cellDate.toISOString().split('T')[0] ?? ''
        days.push(dateMap.get(iso) ?? { date: iso, count: 0 as const })
      }
    }

    columns.push({ weekIndex: columns.length, days })
    current.setDate(current.getDate() + DAYS_IN_WEEK)
  }

  return columns
}

export function buildMonthLabels(
  columns: WeekColumn[]
): { month: string; colIndex: number }[] {
  const labels: { month: string; colIndex: number }[] = []
  const seen = new Set<number>()

  for (let i = columns.length - 1; i >= 0; i--) {
    const col = columns[i]
    const firstDay = col?.days.find(d => d !== null)
    if (!firstDay) continue

    const month = new Date(firstDay.date + 'T12:00:00').getMonth()
    if (seen.has(month)) continue
    seen.add(month)
    labels.push({ month: MONTH_ABBREV[month] ?? '', colIndex: i })
  }

  return labels.reverse()
}

export function formatTooltipDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function getIntensityLabel(count: number): string {
  if (count === 0) return 'No activity'
  if (count === 1) return 'Light activity'
  if (count <= 3) return 'Moderate activity'
  if (count <= 6) return 'Active day'
  return 'Very active day'
}
