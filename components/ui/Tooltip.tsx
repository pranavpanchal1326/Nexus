// Tooltip.tsx — used in NavRail for icon labels
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, type ReactNode } from 'react'

interface TooltipProps {
  content:   string
  children:  ReactNode
  side?:     'right' | 'top' | 'bottom'
}

export function Tooltip({ content, children, side = 'right' }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            className={`tooltip tooltip--${side}`}
            initial={{ opacity: 0, x: side === 'right' ? -4 : 0, y: side === 'top' ? 4 : 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{    opacity: 0, x: side === 'right' ? -4 : 0 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
