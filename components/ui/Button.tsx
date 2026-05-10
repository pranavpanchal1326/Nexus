'use client'
import { motion } from 'framer-motion'
import { useNexusStore } from '@/store/nexusStore'
import { SPRING } from '@/lib/motion'
import { SignalDot } from './SignalDot'
import type { HTMLMotionProps } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

type ButtonVariant = 'signal' | 'ghost' | 'surface' | 'danger'
type ButtonSize    = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children:   React.ReactNode
  variant?:   ButtonVariant
  size?:      ButtonSize
  loading?:   boolean
  disabled?:  boolean
  fullWidth?: boolean
  /** Force specific mode — for auth pages before mode detection runs */
  forceMode?: 'apex' | 'haven'
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  signal:  'btn--signal',   // Signal border, signal text
  ghost:   'btn--ghost',    // No border, secondary text
  surface: 'btn--surface',  // Surface background, primary text
  danger:  'btn--danger',   // Error color
}

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'btn--sm',    // h: 32px, text: 11px
  md: 'btn--md',    // h: 44px, text: 12px (default)
  lg: 'btn--lg',    // h: 52px, text: 13px
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Button({
  children,
  variant   = 'signal',
  size      = 'md',
  loading   = false,
  disabled  = false,
  fullWidth = false,
  forceMode,
  className,
  onClick,
  ...props
}: ButtonProps) {
  const storeMode = useNexusStore(state => state.mode)
  const mode      = forceMode ?? storeMode

  const spring   = mode === 'apex' ? SPRING.SNAP : SPRING.FLOAT
  const tapScale  = mode === 'apex' ? 0.95 : 0.97
  const hoverScale = mode === 'apex' ? 1.02 : 1.015

  const isDisabled = disabled || loading

  return (
    <motion.button
      className={[
        'btn',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        fullWidth  ? 'btn--full'     : '',
        isDisabled ? 'btn--disabled' : '',
        loading    ? 'btn--loading'  : '',
        className  ?? '',
      ].filter(Boolean).join(' ')}
      onClick={isDisabled ? undefined : onClick}
      {...(!isDisabled && {
        whileTap: { scale: tapScale },
        whileHover: { scale: hoverScale }
      })}
      transition={spring}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span className="btn__loading-state">
          <SignalDot />
        </span>
      ) : (
        <span className="btn__label">{children}</span>
      )}
    </motion.button>
  )
}
