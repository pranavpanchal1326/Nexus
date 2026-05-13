'use client'
import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNexusStore }            from '@/store/nexusStore'
import { useCreateJournalEntry }    from '@/hooks/useJournal'
import { useJournalAmbient }        from '@/hooks/useAmbientAI'
import { JournalAmbientIntel }      from './AmbientIntel'
import { ModeIndicator }            from '@/components/ui'
import { SPRING }                   from '@/lib/motion'

// ─── Types ────────────────────────────────────────────────────────────────────

type ListeningState = 'idle' | 'writing' | 'listening' | 'saved'

// ─── Component ────────────────────────────────────────────────────────────────

export function JournalEditor() {
  const mode    = useNexusStore(state => state.mode)
  const isApex  = mode === 'apex'

  const [content,        setContent]        = useState('')
  const [listeningState, setListeningState] = useState<ListeningState>('idle')
  const [wordCount,      setWordCount]       = useState(0)
  const [isSaving,       setIsSaving]        = useState(false)
  const [saveError,      setSaveError]       = useState<string | null>(null)
  const [savedCount,     setSavedCount]      = useState(0)

  const textareaRef     = useRef<HTMLTextAreaElement>(null)
  const pauseTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef    = useRef<string>('')

  // ─── Mutations ───────────────────────────────────────────────────────────

  const { mutateAsync: createEntry } = useCreateJournalEntry()

  // ─── Ambient AI ──────────────────────────────────────────────────────────

  const { insight, clear: clearInsight } = useJournalAmbient(content)

  // ─── Content change handler ───────────────────────────────────────────────

  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setContent(val)

    const words = val.trim().split(/\s+/).filter(Boolean).length
    setWordCount(words)

    // Update listening state
    if (val.length > 0) {
      setListeningState('writing')
    } else {
      setListeningState('idle')
    }

    // Clear and restart pause timer
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)

    if (val.length >= 50) {
      pauseTimerRef.current = setTimeout(() => {
        setListeningState('listening')
      }, 3000)
    }
  }, [])

  // ─── Save handler ────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    const trimmed = content.trim()
    if (!trimmed)                        return
    if (trimmed === lastSavedRef.current) return   // Nothing new to save
    if (isSaving)                        return

    setIsSaving(true)
    setSaveError(null)

    try {
      await createEntry(trimmed)
      lastSavedRef.current = trimmed
      setSavedCount(prev => prev + 1)
      setListeningState('saved')
      clearInsight()

      // Return to idle after 2s
      setTimeout(() => {
        setListeningState(content.trim() ? 'writing' : 'idle')
      }, 2000)

    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }, [content, isSaving, createEntry, clearInsight])

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    const isCmdOrCtrl = e.metaKey || e.ctrlKey
    if (isCmdOrCtrl && e.key === 's') {
      e.preventDefault()
      handleSave()
    }
    if (isCmdOrCtrl && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
  }, [handleSave])

  // ─── Auto-resize textarea ────────────────────────────────────────────────

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [content])

  // ─── Cleanup ─────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    }
  }, [])

  // ─── Focus on mount ───────────────────────────────────────────────────────

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // ─── Cursor color — changes after 3s pause ───────────────────────────────

  const cursorColor = listeningState === 'listening'
    ? 'var(--color-signal)'      // AI listening — signal yellow cursor
    : 'var(--color-text-primary)'  // Default — white cursor

  const placeholderText = isApex
    ? 'Write. The Commander is watching.'
    : 'Begin. The Poet is present.'

  return (
    <div className="journal-editor">

      {/* ─── Editor header ──────────────────────────────────────────────── */}
      <JournalEditorHeader
        listeningState={listeningState}
        wordCount={wordCount}
        savedCount={savedCount}
        isSaving={isSaving}
        mode={mode}
        onSave={handleSave}
        canSave={content.trim().length > 0 && content.trim() !== lastSavedRef.current}
      />

      {/* ─── Listening state indicator ──────────────────────────────────── */}
      <AnimatePresence>
        {listeningState === 'listening' && (
          <motion.div
            className="journal-listening-indicator"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="journal-listening-dot" />
            <span className="journal-listening-label">
              {isApex ? 'COMMANDER READING' : 'POET PRESENT'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Main textarea ──────────────────────────────────────────────── */}
      <div className="journal-editor__body">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          className={`journal-textarea journal-textarea--${mode}`}
          style={{
            caretColor: cursorColor,
          }}
          aria-label="Journal entry"
          spellCheck={true}
        />

        {/* ─── Ambient AI insight — below cursor ────────────────────────── */}
        <JournalAmbientIntel
          insight={insight}
          onFaded={clearInsight}
        />
      </div>

      {/* ─── Save error — static ────────────────────────────────────────── */}
      {saveError && (
        <div className="journal-error">
          {saveError}
        </div>
      )}

      {/* ─── Footer hints ───────────────────────────────────────────────── */}
      <div className="journal-hints">
        <span>⌘S or ⌘↵ to save</span>
        <span>{wordCount} words</span>
      </div>
    </div>
  )
}

// ─── Editor header sub-component ──────────────────────────────────────────────

function JournalEditorHeader({
  listeningState,
  wordCount,
  savedCount,
  isSaving,
  mode,
  onSave,
  canSave,
}: {
  listeningState: ListeningState
  wordCount:      number
  savedCount:     number
  isSaving:       boolean
  mode:           'apex' | 'haven'
  onSave:         () => void
  canSave:        boolean
}) {
  return (
    <div className="journal-editor__header">
      <div className="journal-editor__header-left">
        <ModeIndicator mode={mode} size="sm" />
        <AnimatePresence mode="wait">
          {listeningState === 'saved' && (
            <motion.span
              key="saved"
              className="journal-saved-indicator"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{    opacity: 0      }}
              transition={{ duration: 0.2 }}
            >
              {savedCount > 1 ? `SAVED × ${savedCount}` : 'SAVED'}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="journal-editor__header-right">
        {wordCount > 0 && (
          <span className="journal-word-count">{wordCount}w</span>
        )}
        <motion.button
          className={`journal-save-btn ${!canSave || isSaving ? 'journal-save-btn--disabled' : ''}`}
          onClick={onSave}
          disabled={!canSave || isSaving}
          {...(canSave ? { whileTap: { scale: 0.96 } } : {})}
          transition={SPRING.SNAP}
        >
          {isSaving ? '...' : 'SAVE'}
        </motion.button>
      </div>
    </div>
  )
}
