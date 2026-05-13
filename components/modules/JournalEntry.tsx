'use client'
import { useState }         from 'react'
import { motion }            from 'framer-motion'
import { ModeIndicator }     from '@/components/ui'
import { relativeTime }      from '@/lib/utils'
import type { JournalEntry } from '@/hooks/useJournal'

interface JournalEntryProps {
  entry:    JournalEntry
  onSelect?: (entry: JournalEntry) => void
}

export function JournalEntryCard({ entry, onSelect }: JournalEntryProps) {
  const [expanded, setExpanded] = useState(false)
  const isLong = entry.content.length > 280

  const preview = isLong && !expanded
    ? entry.content.slice(0, 280).trim() + '…'
    : entry.content

  return (
    <motion.div
      className="journal-entry-card card card--pad-md"
      layout
      onClick={() => onSelect?.(entry)}
      style={{ cursor: onSelect ? 'pointer' : 'default' }}
    >
      {/* Header */}
      <div className="journal-entry__header">
        <ModeIndicator mode={entry.mode} size="sm" />
        <div className="journal-entry__meta">
          <span className="journal-entry__words">{entry.word_count}w</span>
          <span className="journal-entry__date">
            {relativeTime(entry.created_at)}
          </span>
        </div>
      </div>

      {/* Content */}
      <p className={`journal-entry__content journal-entry__content--${entry.mode}`}>
        {preview}
      </p>

      {/* Expand toggle */}
      {isLong && (
        <button
          className="journal-entry__expand"
          onClick={e => {
            e.stopPropagation()
            setExpanded(prev => !prev)
          }}
        >
          {expanded ? 'COLLAPSE' : 'READ MORE'}
        </button>
      )}

      {/* AI insight — if present */}
      {entry.ai_insight && (
        <div className="journal-entry__insight">
          <span className="journal-entry__insight-dot" aria-hidden="true" />
          <span className="journal-entry__insight-text">
            {entry.ai_insight}
          </span>
        </div>
      )}
    </motion.div>
  )
}
