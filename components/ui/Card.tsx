'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'
import { DURATION } from '@/lib/motion'

// ─── Grain texture as inline SVG data URI ─────────────
// Removes the flat digital feeling — makes surfaces 
// feel physical. Opacity 0.025 — barely perceptible.
const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`

// ─── Card Variants ────────────────────────────────────
export type CardVariant = 'default' | 'signal' | 'raised' | 'ghost'

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  /** Visual variant — default for most surfaces */
  variant?: CardVariant
  /** Disable hover interaction entirely */
  static?: boolean
  /** Inner padding — defaults to none, set explicitly */
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const PADDING_MAP = {
  none: '0px',
  sm:   '16px',
  md:   '24px',
  lg:   '32px',
} as const

const VARIANT_STYLES: Record<CardVariant, React.CSSProperties> = {
  default: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-card)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  signal: {
    background: 'var(--color-surface)',
    border: '1px solid rgba(232,255,71,0.2)',
    borderRadius: 'var(--radius-card)',
    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.04),
      0 0 40px rgba(232,255,71,0.06)
    `,
  },
  raised: {
    background: 'var(--color-surface-raised)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-card)',
    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.04),
      0 8px 32px rgba(0,0,0,0.4)
    `,
  },
  ghost: {
    background: 'transparent',
    border: '1px solid var(--color-border-subtle)',
    borderRadius: 'var(--radius-card)',
    boxShadow: 'none',
  },
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      static: isStatic = false,
      padding = 'none',
      children,
      style,
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        style={{
          ...VARIANT_STYLES[variant],
          padding: PADDING_MAP[padding],
          position: 'relative',
          overflow: 'hidden',
          ...style,
        } as import('framer-motion').MotionStyle}
        {...(!isStatic && {
          whileHover: {
            borderColor:
              variant === 'signal'
                ? 'rgba(232,255,71,0.3)'
                : '#262626',
            boxShadow:
              variant === 'signal'
                ? `
                    inset 0 1px 0 rgba(255,255,255,0.04),
                    0 0 60px rgba(232,255,71,0.08)
                  `
                : `
                    inset 0 1px 0 rgba(255,255,255,0.04),
                    0 0 60px rgba(232,255,71,0.04)
                  `,
            transition: {
              duration: DURATION.CARD_HOVER,
              ease: [0.16, 1, 0.3, 1],
            },
          },
        })}
        {...props}
      >
        {/* Grain texture overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: GRAIN_SVG,
            backgroundRepeat: 'repeat',
            backgroundSize: '200px 200px',
            opacity: 0.025,
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
            borderRadius: 'inherit',
            zIndex: 0,
          }}
        />
        {/* Content above grain */}
        <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
          {children as React.ReactNode}
        </div>
      </motion.div>
    )
  }
)

Card.displayName = 'Card'

export default Card
