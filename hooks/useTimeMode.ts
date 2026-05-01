'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useNexusStore } from '@/store/nexusStore'
import type { Mode } from '@/types/mode'

// ─── Constants ────────────────────────────────────────────────────────────────

const APEX_START_HOUR = 5    // 05:00 local
const APEX_END_HOUR   = 13   // 13:00 local — HAVEN begins here
const TICK_INTERVAL   = 60_000  // 60 seconds
const STORAGE_KEY     = 'nexus:last-mode'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimeModeState {
  /** Resolved mode — respects preferredMode override */
  mode: Mode

  /** Raw circadian mode — ignores user preference */
  circadianMode: Mode

  /** Whether user has overridden circadian detection */
  isOverridden: boolean

  /** "HH:MM" remaining in current window */
  timeRemaining: string

  /** Minutes remaining as number — for progress calculations */
  minutesRemaining: number

  /** When the current window ends */
  windowEnd: Date | null

  /** When the current window started */
  windowStart: Date | null

  /** Human-readable window label */
  windowLabel: string

  /** Whether the hook has completed hydration — false during SSR */
  isHydrated: boolean
}

export type PreferredMode = 'auto' | 'apex' | 'haven'

// ─── Pure calculation functions — no side effects, fully testable ──────────────

/**
 * Given a Date, return which circadian mode it falls in
 * and how many minutes remain in that window.
 */
export function calculateCircadianState(now: Date): {
  mode: Mode
  minutesRemaining: number
  windowStart: Date
  windowEnd: Date
} {
  const hour   = now.getHours()
  const minute = now.getMinutes()
  const totalMinutes = hour * 60 + minute

  const apexStartMinutes = APEX_START_HOUR * 60   // 300
  const apexEndMinutes   = APEX_END_HOUR   * 60   // 780

  if (totalMinutes >= apexStartMinutes && totalMinutes < apexEndMinutes) {
    // We are in APEX window
    const remaining = apexEndMinutes - totalMinutes

    const windowStart = new Date(now)
    windowStart.setHours(APEX_START_HOUR, 0, 0, 0)

    const windowEnd = new Date(now)
    windowEnd.setHours(APEX_END_HOUR, 0, 0, 0)

    return { mode: 'apex', minutesRemaining: remaining, windowStart, windowEnd }
  } else {
    // We are in HAVEN window
    // Calculate minutes until APEX starts (next occurrence)
    let remaining: number
    let windowEnd: Date

    if (totalMinutes < apexStartMinutes) {
      // Early morning — HAVEN started yesterday, APEX starts today
      remaining = apexStartMinutes - totalMinutes
      windowEnd = new Date(now)
      windowEnd.setHours(APEX_START_HOUR, 0, 0, 0)
    } else {
      // Evening/night — HAVEN started at 13:00, APEX starts tomorrow
      remaining = (24 * 60 - totalMinutes) + apexStartMinutes
      windowEnd = new Date(now)
      windowEnd.setDate(windowEnd.getDate() + 1)
      windowEnd.setHours(APEX_START_HOUR, 0, 0, 0)
    }

    // Window started at 13:00 today or yesterday depending on time
    const windowStart = new Date(now)
    if (totalMinutes < apexStartMinutes) {
      // HAVEN started yesterday at 13:00
      windowStart.setDate(windowStart.getDate() - 1)
    }
    windowStart.setHours(APEX_END_HOUR, 0, 0, 0)

    return { mode: 'haven', minutesRemaining: remaining, windowStart, windowEnd }
  }
}

/**
 * Format integer minutes into HH:MM string.
 * Input: 273 → Output: "04:33"
 */
export function formatMinutesAsTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Resolve the effective mode given user preference and circadian state.
 */
export function resolveMode(
  circadianMode: Mode,
  preferred: PreferredMode
): { resolved: Mode; isOverridden: boolean } {
  if (preferred === 'auto') {
    return { resolved: circadianMode, isOverridden: false }
  }
  return {
    resolved: preferred,
    isOverridden: preferred !== circadianMode,
  }
}

/**
 * Build the human-readable window label for IntelPanel display.
 * Example: "APEX until 13:00" | "HAVEN until 05:00"
 */
function buildWindowLabel(mode: Mode, windowEnd: Date | null): string {
  if (!windowEnd) return ''
  const endHour = String(windowEnd.getHours()).padStart(2, '0')
  const endMin  = String(windowEnd.getMinutes()).padStart(2, '0')
  const modeName = mode === 'apex' ? 'APEX' : 'HAVEN'
  return `${modeName} until ${endHour}:${endMin}`
}

// ─── SSR-safe default state ────────────────────────────────────────────────────

const SSR_DEFAULT: TimeModeState = {
  mode:             'apex',
  circadianMode:    'apex',
  isOverridden:     false,
  timeRemaining:    '00:00',
  minutesRemaining: 0,
  windowEnd:        null,
  windowStart:      null,
  windowLabel:      '',
  isHydrated:       false,
}

// ─── localStorage helpers — safe, never throws ────────────────────────────────

function persistMode(mode: Mode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // localStorage unavailable — incognito, storage quota — silently ignore
  }
}

function getPersistedMode(): Mode | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'apex' || stored === 'haven') return stored
    return null
  } catch {
    return null
  }
}

// ─── The Hook ─────────────────────────────────────────────────────────────────

export function useTimeMode(preferred: PreferredMode = 'auto'): TimeModeState {
  const setMode    = useNexusStore(state => state.setMode)
  const storeMode  = useNexusStore(state => state.mode)

  const [state, setState] = useState<TimeModeState>(SSR_DEFAULT)
  const previousModeRef = useRef<Mode | null>(null)
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Calculate and apply current state ───────────────────────────────────────

  const tick = useCallback(() => {
    const now = new Date()
    const {
      mode: circadianMode,
      minutesRemaining,
      windowStart,
      windowEnd,
    } = calculateCircadianState(now)

    const { resolved, isOverridden } = resolveMode(circadianMode, preferred)

    // Boundary crossing detection — only fire setMode when mode actually changes
    if (previousModeRef.current !== null && previousModeRef.current !== resolved) {
      // Mode boundary crossed — update Zustand
      setMode(resolved)
      persistMode(resolved)

      // Dispatch island event for boundary crossing
      window.dispatchEvent(new CustomEvent('nexus:island-event', {
        detail: {
          icon: resolved === 'apex' ? 'oracle' : 'oracle',
          text: resolved === 'apex'
            ? 'APEX WINDOW — COMMANDER ACTIVE'
            : 'HAVEN WINDOW — POET ACTIVE',
        }
      }))
    }

    previousModeRef.current = resolved

    setState({
      mode:             resolved,
      circadianMode,
      isOverridden,
      timeRemaining:    formatMinutesAsTime(minutesRemaining),
      minutesRemaining,
      windowEnd,
      windowStart,
      windowLabel:      buildWindowLabel(resolved, windowEnd),
      isHydrated:       true,
    })

    return resolved
  }, [preferred, setMode])

  // ─── Mount: hydrate immediately, then tick every 60s ─────────────────────────

  useEffect((): (() => void) => {
    // On first mount — check localStorage for last known mode
    // Use it as optimistic initial value to prevent flash
    const persisted = getPersistedMode()
    if (persisted && previousModeRef.current === null) {
      // Apply persisted mode to store immediately — prevents wrong-mode flash
      setMode(persisted)
    }

    // Run immediately
    const resolved = tick()

    // Sync to store on mount — only if different from what's currently in store
    if (resolved !== storeMode) {
      setMode(resolved)
      persistMode(resolved)
    }

    // Align interval to the next minute boundary for accuracy
    // Instead of ticking every 60s from mount (which drifts),
    // calculate ms until next minute, fire first tick there, then every 60s
    const now         = new Date()
    const msUntilNext = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()

    const alignmentTimer = setTimeout((): void => {
      tick()
      intervalRef.current = setInterval(tick, TICK_INTERVAL)
    }, msUntilNext)

    return () => {
      clearTimeout(alignmentTimer)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // Intentionally omitting deps — this effect must run once on mount only

  // ─── React to preferred mode changes (user changes settings mid-session) ─────

  useEffect((): void => {
    const { resolved } = resolveMode(state.circadianMode, preferred)
    if (resolved !== state.mode) {
      setMode(resolved)
      persistMode(resolved)
      setState(prev => ({
        ...prev,
        mode: resolved,
        isOverridden: preferred !== 'auto' && preferred !== prev.circadianMode,
        windowLabel: buildWindowLabel(resolved, prev.windowEnd),
      }))
      previousModeRef.current = resolved
    }
  }, [preferred]) // eslint-disable-line react-hooks/exhaustive-deps

  return state
}
