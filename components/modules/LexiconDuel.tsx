'use client'
import {
  useState,
  useCallback,
  useRef,
  type KeyboardEvent,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNexusStore }            from '@/store/nexusStore'
import { useEvaluateDuel, useWordsDueForPractice } from '@/hooks/useLexicon'
import { useLexiconAmbient }        from '@/hooks/useAmbientAI'
import { buildLexiconContext }       from '@/lib/contextBuilders'
import { OdometerNumber } from '@/components/ui'
import { SPRING }                   from '@/lib/motion'
import type { LexiconWord, EvaluationResult } from '@/hooks/useLexicon'

// ─── Types ────────────────────────────────────────────────────────────────────

type DuelPhase =
  | 'selecting'     // Choosing a word to duel with
  | 'writing'       // Composing sentence
  | 'judging'       // Waiting for evaluation
  | 'revealed'      // Result shown
  | 'complete'      // Session complete

// ─── Component ────────────────────────────────────────────────────────────────

export function LexiconDuel() {
  const mode    = useNexusStore(state => state.mode)

  const [phase,        setPhase]        = useState<DuelPhase>('selecting')
  const [activeWord,   setActiveWord]   = useState<LexiconWord | null>(null)
  const [sentence,     setSentence]     = useState('')
  const [result,       setResult]       = useState<EvaluationResult | null>(null)
  const [sessionXP,    setSessionXP]    = useState(0)
  const [duelsCount,   setDuelsCount]   = useState(0)
  const [error,        setError]        = useState<string | null>(null)

  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ─── Mutations ───────────────────────────────────────────────────────────
  const { mutateAsync: evaluate, isPending: isJudging } = useEvaluateDuel()

  // ─── Ambient AI ──────────────────────────────────────────────────────────
  const lexiconAmbient = useLexiconAmbient()

  // ─── Word selection ───────────────────────────────────────────────────────

  const selectWord = useCallback((word: LexiconWord) => {
    setActiveWord(word)
    setSentence('')
    setResult(null)
    setError(null)
    setPhase('writing')
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  // ─── Submit sentence ──────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!activeWord || !sentence.trim() || isJudging) return

    setPhase('judging')
    setError(null)

    try {
      const evalResult = await evaluate({
        word:     activeWord.word,
        sentence: sentence.trim(),
      })

      setResult(evalResult)
      setSessionXP(prev => prev + evalResult.xp_awarded)
      setDuelsCount(prev => prev + 1)
      setPhase('revealed')

      // Trigger ambient AI after result
      const ctx = buildLexiconContext({
        word:       activeWord.word,
        definition: activeWord.definition,
        sentence:   sentence.trim(),
        verdict:    evalResult.verdict,
        score:      evalResult.score,
        xpAwarded:  evalResult.xp_awarded,
        mode,
      })
      lexiconAmbient.trigger(ctx)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation failed')
      setPhase('writing')
    }
  }, [activeWord, sentence, isJudging, evaluate, lexiconAmbient, mode])

  // ─── Keyboard ─────────────────────────────────────────────────────────────

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    const isCmdOrCtrl = e.metaKey || e.ctrlKey
    if (isCmdOrCtrl && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  // ─── Next duel ────────────────────────────────────────────────────────────

  const handleNext = useCallback(() => {
    setActiveWord(null)
    setResult(null)
    setSentence('')
    setPhase('selecting')
  }, [])

  return (
    <div className="lexicon-duel">

      {/* ─── Session stats ───────────────────────────────────────────────── */}
      {duelsCount > 0 && (
        <div className="duel-session-stats">
          <div className="duel-session-stat">
            <span className="duel-session-stat__label">DUELS</span>
            <OdometerNumber
              value={duelsCount}
              className="duel-session-stat__value"
            />
          </div>
          <div className="duel-session-stat">
            <span className="duel-session-stat__label">SESSION XP</span>
            <div className="duel-session-stat__value duel-session-stat__value--xp">
              +<OdometerNumber value={sessionXP} />
            </div>
          </div>
        </div>
      )}

      {/* ─── Phase: Word selection ───────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {phase === 'selecting' && (
          <motion.div
            key="selecting"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <DuelWordSelector onSelect={selectWord} />
          </motion.div>
        )}

        {/* ─── Phase: Writing ──────────────────────────────────────────── */}
        {(phase === 'writing' || phase === 'judging') && activeWord && (
          <motion.div
            key="writing"
            className="duel-writing-phase"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Active word card */}
            <DuelWordCard word={activeWord} />

            {/* Sentence input */}
            <div className="duel-input-zone">
              <label className="duel-input-label">
                USE IT IN A SENTENCE
              </label>
              <textarea
                ref={inputRef}
                value={sentence}
                onChange={e => setSentence(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  mode === 'apex'
                    ? 'Construct the sentence precisely.'
                    : 'Let the word find its place.'
                }
                className="duel-textarea"
                disabled={phase === 'judging'}
                rows={3}
                aria-label="Your sentence"
              />

              <div className="duel-input-actions">
                <button
                  className="duel-cancel-btn"
                  onClick={handleNext}
                  disabled={phase === 'judging'}
                >
                  CANCEL
                </button>
                <motion.button
                  className={`duel-submit-btn ${
                    !sentence.trim() || phase === 'judging'
                      ? 'duel-submit-btn--disabled'
                      : ''
                  }`}
                  onClick={handleSubmit}
                  disabled={!sentence.trim() || phase === 'judging'}
                  {...(sentence.trim() ? { whileTap: { scale: 0.96 } } : {})}
                  transition={SPRING.SNAP}
                >
                  {phase === 'judging' ? 'JUDGING...' : 'SUBMIT'}
                </motion.button>
              </div>

              {error && (
                <div className="duel-error">{error}</div>
              )}
            </div>
          </motion.div>
        )}

        {/* ─── Phase: Revealed ─────────────────────────────────────────── */}
        {phase === 'revealed' && result && activeWord && (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{    opacity: 0              }}
            transition={SPRING.DEFAULT}
          >
            <DuelResult
              result={result}
              sentence={sentence}
              onNext={handleNext}
              mode={mode}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Ambient AI insight ──────────────────────────────────────────── */}
      {phase === 'revealed' && (
        <div className="duel-ambient">
          <div className="ambient-intel ambient-intel--block">
            {lexiconAmbient.insight && (
              <>
                <span className="ambient-intel__dot" />
                <span className="ambient-intel__text">
                  {lexiconAmbient.insight}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Word selector — pick from lexicon ───────────────────────────────────────

function DuelWordSelector({
  onSelect,
}: {
  onSelect: (word: LexiconWord) => void
}) {
  const words = useWordsDueForPractice(12)
  const isLoading = words.length === 0

  if (isLoading) {
    return (
      <div className="duel-selector">
        <span className="duel-selector__hint text-label">LOADING LEXICON...</span>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="duel-selector duel-selector--empty">
        <span className="duel-selector__empty-label">LEXICON EMPTY</span>
        <span className="duel-selector__empty-sub">
          Add words before dueling.
        </span>
      </div>
    )
  }

  return (
    <div className="duel-selector">
      <span className="duel-selector__hint text-label">
        SELECT A WORD TO DUEL
      </span>
      <div className="duel-word-grid">
        {words.map(word => (
          <motion.button
            key={word.id}
            className="duel-word-chip"
            onClick={() => onSelect(word)}
            whileHover={{ scale: 1.02 }}
            whileTap={{   scale: 0.97 }}
            transition={SPRING.SNAP}
          >
            <span className="duel-word-chip__word">{word.word}</span>
            {word.usage_count > 0 && (
              <span className="duel-word-chip__count">
                {word.usage_count}×
              </span>
            )}
            {word.cognitive_xp > 0 && (
              <span className="duel-word-chip__xp">
                {word.cognitive_xp}xp
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ─── Active word card ─────────────────────────────────────────────────────────

function DuelWordCard({ word }: { word: LexiconWord }) {
  return (
    <div className="duel-word-card card card--pad-md">
      <div className="duel-word-card__header">
        <span className="duel-word-card__word">{word.word}</span>
        {word.usage_count > 0 && (
          <span className="duel-word-card__history">
            {word.usage_count} PRIOR USE{word.usage_count > 1 ? 'S' : ''}
          </span>
        )}
      </div>
      <p className="duel-word-card__definition">{word.definition}</p>
      {word.usage_example && (
        <p className="duel-word-card__example">"{word.usage_example}"</p>
      )}
    </div>
  )
}

// ─── Result reveal ────────────────────────────────────────────────────────────

function DuelResult({
  result,
  sentence,
  onNext,
  mode,
}: {
  result:   EvaluationResult
  sentence: string
  onNext:   () => void
  mode:     'apex' | 'haven'
}) {
  const verdictConfig = {
    correct: {
      label:      'CORRECT',
      color:      'var(--color-success)',
      borderColor: 'rgba(74,222,128,0.25)',
    },
    partial: {
      label:      'PARTIAL',
      color:      'var(--color-warning)',
      borderColor: 'rgba(245,158,11,0.25)',
    },
    incorrect: {
      label:      'INCORRECT',
      color:      'var(--color-error)',
      borderColor: 'rgba(255,68,68,0.25)',
    },
  }

  const cfg = verdictConfig[result.verdict]

  return (
    <div className="duel-result">

      {/* Verdict badge */}
      <motion.div
        className="duel-verdict"
        style={{ borderColor: cfg.borderColor }}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={SPRING.SNAP}
      >
        <span
          className="duel-verdict__label"
          style={{ color: cfg.color }}
        >
          {cfg.label}
        </span>
        <span className="duel-verdict__score">
          {result.score}/100
        </span>
      </motion.div>

      {/* XP award */}
      {result.xp_awarded > 0 && (
        <motion.div
          className="duel-xp-award"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.SNAP, delay: 0.15 }}
        >
          <span className="duel-xp-award__label">XP EARNED</span>
          <div className="duel-xp-award__value">
            +<OdometerNumber value={result.xp_awarded} />
          </div>
        </motion.div>
      )}

      {/* Submitted sentence */}
      <motion.div
        className="duel-submitted-sentence"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <span className="duel-submitted-sentence__label">YOUR SENTENCE</span>
        <p className="duel-submitted-sentence__text">{sentence}</p>
      </motion.div>

      {/* Judge reasoning */}
      <motion.div
        className="duel-reasoning"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="duel-reasoning__label">JUDGE</span>
        <p className={`duel-reasoning__text duel-reasoning__text--${mode}`}>
          {result.reasoning}
        </p>
      </motion.div>

      {/* Next duel */}
      <motion.button
        className="duel-next-btn"
        onClick={onNext}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.2 }}
        whileTap={{ scale: 0.96 }}
      >
        NEXT WORD →
      </motion.button>
    </div>
  )
}
