'use client'

import { motion, type HTMLMotionProps, type TargetAndTransition } from 'framer-motion'
import { forwardRef } from 'react'
import { SPRING, DURATION } from '@/lib/motion'
import { playClick, initAudio } from '@/lib/audio'
import type { Mode } from '@/types/mode'

// ─── Button Variants ──────────────────────────────────
export type ButtonVariant =
  | 'primary'    // filled — main actions
  | 'secondary'  // bordered — secondary actions
  | 'ghost'      // text only — tertiary actions
  | 'signal'     // signal yellow — AI actions only
  | 'danger'     // error red — destructive actions

export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Current mode — determines spring physics + styling */
  mode?: Mode
  /** Loading state — shows pulse, disables interaction */
  loading?: boolean
  /** Full width */
  block?: boolean
}

// ─── Style Maps ───────────────────────────────────────
const SIZE_STYLES: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    fontSize: '10px',
    letterSpacing: '0.08em',
    padding: '8px 14px',
    height: '32px',
  },
  md: {
    fontSize: '11px',
    letterSpacing: '0.08em',
    padding: '10px 20px',
    height: '40px',
  },
  lg: {
    fontSize: '12px',
    letterSpacing: '0.08em',
    padding: '14px 28px',
    height: '48px',
  },
}

function getVariantStyles(
  variant: ButtonVariant,
  mode: Mode,
  disabled: boolean
): React.CSSProperties {
  const opacity = disabled ? 0.4 : 1

  const base: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: '1px solid transparent',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    opacity,
    userSelect: 'none',
    // APEX: sharp. HAVEN: slightly rounded.
    borderRadius: mode === 'apex' ? '6px' : '8px',
    transition: `border-color ${DURATION.CARD_HOVER}s`,
  }

  switch (variant) {
    case 'primary':
      return {
        ...base,
        background: 'var(--color-text-primary)',
        color: 'var(--color-void)',
        borderColor: 'var(--color-text-primary)',
      }
    case 'secondary':
      return {
        ...base,
        background: 'transparent',
        color: 'var(--color-text-secondary)',
        borderColor: 'var(--color-border)',
      }
    case 'ghost':
      return {
        ...base,
        background: 'transparent',
        color: 'var(--color-text-secondary)',
        borderColor: 'transparent',
      }
    case 'signal':
      return {
        ...base,
        background: 'rgba(232,255,71,0.08)',
        color: 'var(--color-signal)',
        borderColor: 'rgba(232,255,71,0.25)',
      }
    case 'danger':
      return {
        ...base,
        background: 'transparent',
        color: 'var(--color-error)',
        borderColor: 'rgba(255,68,68,0.3)',
      }
  }
}

function getHoverStyles(
  variant: ButtonVariant
): TargetAndTransition {
  switch (variant) {
    case 'primary':
      return { opacity: 0.85 }
    case 'secondary':
      return { borderColor: '#383838' }
    case 'ghost':
      return { color: 'var(--color-text-primary)' }
    case 'signal':
      return {
        background: 'rgba(232,255,71,0.12)',
        borderColor: 'rgba(232,255,71,0.4)',
      }
    case 'danger':
      return {
        background: 'rgba(255,68,68,0.06)',
        borderColor: 'rgba(255,68,68,0.5)',
      }
  }
}

// ─── Component ────────────────────────────────────────
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      mode = 'apex',
      loading = false,
      block = false,
      disabled,
      onClick,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled === true || loading

    const handleClick = (
      e: React.MouseEvent<HTMLButtonElement>
    ): void => {
      if (isDisabled) return
      initAudio()
      playClick(mode)
      onClick?.(e)
    }

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        onClick={handleClick}
        style={{
          ...getVariantStyles(variant, mode, isDisabled),
          ...SIZE_STYLES[size],
          width: block ? '100%' : undefined,
          ...style,
        }}
        whileHover={isDisabled ? undefined : getHoverStyles(variant)}
        whileTap={
          isDisabled
            ? undefined
            : {
                scale: 0.97,
                transition:
                  mode === 'apex' ? SPRING.SNAP : SPRING.FLOAT,
              }
        }
        transition={mode === 'apex' ? SPRING.SNAP : SPRING.FLOAT}
        {...props}
      >
        {loading ? (
          <span
            style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'currentColor',
              animation: 'signal-pulse 1.2s ease-in-out infinite',
            }}
          />
        ) : (
          children
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button
