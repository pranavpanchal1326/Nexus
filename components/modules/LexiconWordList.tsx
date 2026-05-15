'use client'
import { motion }          from 'framer-motion'
import { useLexiconWords } from '@/hooks/useLexicon'
import { relativeTime }    from '@/lib/utils'
import { EmptyState, CardSkeleton } from '@/components/ui'
import { STAGGER_CONTAINER_VARIANTS, CARD_REVEAL_VARIANTS } from '@/lib/motion'

export function LexiconWordList() {
  const { data, isLoading } = useLexiconWords(50)
  const words = data?.words ?? []

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} />)}
      </div>
    )
  }

  if (words.length === 0) {
    return <EmptyState module="lexicon" />
  }

  return (
    <motion.div
      className="lexicon-word-list"
      variants={STAGGER_CONTAINER_VARIANTS}
      initial="hidden"
      animate="visible"
    >
      {words.map(word => (
        <motion.div
          key={word.id}
          className="lexicon-word-row card card--pad-sm"
          variants={CARD_REVEAL_VARIANTS}
        >
          <div className="lexicon-word-row__main">
            <span className="lexicon-word-row__word">{word.word}</span>
            <span className="lexicon-word-row__definition">
              {word.definition}
            </span>
          </div>
          <div className="lexicon-word-row__meta">
            {word.usage_count > 0 && (
              <span className="lexicon-word-row__uses">
                {word.usage_count}×
              </span>
            )}
            {word.cognitive_xp > 0 && (
              <span className="lexicon-word-row__xp">
                {word.cognitive_xp} XP
              </span>
            )}
            <span className="lexicon-word-row__date">
              {word.last_used_at
                ? relativeTime(word.last_used_at)
                : relativeTime(word.created_at)
              }
            </span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
