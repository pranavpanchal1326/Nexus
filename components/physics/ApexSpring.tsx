'use client'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef, type ElementType, type ReactNode } from 'react'
import { SPRING } from '@/lib/motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApexSpringProps extends HTMLMotionProps<'div'> {
  children:   ReactNode
  /** HTML element to render — defaults to div */
  as?:        ElementType
  /** Additional CSS classes */
  className?: string
  /**
   * Interaction preset:
   * 'press'    — scale down on tap (buttons, cards)
   * 'hover'    — lift on hover (nav items, list items)
   * 'reveal'   — entrance animation (new content)
   * 'none'     — spring transition only, no gesture response
   */
  preset?:    'press' | 'hover' | 'reveal' | 'none'
  /** Whether component is disabled — suppresses all interaction */
  disabled?:  boolean
}

// ─── Preset configurations ────────────────────────────────────────────────────

const APEX_PRESS_PROPS = {
  whileTap:   { scale: 0.96 },
  whileHover: { scale: 1.02 },
  transition: SPRING.SNAP,
}

const APEX_HOVER_PROPS = {
  whileHover: { y: -2, transition: SPRING.SNAP },
  transition:  SPRING.SNAP,
}

const APEX_REVEAL_PROPS = {
  initial:    { opacity: 0, y: 8 },
  animate:    { opacity: 1, y: 0 },
  transition: SPRING.SNAP,
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ApexSpring = forwardRef<HTMLDivElement, ApexSpringProps>(
  function ApexSpring(
    {
      children,
      as: Tag = 'div',
      className,
      preset = 'none',
      disabled = false,
      ...props
    },
    ref
  ) {
    // Resolve preset interaction props
    const presetProps = disabled
      ? {}
      : preset === 'press'
      ? APEX_PRESS_PROPS
      : preset === 'hover'
      ? APEX_HOVER_PROPS
      : preset === 'reveal'
      ? APEX_REVEAL_PROPS
      : { transition: SPRING.SNAP }

    const MotionTag = motion(Tag as 'div')

    return (
      <MotionTag
        ref={ref}
        className={className}
        {...presetProps}
        {...Object.fromEntries(Object.entries(props).filter(([_, v]) => v !== undefined))}
        // Merge transition — prop transition overrides preset if provided
        transition={props.transition ?? (presetProps as any).transition ?? SPRING.SNAP}
      >
        {children}
      </MotionTag>
    )
  }
)

ApexSpring.displayName = 'ApexSpring'

// ─── Specialized variants ─────────────────────────────────────────────────────

/**
 * ApexButton — APEX-mode button with press physics
 * Use for all interactive buttons in APEX mode
 */
export function ApexButton({
  children,
  className,
  onClick,
  disabled,
  ...props
}: HTMLMotionProps<'button'> & { disabled?: boolean }) {
  return (
    <motion.button
      className={className}
      {...(onClick && !disabled ? { onClick } : {})}
      {...(!disabled && {
        whileTap: { scale: 0.95 },
        whileHover: { scale: 1.02 }
      })}
      transition={SPRING.SNAP}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        ...props.style,
      }}
      {...Object.fromEntries(Object.entries(props).filter(([_, v]) => v !== undefined))}
    >
      {children}
    </motion.button>
  )
}

/**
 * ApexCard — APEX-mode card with hover lift
 * Use for all card surfaces in APEX mode
 */
export function ApexCard({
  children,
  className,
  onClick,
  ...props
}: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      className={`card ${className ?? ''}`}
      {...(onClick ? { onClick } : {})}
      whileHover={{
        y:             -3,
        borderColor:   '#262626',
        transition:    SPRING.SNAP,
      }}
      {...(onClick && { whileTap: { scale: 0.99, transition: SPRING.SNAP } })}
      transition={SPRING.SNAP}
      {...Object.fromEntries(Object.entries(props).filter(([_, v]) => v !== undefined))}
    >
      {children}
    </motion.div>
  )
}
