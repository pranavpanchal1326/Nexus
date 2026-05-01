/**
 * Returns a human-readable relative time string.
 * Used throughout IntelPanel activity feed.
 * No external dependency — pure calculation.
 */
export function relativeTime(dateString: string): string {
  const now  = new Date()
  const then = new Date(dateString)
  const diffMs = now.getTime() - then.getTime()

  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours   = Math.floor(diffMinutes / 60)
  const diffDays    = Math.floor(diffHours / 24)

  if (diffSeconds < 60)  return 'just now'
  if (diffMinutes < 60)  return `${diffMinutes}m ago`
  if (diffHours   < 24)  return `${diffHours}h ago`
  if (diffDays    < 7)   return `${diffDays}d ago`
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Truncates text to a maximum number of words.
 * Used for activity feed previews in IntelPanel.
 */
export function truncateWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/)
  if (words.length <= maxWords) return text
  return words.slice(0, maxWords).join(' ') + '…'
}

/**
 * Checks if a date string represents today in local timezone.
 */
export function isToday(dateString: string): boolean {
  const date  = new Date(dateString)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth()    === today.getMonth()    &&
    date.getDate()     === today.getDate()
  )
}

/**
 * Formats a Date as a localized time string — e.g., "09:42"
 */
export function formatLocalTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Returns the current NEXUS mode purely from time — no React, no hooks.
 * Used for SSR-side mode detection where hooks aren't available.
 */
export function getServerSideMode(): 'apex' | 'haven' {
  // Server uses UTC — cannot determine user timezone
  // Return 'apex' as safe default — client will correct immediately on hydration
  return 'apex'
}
