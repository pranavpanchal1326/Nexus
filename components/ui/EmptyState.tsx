'use client'
import { motion } from 'framer-motion'
import { FADE_IN_VARIANTS } from '@/lib/motion'

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmptyStateModule =
  | 'journal'
  | 'gym'
  | 'lexicon'
  | 'oracle'
  | 'heatmap'
  | 'feed'
  | 'generic'

interface EmptyStateProps {
  module?:    EmptyStateModule
  /** Override default copy */
  label?:     string
  subline?:   string
  /** Optional action element */
  action?:    React.ReactNode
  className?: string
}

// ─── Copy per module — Void Intelligence voice ────────────────────────────────

export const EMPTY_STATE_COPY: Record<EmptyStateModule, { label: string; subline: string }> = {
  journal: {
    label:   'NO ENTRIES YET',
    subline: 'The page is blank. That is where everything begins.',
  },
  gym: {
    label:   'NO SESSIONS LOGGED',
    subline: 'The body remembers what you do to it. Start the record.',
  },
  lexicon: {
    label:   'NO WORDS YET',
    subline: 'Language is the territory of thought. Begin claiming it.',
  },
  oracle: {
    label:   'NO SESSIONS YET',
    subline: 'The intelligence is waiting. Ask it something.',
  },
  heatmap: {
    label:   'NO ACTIVITY YET',
    subline: 'Each square is a day. Fill them.',
  },
  feed: {
    label:   'NO ACTIVITY YET',
    subline: 'Begin. The system is watching.',
  },
  generic: {
    label:   'NOTHING HERE',
    subline: 'This space is waiting to be filled.',
  },
}

// ─── Glyphs per module ────────────────────────────────────────────────────────

const GLYPHS: Record<EmptyStateModule, string> = {
  journal:  '◻',
  gym:      '△',
  lexicon:  '◇',
  oracle:   '○',
  heatmap:  '▦',
  feed:     '·',
  generic:  '◇',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EmptyState({
  module    = 'generic',
  label,
  subline,
  action,
  className,
}: EmptyStateProps) {
  const copy = EMPTY_STATE_COPY[module]

  return (
    <motion.div
      className={`empty-state ${className ?? ''}`}
      variants={FADE_IN_VARIANTS}
      initial="hidden"
      animate="visible"
    >
      {/* Geometric glyph — module-specific breathing indicator */}
      <motion.span
        className="empty-state__glyph"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      >
        {GLYPHS[module]}
      </motion.span>

      <div className="empty-state__copy">
        <span className="empty-state__label">
          {label ?? copy.label}
        </span>
        <span className="empty-state__subline">
          {subline ?? copy.subline}
        </span>
      </div>

      {action && (
        <div className="empty-state__action">
          {action}
        </div>
      )}
    </motion.div>
  )
}
