/**
 * NEXUS v2.0 — Utility Functions
 * Time detection, mode resolution, formatting
 */

import type { Mode, ModePreference } from '@/types/mode'

// ─── Circadian Mode Detection ─────────────────────────

/**
 * Detect current mode from system time
 * APEX:  06:00 – 17:59 (daytime — Commander energy)
 * HAVEN: 18:00 – 05:59 (evening/night — Poet energy)
 */
export function detectCircadianMode(): Mode {
  const hour = new Date().getHours()
  return hour >= 6 && hour < 18 ? 'apex' : 'haven'
}

/**
 * Resolve effective mode from user preference
 * 'auto' → use circadian detection
 * 'apex' | 'haven' → use explicitly
 */
export function resolveMode(preference: ModePreference): Mode {
  if (preference === 'auto') return detectCircadianMode()
  return preference
}

// ─── Word Count ───────────────────────────────────────

/**
 * Count words in a string
 * Handles multiple spaces, newlines, tabs
 */
export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length
}

// ─── Date Formatting ──────────────────────────────────

/**
 * Format date as NEXUS style: 2026.04.30
 */
export function formatNexusDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year  = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day   = String(d.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

/**
 * Format time as: 14:32
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const hours   = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Format time as local time HH:MM (alias for formatTime)
 */
export function formatLocalTime(date: Date | string): string {
  return formatTime(date)
}

/**
 * Relative time — "3 days ago", "just now"
 */
export function relativeTime(date: Date | string): string {
  const d   = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins  = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays  = Math.floor(diffMs / 86400000)

  if (diffMins < 1)   return 'just now'
  if (diffMins < 60)  return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7)   return `${diffDays}d ago`
  return formatNexusDate(d)
}

// ─── Volume Delta ─────────────────────────────────────

/**
 * Calculate gym volume for a single set
 * Volume = sets × reps × weight
 */
export function calculateVolume(
  sets: number,
  reps: number,
  weight: number
): number {
  return sets * reps * weight
}

/**
 * Calculate volume delta percentage
 * Positive = improvement, negative = decline
 */
export function calculateVolumeDelta(
  current: number,
  previous: number
): number {
  if (previous === 0) return 0
  return Number(
    (((current - previous) / previous) * 100).toFixed(1)
  )
}

// ─── Streak ───────────────────────────────────────────

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const d   = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth()    === now.getMonth()    &&
    d.getDate()     === now.getDate()
  )
}

/**
 * Check if a date was yesterday
 */
export function isYesterday(date: Date | string): boolean {
  const d         = typeof date === 'string' ? new Date(date) : date
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth()    === yesterday.getMonth()    &&
    d.getDate()     === yesterday.getDate()
  )
}

// ─── String Helpers ───────────────────────────────────

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength - 3)}…`
}

/**
 * Truncate string by word count
 */
export function truncateWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/)
  if (words.length <= maxWords) return text
  return words.slice(0, maxWords).join(' ') + '…'
}

/**
 * Capitalize first letter only
 */
export function capitalize(str: string): string {
  if (str.length === 0) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Generate context summary for ambient AI
 * Compresses recent activity into a prompt-safe string
 */
export function buildActivityContext(data: {
  journalCount?: number
  gymCount?:     number
  streak?:       number
  recentWords?:  string[]
  lastEntry?:    string
  surface:       string
}): string {
  const parts: string[] = []

  if (data.streak !== undefined) {
    parts.push(`Current streak: ${data.streak} days`)
  }
  if (data.journalCount !== undefined) {
    parts.push(`Journal entries this week: ${data.journalCount}`)
  }
  if (data.gymCount !== undefined) {
    parts.push(`Gym sessions this week: ${data.gymCount}`)
  }
  if (data.recentWords !== undefined && data.recentWords.length > 0) {
    parts.push(`Recent vocabulary: ${data.recentWords.join(', ')}`)
  }
  if (data.lastEntry !== undefined) {
    parts.push(
      `Last entry excerpt: "${truncate(data.lastEntry, 200)}"`
    )
  }

  return parts.join('\n')
}
