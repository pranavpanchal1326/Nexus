'use client'
import { useState }            from 'react'
import { motion }              from 'framer-motion'
import { useGymLogs }          from '@/hooks/useGym'
import { relativeTime }        from '@/lib/utils'
import { EmptyState, CardSkeleton } from '@/components/ui'
import { STAGGER_CONTAINER_VARIANTS, CARD_REVEAL_VARIANTS } from '@/lib/motion'
import type { GymLog }         from '@/hooks/useGym'

export function GymHistory() {
  const [selectedExercise, setSelectedExercise] = useState<string | undefined>()
  const { data, isLoading }  = useGymLogs(selectedExercise, 50)
  const logs                 = data?.logs ?? []

  // Group logs by exercise for display
  const byExercise = logs.reduce<Record<string, GymLog[]>>((acc, log) => {
    if (!acc[log.exercise]) acc[log.exercise] = []
    acc[log.exercise]!.push(log)
    return acc
  }, {})

  const exercises = Object.keys(byExercise)

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: 3 }, (_, i) => <CardSkeleton key={i} />)}
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        module="gym"
        action={
          <span className="text-caption">
            Log your first set above
          </span>
        }
      />
    )
  }

  return (
    <div className="gym-history">

      {/* Exercise filter pills */}
      {exercises.length > 1 && (
        <div className="gym-history__filters">
          <button
            className={`gym-filter-pill ${!selectedExercise ? 'gym-filter-pill--active' : ''}`}
            onClick={() => setSelectedExercise(undefined)}
          >
            ALL
          </button>
          {exercises.map(ex => (
            <button
              key={ex}
              className={`gym-filter-pill ${selectedExercise === ex ? 'gym-filter-pill--active' : ''}`}
              onClick={() => setSelectedExercise(ex === selectedExercise ? undefined : ex)}
            >
              {ex.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Log entries */}
      <motion.div
        className="gym-history__list"
        variants={STAGGER_CONTAINER_VARIANTS}
        initial="hidden"
        animate="visible"
      >
        {logs.map(log => (
          <motion.div
            key={log.id}
            variants={CARD_REVEAL_VARIANTS}
            className="gym-history-entry card card--pad-sm"
          >
            <div className="gym-history-entry__row">
              <span className="gym-history-entry__exercise">
                {log.exercise}
              </span>
              <span className="gym-history-entry__numbers">
                {log.sets}×{log.reps}
                {log.weight !== null && ` @ ${log.weight}${log.unit}`}
              </span>
            </div>

            <div className="gym-history-entry__meta">
              <span className="gym-history-entry__date">
                {relativeTime(log.created_at)}
              </span>
              {log.volume_delta !== null && (
                <span
                  className="gym-history-entry__delta"
                  style={{
                    color: log.volume_delta > 0
                      ? 'var(--color-success)'
                      : log.volume_delta < 0
                      ? 'var(--color-error)'
                      : 'var(--color-text-disabled)',
                  }}
                >
                  {log.volume_delta > 0 ? '+' : ''}{log.volume_delta}{log.unit}
                </span>
              )}
            </div>

            {log.notes && (
              <span className="gym-history-entry__notes">{log.notes}</span>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
