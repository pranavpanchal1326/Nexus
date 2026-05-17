export function activityToIntensity(
  journalCount: number,
  gymCount: number,
  duelCount: number,
  oracleCount: number
): 0 | 1 | 2 | 3 | 4 {
  const total = journalCount + gymCount + duelCount + oracleCount

  if (total === 0) return 0
  if (total === 1) return 1
  if (total <= 3) return 2
  if (total <= 6) return 3
  return 4
}

export function generateDateRange(days = 365): string[] {
  const result: string[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    result.push(d.toISOString().split('T')[0] ?? '')
  }

  return result
}

export function truncatePreview(text: string, maxLen = 80): string {
  const trimmed = text.trim()
  return trimmed.length > maxLen
    ? trimmed.slice(0, maxLen).trim() + '...'
    : trimmed
}

export function streakPercent(current: number, longest: number): number {
  if (longest === 0) return 0
  return Math.min(100, Math.round((current / longest) * 100))
}

export function nextStreakMilestone(
  current: number,
  milestones: number[] = [7, 30, 100, 365]
): number | null {
  return milestones.find(m => m > current) ?? null
}
