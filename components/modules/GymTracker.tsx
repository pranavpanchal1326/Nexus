'use client'
import {
  useState,
  useCallback,
  type FormEvent,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNexusStore }            from '@/store/nexusStore'
import { useLogGymSet, useExerciseList } from '@/hooks/useGym'
import { useGymAmbient }            from '@/hooks/useAmbientAI'
import { GymAmbientIntel }          from './AmbientIntel'
import { buildGymContext }           from '@/lib/contextBuilders'
import { ModeIndicator }            from '@/components/ui'
import { SPRING }                   from '@/lib/motion'

// ─── Types ────────────────────────────────────────────────────────────────────

type WeightUnit = 'kg' | 'lbs'

interface GymSetPayload {
  exercise: string
  sets:     number
  reps:     number
  unit:     WeightUnit
  weight?:  number
  notes?:   string
}

interface GymContextPayload {
  exercise:       string
  sets:           number
  reps:           number
  unit:           WeightUnit
  currentVolume:  number
  mode:           'apex' | 'haven'
  weight?:        number
  previousVolume?: number
}

interface SessionSet {
  id:          string
  exercise:    string
  sets:        number
  reps:        number
  weight:      number | null
  unit:        WeightUnit
  ai_insight:  string | null
  volume:      number
  volumeDelta: number | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GymTracker() {
  const mode   = useNexusStore(state => state.mode)

  // ─── Form state ───────────────────────────────────────────────────────────
  const [exercise,   setExercise]   = useState('')
  const [sets,       setSets]       = useState('3')
  const [reps,       setReps]       = useState('8')
  const [weight,     setWeight]     = useState('')
  const [unit,       setUnit]       = useState<WeightUnit>('kg')
  const [notes,      setNotes]      = useState('')
  const [showNotes,  setShowNotes]  = useState(false)

  // ─── Session tracking ─────────────────────────────────────────────────────
  const [sessionSets, setSessionSets] = useState<SessionSet[]>([])
  const [lastInsight, setLastInsight] = useState<string | null>(null)

  // ─── Autocomplete ─────────────────────────────────────────────────────────
  const exercises          = useExerciseList()
  const [showSuggestions,  setShowSuggestions]  = useState(false)
  const filteredExercises  = exercise.length >= 1
    ? exercises.filter(e =>
        e.toLowerCase().includes(exercise.toLowerCase()) && e !== exercise
      )
    : []

  // ─── Mutation ─────────────────────────────────────────────────────────────
  const { mutateAsync: logSet, isPending } = useLogGymSet()

  // ─── Ambient AI ───────────────────────────────────────────────────────────
  const gymAmbient = useGymAmbient()

  // ─── Submit handler ───────────────────────────────────────────────────────

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault()

    const exerciseTrimmed = exercise.trim()
    if (!exerciseTrimmed) return
    const setsNum  = Math.max(1, parseInt(sets)  || 1)
    const repsNum  = Math.max(1, parseInt(reps)  || 1)
    const weightNum = weight ? parseFloat(weight) : undefined

    try {
      const payload: GymSetPayload = {
        exercise: exerciseTrimmed,
        sets:     setsNum,
        reps:     repsNum,
        unit,
      }
      if (weightNum !== undefined) payload.weight = weightNum
      if (notes.trim()) payload.notes = notes.trim()

      const result = await logSet(payload)

      // Add to session view
      const newSet: SessionSet = {
        id:          result.log.id,
        exercise:    exerciseTrimmed,
        sets:        setsNum,
        reps:        repsNum,
        weight:      weightNum ?? null,
        unit,
        ai_insight:  result.ai_insight,
        volume:      result.current_volume,
        volumeDelta: result.volume_delta,
      }
      setSessionSets(prev => [newSet, ...prev])

      // Trigger ambient AI
      if (result.ai_insight) {
        setLastInsight(result.ai_insight)
      } else {
        const ctxPayload: GymContextPayload = {
          exercise:        exerciseTrimmed,
          sets:            setsNum,
          reps:            repsNum,
          unit,
          currentVolume:   result.current_volume,
          mode:            mode as 'apex' | 'haven',
        }
        if (weightNum !== undefined) ctxPayload.weight = weightNum
        if (result.previous_volume !== null) ctxPayload.previousVolume = result.previous_volume

        const ctx = buildGymContext(ctxPayload)
        gymAmbient.trigger(ctx)
      }

      // Reset form — keep exercise for quick repeated logging
      setSets('3')
      setReps('8')
      setWeight('')
      setNotes('')
      setShowNotes(false)

    } catch {
      // Error handled by mutation — no local state needed
    }
  }, [
    exercise, sets, reps, weight, unit, notes,
    logSet, gymAmbient, mode,
  ])

  return (
    <div className="gym-tracker">

      {/* ─── Session header ─────────────────────────────────────────────── */}
      <div className="gym-tracker__header">
        <span className="gym-tracker__title text-label">
          {sessionSets.length > 0
            ? `${sessionSets.length} SET${sessionSets.length > 1 ? 'S' : ''} THIS SESSION`
            : 'LOG A SET'}
        </span>
        <ModeIndicator mode={mode} size="sm" />
      </div>

      {/* ─── Entry form ─────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="gym-form"
      >
        {/* Exercise input with autocomplete */}
        <div className="gym-form__exercise-wrapper">
          <input
            type="text"
            value={exercise}
            onChange={e => {
              setExercise(e.target.value)
              setShowSuggestions(true)
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Exercise"
            className="gym-input gym-input--exercise"
            aria-label="Exercise name"
            autoComplete="off"
            required
          />

          {/* Autocomplete dropdown */}
          <AnimatePresence>
            {showSuggestions && filteredExercises.length > 0 && (
              <motion.div
                className="gym-autocomplete"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{    opacity: 0, y: -4 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                {filteredExercises.slice(0, 6).map(ex => (
                  <button
                    key={ex}
                    type="button"
                    className="gym-autocomplete__item"
                    onMouseDown={() => {
                      setExercise(ex)
                      setShowSuggestions(false)
                    }}
                  >
                    {ex}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sets × Reps × Weight row */}
        <div className="gym-form__numbers">
          <div className="gym-form__field">
            <label className="gym-form__label">SETS</label>
            <input
              type="number"
              value={sets}
              onChange={e => setSets(e.target.value)}
              min="1"
              max="100"
              className="gym-input gym-input--number"
              aria-label="Sets"
            />
          </div>

          <span className="gym-form__times">×</span>

          <div className="gym-form__field">
            <label className="gym-form__label">REPS</label>
            <input
              type="number"
              value={reps}
              onChange={e => setReps(e.target.value)}
              min="1"
              max="1000"
              className="gym-input gym-input--number"
              aria-label="Reps"
            />
          </div>

          <span className="gym-form__times">@</span>

          <div className="gym-form__field gym-form__field--weight">
            <label className="gym-form__label">WEIGHT</label>
            <div className="gym-weight-input">
              <input
                type="number"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                min="0"
                step="0.5"
                placeholder="—"
                className="gym-input gym-input--weight"
                aria-label="Weight"
              />
              <button
                type="button"
                className="gym-unit-toggle"
                onClick={() => setUnit(u => u === 'kg' ? 'lbs' : 'kg')}
                aria-label={`Switch to ${unit === 'kg' ? 'lbs' : 'kg'}`}
              >
                {unit}
              </button>
            </div>
          </div>
        </div>

        {/* Notes toggle */}
        <div className="gym-form__actions">
          <button
            type="button"
            className="gym-notes-toggle"
            onClick={() => setShowNotes(v => !v)}
          >
            {showNotes ? '— NOTES' : '+ NOTES'}
          </button>

          <button
            type="submit"
            disabled={!exercise.trim() || isPending}
            className={`gym-submit ${!exercise.trim() || isPending ? 'gym-submit--disabled' : ''}`}
          >
            {isPending ? '...' : 'LOG SET'}
          </button>
        </div>

        {/* Notes textarea */}
        <AnimatePresence>
          {showNotes && (
            <motion.textarea
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 64 }}
              exit={{    opacity: 0, height: 0 }}
              transition={SPRING.DEFAULT}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes..."
              className="gym-notes-field"
              aria-label="Set notes"
            />
          )}
        </AnimatePresence>
      </form>

      {/* ─── Ambient AI — appears after logging ─────────────────────────── */}
      <GymAmbientIntel
        insight={lastInsight ?? gymAmbient.insight}
        onFaded={() => setLastInsight(null)}
      />

      {/* ─── Session sets ────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {sessionSets.length > 0 && (
          <motion.div
            className="gym-session"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="gym-session__title text-label">
              THIS SESSION
            </span>
            <div className="gym-session__list">
              {sessionSets.map(set => (
                <GymSetRow key={set.id} set={set} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Individual set row ───────────────────────────────────────────────────────

function GymSetRow({ set }: { set: SessionSet }) {
  const volumeSign  = (set.volumeDelta ?? 0) >= 0 ? '+' : ''
  const deltaColor  = (set.volumeDelta ?? 0) > 0
    ? 'var(--color-success)'
    : (set.volumeDelta ?? 0) < 0
    ? 'var(--color-error)'
    : 'var(--color-text-disabled)'

  return (
    <motion.div
      className="gym-set-row"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="gym-set-row__main">
        {/* Exercise */}
        <span className="gym-set-row__exercise">{set.exercise}</span>

        {/* Numbers */}
        <span className="gym-set-row__numbers">
          {set.sets}×{set.reps}
          {set.weight !== null && ` @ ${set.weight}${set.unit}`}
        </span>

        {/* Volume delta */}
        {set.volumeDelta !== null && (
          <span
            className="gym-set-row__delta"
            style={{ color: deltaColor }}
          >
            {volumeSign}{set.volumeDelta}{set.unit}
          </span>
        )}
      </div>

      {/* AI insight beside entry */}
      {set.ai_insight && (
        <div className="gym-set-row__insight">
          <span className="gym-set-row__insight-dot" aria-hidden="true" />
          <span className="gym-set-row__insight-text">{set.ai_insight}</span>
        </div>
      )}
    </motion.div>
  )
}
