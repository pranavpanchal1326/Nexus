'use client'
import { motion }              from 'framer-motion'
import { useJournalList }      from '@/hooks/useJournal'
import { JournalEntryCard }    from './JournalEntry'
import { CardSkeleton, EmptyState } from '@/components/ui'
import { STAGGER_CONTAINER_VARIANTS, CARD_REVEAL_VARIANTS } from '@/lib/motion'

export function JournalList() {
  const { data, isLoading, error } = useJournalList(20)

  if (isLoading) {
    return (
      <div className="journal-list">
        {Array.from({ length: 3 }, (_, i) => (
          <CardSkeleton key={i} padding={20} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="journal-list-error">
        <span>Failed to load entries</span>
      </div>
    )
  }

  const entries = data?.entries ?? []

  if (entries.length === 0) {
    return (
      <EmptyState
        module="journal"
        action={
          <span className="text-caption">
            Your first entry will appear here
          </span>
        }
      />
    )
  }

  return (
    <motion.div
      className="journal-list"
      variants={STAGGER_CONTAINER_VARIANTS}
      initial="hidden"
      animate="visible"
    >
      {entries.map(entry => (
        <motion.div key={entry.id} variants={CARD_REVEAL_VARIANTS}>
          <JournalEntryCard entry={entry} />
        </motion.div>
      ))}
    </motion.div>
  )
}
