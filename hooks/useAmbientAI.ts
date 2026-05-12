'use client'
import {
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react'
import { useNexusStore } from '@/store/nexusStore'

// ─── Types ────────────────────────────────────────────────────────────────────

type AmbientSurface = 'journal' | 'dashboard' | 'gym' | 'lexicon'

interface UseAmbientAIOptions {
  surface:      AmbientSurface
  /** Minimum ms between ambient calls on the same surface — prevents spam */
  cooldown?:    number
  /** Whether ambient is enabled for this surface */
  enabled?:     boolean
}

interface UseAmbientAIResult {
  /** Current insight — null if none active */
  insight:       string | null
  /** Whether a request is in flight */
  isLoading:     boolean
  /** Manually trigger ambient with context */
  trigger:       (context: string) => Promise<void>
  /** Clear current insight */
  clear:         () => void
  /** Reset — clears insight and cooldown */
  reset:         () => void
}

// ─── Session deduplication — per surface ──────────────────────────────────────
// Tracks insights shown this session — prevents showing same insight twice
// Cleared on page refresh — not persistent

const sessionInsights = new Map<AmbientSurface, Set<string>>()

function hasSeenInsight(surface: AmbientSurface, insight: string): boolean {
  const seen = sessionInsights.get(surface)
  if (!seen) return false
  return seen.has(insight)
}

function markInsightSeen(surface: AmbientSurface, insight: string): void {
  if (!sessionInsights.has(surface)) {
    sessionInsights.set(surface, new Set())
  }
  sessionInsights.get(surface)!.add(insight)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAmbientAI({
  surface,
  cooldown = 60_000,   // Default: one ambient insight per minute per surface
  enabled  = true,
}: UseAmbientAIOptions): UseAmbientAIResult {
  const mode          = useNexusStore(state => state.mode)
  const signalStart   = useNexusStore(state => state.signalStart)
  const signalStop    = useNexusStore(state => state.signalStop)

  const [insight,   setInsight]   = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const lastCallRef   = useRef<number>(0)
  const isMountedRef  = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  // ─── Core trigger ─────────────────────────────────────────────────────────

  const trigger = useCallback(async (context: string): Promise<void> => {
    if (!enabled)    return
    if (isLoading)   return
    if (!context.trim()) return

    // Cooldown check — don't spam ambient
    const now     = Date.now()
    const elapsed = now - lastCallRef.current
    if (elapsed < cooldown && lastCallRef.current !== 0) return

    lastCallRef.current = now
    setIsLoading(true)
    signalStart()

    try {
      const res = await fetch('/api/chat/ambient', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ surface, context, mode }),
      })

      if (!res.ok || !isMountedRef.current) return

      const data = await res.json() as { insight?: string }
      const text = data.insight?.trim() ?? ''

      // Validate — non-empty, not seen this session
      if (!text) return
      if (hasSeenInsight(surface, text)) return

      markInsightSeen(surface, text)

      if (isMountedRef.current) {
        setInsight(text)
      }
    } catch {
      // Ambient failure is always silent — never surface to user
    } finally {
      if (isMountedRef.current) setIsLoading(false)
      signalStop()
    }
  }, [enabled, isLoading, cooldown, surface, mode, signalStart, signalStop])

  // ─── Clear ────────────────────────────────────────────────────────────────

  const clear = useCallback(() => {
    setInsight(null)
  }, [])

  // ─── Reset — clears insight and resets cooldown ────────────────────────────

  const reset = useCallback(() => {
    setInsight(null)
    lastCallRef.current = 0
  }, [])

  return { insight, isLoading, trigger, clear, reset }
}

// ─── Surface-specific hooks — pre-configured with correct trigger logic ────────

/**
 * Journal ambient — triggers after 3 seconds of writing pause.
 * Context: word count, last few words of entry, mode.
 */
export function useJournalAmbient(
  content:  string,
  enabled:  boolean = true
): UseAmbientAIResult {
  const ambient = useAmbientAI({
    surface:  'journal',
    cooldown: 120_000,   // Max once per 2 minutes while writing
    enabled,
  })

  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevLength    = useRef(0)

  useEffect(() => {
    // Only trigger on meaningful content (>50 chars) and after actual writing
    if (content.length < 50) return
    if (content.length === prevLength.current) return

    prevLength.current = content.length

    // Clear existing pause timer
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)

    // Start 3s pause timer
    pauseTimerRef.current = setTimeout(() => {
      // Build context — last 300 chars, word count, writing speed
      const wordCount = content.split(/\s+/).filter(Boolean).length
      const excerpt   = content.slice(-300).trim()

      const context = [
        `Word count: ${wordCount}`,
        `Recent excerpt: "${excerpt}"`,
      ].join('\n')

      ambient.trigger(context)
    }, 3000)

    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    }
  }, [content, ambient])

  return ambient
}

/**
 * Dashboard ambient — triggers once after stats data loads.
 * Context: streak, XP, recent activity, mode.
 */
export function useDashboardAmbient(
  statsData: {
    current_streak: number
    cognitive_xp:   number
    journal_count:  number
    gym_count:      number
    duel_count:     number
  } | null | undefined,
  enabled: boolean = true
): UseAmbientAIResult {
  const ambient = useAmbientAI({
    surface:  'dashboard',
    cooldown: 300_000,   // Max once per 5 minutes on dashboard
    enabled,
  })

  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    // Only trigger once per session on dashboard load
    if (!statsData)           return
    if (hasTriggeredRef.current) return
    if (statsData.current_streak === 0 && statsData.cognitive_xp === 0) return

    hasTriggeredRef.current = true

    const context = [
      `Current streak: ${statsData.current_streak} days`,
      `Cognitive XP: ${statsData.cognitive_xp}`,
      `Journal entries: ${statsData.journal_count}`,
      `Gym sessions: ${statsData.gym_count}`,
      `Duels completed: ${statsData.duel_count}`,
    ].join('\n')

    // Small delay after data loads — feels more natural
    const timer = setTimeout(() => {
      ambient.trigger(context)
    }, 1500)

    return () => clearTimeout(timer)
  }, [statsData, ambient])

  return ambient
}

/**
 * Gym ambient — triggers immediately after a set is logged.
 * Context: exercise, sets, reps, weight, previous session data.
 */
export function useGymAmbient(enabled: boolean = true): UseAmbientAIResult {
  return useAmbientAI({
    surface:  'gym',
    cooldown: 30_000,   // Once per 30s — user might log multiple sets quickly
    enabled,
  })
}

/**
 * Lexicon ambient — triggers after a duel round completes.
 * Context: word, usage, verdict, XP.
 */
export function useLexiconAmbient(enabled: boolean = true): UseAmbientAIResult {
  return useAmbientAI({
    surface:  'lexicon',
    cooldown: 60_000,
    enabled,
  })
}
