'use client'
import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AmbientIntelProps {
  /** The insight text to display */
  insight:      string | null
  /** Where this insight is surfaced — affects positioning */
  surface:      'journal' | 'dashboard' | 'gym' | 'lexicon'
  /** Additional CSS class for positioning */
  className?:   string
  /** Auto-fade duration in ms — default 8000 */
  fadeDuration?: number
  /** Called when fade completes */
  onFaded?:     (() => void) | undefined
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AmbientIntel({
  insight,
  surface,
  className,
  fadeDuration = 8000,
  onFaded,
}: AmbientIntelProps) {
  const [visible,     setVisible]     = useState(false)
  const [displayText, setDisplayText] = useState<string | null>(null)
  const fadeTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevInsight   = useRef<string | null>(null)

  useEffect(() => {
    // Clear any pending fade timer
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current)
      fadeTimerRef.current = null
    }

    if (!insight || insight === prevInsight.current) {
      // No new insight — don't show same text twice in a session
      return
    }

    prevInsight.current = insight
    setDisplayText(insight)
    setVisible(true)

    // Auto-fade after fadeDuration
    fadeTimerRef.current = setTimeout(() => {
      setVisible(false)
      fadeTimerRef.current = null
      // Notify parent after animation completes
      setTimeout(() => onFaded?.(), 400)
    }, fadeDuration)

    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    }
  }, [insight, fadeDuration, onFaded])

  return (
    <AnimatePresence>
      {visible && displayText && (
        <motion.div
          className={`ambient-intel ambient-intel--${surface} ${className ?? ''}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{    opacity: 0, y: -2 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          aria-live="polite"
          aria-atomic="true"
        >
          {/* Signal indicator — tiny dot preceding insight */}
          <span className="ambient-intel__dot" aria-hidden="true" />

          {/* Insight text */}
          <span className="ambient-intel__text">
            {displayText}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Surface-specific variants ────────────────────────────────────────────────

/**
 * Journal ambient — appears below cursor after writing pause
 * Positioned inline within the editor
 */
export function JournalAmbientIntel({
  insight,
  onFaded,
}: {
  insight: string | null
  onFaded?: () => void
}) {
  return (
    <AmbientIntel
      insight={insight}
      surface="journal"
      className="ambient-intel--inline"
      onFaded={onFaded}
    />
  )
}

/**
 * Dashboard ambient — appears below heatmap after data loads
 */
export function DashboardAmbientIntel({
  insight,
  onFaded,
}: {
  insight: string | null
  onFaded?: () => void
}) {
  return (
    <AmbientIntel
      insight={insight}
      surface="dashboard"
      className="ambient-intel--block"
      onFaded={onFaded}
    />
  )
}

/**
 * Gym ambient — appears beside logged set entry
 */
export function GymAmbientIntel({
  insight,
  onFaded,
}: {
  insight: string | null
  onFaded?: () => void
}) {
  return (
    <AmbientIntel
      insight={insight}
      surface="gym"
      className="ambient-intel--beside"
      onFaded={onFaded}
    />
  )
}

/**
 * Intel panel ambient — mounted in IntelPanel whisper zone
 */
export function PanelAmbientIntel({
  insight,
}: {
  insight: string | null
}) {
  return (
    <AmbientIntel
      insight={insight}
      surface="dashboard"
      fadeDuration={12000}   // Panel whispers linger slightly longer
    />
  )
}
