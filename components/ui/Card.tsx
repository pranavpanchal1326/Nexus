'use client'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { useNexusStore } from '@/store/nexusStore'
import { SPRING } from '@/lib/motion'

// ─── Types ────────────────────────────────────────────────────────────────────

type CardVariant = 'default' | 'signal' | 'raised' | 'flat'

interface CardProps extends HTMLMotionProps<'div'> {
  variant?:    CardVariant
  interactive?: boolean   // adds hover/press physics if true
  padding?:    'none' | 'sm' | 'md' | 'lg'
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Card({
  children,
  variant     = 'default',
  interactive = false,
  padding     = 'md',
  className,
  ...props
}: CardProps) {
  const mode   = useNexusStore(state => state.mode)
  const spring = mode === 'apex' ? SPRING.SNAP : SPRING.FLOAT

  const hoverProps = interactive
    ? mode === 'apex'
      ? { whileHover: { y: -3, transition: spring }, whileTap: { scale: 0.99 } }
      : { whileHover: { scale: 1.008, transition: spring } }
    : {}

  return (
    <motion.div
      className={[
        'card',
        `card--${variant}`,
        `card--pad-${padding}`,
        interactive ? 'card--interactive' : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
      transition={spring}
      {...hoverProps}
      {...props}
    >
      {children}
    </motion.div>
  )
}
