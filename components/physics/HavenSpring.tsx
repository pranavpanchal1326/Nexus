'use client'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef, type ElementType, type ReactNode } from 'react'
import { SPRING } from '@/lib/motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HavenSpringProps extends HTMLMotionProps<'div'> {
  children:   ReactNode
  as?:        ElementType
  className?: string
  preset?:    'press' | 'hover' | 'reveal' | 'breathe' | 'none'
  disabled?:  boolean
}

// ─── Preset configurations — HAVEN character ──────────────────────────────────

const HAVEN_PRESS_PROPS = {
  // HAVEN press: softer compression, slower return
  whileTap:   { scale: 0.97 },
  whileHover: { scale: 1.015 },
  transition: SPRING.FLOAT,
}

const HAVEN_HOVER_PROPS = {
  // HAVEN hover: gentle float, heavier than APEX
  whileHover: { y: -1.5, transition: SPRING.FLOAT },
  transition:  SPRING.FLOAT,
}

const HAVEN_REVEAL_PROPS = {
  // HAVEN reveal: slower entrance, more vertical travel
  initial:    { opacity: 0, y: 16 },
  animate:    { opacity: 1, y: 0 },
  transition: SPRING.FLOAT,
}

const HAVEN_BREATHE_PROPS = {
  // HAVEN breathe: gentle pulsing scale — ambient alive feeling
  // Used for ambient elements that should feel like they breathe
  animate: {
    scale:   [1, 1.008, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 4.0,
      repeat:   Infinity,
      ease:     'easeInOut' as const,
    },
  },
}

// ─── Component ────────────────────────────────────────────────────────────────

export const HavenSpring = forwardRef<HTMLDivElement, HavenSpringProps>(
  function HavenSpring(
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
    const presetProps: HTMLMotionProps<'div'> = disabled
      ? {}
      : preset === 'press'
      ? HAVEN_PRESS_PROPS
      : preset === 'hover'
      ? HAVEN_HOVER_PROPS
      : preset === 'reveal'
      ? HAVEN_REVEAL_PROPS
      : preset === 'breathe'
      ? HAVEN_BREATHE_PROPS
      : { transition: SPRING.FLOAT }

    const MotionTag = motion(Tag as 'div')

    return (
      <MotionTag
        ref={ref}
        className={className}
        {...presetProps}
        {...Object.fromEntries(Object.entries(props).filter(([ , v]) => v !== undefined))}
        transition={props.transition ?? presetProps.transition ?? SPRING.FLOAT}
      >
        {children}
      </MotionTag>
    )
  }
)

HavenSpring.displayName = 'HavenSpring'

// ─── Specialized variants ─────────────────────────────────────────────────────

/**
 * HavenButton — HAVEN-mode button with contemplative press physics
 */
export function HavenButton({
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
        whileTap: { scale: 0.97 },
        whileHover: { scale: 1.015 }
      })}
      transition={SPRING.FLOAT}
      style={{
        cursor:  disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        ...props.style,
      }}
      {...Object.fromEntries(Object.entries(props).filter(([ , v]) => v !== undefined))}
    >
      {children}
    </motion.button>
  )
}

/**
 * HavenCard — HAVEN-mode card — breathes on hover instead of lifting
 */
export function HavenCard({
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
        scale:       1.008,
        borderColor: '#222222',
        transition:  SPRING.FLOAT,
      }}
      {...(onClick && { whileTap: { scale: 0.995, transition: SPRING.FLOAT } })}
      transition={SPRING.FLOAT}
      {...Object.fromEntries(Object.entries(props).filter(([ , v]) => v !== undefined))}
    >
      {children}
    </motion.div>
  )
}
