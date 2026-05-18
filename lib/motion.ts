import type { Variants, Transition, TargetAndTransition } from 'framer-motion'
import type { Mode } from '@/types/mode'

// ─── Spring Configurations ────────────────────────────────────────────────────

export const SPRING = {
  /**
   * APEX — Commander interactions
   * Critically damped (ζ=1.0) — fastest settle without oscillation
   * Stiffness 500, Damping 40, Mass 0.8
   * Use: Button presses, nav transitions, modal opens in APEX mode
   */
  SNAP: {
    type:      'spring' as const,
    stiffness: 500,
    damping:   40,
    mass:      0.8,
  },

  /**
   * HAVEN — Poet interactions
   * Slightly underdamped (ζ=0.95) — gentle breathe, barely perceptible settle
   * Stiffness 180, Damping 28, Mass 1.2
   * Use: Button presses, transitions, modal opens in HAVEN mode
   */
  FLOAT: {
    type:      'spring' as const,
    stiffness: 180,
    damping:   28,
    mass:      1.2,
  },

  /**
   * DEFAULT — All non-mode-specific motion
   * Stiffness 400, Damping 40, Mass 1.0
   * Use: Nav indicator slide, island expansion, general UI motion
   */
  DEFAULT: {
    type:      'spring' as const,
    stiffness: 400,
    damping:   40,
    mass:      1.0,
  },

  /**
   * EVENT — Island expanded state, system event notifications
   * Snappier than SNAP — urgency requires immediacy
   * Stiffness 600, Damping 38, Mass 0.8
   */
  EVENT: {
    type:      'spring' as const,
    stiffness: 600,
    damping:   38,
    mass:      0.8,
  },

  /**
   * ISLAND_DEFAULT — DynamicIsland resting state
   * Stiffness 500, Damping 42, Mass 0.9
   */
  ISLAND_DEFAULT: {
    type:      'spring' as const,
    stiffness: 500,
    damping:   42,
    mass:      0.9,
  },
} as const

// ─── Easing Curves ────────────────────────────────────────────────────────────

export const EASING = {
  /**
   * EXPO_OUT — Page entrances, large element reveals
   * Aggressive deceleration — weight settling into place
   */
  EXPO_OUT: [0.16, 1, 0.3, 1] as const,

  /**
   * STANDARD — UI transitions, state changes
   * Material Design standard easing — balanced
   */
  STANDARD: [0.4, 0, 0.2, 1] as const,

  /**
   * DECELERATE — Elements entering the screen
   */
  DECELERATE: [0, 0, 0.2, 1] as const,

  /**
   * ACCELERATE — Elements leaving the screen
   */
  ACCELERATE: [0.4, 0, 1, 1] as const,
} as const

// ─── Duration Constants ───────────────────────────────────────────────────────

export const DURATION = {
  INSTANT:    0.08,   // Immediate — blackout, flash
  FAST:       0.12,   // AI word materialize, small state changes
  NORMAL:     0.22,   // Page enter, standard transitions
  DELIBERATE: 0.4,    // Heatmap reveal, mode elements
  CINEMATIC:  0.6,    // Mode transition overlay
  SLOW:       2.4,    // Signal dot pulse, ambient breathing
} as const

// ─── Variant Libraries — use directly with motion components ─────────────────

/**
 * Page enter — use on every route's root motion.div
 * 220ms, y: 12→0, opacity: 0→1, EXPO_OUT easing
 */
export const PAGE_ENTER_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    y:       12,
  },
  visible: {
    opacity: 1,
    y:       0,
    transition: {
      duration: DURATION.NORMAL,
      ease:     EASING.EXPO_OUT,
    },
  },
  exit: {
    opacity: 0,
    y:       -8,
    transition: {
      duration: DURATION.FAST,
      ease:     EASING.ACCELERATE,
    },
  },
}

/**
 * Fade in — simple opacity transition
 * Used for ambient text appearances, tooltip show
 */
export const FADE_IN_VARIANTS: Variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.FAST, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.FAST, ease: 'easeIn' },
  },
}

/**
 * Card reveal — used for stat cards, module panels
 * Staggered entrance — parent orchestrates children
 */
export const CARD_REVEAL_VARIANTS: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y:       0,
    transition: {
      duration: DURATION.DELIBERATE,
      ease:     EASING.EXPO_OUT,
    },
  },
}

export const STAGGER_CONTAINER_VARIANTS: Variants = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren:  0.06,
      delayChildren:    0.1,
    },
  },
}

/**
 * AI text word materialize — word by word blur+opacity
 * Applied per word span in OracleChat and AmbientIntel
 */
export const AI_WORD_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    filter:  'blur(4px)',
  },
  visible: {
    opacity: 1,
    filter:  'blur(0px)',
    transition: {
      duration: DURATION.FAST,
      ease:     'easeOut',
    },
  },
}

/**
 * Signal dot pulse — AI processing indicator
 * Loops indefinitely while Groq request is active
 */
export const SIGNAL_PULSE_ANIMATION: TargetAndTransition = {
  scale:   [1, 1.6, 1],
  opacity: [1, 0.4, 1],
  transition: {
    duration: DURATION.SLOW,
    repeat:   Infinity,
    ease:     'easeInOut',
  },
}

/**
 * Heatmap cell reveal — staggered by column index
 * Cells animate left to right across the 365-day grid
 */
export function heatmapCellTransition(colIndex: number): Transition {
  return {
    duration: 0.4,
    ease:     EASING.EXPO_OUT,
    delay:    colIndex * 0.008,
  }
}

/**
 * Modal spring — enters with spring physics
 * Scale and opacity combined for physical weight feeling
 */
export const MODAL_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    scale:   0.96,
    y:       8,
  },
  visible: {
    opacity: 1,
    scale:   1,
    y:       0,
    transition: SPRING.DEFAULT,
  },
  exit: {
    opacity: 0,
    scale:   0.96,
    transition: {
      duration: DURATION.FAST,
      ease:     EASING.ACCELERATE,
    },
  },
}

// ─── Mode-aware spring selector ───────────────────────────────────────────────

/**
 * Returns the appropriate spring config for the current mode.
 * APEX → SNAP (stiff, decisive)
 * HAVEN → FLOAT (soft, contemplative)
 */
export function getModeSpring(mode: Mode): typeof SPRING.SNAP | typeof SPRING.FLOAT {
  return mode === 'apex' ? SPRING.SNAP : SPRING.FLOAT
}

/**
 * Returns mode-appropriate transition duration multiplier.
 * APEX interactions feel faster — HAVEN feel slower and heavier.
 */
export function getModeDurationMultiplier(mode: Mode): number {
  return mode === 'apex' ? 0.8 : 1.3
}
