/**
 * NEXUS v2.0 — Mode and Persona Types
 * PRD Section 8 — Commander + Poet
 */

/** Circadian intelligence mode */
export type Mode = 'apex' | 'haven'

/** Auto includes circadian detection */
export type ModePreference = 'auto' | 'apex' | 'haven'

/** AI persona — maps directly to Mode */
export type Persona = 'commander' | 'poet'

/** Maps Mode to its Persona */
export const MODE_PERSONA_MAP: Record<Mode, Persona> = {
  apex:  'commander',
  haven: 'poet',
} as const

/** Tesseract rotation speed per mode — PRD Section 2.5 */
export const TESSERACT_SPEED: Record<Mode | 'default', number> = {
  default: 0.3,
  apex:    0.8,
  haven:   0.15,
} as const

/** Spring config key per mode */
export type SpringKey = 'SNAP' | 'FLOAT' | 'DEFAULT'

export const MODE_SPRING_MAP: Record<Mode, SpringKey> = {
  apex:  'SNAP',
  haven: 'FLOAT',
} as const

/** Spring physical properties — PRD Section 2.5 */
export interface PhysicsConfig {
  stiffness: number
  damping: number
  mass: number
}
