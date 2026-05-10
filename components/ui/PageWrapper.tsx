'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { type ReactNode } from 'react'
import { PAGE_ENTER_VARIANTS } from '@/lib/motion'

interface PageWrapperProps {
  children?:  ReactNode
  className?: string
  /** Page title — Instrument Serif italic, display scale */
  title?:     string
  /** Optional subline beneath title — mono caps */
  subtitle?:  string
}

export function PageWrapper({
  children,
  className,
  title,
  subtitle,
}: PageWrapperProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        className={`page-wrapper ${className ?? ''}`}
        variants={PAGE_ENTER_VARIANTS}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {(title || subtitle) && (
          <header className="page-header">
            {title && (
              <h1 className="page-title text-display">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="page-subtitle text-caption">
                {subtitle}
              </p>
            )}
          </header>
        )}

        <div className="page-content">
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
