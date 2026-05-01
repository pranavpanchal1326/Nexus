'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'
import { modalVariants, backdropVariants } from '@/lib/motion'

export interface ModalProps {
  /** Controlled open state */
  open: boolean
  /** Called when backdrop clicked or Escape pressed */
  onClose: () => void
  /** Modal content */
  children: ReactNode
  /** Max width of modal panel */
  maxWidth?: number
}

export function Modal({
  open,
  onClose,
  children,
  maxWidth = 560,
}: ModalProps): React.JSX.Element {
  // Close on Escape key
  useEffect((): (() => void) | void => {
    if (!open) return

    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Prevent body scroll when open
  useEffect((): (() => void) | void => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(8,8,8,0.8)',
              backdropFilter: 'blur(4px)',
              zIndex: 70,
            }}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              zIndex: 70,
              pointerEvents: 'none',
            }}
          >
            <motion.div
              key="modal-panel"
              role="dialog"
              aria-modal="true"
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{
                background: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-card)',
                boxShadow: `
                  inset 0 1px 0 rgba(255,255,255,0.04),
                  0 24px 64px rgba(0,0,0,0.6)
                `,
                width: '100%',
                maxWidth: `${maxWidth}px`,
                maxHeight: '90dvh',
                overflowY: 'auto',
                pointerEvents: 'auto',
                position: 'relative',
              }}
              onClick={e => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default Modal
