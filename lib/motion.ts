/**
 * NEXUS v2.0 — Motion System
 * Spring configs and easing constants
 * PRD Section 2.5 — do not add to this file
 * Every animation in the product references these values
 */

// ─── Spring Configurations ────────────────────────────
export const SPRING = {
  /** APEX mode — snappy, decisive, Commander energy */
  SNAP: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 40,
    mass: 0.8,
  },
  /** HAVEN mode — floaty, unhurried, Poet energy */
  FLOAT: {
    type: 'spring' as const,
    stiffness: 180,
    damping: 28,
    mass: 1.2,
  },
  /** Default — all other motion in the product */
  DEFAULT: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 40,
    mass: 1.0,
  },
} as const

// ─── Easing Constants ─────────────────────────────────
export const EASING = {
  /** Page entrances — weight settling into place */
  EXPO_OUT: [0.16, 1, 0.3, 1] as const,
  /** Standard UI transitions */
  STANDARD: [0.4, 0, 0.2, 1] as const,
} as const

// ─── Duration Constants (ms) ──────────────────────────
export const DURATION = {
  /** Page route entrance */
  PAGE_ENTER: 0.22,
  /** AI word materialize — per word */
  WORD: 0.12,
  /** Number odometer roll */
  ODOMETER: 0.15,
  /** Signal dot full pulse cycle */
  SIGNAL_PULSE: 2.4,
  /** Card hover transition */
  CARD_HOVER: 0.4,
  /** Mode transition cinematic */
  MODE_SWITCH: 0.6,
  /** Ambient AI fade out */
  AMBIENT_FADE: 8.0,
} as const

// ─── Animation Variants — Framer Motion ───────────────

/** Page entrance — every route wrapper uses this */
export const pageVariants = {
  initial: { y: 12, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: DURATION.PAGE_ENTER,
      ease: EASING.EXPO_OUT,
    },
  },
  exit: {
    y: -8,
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: EASING.STANDARD,
    },
  },
} as const

/** Modal entrance — spring from below */
export const modalVariants = {
  initial: { y: 24, opacity: 0, scale: 0.97 },
  animate: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: SPRING.DEFAULT,
  },
  exit: {
    y: 16,
    opacity: 0,
    scale: 0.97,
    transition: {
      duration: 0.15,
      ease: EASING.STANDARD,
    },
  },
} as const

/** Overlay backdrop — fade only */
export const backdropVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.2, ease: EASING.STANDARD },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: EASING.STANDARD },
  },
} as const

/** Ambient intel — materialize then fade */
export const ambientVariants = {
  initial: { opacity: 0, y: 4 },
  animate: {
    opacity: 0.7,
    y: 0,
    transition: { duration: 0.4, ease: EASING.EXPO_OUT },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.6,
      ease: EASING.STANDARD,
      delay: DURATION.AMBIENT_FADE,
    },
  },
} as const
