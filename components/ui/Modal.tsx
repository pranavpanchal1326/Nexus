'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'
import { MODAL_VARIANTS, FADE_IN_VARIANTS } from '@/lib/motion'
import { playSound } from '@/lib/audio'

interface ModalProps {
  isOpen:     boolean
  onClose:    () => void
  children:   ReactNode
  title?:     string
  maxWidth?:  string
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  maxWidth = '480px',
}: ModalProps) {

  // Audio: play sounds on open/close
  useEffect(() => {
    if (isOpen) playSound('modal-open')
    else        playSound('modal-close')
  }, [isOpen])


  // Keyboard: Escape closes modal
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      // Note: Escape is also Protocol ZERO (hold 2s)
      // Single tap closes modal — hold triggers Protocol ZERO
      // Modal's single-tap handler fires before 2s hold completes
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Body scroll lock
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else        document.body.style.overflow = ''
    return () =>  { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="modal-backdrop"
            variants={FADE_IN_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="modal-panel"
            style={{ maxWidth }}
            variants={MODAL_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {title && (
              <div className="modal-header">
                <span className="modal-title">{title}</span>
                <button
                  className="modal-close"
                  onClick={onClose}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="modal-body">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
