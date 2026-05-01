'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  useState,
  useRef,
  type ReactNode,
  type CSSProperties,
} from 'react'

export interface TooltipProps {
  /** The element that triggers the tooltip */
  children: ReactNode
  /** Tooltip label text */
  label: string
  /** Which side to show — nav rail always uses 'right' */
  side?: 'right' | 'top' | 'bottom' | 'left'
}

const SIDE_STYLES: Record<
  NonNullable<TooltipProps['side']>,
  CSSProperties
> = {
  right: {
    left: 'calc(100% + 12px)',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  left: {
    right: 'calc(100% + 12px)',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  top: {
    bottom: 'calc(100% + 8px)',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  bottom: {
    top: 'calc(100% + 8px)',
    left: '50%',
    transform: 'translateX(-50%)',
  },
}

const SIDE_MOTION: Record<
  NonNullable<TooltipProps['side']>,
  { x?: number; y?: number }
> = {
  right:  { x: -4 },
  left:   { x: 4  },
  top:    { y: 4  },
  bottom: { y: -4 },
}

export function Tooltip({
  children,
  label,
  side = 'right',
}: TooltipProps): React.JSX.Element {
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = (): void => {
    timeoutRef.current = setTimeout(() => setVisible(true), 400)
  }

  const hide = (): void => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setVisible(false)
  }

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      <AnimatePresence>
        {visible && (
          <motion.div
            role="tooltip"
            initial={{
              opacity: 0,
              ...SIDE_MOTION[side],
            }}
            animate={{
              opacity: 1,
              x: 0,
              y: 0,
              transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
            }}
            exit={{
              opacity: 0,
              transition: { duration: 0.1 },
            }}
            style={{
              position: 'absolute',
              ...SIDE_STYLES[side],
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              background: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              padding: '6px 10px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 100,
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            } as import('framer-motion').MotionStyle}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Tooltip
